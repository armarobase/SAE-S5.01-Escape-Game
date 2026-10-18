// Accès à la table fragment_code
const pool = require('./pool');

async function ajouterFragment({ sessionId, acte, valeur, ordreAssemblage }) {
  const { rows } = await pool.query(
    `INSERT INTO fragment_code (session_id, acte, valeur, ordre_assemblage)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [sessionId, acte, valeur, ordreAssemblage],
  );
  return rows[0];
}

async function fragmentsDeSession(sessionId) {
  const { rows } = await pool.query(
    'SELECT * FROM fragment_code WHERE session_id = $1 ORDER BY ordre_assemblage',
    [sessionId],
  );
  return rows;
}

// Marque comme brouillés les fragments des actes donnés (Acte 4 : plus la jauge est haute, plus il y en a)
async function brouillerFragments(sessionId, actes) {
  await pool.query(
    'UPDATE fragment_code SET brouille = (acte = ANY($2::int[])) WHERE session_id = $1',
    [sessionId, actes],
  );
}

module.exports = { ajouterFragment, fragmentsDeSession, brouillerFragments };
