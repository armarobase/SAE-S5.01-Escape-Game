// Lecture de la configuration depuis le fichier .env à la racine du dépôt
const path = require('path');
// quiet : pas de message "injected env" au démarrage. Dans Docker, le fichier n'existe pas :
// les variables sont fournies par docker-compose.yml (env_file), dotenv ne fait alors rien.
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

module.exports = {
  port: Number(process.env.PORT) || 3000,

  mqtt: {
    url: process.env.MQTT_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  },

  db: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  },
};
