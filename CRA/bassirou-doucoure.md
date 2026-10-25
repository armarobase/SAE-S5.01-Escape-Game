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
