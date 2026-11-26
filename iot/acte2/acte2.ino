// Poste de l'Acte 2 : "Autoplay infini" (détection de présence)
// Carte : Arduino MKR WiFi 1010 + MKR Connector Carrier (module Grove PIR)
//
// Rôle de la carte (voir docs/mqtt.md) : elle envoie l'état brut du capteur, le backend décide.
//   Capteur -> datamonstre/acte2/presence  ({ "valeur": true } ou false, à chaque changement d'état, QoS 1)
//   Statut  -> datamonstre/poste/acte2/statut ("online", Last Will "offline")
//
// Le délai avant de considérer la salle vide (DELAI_ABSENCE_S) est appliqué par le backend,
// pas par la carte : ici on ne fait que publier l'état du capteur quand il change.
//
// Bibliothèques (IDE Arduino 2) : WiFiNINA, ArduinoMqttClient
// Avant de téléverser : copier iot/acte1/secrets.h en iot/acte2/secrets.h (jamais commité).

#include <WiFiNINA.h>
#include <ArduinoMqttClient.h>
#include "secrets.h"

// ---------------------------------------------------------------------------
// Câblage (à adapter au branchement réel sur le Connector Carrier)
// ---------------------------------------------------------------------------
const int PIN_PIR = 5;   // capteur PIR Grove : connecteur "D5/D6" du Carrier (signal sur D5)

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------
const unsigned long ANTI_REBOND = 200;        // ms : on ignore les changements plus courts
const unsigned long DELAI_RECONNEXION = 5000; // ms entre deux tentatives de connexion
const unsigned long DELAI_CHAUFFE = 30000;    // ms : le PIR se stabilise après la mise sous tension, rien n'est publié avant

const char* CLIENT_ID      = "poste-acte2";   // unique par client (docs/mqtt.md §6)
const char* TOPIC_STATUT   = "datamonstre/poste/acte2/statut";
const char* TOPIC_PRESENCE = "datamonstre/acte2/presence";

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);

// ---------------------------------------------------------------------------
// États mémorisés
// ---------------------------------------------------------------------------
int lecturePir = LOW;               // dernière lecture brute
int etatStable = LOW;               // dernier état stable (après anti-rebond)
unsigned long changementPir = 0;    // moment du dernier changement de lecture
int etatPublie = -1;                // dernier état envoyé : -1 = rien envoyé depuis la connexion

unsigned long derniereTentative = 0;

// ---------------------------------------------------------------------------
// Envoi MQTT : tous les messages sont au format { "valeur": ... }
// ---------------------------------------------------------------------------
void publier(const char* topic, const String& valeurJson, bool retain, uint8_t qos) {
  if (!mqttClient.connected()) return;   // pas de file d'attente : le changement est repris à la reconnexion
  mqttClient.beginMessage(topic, retain, qos);
  mqttClient.print("{\"valeur\":");
  mqttClient.print(valeurJson);
  mqttClient.print("}");
  mqttClient.endMessage();
  Serial.print("[MQTT] -> ");
  Serial.print(topic);
  Serial.print(" ");
  Serial.println(valeurJson);
}

String texteJson(const String& texte) {
  return "\"" + texte + "\"";
}

// ---------------------------------------------------------------------------
// Connexions WiFi et MQTT (avec reconnexion automatique)
// ---------------------------------------------------------------------------
bool connecterWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  Serial.print("[WiFi] Connexion à ");
  Serial.println(SECRET_WIFI_SSID);
  WiFi.begin(SECRET_WIFI_SSID, SECRET_WIFI_PASSWORD);
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Échec, nouvel essai plus tard");
    return false;
  }
  Serial.print("[WiFi] Connecté, IP : ");
  Serial.println(WiFi.localIP());
  return true;
}

bool connecterMqtt() {
  mqttClient.setId(CLIENT_ID);
  mqttClient.setUsernamePassword(SECRET_MQTT_USERNAME, SECRET_MQTT_PASSWORD);

  // Testament : publié par le broker si la carte disparaît sans prévenir
  mqttClient.beginWill(TOPIC_STATUT, true, 1);
  mqttClient.print("{\"valeur\":\"offline\"}");
  mqttClient.endWill();

  Serial.print("[MQTT] Connexion à ");
  Serial.println(SECRET_MQTT_HOST);
  if (!mqttClient.connect(SECRET_MQTT_HOST, SECRET_MQTT_PORT)) {
    // -2 : refusé (souvent mauvais identifiants), -1 : broker injoignable
    Serial.print("[MQTT] Échec, code ");
    Serial.println(mqttClient.connectError());
    return false;
  }

  publier(TOPIC_STATUT, texteJson("online"), true, 1);
  etatPublie = -1;   // après (re)connexion, on renvoie une fois l'état courant du capteur
  Serial.println("[MQTT] Connecté");
  return true;
}

void maintenirConnexions() {
  if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) return;
  if (millis() - derniereTentative < DELAI_RECONNEXION) return;
  derniereTentative = millis();
  if (connecterWifi()) connecterMqtt();
}

// ---------------------------------------------------------------------------
// Capteur de présence : on n'envoie rien tant que l'état ne change pas
// ---------------------------------------------------------------------------
void lirePir() {
  if (millis() < DELAI_CHAUFFE) {   // chauffe du PIR : on suit sa lecture sans rien publier
    lecturePir = etatStable = digitalRead(PIN_PIR);
    changementPir = millis();
    return;
  }

  int lecture = digitalRead(PIN_PIR);
  if (lecture != lecturePir) {
    lecturePir = lecture;
    changementPir = millis();
  }
  if (millis() - changementPir > ANTI_REBOND) {
    etatStable = lecture;
  }

  if (mqttClient.connected() && etatStable != etatPublie) {
    // PIR Grove : HIGH quand un mouvement est détecté
    publier(TOPIC_PRESENCE, etatStable == HIGH ? "true" : "false", false, 1);
    etatPublie = etatStable;
  }
}

// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(9600);
  pinMode(PIN_PIR, INPUT);
  lecturePir = etatStable = digitalRead(PIN_PIR);
  changementPir = 0;

  if (connecterWifi()) connecterMqtt();   // premier essai immédiat
  derniereTentative = millis();
}

void loop() {
  maintenirConnexions();
  mqttClient.poll();   // garde la connexion vivante

  lirePir();
}