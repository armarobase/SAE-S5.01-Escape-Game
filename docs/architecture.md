# Architecture

```
Postes physiques (une carte Arduino par acte)
        │ MQTT (capteurs → backend, ordres backend → LED / bargraph / LCD)
        ▼
Broker MQTT (Mosquitto, sur le Raspberry Pi)
        │
        ▼
Backend Node.js (logique de jeu)
   ├── API REST          ──► Frontend React (démarrer une partie, sessions, scores)
   └── WebSocket (/ws)   ──► Écran(s) de jeu (état de la partie, jauge, documents, postes)
        │
        ▼
PostgreSQL
```

Tout fonctionne en réseau local, sans internet. Les contrats d'échange font référence :

- **MQTT** (postes ↔ backend) : `docs/mqtt.md`
- **WebSocket** (backend → écran) : `frontend/websocket.md`

## Principes

- **Les cartes envoient des faits bruts, le backend décide.** Une carte publie ce qu'elle mesure (appui, valeur du slider, présence) ; le backend juge si une énigme est résolue et commande les LED. Les seuils se règlent côté serveur, sans reprogrammer les cartes.
- **La logique de jeu est pure.** `backend/src/game/session.js` et les actes (`game/actes/`) ne connaissent ni MQTT, ni la base, ni le WebSocket. Ils reçoivent un message et renvoient une liste d'**effets** (`led`, `jauge`, `enigme`, `fragment`, `etat_jeu`, `fin`, `ignore`). On peut donc les tester sans broker ni base (`npm test`).
- **La couche de liaison applique les effets.** `game/moteur.js` fait avancer le temps (un tick par seconde), transmet les messages des capteurs à la session, puis traduit chaque lot d'effets : d'abord en ordres MQTT et en écritures en base, ensuite en messages pour les écrans. Cet ordre garantit par exemple que le score est enregistré avant que l'écran affiche la fin de partie.
- **Toutes les valeurs de game design sont dans `backend/src/game/config.js`** (durée, jauge, seuils, badges, fragments, déblocage des documents), en attendant leur validation par l'équipe.

## Parcours d'un message de capteur

1. `mqtt/client.js` reçoit le message (abonnement à `datamonstre/#`) et décode le JSON.
2. `mqtt/validation.js` vérifie le topic et la valeur selon le contrat (type, limites, champ `valeur`). Un message refusé est ignoré et journalisé avec la raison ; les ordres publiés par le backend lui-même sont ignorés sans bruit.
3. `mqtt/persistance.js` enregistre la dernière valeur du capteur et, pendant une partie, un événement dans le journal.
4. `game/moteur.js` mémorise le statut des postes, ou transmet le message de capteur à la session.
5. `game/session.js` le passe à l'acte en cours (`game/actes/acte1.js`...), qui renvoie ses effets.
6. `game/moteur.js` applique les effets : `mqtt/actionneurs.js` (LED, bargraph, état du jeu), `db/` (énigmes, jauge, fragments, score), puis `websocket/` (écrans).

## Écrans de jeu (WebSocket)

- Adresse : `ws://<hôte>:3000/ws`, sur le même port que l'API. Bibliothèque `ws`, compatible avec le WebSocket natif du navigateur.
- À chaque connexion, l'écran reçoit un `etat` complet : un écran rechargé en pleine partie se remet à jour tout seul. Plusieurs écrans peuvent être connectés (diffusion à tous).
- Ensuite : un nouvel `etat` à chaque changement de structure (énigme, acte, fin), `jauge` quand sa valeur entière change, `narratif` quand un document est débloqué, `postes` quand un poste se connecte ou se déconnecte.
- Le chrono n'est pas envoyé chaque seconde : l'écran le calcule à partir de `debutLe`, `dureeLimiteS` et `serveurMs`.
- Canal à sens unique : les messages envoyés par un écran sont ignorés. Démarrer une partie passe par l'API REST.

## Rôle des fichiers de `backend/src`

| Fichier | Rôle |
|---|---|
| `index.js` | Point d'entrée : serveur HTTP (Express), routes, WebSocket, connexion MQTT, moteur de jeu |
| `config/index.js` | Lecture du `.env` (port, MQTT, base de données) |
| `mqtt/client.js` | Connexion authentifiée au broker (client `backend`), abonnement, décodage JSON |
| `mqtt/validation.js` | Règles de validation des messages reçus, topic par topic |
| `mqtt/persistance.js` | Dernière valeur de chaque capteur et journal des messages en base |
| `mqtt/actionneurs.js` | Ordres aux postes : LED, bargraph, état du jeu (QoS et retained du contrat) |
| `game/config.js` | Valeurs de game design (provisoires) |
| `game/jauge.js` | Calculs de la jauge (inactivité, actions, erreurs, fragments brouillés) |
| `game/session.js` | Déroulement d'une partie : temps, jauge, acte en cours, victoire et défaite |
| `game/actes/acte1.js` | Machine à états de l'Acte 1 (badge, notifications, écran, veille) |
| `game/actes/acte2.js` | Machine à états de l'Acte 2 (capteur de présence) |
| `game/actes/acte3.js`, `acte4.js` | Vides pour l'instant |
| `game/moteur.js` | Couche de liaison : timer, aiguillage des messages, application des effets |
| `websocket/serveur.js` | Serveur WebSocket `/ws` : état à la connexion, diffusion aux écrans |
| `websocket/messages.js` | Fabrication des messages du contrat WebSocket (fonctions pures) |
| `routes/sessions.js` | API des parties : créer et lancer, consulter, journal, terminer |
| `routes/scores.js` | API des scores |
| `db/pool.js` | Connexion à PostgreSQL |
| `db/sessions.js`, `capteurs.js`, `evenements.js`, `fragments.js`, `scores.js` | Requêtes SQL, un fichier par table |
| `db/catalogue.js` | Liste des énigmes créées pour chaque nouvelle partie |

Autres dossiers du backend : `tests/` (tests unitaires `node:test`) et `scripts/ecran-console.js` (faux écran, `npm run ecran`).

## API REST

| Route | Rôle |
|---|---|
| `GET /api/health` | Le serveur et la base répondent |
| `POST /api/sessions` | Crée une partie (40 min) et la lance |
| `GET /api/sessions` | Liste des parties |
| `GET /api/sessions/en-cours` | Partie en cours (404 s'il n'y en a pas) |
| `GET /api/sessions/:id` | Détail d'une partie : énigmes et fragments |
| `GET /api/sessions/:id/evenements` | Journal d'une partie |
| `POST /api/sessions/:id/terminer` | Termine une partie à la main (`{"statut":"victoire"}` ou `"defaite"`) |
| `GET /api/scores` | Scores |

## Organisation du dépôt

| Dossier | Contenu |
|---|---|
| `backend/` | Node.js + Express : réception MQTT, logique de jeu, API REST, WebSocket |
| `frontend/` | React : écran de jeu (jauge, chrono, documents, postes) |
| `database/` | Scripts SQL de création des tables |
| `iot/` | Programmes Arduino, un dossier par poste |
| `simulator/` | Faux capteurs pour tester sans matériel (et mode de secours pour la JPO) |
| `mosquitto/` | Configuration du broker MQTT |
| `docs/` | GDD, contrat MQTT, architecture, matériel, installation, guide d'équipe, démo |
| `CRA/` | Comptes-rendus d'activité hebdomadaires |

## Base de données

Scripts dans `database/migrations/`, exécutés au premier démarrage du conteneur postgres (pour repartir de zéro : `docker compose down -v`).

```
session 1──* enigme
session 1──* evenement *──1 capteur (optionnel)
session 1──* fragment_code
session 1──1 score
```

- `capteur` : un par topic MQTT, rempli par `002_capteurs.sql` (à tenir à jour avec `docs/mqtt.md` et avec `NB_BOUTONS` / `NB_PORTS` de `game/config.js`). Garde la dernière valeur reçue.
- `evenement` : journal horodaté ; messages de capteurs, énigmes, fragments, fin de partie.
- Une seule session `en_cours` à la fois (index unique), car les messages MQTT ne portent pas d'identifiant de session.
- La jauge est un entier en base : la valeur exacte (par exemple 40,2) reste en mémoire et n'est écrite, arrondie, que sur les événements (action, fin de partie), jamais chaque seconde.

## Choix techniques

- **MQTT entre les cartes et le backend** : les cartes publient sans attendre de réponse, un poste en panne ne bloque pas les autres, et les messages retained permettent à une carte qui redémarre de récupérer tout de suite le dernier état (LED, état du jeu).
- **REST + WebSocket côté écran** : REST pour les demandes ponctuelles (démarrer une partie, lire les scores), WebSocket pour que le backend pousse les changements à l'écran sans que celui-ci les demande.
- **Logique de jeu séparée du reste** : elle se teste sans matériel, sans broker et sans base, et le simulateur peut remplacer n'importe quel poste.
