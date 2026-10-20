import test from 'node:test';
import assert from 'node:assert/strict';
import { formaterDuree, tempsRestantS } from './temps.js';

const debutLe = '2026-11-02T10:00:00.000Z';
const debut = Date.parse(debutLe);
const session = { statut: 'en_cours', debutLe, dureeLimiteS: 1800 };

test('formaterDuree affiche MM:SS', () => {
  assert.equal(formaterDuree(0), '00:00');
  assert.equal(formaterDuree(125), '02:05');
  assert.equal(formaterDuree(1800), '30:00');
  assert.equal(formaterDuree(3725), '62:05');
});

test('formaterDuree gère les valeurs invalides', () => {
  assert.equal(formaterDuree(-5), '00:00');
  assert.equal(formaterDuree(NaN), '00:00');
  assert.equal(formaterDuree(undefined), '00:00');
});

test('tempsRestantS décompte depuis le début de la partie', () => {
  assert.equal(tempsRestantS(session, debut, 0), 1800);
  assert.equal(tempsRestantS(session, debut + 60_000, 0), 1740);
  assert.equal(tempsRestantS(session, debut + 1_500, 0), 1799);
});

test('tempsRestantS ne passe pas sous zéro', () => {
  assert.equal(tempsRestantS(session, debut + 5_000_000, 0), 0);
});

test("tempsRestantS corrige l'écart entre horloges", () => {
  // Navigateur en retard de 10 s sur le serveur : on ajoute le décalage
  assert.equal(tempsRestantS(session, debut, 10_000), 1790);
});

test("tempsRestantS vaut null hors partie en cours", () => {
  assert.equal(tempsRestantS(null, debut), null);
  assert.equal(tempsRestantS({ ...session, statut: 'victoire' }, debut), null);
  assert.equal(tempsRestantS({ ...session, debutLe: null }, debut), null);
  assert.equal(tempsRestantS({ ...session, debutLe: 'pas une date' }, debut), null);
});
