// Messages envoyés à l'écran de jeu (contrat frontend/websocket.md).
// Fonctions pures : elles fabriquent les messages à partir des données, sans réseau ni base,
// sur le même principe que mqtt/actionneurs.js pour les postes.
const configJeu = require('../game/config');

// Instantané complet, envoyé à chaque connexion d'un écran et à chaque changement de structure
// (nouvelle partie, énigme résolue, changement d'acte, fin de partie).
//   session   : ligne de la table session, ou null s'il n'y a pas de partie
//   enigmes   : lignes de la table enigme de cette session
//   fragments : lignes de la table fragment_code de cette session
//   postes    : { acte1: 'online', ... } (seuls les postes déjà connus)
//   jauge     : valeur exacte en mémoire (la base n'est mise à jour que sur les événements)
//   maintenantMs : heure du serveur, pour que l'écran corrige l'écart avec son horloge
function construireEtat({ session, enigmes = [], fragments = [], postes = {}, jauge, maintenantMs }) {
  return {
    type: 'etat',
    serveurMs: maintenantMs,
    session: session ? sessionPourEcran(session, jauge) : null,
    enigmes: enigmes.map((e) => ({ code: e.code, acte: e.acte, nom: e.nom, etat: e.etat })),
    narratifs: session ? documentsDebloques(enigmes, fragments) : [],
    postes: { ...postes },
  };
}

// Noms de colonnes de la base -> noms du contrat
function sessionPourEcran(session, jauge) {
  return {
    id: session.id,
    statut: session.statut,
    acte: session.acte_courant,
    jauge: Math.round(jauge ?? session.jauge),
    dureeLimiteS: session.duree_limite_s,
    debutLe: session.debut_le,
    nbErreurs: session.nb_erreurs,
  };
}

// Documents débloqués, d'après l'état des énigmes et les règles de config.js (DOCUMENTS)
function documentsDebloques(enigmes, fragments, regles = configJeu.DOCUMENTS) {
  return regles
    .filter((regle) => estDebloque(regle.debloqueQuand, enigmes))
    .map((regle) => {
      const fragment = fragments.find((f) => f.acte === regle.fragmentActe);
      return {
        id: regle.id,
        fragment: fragment ? fragment.valeur : null,
        brouille: fragment ? fragment.brouille : false,
      };
    });
}

function estDebloque(condition, enigmes) {
  if (condition.enigmeResolue) {
    return enigmes.some((e) => e.code === condition.enigmeResolue && e.etat === 'resolue');
  }
  if (condition.acteResolu) {
    const deLActe = enigmes.filter((e) => e.acte === condition.acteResolu);
    return deLActe.length > 0 && deLActe.every((e) => e.etat === 'resolue');
  }
  return false;
}

// Un message "narratif" par document qui n'a pas encore été envoyé
// (`dejaEnvoyes` : ensemble des identifiants déjà envoyés pendant cette partie)
function messagesNouveauxDocuments(dejaEnvoyes, documents) {
  return documents
    .filter((doc) => !dejaEnvoyes.has(doc.id))
    .map((doc) => ({ type: 'narratif', ...doc }));
}

// Message "jauge" seulement si la valeur affichée (entière) a changé depuis le dernier envoi.
// La jauge monte de 0,2 par seconde : cela fait au plus un message toutes les 5 secondes.
function messageJauge(jauge, derniereEnvoyee) {
  const valeur = Math.round(jauge);
  if (valeur === derniereEnvoyee) return null;
  return { type: 'jauge', valeur };
}

// Changement d'état d'un poste : seul le poste concerné est indiqué
function messagePoste(acte, statut) {
  return { type: 'postes', postes: { [`acte${acte}`]: statut } };
}

// Effets de la session qui changent la structure de la partie : il faut renvoyer un "etat" complet
const EFFETS_STRUCTURELS = ['etat_jeu', 'enigme', 'fragment', 'fin'];

function demandeEtatComplet(effets) {
  return effets.some((effet) => EFFETS_STRUCTURELS.includes(effet.type));
}

module.exports = {
  construireEtat,
  documentsDebloques,
  messagesNouveauxDocuments,
  messageJauge,
  messagePoste,
  demandeEtatComplet,
};
