// Appels à l'API REST du backend (docs/architecture.md). Le proxy de Vite relaie /api vers le backend.

async function appeler(chemin, options) {
  let reponse;
  try {
    reponse = await fetch(chemin, options);
  } catch {
    throw new Error('Backend injoignable');
  }
  const corps = await reponse.json().catch(() => null);
  if (!reponse.ok) throw new Error((corps && corps.erreur) || `Erreur ${reponse.status}`);
  return corps;
}

export function demarrerPartie(dureeLimiteS) {
  return appeler('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dureeLimiteS ? { dureeLimiteS } : {}),
  });
}

export function listerScores() {
  return appeler('/api/scores');
}
