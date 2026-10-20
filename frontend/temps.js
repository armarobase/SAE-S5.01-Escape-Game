// Chronomètre de la partie

// 125 -> "02:05". Les valeurs négatives ou invalides donnent "00:00".
export function formaterDuree(secondes) {
  const total = Number.isFinite(secondes) ? Math.max(0, Math.floor(secondes)) : 0;
  const minutes = Math.floor(total / 60);
  const reste = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(reste).padStart(2, '0')}`;
}

// Secondes restantes avant la défaite, ou null si la partie n'est pas en cours.
// decalageMs corrige l'écart entre l'horloge du serveur et celle du navigateur.
export function tempsRestantS(session, maintenantMs, decalageMs = 0) {
  if (!session || session.statut !== 'en_cours' || !session.debutLe) return null;
  const debut = Date.parse(session.debutLe);
  if (Number.isNaN(debut)) return null;
  const ecoule = (maintenantMs + decalageMs - debut) / 1000;
  return Math.max(0, Math.ceil(session.dureeLimiteS - ecoule));
}
