import { CATALOGUE } from '../contenu/narratif.js';

const MARQUEUR = '{{fragment}}';

// Texte affiché pour un fragment : la valeur, des « ▒ » si le monstre l'a brouillé, ou « ?? » s'il est inconnu
export function afficherFragment({ fragment, brouille }) {
  if (brouille) return '▒'.repeat(fragment ? String(fragment).length : 2);
  return fragment ? String(fragment) : '??';
}

// Document prêt à afficher à partir de ce que le serveur a envoyé ({ id, fragment, brouille }).
// Un identifiant absent du catalogue donne un document de repli au lieu de faire planter l'écran.
export function documentNarratif({ id, fragment = null, brouille = false }) {
  const modele = CATALOGUE[id];
  if (!modele) {
    return { id, type: 'log', acte: 0, titre: 'Document illisible', corps: `Référence inconnue : ${id}`, brouille: false };
  }
  return {
    id,
    type: modele.type,
    acte: modele.acte,
    titre: modele.titre,
    de: modele.de,
    objet: modele.objet,
    corps: modele.corps.replaceAll(MARQUEUR, afficherFragment({ fragment, brouille })),
    brouille: Boolean(brouille) && modele.corps.includes(MARQUEUR),
  };
}
