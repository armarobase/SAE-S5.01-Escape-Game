// Point d'entrée du backend
const http = require('http');
const express = require('express');
const config = require('./config');
const pool = require('./db/pool');
const { connecterMqtt } = require('./mqtt/client');
const { enregistrerMessage } = require('./mqtt/persistance');
const moteur = require('./game/moteur');
const { attacherServeurWs } = require('./websocket/serveur');

const app = express();
app.use(express.json());

// Route de test pour vérifier que le serveur tourne et que la base répond
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'erreur', db: 'indisponible' });
  }
});

app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/scores', require('./routes/scores'));

// Dernier filet : une erreur inattendue renvoie un 500 sans faire tomber le serveur
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erreur: 'JSON invalide' });
  console.error('[HTTP] Erreur :', err.message);
  res.status(500).json({ erreur: 'Erreur interne' });
});

const server = http.createServer(app);

const clientMqtt = connecterMqtt(async (topic, data) => {
  console.log(`[MQTT] ${topic}`, data);
  try {
    await enregistrerMessage(topic, data);
  } catch (err) {
    console.error('[DB] Enregistrement du message impossible :', err.message);
  }
  // Transmission à la logique de jeu (seuls les messages des capteurs sont pris en compte)
  moteur.traiterMessage(topic, data);
});

// Écrans de jeu : WebSocket sur le même port que l'API (ws://<hôte>:<port>/ws)
const ecrans = attacherServeurWs(server, moteur.etatPourEcrans);

// Les ordres aux actionneurs (LED, bargraph, état du jeu) passent par le client MQTT,
// l'état de la partie part vers les écrans
moteur.initialiser(clientMqtt, ecrans);

server.listen(config.port, () => {
  console.log(`[HTTP] Backend démarré sur http://localhost:${config.port} (écrans : ws://localhost:${config.port}/ws)`);
});
