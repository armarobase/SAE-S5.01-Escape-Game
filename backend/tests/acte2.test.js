const test = require('node:test');
const assert = require('node:assert/strict');
const acte2 = require('../src/game/actes/acte2');
const config = require('../src/game/config');

const { CODES, ACTIVE, RESOLUE } = acte2;
const { DELAI_ABSENCE_S, FRAGMENT, ORDRE_FRAGMENT } = config.acte2;

const deType = (effets, type) => effets.filter((e) => e.type === type);

// Fait passer `n` secondes et renvoie tous les effets produits
function passer(etat, n) {
  return Array.from({ length: n }, () => acte2.tick(etat)).flat();
}

// Acte démarré, avec un joueur détecté devant l'écran
function avecJoueurDevant() {
  const { etat } = acte2.demarrer();
  acte2.traiterMessage(etat, 'presence', true);
  return etat;
}

test('au démarrage, l\'énigme est active et l\'effet le signale (elle est verrouillée en base)', () => {
  const { etat, effets } = acte2.demarrer();
  assert.equal(etat.enigmes[CODES.autoplay], ACTIVE);
  assert.deepEqual(effets, [{ type: 'enigme', code: 'acte2_autoplay', etat: ACTIVE }]);
});

test('tant que quelqu\'un est devant l\'écran, l\'énigme ne se résout jamais', () => {
  const etat = avecJoueurDevant();
  assert.deepEqual(passer(etat, DELAI_ABSENCE_S * 10), []);
  assert.equal(etat.enigmes[CODES.autoplay], ACTIVE);
});

test('l\'absence ne résout l\'énigme qu\'après le délai complet', () => {
  const etat = avecJoueurDevant();
  assert.deepEqual(acte2.traiterMessage(etat, 'presence', false), []);

  assert.deepEqual(passer(etat, DELAI_ABSENCE_S - 1), []);
  assert.equal(etat.enigmes[CODES.autoplay], ACTIVE);

  const effets = acte2.tick(etat);
  assert.equal(etat.enigmes[CODES.autoplay], RESOLUE);
  assert.deepEqual(effets, [
    { type: 'enigme', code: 'acte2_autoplay', etat: RESOLUE },
    { type: 'action' },
    { type: 'acte_resolu', acte: 2, fragment: FRAGMENT, ordre: ORDRE_FRAGMENT },
  ]);
});

test('un retour devant l\'écran pendant le délai remet le compte à zéro', () => {
  const etat = avecJoueurDevant();
  acte2.traiterMessage(etat, 'presence', false);
  passer(etat, DELAI_ABSENCE_S - 1);

  acte2.traiterMessage(etat, 'presence', true);
  assert.deepEqual(passer(etat, DELAI_ABSENCE_S * 3), []);

  // Nouvelle absence : le délai complet est de nouveau nécessaire
  acte2.traiterMessage(etat, 'presence', false);
  assert.deepEqual(passer(etat, DELAI_ABSENCE_S - 1), []);
  assert.equal(deType(acte2.tick(etat), 'acte_resolu').length, 1);
});

test('une absence signalée avant toute présence est ignorée et ne résout rien', () => {
  const { etat } = acte2.demarrer();
  const effets = acte2.traiterMessage(etat, 'presence', false);
  assert.equal(deType(effets, 'ignore').length, 1);
  assert.deepEqual(passer(etat, DELAI_ABSENCE_S * 5), []);
  assert.equal(etat.enigmes[CODES.autoplay], ACTIVE);
});

test('sans aucun message du capteur, le temps ne résout rien', () => {
  const { etat } = acte2.demarrer();
  assert.deepEqual(passer(etat, DELAI_ABSENCE_S * 5), []);
});

test('un message "absent" répété ne repousse pas la résolution', () => {
  const etat = avecJoueurDevant();
  acte2.traiterMessage(etat, 'presence', false);
  passer(etat, DELAI_ABSENCE_S - 2);
  acte2.traiterMessage(etat, 'presence', false); // redélivrance QoS 1
  assert.deepEqual(acte2.tick(etat), []);
  assert.equal(deType(acte2.tick(etat), 'acte_resolu').length, 1);
});

test('l\'acte livre son fragment une seule fois', () => {
  const etat = avecJoueurDevant();
  acte2.traiterMessage(etat, 'presence', false);
  const effets = passer(etat, DELAI_ABSENCE_S * 3);
  assert.equal(deType(effets, 'acte_resolu').length, 1);
  assert.equal(deType(effets, 'action').length, 1);
});

test('une fois résolue, l\'énigme ignore les nouveaux messages de présence', () => {
  const etat = avecJoueurDevant();
  acte2.traiterMessage(etat, 'presence', false);
  passer(etat, DELAI_ABSENCE_S);
  const effets = acte2.traiterMessage(etat, 'presence', true);
  assert.equal(deType(effets, 'ignore').length, 1);
  assert.equal(etat.enigmes[CODES.autoplay], RESOLUE);
});

test('une valeur qui n\'est pas un booléen est ignorée', () => {
  const etat = avecJoueurDevant();
  for (const valeur of ['true', 1, null, undefined]) {
    const effets = acte2.traiterMessage(etat, 'presence', valeur);
    assert.equal(deType(effets, 'ignore').length, 1, `valeur ${valeur}`);
  }
  assert.equal(etat.presence, true);
});

test('un élément inconnu est ignoré', () => {
  const { etat } = acte2.demarrer();
  assert.equal(deType(acte2.traiterMessage(etat, 'bouton/1', 'appui'), 'ignore').length, 1);
});
