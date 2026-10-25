// Machine à états de l'Acte 1 "Alerte surcharge" (GDD §4.1). Logique pure : pas de base, pas de MQTT.
// Les 4 énigmes se jouent dans l'ordre : badge -> notifications -> écran -> veille.
// Chaque énigme suit verrouillee -> active -> resolue, comme la table enigme.

const NB_BOUTONS = 3; // à valider (docs/mqtt.md §9)
const SEUIL_SLIDER = 20; // luminosité de l'écran maquette à atteindre (0 à 100), provisoire
const SEUIL_LUMIERE = 10; // capteur couvert en dessous de cette valeur (0 à 100), provisoire

// Points de jauge retirés par chaque action des joueurs
const POINTS_PAR_NOTIFICATION = 8;
const POINTS_ECRAN_MAX = 15;
const POINTS_VEILLE = 10;

const ORDRE = ['acte1_badge', 'acte1_notifications', 'acte1_ecran', 'acte1_veille'];

function creerActe1() {
  return {
    enigmes: {
      acte1_badge: 'active',
      acte1_notifications: 'verrouillee',
      acte1_ecran: 'verrouillee',
      acte1_veille: 'verrouillee',
    },
    notificationsActives: Array(NB_BOUTONS).fill(true),
    slider: 100,
    termine: false,
  };
}

function enigmeActive(etat) {
  return ORDRE.find((code) => etat.enigmes[code] === 'active') || null;
}

// Jauge : points retirés par l'état actuel de l'acte. Calculé depuis l'état, donc
// rallumer une notification ou remonter le slider fait remonter la jauge.
function reductionJauge(etat) {
  const coupees = etat.notificationsActives.filter((active) => !active).length;
  let total = coupees * POINTS_PAR_NOTIFICATION;
  if (etat.enigmes.acte1_ecran !== 'verrouillee') {
    total += Math.round(((100 - etat.slider) / 100) * POINTS_ECRAN_MAX);
  }
  if (etat.enigmes.acte1_veille === 'resolue') total += POINTS_VEILLE;
  return total;
}

// Ordres LED à envoyer (datamonstre/acte1/led/N) : "on" tant que la notification est active
function ordresLed(etat) {
  return etat.notificationsActives.map((active, i) => ({ led: i + 1, valeur: active ? 'on' : 'off' }));
}

// Résout l'énigme active et active la suivante. Retourne la liste des changements d'énigme.
function resoudre(etat, code) {
  const changements = [{ code, etat: 'resolue' }];
  etat.enigmes[code] = 'resolue';
  const suivante = ORDRE[ORDRE.indexOf(code) + 1];
  if (suivante) {
    etat.enigmes[suivante] = 'active';
    changements.push({ code: suivante, etat: 'active' });
  } else {
    etat.termine = true;
  }
  return changements;
}

// Traite un message de capteur. `topic` est le topic MQTT complet, `valeur` le champ "valeur" du message.
// Retourne { etat, changements } : le nouvel état et les énigmes qui ont changé d'état.
// Les messages sans effet à ce stade (ou hors Acte 1) sont ignorés.
function traiter(etatInitial, topic, valeur) {
  const etat = structuredClone(etatInitial);
  const resultat = { etat, changements: [] };
  const active = enigmeActive(etat);
  if (!active) return resultat;

  const bouton = topic.match(/^datamonstre\/acte1\/bouton\/(\d+)$/);

  if (topic === 'datamonstre/acte1/badge') {
    if (active === 'acte1_badge') resultat.changements = resoudre(etat, 'acte1_badge');
  } else if (bouton) {
    const index = Number(bouton[1]) - 1;
    if (index < 0 || index >= NB_BOUTONS || valeur !== 'appui') return resultat;
    if (active !== 'acte1_notifications') return resultat; // console verrouillée ou énigme déjà passée
    etat.notificationsActives[index] = !etat.notificationsActives[index];
    if (etat.notificationsActives.every((a) => !a)) {
      resultat.changements = resoudre(etat, 'acte1_notifications');
    }
  } else if (topic === 'datamonstre/acte1/slider') {
    if (typeof valeur !== 'number') return resultat;
    etat.slider = valeur;
    if (active === 'acte1_ecran' && valeur <= SEUIL_SLIDER) {
      resultat.changements = resoudre(etat, 'acte1_ecran');
    }
  } else if (topic === 'datamonstre/acte1/lumiere') {
    if (active === 'acte1_veille' && typeof valeur === 'number' && valeur <= SEUIL_LUMIERE) {
      resultat.changements = resoudre(etat, 'acte1_veille');
    }
  }
  return resultat;
}

module.exports = {
  NB_BOUTONS, SEUIL_SLIDER, SEUIL_LUMIERE, POINTS_PAR_NOTIFICATION, POINTS_ECRAN_MAX, POINTS_VEILLE,
  creerActe1, enigmeActive, reductionJauge, ordresLed, traiter,
};
