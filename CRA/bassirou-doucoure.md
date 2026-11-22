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
---

**Semaine du 02/11/2026 au 08/11/2026**

Cette semaine, je n'ai pas travaillé sur le projet : je me suis concentré sur la révision des DST (devoirs surveillés), qui avaient la priorité sur cette période. Le travail que j'avais prévu de reprendre le mardi 03/11, à savoir le branchement des modules IoT sur le Connector Carrier et leur test, a donc été repoussé.

**Difficultés rencontrées**

La seule difficulté de la semaine a été le manque de temps : la préparation des DST ne m'a laissé aucun créneau pour l'Acte 1. Le planning est de ce fait décalé d'une semaine. Je compte le rattraper en enchaînant le branchement des modules, leurs tests et les essais avec le backend dès la reprise.

**Objectifs pour la semaine prochaine**

Je reprends le projet dès le début de la semaine prochaine. Je me renseignerai d'abord sur notre tuteur de projet et sur les modalités de rendu du Prototype prévu à la mi-novembre. Je clipserai ensuite la carte MKR sur le Connector Carrier, je relèverai les étiquettes des connecteurs et je testerai les modules un par un (boutons, LED, slider, capteur de lumière, lecteur RFID) en suivant les messages dans le terminal d'écoute. Je chercherai enfin l'identifiant réel d'un badge pour l'ajouter à la liste des badges autorisés du backend, puis je ferai relire et fusionner la pull request numéro 8.

---

**Semaine du 09/11/2026 au 15/11/2026**

Cette semaine, j'ai d'abord pris connaissance de notre tuteur de projet, Mme Frappat, et j'ai pris rendez-vous avec elle afin de lui présenter l'ensemble de notre projet et la manière dont nous comptons procéder par la suite. Je me suis aussi renseigné auprès de M. Giustignano sur les modalités de rendu du Prototype prévu à la mi-novembre, pour que mon travail sur l'Acte 1 corresponde à ce qui est attendu.

J'ai ensuite repris le travail sur l'IoT. Certaines pièces étaient sorties de leurs sachets : à partir de la liste du matériel, j'ai identifié chacune d'elles et je les ai remises à leur place, puis j'ai photographié l'ensemble du matériel et numéroté chaque composant pour pouvoir les retrouver plus vite. J'ai clipsé la carte MKR WiFi 1010 sur le Connector Carrier et branché les modules d'après les étiquettes des connecteurs : les trois boutons sur les connecteurs 0, 1 et 2, les LED sur 3, A4 et A3, le slider sur A1, le capteur de lumière sur A2 et le lecteur RFID sur SERIAL. Le Carrier compte en réalité 14 connecteurs Grove, et non deux ports numériques comme je le supposais au départ.

J'ai ensuite testé les modules un par un en suivant les messages dans le terminal d'écoute : les trois boutons, le slider et le capteur de lumière envoient bien leurs valeurs sur les bons topics, et les trois LED s'allument et s'éteignent quand je publie un ordre « on » ou « off » depuis le broker. Pour le lecteur RFID, j'ai lu les trois badges (bleu, rouge et vert) : chaque identifiant fait 10 caractères hexadécimaux, par exemple 1D00CC4C6E pour le badge bleu, et un seul message est envoyé par badge posé. Le Carrier alimente les modules Grove en 5 V avec une adaptation des niveaux vers 3,3 V, ce qui lève le risque de tension que j'avais signalé pour ce lecteur. Le badge bleu a été retenu comme badge officiel : je l'ai ajouté à la liste des badges autorisés du backend dans une pull request (numéro 18), fusionnée par Sékou le 10/11, en conservant le badge de test pour le simulateur.

J'ai complété la description de la pull request numéro 8 (programme de l'Acte 1, câblage réel et tests) et demandé la relecture de Sékou : elle a été fusionnée le 11/11. J'ai aussi rédigé une première version du programme du poste de l'Acte 2 (iot/acte2/acte2.ino) : la carte publie l'état du capteur de présence PIR sur datamonstre/acte2/presence à chaque changement, avec le même statut en ligne et le même Last Will que l'Acte 1, le délai d'absence de 10 secondes étant appliqué par le backend.

**Difficultés rencontrées**

La LED 2 ne répondait pas sur le connecteur 4. Après un échange de modules, j'ai vu que le module fonctionnait et que c'était le connecteur qui posait problème : je l'ai donc branchée sur A4 et j'ai adapté la ligne du programme. Mes premières commandes d'envoi vers le broker ont aussi échoué avec une erreur d'authentification, car je n'avais pas saisi le vrai mot de passe MQTT. Par ailleurs, Sékou ne voyait pas mon programme, qui se trouvait seulement sur ma branche feature/iot-acte1 et pas sur main : j'ai ouvert la relecture de la pull request pour qu'il puisse le consulter et le fusionner. Enfin, le programme de l'Acte 2 n'a pas pu être testé, le capteur PIR n'étant pas encore branché.

**Objectifs pour la semaine prochaine**

La semaine prochaine, je reprendrai les tests avec le backend et le matériel réel en suivant le guide de test rédigé par Sékou : lancer le backend et l'écran, démarrer une partie et rejouer l'Acte 1 en entier avec les vrais capteurs. Je mettrai aussi à jour le contrat MQTT (format de l'identifiant RFID, seuils et câblage) ainsi que le badge de test du simulateur, puis je testerai le programme de l'Acte 2 avec le capteur PIR.

---

**Semaine du 16/11/2026 au 22/11/2026**

Cette semaine, j'ai testé l'Acte 1 avec le vrai matériel et le backend de Sékou, en suivant son guide de test du matériel. Le 18/11, j'ai préparé mon poste : installation de Node.js (avec l'autorisation d'exécuter les scripts npm dans PowerShell), démarrage de Mosquitto et de PostgreSQL avec Docker, vérification du fichier .env, de l'adresse IP du PC dans secrets.h et de la règle de pare-feu du port 1883, puis lancement du backend et de l'écran. J'ai téléversé le programme : la carte passe bien en ligne dans le backend. J'ai relevé les valeurs réelles. Le slider va de 0 à 99, par paliers d'environ 6, ce qui correspond au seuil d'envoi de plus de 5. Le capteur de lumière donne moins de 17 dans ma pièce peu éclairée, contre 64 à 75 avec la lampe d'un téléphone. Les trois boutons envoient un seul message par appui et les trois badges sont lus avec leur bon identifiant.

Ces essais ont fait apparaître un problème de câblage sur les LED (détaillé plus bas) : je les ai déplacées sur les connecteurs 3, 4 et D5/D6 et j'ai adapté le programme en conséquence. Les trois LED s'allument et s'éteignent alors depuis le broker, et j'ai commité ce changement sur la branche feature/iot-acte1-leds (commit du 22/11). J'ai aussi relu le programme de l'Acte 2 et prévu un délai de chauffe de 30 secondes du capteur PIR avant le premier envoi.

Le 22/11, j'ai refait un test complet de l'Acte 1 pour le valider : j'ai tout éteint, puis redémarré à froid Docker, le backend, l'écran et la carte, et j'ai joué plusieurs parties. Dans la partie n°11, le journal des événements de l'API confirme chaque étape : le badge rouge (deux fois) et le badge vert sont refusés, le badge bleu est accepté et résout l'énigme « Ouverture de la console », puis les boutons 1, 2 et 3 résolvent « Notifications push ». Le fragment est collecté et l'énigme « Autoplay infini » de l'Acte 2 s'active au bout de 2 min 33 s, sans erreur comptée. J'ai toutefois remarqué que « Réglage de l'écran maquette » et « Mise en veille » s'étaient résolues quelques millisecondes après le badge, car le slider (17) et la lumière (2) étaient déjà sous leurs seuils de 20 et de 15 : ces deux énigmes n'avaient donc pas été testées de l'état non résolu à l'état résolu.

J'ai donc lancé une partie bis (n°14), dans une pièce éclairée, pour tester ce qui manquait. Après le badge bleu, le slider au-dessus de 20 (de 23 à 64) et la lumière au-dessus de 15 (de 48 à 74) ont bien laissé les deux énigmes actives. La lumière passée à 10 avec la main sur le capteur a résolu « Mise en veille », les trois boutons ont résolu « Notifications push », puis le slider ramené à 0 a résolu « Réglage de l'écran maquette ». Le jeu a alors indiqué « Acte 1 résolu, fragment collecté » et activé l'énigme de l'Acte 2. J'ai aussi constaté que le backend ignore les messages d'une énigme tant qu'elle est verrouillée, et que les LED s'allument pendant l'acte. Enfin, j'ai testé la défaite : dans la partie n°13, laissée sans aucune action, le jeu a annoncé la défaite automatiquement au bout d'environ 6 min 08 s, avec la jauge à 100 et 0 énigme sur 7 résolue, la carte restant en ligne pendant tout le test.

**Difficultés rencontrées**

Le 18/11, les LED branchées sur A4 et A3, qui fonctionnaient le 10/11, ne s'allumaient plus. J'ai d'abord vérifié que le programme contenait les bonnes broches, puis j'ai échangé les modules : les modules et leurs câbles fonctionnaient sur le connecteur 3. J'ai ensuite téléversé un programme de test qui fait clignoter les broches : seuls les connecteurs du côté numérique (D) délivrent du courant, alors que ceux du côté analogique (A) ne le font pas. Mon hypothèse est que les connecteurs A sont conçus pour lire des capteurs, ce qui est cohérent avec le slider et la lumière qui fonctionnent. La solution a été de déplacer les LED sur les connecteurs 3, 4 et D5/D6, ce qui a fonctionné.

Pour relancer un test, il fallait aussi arrêter la partie du 18/11. Le serveur répondait « Une partie est déjà en cours », même après avoir relancé le backend, car la partie est enregistrée dans la base PostgreSQL et non en mémoire. J'ai parcouru les routes du backend de Sékou et trouvé POST /api/sessions/:id/terminer, qui demande un numéro de session valide et un statut « victoire » ou « defaite » dans le corps de la requête : mes premiers essais ont échoué faute de l'un puis de l'autre. J'ai fini par clôturer la partie et en créer une nouvelle.

Enfin, plusieurs erreurs de manipulation m'ont fait perdre du temps : l'outil mosquitto_pub n'est pas installé sur Windows (j'ai envoyé les commandes depuis le conteneur Mosquitto avec docker compose), une commande lancée dans le mauvais dossier, et une ligne du programme remplacée par erreur qui a provoqué une erreur de compilation.

**Objectifs pour la semaine prochaine**

La semaine prochaine, j'ouvrirai une pull request pour la branche feature/iot-acte1-leds et je la ferai relire par Sékou, puis je mettrai à jour le contrat MQTT (format de l'identifiant RFID, seuils et nouveau câblage) et le badge de test du simulateur. Je testerai ensuite le programme de l'Acte 2 : D5/D6 étant désormais occupé par la LED 3, je brancherai le capteur PIR sur un connecteur analogique, qui sert bien à lire des capteurs, en adaptant la broche du programme, puis je vérifierai avec Sékou que le backend résout l'énigme après le délai d'absence de 10 secondes. Je lui demanderai aussi ce que représente la jauge (elle a fini à 24 dans une partie jouée et à 100 dans la partie inactive) et si les badges refusés doivent être comptés dans les erreurs.
