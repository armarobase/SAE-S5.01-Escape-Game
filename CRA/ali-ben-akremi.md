# CRA - Ali Ben Akremi

Projet : Data-Monstre (SAÉ S5.01)
Rôles : base de données, architecture, game design, backend, IoT

## Semaine du 12/10/2026 au 18/10/2026

### Réalisé cette semaine
- Conception et création de la base de données PostgreSQL (`database/migrations/`) :
  - schéma à 6 entités issues du GDD : `session`, `enigme`, `capteur`, `evenement`, `fragment_code`, `score`
  - contraintes d'intégrité (états des énigmes, bornes de la jauge, clés étrangères)
  - une seule partie en cours à la fois, garantie par la base (index unique), car les messages MQTT ne portent pas d'identifiant de session
  - insertion des 12 capteurs du contrat MQTT (`docs/mqtt.md`)
- Couche d'accès aux données du backend (`backend/src/db/`) : un fichier par table, pool de connexions PostgreSQL partagé, catalogue des énigmes créées à chaque session
- Persistance des messages MQTT : chaque message valide met à jour la dernière valeur du capteur et alimente le journal de la partie ; les messages hors contrat sont ignorés et journalisés
- API REST : démarrer, consulter et terminer une session, journal d'événements d'une session, classement des scores
- `/api/health` vérifie maintenant aussi la connexion à la base ; ajout d'un gestionnaire d'erreurs pour qu'une erreur inattendue ne fasse pas tomber le serveur
- Documentation : section « Base de données » ajoutée à `docs/architecture.md`
- Tests : schéma et routes validés sur un PostgreSQL local (création de session, refus d'une seconde session en cours, enregistrement MQTT, fin de partie avec score, refus d'une double fin de partie)
- Travail livré sur la branche `feature/base-de-donnees`, avec pull request pour relecture

### Difficultés rencontrées
- Docker n'est pas installé sur mon poste : impossible de tester avec `docker compose`. J'ai validé sur un PostgreSQL embarqué, mais le démarrage complet via Docker reste à vérifier
- Les scripts SQL ne s'exécutent qu'au premier démarrage du conteneur PostgreSQL : toute modification du schéma demande de recréer le volume (`docker compose down -v`)
- La formule de calcul du score n'est pas définie dans le GDD : une formule provisoire a été posée, à valider avec l'équipe

### Objectifs pour la semaine prochaine
- Faire relire et fusionner la pull request, puis vérifier le démarrage complet avec Docker
- Valider avec Yassine la formule du score et les valeurs encore ouvertes du contrat MQTT (nombre de boutons, de ports, longueur du code)
- Implémenter la machine à états de l'Acte 1 et le calcul de la jauge (`backend/src/game/`), en s'appuyant sur la base
- Ajouter le WebSocket pour envoyer la jauge au frontend
- Écrire des tests sur les routes et la persistance

### Temps passé
- 5h

## Semaine du 19/10/2026 au 25/10/2026

### Réalisé cette semaine
- Acte 2 « La salle de visionnage » (énigme « Autoplay infini », capteur de présence PIR), `backend/src/game/actes/acte2.js` :
  - l'énigme est résolue quand la salle reste vide pendant un délai réglable (10 s, `DELAI_ABSENCE_S` dans `game/config.js`), conformément au contrat MQTT qui place ce délai côté backend
  - l'absence ne compte qu'après avoir détecté une présence, pour que l'énigme ne se résolve pas toute seule quand le capteur n'envoie rien
  - un retour devant l'écran pendant le délai remet le décompte à zéro ; un message « absent » répété (QoS 1) ne le repousse pas
  - l'acte livre son fragment du code final (`"27"`, deuxième position) et fait baisser la jauge
- Intégration dans la session (`game/session.js`) : ajout d'un `tick()` facultatif par acte, appelé chaque seconde, pour les actes qui dépendent du temps ; l'Acte 1 n'est pas modifié
- `DERNIER_ACTE` passe de 1 à 2 : la partie du Prototype se termine désormais par la victoire à la fin de l'Acte 2
- Tests : 11 tests de l'acte, tests de session adaptés et complétés (parcours Acte 1 puis Acte 2 jusqu'à la victoire, défaite par jauge pleine à l'Acte 2) ; 63 tests passent
- Simulateur : nouveau mode `acte2` et pause réglable par étape
- Documentation : précision sur le PIR dans `docs/mqtt.md`, usage du simulateur dans `docs/installation.md`
- Travail livré sur la branche `feature/acte2-autoplay`, pull request #13 fusionnée dans `main`

### Difficultés rencontrées
- J'ai d'abord écrit une machine à états de l'Acte 1 et le calcul de la jauge, alors que Sékou-Oumar les avait déjà poussés sur `main` : ma copie locale n'était pas à jour et je n'avais pas fait de `git pull`. La PR #12 a été abandonnée (conflits sur les mêmes fichiers). Je fais désormais un `git pull` avant chaque nouvelle tâche
- Le capteur PIR ne détecte que le mouvement : des joueurs immobiles peuvent passer pour absents. Le délai de 10 s est provisoire, à régler avec le vrai capteur
- Après l'Acte 1, la jauge est déjà à 0 (départ à 30, six actions à −5) : l'Acte 2 n'a plus de pression de jauge. Les valeurs de game design sont à revoir avec l'équipe
- Le code Arduino de l'Acte 2 (`iot/acte2/acte2.ino`) n'est pas écrit : cela relève de l'IoT

### Objectifs pour la semaine prochaine
- Demander à Sékou-Oumar de relire la PR #13 (fusionnée avant sa relecture)
- Tester le délai d'absence avec le vrai capteur PIR, avec Bassirou, et revoir les valeurs de la jauge
- Choisir et traiter l'Acte 3 (panneau de câbles) ou la formule du score, à valider avec Yassine
- Vérifier le démarrage complet avec Docker (toujours à faire)

### Temps passé
- 3h

## Semaine du 26/10/2026 au 01/11/2026

### Réalisé cette semaine
- Aucun développement cette semaine : j'ai consacré mon temps aux révisions des DSR (devoirs surveillés de ressources)
- Je suis resté joignable pour l'équipe et j'ai répondu aux questions de mes camarades, notamment Sékou-Oumar

### Difficultés rencontrées
- Charge de révisions importante, incompatible avec un travail de fond sur le projet
- Les relectures de PR que je m'étais fixées (PR #13) n'ont pas pu être traitées

### Objectifs pour la semaine prochaine
- Reprendre le projet dès que les évaluations sont passées
- Faire le point avec l'équipe sur ce qui a avancé pendant mon absence (`git pull` avant de recommencer)

### Temps passé
- 0h

## Semaine du 02/11/2026 au 08/11/2026

### Réalisé cette semaine
- Aucun développement cette semaine : semaine des DST, pendant laquelle j'ai été malade et pas en état de travailler
- J'ai tout de même essayé de rester présent pour l'équipe : j'ai aidé mes camarades à distance, notamment Sékou-Oumar

### Difficultés rencontrées
- Maladie pendant la semaine des DST : indisponibilité pour le projet
- Deux semaines consécutives sans contribution au code (26/10 au 08/11) : le retard est à rattraper avant le jalon Prototype

### Objectifs pour la semaine prochaine
- Reprendre le développement avec l'Acte 3 (panneau de brassage), qui n'avait pas encore été traité
- Se resynchroniser avec l'équipe sur l'état de `main`

### Temps passé
- 0h

## Semaine du 09/11/2026 au 15/11/2026

### Réalisé cette semaine
- Acte 3 « La salle de brassage » (énigme « Tri des connexions », boucles de câble), `backend/src/game/actes/acte3.js` :
  - les joueurs débranchent les câbles des liaisons inutiles et laissent les liaisons actives ; les ports à garder sont réglables (`PORTS_ACTIFS` dans `game/config.js`, seul le port 1 pour l'instant, d'après le mail de l'Acte 3 du frontend)
  - LED verte tant que le câble est branché, rouge dès qu'il est débranché
  - débrancher un port inutile fait baisser la jauge, une seule fois par port, pour éviter de la faire baisser en débranchant et rebranchant en boucle
  - débrancher un port encore actif est une erreur : la jauge monte, le rebrancher est gratuit
  - l'énigme est résolue quand la bonne configuration reste stable 2 s (`DELAI_CONFIRMATION_S`), pour ne pas valider sur un faux contact
  - l'acte livre son fragment du code final (`"1"`, troisième position, soit le code 4-27-1)
- Nouvel effet `erreur` dans la session (`game/session.js`, `game/moteur.js`) : la jauge monte sans remettre l'inactivité à zéro, le compteur `nb_erreurs` de la base est incrémenté (il entre dans le score) et l'erreur est inscrite au journal ; les écrans reçoivent un état complet à chaque erreur (`websocket/messages.js`)
- `DERNIER_ACTE` passe de 2 à 3 : la partie se termine désormais par la victoire à la fin de l'Acte 3
- Tests : 16 tests de l'acte, tests de session adaptés (Acte 2 puis Acte 3 jusqu'à la victoire, erreur, messages d'actes précédents ignorés) ; 97 tests passent
- Simulateur : nouveau mode `acte3` (une erreur, puis les ports 2 à 4 débranchés)
- Programme du poste de l'Acte 3 (`iot/acte3/acte3.ino`) : Arduino Mega + Ethernet Shield, lecture des boucles avec anti-rebond, commande des LED, statut du poste avec Last Will
- Documentation : contrat MQTT (couleurs des LED, état initial des ports), installation, architecture, guide d'équipe, démo du Prototype
- Travail livré sur la branche `feature/acte3-brassage`

### Difficultés rencontrées
- La carte ne republie pas l'état d'un port qui n'a pas changé, et le backend ignore les messages des actes qui ne sont pas en cours : un câble débranché avant le début de l'Acte 3 ne serait pas détecté. Le backend suppose donc tous les câbles branchés au début de l'acte ; à prévoir dans la remise à zéro entre deux parties
- Le programme du poste n'a pas pu être compilé ni testé sur la carte, faute de matériel monté : les broches sont à adapter au panneau réel
- Le passage de `DERNIER_ACTE` à 3 change la démo du Prototype (victoire à la fin de l'Acte 2) : il faut remettre 2 pour la rejouer
- Les valeurs de game design de l'Acte 3 (port 1 seul actif, délai de 2 s, pénalité d'erreur) sont provisoires

### Objectifs pour la semaine prochaine
- Ouvrir la pull request de `feature/acte3-brassage` et la faire relire par Sékou-Oumar
- Valider avec Yassine les ports à garder et les valeurs de l'Acte 3, et le plan de câblage du décor
- Tester le poste de l'Acte 3 sur le matériel avec Bassirou
- Traiter l'Acte 4 (saisie du code final) ou la formule du score
- Vérifier le démarrage complet avec Docker (toujours à faire)

### Temps passé
- 6h
