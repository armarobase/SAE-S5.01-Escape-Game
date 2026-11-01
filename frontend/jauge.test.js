import test from 'node:test';
import assert from 'node:assert/strict';
import { niveauJauge } from './jauge.js';

test('les niveaux changent aux paliers de 25 points du backend', () => {
  assert.equal(niveauJauge(0).id, 'calme');
  assert.equal(niveauJauge(24.9).id, 'calme');
  assert.equal(niveauJauge(25).id, 'tendue');
  assert.equal(niveauJauge(49).id, 'tendue');
  assert.equal(niveauJauge(50).id, 'critique');
  assert.equal(niveauJauge(75).id, 'alerte');
  assert.equal(niveauJauge(100).id, 'alerte');
});

test('une valeur invalide donne le niveau calme', () => {
  assert.equal(niveauJauge(NaN).id, 'calme');
  assert.equal(niveauJauge(undefined).id, 'calme');
});
