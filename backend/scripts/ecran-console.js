// Faux écran de jeu : se connecte au WebSocket du backend et affiche chaque message reçu.
// Sert à vérifier le backend sans le frontend. Utilisation : npm run ecran (dans backend/)
// Adresse par défaut : ws://localhost:3000/ws (autre adresse : npm run ecran -- ws://hote:3000/ws)
const { WebSocket } = require('ws');

const url = process.argv[2] || 'ws://localhost:3000/ws';
const client = new WebSocket(url);

client.on('open', () => console.log(`[Écran] Connecté à ${url} (Ctrl+C pour quitter)`));
client.on('close', () => console.log('[Écran] Connexion fermée'));
client.on('error', (err) => console.error('[Écran] Erreur :', err.message || err.code));

client.on('message', (donnees) => {
  const message = JSON.parse(donnees.toString());
  const heure = new Date().toLocaleTimeString('fr-FR');

  if (message.type === 'etat') {
    // Résumé lisible de l'instantané
    const s = message.session;
    console.log(`${heure} etat     ${s ? `session ${s.id} ${s.statut}, acte ${s.acte}, jauge ${s.jauge}` : 'aucune partie'}`);
    if (s) {
      const resolues = message.enigmes.filter((e) => e.etat === 'resolue').length;
      console.log(`         énigmes résolues : ${resolues}/${message.enigmes.length}`);
      const finLe = new Date(s.debutLe).getTime() + s.dureeLimiteS * 1000;
      console.log(`         temps restant : ${Math.max(0, Math.round((finLe - message.serveurMs) / 1000))} s`);
    }
    console.log(`         documents : ${message.narratifs.map((d) => d.id).join(', ') || 'aucun'}`);
    console.log(`         postes : ${JSON.stringify(message.postes)}`);
  } else {
    console.log(`${heure} ${message.type.padEnd(8)} ${JSON.stringify(message)}`);
  }
});
