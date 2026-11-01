**CRA Bassirou Doucoure**

Projet : Data-Monstre (SAÉ S5.01)

Rôles : IoT et capteurs, sécurité, tests

---

**Semaine du 12/10/2026 au 18/10/2026**

Cette semaine, j'ai commencé par relire le GDD v1.1, le contrat MQTT et la liste du matériel afin de bien cerner mes tâches. Je suis chargé des programmes des postes IoT, en commençant par l'Acte 1, ainsi que de deux points du contrat MQTT : le seuil d'envoi du slider et du capteur de lumière, et le format de l'identifiant des badges RFID.

J'ai ensuite listé le matériel de l'Acte 1 que je récupère le 19/10 : une carte Arduino MKR WiFi 1010 avec son MKR Connector Carrier, le module RFID Grove et ses badges, trois boutons poussoirs et trois LED Grove, le potentiomètre rectiligne (slider), le capteur de lumière et, en option, la LED bargraph.

Côté code, j'ai rédigé le modèle des identifiants des cartes (iot/secrets.example.h), qui regroupe le WiFi, l'adresse du broker et le compte MQTT. Chaque programme utilise sa propre copie secrets.h, qui n'est jamais envoyée sur GitHub.

J'ai aussi écrit une première version du programme du poste de l'Acte 1 (iot/acte1/acte1.ino), conforme au contrat MQTT. La carte se connecte au WiFi puis au broker avec authentification, et se reconnecte toute seule en cas de coupure. Elle signale qu'elle est en ligne et, grâce au Last Will, le broker annonce automatiquement sa déconnexion si elle tombe en panne. Chaque appui sur un bouton envoie un message, avec un anti-rebond pour éviter les doubles appuis. Le slider et le capteur de lumière envoient une valeur entre 0 et 100 seulement quand elle varie de plus de 5, sans dépasser cinq messages par seconde. Le lecteur RFID vérifie chaque badge lu et ne l'envoie qu'une seule fois tant qu'il reste posé. Enfin, les LED sont commandées uniquement par le backend.

J'ai vérifié la syntaxe du programme avec les bibliothèques Arduino et ArduinoMqttClient ; le test sur la carte se fera avec le matériel. Le travail est sur la branche feature/iot-acte1, avec une pull request (numéro 8) pour que l'équipe le relise.

**Difficultés rencontrées**

N'ayant pas encore le matériel en main, je n'ai pas pu tester le programme sur la carte. Le modèle exact du lecteur RFID reste aussi à confirmer : le programme suppose le lecteur Grove 125 kHz en liaison série, prévu pour du 5 V alors que la MKR fonctionne en 3,3 V (risque déjà noté dans le GDD). Par ailleurs, le Connector Carrier ne propose que deux ports Grove numériques : j'ai donc prévu de brancher les boutons et les LED sur des ports analogiques utilisés en numérique, et j'ai regroupé l'affectation des broches en haut du programme pour pouvoir l'adapter facilement au câblage réel.

**Objectifs pour la semaine prochaine**

La semaine prochaine, je vais récupérer le matériel de l'Acte 1 et tester le programme sur la carte avec Mosquitto et le backend. Je vérifierai aussi le module RFID (fréquence des badges et tension) pour fixer avec l'équipe le format de l'identifiant, puis mettre à jour le contrat MQTT et le badge de test du simulateur. Je validerai en conditions réelles le seuil d'envoi du slider et du capteur de lumière, et je commencerai le programme de l'Acte 2 avec le capteur de présence PIR.

---

**Semaine du 19/10/2026 au 25/10/2026**

Cette semaine, j'ai contrôlé la liste du matériel IoT à récupérer pour le projet, en vérifiant pour chaque pièce à quel acte elle servirait. Cela m'a permis de confirmer ce qui est indispensable à chacun des quatre actes, ce qui est optionnel et ce qui manque encore à l'inventaire.

J'ai ensuite fixé un rendez-vous avec le professeur le vendredi 23 octobre à 11h pour récupérer le matériel.

**Objectifs pour la semaine prochaine**

À partir de la semaine prochaine, je m'occupe de tout ce qui concerne le branchement du matériel IoT et sa connexion avec le backend.

---

**Semaine du 26/10/2026 au 01/11/2026**

Cette semaine, j'ai commencé par contrôler le matériel récupéré et par identifier chaque pièce. J'ai notamment vérifié que la carte à utiliser pour l'Acte 1 est bien la MKR WiFi 1010, et que l'Ethernet Shield 2 ne lui est pas destinée : elle servira à l'Acte 3, avec la carte Mega. J'ai aussi relu le code du backend (la logique de jeu, la validation des messages MQTT et la démonstration du Prototype) pour vérifier que mon programme respecte les seuils et les formats attendus : seuil du slider à 20, seuil de la lumière à 15, trois boutons, et un délai d'absence de 10 secondes.

J'ai ensuite préparé mon poste de travail. J'ai cloné le dépôt sur mon PC, puis j'ai intégré la branche main dans ma branche feature/iot-acte1 afin de travailler sur la version la plus récente du projet.

J'ai installé Docker Desktop, créé le fichier .env avec le compte MQTT, puis lancé avec docker compose le broker Mosquitto et la base PostgreSQL. J'ai relevé l'adresse IPv4 de mon PC sur le réseau de la box et ajouté une règle de pare-feu pour autoriser le port 1883, afin que la carte puisse joindre le broker. Un terminal d'écoute (mosquitto_sub) me permet de voir passer tous les messages du projet, et le broker et la base démarrent correctement.

Côté Arduino, j'ai installé l'IDE Arduino 2.3.10, le paquet de cartes SAMD, puis les bibliothèques WiFiNINA et ArduinoMqttClient. J'ai créé mon fichier secrets.h à partir du modèle, avec le WiFi en 2,4 GHz, l'adresse du broker et le compte MQTT. Le programme de l'Acte 1 compile, je l'ai téléversé sur la carte, et elle se connecte bien au WiFi puis au broker. Le moniteur série montre les messages publiés (par exemple sur datamonstre/acte1/slider), et ils arrivent bien dans le terminal d'écoute.

**Difficultés rencontrées**

Plusieurs étapes ont été bloquantes. Le clonage du dépôt privé a d'abord échoué car GitHub n'accepte plus le mot de passe : j'ai configuré le gestionnaire d'identifiants Git et me suis connecté par le navigateur. L'installation de Docker Desktop a échoué à deux reprises, d'abord parce que la fonctionnalité Virtual Machine Platform n'était pas activée (installation de WSL nécessaire), puis avec l'erreur « Data Error » qui m'a obligé à retélécharger l'installateur. Lors de la compilation, il manquait les bibliothèques WiFiNINA et ArduinoMqttClient, dont l'installation avait été interrompue, et je les ai réinstallées depuis le gestionnaire de bibliothèques. Mon PC a aussi redémarré en cours de route, ce qui m'a obligé à relancer Docker, le terminal d'écoute et le téléversement.

Sur le réseau, mon PC est en Ethernet alors que la carte est en WiFi : j'ai dû vérifier que les deux sont sur la même box, que le WiFi est bien en 2,4 GHz (la carte ne gère pas le 5 GHz) et utiliser l'adresse IP de mon PC comme adresse du broker. J'ai également confondu au début l'Ethernet Shield 2 avec la MKR WiFi 1010, ce qui m'a fait perdre un peu de temps avant de retrouver les bonnes boîtes.

Enfin, comme aucun module n'est encore branché, les entrées analogiques flottent et envoient des valeurs aléatoires : c'est normal à ce stade mais cela rend les messages du slider et de la lumière inutilisables pour l'instant. Je me suis aussi rendu compte que le Connector Carrier présente plus de connecteurs que ce que je pensais la semaine du 12/10 ; je vérifierai les étiquettes sur le matériel pour corriger l'affectation des broches si besoin.

**Objectifs pour la semaine prochaine**

Je n'ai pas pu aller plus loin cette semaine à cause de la révision des partiels. Je reprends le mardi 03/11 à l'étape du branchement des modules. Je commencerai par clipser la carte MKR sur le Connector Carrier, puis je relèverai les étiquettes des connecteurs en photo pour associer chaque module à la bonne broche et corriger les broches en haut du programme si nécessaire.

Je testerai ensuite les modules un par un en suivant les messages dans le terminal d'écoute : les trois boutons, les trois LED (commandées en publiant un ordre « on » ou « off » depuis le broker), le slider et le capteur de lumière, pour lesquels je relèverai les valeurs réelles afin de valider les seuils d'envoi, puis le lecteur RFID. Pour le RFID, je vérifierai la fréquence du lecteur, la tension d'alimentation par rapport au 3,3 V de la MKR et le format de l'identifiant lu.

Une fois les modules validés, je lancerai le backend (npm install, tests, puis npm run dev), je vérifierai qu'il répond sur son adresse de santé et que l'écran s'ouvre, puis je lancerai une partie. Je passerai un badge pour récupérer son identifiant réel, que j'ajouterai à la liste des badges autorisés du backend (fichier de Sékou, via une pull request), et je rejouerai l'Acte 1 en entier avec le matériel pour vérifier que le backend réagit comme prévu.

Pour terminer, je pousserai mes corrections sur la branche feature/iot-acte1 et je ferai relire puis fusionner la pull request numéro 8. Je mettrai aussi à jour le contrat MQTT (format de l'identifiant RFID et seuils) et le badge de test du simulateur, puis je commencerai le programme de l'Acte 2 avec le capteur de présence PIR, en vue du Prototype de la mi-novembre.
