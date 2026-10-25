// Simulateur de capteurs : publie les messages du contrat MQTT comme le ferait une carte.
// Utilisation : npm start (Acte 1), npm start -- acte2 ou npm start -- invalide
// L'Acte 2 ne se joue qu'une fois l'Acte 1 résolu : lancer d'abord le mode par défaut.
const mqtt = require('mqtt');
const config = require('./config');
const scenarios = require('./scenarios');

const MODE_PAR_DEFAUT = 'acte1';
const PAUSE_MS = 2000;

function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Texte brut pour les tests de messages invalides, sinon le format du contrat
function construireMessage(etape) {
  if (etape.brut !== undefined) return etape.brut;
  return JSON.stringify({ valeur: etape.valeur, timestamp: Date.now() });
}

async function main() {
  const mode = process.argv[2] || MODE_PAR_DEFAUT;
  const etapes = scenarios[mode];
  if (!etapes) {
    console.error(`[Simulateur] Mode inconnu : "${mode}". Modes disponibles : ${Object.keys(scenarios).join(', ')}`);
    process.exit(1);
  }

  let client;
  try {
    // reconnectPeriod à 0 : en cas d'échec (mauvais mot de passe, broker éteint),
    // on s'arrête avec l'erreur au lieu de réessayer en boucle.
    // Le dernier argument (false) fait échouer la connexion dès la fermeture du socket.
    client = await mqtt.connectAsync(config.mqtt.url, {
      clientId: 'simulateur',
      username: config.mqtt.username,
      password: config.mqtt.password,
      reconnectPeriod: 0,
    }, false);
  } catch (err) {
    // Broker injoignable : Node renvoie une erreur sans message, seulement un code (ECONNREFUSED)
    console.error('[Simulateur] Connexion impossible :', err.message || err.code);
    process.exit(1);
  }
  console.log(`[Simulateur] Connecté à ${config.mqtt.url}, mode "${mode}" (${etapes.length} étapes)`);

  for (let i = 0; i < etapes.length; i++) {
    const etape = etapes[i];
    console.log(`[${i + 1}/${etapes.length}] ${etape.libelle} → ${etape.topic}`);

    // On attend la confirmation du publish avant de continuer
    await client.publishAsync(etape.topic, construireMessage(etape), { qos: etape.qos, retain: false });

    // Pas de pause après la dernière étape
    if (i < etapes.length - 1) await attendre(etape.pauseApresMs ?? PAUSE_MS);
  }

  await client.endAsync();
  console.log('[Simulateur] Scénario terminé, déconnecté.');
}

main().catch((err) => {
  console.error('[Simulateur] Erreur :', err.message);
  process.exit(1);
});
