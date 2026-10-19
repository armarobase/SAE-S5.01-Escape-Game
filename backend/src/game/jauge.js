// Logique de la jauge de "poids du monstre" (GDD §2.1, §2.3 et §4.1 Acte 4)
// Fonctions pures : pas d'accès à la base ni au réseau, pour pouvoir les tester facilement.
// Les valeurs ci-dessous sont provisoires, à valider avec l'équipe (game design).

const JAUGE_MIN = 0;
const JAUGE_MAX = 100;

// Montée passive quand les joueurs restent inactifs (points par seconde)
const MONTEE_INACTIVITE_PAR_S = 0.2;
// Délai sans action avant que la jauge commence à monter
const DELAI_INACTIVITE_S = 15;

// Baisse de la jauge pour une action utile (points)
const BAISSE_PAR_ACTION = 5;
// Pénalité pour une erreur (mauvais code, mauvais câble...)
const HAUSSE_PAR_ERREUR = 3;

function borner(valeur) {
  return Math.max(JAUGE_MIN, Math.min(JAUGE_MAX, valeur));
}

// Jauge après `secondes` secondes sans action des joueurs
function appliquerInactivite(jauge, secondesSansAction) {
  const secondesPenalisees = Math.max(0, secondesSansAction - DELAI_INACTIVITE_S);
  return borner(jauge + secondesPenalisees * MONTEE_INACTIVITE_PAR_S);
}

// Jauge après une action qui coupe une source de surconsommation
function appliquerAction(jauge, nbActions = 1) {
  return borner(jauge - BAISSE_PAR_ACTION * nbActions);
}

// Jauge après une erreur des joueurs
function appliquerErreur(jauge, nbErreurs = 1) {
  return borner(jauge + HAUSSE_PAR_ERREUR * nbErreurs);
}

// Défaite quand la jauge atteint son maximum (GDD §2.3)
function estPleine(jauge) {
  return jauge >= JAUGE_MAX;
}

// Acte 4 : nombre de fragments brouillés (0 à 3) selon la jauge à l'arrivée dans l'acte.
// 0-24 % : aucun, 25-49 % : 1, 50-74 % : 2, 75 % et plus : 3.
function nbFragmentsBrouilles(jauge) {
  return Math.min(3, Math.floor(borner(jauge) / 25));
}

// Actes (1 à 3) dont le fragment est brouillé : les plus récents d'abord,
// pour que les joueurs aient à retrouver les fragments les plus "frais" dans les logs.
function actesBrouilles(jauge) {
  return [3, 2, 1].slice(0, nbFragmentsBrouilles(jauge)).sort();
}

module.exports = {
  JAUGE_MIN,
  JAUGE_MAX,
  borner,
  appliquerInactivite,
  appliquerAction,
  appliquerErreur,
  estPleine,
  nbFragmentsBrouilles,
  actesBrouilles,
};
