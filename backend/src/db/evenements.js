// Accès à la table evenement (journal de la partie)
const pool = require('./pool');

async function enregistrerEvenement({ sessionId = null, capteurId = null, type, message = null, donnees = null }) {
  await pool.query(
    'INSERT INTO evenement (session_id, capteur_id, type, message, donnees) VALUES ($1, $2, $3, $4, $5::jsonb)',
    [sessionId, capteurId, type, message, donnees === null ? null : JSON.stringify(donnees)],
  );
}

async function evenementsDeSession(sessionId, limite = 200) {
  const { rows } = await pool.query(
    'SELECT * FROM evenement WHERE session_id = $1 ORDER BY cree_le DESC, id DESC LIMIT $2',
    [sessionId, limite],
  );
  return rows;
}

module.exports = { enregistrerEvenement, evenementsDeSession };
