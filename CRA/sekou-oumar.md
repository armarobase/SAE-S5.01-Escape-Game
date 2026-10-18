# CRA - Sékou-Oumar Diallo

Projet : Data-Monstre (SAÉ S5.01)
Rôles : backend/API, sécurité, IoT, documentation, agile

---

## Semaine du 05/10/2026 au 11/10/2026

### Réalisé cette semaine
- Relecture du GDD v1.0 pour identifier les tâches qui me reviennent (backend/API, IoT, documentation, agile) et l'ordre dans lequel les traiter
- Comparaison des besoins matériels du GDD avec la liste des équipements IoT disponibles :
  - pas d'ESP32 : remplacement envisagé par l'Arduino MKR WiFi 1010 (WiFi + MQTT)
  - RFID Grove disponible à la place du RC522 (à vérifier : fréquence des badges et tension d'alimentation)
  - éléments absents : contacts reed (Acte 3), clavier matriciel 4×4 (Acte 4), LED bicolores
  - pistes de remplacement : boucles de câbles sur un Arduino Mega pour l'Acte 3, joystick + LCD ou clavier à acheter pour l'Acte 4
- Clonage du dépôt et mise en place de l'environnement de travail (VS Code, Git)
- Réflexion sur l'organisation du dépôt : une branche par fonctionnalité, `main` réservée aux versions qui fonctionnent

### Difficultés rencontrées
- Le matériel disponible ne correspond pas entièrement au GDD : une mise à jour (v1.1) sera nécessaire

### Objectifs pour la semaine prochaine
- Demander au professeur le nombre d'exemplaires de chaque équipement
- Définir avec l'équipe le contrat MQTT (liste des topics et format JSON des messages)
- Proposer une convention de branches et une arborescence du dépôt (backend, frontend, iot, docs, CRA)
- Initialiser le backend Node.js + Express et le connecter à un broker Mosquitto local
- Créer le backlog du projet (issues + jalon Prototype mi-novembre)

### Temps passé
- 4h

---

## Semaine du 12/10/2026 au 18/10/2026

### Bilan des objectifs de la semaine précédente
- Convention de branches et arborescence du dépôt : fait
- Backend Node.js + Express connecté à Mosquitto : fait
- Contrat MQTT défini avec l'équipe : fait (validé)
- Mise à jour du GDD en v1.1 : en cours
- Backlog du projet (issues + jalon Prototype) : reporté
- Demande au professeur du nombre d'exemplaires de chaque équipement : reportée

### Réalisé cette semaine
- Liste du matériel IoT à récupérer, poste par poste, à partir des équipements disponibles
- Structure du dépôt : un dossier par partie (backend, frontend, database, iot, simulator, docs, CRA) et un dossier par acte (PR #1, fusionnée)
- Fichiers de base : .gitignore (aucun secret ni node_modules dans le dépôt), .env.example, .gitattributes (fins de ligne communes), docker-compose.yml, configuration Mosquitto avec authentification
- Contrat MQTT (docs/mqtt.md) : convention des topics, format JSON, messages capteurs et actionneurs, QoS, messages retained, statut des postes (Last Will), règles de sécurité. Validé par l'équipe
- Mise en route du broker Mosquitto sous Docker, avec authentification obligatoire
- Backend minimal Node.js + Express : connexion MQTT authentifiée, abonnement à datamonstre/#, route /api/health, messages au JSON invalide ignorés sans arrêt du serveur
- Simulateur de capteurs : scénario complet de l'Acte 1 et mode robustesse (messages invalides), pour tester sans matériel et servir de mode de secours à la JPO
- Tests de bout en bout : messages reçus par le backend, refus d'un mauvais mot de passe, résistance aux messages invalides
- Documentation : architecture, matériel réel, guide d'installation, guide de démarrage pour l'équipe, fichier de contexte CLAUDE.md
- GDD : passage en Markdown dans le dépôt (docs/GDD.md) pour suivre ses évolutions avec Git, début de la mise à jour v1.1

### Difficultés rencontrées
- Mosquitto refusait de démarrer ("Unable to open pwfile") : fichier de mots de passe créé par root, illisible par Mosquitto. Corrigé en le créant avec --user mosquitto
- Sous PowerShell, les guillemets du JSON sont mal transmis à mosquitto_pub. Contourné avec cmd ou docker --%
- Ces deux points ont été ajoutés à la documentation d'installation
- Le mode robustesse du simulateur a montré que le backend laisse encore passer certains messages incorrects (champ absent, valeur hors limites, topic inconnu) : à traiter la semaine prochaine
- La version Markdown du GDD était une conversion brute du PDF (tableaux et listes cassés) : remise en forme nécessaire avant la v1.1

### Objectifs pour la semaine prochaine
- Finaliser et faire valider le GDD v1.1 (décision à prendre en équipe pour l'Acte 4 : clavier 4x4 ou joystick + LCD)
- Validation des messages MQTT dans le backend selon le contrat
- Créer le backlog GitHub avec le jalon Prototype mi-novembre
- Demander au professeur le nombre d'exemplaires de chaque équipement
- Commencer les machines à états de l'Acte 1, une fois les valeurs de jeu fixées
- Envoi de la jauge au frontend par WebSocket

### Temps passé
- 9h

---

