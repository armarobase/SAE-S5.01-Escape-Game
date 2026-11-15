// Acte 3 : "La salle de brassage", GDD §4.1
// Machine à états pure : elle ne connaît ni MQTT ni la base de données.
//
// Énigme unique, "Tri des connexions" : les joueurs lisent le plan de câblage raturé trouvé dans
// le décor, puis débranchent les câbles des liaisons inutiles et laissent en place celles qui
// sont encore actives (config.acte3.PORTS_ACTIFS).
//
// Chaque port a une boucle de câble (branché / débranché) et un couple de LED, commandé par le
// backend : verte tant que le câble est branché, rouge dès qu'il est débranché.
// Règles de jeu :
//  - débrancher un port inutile fait baisser la jauge, une seule fois par port ;
//  - débrancher un port encore actif est une erreur (la jauge monte) ; le rebrancher est gratuit ;
//  - l'énigme est résolue quand la bonne configuration (ports actifs branchés, tous les autres
//    débranchés) reste stable DELAI_CONFIRMATION_S secondes : un faux contact ne suffit pas.
//    Le temps lui est donné par tick(), appelé chaque seconde par la session, comme à l'Acte 2.
//
// Au début de l'acte, tous les câbles sont supposés branchés : la carte ne republie pas l'état
// d'un port qui n'a pas changé (docs/mqtt.md §3).
const config = require('../config');

const { NB_PORTS, PORTS_ACTIFS, FRAGMENT, ORDRE_FRAGMENT } = config.acte3;
// Lu à chaque appel (et non une fois pour toutes) pour pouvoir le régler pendant les essais
const delaiConfirmationS = () => config.acte3.DELAI_CONFIRMATION_S;

const VERROUILLEE = 'verrouillee';
const ACTIVE = 'active';
const RESOLUE = 'resolue';

// Identifiant de l'énigme, identique à celui de la base (db/catalogue.js)
const CODES = { brassage: 'acte3_brassage' };

// Effets renvoyés par l'acte (même format que les actes 1 et 2, traduits par la session) :
//   { type: 'enigme', code, etat }                   l'énigme change d'état
//   { type: 'led', numero, valeur }                  LED d'un port : 'vert' (branché) ou 'rouge' (débranché)
//   { type: 'action' }                               action utile des joueurs : la jauge baisse
//   { type: 'erreur', raison }                       erreur des joueurs : la jauge monte
//   { type: 'acte_resolu', acte, fragment, ordre }   l'acte est terminé et livre son fragment
//   { type: 'ignore', raison }                       message ignoré, à journaliser

const estActif = (numero) => PORTS_ACTIFS.includes(numero);

// Début de l'acte : énigme active tout de suite, tous les câbles branchés, toutes les LED vertes
function demarrer() {
  const etat = {
    enigmes: { [CODES.brassage]: ACTIVE },
    // Pour chaque port : true si le câble est branché
    branches: new Array(NB_PORTS).fill(true),
    // Pour chaque port : true si son débranchement a déjà fait baisser la jauge
    dejaComptes: new Array(NB_PORTS).fill(false),
    // Secondes consécutives avec la bonne configuration
    stableS: 0,
    resolu: false,
  };

  const effets = [{ type: 'enigme', code: CODES.brassage, etat: ACTIVE }];
  for (let numero = 1; numero <= NB_PORTS; numero++) {
    effets.push({ type: 'led', numero, valeur: 'vert' });
  }
  return { etat, effets };
}

// Traite un message de capteur. `element` est la fin du topic : 'port/3'.
// Modifie `etat` et renvoie la liste des effets.
function traiterMessage(etat, element, valeur) {
  const correspondance = /^port\/(\d+)$/.exec(element);
  if (!correspondance) return [ignorer(`élément inconnu : ${element}`)];

  const numero = Number(correspondance[1]);
  if (numero < 1 || numero > NB_PORTS) return [ignorer(`port inconnu : ${numero}`)];
  if (valeur !== 'branche' && valeur !== 'debranche') {
    return [ignorer(`port ${numero} : valeur inattendue (${valeur})`)];
  }
  if (etat.enigmes[CODES.brassage] !== ACTIVE) {
    return [ignorer(`port ${numero} : énigme ${etat.enigmes[CODES.brassage]}`)];
  }

  const i = numero - 1;
  const branche = valeur === 'branche';
  // Un message répété (QoS 1 peut en redélivrer, la carte publie l'état de tous ses ports au
  // démarrage) ne change rien : ni LED, ni pénalité, ni remise à zéro de la confirmation.
  if (branche === etat.branches[i]) return [];

  etat.branches[i] = branche;
  etat.stableS = 0;
  const effets = [{ type: 'led', numero, valeur: branche ? 'vert' : 'rouge' }];

  if (!branche) {
    if (estActif(numero)) {
      effets.push({ type: 'erreur', raison: `port ${numero} : liaison encore active débranchée` });
    } else if (!etat.dejaComptes[i]) {
      // Seul le premier débranchement d'un port inutile fait baisser la jauge :
      // sinon les joueurs pourraient le rebrancher et le débrancher en boucle.
      etat.dejaComptes[i] = true;
      effets.push({ type: 'action' });
    }
  }

  // Sans délai de confirmation, la résolution est immédiate
  if (delaiConfirmationS() <= 0 && configurationCorrecte(etat)) resoudre(etat, effets);
  return effets;
}

// Une seconde de jeu : la stabilité de la configuration se compte ici
function tick(etat) {
  if (etat.resolu || etat.enigmes[CODES.brassage] !== ACTIVE) return [];
  if (!configurationCorrecte(etat)) {
    etat.stableS = 0;
    return [];
  }

  etat.stableS += 1;
  if (etat.stableS < delaiConfirmationS()) return [];

  const effets = [];
  resoudre(etat, effets);
  return effets;
}

// Bonne configuration : chaque port actif est branché, chaque autre est débranché
function configurationCorrecte(etat) {
  return etat.branches.every((branche, i) => branche === estActif(i + 1));
}

function resoudre(etat, effets) {
  etat.enigmes[CODES.brassage] = RESOLUE;
  etat.resolu = true;
  effets.push({ type: 'enigme', code: CODES.brassage, etat: RESOLUE });
  effets.push({ type: 'action' });
  effets.push({ type: 'acte_resolu', acte: 3, fragment: FRAGMENT, ordre: ORDRE_FRAGMENT });
}

function ignorer(raison) {
  return { type: 'ignore', raison };
}

module.exports = { CODES, VERROUILLEE, ACTIVE, RESOLUE, demarrer, traiterMessage, tick };
