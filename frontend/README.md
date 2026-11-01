# Frontend : écran de jeu Data-Monstre

Application React (Vite) affichée sur l'écran de la salle : jauge du monstre, chrono, progression par acte, logs et mails débloqués, classement.

## Lancer

Prérequis : Node.js 20 ou plus.

```bash
cd frontend
npm install
```

**Avec le vrai backend** (voir `docs/installation.md` pour Docker et le backend) :

```bash
npm run dev          # http://localhost:5173, relaie /api et /ws vers http://localhost:3000
```

**Sans backend, avec un faux serveur** (pratique pour développer l'affichage) :

```bash
npm run mock         # dans un premier terminal : faux backend sur le port 3000
npm run dev          # dans un second terminal
```

Cliquer sur « Démarrer la partie » déroule une partie complète en une minute environ. Options : `MOCK_FIN=defaite npm run mock` pour terminer par une défaite, `MOCK_VITESSE=3 npm run mock` pour aller 3 fois plus vite. Si le backend est ailleurs : `BACKEND_URL=http://192.168.1.50:3000 npm run dev`.

## Tests et build

```bash
npm test             # tests unitaires (node --test), sans navigateur
npm run build        # production dans dist/
```

## Organisation

| Dossier | Rôle |
|---|---|
| `src/state/` | Réducteur : applique les messages WebSocket à l'état de l'écran |
| `src/lib/` | Fonctions pures : chrono, niveaux de jauge, mise en forme des documents |
| `src/hooks/useJeu.js` | Connexion WebSocket avec reconnexion automatique |
| `src/api.js` | Appels REST (démarrer une partie, classement) |
| `src/components/` | Composants d'affichage |
| `src/contenu/narratif.js` | Texte des logs et mails de l'univers MOKADEM Corp |
| `dev/mock-server.js` | Faux backend de développement |

Contrat des messages : `docs/websocket.md`.
