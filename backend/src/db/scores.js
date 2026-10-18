// Accès à la table score
const pool = require('./pool');

// Formule provisoire, à valider avec l'équipe (game design)
function calculerPoints({ victoire, tempsS, nbErreurs, jaugeFinale }) {
  if (!victoire) return 0;
  return Math.max(0, 1000 - tempsS - 50 * nbErreurs - 2 * jaugeFinale);
}

// Crée le score d'une session terminée (une seule fois par session)
async function enregistrerScore(session) {
  const tempsS = Math.round((new Date(session.fin_le) - new Date(session.debut_le)) / 1000);
  const victoire = session.statut === 'victoire';
  const points = calculerPoints({
    victoire, tempsS, nbErreurs: session.nb_erreurs, jaugeFinale: session.jauge,
  });
  const { rows } = await pool.query(
    `INSERT INTO score (session_id, temps_s, nb_erreurs, jauge_finale, victoire, points)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (session_id) DO NOTHING RETURNING *`,
    [session.id, tempsS, session.nb_erreurs, session.jauge, victoire, points],
  );
  return rows[0] || null;
}

async function listerScores() {
  const { rows } = await pool.query('SELECT * FROM score ORDER BY points DESC, temps_s ASC');
  return rows;
}

module.exports = { calculerPoints, enregistrerScore, listerScores };
