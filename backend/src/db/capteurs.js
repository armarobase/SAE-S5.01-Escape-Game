// Accès à la table capteur
const pool = require('./pool');

// Enregistre la dernière valeur reçue. Retourne l'id du capteur, ou null si le topic est inconnu.
async function majDerniereValeur(topic, valeur) {
  const { rows } = await pool.query(
    `UPDATE capteur SET derniere_valeur = $2::jsonb, derniere_maj = now()
     WHERE topic = $1 RETURNING id`,
    [topic, JSON.stringify(valeur)],
  );
  return rows[0] ? rows[0].id : null;
}

async function listerCapteurs() {
  const { rows } = await pool.query('SELECT * FROM capteur ORDER BY acte, topic');
  return rows;
}

module.exports = { majDerniereValeur, listerCapteurs };
