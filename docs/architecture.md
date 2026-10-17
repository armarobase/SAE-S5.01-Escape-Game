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

## Choix techniques

À compléter (pourquoi MQTT entre les cartes et le backend, pourquoi REST + WebSocket côté frontend, etc.).
