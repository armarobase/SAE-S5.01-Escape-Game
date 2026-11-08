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
- Créer le backlog GitHub avec le jalon Prototype : fait
- Demander au professeur le nombre d'exemplaires de chaque équipement : fait
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

## Semaine du 26/10/2026 au 01/11/2026

### Bilan des objectifs de la semaine précédente
- Envoyer l'état de la partie au frontend par WebSocket : fait (PR #14)
- Voir avec Ali le statut "abandonnee" et la durée par défaut de la session : fait
- Faire valider par l'équipe les valeurs de game design de config.js : fait
- Tester l'Acte 1 avec le vrai poste de Bassirou : reporté, la branche feature/iot-acte1 n'est pas encore fusionnée
- Créer le backlog GitHub avec le jalon Prototype : fait
- Demander au professeur le nombre d'exemplaires de chaque équipement : fait

### Réalisé cette semaine
- Serveur WebSocket attaché au serveur HTTP, sur le même port que l'API (/ws), avec la bibliothèque ws, compatible avec le WebSocket natif du navigateur
- Diffusion de l'état de la partie selon le contrat d'Adam (frontend/websocket.md) : état complet à chaque connexion d'un écran et à chaque changement de structure, jauge quand sa valeur entière change, documents débloqués, état des postes
- Ordre de traitement garanti : MQTT et base d'abord, écrans ensuite, pour que le score soit enregistré avant l'affichage de la fin de partie
- État des postes mémorisé à partir des messages retained : il reste connu après un redémarrage du backend
- Déblocage des documents narratifs réglable dans config.js (à la fin d'un acte ou à la résolution d'une énigme)
- Faux écran en console (npm run ecran) pour vérifier le backend sans le frontend
- 77 tests unitaires, dont des tests avec de vrais clients WebSocket
- Test de bout en bout avec Mosquitto, PostgreSQL, le simulateur et le faux écran : partie complète des Actes 1 et 2, victoire et score enregistré, postes retrouvés après un redémarrage du backend
- Documentation du Prototype (PR #15) : installation, architecture, nouveau guide d'équipe et déroulé de la démo (docs/demo-prototype.md) avec remise à zéro entre deux parties et plan B
- Vérification du dépôt : pas de secret ni de gros fichier suivi, branches et commits contrôlés
- Essai en local d'une proposition de design pour l'écran de jeu, à présenter à Adam : frontend remis en ordre pour qu'il se lance, ambiance cyberpunk de terminal de megacorp piraté, couleurs qui changent selon le niveau de la jauge, polices copiées dans le projet pour fonctionner sans internet. Rien n'est publié dans le dépôt

### Difficultés rencontrées
- Le frontend du dépôt ne se lance pas : les fichiers envoyés par l'interface web de GitHub sont à plat, alors que le code attend src/ et dev/. Une fois remis dans la bonne arborescence, il fonctionne et ses 25 tests passent. À corriger avec Adam
- Le contrat WebSocket ne disait pas quand débloquer les documents ni comment suivre la jauge pendant l'inactivité : solutions appliquées en attendant l'avis d'Adam
- Une session restée "en cours" après un arrêt du backend a de nouveau bloqué les parties : terminée en défaite sur ma base locale. Le statut "abandonnee" reste à prévoir avec Ali
- Le service backend de docker-compose.yml ne peut pas se construire : backend/Dockerfile n'existe pas. La documentation indique de lancer le backend avec npm run dev
- La branche feature/acte1-jauge d'Ali est un doublon de l'Acte 1 déjà fusionné, en conflit avec main : à ne pas fusionner

### Objectifs pour la semaine prochaine
- Présenter la proposition de design à Adam et corriger avec lui l'arborescence du frontend
- Brancher le vrai frontend sur le backend et valider avec Adam les choix faits sur le contrat WebSocket
- Tester l'Acte 1 avec le vrai poste de Bassirou : badge réel, seuils du slider et du capteur de lumière
- Préparer et répéter la démo du jalon Prototype de mi-novembre
- Voir avec Ali le statut "abandonnee", la durée par défaut de la session et le sort de sa branche feature/acte1-jauge
- Faire valider par l'équipe les valeurs de game design de config.js

### Temps passé
- 10h

---

## Semaine du 02/11/2026 au 08/11/2026

### Bilan des objectifs de la semaine précédente
- Présenter la proposition de design à Adam et corriger avec lui l'arborescence du frontend : [à confirmer]
- Brancher le vrai frontend sur le backend : reporté, le frontend du dépôt ne se lance toujours pas
- Tester l'Acte 1 avec le vrai poste de Bassirou : reporté, la branche feature/iot-acte1 n'a pas bougé depuis le 18/10
- Préparer et répéter la démo du jalon Prototype : [à confirmer]
- Voir avec Ali le statut "abandonnee", la durée par défaut et sa branche feature/acte1-jauge : [à confirmer]
- Faire valider les valeurs de game design de config.js : [à confirmer]

### Réalisé cette semaine
- Maquette locale d'un écran de jeu plus vivant, à proposer à Adam, sans modifier sa logique (useJeu, reducer, contrat WebSocket) :
  - le monstre au centre, branché par 4 câbles de données (un par acte) ; chaque acte résolu coupe son câble et le monstre rétrécit
  - jauge en anneau qui glisse en douceur, ambiance qui change selon le niveau (calme, surcharge, critique, alerte)
  - code d'arrêt d'urgence en bas de l'écran, avec les fragments récupérés ou brouillés
  - documents qui se déchiffrent à leur arrivée, séquence de démarrage, transition entre les actes, écrans de victoire et de défaite, message en cas de perte de connexion
  - son synthétisé dans le navigateur (coupé par défaut), sans fichier ni dépendance
- Effets déduits de l'état de la partie par une fonction testée (10 tests), tous les réglages regroupés dans un seul fichier
- Banc d'essai (faux serveur piloté au clavier) pour montrer chaque niveau de jauge et chaque moment de la partie sans jouer
- Accessibilité : pas plus de 3 éclats par seconde, aucun clignotement plein écran, mode sans animation respecté
- Vérification du contenu affiché aux joueurs : les documents n'apparaissent qu'à la fin de chaque acte, et aucune consigne ni aucun indice n'est prévu pendant les énigmes

### Difficultés rencontrées
- Plusieurs éléments de l'écran ne s'affichaient pas : une règle CSS trop large et le mode sans animation de Windows. Corrigés et vérifiés sur 15 captures
- Aucun texte ne guide les joueurs pendant un acte (objectif, indice) : c'est une question de game design, absente du GDD
- Le Prototype approche alors que le poste de l'Acte 1 n'a jamais été testé avec le backend et que le frontend du dépôt ne se lance pas

### Objectifs pour la semaine prochaine
- Montrer la maquette à Adam et décider ensemble ce qu'il reprend
- Définir avec Yassine et Ali les consignes et indices affichés pendant chaque énigme
- Tester l'Acte 1 avec le vrai poste de Bassirou avant la démo
- Répéter la démo du Prototype (docs/demo-prototype.md)
- Voir avec Ali le statut "abandonnee" et la durée par défaut

### Temps passé
- 8h
