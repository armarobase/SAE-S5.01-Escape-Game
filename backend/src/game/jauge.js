// Calcul de la jauge du "poids du monstre" (GDD §2.1) : fonction pure, sans accès à la base.
// Valeurs provisoires, à ajuster avec l'équipe lors des tests de jeu.
const JAUGE_MIN = 0;
const JAUGE_MAX = 100;
const JAUGE_DEPART = 50;

// Le monstre grossit tant que les joueurs n'agissent pas : +1 point toutes les 20 s d'inactivité
const SECONDES_PAR_POINT_INACTIVITE = 20;

function borner(valeur) {
  return Math.max(JAUGE_MIN, Math.min(JAUGE_MAX, Math.round(valeur)));
}

// reductions : total des points retirés par les énigmes (voir acte1.reductionJauge)
// inactiviteS : secondes écoulées depuis la dernière action utile des joueurs
function calculerJauge({ reductions = 0, inactiviteS = 0 } = {}) {
  const montee = Math.floor(Math.max(0, inactiviteS) / SECONDES_PAR_POINT_INACTIVITE);
  return borner(JAUGE_DEPART - reductions + montee);
}

// Niveau du bargraph (0 à 10) envoyé à la carte de l'Acte 1 (contrat MQTT §4)
function niveauBargraph(jauge) {
  return Math.round(borner(jauge) / 10);
}

function jaugeMaximale(jauge) {
  return jauge >= JAUGE_MAX;
}

module.exports = {
  JAUGE_MIN, JAUGE_MAX, JAUGE_DEPART, SECONDES_PAR_POINT_INACTIVITE,
  calculerJauge, niveauBargraph, jaugeMaximale,
};
