// Point d'entrée du backend
const http = require('http');
const express = require('express');
const config = require('./config');
const { connecterMqtt } = require('./mqtt/client');

const app = express();
app.use(express.json());

// Route de test pour vérifier que le serveur tourne
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);

connecterMqtt((topic, data) => {
  console.log(`[MQTT] ${topic}`, data);
  // TODO : transmettre le message à la machine à états de l'acte concerné (game/actes)
});

server.listen(config.port, () => {
  console.log(`[HTTP] Backend démarré sur http://localhost:${config.port}`);
});
