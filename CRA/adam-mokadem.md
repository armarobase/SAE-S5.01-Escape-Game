# CRA - Adam Mokadem

Projet : Data-Monstre (SAÉ S5.01)
Rôles : frontend, base de données, architecture, tests, game design, documentation, suivi de projet

---

## Semaine du 19/10/2026 au 25/10/2026

### Réalisé cette semaine
- Lecture du dépôt (GDD v1.1, contrat MQTT, architecture, code du backend, CRA de l'équipe) pour identifier ce qui reste à faire de mon côté : le dossier `frontend/` était vide et la section « Choix techniques » de l'architecture n'était pas rédigée
- Contrat WebSocket entre le backend et l'écran de jeu (`docs/websocket.md`) : messages `etat`, `jauge`, `narratif`, `postes`, principe d'un instantané complet à chaque connexion, table des documents narratifs
- Frontend React + Vite (`frontend/`) :
  - réducteur qui applique les messages à l'état de l'écran, avec ignorance des messages invalides ou inconnus
  - hook de connexion WebSocket avec reconnexion automatique
  - écran de jeu : jauge à 4 niveaux (paliers de 25 points comme le backend), chrono corrigé de l'écart d'horloge avec le serveur, progression par acte, logs et mails, état des postes, bandeau de fin et classement
  - accessibilité : jauge exposée en `meter`, états écrits en toutes lettres (pas seulement une couleur), respect de `prefers-reduced-motion`
- Rédaction des logs et mails de l'univers MOKADEM Corp (7 documents, dont 3 portent un fragment du code d'arrêt d'urgence) pour la partie game design / scénarisation
- Faux serveur de développement (`frontend/dev/mock-server.js`) qui respecte le contrat et déroule une partie complète, pour travailler l'affichage sans Docker ni matériel
- Tests : 25 tests unitaires (`npm test`) sur le réducteur, le chrono, les niveaux de jauge et le rendu des documents
- Documentation : section « Frontend » et « Choix techniques » de `docs/architecture.md`, `frontend/README.md`

### Difficultés rencontrées
- Le serveur WebSocket n'existe pas encore dans le backend : le frontend est validé contre le faux serveur, pas encore contre le vrai backend
- Les documents sont écrits pour que les fragments se lisent dans l'ordre des actes : cela suppose `ordre_assemblage = acte` côté backend, à valider avec l'équipe

### Objectifs pour la semaine prochaine
- Valider le contrat WebSocket avec Ali et Sékou, et décider qui implémente le serveur
- Brancher le frontend sur le vrai backend dès que le canal `/ws` existe, et corriger les écarts
- Créer le backlog GitHub (issues + jalon Prototype mi-novembre) pour le suivi de l'avancement
- Préparer la démonstration du MVP : une séquence complète traversant carte, MQTT, backend, base et écran

### Temps passé
- 7h
