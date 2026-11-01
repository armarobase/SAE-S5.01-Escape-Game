const test = require('node:test');
const assert = require('node:assert/strict');
const acte1 = require('../src/game/actes/acte1');
const config = require('../src/game/config');

const { CODES, VERROUILLEE, ACTIVE, RESOLUE } = acte1;
const BADGE = config.acte1.BADGES_AUTORISES[0];

// Petits utilitaires pour lire les effets renvoyés
const deType = (effets, type) => effets.filter((e) => e.type === type);
const nbActions = (effets) => deType(effets, 'action').length;

// Acte démarré avec le badge déjà scanné
function apresBadge() {
  const { etat } = acte1.demarrer();
  acte1.traiterMessage(etat, 'badge', BADGE);
  return etat;
}

test('au démarrage, seul le badge est actif et les 3 LED sont allumées', () => {
  const { etat, effets } = acte1.demarrer();
  assert.equal(etat.enigmes[CODES.badge], ACTIVE);
  assert.equal(etat.enigmes[CODES.notifications], VERROUILLEE);
  assert.equal(etat.enigmes[CODES.ecran], VERROUILLEE);
  assert.equal(etat.enigmes[CODES.veille], VERROUILLEE);
  assert.deepEqual(effets, [
    { type: 'led', numero: 1, valeur: 'on' },
    { type: 'led', numero: 2, valeur: 'on' },
    { type: 'led', numero: 3, valeur: 'on' },
  ]);
});

test('un bouton appuyé avant le badge est ignoré', () => {
  const { etat } = acte1.demarrer();
  const effets = acte1.traiterMessage(etat, 'bouton/1', 'appui');
  assert.equal(deType(effets, 'ignore').length, 1);
  assert.equal(etat.coupees[0], false);
});

test('un badge non autorisé est ignoré, sans pénalité', () => {
  const { etat } = acte1.demarrer();
  const effets = acte1.traiterMessage(etat, 'badge', 'INCONNU');
  assert.equal(deType(effets, 'ignore').length, 1);
  assert.equal(nbActions(effets), 0);
  assert.equal(etat.enigmes[CODES.badge], ACTIVE);
});

test('le bon badge résout la console et débloque les trois autres énigmes', () => {
  const { etat } = acte1.demarrer();
  const effets = acte1.traiterMessage(etat, 'badge', BADGE);
  assert.equal(etat.enigmes[CODES.badge], RESOLUE);
  assert.equal(etat.enigmes[CODES.notifications], ACTIVE);
  assert.equal(etat.enigmes[CODES.ecran], ACTIVE);
  assert.equal(etat.enigmes[CODES.veille], ACTIVE);
  assert.equal(nbActions(effets), 1);
});

test('un second badge est ignoré (énigme déjà résolue)', () => {
  const etat = apresBadge();
  const effets = acte1.traiterMessage(etat, 'badge', BADGE);
  assert.equal(deType(effets, 'ignore').length, 1);
  assert.equal(nbActions(effets), 0);
});

test('un appui coupe puis rallume la notification, seule la première coupure compte', () => {
  const etat = apresBadge();

  const coupure = acte1.traiterMessage(etat, 'bouton/2', 'appui');
  assert.deepEqual(deType(coupure, 'led'), [{ type: 'led', numero: 2, valeur: 'off' }]);
  assert.equal(nbActions(coupure), 1);

  const rallumage = acte1.traiterMessage(etat, 'bouton/2', 'appui');
  assert.deepEqual(deType(rallumage, 'led'), [{ type: 'led', numero: 2, valeur: 'on' }]);
  assert.equal(nbActions(rallumage), 0);

  const recoupure = acte1.traiterMessage(etat, 'bouton/2', 'appui');
  assert.deepEqual(deType(recoupure, 'led'), [{ type: 'led', numero: 2, valeur: 'off' }]);
  assert.equal(nbActions(recoupure), 0);
});

test('les notifications sont résolues quand toutes sont coupées, les appuis suivants sont ignorés', () => {
  const etat = apresBadge();
  acte1.traiterMessage(etat, 'bouton/1', 'appui');
  acte1.traiterMessage(etat, 'bouton/2', 'appui');
  const effets = acte1.traiterMessage(etat, 'bouton/3', 'appui');
  assert.deepEqual(deType(effets, 'enigme'), [{ type: 'enigme', code: CODES.notifications, etat: RESOLUE }]);

  const apres = acte1.traiterMessage(etat, 'bouton/1', 'appui');
  assert.equal(deType(apres, 'ignore').length, 1);
  assert.equal(deType(apres, 'led').length, 0);
});

test("l'écran est résolu quand le slider passe sous le seuil", () => {
  const etat = apresBadge();
  const auDessus = acte1.traiterMessage(etat, 'slider', config.acte1.SEUIL_SLIDER);
  assert.equal(etat.enigmes[CODES.ecran], ACTIVE);
  assert.equal(nbActions(auDessus), 0);

  const enDessous = acte1.traiterMessage(etat, 'slider', config.acte1.SEUIL_SLIDER - 1);
  assert.equal(etat.enigmes[CODES.ecran], RESOLUE);
  assert.equal(nbActions(enDessous), 1);
});

test('la mise en veille est résolue quand le capteur de lumière est couvert', () => {
  const etat = apresBadge();
  acte1.traiterMessage(etat, 'lumiere', 80);
  assert.equal(etat.enigmes[CODES.veille], ACTIVE);
  acte1.traiterMessage(etat, 'lumiere', 5);
  assert.equal(etat.enigmes[CODES.veille], RESOLUE);
});

test('un slider baissé avant le badge est pris en compte dès le badge', () => {
  const { etat } = acte1.demarrer();
  const avant = acte1.traiterMessage(etat, 'slider', 0);
  assert.equal(deType(avant, 'ignore').length, 1);

  acte1.traiterMessage(etat, 'badge', BADGE);
  assert.equal(etat.enigmes[CODES.ecran], RESOLUE);
});

test('les valeurs invalides sont ignorées sans changer l\'état', () => {
  const etat = apresBadge();
  const messages = [
    ['slider', 150],
    ['slider', '10'],
    ['lumiere', -1],
    ['bouton/4', 'appui'],
    ['bouton/abc', 'appui'],
    ['bouton/1', 'relache'],
    ['inconnu', 1],
  ];
  for (const [element, valeur] of messages) {
    const effets = acte1.traiterMessage(etat, element, valeur);
    assert.deepEqual(effets.map((e) => e.type), ['ignore'], `${element} = ${valeur}`);
  }
  assert.equal(etat.enigmes[CODES.ecran], ACTIVE);
  assert.equal(etat.enigmes[CODES.veille], ACTIVE);
  assert.deepEqual(etat.coupees, [false, false, false]);
});

test('le scénario du simulateur résout l\'acte et livre le fragment une seule fois', () => {
  const { etat } = acte1.demarrer();
  const scenario = [
    ['badge', BADGE],
    ['bouton/1', 'appui'], ['bouton/2', 'appui'], ['bouton/3', 'appui'],
    ['slider', 100], ['slider', 75], ['slider', 50], ['slider', 25], ['slider', 0],
    ['lumiere', 80], ['lumiere', 5],
  ];
  const tousLesEffets = scenario.flatMap(([element, valeur]) => acte1.traiterMessage(etat, element, valeur));

  assert.deepEqual(deType(tousLesEffets, 'acte_resolu'), [
    { type: 'acte_resolu', acte: 1, fragment: config.acte1.FRAGMENT, ordre: config.acte1.ORDRE_FRAGMENT },
  ]);
  // badge + 3 coupures + écran + veille
  assert.equal(nbActions(tousLesEffets), 6);
  assert.equal(etat.resolu, true);

  // Un message après la fin de l'acte ne relivre pas le fragment
  const apres = acte1.traiterMessage(etat, 'lumiere', 0);
  assert.equal(deType(apres, 'acte_resolu').length, 0);
});
