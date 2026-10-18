// Accès aux tables session et enigme
const pool = require('./pool');
const catalogue = require('./catalogue');

// Crée une session en cours avec ses énigmes (la première est active, les autres verrouillées)
async function creerSession({ dureeLimiteS } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO session (statut, debut_le, duree_limite_s)
       VALUES ('en_cours', now(), COALESCE($1, 1800)) RETURNING *`,
      [dureeLimiteS ?? null],
    );
    const session = rows[0];
    for (const [i, e] of catalogue.entries()) {
      await client.query(
        'INSERT INTO enigme (session_id, acte, code, nom, etat) VALUES ($1, $2, $3, $4, $5)',
        [session.id, e.acte, e.code, e.nom, i === 0 ? 'active' : 'verrouillee'],
      );
    }
    await client.query('COMMIT');
    return session;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function trouverSession(id) {
  const { rows } = await pool.query('SELECT * FROM session WHERE id = $1', [id]);
  return rows[0] || null;
}

async function sessionEnCours() {
  const { rows } = await pool.query("SELECT * FROM session WHERE statut = 'en_cours'");
  return rows[0] || null;
}

async function listerSessions() {
  const { rows } = await pool.query('SELECT * FROM session ORDER BY id DESC');
  return rows;
}

async function enigmesDeSession(sessionId) {
  const { rows } = await pool.query('SELECT * FROM enigme WHERE session_id = $1 ORDER BY id', [sessionId]);
  return rows;
}

// Met à jour la jauge (bornée entre 0 et 100)
async function majJauge(sessionId, jauge) {
  await pool.query('UPDATE session SET jauge = GREATEST(0, LEAST(100, $2)) WHERE id = $1', [sessionId, jauge]);
}

async function majActeCourant(sessionId, acte) {
  await pool.query('UPDATE session SET acte_courant = $2 WHERE id = $1', [sessionId, acte]);
}

async function ajouterErreur(sessionId) {
  await pool.query('UPDATE session SET nb_erreurs = nb_erreurs + 1 WHERE id = $1', [sessionId]);
}

// Change l'état d'une énigme (verrouillee -> active -> resolue)
async function majEtatEnigme(sessionId, code, etat) {
  await pool.query(
    `UPDATE enigme SET etat = $3, resolue_le = CASE WHEN $3 = 'resolue' THEN now() END
     WHERE session_id = $1 AND code = $2`,
    [sessionId, code, etat],
  );
}

// Termine la partie si elle est en cours. Retourne la session mise à jour, ou null si déjà terminée.
async function terminerSession(sessionId, statut) {
  const { rows } = await pool.query(
    `UPDATE session SET statut = $2, fin_le = now()
     WHERE id = $1 AND statut = 'en_cours' RETURNING *`,
    [sessionId, statut],
  );
  return rows[0] || null;
}

module.exports = {
  creerSession, trouverSession, sessionEnCours, listerSessions, enigmesDeSession,
  majJauge, majActeCourant, ajouterErreur, majEtatEnigme, terminerSession,
};
