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
| `frontend/` | React : affichage de la jauge et des éléments narratifs |
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

## Choix techniques

À compléter (pourquoi MQTT entre les cartes et le backend, pourquoi REST + WebSocket côté frontend, etc.).
