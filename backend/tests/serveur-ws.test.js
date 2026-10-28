// Test avec un vrai serveur HTTP et de vrais clients WebSocket (sans base ni broker)
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { WebSocket } = require('ws');
const { attacherServeurWs } = require('../src/websocket/serveur');

const ETAT = { type: 'etat', serveurMs: 1, session: null, enigmes: [], narratifs: [], postes: {} };

// Démarre un serveur sur un port libre ; renvoie son adresse WebSocket
async function demarrerServeur() {
  const serveurHttp = http.createServer();
  const ecrans = attacherServeurWs(serveurHttp, async () => ETAT);
  await new Promise((resolve) => serveurHttp.listen(0, resolve));
  const url = `ws://localhost:${serveurHttp.address().port}/ws`;
  const arreter = () => new Promise((resolve) => { ecrans.fermer(); serveurHttp.close(resolve); });
  return { url, ecrans, arreter };
}

// Connecte un client et range ses messages dans un tableau ; attend son premier message
function connecter(url) {
  return new Promise((resolve, reject) => {
    const client = new WebSocket(url);
    const recus = [];
    client.on('message', (donnees) => {
      recus.push(JSON.parse(donnees.toString()));
      if (recus.length === 1) resolve({ client, recus });
    });
    client.on('error', reject);
  });
}

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('un écran qui se connecte reçoit d\'abord l\'état complet', async () => {
  const { url, arreter } = await demarrerServeur();
  const { client, recus } = await connecter(url);
  assert.deepEqual(recus[0], ETAT);
  client.close();
  await arreter();
});

test('un message est diffusé à tous les écrans connectés', async () => {
  const { url, ecrans, arreter } = await demarrerServeur();
  const ecran1 = await connecter(url);
  const ecran2 = await connecter(url);

  ecrans.diffuser({ type: 'jauge', valeur: 42 });
  await attendre(100);

  assert.deepEqual(ecran1.recus[1], { type: 'jauge', valeur: 42 });
  assert.deepEqual(ecran2.recus[1], { type: 'jauge', valeur: 42 });
  ecran1.client.close();
  ecran2.client.close();
  await arreter();
});

test('un message envoyé par un écran est ignoré sans erreur', async () => {
  const { url, ecrans, arreter } = await demarrerServeur();
  const { client, recus } = await connecter(url);

  client.send('{"type":"demarrer"}');
  client.send('pas du JSON');
  await attendre(100);

  // Le serveur n'a rien répondu et fonctionne toujours
  assert.equal(recus.length, 1);
  ecrans.diffuser({ type: 'jauge', valeur: 10 });
  await attendre(100);
  assert.deepEqual(recus[1], { type: 'jauge', valeur: 10 });
  client.close();
  await arreter();
});
