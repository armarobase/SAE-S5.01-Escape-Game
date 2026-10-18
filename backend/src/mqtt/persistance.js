// Enregistre en base chaque message de capteur valide (dernière valeur + journal de la partie)
const capteurs = require('../db/capteurs');
const evenements = require('../db/evenements');
const sessions = require('../db/sessions');

// Retourne true si le message a été enregistré. Un message hors contrat est ignoré et journalisé.
async function enregistrerMessage(topic, data) {
  if (!data || typeof data !== 'object' || !('valeur' in data)) {
    console.warn(`[MQTT] Message ignoré (champ "valeur" absent) sur ${topic}`);
    return false;
  }
  const capteurId = await capteurs.majDerniereValeur(topic, data.valeur);
  if (capteurId === null) {
    // Topic de sortie (led, bargraph, statut...) ou inconnu : rien à enregistrer côté capteurs
    return false;
  }
  const session = await sessions.sessionEnCours();
  if (session) {
    await evenements.enregistrerEvenement({
      sessionId: session.id,
      capteurId,
      type: 'mqtt',
      message: topic,
      donnees: { valeur: data.valeur },
    });
  }
  return true;
}

module.exports = { enregistrerMessage };
