// Serveur WebSocket pour les écrans de jeu (contrat frontend/websocket.md).
// Il partage le port de l'API REST (chemin /ws). Le canal est à sens unique :
// le serveur envoie, l'écran affiche. Les messages reçus d'un écran sont ignorés.
const { WebSocketServer, WebSocket } = require('ws');

// `fournirEtat` : fonction (async) qui renvoie le message "etat" complet à envoyer à un nouvel écran
function attacherServeurWs(serveurHttp, fournirEtat) {
  const wss = new WebSocketServer({ server: serveurHttp, path: '/ws' });

  wss.on('connection', async (socket) => {
    console.log(`[WS] Écran connecté (${wss.clients.size} au total)`);

    // L'écran affiche, il ne commande pas le jeu
    socket.on('message', () => {});
    socket.on('error', (err) => console.error('[WS] Erreur :', err.message));
    socket.on('close', () => console.log(`[WS] Écran déconnecté (${wss.clients.size} au total)`));

    // Instantané complet à chaque connexion : un écran rechargé se remet à jour tout seul
    try {
      envoyer(socket, await fournirEtat());
    } catch (err) {
      console.error('[WS] Instantané impossible :', err.message);
    }
  });

  // Envoie un message à tous les écrans connectés
  function diffuser(message) {
    for (const socket of wss.clients) envoyer(socket, message);
  }

  return { diffuser, fermer: () => wss.close() };
}

function envoyer(socket, message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

module.exports = { attacherServeurWs };
