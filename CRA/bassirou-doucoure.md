# CRA - Bassirou Doucouré

Projet : Data-Monstre (SAÉ S5.01)
Rôles : IoT et capteurs, sécurité, tests

---

## Semaine du 12/10/2026 au 18/10/2026

### Réalisé cette semaine
- Lecture du GDD v1.1, du contrat MQTT (`docs/mqtt.md`) et de la liste du matériel (`docs/materiel.md`) pour identifier mes tâches : programmes des postes IoT, en commençant par l'Acte 1, et les deux points du contrat qui me sont attribués (seuil d'envoi slider/lumière, format de l'identifiant RFID)
- Liste du matériel de l'Acte 1 à récupérer le 19/10 :
  - Arduino MKR WiFi 1010 + MKR Connector Carrier
  - module RFID Grove + badges
  - 3 boutons poussoirs Grove et 3 LED Grove
  - potentiomètre rectiligne (slider) Grove et capteur de lumière Grove
  - LED bargraph Grove (optionnelle)
- Modèle des identifiants des cartes (`iot/secrets.example.h`) : WiFi, adresse du broker, compte MQTT. Chaque sketch utilise sa propre copie `secrets.h`, jamais committée (déjà exclue par le `.gitignore`)
- Premier programme du poste de l'Acte 1 (`iot/acte1/acte1.ino`), conforme au contrat MQTT :
  - connexion WiFi et MQTT authentifiée, client ID `poste-acte1`, reconnexion automatique
  - statut du poste : `online` à la connexion, Last Will `offline` (retained, QoS 1)
  - 3 boutons avec anti-rebond : un message `appui` par appui (QoS 1)
  - slider et capteur de lumière ramenés sur 0 à 100, envoyés seulement si la valeur varie de plus de 5, 5 messages par seconde au maximum (QoS 0)
  - lecteur RFID Grove 125 kHz : lecture de la trame série, vérification du checksum, un seul envoi par badge posé
  - LED pilotées uniquement par le backend (abonnement à `datamonstre/acte1/led/+`)
- Tests : vérification de la syntaxe du programme avec les bibliothèques Arduino et ArduinoMqttClient (le test sur la carte se fera avec le matériel)
- Travail livré sur la branche `feature/iot-acte1`, avec pull request pour relecture

### Difficultés rencontrées
- Pas encore de matériel en main : le programme n'a pas été testé sur la carte
- Modèle exact du lecteur RFID Grove à confirmer : le programme suppose le lecteur 125 kHz en mode série. Ce lecteur est prévu pour du 5 V alors que la MKR fonctionne en 3,3 V (risque déjà noté dans le GDD)
- Le Connector Carrier n'a que 2 ports Grove numériques : les boutons et les LED sont branchés sur des ports analogiques utilisés en numérique. L'affectation des broches est regroupée en haut du programme pour être adaptée au branchement réel

### Objectifs pour la semaine prochaine
- Récupérer le matériel de l'Acte 1 et tester le programme sur la carte, avec Mosquitto, le backend et `mosquitto_sub`
- Vérifier le module RFID (fréquence des badges, tension) et fixer avec l'équipe le format de l'identifiant ; mettre à jour `docs/mqtt.md` (§9) et le badge de test du simulateur
- Valider en conditions réelles le seuil d'envoi du slider et du capteur de lumière (variation de 5)
- Commencer le programme de l'Acte 2 (capteur de présence PIR)

### Temps passé
- 2h
