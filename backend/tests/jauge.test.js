const test = require('node:test');
const assert = require('node:assert/strict');
const jauge = require('../src/game/jauge');

test('la jauge reste bornée entre 0 et 100', () => {
  assert.equal(jauge.appliquerAction(2), 0);
  assert.equal(jauge.appliquerErreur(99), 100);
});

test('une action utile fait baisser la jauge', () => {
  assert.equal(jauge.appliquerAction(50), 45);
  assert.equal(jauge.appliquerAction(50, 3), 35);
});

test('une erreur fait monter la jauge', () => {
  assert.equal(jauge.appliquerErreur(50), 53);
});

test("l'inactivité ne pénalise pas avant le délai de grâce", () => {
  assert.equal(jauge.appliquerInactivite(40, 10), 40);
  assert.equal(jauge.appliquerInactivite(40, 15), 40);
});

test("l'inactivité fait monter la jauge après le délai de grâce", () => {
  assert.equal(jauge.appliquerInactivite(40, 65), 50);
});

test('la jauge pleine déclenche la défaite', () => {
  assert.equal(jauge.estPleine(99), false);
  assert.equal(jauge.estPleine(100), true);
});

test('Acte 4 : plus la jauge est haute, plus il y a de fragments brouillés', () => {
  assert.equal(jauge.nbFragmentsBrouilles(0), 0);
  assert.equal(jauge.nbFragmentsBrouilles(24), 0);
  assert.equal(jauge.nbFragmentsBrouilles(25), 1);
  assert.equal(jauge.nbFragmentsBrouilles(60), 2);
  assert.equal(jauge.nbFragmentsBrouilles(75), 3);
  assert.equal(jauge.nbFragmentsBrouilles(100), 3);
});

test('Acte 4 : les fragments brouillés sont les plus récents', () => {
  assert.deepEqual(jauge.actesBrouilles(10), []);
  assert.deepEqual(jauge.actesBrouilles(30), [3]);
  assert.deepEqual(jauge.actesBrouilles(60), [2, 3]);
  assert.deepEqual(jauge.actesBrouilles(90), [1, 2, 3]);
});
