// Scénarios du simulateur : une liste d'étapes par mode, jouées dans l'ordre.
// Chaque étape : { libelle, topic, valeur, qos } (voir docs/mqtt.md).
// Une étape avec "brut" envoie ce texte tel quel, sans le format JSON du contrat
// (sert uniquement à tester les messages invalides).
// Pour ajouter un acte : créer un tableau acte2, acte3... et l'exporter en bas.

// Valeurs encore à valider avec l'équipe (docs/mqtt.md, section 9)
const BADGE_TEST = '04A1B2C3';
const NB_BOUTONS = 3;

// Acte 1 : alerte surcharge (tutoriel)
const acte1 = [
  { libelle: 'Scan du badge RFID', topic: 'datamonstre/acte1/badge', valeur: BADGE_TEST, qos: 1 },
];

// Un appui sur chaque bouton pour couper les notifications
for (let numero = 1; numero <= NB_BOUTONS; numero++) {
  acte1.push({
    libelle: `Appui bouton ${numero}`,
    topic: `datamonstre/acte1/bouton/${numero}`,
    valeur: 'appui',
    qos: 1,
  });
}

// Le slider de luminosité baisse par étapes (variation de plus de 5 à chaque fois)
for (const niveau of [100, 75, 50, 25, 0]) {
  acte1.push({ libelle: `Slider à ${niveau}`, topic: 'datamonstre/acte1/slider', valeur: niveau, qos: 0 });
}

// Le capteur de lumière est couvert : la valeur chute
acte1.push(
  { libelle: 'Lumière ambiante', topic: 'datamonstre/acte1/lumiere', valeur: 80, qos: 0 },
  { libelle: 'Capteur de lumière couvert', topic: 'datamonstre/acte1/lumiere', valeur: 5, qos: 0 },
);

// Messages incorrects : le backend doit les ignorer sans planter
const invalide = [
  { libelle: 'JSON illisible', topic: 'datamonstre/acte1/bouton/1', brut: '{valeur: appui', qos: 1 },
  { libelle: 'Champ valeur absent', topic: 'datamonstre/acte1/bouton/1', brut: '{"etat":"appui"}', qos: 1 },
  { libelle: 'Valeur hors limites (slider à 150)', topic: 'datamonstre/acte1/slider', valeur: 150, qos: 0 },
  { libelle: 'Topic inconnu', topic: 'datamonstre/acte1/inconnu', valeur: 'appui', qos: 1 },
  // Si ce dernier message est bien traité, le backend a survécu aux précédents
  { libelle: 'Message valide (appui bouton 1)', topic: 'datamonstre/acte1/bouton/1', valeur: 'appui', qos: 1 },
];

module.exports = { acte1, invalide };
