const test = require('node:test');
const assert = require('node:assert/strict');
const session = require('../src/game/session');
const config = require('../src/game/config');

const BADGE = config.acte1.BADGES_AUTORISES[0];
const { DEPART, BAISSE_PAR_ACTION, DELAI_INACTIVITE_S, MONTEE_INACTIVITE_PAR_S } = config.jauge;
const { DELAI_ABSENCE_S } = config.acte2;

const deType = (effets, type) => effets.filter((e) => e.type === type);

// Envoie une suite de messages [topic, valeur] et renvoie tous les effets produits
function envoyer(partie, messages) {
  return messages.flatMap(([topic, valeur]) => session.traiterMessage(partie, topic, valeur));
}

// Scénario complet de l'Acte 1 (le même que le simulateur)
const SCENARIO_ACTE1 = [
  ['datamonstre/acte1/badge', BADGE],
  ['datamonstre/acte1/bouton/1', 'appui'],
  ['datamonstre/acte1/bouton/2', 'appui'],
  ['datamonstre/acte1/bouton/3', 'appui'],
  ['datamonstre/acte1/slider', 0],
  ['datamonstre/acte1/lumiere', 5],
];

test('une nouvelle partie démarre sur l\'Acte 1, jauge de départ, 40 minutes', () => {
  const { partie, effets } = session.demarrerPartie();
  assert.equal(partie.statut, 'en_cours');
  assert.equal(partie.acteCourant, 1);
  assert.equal(partie.jauge, DEPART);
  assert.equal(partie.tempsRestantS, 2400);

  assert.deepEqual(deType(effets, 'etat_jeu'), [{ type: 'etat_jeu', statut: 'en_cours', acte: 1 }]);
  assert.deepEqual(deType(effets, 'jauge'), [{ type: 'jauge', valeur: DEPART, cause: 'depart' }]);
  // Les 3 LED de l'Acte 1 sont allumées au départ
  assert.equal(deType(effets, 'led').length, 3);
  assert.ok(deType(effets, 'led').every((e) => e.acte === 1 && e.valeur === 'on'));
});

test('chaque tick décompte le temps ; la jauge ne monte qu\'après le délai d\'inactivité', () => {
  const { partie } = session.demarrerPartie();
  for (let s = 0; s < DELAI_INACTIVITE_S; s++) {
    assert.deepEqual(session.tick(partie), []);
  }
  assert.equal(partie.tempsRestantS, 2400 - DELAI_INACTIVITE_S);
  assert.equal(partie.jauge, DEPART);

  const effets = session.tick(partie);
  assert.deepEqual(effets, [{ type: 'jauge', valeur: DEPART + MONTEE_INACTIVITE_PAR_S, cause: 'inactivite' }]);
});

test('une action fait baisser la jauge et remet l\'inactivité à zéro', () => {
  const { partie } = session.demarrerPartie();
  for (let s = 0; s < 20; s++) session.tick(partie);
  assert.equal(partie.secondesSansAction, 20);
  const jaugeAvant = partie.jauge;

  const effets = session.traiterMessage(partie, 'datamonstre/acte1/badge', BADGE);
  assert.equal(partie.jauge, jaugeAvant - BAISSE_PAR_ACTION);
  assert.equal(partie.secondesSansAction, 0);
  assert.deepEqual(deType(effets, 'jauge'), [{ type: 'jauge', valeur: partie.jauge, cause: 'action' }]);
});

test('les effets de l\'acte sont transmis en précisant l\'acte', () => {
  const { partie } = session.demarrerPartie();
  envoyer(partie, [['datamonstre/acte1/badge', BADGE]]);
  const effets = session.traiterMessage(partie, 'datamonstre/acte1/bouton/2', 'appui');
  assert.deepEqual(deType(effets, 'led'), [{ type: 'led', acte: 1, numero: 2, valeur: 'off' }]);
});

// Change temporairement le dernier acte jouable le temps d'un test, puis remet la valeur d'origine
function avecDernierActe(valeur, testFn) {
  return () => {
    const origine = config.DERNIER_ACTE;
    config.DERNIER_ACTE = valeur;
    try {
      testFn();
    } finally {
      config.DERNIER_ACTE = origine;
    }
  };
}

test('l\'Acte 1 résolu livre son fragment et la partie passe à l\'Acte 2', avecDernierActe(4, () => {
  const { partie } = session.demarrerPartie();
  const effets = envoyer(partie, SCENARIO_ACTE1);

  assert.deepEqual(deType(effets, 'fragment'), [
    { type: 'fragment', acte: 1, valeur: config.acte1.FRAGMENT, ordre: config.acte1.ORDRE_FRAGMENT },
  ]);
  assert.equal(partie.acteCourant, 2);
  assert.deepEqual(deType(effets, 'etat_jeu'), [{ type: 'etat_jeu', statut: 'en_cours', acte: 2 }]);
  assert.equal(partie.fragments.length, 1);
  // 6 actions : badge, 3 coupures, écran, veille
  assert.equal(partie.jauge, DEPART - 6 * BAISSE_PAR_ACTION);
}));

test('à l\'Acte 2, la présence est traitée et les messages des autres actes sont ignorés', avecDernierActe(4, () => {
  const { partie } = session.demarrerPartie();
  envoyer(partie, SCENARIO_ACTE1);

  assert.deepEqual(session.traiterMessage(partie, 'datamonstre/acte2/presence', true), []);
  assert.equal(partie.etatActe.presence, true);

  const ancienActe = session.traiterMessage(partie, 'datamonstre/acte1/bouton/1', 'appui');
  assert.deepEqual(ancienActe.map((e) => e.type), ['ignore']);
}));

test('l\'Acte 2 démarre avec son énigme active', avecDernierActe(4, () => {
  const { partie } = session.demarrerPartie();
  const effets = envoyer(partie, SCENARIO_ACTE1);
  assert.deepEqual(deType(effets, 'enigme').slice(-1), [
    { type: 'enigme', acte: 2, code: 'acte2_autoplay', etat: 'active' },
  ]);
}));

test('l\'Acte 2 se résout avec le temps : tick() fait avancer le délai d\'absence', avecDernierActe(4, () => {
  const { partie } = session.demarrerPartie();
  envoyer(partie, SCENARIO_ACTE1);
  envoyer(partie, [['datamonstre/acte2/presence', true], ['datamonstre/acte2/presence', false]]);

  let effets = [];
  for (let s = 0; s < DELAI_ABSENCE_S - 1; s++) effets.push(...session.tick(partie));
  assert.deepEqual(deType(effets, 'fragment'), []);

  // La jauge est déjà à 0 après l'Acte 1 : on la remonte pour voir la baisse
  partie.jauge = 50;
  effets = session.tick(partie);
  assert.deepEqual(deType(effets, 'fragment'), [
    { type: 'fragment', acte: 2, valeur: config.acte2.FRAGMENT, ordre: config.acte2.ORDRE_FRAGMENT },
  ]);
  assert.deepEqual(deType(effets, 'enigme'), [
    { type: 'enigme', acte: 2, code: 'acte2_autoplay', etat: 'resolue' },
  ]);
  assert.equal(partie.jauge, 50 - BAISSE_PAR_ACTION);
  assert.deepEqual(deType(effets, 'jauge'), [{ type: 'jauge', valeur: 50 - BAISSE_PAR_ACTION, cause: 'action' }]);
  assert.equal(partie.acteCourant, 3); // l'Acte 3 n'existe pas encore : ses messages seront ignorés
  assert.equal(partie.fragments.length, 2);
}));

test('Prototype : Acte 1 puis Acte 2 résolus donnent la victoire', () => {
  const { partie } = session.demarrerPartie();
  envoyer(partie, SCENARIO_ACTE1);
  assert.equal(partie.statut, 'en_cours');
  assert.equal(partie.acteCourant, 2);

  envoyer(partie, [['datamonstre/acte2/presence', true], ['datamonstre/acte2/presence', false]]);
  const effets = [];
  for (let s = 0; s < DELAI_ABSENCE_S; s++) effets.push(...session.tick(partie));

  assert.equal(partie.statut, 'victoire');
  assert.equal(partie.acteCourant, 2);
  assert.deepEqual(partie.fragments.map((f) => f.acte), [1, 2]);
  assert.deepEqual(deType(effets, 'fin'), [{ type: 'fin', statut: 'victoire', raison: 'acte 2 résolu (dernier acte)' }]);
  assert.deepEqual(deType(effets, 'etat_jeu'), [{ type: 'etat_jeu', statut: 'victoire', acte: 2 }]);
});

test('la jauge pleine donne la défaite à l\'Acte 2, et l\'acte n\'avance plus', avecDernierActe(4, () => {
  const { partie } = session.demarrerPartie();
  envoyer(partie, SCENARIO_ACTE1);
  envoyer(partie, [['datamonstre/acte2/presence', true], ['datamonstre/acte2/presence', false]]);
  partie.jauge = 99.9;
  partie.secondesSansAction = 1000;

  const effets = session.tick(partie);
  assert.equal(partie.statut, 'defaite');
  assert.deepEqual(deType(effets, 'fin').map((e) => e.raison), ['jauge pleine']);
  assert.equal(partie.etatActe.absenceS, 0);
}));

test('avec DERNIER_ACTE = 1, le scénario de l\'Acte 1 donne la victoire', avecDernierActe(1, () => {
  const { partie } = session.demarrerPartie();
  const effets = envoyer(partie, SCENARIO_ACTE1);

  assert.equal(partie.statut, 'victoire');
  assert.equal(partie.acteCourant, 1);
  // Le fragment est collecté avant la fin, puis la partie se termine
  assert.deepEqual(effets.slice(-3).map((e) => e.type), ['fragment', 'fin', 'etat_jeu']);
  assert.deepEqual(deType(effets, 'fin'), [{ type: 'fin', statut: 'victoire', raison: 'acte 1 résolu (dernier acte)' }]);
  assert.deepEqual(deType(effets, 'etat_jeu'), [{ type: 'etat_jeu', statut: 'victoire', acte: 1 }]);
}));

test('après la victoire, le temps s\'arrête et les messages sont ignorés', avecDernierActe(1, () => {
  const { partie } = session.demarrerPartie();
  envoyer(partie, SCENARIO_ACTE1);
  const tempsRestant = partie.tempsRestantS;

  assert.deepEqual(session.tick(partie), []);
  assert.equal(partie.tempsRestantS, tempsRestant);
  const effets = session.traiterMessage(partie, 'datamonstre/acte1/bouton/1', 'appui');
  assert.deepEqual(effets.map((e) => e.type), ['ignore']);
}));

test('la valeur par défaut est DERNIER_ACTE = 2 (jalon Prototype)', () => {
  assert.equal(config.DERNIER_ACTE, 2);
});

test('un message d\'un acte qui n\'est pas en cours est ignoré', () => {
  const { partie } = session.demarrerPartie();
  const effets = session.traiterMessage(partie, 'datamonstre/acte3/port/1', 'debranche');
  assert.deepEqual(effets.map((e) => e.type), ['ignore']);
});

test('un topic inattendu est ignoré', () => {
  const { partie } = session.demarrerPartie();
  const effets = session.traiterMessage(partie, 'datamonstre/jeu/etat', {});
  assert.deepEqual(effets.map((e) => e.type), ['ignore']);
});

test('défaite quand la jauge atteint le maximum', () => {
  const { partie } = session.demarrerPartie();
  let effets = [];
  let secondes = 0;
  while (partie.statut === 'en_cours') {
    effets = session.tick(partie);
    secondes++;
  }
  assert.equal(partie.statut, 'defaite');
  assert.ok(secondes < config.DUREE_PARTIE_S, 'la jauge doit être pleine avant la fin du temps');
  assert.deepEqual(deType(effets, 'fin'), [{ type: 'fin', statut: 'defaite', raison: 'jauge pleine' }]);
  assert.deepEqual(deType(effets, 'etat_jeu'), [{ type: 'etat_jeu', statut: 'defaite', acte: 1 }]);
});

test('défaite quand le temps est écoulé', () => {
  const { partie } = session.demarrerPartie();
  // On avance directement à la dernière seconde, la jauge restant basse
  partie.tempsRestantS = 1;
  const effets = session.tick(partie);
  assert.equal(partie.statut, 'defaite');
  assert.deepEqual(deType(effets, 'fin'), [{ type: 'fin', statut: 'defaite', raison: 'temps écoulé' }]);
});

test('après la fin, plus rien n\'est traité', () => {
  const { partie } = session.demarrerPartie();
  partie.tempsRestantS = 1;
  session.tick(partie);

  assert.deepEqual(session.tick(partie), []);
  assert.equal(partie.tempsRestantS, 0);

  const effets = session.traiterMessage(partie, 'datamonstre/acte1/badge', BADGE);
  assert.deepEqual(effets.map((e) => e.type), ['ignore']);
  assert.equal(partie.jauge, DEPART);
});
