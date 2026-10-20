// Faux backend pour développer et démontrer le frontend sans Docker, sans base ni matériel.
// Il parle le même contrat que le vrai backend (docs/websocket.md) : API REST + WebSocket sur /ws.
//
//   npm run mock                      -> écoute sur http://localhost:3000 (le port du vrai backend)
//   MOCK_FIN=defaite npm run mock     -> la partie se termine par une défaite
//   MOCK_VITESSE=3 npm run mock       -> déroule le scénario 3 fois plus vite
//
// Ce fichier ne sert qu'au développement : il n'est pas utilisé en production.
import http from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 3000;
const VITESSE = Number(process.env.MOCK_VITESSE) || 1;
const DEFAITE = process.env.MOCK_FIN === 'defaite';

const ENIGMES = [
  ['acte1_badge', 1, 'Ouverture de la console'],
  ['acte1_notifications', 1, 'Notifications push'],
  ['acte1_ecran', 1, "Réglage de l'écran maquette"],
  ['acte1_veille', 1, 'Mise en veille'],
  ['acte2_autoplay', 2, 'Autoplay infini'],
  ['acte3_brassage', 3, 'Tri des connexions'],
  ['acte4_code', 4, 'Assemblage et saisie du code final'],
];

const FRAGMENTS = { acte1_mail_dsi: [1, '42'], acte2_log_autoplay: [2, '7'], acte3_mail_reseau: [3, '1'] };

let prochainId = 1;
let session = null;
let enigmes = [];
let narratifs = [];
let scores = [];
let minuteurs = [];
const postes = { acte1: 'online', acte2: 'online', acte3: 'online', acte4: 'online' };

const instantane = () => ({
  type: 'etat',
  serveurMs: Date.now(),
  session,
  enigmes,
  narratifs,
  postes,
});

const clients = new Set();
function diffuser(message) {
  const texte = JSON.stringify(message);
  for (const c of clients) if (c.readyState === 1) c.send(texte);
}

function definirEnigme(code, etat) {
  enigmes = enigmes.map((e) => (e.code === code ? { ...e, etat } : e));
}

function brouillesPour(jauge) {
  return [3, 2, 1].slice(0, Math.min(3, Math.floor(jauge / 25)));
}

function fin(statut) {
  session = { ...session, statut };
  const tempsS = Math.round((Date.now() - Date.parse(session.debutLe)) / 1000);
  const victoire = statut === 'victoire';
  scores.push({
    id: scores.length + 1,
    session_id: session.id,
    temps_s: tempsS,
    nb_erreurs: session.nbErreurs,
    jauge_finale: Math.round(session.jauge),
    victoire,
    points: victoire ? Math.max(0, 1000 - tempsS - 50 * session.nbErreurs - 2 * session.jauge) : 0,
  });
  diffuser(instantane());
}

// Scénario : [délai en secondes depuis le début, action]
function scenario() {
  const jauge = (v) => () => { session = { ...session, jauge: v }; diffuser({ type: 'jauge', valeur: v }); };
  const resoudre = (code, suivante) => () => {
    definirEnigme(code, 'resolue');
    if (suivante) definirEnigme(suivante, 'active');
    diffuser(instantane());
  };
  const document = (id) => () => {
    const f = FRAGMENTS[id];
    const doc = { id, fragment: f ? f[1] : null, brouille: false };
    narratifs = [...narratifs, doc];
    diffuser({ type: 'narratif', ...doc });
  };
  const acte = (n, apres) => () => { session = { ...session, acte: n }; if (apres) apres(); diffuser(instantane()); };

  const etapes = [
    [3, jauge(20)],
    [6, resoudre('acte1_badge', 'acte1_notifications')],
    [9, jauge(30)],
    [12, () => { resoudre('acte1_notifications', 'acte1_ecran')(); document('acte1_log_notifications')(); }],
    [15, jauge(24)],
    [18, resoudre('acte1_ecran', 'acte1_veille')],
    [21, () => { resoudre('acte1_veille', 'acte2_autoplay')(); session = { ...session, acte: 2 }; document('acte1_mail_dsi')(); diffuser(instantane()); }],
    [25, jauge(38)],
    [29, () => { resoudre('acte2_autoplay', 'acte3_brassage')(); session = { ...session, acte: 3 }; document('acte2_log_autoplay')(); document('acte2_mail_marketing')(); diffuser(instantane()); }],
    [33, jauge(52)],
    [36, () => { session = { ...session, nbErreurs: 2 }; diffuser(instantane()); }],
    [40, () => { document('acte3_log_ports')(); }],
    [43, () => {
      resoudre('acte3_brassage', 'acte4_code')();
      document('acte3_mail_reseau')();
      // Arrivée à l'Acte 4 : le monstre brouille des fragments selon la jauge
      const brouilles = brouillesPour(session.jauge);
      narratifs = narratifs.map((n) => {
        const f = FRAGMENTS[n.id];
        return f ? { ...n, brouille: brouilles.includes(f[0]) } : n;
      });
      acte(4, () => document('acte4_alerte')())();
    }],
  ];
  if (DEFAITE) etapes.push([50, jauge(100)], [51, () => fin('defaite')]);
  else etapes.push([50, jauge(41)], [56, () => fin('victoire')]);
  return etapes;
}

function demarrer(dureeLimiteS = 1800) {
  session = {
    id: prochainId++, statut: 'en_cours', acte: 1, jauge: 10,
    dureeLimiteS, debutLe: new Date().toISOString(), nbErreurs: 0,
  };
  enigmes = ENIGMES.map(([code, acte, nom], i) => ({ code, acte, nom, etat: i === 0 ? 'active' : 'verrouillee' }));
  narratifs = [];
  minuteurs.forEach(clearTimeout);
  minuteurs = scenario().map(([s, action]) => setTimeout(action, (s * 1000) / VITESSE));
  diffuser(instantane());
}

function repondre(res, code, corps) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(corps));
}

const serveur = http.createServer((req, res) => {
  const { method, url } = req;
  if (method === 'GET' && url === '/api/health') return repondre(res, 200, { status: 'ok', db: 'mock' });
  if (method === 'GET' && url === '/api/scores') {
    return repondre(res, 200, [...scores].sort((a, b) => b.points - a.points || a.temps_s - b.temps_s));
  }
  if (method === 'POST' && url === '/api/sessions') {
    let corps = '';
    req.on('data', (c) => (corps += c));
    req.on('end', () => {
      if (session && session.statut === 'en_cours') return repondre(res, 409, { erreur: 'Une partie est déjà en cours' });
      let duree;
      try { duree = JSON.parse(corps || '{}').dureeLimiteS; } catch { return repondre(res, 400, { erreur: 'JSON invalide' }); }
      demarrer(duree);
      repondre(res, 201, session);
    });
    return;
  }
  repondre(res, 404, { erreur: 'Route inconnue (mock)' });
});

const wss = new WebSocketServer({ server: serveur, path: '/ws' });
wss.on('connection', (socket) => {
  clients.add(socket);
  socket.send(JSON.stringify(instantane())); // instantané complet à chaque connexion
  socket.on('close', () => clients.delete(socket));
});

serveur.listen(PORT, () => {
  console.log(`[mock] http://localhost:${PORT} (REST) et ws://localhost:${PORT}/ws, vitesse x${VITESSE}${DEFAITE ? ', fin : défaite' : ''}`);
});
