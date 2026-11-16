const test = require('node:test');
const assert = require('node:assert/strict');
const acte3 = require('../src/game/actes/acte3');
const config = require('../src/game/config');

const { CODES, ACTIVE, RESOLUE } = acte3;
const { NB_PORTS, PORTS_ACTIFS, DELAI_CONFIRMATION_S, FRAGMENT, ORDRE_FRAGMENT } = config.acte3;

const INUTILES = Array.from({ length: NB_PORTS }, (_, i) => i + 1).filter((n) => !PORTS_ACTIFS.includes(n));
const deType = (effets, type) => effets.filter((e) => e.type === type);

const debrancher = (etat, n) => acte3.traiterMessage(etat, `port/${n}`, 'debranche');
const brancher = (etat, n) => acte3.traiterMessage(etat, `port/${n}`, 'branche');

// Fait passer `n` secondes et renvoie tous les effets produits
function passer(etat, n) {
  return Array.from({ length: n }, () => acte3.tick(etat)).flat();
}

// Débranche tous les ports inutiles
function trier(etat) {
  return INUTILES.flatMap((n) => debrancher(etat, n));
}

// Active temporairement un délai de confirmation, le temps d'un test
function avecDelai(valeur, testFn) {
  return () => {
    const origine = config.acte3.DELAI_CONFIRMATION_S;
    config.acte3.DELAI_CONFIRMATION_S = valeur;
    try {
      testFn();
    } finally {
      config.acte3.DELAI_CONFIRMATION_S = origine;
    }
  };
}

test('la configuration de test a au moins un port actif et un port inutile', () => {
  assert.ok(PORTS_ACTIFS.length >= 1);
  assert.ok(INUTILES.length >= 1);
});

test('au démarrage, l\'énigme est active, tous les ports sont branchés et les LED vertes', () => {
  const { etat, effets } = acte3.demarrer();
  assert.equal(etat.enigmes[CODES.brassage], ACTIVE);
  assert.ok(etat.branches.every(Boolean));
  assert.deepEqual(deType(effets, 'enigme'), [{ type: 'enigme', code: 'acte3_brassage', etat: ACTIVE }]);
  assert.deepEqual(
    deType(effets, 'led'),
    Array.from({ length: NB_PORTS }, (_, i) => ({ type: 'led', numero: i + 1, valeur: 'vert' })),
  );
});

test('débrancher un port inutile passe sa LED au rouge et fait baisser la jauge', () => {
  const { etat } = acte3.demarrer();
  assert.deepEqual(debrancher(etat, INUTILES[0]), [
    { type: 'led', numero: INUTILES[0], valeur: 'rouge' },
    { type: 'action' },
  ]);
});

test('seul le premier débranchement d\'un port inutile fait baisser la jauge', () => {
  const { etat } = acte3.demarrer();
  debrancher(etat, INUTILES[0]);
  assert.deepEqual(brancher(etat, INUTILES[0]), [{ type: 'led', numero: INUTILES[0], valeur: 'vert' }]);
  assert.deepEqual(debrancher(etat, INUTILES[0]), [{ type: 'led', numero: INUTILES[0], valeur: 'rouge' }]);
});

test('débrancher un port encore actif est une erreur ; le rebrancher est gratuit', () => {
  const { etat } = acte3.demarrer();
  const effets = debrancher(etat, PORTS_ACTIFS[0]);
  assert.deepEqual(effets.map((e) => e.type), ['led', 'erreur']);
  assert.equal(effets[0].valeur, 'rouge');
  assert.match(effets[1].raison, /encore active/);

  assert.deepEqual(brancher(etat, PORTS_ACTIFS[0]), [{ type: 'led', numero: PORTS_ACTIFS[0], valeur: 'vert' }]);
  // Une nouvelle erreur chaque fois qu'on recommence
  assert.equal(deType(debrancher(etat, PORTS_ACTIFS[0]), 'erreur').length, 1);
});

test('un message répété ne change rien (redélivrance QoS 1, état initial publié par la carte)', () => {
  const { etat } = acte3.demarrer();
  assert.deepEqual(brancher(etat, 1), []); // déjà branché
  debrancher(etat, INUTILES[0]);
  assert.deepEqual(debrancher(etat, INUTILES[0]), []);
  assert.deepEqual(debrancher(etat, PORTS_ACTIFS[0]).length, 2);
  assert.deepEqual(debrancher(etat, PORTS_ACTIFS[0]), []); // pas de deuxième erreur
});

test('la bonne configuration ne résout l\'énigme qu\'après le délai de confirmation', () => {
  const { etat } = acte3.demarrer();
  trier(etat);
  assert.deepEqual(passer(etat, DELAI_CONFIRMATION_S - 1), []);
  assert.equal(etat.enigmes[CODES.brassage], ACTIVE);

  assert.deepEqual(acte3.tick(etat), [
    { type: 'enigme', code: 'acte3_brassage', etat: RESOLUE },
    { type: 'action' },
    { type: 'acte_resolu', acte: 3, fragment: FRAGMENT, ordre: ORDRE_FRAGMENT },
  ]);
  assert.equal(etat.enigmes[CODES.brassage], RESOLUE);
});

test('rien n\'est résolu tant que tous les ports inutiles ne sont pas débranchés', () => {
  const { etat } = acte3.demarrer();
  assert.deepEqual(passer(etat, 100), []);
  for (const n of INUTILES.slice(0, -1)) debrancher(etat, n);
  assert.deepEqual(deType(passer(etat, 100), 'acte_resolu'), []);
});

test('une configuration qui bouge pendant le délai remet la confirmation à zéro', () => {
  const { etat } = acte3.demarrer();
  trier(etat);
  passer(etat, DELAI_CONFIRMATION_S - 1);

  brancher(etat, INUTILES[0]); // un joueur se ravise
  assert.deepEqual(passer(etat, DELAI_CONFIRMATION_S * 3), []);

  debrancher(etat, INUTILES[0]); // et recommence : le délai complet repart
  assert.deepEqual(passer(etat, DELAI_CONFIRMATION_S - 1), []);
  assert.equal(deType(acte3.tick(etat), 'acte_resolu').length, 1);
});

test('débrancher aussi le port actif empêche la résolution', () => {
  const { etat } = acte3.demarrer();
  trier(etat);
  debrancher(etat, PORTS_ACTIFS[0]);
  assert.deepEqual(passer(etat, DELAI_CONFIRMATION_S * 3), []);

  brancher(etat, PORTS_ACTIFS[0]);
  assert.equal(deType(passer(etat, DELAI_CONFIRMATION_S), 'acte_resolu').length, 1);
});

test('l\'ordre des débranchements est libre', () => {
  const { etat } = acte3.demarrer();
  for (const n of [...INUTILES].reverse()) debrancher(etat, n);
  assert.equal(deType(passer(etat, DELAI_CONFIRMATION_S), 'acte_resolu').length, 1);
});

test('l\'acte livre son fragment une seule fois', () => {
  const { etat } = acte3.demarrer();
  trier(etat);
  const effets = passer(etat, DELAI_CONFIRMATION_S * 5);
  assert.equal(deType(effets, 'acte_resolu').length, 1);
  assert.equal(deType(effets, 'action').length, 1);
});

test('avec un délai de confirmation à 0, le dernier débranchement résout tout de suite', avecDelai(0, () => {
  const { etat } = acte3.demarrer();
  const effets = trier(etat);
  assert.deepEqual(deType(effets, 'acte_resolu').length, 1);
  assert.equal(etat.enigmes[CODES.brassage], RESOLUE);
}));

test('une fois résolue, l\'énigme ignore les nouveaux messages', () => {
  const { etat } = acte3.demarrer();
  trier(etat);
  passer(etat, DELAI_CONFIRMATION_S);
  const effets = debrancher(etat, PORTS_ACTIFS[0]);
  assert.deepEqual(effets.map((e) => e.type), ['ignore']);
  assert.equal(etat.enigmes[CODES.brassage], RESOLUE);
});

test('les messages invalides sont ignorés sans modifier l\'état', () => {
  const { etat } = acte3.demarrer();
  const invalides = [
    ['port/0', 'debranche'],
    [`port/${NB_PORTS + 1}`, 'debranche'],
    ['port/abc', 'debranche'],
    ['port/1', 'appui'],
    ['port/1', true],
    ['bouton/1', 'appui'],
    ['presence', true],
  ];
  for (const [element, valeur] of invalides) {
    const effets = acte3.traiterMessage(etat, element, valeur);
    assert.deepEqual(effets.map((e) => e.type), ['ignore'], `${element} ${valeur}`);
  }
  assert.ok(etat.branches.every(Boolean));
});

test('sans aucun message des ports, le temps ne résout rien', () => {
  const { etat } = acte3.demarrer();
  assert.deepEqual(passer(etat, 1000), []);
});
