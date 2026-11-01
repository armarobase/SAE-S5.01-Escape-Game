// Connexion au broker Mosquitto et abonnement à tous les topics du jeu
const mqtt = require('mqtt');
const config = require('../config');
const { validerMessage } = require('./validation');

const TOPIC_JEU = 'datamonstre/#';

function connecterMqtt(onMessage) {
  const client = mqtt.connect(config.mqtt.url, {
    // Identifiant unique (docs/mqtt.md section 6) : deux clients avec le même se déconnectent en boucle
    clientId: 'backend',
    username: config.mqtt.username,
    password: config.mqtt.password,
  });

  client.on('connect', () => {
    console.log(`[MQTT] Connecté à ${config.mqtt.url}`);
    client.subscribe(TOPIC_JEU, (err) => {
      if (err) console.error('[MQTT] Abonnement impossible :', err.message);
      else console.log(`[MQTT] Abonné à ${TOPIC_JEU}`);
    });
  });

  client.on('message', (topic, payload) => {
    let data;
    try {
      data = JSON.parse(payload.toString());
    } catch {
      // Un message mal formé ne doit pas faire planter le backend
      console.warn(`[MQTT] Message ignoré (JSON invalide) sur ${topic}`);
      return;
    }

    // Topic, champ "valeur", type et limites de la valeur (voir validation.js)
    const resultat = validerMessage(topic, data);
    if (resultat.statut === 'actionneur') return;
    if (resultat.statut === 'refuse') {
      console.warn(`[MQTT] Message ignoré (${resultat.raison}) sur ${topic}`);
      return;
    }
    onMessage(topic, data);
  });

  client.on('error', (err) => console.error('[MQTT] Erreur :', err.message));

  return client;
}

module.exports = { connecterMqtt };
