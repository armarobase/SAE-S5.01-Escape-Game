// API REST des scores : classement des parties terminées
const express = require('express');
const scores = require('../db/scores');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json(await scores.listerScores());
});

module.exports = router;
