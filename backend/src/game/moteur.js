// Moteur de jeu : relie la logique pure (session.js) au reste du backend.
// - fait avancer le temps (un tick par seconde) ;
// - transmet les messages des capteurs à la session ;
// - transforme les effets renvoyés en ordres MQTT et en écritures en base.
const session = require('./session');
const sessionsDb = require('../db/sessions');
const fragmentsDb = require('../db/fragments');
const evenementsDb = require('../db/evenements');
const scoresDb = require('../db/scores');
const actionneurs = require('../mqtt/actionneurs');

// Topics des capteurs (docs/mqtt.md, section 3). Les autres topics reçus via datamonstre/#
// (LED, bargraph, état du jeu publiés par le backend lui-même, statut des postes) ne concernent pas la session.
const TOPIC_CAPTEUR = /^datamonstre\/acte\d\/(badge|bouton\/\d+|slider|lumiere|presence|port\/\d+|code)$/;

let clientMqtt = null;
let partie = null; // partie en cours (en mémoire), ou null
let sessionId = null; // identifiant de la session en base
let timer = null;
let dernierNiveauBargraph = null;

// Les effets sont traités les uns après les autres, dans l'ordre d'arrivée,
// même si un message MQTT arrive pendant qu'une écriture en base est en cours.
let file = Promise.resolve();
function enFile(traitement) {
  file = file.then(traitement).catch((err) => console.error('[Jeu] Erreur :', err.message));
  return file;
}

// Appelé une fois au démarrage du backend
function initialiser(client) {
  clientMqtt = client;
  // Aucune partie ne tourne au démarrage : on remplace un éventuel ancien état retained
  actionneurs.publierEtatJeu(clientMqtt, 'attente', 1);
  signalerSessionOrpheline().catch((err) => console.error('[DB] Vérification des sessions impossible :', err.message));
}

// Si le backend a redémarré pendant une partie, la base la croit encore en cours, et
// aucune nouvelle partie ne peut être créée (une seule à la fois). On ne la termine pas
// automatiquement : un statut "defaite" fausserait les scores (statut "abandonnee" à prévoir en base).
async function signalerSessionOrpheline() {
  const orpheline = await sessionsDb.sessionEnCours();
  if (orpheline) {
    console.warn(`[Jeu] La session ${orpheline.id} est restée "en cours" en base (backend redémarré pendant la partie).`);
    console.warn(`[Jeu] Terminez-la avec POST /api/sessions/${orpheline.id}/terminer avant d'en lancer une nouvelle.`);
  }
}

// Lance une partie pour la session créée en base (route POST /api/sessions)
function demarrer(idSession) {
  arreter();
  sessionId = idSession;
  dernierNiveauBargraph = null;
  const debut = session.demarrerPartie();
  partie = debut.partie;
  console.log(`[Jeu] Partie ${sessionId} démarrée`);
  enFile(() => appliquerEffets(debut.effets));
  timer = setInterval(() => enFile(() => appliquerEffets(session.tick(partie))), 1000);
}

// Arrête le timer (fin de partie, ou partie terminée à la main par la route /terminer)
function arreter() {
  if (timer) clearInterval(timer);
  timer = null;
  partie = null;
  sessionId = null;
}

function idPartieEnCours() {
  return sessionId;
}

// Message reçu sur datamonstre/# : seuls les capteurs sont transmis à la session
function traiterMessage(topic, data) {
  if (!TOPIC_CAPTEUR.test(topic)) return;
  if (!partie) {
    console.warn(`[Jeu] Message ignoré (aucune partie en cours) : ${topic}`);
    return;
  }
  if (!data || typeof data !== 'object' || !('valeur' in data)) return; // déjà journalisé par persistance.js
  const effets = session.traiterMessage(partie, topic, data.valeur);
  enFile(() => appliquerEffets(effets));
}

// Traduit chaque effet en MQTT et en base
async function appliquerEffets(effets) {
  for (const effet of effets) {
    await appliquerEffet(effet);
  }
}

async function appliquerEffet(effet) {
  const id = sessionId;
  // La jauge est exacte en mémoire (ex. 40,2) mais entière en base (colonne SMALLINT) :
  // on arrondit à chaque écriture.

  switch (effet.type) {
    case 'led':
      actionneurs.publierLed(clientMqtt, effet.acte, effet.numero, effet.valeur);
      break;

    case 'jauge': {
      // Bargraph de 0 à 10 : publié seulement quand le niveau affiché change
      const niveau = Math.round(effet.valeur / 10);
      if (niveau !== dernierNiveauBargraph) {
        dernierNiveauBargraph = niveau;
        actionneurs.publierBargraph(clientMqtt, niveau);
      }
      // En base, au départ et sur une action des joueurs, mais pas à chaque seconde d'inactivité
      if (effet.cause !== 'inactivite') await sessionsDb.majJauge(id, Math.round(effet.valeur));
      break;
    }

    case 'etat_jeu':
      actionneurs.publierEtatJeu(clientMqtt, effet.statut, effet.acte);
      if (effet.statut === 'en_cours') await sessionsDb.majActeCourant(id, effet.acte);
      break;

    case 'enigme':
      await sessionsDb.majEtatEnigme(id, effet.code, effet.etat);
      await evenementsDb.enregistrerEvenement({
        sessionId: id, type: `enigme_${effet.etat}`, message: effet.code,
      });
      console.log(`[Jeu] Énigme ${effet.code} : ${effet.etat}`);
      break;

    case 'fragment':
      await fragmentsDb.ajouterFragment({
        sessionId: id, acte: effet.acte, valeur: effet.valeur, ordreAssemblage: effet.ordre,
      });
      await evenementsDb.enregistrerEvenement({
        sessionId: id, type: 'fragment_collecte', message: `acte ${effet.acte}`,
      });
      console.log(`[Jeu] Acte ${effet.acte} résolu, fragment collecté`);
      break;

    case 'fin': {
      // On arrête le timer tout de suite, puis on enregistre la jauge finale avant le score.
      // La fin est toujours le dernier effet : partie.jauge est bien la valeur finale.
      clearInterval(timer);
      timer = null;
      await sessionsDb.majJauge(id, Math.round(partie.jauge));
      const terminee = await sessionsDb.terminerSession(id, effet.statut);
      if (terminee) {
        await evenementsDb.enregistrerEvenement({
          sessionId: id, type: `session_${effet.statut}`, message: effet.raison,
        });
        await scoresDb.enregistrerScore(terminee);
      }
      console.log(`[Jeu] Partie ${id} terminée : ${effet.statut} (${effet.raison})`);
      break;
    }

    case 'ignore':
      console.warn(`[Jeu] Message ignoré : ${effet.raison}`);
      break;

    default:
      console.warn(`[Jeu] Effet inconnu : ${effet.type}`);
  }
}

module.exports = { initialiser, demarrer, arreter, idPartieEnCours, traiterMessage };
