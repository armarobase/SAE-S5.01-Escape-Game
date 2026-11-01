// Niveaux d'alerte de la jauge. Les seuils suivent ceux du backend (paliers de 25 points,
// voir backend/src/game/jauge.js) : à 25, 50 et 75 %, le monstre brouille un fragment de plus à l'Acte 4.

export const NIVEAUX = [
  { id: 'calme', min: 0, libelle: 'Stable' },
  { id: 'tendue', min: 25, libelle: 'Surcharge' },
  { id: 'critique', min: 50, libelle: 'Critique' },
  { id: 'alerte', min: 75, libelle: 'Alerte maximale' },
];

export function niveauJauge(valeur) {
  const v = Number.isFinite(valeur) ? valeur : 0;
  let niveau = NIVEAUX[0];
  for (const n of NIVEAUX) if (v >= n.min) niveau = n;
  return niveau;
}
