// Acte 1 : "Alerte surcharge" (tutoriel), GDD §4.1
// Machine à états pure : elle ne connaît ni MQTT ni la base de données.
// Elle reçoit un message de capteur et renvoie la liste des effets à appliquer
// (LED à allumer, énigme résolue, jauge à baisser...). C'est la session qui les applique.
//
// Chaque énigme suit : verrouillee -> active -> resolue.
// Le badge ouvre la console et débloque les trois autres énigmes, résolues ensuite dans un ordre libre.
const config = require('../config');

const { NB_BOUTONS, BADGES_AUTORISES, SEUIL_SLIDER, SEUIL_LUMIERE, FRAGMENT, ORDRE_FRAGMENT } = config.acte1;

const VERROUILLEE = 'verrouillee';
const ACTIVE = 'active';
const RESOLUE = 'resolue';

// Identifiants des énigmes, identiques à ceux de la base (db/catalogue.js)
const CODES = {
  badge: 'acte1_badge',
  notifications: 'acte1_notifications',
  ecran: 'acte1_ecran',
  veille: 'acte1_veille',
};

// Effets renvoyés par l'acte (la session les traduit en MQTT, base de données, jauge) :
//   { type: 'enigme', code, etat }        une énigme change d'état
//   { type: 'led', numero, valeur }       LED d'une notification : 'on' (active) ou 'off' (coupée)
//   { type: 'action' }                    action utile des joueurs : la jauge baisse
//   { type: 'acte_resolu', acte, fragment, ordre }   l'acte est terminé et livre son fragment
//   { type: 'ignore', raison }            message ignoré, à journaliser

// Début de l'acte : seul le badge est actif, toutes les notifications sont actives (LED allumées)
function demarrer() {
  const etat = {
    enigmes: {
      [CODES.badge]: ACTIVE,
      [CODES.notifications]: VERROUILLEE,
      [CODES.ecran]: VERROUILLEE,
      [CODES.veille]: VERROUILLEE,
    },
    // Pour chaque bouton : true si la notification est coupée
    coupees: new Array(NB_BOUTONS).fill(false),
    // Pour chaque bouton : true si sa première coupure a déjà fait baisser la jauge
    dejaComptees: new Array(NB_BOUTONS).fill(false),
    // Dernière valeur reçue, mémorisée même quand l'énigme est verrouillée :
    // si le joueur a baissé le slider avant de badger, la carte n'enverra plus rien.
    derniereValeur: { slider: null, lumiere: null },
    resolu: false,
  };

  const effets = [];
  for (let numero = 1; numero <= NB_BOUTONS; numero++) {
    effets.push({ type: 'led', numero, valeur: 'on' });
  }
  return { etat, effets };
}

// Traite un message de capteur. `element` est la fin du topic : 'badge', 'bouton/2', 'slider', 'lumiere'.
// Modifie `etat` et renvoie la liste des effets.
function traiterMessage(etat, element, valeur) {
  const effets = [];

  if (element === 'badge') {
    traiterBadge(etat, valeur, effets);
  } else if (element.startsWith('bouton/')) {
    traiterBouton(etat, Number(element.slice('bouton/'.length)), valeur, effets);
  } else if (element === 'slider') {
    traiterCapteurASeuil(etat, 'slider', CODES.ecran, SEUIL_SLIDER, valeur, effets);
  } else if (element === 'lumiere') {
    traiterCapteurASeuil(etat, 'lumiere', CODES.veille, SEUIL_LUMIERE, valeur, effets);
  } else {
    ignorer(effets, `élément inconnu : ${element}`);
  }

  verifierFinActe(etat, effets);
  return effets;
}

// Ouverture de la console : un badge autorisé débloque les trois autres énigmes
function traiterBadge(etat, valeur, effets) {
  if (etat.enigmes[CODES.badge] !== ACTIVE) {
    return ignorer(effets, `badge : énigme ${etat.enigmes[CODES.badge]}`);
  }
  if (!BADGES_AUTORISES.includes(valeur)) {
    // Pas de pénalité : c'est le tutoriel
    return ignorer(effets, `badge non autorisé : ${valeur}`);
  }

  changerEtat(etat, CODES.badge, RESOLUE, effets);
  effets.push({ type: 'action' });

  changerEtat(etat, CODES.notifications, ACTIVE, effets);
  changerEtat(etat, CODES.ecran, ACTIVE, effets);
  changerEtat(etat, CODES.veille, ACTIVE, effets);

  // Le slider ou le capteur de lumière était peut-être déjà sous le seuil avant le badge
  verifierSeuil(etat, 'slider', CODES.ecran, SEUIL_SLIDER, effets);
  verifierSeuil(etat, 'lumiere', CODES.veille, SEUIL_LUMIERE, effets);
}

// Notifications push : chaque appui coupe ou rallume une notification
function traiterBouton(etat, numero, valeur, effets) {
  if (!Number.isInteger(numero) || numero < 1 || numero > NB_BOUTONS) {
    return ignorer(effets, `bouton inconnu : ${numero}`);
  }
  if (valeur !== 'appui') {
    return ignorer(effets, `bouton ${numero} : valeur inattendue (${valeur})`);
  }
  if (etat.enigmes[CODES.notifications] !== ACTIVE) {
    return ignorer(effets, `bouton ${numero} : énigme ${etat.enigmes[CODES.notifications]}`);
  }

  const i = numero - 1;
  etat.coupees[i] = !etat.coupees[i];
  effets.push({ type: 'led', numero, valeur: etat.coupees[i] ? 'off' : 'on' });

  // Seule la première coupure de chaque notification fait baisser la jauge,
  // sinon les joueurs pourraient couper et rallumer en boucle.
  if (etat.coupees[i] && !etat.dejaComptees[i]) {
    etat.dejaComptees[i] = true;
    effets.push({ type: 'action' });
  }

  if (etat.coupees.every((coupee) => coupee)) {
    changerEtat(etat, CODES.notifications, RESOLUE, effets);
  }
}

// Réglage de l'écran (slider) et mise en veille (capteur de lumière) :
// l'énigme est résolue quand la valeur passe sous le seuil
function traiterCapteurASeuil(etat, capteur, code, seuil, valeur, effets) {
  if (!Number.isInteger(valeur) || valeur < 0 || valeur > 100) {
    return ignorer(effets, `${capteur} : valeur hors limites (${valeur})`);
  }
  etat.derniereValeur[capteur] = valeur;

  if (etat.enigmes[code] !== ACTIVE) {
    return ignorer(effets, `${capteur} : énigme ${etat.enigmes[code]}`);
  }
  verifierSeuil(etat, capteur, code, seuil, effets);
}

function verifierSeuil(etat, capteur, code, seuil, effets) {
  const valeur = etat.derniereValeur[capteur];
  if (valeur !== null && valeur < seuil) {
    changerEtat(etat, code, RESOLUE, effets);
    effets.push({ type: 'action' });
  }
}

// L'acte est terminé quand ses 4 énigmes sont résolues : il livre son fragment (une seule fois)
function verifierFinActe(etat, effets) {
  if (etat.resolu) return;
  if (Object.values(etat.enigmes).every((e) => e === RESOLUE)) {
    etat.resolu = true;
    effets.push({ type: 'acte_resolu', acte: 1, fragment: FRAGMENT, ordre: ORDRE_FRAGMENT });
  }
}

function changerEtat(etat, code, nouvelEtat, effets) {
  etat.enigmes[code] = nouvelEtat;
  effets.push({ type: 'enigme', code, etat: nouvelEtat });
}

function ignorer(effets, raison) {
  effets.push({ type: 'ignore', raison });
}

module.exports = { CODES, VERROUILLEE, ACTIVE, RESOLUE, demarrer, traiterMessage };
