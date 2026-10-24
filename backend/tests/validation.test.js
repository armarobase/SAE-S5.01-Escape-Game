const test = require('node:test');
const assert = require('node:assert/strict');
const { validerMessage } = require('../src/mqtt/validation');
const config = require('../src/game/config');

// Raccourcis : message accepté, ou refusé avec une raison qui contient le texte donné
function accepte(topic, valeur) {
  assert.deepEqual(validerMessage(topic, { valeur }), { statut: 'valide' }, `${topic} = ${JSON.stringify(valeur)}`);
}
function refuse(topic, data, extraitRaison) {
  const resultat = validerMessage(topic, data);
  assert.equal(resultat.statut, 'refuse', `${topic} = ${JSON.stringify(data)}`);
  assert.ok(resultat.raison.includes(extraitRaison), `raison obtenue : ${resultat.raison}`);
}

test('badge : texte non vide', () => {
  accepte('datamonstre/acte1/badge', '04A1B2C3');
  refuse('datamonstre/acte1/badge', { valeur: '' }, 'attendu un texte non vide');
  refuse('datamonstre/acte1/badge', { valeur: '   ' }, 'attendu un texte non vide');
  refuse('datamonstre/acte1/badge', { valeur: 1234 }, 'attendu un texte non vide');
});

test('boutons : exactement "appui", numéros de 1 à NB_BOUTONS', () => {
  for (let n = 1; n <= config.acte1.NB_BOUTONS; n++) accepte(`datamonstre/acte1/bouton/${n}`, 'appui');
  refuse('datamonstre/acte1/bouton/1', { valeur: 'relache' }, 'attendu "appui"');
  refuse('datamonstre/acte1/bouton/1', { valeur: 'Appui' }, 'attendu "appui"');
  refuse(`datamonstre/acte1/bouton/${config.acte1.NB_BOUTONS + 1}`, { valeur: 'appui' }, 'topic inconnu');
  refuse('datamonstre/acte1/bouton/0', { valeur: 'appui' }, 'topic inconnu');
});

test('slider et lumière : entier de 0 à 100', () => {
  for (const topic of ['datamonstre/acte1/slider', 'datamonstre/acte1/lumiere']) {
    accepte(topic, 0);
    accepte(topic, 100);
    refuse(topic, { valeur: 150 }, 'valeur hors limites : 150, attendu un entier de 0 à 100');
    refuse(topic, { valeur: -1 }, 'valeur hors limites');
    refuse(topic, { valeur: 12.5 }, 'valeur invalide');
    refuse(topic, { valeur: '50' }, 'valeur invalide');
  }
});

test('présence : booléen', () => {
  accepte('datamonstre/acte2/presence', true);
  accepte('datamonstre/acte2/presence', false);
  refuse('datamonstre/acte2/presence', { valeur: 'false' }, 'attendu true ou false');
  refuse('datamonstre/acte2/presence', { valeur: 0 }, 'attendu true ou false');
});

test('ports : "branche" ou "debranche", numéros de 1 à NB_PORTS', () => {
  accepte('datamonstre/acte3/port/1', 'branche');
  accepte(`datamonstre/acte3/port/${config.acte3.NB_PORTS}`, 'debranche');
  refuse('datamonstre/acte3/port/2', { valeur: 'débranché' }, 'attendu "branche" ou "debranche"');
  refuse(`datamonstre/acte3/port/${config.acte3.NB_PORTS + 1}`, { valeur: 'branche' }, 'topic inconnu');
});

test('code : texte de chiffres uniquement', () => {
  accepte('datamonstre/acte4/code', '4271');
  refuse('datamonstre/acte4/code', { valeur: 4271 }, 'attendu un texte de chiffres uniquement');
  refuse('datamonstre/acte4/code', { valeur: '42a1' }, 'attendu un texte de chiffres uniquement');
  refuse('datamonstre/acte4/code', { valeur: '' }, 'attendu un texte de chiffres uniquement');
});

test('statut des postes : "online" ou "offline"', () => {
  for (let acte = 1; acte <= 4; acte++) accepte(`datamonstre/poste/acte${acte}/statut`, 'online');
  accepte('datamonstre/poste/acte2/statut', 'offline');
  refuse('datamonstre/poste/acte1/statut', { valeur: 'connecte' }, 'attendu "online" ou "offline"');
  refuse('datamonstre/poste/acte5/statut', { valeur: 'online' }, 'topic inconnu');
});

test('champ "valeur" absent ou message qui n\'est pas un objet', () => {
  refuse('datamonstre/acte1/bouton/1', { etat: 'appui' }, 'champ "valeur" absent');
  refuse('datamonstre/acte1/bouton/1', null, 'champ "valeur" absent');
  refuse('datamonstre/acte1/bouton/1', 'appui', 'champ "valeur" absent');
});

test('le timestamp facultatif du contrat est accepté', () => {
  assert.deepEqual(
    validerMessage('datamonstre/acte1/slider', { valeur: 40, timestamp: 1792233938537 }),
    { statut: 'valide' },
  );
});

test('topic inconnu', () => {
  refuse('datamonstre/acte1/inconnu', { valeur: 'appui' }, 'topic inconnu');
  refuse('autre/chose', { valeur: 1 }, 'topic inconnu');
});

test('les ordres publiés par le backend sont reconnus et ignorés sans être refusés', () => {
  const ordres = [
    'datamonstre/acte1/led/2',
    'datamonstre/acte1/bargraph',
    'datamonstre/acte3/led/4',
    'datamonstre/acte4/lcd',
    'datamonstre/jeu/etat',
  ];
  for (const topic of ordres) {
    assert.deepEqual(validerMessage(topic, { valeur: 'on' }), { statut: 'actionneur' }, topic);
  }
});
