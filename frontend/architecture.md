# Architecture

```
Postes physiques (une carte par acte)
        │ MQTT
        ▼
Broker MQTT (Mosquitto, sur le Raspberry Pi)
        │
        ▼
Backend Node.js (logique de jeu)
   ├── API REST  ──► Frontend React (sessions, scores)
   └── WebSocket ──► Frontend React (jauge, logs, mails)
        │
        ▼
PostgreSQL
```

## Organisation du dépôt

| Dossier | Contenu |
|---|---|
| `backend/` | Node.js + Express : réception MQTT, machines à états par acte, jauge, API REST, WebSocket |
| `frontend/` | React + Vite : écran de jeu (jauge, chrono, progression par acte, logs et mails, classement), voir `frontend/README.md` |
| `database/` | Scripts SQL de création des tables |
| `iot/` | Programmes Arduino, un dossier par poste |
| `simulator/` | Faux capteurs pour tester sans matériel (et mode de secours pour la JPO) |
| `mosquitto/` | Configuration du broker MQTT |
| `docs/` | GDD, contrat MQTT, architecture, matériel, installation |
| `CRA/` | Comptes-rendus d'activité hebdomadaires |

## Base de données

Scripts dans `database/migrations/`, exécutés au premier démarrage du conteneur postgres (pour repartir de zéro : `docker compose down -v`).

```
session 1──* enigme
session 1──* evenement *──1 capteur (optionnel)
session 1──* fragment_code
session 1──1 score
```

- `capteur` : un par topic MQTT, rempli par `002_capteurs.sql` (à tenir à jour avec `docs/mqtt.md`). Garde la dernière valeur reçue.
- `evenement` : journal horodaté ; chaque message de capteur valide reçu pendant une partie y est ajouté.
- Une seule session `en_cours` à la fois (index unique), car les messages MQTT ne portent pas d'identifiant de session.
- Accès SQL dans `backend/src/db/` (un fichier par table), routes REST dans `backend/src/routes/` : `POST /api/sessions`, `GET /api/sessions/:id`, `GET /api/sessions/:id/evenements`, `POST /api/sessions/:id/terminer`, `GET /api/scores`.

## Frontend

Le frontend est une application React (Vite) qui sert d'écran de jeu : la jauge, le chrono, la progression des 4 actes, les logs et mails débloqués, et le classement.

- **Une seule source de vérité** : tout l'état de la partie vit dans le backend et la base. Le frontend n'en garde aucun état de jeu, il l'affiche (`frontend/src/state/reducer.js`).
- **Contrat WebSocket** : `docs/websocket.md`. Le serveur envoie un instantané `etat` à chaque connexion, puis des mises à jour. Après une coupure, la reconnexion automatique (délai doublé, plafonné à 10 s) suffit à retrouver l'écran à jour.
- **Logique pure séparée de l'affichage** : réducteur, chrono, niveaux de jauge et mise en forme des documents sont des fonctions pures (`state/`, `lib/`), testées avec `node --test` sans navigateur ni dépendance de test supplémentaire.
- **Contenu narratif côté frontend** : le backend envoie l'identifiant d'un document et la valeur du fragment ; le texte est dans `frontend/src/contenu/narratif.js`.

## Choix techniques

**MQTT entre les cartes et le backend.** Les postes sont de petits microcontrôleurs sur WiFi, parfois coupés ou redémarrés. MQTT est léger, gère nativement la reconnexion et le Last Will (le broker signale seul qu'un poste est tombé), et découple les cartes du backend : on peut changer ou ajouter un poste sans toucher au serveur. Le contrat des topics est dans `docs/mqtt.md`.

**REST pour les actions, WebSocket pour le direct.** Démarrer une partie ou lire le classement sont des échanges ponctuels : une requête REST suffit, elle est simple à tester et à déboguer. La jauge, les documents débloqués et l'état des postes doivent apparaître sans que le joueur ne recharge la page : le serveur doit pouvoir pousser l'information, ce que le REST seul ne permet pas sans interroger le serveur en boucle (polling). Le canal WebSocket est volontairement à sens unique : le frontend ne peut pas tricher en envoyant des états de jeu.

**Un instantané complet à chaque connexion.** Plutôt que de rejouer l'historique des événements, le serveur envoie l'état courant. Le frontend est ainsi robuste aux coupures WiFi du réseau de la JPO et aux rechargements de page.

**PostgreSQL.** Le modèle (session, énigme, capteur, événement, fragment de code, score) est relationnel avec des contraintes d'intégrité (une seule session en cours, un score par session). Les valeurs libres (dernière valeur d'un capteur, données d'un événement) sont stockées en JSONB.

**Node.js partout côté logiciel.** Backend et frontend en JavaScript : un seul langage pour toute l'équipe, et les messages JSON circulent sans conversion de la carte jusqu'à l'écran.

**React + Vite.** React convient à un écran qui se met à jour en continu à partir d'un état ; Vite offre un serveur de développement immédiat et un proxy vers le backend, donc pas de configuration CORS.

**Docker Compose.** La base et le broker démarrent avec les mêmes versions et la même configuration sur chaque poste de l'équipe et sur le Raspberry Pi.
