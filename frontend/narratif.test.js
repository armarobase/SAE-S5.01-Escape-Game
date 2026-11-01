import test from 'node:test';
import assert from 'node:assert/strict';
import { afficherFragment, documentNarratif } from './narratif.js';
import { CATALOGUE } from '../contenu/narratif.js';

test('le fragment est inséré dans le texte du document', () => {
  const doc = documentNarratif({ id: 'acte1_mail_dsi', fragment: '42' });
  assert.match(doc.corps, /: 42\./);
  assert.equal(doc.brouille, false);
  assert.equal(doc.type, 'mail');
});

test('un fragment brouillé est remplacé par des ▒ de même longueur', () => {
  assert.equal(afficherFragment({ fragment: '42', brouille: true }), '▒▒');
  const doc = documentNarratif({ id: 'acte3_mail_reseau', fragment: '917', brouille: true });
  assert.match(doc.corps, /▒▒▒/);
  assert.equal(doc.corps.includes('917'), false);
  assert.equal(doc.brouille, true);
});

test('un fragment inconnu est affiché « ?? »', () => {
  assert.equal(afficherFragment({ fragment: null, brouille: false }), '??');
});

test("un document sans fragment n'est jamais marqué brouillé", () => {
  assert.equal(documentNarratif({ id: 'acte1_log_notifications', brouille: true }).brouille, false);
});

test('un identifiant inconnu donne un document de repli', () => {
  const doc = documentNarratif({ id: 'nimporte_quoi' });
  assert.equal(doc.titre, 'Document illisible');
  assert.match(doc.corps, /nimporte_quoi/);
});

test('chaque document du catalogue est complet', () => {
  for (const [id, d] of Object.entries(CATALOGUE)) {
    assert.ok(['log', 'mail'].includes(d.type), `${id} : type`);
    assert.ok(d.acte >= 1 && d.acte <= 4, `${id} : acte`);
    assert.ok(d.titre && d.corps, `${id} : titre et corps`);
    if (d.type === 'mail') assert.ok(d.de && d.objet, `${id} : expéditeur et objet`);
  }
});

test('les fragments sont répartis sur les actes 1 à 3, un par acte', () => {
  const actes = Object.values(CATALOGUE)
    .filter((d) => d.corps.includes('{{fragment}}'))
    .map((d) => d.acte)
    .sort();
  assert.deepEqual(actes, [1, 2, 3]);
});
