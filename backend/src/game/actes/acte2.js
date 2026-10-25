// Acte 2 : "La salle de visionnage", GDD §4.1
// Machine à états pure : elle ne connaît ni MQTT ni la base de données.
//
// Énigme unique, "Autoplay infini" : tant qu'un joueur reste devant l'écran, le système croit
// que quelqu'un regarde et ne propose jamais d'arrêter la vidéo. Les joueurs doivent s'éloigner
// pour que le capteur de présence (PIR) ne voie plus personne.
//
// Le capteur envoie l'état brut (true / false) à chaque changement ; c'est cet acte qui applique
// le délai d'absence (docs/mqtt.md §3). Le temps lui est donné par tick(), appelé chaque seconde
// par la session, comme pour la jauge.
//
// Deux règles évitent de résoudre l'énigme sans que les joueurs aient rien fait :
//  - l'absence ne compte qu'après avoir vu une présence (le PIR n'envoie rien tant que rien ne change) ;
//  - la moindre présence détectée pendant le délai remet le compte à zéro.
const config = require('../config');

const { DELAI_ABSENCE_S, FRAGMENT, ORDRE_FRAGMENT } = config.acte2;

const VERROUILLEE = 'verrouillee';
const ACTIVE = 'active';
const RESOLUE = 'resolue';

// Identifiant de l'énigme, identique à celui de la base (db/catalogue.js)
const CODES = { autoplay: 'acte2_autoplay' };

// Effets renvoyés par l'acte (même format que l'Acte 1, traduits par la session) :
//   { type: 'enigme', code, etat }                   l'énigme change d'état
//   { type: 'action' }                               action utile des joueurs : la jauge baisse
//   { type: 'acte_resolu', acte, fragment, ordre }   l'acte est terminé et livre son fragment
//   { type: 'ignore', raison }                       message ignoré, à journaliser

// Début de l'acte : l'énigme est active tout de suite (pas de badge ni de console à ouvrir).
// Elle est créée verrouillée en base, d'où l'effet qui la passe à "active".
function demarrer() {
  const etat = {
    enigmes: { [CODES.autoplay]: ACTIVE },
    // Dernier état reçu du capteur : true, false, ou null si rien n'est encore arrivé
    presence: null,
    // Une présence a-t-elle été vue depuis le début de l'acte ?
    presenceVue: false,
    // Secondes d'absence consécutives
    absenceS: 0,
    resolu: false,
  };
  return { etat, effets: [{ type: 'enigme', code: CODES.autoplay, etat: ACTIVE }] };
}

// Traite un message de capteur. `element` est la fin du topic : 'presence'.
// Modifie `etat` et renvoie la liste des effets.
function traiterMessage(etat, element, valeur) {
  if (element !== 'presence') return [ignorer(`élément inconnu : ${element}`)];
  if (typeof valeur !== 'boolean') return [ignorer(`présence : valeur inattendue (${valeur})`)];
  if (etat.enigmes[CODES.autoplay] !== ACTIVE) {
    return [ignorer(`présence : énigme ${etat.enigmes[CODES.autoplay]}`)];
  }

  // Un vrai changement d'état relance le décompte de l'absence. Un message répété (QoS 1 peut
  // en redélivrer) ne doit pas le remettre à zéro.
  if (valeur !== etat.presence) etat.absenceS = 0;
  etat.presence = valeur;
  if (valeur) {
    etat.presenceVue = true;
    return [];
  }
  if (!etat.presenceVue) {
    // Pas de pénalité : la salle est peut-être simplement vide en attendant les joueurs
    return [ignorer('présence : absence signalée avant toute présence')];
  }
  return [];
}

// Une seconde de jeu : l'absence continue se compte ici. Renvoie les effets (vide la plupart du temps).
function tick(etat) {
  if (etat.resolu || etat.enigmes[CODES.autoplay] !== ACTIVE) return [];
  if (etat.presence !== false || !etat.presenceVue) return [];

  etat.absenceS += 1;
  if (etat.absenceS < DELAI_ABSENCE_S) return [];

  const effets = [];
  etat.enigmes[CODES.autoplay] = RESOLUE;
  etat.resolu = true;
  effets.push({ type: 'enigme', code: CODES.autoplay, etat: RESOLUE });
  effets.push({ type: 'action' });
  effets.push({ type: 'acte_resolu', acte: 2, fragment: FRAGMENT, ordre: ORDRE_FRAGMENT });
  return effets;
}

function ignorer(raison) {
  return { type: 'ignore', raison };
}

module.exports = { CODES, VERROUILLEE, ACTIVE, RESOLUE, demarrer, traiterMessage, tick };
