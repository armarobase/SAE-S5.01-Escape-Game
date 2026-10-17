# Matériel IoT

Le GDD v1.0 prévoyait des ESP32, des contacts reed, des LED bicolores et un clavier matriciel 4x4, qui ne font pas partie du matériel disponible. Ce document liste le matériel réellement utilisé, poste par poste.

## Serveur

| Équipement | Quantité | Rôle |
|---|---|---|
| Raspberry Pi 3B+ | 1 | Héberge le broker Mosquitto (et éventuellement le backend) |

## Acte 1 : "Alerte surcharge"

| Équipement | Quantité | Rôle |
|---|---|---|
| Arduino MKR WiFi 1010 | 1 | Carte du poste (WiFi + MQTT) |
| MKR Connector Carrier | 1 | Branchement des modules Grove |
| RFID Grove + badges | 1 | Badge technicien |
| Bouton poussoir Grove | 3 | Couper les notifications (remplace les interrupteurs) |
| LED Grove | 3 | État de chaque notification |
| Potentiomètre rectiligne Grove | 1 | Luminosité de l'écran |
| Capteur de lumière Grove | 1 | Mise en veille (remplace la photorésistance) |
| LED jauge (bargraph) Grove | 1 | Optionnel : jauge affichée sur le poste |

## Acte 2 : "La salle de visionnage"

| Équipement | Quantité | Rôle |
|---|---|---|
| Arduino MKR WiFi 1010 | 1 | Carte du poste |
| MKR Connector Carrier | 1 | Branchement des modules Grove |
| Présence infrarouge (PIR) Grove | 1 | Détection de l'absence des joueurs |

## Acte 3 : "La salle de brassage"

| Équipement | Quantité | Rôle |
|---|---|---|
| Arduino Mega | 1 | Carte du poste (nombreuses broches) |
| Arduino Ethernet Shield | 1 | Connexion réseau filaire |
| LED rouge Grove | 4 | Port inactif |
| LED verte Grove | 4 | Port actif |
| Fils de prototypage | selon besoin | Boucles de câbles (remplacent les contacts reed) |

## Acte 4 : "Code d'autorisation"

| Équipement | Quantité | Rôle |
|---|---|---|
| Arduino MKR WiFi 1010 | 1 | Carte du poste |
| MKR Connector Carrier | 1 | Branchement des modules Grove |
| Joystick Grove | 1 | Choix des chiffres (remplace le clavier 4x4) |
| Afficheur LCD Grove | 1 | Affichage du code saisi |
| Matrice LED 8x8 Grove | 1 | Optionnel : tête du monstre |

## Points à vérifier

- Nombre d'exemplaires disponibles de chaque carte et module
- Fréquence des badges compatibles avec le module RFID Grove et tension d'alimentation (la MKR fonctionne en 3,3 V)
- Nombre exact de boutons (Acte 1) et de ports (Acte 3), à fixer avec le game design
