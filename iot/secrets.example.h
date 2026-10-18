// Modèle des identifiants des cartes Arduino.
//
// Utilisation : copier ce fichier dans le dossier du sketch sous le nom
// "secrets.h" (ex. iot/acte1/secrets.h), puis remplacer les valeurs "changer-moi".
// L'IDE Arduino ne compile que les fichiers du dossier du sketch, d'où une copie par poste.
//
// Le fichier secrets.h n'est jamais committé (voir .gitignore : iot/**/secrets.h).
// Les identifiants MQTT doivent être les mêmes que dans le fichier .env (MQTT_USERNAME / MQTT_PASSWORD).

#ifndef SECRETS_H
#define SECRETS_H

// Réseau WiFi de la salle
#define SECRET_WIFI_SSID     "changer-moi"
#define SECRET_WIFI_PASSWORD "changer-moi"

// Broker Mosquitto (adresse IP du Raspberry Pi ou du PC qui fait tourner docker compose)
#define SECRET_MQTT_HOST     "192.168.1.10"
#define SECRET_MQTT_PORT     1883

// Compte MQTT (allow_anonymous false dans mosquitto.conf)
#define SECRET_MQTT_USERNAME "datamonstre"
#define SECRET_MQTT_PASSWORD "changer-moi"

#endif
