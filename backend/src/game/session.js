// Déroulement d'une partie, en mémoire (GDD §2) : acte en cours, temps restant, jauge,
// fragments collectés, victoire et défaite.
// Comme les actes, la session est pure : ni MQTT, ni base de données, ni vrai timer.
// Chaque fonction renvoie une liste d'effets, que la couche de liaison (index.js)
// transforme en messages MQTT et en écritures en base. Le temps avance quand on appelle tick().
const config = require('./config');
const jauge = require('./jauge');
const acte1 = require('./actes/acte1');

// Actes disponibles. Les actes 2 à 4 seront ajoutés ici quand ils existeront.
const ACTES = { 1: acte1 };
const DERNIER_ACTE = 4;

// Effets renvoyés par la session :
//   { type: 'etat_jeu', statut, acte }        statut ou acte courant modifié (topic datamonstre/jeu/etat)
//   { type: 'jauge', valeur, cause }          nouvelle valeur exacte de la jauge ; cause : 'depart',
//                                             'inactivite' (chaque seconde) ou 'action' (joueurs)
//   { type: 'led', acte, numero, valeur }     LED d'un poste à allumer ou éteindre
//   { type: 'enigme', acte, code, etat }      une énigme change d'état
//   { type: 'fragment', acte, valeur, ordre } fragment du code final collecté
//   { type: 'fin', statut, raison }           fin de partie : 'victoire' ou 'defaite'
//   { type: 'ignore', raison }                message ignoré, à journaliser

// Nouvelle partie : Acte 1 actif, jauge de départ, durée complète
function demarrerPartie() {
  const partie = {
    statut: 'en_cours',
    acteCourant: 1,
    jauge: jauge.JAUGE_DEPART,
    tempsRestantS: config.DUREE_PARTIE_S,
    secondesSansAction: 0,
    fragments: [],
    etatActe: null, // état interne de l'acte en cours (fourni par le module de l'acte)
  };

  const effets = [
    { type: 'etat_jeu', statut: partie.statut, acte: partie.acteCourant },
    { type: 'jauge', valeur: partie.jauge, cause: 'depart' },
  ];
  entrerDansActe(partie, 1, effets);
  return { partie, effets };
}

// Une seconde de jeu : appelée chaque seconde par le timer (ou directement par les tests)
function tick(partie) {
  const effets = [];
  if (partie.statut !== 'en_cours') return effets;

  partie.tempsRestantS -= 1;
  partie.secondesSansAction += 1;

  const avant = partie.jauge;
  partie.jauge = jauge.appliquerSeconde(partie.jauge, partie.secondesSansAction);
  if (partie.jauge !== avant) {
    effets.push({ type: 'jauge', valeur: partie.jauge, cause: 'inactivite' });
  }

  // Défaite si la jauge atteint son maximum ou si le temps est écoulé (GDD §2.3)
  if (jauge.estPleine(partie.jauge)) {
    terminer(partie, 'defaite', 'jauge pleine', effets);
  } else if (partie.tempsRestantS <= 0) {
    terminer(partie, 'defaite', 'temps écoulé', effets);
  }
  return effets;
}

// Message d'un capteur, par exemple topic 'datamonstre/acte1/bouton/2' et valeur 'appui'.
// Il est transmis à l'acte en cours, puis ses effets sont appliqués.
function traiterMessage(partie, topic, valeur) {
  const effets = [];

  if (partie.statut !== 'en_cours') {
    effets.push({ type: 'ignore', raison: `partie terminée (${partie.statut}) : ${topic}` });
    return effets;
  }

  // Topic d'un capteur : datamonstre/acte<numéro>/<élément>
  const correspondance = /^datamonstre\/acte(\d)\/(.+)$/.exec(topic);
  if (!correspondance) {
    effets.push({ type: 'ignore', raison: `topic inattendu : ${topic}` });
    return effets;
  }
  const numero = Number(correspondance[1]);
  const element = correspondance[2];

  if (numero !== partie.acteCourant) {
    effets.push({ type: 'ignore', raison: `acte ${numero} alors que l'acte en cours est ${partie.acteCourant} : ${topic}` });
    return effets;
  }
  const moduleActe = ACTES[numero];
  if (!moduleActe) {
    effets.push({ type: 'ignore', raison: `acte ${numero} pas encore implémenté : ${topic}` });
    return effets;
  }

  const effetsActe = moduleActe.traiterMessage(partie.etatActe, element, valeur);
  appliquerEffetsActe(partie, numero, effetsActe, effets);
  return effets;
}

// Traduit les effets d'un acte en effets de session
function appliquerEffetsActe(partie, numero, effetsActe, effets) {
  for (const effet of effetsActe) {
    if (effet.type === 'action') {
      // Action utile : la jauge baisse et le compteur d'inactivité repart de zéro
      partie.jauge = jauge.appliquerAction(partie.jauge);
      partie.secondesSansAction = 0;
      effets.push({ type: 'jauge', valeur: partie.jauge, cause: 'action' });
    } else if (effet.type === 'acte_resolu') {
      if (effet.fragment !== undefined) {
        const fragment = { acte: numero, valeur: effet.fragment, ordre: effet.ordre };
        partie.fragments.push(fragment);
        effets.push({ type: 'fragment', ...fragment });
      }
      passerActeSuivant(partie, effets);
    } else if (effet.type === 'ignore') {
      effets.push(effet);
    } else {
      // led, enigme : on précise de quel acte vient l'effet
      effets.push({ ...effet, acte: numero });
    }
  }
}

function passerActeSuivant(partie, effets) {
  // Le dernier acte se termine quand le code final est saisi : c'est la victoire
  if (partie.acteCourant === DERNIER_ACTE) {
    terminer(partie, 'victoire', 'code final saisi', effets);
    return;
  }
  entrerDansActe(partie, partie.acteCourant + 1, effets);
  effets.push({ type: 'etat_jeu', statut: partie.statut, acte: partie.acteCourant });
}

function entrerDansActe(partie, numero, effets) {
  partie.acteCourant = numero;
  partie.etatActe = null;
  const moduleActe = ACTES[numero];
  if (!moduleActe) return; // acte pas encore implémenté : ses messages seront ignorés

  const debut = moduleActe.demarrer();
  partie.etatActe = debut.etat;
  appliquerEffetsActe(partie, numero, debut.effets, effets);
}

function terminer(partie, statut, raison, effets) {
  partie.statut = statut;
  effets.push({ type: 'fin', statut, raison });
  effets.push({ type: 'etat_jeu', statut, acte: partie.acteCourant });
}

module.exports = { demarrerPartie, tick, traiterMessage };
