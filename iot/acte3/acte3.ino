// Poste de l'Acte 3 : "La salle de brassage"
// Carte : Arduino Mega + Arduino Ethernet Shield (connexion filaire)
//
// Rôle de la carte (voir docs/mqtt.md) : elle envoie des faits bruts, le backend décide.
//   Capteurs    -> datamonstre/acte3/port/1 à 4 ("branche" / "debranche")
//   Actionneurs <- datamonstre/acte3/led/1 à 4 ("vert" / "rouge" / "eteint")
//   Statut      -> datamonstre/poste/acte3/statut ("online", Last Will "offline")
//
// Chaque port est une boucle de câble : le câble branché ferme le circuit entre la broche du
// port et la masse (GND). La broche est en INPUT_PULLUP : LOW = branché, HIGH = débranché.
// Chaque port a une LED verte et une LED rouge, jamais allumées ensemble.
//
// Bibliothèques (IDE Arduino 2) : Ethernet, ArduinoMqttClient
// Avant de téléverser : copier iot/secrets.example.h en iot/acte3/secrets.h et le remplir
// (seuls SECRET_MQTT_* servent ici : la carte n'utilise pas le WiFi).
//
// Programme non testé sur la carte : à valider avec le panneau de brassage monté (docs/test-materiel.md).

#include <SPI.h>
#include <Ethernet.h>
#include <ArduinoMqttClient.h>
#include "secrets.h"

// ---------------------------------------------------------------------------
// Câblage (à adapter au montage réel). L'Ethernet Shield occupe les broches 4, 10, 50 à 53.
// ---------------------------------------------------------------------------
const int NB_PORTS = 4;                                     // docs/mqtt.md §9 : 4 ports (à valider)
const int PIN_PORTS[NB_PORTS]      = { 22, 23, 24, 25 };    // boucles de câble
const int PIN_LED_VERTE[NB_PORTS]  = { 30, 31, 32, 33 };
const int PIN_LED_ROUGE[NB_PORTS]  = { 34, 35, 36, 37 };

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------
// Adresse MAC de l'Ethernet Shield : celle écrite sur l'étiquette de la carte, sinon une valeur
// unique sur le réseau local.
byte MAC[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0x03 };

const unsigned long ANTI_REBOND = 50;        // ms : un contact doit rester stable avant d'être pris en compte
const unsigned long DELAI_RECONNEXION = 5000;

const char* CLIENT_ID     = "poste-acte3";   // unique par client (docs/mqtt.md §6)
const char* TOPIC_STATUT  = "datamonstre/poste/acte3/statut";
const char* TOPIC_LEDS    = "datamonstre/acte3/led/+";

EthernetClient reseau;
MqttClient mqttClient(reseau);

// ---------------------------------------------------------------------------
// États mémorisés
// ---------------------------------------------------------------------------
int etatPort[NB_PORTS];                      // dernier état stable (LOW = branché)
int lecturePort[NB_PORTS];                   // dernière lecture brute
unsigned long changementPort[NB_PORTS];
bool etatInitialPublie = false;              // l'état de tous les ports a-t-il été envoyé depuis la connexion ?

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

void publierPort(int i) {
  String topic = "datamonstre/acte3/port/" + String(i + 1);
  publier(topic.c_str(), texteJson(etatPort[i] == LOW ? "branche" : "debranche"), false, 1);
}

// État de tous les ports : à chaque (re)connexion, pour que le backend connaisse la situation
void publierEtatInitial() {
  for (int i = 0; i < NB_PORTS; i++) publierPort(i);
  etatInitialPublie = true;
}

// ---------------------------------------------------------------------------
// Réception des ordres du backend (LED)
// ---------------------------------------------------------------------------
void allumerLed(int i, bool verte, bool rouge) {
  digitalWrite(PIN_LED_VERTE[i], verte ? HIGH : LOW);
  digitalWrite(PIN_LED_ROUGE[i], rouge ? HIGH : LOW);
}

void surMessage(int /* taille */) {
  String topic = mqttClient.messageTopic();
  String contenu = "";
  while (mqttClient.available()) {
    contenu += (char)mqttClient.read();
  }

  // Topic attendu : datamonstre/acte3/led/<numéro>
  int numero = topic.substring(topic.lastIndexOf('/') + 1).toInt();
  if (numero < 1 || numero > NB_PORTS) {
    Serial.println("[MQTT] Ordre ignoré (numéro de LED inconnu) : " + topic);
    return;
  }

  int i = numero - 1;
  if (contenu.indexOf("\"vert\"") >= 0) {
    allumerLed(i, true, false);
  } else if (contenu.indexOf("\"rouge\"") >= 0) {
    allumerLed(i, false, true);
  } else if (contenu.indexOf("\"eteint\"") >= 0) {
    allumerLed(i, false, false);
  } else {
    Serial.println("[MQTT] Ordre ignoré (valeur invalide) : " + contenu);
  }
}

// ---------------------------------------------------------------------------
// Connexions réseau et MQTT (avec reconnexion automatique)
// ---------------------------------------------------------------------------
bool demarrerEthernet() {
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    Serial.println("[Ethernet] Shield introuvable");
    return false;
  }
  if (Ethernet.linkStatus() == LinkOFF) {
    Serial.println("[Ethernet] Câble réseau débranché");
    return false;
  }
  if (Ethernet.localIP() != IPAddress(0, 0, 0, 0)) return true;   // déjà configuré

  Serial.println("[Ethernet] Demande d'une adresse (DHCP)");
  if (Ethernet.begin(MAC) == 0) {
    Serial.println("[Ethernet] Échec du DHCP, nouvel essai plus tard");
    return false;
  }
  Serial.print("[Ethernet] Connecté, IP : ");
  Serial.println(Ethernet.localIP());
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
  publierEtatInitial();
  Serial.println("[MQTT] Connecté, abonné aux LED, état des ports envoyé");
  return true;
}

void maintenirConnexions() {
  Ethernet.maintain();   // renouvelle le bail DHCP
  if (mqttClient.connected()) return;
  etatInitialPublie = false;
  if (millis() - derniereTentative < DELAI_RECONNEXION) return;
  derniereTentative = millis();
  if (demarrerEthernet()) connecterMqtt();
}

// ---------------------------------------------------------------------------
// Capteurs : boucles de câble, avec anti-rebond
// ---------------------------------------------------------------------------
void lirePorts() {
  for (int i = 0; i < NB_PORTS; i++) {
    int lecture = digitalRead(PIN_PORTS[i]);
    if (lecture != lecturePort[i]) {
      lecturePort[i] = lecture;
      changementPort[i] = millis();
    }
    if (millis() - changementPort[i] > ANTI_REBOND && lecture != etatPort[i]) {
      etatPort[i] = lecture;
      publierPort(i);
    }
  }
}

// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(9600);
  for (int i = 0; i < NB_PORTS; i++) {
    pinMode(PIN_PORTS[i], INPUT_PULLUP);
    pinMode(PIN_LED_VERTE[i], OUTPUT);
    pinMode(PIN_LED_ROUGE[i], OUTPUT);
    allumerLed(i, false, false);   // éteintes jusqu'au premier ordre du backend
    etatPort[i] = digitalRead(PIN_PORTS[i]);
    lecturePort[i] = etatPort[i];
    changementPort[i] = millis();
  }

  mqttClient.onMessage(surMessage);
  Serial.println("[Acte 3] Poste de brassage démarré");
}

void loop() {
  maintenirConnexions();
  if (mqttClient.connected()) mqttClient.poll();
  lirePorts();
}
