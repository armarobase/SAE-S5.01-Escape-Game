const test = require('node:test');
const assert = require('node:assert/strict');
const acte1 = require('../src/game/actes/acte1');
const jauge = require('../src/game/jauge');

// Rejoue une suite de messages [topic, valeur] sur un état
function jouer(etat, messages) {
  return messages.reduce((e, [topic, valeur]) => acte1.traiter(e, topic, valeur).etat, etat);
}

const BADGE = ['datamonstre/acte1/badge', 'TECH-001'];
const bouton = (n) => [`datamonstre/acte1/bouton/${n}`, 'appui'];

test('au départ, seule l\'énigme du badge est active', () => {
  const etat = acte1.creerActe1();
  assert.equal(acte1.enigmeActive(etat), 'acte1_badge');
});

test('les boutons sont sans effet tant que le badge n\'est pas scanné', () => {
  const etat = jouer(acte1.creerActe1(), [bouton(1)]);
  assert.deepEqual(etat.notificationsActives, [true, true, true]);
});

test('le badge résout la première énigme et active les notifications', () => {
  const { etat, changements } = acte1.traiter(acte1.creerActe1(), ...BADGE);
  assert.equal(acte1.enigmeActive(etat), 'acte1_notifications');
  assert.deepEqual(changements, [
    { code: 'acte1_badge', etat: 'resolue' },
    { code: 'acte1_notifications', etat: 'active' },
  ]);
});

test('un appui coupe la notification, un second appui la rallume', () => {
  let etat = jouer(acte1.creerActe1(), [BADGE, bouton(2)]);
  assert.deepEqual(acte1.ordresLed(etat).map((o) => o.valeur), ['on', 'off', 'on']);
  etat = jouer(etat, [bouton(2)]);
  assert.deepEqual(acte1.ordresLed(etat).map((o) => o.valeur), ['on', 'on', 'on']);
});

test('couper les 3 notifications résout l\'énigme', () => {
  const etat = jouer(acte1.creerActe1(), [BADGE, bouton(1), bouton(2), bouton(3)]);
  assert.equal(acte1.enigmeActive(etat), 'acte1_ecran');
});

test('un bouton hors contrat ou une valeur inattendue est ignoré', () => {
  const base = jouer(acte1.creerActe1(), [BADGE]);
  assert.deepEqual(jouer(base, [bouton(9)]), base);
  assert.deepEqual(jouer(base, [['datamonstre/acte1/bouton/1', 'relache']]), base);
});

test('le slider doit descendre sous le seuil pour résoudre l\'écran', () => {
  const base = jouer(acte1.creerActe1(), [BADGE, bouton(1), bouton(2), bouton(3)]);
  assert.equal(acte1.enigmeActive(jouer(base, [['datamonstre/acte1/slider', 50]])), 'acte1_ecran');
  assert.equal(acte1.enigmeActive(jouer(base, [['datamonstre/acte1/slider', 15]])), 'acte1_veille');
});

test('la lumière ne compte que pendant l\'énigme de mise en veille', () => {
  const avant = jouer(acte1.creerActe1(), [BADGE, ['datamonstre/acte1/lumiere', 0]]);
  assert.equal(acte1.enigmeActive(avant), 'acte1_notifications');
});

test('parcours complet : l\'acte se termine et plus rien n\'est actif', () => {
  const etat = jouer(acte1.creerActe1(), [
    BADGE, bouton(1), bouton(2), bouton(3),
    ['datamonstre/acte1/slider', 10],
    ['datamonstre/acte1/lumiere', 5],
  ]);
  assert.equal(etat.termine, true);
  assert.equal(acte1.enigmeActive(etat), null);
  assert.equal(acte1.traiter(etat, ...BADGE).changements.length, 0);
});

test('traiter ne modifie pas l\'état reçu', () => {
  const etat = acte1.creerActe1();
  const copie = structuredClone(etat);
  acte1.traiter(etat, ...BADGE);
  assert.deepEqual(etat, copie);
});

test('la jauge baisse à chaque coupure et remonte si on rallume', () => {
  let etat = jouer(acte1.creerActe1(), [BADGE, bouton(1)]);
  assert.equal(acte1.reductionJauge(etat), acte1.POINTS_PAR_NOTIFICATION);
  etat = jouer(etat, [bouton(1)]);
  assert.equal(acte1.reductionJauge(etat), 0);
});

test('jauge : départ, montée par inactivité, bornes', () => {
  assert.equal(jauge.calculerJauge(), jauge.JAUGE_DEPART);
  assert.equal(jauge.calculerJauge({ inactiviteS: 100 }), jauge.JAUGE_DEPART + 5);
  assert.equal(jauge.calculerJauge({ reductions: 999 }), 0);
  assert.equal(jauge.calculerJauge({ inactiviteS: 99999 }), 100);
  assert.ok(jauge.jaugeMaximale(100));
});

test('bargraph : niveau de 0 à 10', () => {
  assert.equal(jauge.niveauBargraph(0), 0);
  assert.equal(jauge.niveauBargraph(55), 6);
  assert.equal(jauge.niveauBargraph(100), 10);
});
