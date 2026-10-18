# GDD : Data-Monstre

Document de Conception de Jeu (Game Design Document)

Information Détails

Groupe / Équipe Ali Ben Akremi (BDD, architecture, game design, backend, IoT), Sékou-Oumar Diallo (backend/API, sécurité, IoT, documentation, agile), Yassine Bakhtaoui (game design, BDD, frontend, backend, tests), Adam Mokadem (frontend, BDD, architecture, tests), Bassirou Doucouré (IoT et capteurs, sécurité, tests)

Version 1.0 (version finale)

Date de mise à jour 01/10/2026

## 1. VISION & CONCEPT (Le "Pitch")

- High Concept (Le Pitch) : Dans un data center abandonné, une

entité algorithmique, le Data-Monstre, grossit grâce à tous les usages numériques inutiles (notifications, autoplay, serveurs oubliés). Les joueurs doivent le faire "maigrir" en coupant physiquement ce qui l'alimente, avant qu'il ne les enferme.

- Genre : Escape game hybride (physique et numérique), avec une

part d'enquête technique.

- Public Cible : Étudiants et grand public, dont les visiteurs de la

JPO. Aucune compétence technique n'est nécessaire : il suffit d'utiliser au quotidien le streaming, les réseaux sociaux ou les mails.

- La Proposition de Valeur : Chaque énigme porte sur une

habitude numérique qu'on ne remarque plus. Le joueur mesure l'impact de pratiques qu'il reproduit sans y penser. On veut qu'il ressente une pression (la jauge qui monte) et qu'il comprenne le message en jouant, sans qu'on lui fasse la leçon.

## 2. LE GAMEPLAY (Les Règles du Jeu)

2. 1 La Boucle de Gameplay (Core Loop)

Observer la jauge de "poids du monstre" (affichée en grand sur écran) → identifier la source de surconsommation → agir physiquement dessus via un capteur → la jauge baisse → un fragment du code final se débloque → énigme suivante.

La jauge monte en continu si le joueur reste inactif, ce qui le pousse à agir sans le pénaliser trop durement.

2. 2 Mécaniques de Jeu

- Actions directes : scanner un badge RFID, actionner des

interrupteurs, régler un potentiomètre, couvrir une photorésistance, s'éloigner d'un capteur de présence, débrancher ou rebrancher des câbles réseau, saisir un code sur un clavier matriciel.

- Systèmes de jeu : jauge globale de "poids du monstre" calculée

en continu à partir de l'état des énigmes, collecte d'un fragment de code par acte (réutilisés dans l'Acte 4), déblocage progressif des éléments narratifs (logs, mails, alertes).

2. 3 Structure & Progression

- Le Flow : Progression linéaire en 4 actes. Chaque acte doit être

résolu pour débloquer le suivant et livre un fragment du code final utilisé dans l'Acte 4.

- Difficulté : Elle augmente avec le nombre de capteurs à

manipuler et l'effort de réflexion demandé. L'Acte 1 demande seulement d'actionner des interrupteurs, l'Acte 3 demande de lire un plan de câblage et l'Acte 4 d'assembler le code dans le bon ordre.

- Conditions de Victoire & Défaite : Victoire si le code final est

saisi correctement avant la fin du temps imparti. Défaite si le temps est écoulé ou si la jauge atteint son maximum.

## 3. SCÉNARIO & THÉMATIQUE (L'Univers)

3. 1 L'Intrigue & l'Univers

Le data center appartient à une entreprise fictive, MOKADEM Corp, qui a laissé tourner des services inutiles pendant des années sans jamais faire de tri. Le Data-Monstre représente cette accumulation de dette technique et énergétique. Le joueur incarne un technicien ou une technicienne appelé en urgence après une alerte de surcharge. Au fil des actes, il découvre des logs, des mails internes et des alertes système. Ces documents expliquent comment la situation a dérapé. Ils contiennent aussi les fragments du code d'arrêt d'urgence.

3. 2 Intégration des Enjeux (Éthique / Durable)

Le thème de la sobriété numérique est porté par les énigmes ellesmêmes. Il n'y a pas de texte explicatif : le joueur comprend en faisant (couper une notification inutile, repérer un branchement oublié, comprendre pourquoi une vidéo continue tant que quelqu'un semble la regarder). L'Acte 4 conclut l'histoire : pour obtenir le code d'arrêt, il faut avoir résolu les trois actes précédents.

## 4. SPÉCIFICATIONS TECHNIQUES

## (L'Ingénierie)

4. 1 Liste détaillée des énigmes par acte

Acte 1 : "Alerte surcharge" (tutoriel)

Énigme Ce que fait le joueur Capteur/ actionneur

Ouverture de la console Scanner le badge technicien Lecteur RFID (RC522)

Notifications push Couper les interrupteurs des applis inutiles, la jauge baisse à chaque coupure

Interrupteurs + LED

Réglage de l'écran maquette

Baisser la luminosité avec un bouton tournant Potentiomètre

Mise en veille Poser un cache sur une photorésistance pour simuler l'extinction de l'écran

Photorésistance (LDR)

Acte 2 : "La salle de visionnage"

Énigme Ce que fait le joueur Capteur/ actionneur

Autoplay infini Tant qu'un joueur reste devant l'écran, le système croit que "quelqu'un regarde" et ne propose jamais d'arrêter la vidéo. Les joueurs doivent s'éloigner pour que le système détecte enfin l'absence de spectateur.

Capteur de présence (PIR)

Acte 3 : "La salle de brassage"

Énigme Ce que fait le joueur Capteur/ actionneur

Tri des connexions Lire un plan de câblage partiellement raturé trouvé dans le décor, puis débrancher les câbles des connexions inutiles et laisser en place les connexions actives

Un interrupteur ou contact reed par port + LED bicolore (vert/rouge) par port

Acte 4 : "Code d'autorisation"

Énigme Ce que fait le joueur Capteur/ actionneur

Assemblage et saisie du code final

Rassembler les fragments obtenus dans les trois actes précédents (dans les logs et mails débloqués) et les saisir dans le bon ordre pour désactiver le Data-Monstre. La difficulté dépend de la jauge à l'arrivée dans l'acte : plus elle est haute, plus le monstre brouille de fragments, que les joueurs doivent alors retrouver.

Clavier matriciel 4×4

4. 2 Stack Technologique

- Hardware / IoT :

○ Microcontrôleur : ESP32, un par poste (Acte 1, Acte 2, Acte

3. , avec WiFi intégré et publication MQTT directe.

○ Capteurs/actionneurs : lecteur RFID RC522 (Acte 1), interrupteurs + LED (Acte 1 et Acte 3), potentiomètre (Acte

1. , photorésistance/LDR (Acte 1), PIR (Acte 2), contacts

reed ou switches par port + LED bicolore (Acte 3), clavier matriciel 4×4 (Acte 4).

- Communication :

○ MQTT (broker Mosquitto) entre chaque ESP32 et le backend, avec un topic par acte et par capteur (ex.

datamonstre/acte1/badge/scan, datamonstre/ acte3/panneau/port1). ○ API REST entre le frontend et le backend pour l'état de la session et les scores. ○ WebSocket pour envoyer au frontend, dès qu'ils changent, la valeur de la jauge et les éléments narratifs débloqués.

- Backend : Node.js + Express, client mqtt.js pour s'abonner aux

topics, socket.io ou ws pour le WebSocket. Chaque énigme a sa propre machine à états (verrouillée → active → résolue). Le backend calcule la jauge globale et vérifie le code final saisi.

- Frontend : React, connecté en WebSocket, affichage de la jauge

et des éléments narratifs (logs, mails) débloqués pendant la partie.

- Base de données : PostgreSQL, avec les entités Session,

Enigme (par acte), Capteur (type, topic MQTT, dernière valeur), Evenement (log horodaté), FragmentCode (fragments collectés par acte et ordre d'assemblage), Score.

4. 3 Architecture du Système

Postes physiques (un ESP32 par acte) │ MQTT (publish/subscribe) ▼ Broker MQTT (Mosquitto) │ ▼ Backend (API REST + logique de jeu) ├── REST API ──► Frontend (état de session, scores) └── WebSocket ──► Frontend (jauge et éléments narratif │ ▼ Base de données (PostgreSQL)

Nous utilisons deux modes de communication. MQTT relie les capteurs au backend : chaque ESP32 publie ses mesures sans attendre de réponse, et un poste en panne ne bloque pas les autres. Côté frontend, REST sert aux requêtes ponctuelles (démarrer une session, lire un score) et WebSocket permet au backend d'envoyer les mises à jour à

l'écran sans que le frontend ait à les demander. Ce choix répond à la contrainte d'architecture distribuée du sujet.

4. 4 Interface & Expérience Utilisateur (UI/UX)

- Interface : un écran principal affiche la jauge du monstre en

direct, ainsi que les logs et mails débloqués au fil des énigmes.

- Interaction Physique : chaque énigme repose sur un geste

physique avec un retour immédiat (LED, valeur affichée), pour que le joueur voie tout de suite l'effet de son action sur la jauge.

## 5. PLAN DE PRODUCTION (La Roadmap)

5. 1 Liste des Fonctionnalités (Feature List)

- Must-Have (Critique) :

○ Boucle de gameplay complète de l'Acte 1 à l'Acte 4. ○ Jauge du monstre calculée et affichée en direct. ○ Capteurs des 4 actes fonctionnels (RFID, interrupteurs, potentiomètre, LDR, PIR, contacts reed, clavier matriciel). ○ Sauvegarde de la session (progression, fragments de code, score) en base de données.

- Should-Have (Important) :

○ Logs et mails mis en forme graphiquement dans le dashboard. ○ Score final détaillé (temps, nombre d'erreurs) avec historique des sessions.

- Nice-to-Have (Bonus) :

○ Variante de difficulté pour la JPO. ○ Dashboard spectateur pour suivre une partie depuis l'extérieur de la salle.

5. 2 Jalons de Validation (Milestones)

Jalon Date Livrable

Jalon 1 : Conception Fin septembre GDD (ce document)

Jalon 2 : Prototype Minovembre MVP jouable : Acte 1 complet + au moins une énigme d'un acte suivant

Jalon 3 : Beta Mi-janvier Version intégrée des 4 actes + rapport d'équipe

Jalon 4 : JPO Mi-février Produit final et démonstration publique

## 6. ANALYSE DES RISQUES

Risque identifié Impact (H/M/L) Stratégie d'atténuation

Aucune expérience préalable en IoT dans l'équipe

H Valider d'abord les capteurs les plus simples de l'Acte 1 (interrupteurs, potentiomètre, LDR) avant de passer au RFID et aux contacts reed de l'Acte 3.

Câblage SPI du lecteur RFID (RC522) parfois capricieux avec l'ESP32

H Tester ce composant en premier, avant le jalon Prototype, car il conditionne l'entrée dans l'Acte 1.

Faux positifs du PIR (Acte 2) : le système peut mal détecter l'absence des joueurs

M Prévoir un délai de détection réglable et tester en conditions réelles (lumière de la salle, passage d'autres personnes).

Fiabilité des contacts reed sur plusieurs ports en même temps (Acte 3)

M Tester le panneau de brassage complet avant le jalon Prototype. En cas de problème, remplacer les contacts reed par de simples boutons.

Plusieurs ESP32 connectés en parallèle via MQTT

M Séparer chaque acte sur ses propres topics pour qu'une panne sur un poste n'affecte pas les autres.

Panne de matériel le jour de la JPO H Prévoir un mode de secours logiciel qui simule les entrées des capteurs pour chaque acte.

Délai serré entre les jalons (GDD fin septembre, MVP minovembre)

M Traiter les fonctionnalités Must- Have avant les Should-Have et Nice-to-Have.