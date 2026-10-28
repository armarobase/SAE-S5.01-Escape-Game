// API REST des sessions : démarrer, consulter, terminer une partie
const express = require('express');
const sessions = require('../db/sessions');
const fragments = require('../db/fragments');
const evenements = require('../db/evenements');
const scores = require('../db/scores');
const moteur = require('../game/moteur');
const configJeu = require('../game/config');

const router = express.Router();

// Express 5 transmet automatiquement les erreurs async au gestionnaire d'erreurs (voir index.js)
router.post('/', async (req, res) => {
  const duree = req.body && req.body.dureeLimiteS;
  if (duree !== undefined && (!Number.isInteger(duree) || duree <= 0)) {
    return res.status(400).json({ erreur: 'dureeLimiteS doit être un entier positif (secondes)' });
  }
  try {
    // Durée passée explicitement : la base met 1800 s (30 min) par défaut, le GDD prévoit 40 min
    const session = await sessions.creerSession({ dureeLimiteS: duree ?? configJeu.DUREE_PARTIE_S });
    await evenements.enregistrerEvenement({ sessionId: session.id, type: 'session_demarree' });
    // Lance le déroulement de la partie (timer, jauge, Acte 1)
    moteur.demarrer(session.id);
    res.status(201).json(session);
  } catch (err) {
    // Index unique : une seule partie en cours à la fois
    if (err.code === '23505') return res.status(409).json({ erreur: 'Une partie est déjà en cours' });
    throw err;
  }
});

router.get('/', async (req, res) => {
  res.json(await sessions.listerSessions());
});

router.get('/en-cours', async (req, res) => {
  const session = await sessions.sessionEnCours();
  if (!session) return res.status(404).json({ erreur: 'Aucune partie en cours' });
  res.json(session);
});

// Charge la session de l'URL, ou répond 400/404 et retourne null
async function chargerSession(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ erreur: 'Identifiant de session invalide' });
    return null;
  }
  const session = await sessions.trouverSession(id);
  if (!session) res.status(404).json({ erreur: 'Session introuvable' });
  return session;
}

// État complet : session, énigmes, fragments collectés
router.get('/:id', async (req, res) => {
  const session = await chargerSession(req, res);
  if (!session) return;
  const [enigmes, fragmentsCollectes] = await Promise.all([
    sessions.enigmesDeSession(session.id),
    fragments.fragmentsDeSession(session.id),
  ]);
  res.json({ ...session, enigmes, fragments: fragmentsCollectes });
});

router.get('/:id/evenements', async (req, res) => {
  const session = await chargerSession(req, res);
  if (!session) return;
  res.json(await evenements.evenementsDeSession(session.id));
});

// Termine la partie (victoire ou défaite) et enregistre le score
router.post('/:id/terminer', async (req, res) => {
  const session = await chargerSession(req, res);
  if (!session) return;
  const statut = req.body && req.body.statut;
  if (!['victoire', 'defaite'].includes(statut)) {
    return res.status(400).json({ erreur: "statut doit valoir 'victoire' ou 'defaite'" });
  }
  const terminee = await sessions.terminerSession(session.id, statut);
  if (!terminee) return res.status(409).json({ erreur: 'Cette partie est déjà terminée' });
  // Partie terminée à la main : on arrête aussi son timer
  if (moteur.idPartieEnCours() === session.id) moteur.arreter();
  await evenements.enregistrerEvenement({ sessionId: session.id, type: `session_${statut}` });
  const score = await scores.enregistrerScore(terminee);
  // Les écrans affichent la fin de partie (après l'enregistrement du score, comme le demande le contrat)
  moteur.diffuserEtat();
  res.json({ session: terminee, score });
});

module.exports = router;
