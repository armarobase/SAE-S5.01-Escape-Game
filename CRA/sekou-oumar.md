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

## Semaine du 19/10/2026 au 25/10/2026

### Bilan des objectifs de la semaine précédente
- Finaliser le GDD v1.1 : fait (PR #6 fusionnée, joystick + LCD retenus pour l'Acte 4)
- Validation des messages MQTT dans le backend selon le contrat : fait (PR #11)
- Machines à états de l'Acte 1 : fait (PR #9 et #10)
- Créer le backlog GitHub avec le jalon Prototype : [à confirmer]
- Demander au professeur le nombre d'exemplaires de chaque équipement : [à confirmer]
- Envoi de la jauge au frontend par WebSocket : reporté

### Réalisé cette semaine
- Configuration du game design réunie dans un seul fichier (backend/src/game/config.js) : durée de partie (40 min), paramètres de la jauge, nombre de boutons et de ports, badges autorisés, seuils du slider et du capteur de lumière, fragment de code. Valeurs provisoires, faciles à modifier en attendant leur validation
- Jauge du monstre : reprise du travail de Yassine, ajout de la montée seconde par seconde après 15 s d'inactivité
- Machine à états de l'Acte 1 (verrouillée → active → résolue) : badge qui débloque les trois autres énigmes, notifications coupées ou rallumées par les boutons (seule la première coupure fait baisser la jauge), slider et capteur de lumière sous un seuil, fragment de code livré à la fin de l'acte
- Déroulement de la partie : démarrage par POST /api/sessions, timer, passage d'un acte à l'autre, victoire et défaite (jauge pleine ou temps écoulé), score enregistré en base
- Pour le jalon Prototype, la résolution de l'Acte 1 donne la victoire (réglable quand les autres actes existeront)
- Ordres envoyés aux postes selon le contrat MQTT : LED des notifications, bargraph (publié seulement quand son niveau change), état du jeu
- Logique de jeu indépendante de MQTT et de la base, pour pouvoir la tester sans matériel
- Validation complète des messages MQTT à l'entrée du backend : type et limites de chaque valeur, topic inconnu, statut des postes, avec la raison du refus dans le journal. Identifiant de connexion "backend" ajouté (contrat, section 6)
- 48 tests unitaires (node:test) : jauge, Acte 1, déroulement de la partie, validation des messages
- Tests de bout en bout avec Mosquitto, PostgreSQL et le simulateur : partie gagnée (score calculé), partie perdue par la jauge, messages invalides refusés sans arrêt du serveur
- .gitattributes : fichiers binaires (PDF, images) protégés des conversions de fins de ligne

### Difficultés rencontrées
- Le PDF du GDD était corrompu en local par une conversion des fins de ligne : corrigé en déclarant les fichiers binaires dans .gitattributes
- La jauge prend des valeurs décimales (+0,2 par seconde) alors que la colonne en base est un entier : valeur exacte gardée en mémoire, arrondie seulement à l'écriture en base et sur le bargraph
- Une partie du branchement de l'Acte 1 n'avait pas été incluse dans la PR #9 : ajoutée dans la PR #10
- Si le backend redémarre en pleine partie, la session reste "en cours" en base et bloque la suivante. La terminer en défaite fausserait les scores : un statut "abandonnee" est à prévoir avec Ali
- La base fixe la durée par défaut à 30 min au lieu de 40 : contournée en passant la durée à la création, à corriger avec Ali
- Le nombre de boutons et de ports est déclaré à deux endroits (config.js et la migration 002_capteurs.sql) : commentaire ajouté pour les modifier ensemble

### Objectifs pour la semaine prochaine
- Envoyer l'état de la partie au frontend par WebSocket, selon le contrat d'Adam (frontend/websocket.md)
- Voir avec Ali le statut "abandonnee" et la durée par défaut de la session
- Faire valider par l'équipe les valeurs de game design de config.js
- Tester l'Acte 1 avec le vrai poste de Bassirou (branche feature/iot-acte1)
- Créer le backlog GitHub avec le jalon Prototype mi-novembre
- Demander au professeur le nombre d'exemplaires de chaque équipement

### Temps passé
- 12h

---

