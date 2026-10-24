// Validation des messages reçus, selon le contrat MQTT (docs/mqtt.md, sections 3 à 5).
// Un message refusé est ignoré et journalisé avec la raison : il ne doit jamais faire planter le backend.
const configJeu = require('../game/config');

// --- Vérifications de valeur ---
// Chacune renvoie null si la valeur est correcte, sinon la raison du refus.

function texteNonVide(valeur) {
  if (typeof valeur === 'string' && valeur.trim() !== '') return null;
  return `valeur invalide : ${JSON.stringify(valeur)}, attendu un texte non vide`;
}

function texteDeChiffres(valeur) {
  if (typeof valeur === 'string' && /^\d+$/.test(valeur)) return null;
  return `valeur invalide : ${JSON.stringify(valeur)}, attendu un texte de chiffres uniquement`;
}

function booleen(valeur) {
  if (typeof valeur === 'boolean') return null;
  return `valeur invalide : ${JSON.stringify(valeur)}, attendu true ou false`;
}

// Fabrique une vérification "entier entre min et max"
function entierEntre(min, max) {
  const attendu = `attendu un entier de ${min} à ${max}`;
  return (valeur) => {
    if (!Number.isInteger(valeur)) return `valeur invalide : ${JSON.stringify(valeur)}, ${attendu}`;
    if (valeur < min || valeur > max) return `valeur hors limites : ${valeur}, ${attendu}`;
    return null;
  };
}

// Fabrique une vérification "une valeur parmi une liste"
function parmi(valeursAcceptees) {
  const attendu = `attendu ${valeursAcceptees.map((v) => `"${v}"`).join(' ou ')}`;
  return (valeur) => {
    if (valeursAcceptees.includes(valeur)) return null;
    return `valeur invalide : ${JSON.stringify(valeur)}, ${attendu}`;
  };
}

// --- Règles : un topic de capteur ou de statut -> sa vérification ---

const REGLES = {
  // Section 3 : capteurs
  'datamonstre/acte1/badge': texteNonVide,
  'datamonstre/acte1/slider': entierEntre(0, 100),
  'datamonstre/acte1/lumiere': entierEntre(0, 100),
  'datamonstre/acte2/presence': booleen,
  'datamonstre/acte4/code': texteDeChiffres,
};

// Le nombre de boutons et de ports vient de config.js (valeurs encore à valider)
for (let n = 1; n <= configJeu.acte1.NB_BOUTONS; n++) {
  REGLES[`datamonstre/acte1/bouton/${n}`] = parmi(['appui']);
}
for (let n = 1; n <= configJeu.acte3.NB_PORTS; n++) {
  REGLES[`datamonstre/acte3/port/${n}`] = parmi(['branche', 'debranche']);
}

// Section 5 : statut des postes
for (let acte = 1; acte <= 4; acte++) {
  REGLES[`datamonstre/poste/acte${acte}/statut`] = parmi(['online', 'offline']);
}

// Section 4 : ordres publiés par le backend lui-même (abonné à datamonstre/#, il les reçoit aussi).
// Ils ne sont pas vérifiés ni journalisés : ils ne viennent pas des postes.
const TOPIC_ACTIONNEUR = /^datamonstre\/(acte1\/led\/\d+|acte1\/bargraph|acte3\/led\/\d+|acte4\/lcd|jeu\/etat)$/;

// Vérifie un message déjà décodé (JSON). Renvoie :
//   { statut: 'valide' }             message conforme au contrat
//   { statut: 'actionneur' }         ordre envoyé par le backend : à ignorer sans rien journaliser
//   { statut: 'refuse', raison }     message à ignorer et journaliser
function validerMessage(topic, data) {
  if (TOPIC_ACTIONNEUR.test(topic)) return { statut: 'actionneur' };

  const verifier = REGLES[topic];
  if (!verifier) return { statut: 'refuse', raison: 'topic inconnu' };

  if (data === null || typeof data !== 'object' || !('valeur' in data)) {
    return { statut: 'refuse', raison: 'champ "valeur" absent' };
  }

  const raison = verifier(data.valeur);
  if (raison) return { statut: 'refuse', raison };
  return { statut: 'valide' };
}

module.exports = { validerMessage };
