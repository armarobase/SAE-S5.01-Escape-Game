import test from 'node:test';
import assert from 'node:assert/strict';
import { etatInitial, reducer } from './reducer.js';

const session = { id: 7, statut: 'en_cours', acte: 1, jauge: 40, dureeLimiteS: 1800, debutLe: '2026-11-02T10:00:00.000Z', nbErreurs: 0 };
const message = (m, recuLe = 0) => ({ type: 'message', message: m, recuLe });

test("l'état initial n'a pas de session", () => {
  assert.equal(etatInitial.session, null);
  assert.equal(etatInitial.connexion, 'connexion');
});

test("l'action connexion change le statut de connexion", () => {
  assert.equal(reducer(etatInitial, { type: 'connexion', statut: 'connecte' }).connexion, 'connecte');
});

test("un instantané 'etat' remplace session, énigmes et documents", () => {
  const e = reducer(etatInitial, message({
    type: 'etat', session,
    enigmes: [{ code: 'acte1_badge', acte: 1, nom: 'Ouverture de la console', etat: 'active' }],
    narratifs: [{ id: 'acte1_log_notifications', fragment: null, brouille: false }],
    postes: { acte1: 'online', acte2: 'offline' },
  }));
  assert.equal(e.session.id, 7);
  assert.equal(e.enigmes.length, 1);
  assert.equal(e.narratifs.length, 1);
  assert.equal(e.postes.acte1, 'online');
  assert.equal(e.postes.acte2, 'offline');
  assert.equal(e.postes.acte3, 'inconnu');
});

test("un instantané sans session remet l'écran en attente", () => {
  const avant = reducer(etatInitial, message({ type: 'etat', session }));
  assert.equal(reducer(avant, message({ type: 'etat', session: null })).session, null);
});

test("le décalage d'horloge est calculé à partir de serveurMs", () => {
  const e = reducer(etatInitial, message({ type: 'etat', session, serveurMs: 10_000 }, 4_000));
  assert.equal(e.decalageMs, 6_000);
});

test("un message 'jauge' met à jour la jauge, bornée entre 0 et 100", () => {
  const avant = reducer(etatInitial, message({ type: 'etat', session }));
  assert.equal(reducer(avant, message({ type: 'jauge', valeur: 62 })).session.jauge, 62);
  assert.equal(reducer(avant, message({ type: 'jauge', valeur: 140 })).session.jauge, 100);
  assert.equal(reducer(avant, message({ type: 'jauge', valeur: -3 })).session.jauge, 0);
});

test("une jauge invalide ou sans session est ignorée", () => {
  assert.equal(reducer(etatInitial, message({ type: 'jauge', valeur: 50 })), etatInitial);
  const avant = reducer(etatInitial, message({ type: 'etat', session }));
  assert.equal(reducer(avant, message({ type: 'jauge', valeur: 'abc' })), avant);
});

test("un nouveau document est ajouté une seule fois", () => {
  const doc = { type: 'narratif', id: 'acte1_mail_dsi', fragment: '42', brouille: false };
  const une = reducer(etatInitial, message(doc));
  const deux = reducer(une, message(doc));
  assert.equal(une.narratifs.length, 1);
  assert.equal(deux.narratifs.length, 1);
  assert.equal(une.narratifs[0].fragment, '42');
});

test("un message 'postes' ignore les statuts hors contrat", () => {
  const e = reducer(etatInitial, message({ type: 'postes', postes: { acte1: 'online', acte2: 'en panne', acte9: 'online' } }));
  assert.equal(e.postes.acte1, 'online');
  assert.equal(e.postes.acte2, 'inconnu');
  assert.equal('acte9' in e.postes, false);
});

test("les messages inconnus ou mal formés ne changent rien", () => {
  assert.equal(reducer(etatInitial, message({ type: 'bidule' })), etatInitial);
  assert.equal(reducer(etatInitial, message(null)), etatInitial);
  assert.equal(reducer(etatInitial, message('texte')), etatInitial);
});
