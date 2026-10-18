// Pool de connexions PostgreSQL partagé par tout le backend
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.db);

// Une connexion inactive qui tombe ne doit pas faire planter le backend
pool.on('error', (err) => console.error('[DB] Erreur sur une connexion inactive :', err.message));

module.exports = pool;
