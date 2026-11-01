const test = require('node:test');
const assert = require('node:assert/strict');
const messages = require('../src/websocket/messages');

// Lignes telles que la base les renvoie
const SESSION = {
  id: 7, statut: 'en_cours', acte_courant: 2, jauge: 38, duree_limite_s: 2400,
  debut_le: '2026-11-02T10:00:00.000Z', nb_erreurs: 1, cree_le: '2026-11-02T10:00:00.000Z',
};
const enigme = (code, acte, etat) => ({ id: 1, session_id: 7, code, acte, nom: `Énigme ${code}`, etat, resolue_le: null });
const ENIGMES_ACTE1_RESOLU = [
  enigme('acte1_badge', 1, 'resolue'),
  enigme('acte1_notifications', 1, 'resolue'),
  enigme('acte1_ecran', 1, 'resolue'),
  enigme('acte1_veille', 1, 'resolue'),
  enigme('acte2_autoplay', 2, 'active'),
];
const FRAGMENTS = [{ id: 1, session_id: 7, acte: 1, valeur: '4', ordre_assemblage: 1, brouille: false }];

test('instantané sans partie : session null, rien de débloqué', () => {
  const etat = messages.construireEtat({ session: null, postes: { acte1: 'online' }, maintenantMs: 1000 });
  assert.deepEqual(etat, {
    type: 'etat', serveurMs: 1000, session: null, enigmes: [], narratifs: [], postes: { acte1: 'online' },
  });
});

test('instantané : colonnes de la base renommées comme dans le contrat', () => {
  const etat = messages.construireEtat({
    session: SESSION, enigmes: ENIGMES_ACTE1_RESOLU, fragments: FRAGMENTS, postes: {}, maintenantMs: 5,
  });
  assert.equal(etat.type, 'etat');
  assert.equal(etat.serveurMs, 5);
  assert.deepEqual(etat.session, {
    id: 7, statut: 'en_cours', acte: 2, jauge: 38, dureeLimiteS: 2400,
    debutLe: '2026-11-02T10:00:00.000Z', nbErreurs: 1,
  });
  assert.deepEqual(etat.enigmes[0], { code: 'acte1_badge', acte: 1, nom: 'Énigme acte1_badge', etat: 'resolue' });
});

test('instantané : la jauge vient de la mémoire (exacte) et elle est arrondie', () => {
  const etat = messages.construireEtat({ session: SESSION, jauge: 41.6, maintenantMs: 0 });
  assert.equal(etat.session.jauge, 42);
});

test('documents : ceux de l\'Acte 1 sont débloqués quand l\'acte est résolu, avec son fragment', () => {
  const documents = messages.documentsDebloques(ENIGMES_ACTE1_RESOLU, FRAGMENTS);
  assert.deepEqual(documents, [
    { id: 'acte1_log_notifications', fragment: null, brouille: false },
    { id: 'acte1_mail_dsi', fragment: '4', brouille: false },
  ]);
});

test('documents : rien tant que l\'acte n\'est pas entièrement résolu', () => {
  const enigmes = ENIGMES_ACTE1_RESOLU.map((e) => (e.code === 'acte1_veille' ? { ...e, etat: 'active' } : e));
  assert.deepEqual(messages.documentsDebloques(enigmes, []), []);
});

test('documents : une règle peut débloquer un document dès qu\'une énigme précise est résolue', () => {
  const regles = [{ id: 'acte1_log_notifications', debloqueQuand: { enigmeResolue: 'acte1_badge' } }];
  const enigmes = [enigme('acte1_badge', 1, 'resolue'), enigme('acte1_ecran', 1, 'active')];
  assert.deepEqual(messages.documentsDebloques(enigmes, [], regles), [
    { id: 'acte1_log_notifications', fragment: null, brouille: false },
  ]);
});

test('documents : un fragment brouillé est signalé', () => {
  const documents = messages.documentsDebloques(ENIGMES_ACTE1_RESOLU, [{ ...FRAGMENTS[0], brouille: true }]);
  assert.equal(documents.find((d) => d.id === 'acte1_mail_dsi').brouille, true);
});

test('un message "narratif" seulement pour les documents pas encore envoyés', () => {
  const documents = messages.documentsDebloques(ENIGMES_ACTE1_RESOLU, FRAGMENTS);
  const dejaEnvoyes = new Set(['acte1_log_notifications']);
  assert.deepEqual(messages.messagesNouveauxDocuments(dejaEnvoyes, documents), [
    { type: 'narratif', id: 'acte1_mail_dsi', fragment: '4', brouille: false },
  ]);
});

test('message "jauge" seulement quand la valeur entière change', () => {
  assert.deepEqual(messages.messageJauge(30, null), { type: 'jauge', valeur: 30 });
  assert.equal(messages.messageJauge(30.4, 30), null);
  assert.deepEqual(messages.messageJauge(30.6, 30), { type: 'jauge', valeur: 31 });
});

test('message "postes" : seul le poste qui change', () => {
  assert.deepEqual(messages.messagePoste(3, 'offline'), { type: 'postes', postes: { acte3: 'offline' } });
});

test('un "etat" complet est demandé pour les changements de structure seulement', () => {
  assert.equal(messages.demandeEtatComplet([{ type: 'jauge', valeur: 30, cause: 'inactivite' }]), false);
  assert.equal(messages.demandeEtatComplet([{ type: 'led', acte: 1, numero: 1, valeur: 'off' }]), false);
  assert.equal(messages.demandeEtatComplet([{ type: 'enigme', acte: 1, code: 'acte1_badge', etat: 'resolue' }]), true);
  assert.equal(messages.demandeEtatComplet([{ type: 'fin', statut: 'victoire', raison: '' }]), true);
});
