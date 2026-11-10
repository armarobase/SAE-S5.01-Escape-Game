// Poste de l'Acte 1 : "Alerte surcharge" (tutoriel)
// Carte : Arduino MKR WiFi 1010 + MKR Connector Carrier (modules Grove)
//
// Rôle de la carte (voir docs/mqtt.md) : elle envoie des faits bruts, le backend décide.
//   Capteurs   -> datamonstre/acte1/badge, /bouton/1 à 3, /slider, /lumiere
//   Actionneurs <- datamonstre/acte1/led/1 à 3 ("on" / "off")
//   Statut     -> datamonstre/poste/acte1/statut ("online", Last Will "offline")
//
// Bibliothèques (IDE Arduino 2) : WiFiNINA, ArduinoMqttClient
// Avant de téléverser : copier iot/secrets.example.h en iot/acte1/secrets.h et le remplir.

#include <WiFiNINA.h>
#include <ArduinoMqttClient.h>
#include "secrets.h"

// ---------------------------------------------------------------------------
// Câblage (à adapter au branchement réel sur le Connector Carrier)
// ---------------------------------------------------------------------------
const int NB_BOUTONS = 3;                                // docs/mqtt.md §9 : 3 boutons (à valider)
const int PIN_BOUTONS[NB_BOUTONS] = { 0, 1, 2 };      // boutons Grove : connecteurs 0, 1, 2
const int PIN_LEDS[NB_BOUTONS]    = { 3, A4, A3 };        // LED Grove : connecteurs 3, A4, A3
const int PIN_SLIDER  = A1;                              // potentiomètre rectiligne Grove
const int PIN_LUMIERE = A2;                              // capteur de lumière Grove
// Lecteur RFID Grove 125 kHz : port "SERIAL" du Carrier (Serial1, 9600 bauds)

// ---------------------------------------------------------------------------
// Réglages (docs/mqtt.md §3)
// ---------------------------------------------------------------------------
const int SEUIL_VARIATION = 5;              // on n'envoie que si la valeur bouge de plus de 5
const unsigned long INTERVALLE_MIN = 200;   // max 5 messages par seconde par capteur
const unsigned long ANTI_REBOND = 50;       // ms, pour les boutons
const unsigned long DELAI_MEME_BADGE = 2000; // le lecteur répète le badge tant qu'il est posé
const unsigned long DELAI_RECONNEXION = 5000;

const char* CLIENT_ID     = "poste-acte1";  // unique par client (docs/mqtt.md §6)
const char* TOPIC_STATUT  = "datamonstre/poste/acte1/statut";
const char* TOPIC_BADGE   = "datamonstre/acte1/badge";
const char* TOPIC_SLIDER  = "datamonstre/acte1/slider";
const char* TOPIC_LUMIERE = "datamonstre/acte1/lumiere";
const char* TOPIC_LEDS    = "datamonstre/acte1/led/+";

WiFiClient wifiClient;
MqttClient mqttClient(wifiClient);

// ---------------------------------------------------------------------------
// États mémorisés
// ---------------------------------------------------------------------------
int etatBouton[NB_BOUTONS];                 // dernier état stable
int lectureBouton[NB_BOUTONS];              // dernière lecture brute
unsigned long changementBouton[NB_BOUTONS];

struct CapteurAnalogique {
  int pin;
  const char* topic;
  int derniereValeur;          // -1 tant que rien n'a été envoyé
  unsigned long dernierEnvoi;
};
CapteurAnalogique slider  = { PIN_SLIDER,  TOPIC_SLIDER,  -1, 0 };
CapteurAnalogique lumiere = { PIN_LUMIERE, TOPIC_LUMIERE, -1, 0 };

char trameRfid[14];            // 0x02 + 10 car. données + 2 car. checksum + 0x03
int posRfid = -1;              // -1 : en attente du début de trame
String dernierBadge = "";
unsigned long dernierScan = 0;

unsigned long derniereTentative = 0;

// ---------------------------------------------------------------------------
// Envoi MQTT : tous les messages sont au format { "valeur": ... }
// ---------------------------------------------------------------------------
void publier(const char* topic, const String& valeurJson, bool retain, uint8_t qos) {
  if (!mqttClient.connected()) return;   // pas de file d'attente : le geste est perdu
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
// Réception des ordres du backend (LED)
// ---------------------------------------------------------------------------
void surMessage(int /* taille */) {
  String topic = mqttClient.messageTopic();
  String contenu = "";
  while (mqttClient.available()) {
    contenu += (char)mqttClient.read();
  }

  // Topic attendu : datamonstre/acte1/led/<numéro>
  int numero = topic.substring(topic.lastIndexOf('/') + 1).toInt();
  if (numero < 1 || numero > NB_BOUTONS) {
    Serial.println("[MQTT] Ordre ignoré (numéro de LED inconnu) : " + topic);
    return;
  }

  if (contenu.indexOf("\"on\"") >= 0) {
    digitalWrite(PIN_LEDS[numero - 1], HIGH);
  } else if (contenu.indexOf("\"off\"") >= 0) {
    digitalWrite(PIN_LEDS[numero - 1], LOW);
  } else {
    Serial.println("[MQTT] Ordre ignoré (valeur invalide) : " + contenu);
  }
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
  // Les ordres aux LED sont "retained" : on récupère tout de suite l'état courant
  mqttClient.subscribe(TOPIC_LEDS, 1);
  Serial.println("[MQTT] Connecté et abonné aux LED");
  return true;
}

void maintenirConnexions() {
  if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) return;
  if (millis() - derniereTentative < DELAI_RECONNEXION) return;
  derniereTentative = millis();
  if (connecterWifi()) connecterMqtt();
}

// ---------------------------------------------------------------------------
// Capteurs
// ---------------------------------------------------------------------------
void lireBoutons() {
  for (int i = 0; i < NB_BOUTONS; i++) {
    int lecture = digitalRead(PIN_BOUTONS[i]);
    if (lecture != lectureBouton[i]) {
      lectureBouton[i] = lecture;
      changementBouton[i] = millis();
    }
    if (millis() - changementBouton[i] > ANTI_REBOND && lecture != etatBouton[i]) {
      etatBouton[i] = lecture;
      if (lecture == HIGH) {   // bouton Grove : HIGH quand on appuie
        String topic = "datamonstre/acte1/bouton/" + String(i + 1);
        publier(topic.c_str(), texteJson("appui"), false, 1);
      }
    }
  }
}

// Valeur ramenée sur 0 à 100, envoyée seulement si elle varie de plus de 5
void lireAnalogique(CapteurAnalogique& capteur) {
  int valeur = map(analogRead(capteur.pin), 0, 1023, 0, 100);
  bool variation = capteur.derniereValeur < 0 || abs(valeur - capteur.derniereValeur) > SEUIL_VARIATION;
  if (variation && millis() - capteur.dernierEnvoi >= INTERVALLE_MIN && mqttClient.connected()) {
    capteur.derniereValeur = valeur;
    capteur.dernierEnvoi = millis();
    publier(capteur.topic, String(valeur), false, 0);
  }
}

int hexVersEntier(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'A' && c <= 'F') return c - 'A' + 10;
  if (c >= 'a' && c <= 'f') return c - 'a' + 10;
  return -1;
}

// Trame du lecteur Grove 125 kHz (mode UART) :
// 0x02 | 10 caractères hexa (identifiant) | 2 caractères hexa (checksum) | 0x03
void traiterTrameRfid() {
  int controle = 0;
  for (int i = 1; i <= 9; i += 2) {
    int octet = hexVersEntier(trameRfid[i]) * 16 + hexVersEntier(trameRfid[i + 1]);
    controle ^= octet;
  }
  int checksum = hexVersEntier(trameRfid[11]) * 16 + hexVersEntier(trameRfid[12]);
  if (controle != checksum) {
    Serial.println("[RFID] Trame ignorée (checksum incorrect)");
    return;
  }

  String badge = "";
  for (int i = 1; i <= 10; i++) badge += trameRfid[i];

  // Le lecteur renvoie le badge en boucle tant qu'il est posé : un seul envoi
  if (badge == dernierBadge && millis() - dernierScan < DELAI_MEME_BADGE) {
    dernierScan = millis();
    return;
  }
  dernierBadge = badge;
  dernierScan = millis();
  publier(TOPIC_BADGE, texteJson(badge), false, 1);
}

void lireRfid() {
  while (Serial1.available()) {
    char c = Serial1.read();
    if (c == 0x02) {               // début de trame
      posRfid = 0;
    }
    if (posRfid < 0) continue;
    trameRfid[posRfid++] = c;
    if (posRfid == 14) {
      if (trameRfid[13] == 0x03) traiterTrameRfid();
      posRfid = -1;
    }
  }
}

// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(9600);
  Serial1.begin(9600);             // lecteur RFID

  for (int i = 0; i < NB_BOUTONS; i++) {
    pinMode(PIN_BOUTONS[i], INPUT);
    pinMode(PIN_LEDS[i], OUTPUT);
    digitalWrite(PIN_LEDS[i], LOW);   // en attente des ordres du backend
    etatBouton[i] = lectureBouton[i] = digitalRead(PIN_BOUTONS[i]);
    changementBouton[i] = 0;
  }

  mqttClient.onMessage(surMessage);
  if (connecterWifi()) connecterMqtt();   // premier essai immédiat
  derniereTentative = millis();
}

void loop() {
  maintenirConnexions();
  mqttClient.poll();               // garde la connexion vivante et reçoit les ordres

  lireBoutons();
  lireAnalogique(slider);
  lireAnalogique(lumiere);
  lireRfid();
}
