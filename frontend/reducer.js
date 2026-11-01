// État de l'écran de jeu, mis à jour par les messages WebSocket (contrat : docs/websocket.md).
// Fonctions pures : pas de réseau, pas d'horloge (l'heure de réception est passée dans l'action).

export const POSTES_INCONNUS = {
  acte1: 'inconnu',
  acte2: 'inconnu',
  acte3: 'inconnu',
  acte4: 'inconnu',
};

export const etatInitial = {
  connexion: 'connexion', // 'connexion' | 'connecte' | 'deconnecte'
  session: null, // { id, statut, acte, jauge, dureeLimiteS, debutLe, nbErreurs }
  enigmes: [], // { code, acte, nom, etat }
  narratifs: [], // { id, fragment, brouille }
  postes: POSTES_INCONNUS,
  decalageMs: 0, // heure serveur - heure du navigateur, pour un chrono juste même si les horloges diffèrent
};

const STATUTS_POSTE = ['online', 'offline'];

function borner(valeur) {
  return Math.max(0, Math.min(100, valeur));
}

function fusionnerPostes(actuels, recus) {
  if (!recus || typeof recus !== 'object') return actuels;
  const suivants = { ...actuels };
  for (const acte of Object.keys(POSTES_INCONNUS)) {
    if (STATUTS_POSTE.includes(recus[acte])) suivants[acte] = recus[acte];
  }
  return suivants;
}

function sessionValide(s) {
  return s && typeof s === 'object' && Number.isInteger(s.id) && typeof s.statut === 'string';
}

function appliquerMessage(etat, message, recuLe) {
  if (!message || typeof message !== 'object') return etat;

  switch (message.type) {
    case 'etat': {
      // Instantané complet : envoyé à la connexion et à chaque changement structurel
      const decalageMs = Number.isFinite(message.serveurMs) ? message.serveurMs - recuLe : etat.decalageMs;
      return {
        ...etat,
        decalageMs,
        session: sessionValide(message.session)
          ? { ...message.session, jauge: borner(Number(message.session.jauge) || 0) }
          : null,
        enigmes: Array.isArray(message.enigmes) ? message.enigmes : [],
        narratifs: Array.isArray(message.narratifs) ? message.narratifs : [],
        postes: fusionnerPostes(etat.postes, message.postes),
      };
    }

    case 'jauge': {
      if (!etat.session || !Number.isFinite(message.valeur)) return etat;
      return { ...etat, session: { ...etat.session, jauge: borner(message.valeur) } };
    }

    case 'narratif': {
      if (typeof message.id !== 'string') return etat;
      // Un même document n'apparaît qu'une fois (le serveur peut renvoyer un message après reconnexion)
      if (etat.narratifs.some((n) => n.id === message.id)) return etat;
      const nouveau = {
        id: message.id,
        fragment: message.fragment ?? null,
        brouille: Boolean(message.brouille),
      };
      return { ...etat, narratifs: [...etat.narratifs, nouveau] };
    }

    case 'postes':
      return { ...etat, postes: fusionnerPostes(etat.postes, message.postes) };

    default:
      // Type inconnu : ignoré, comme le backend ignore les messages MQTT hors contrat
      return etat;
  }
}

export function reducer(etat, action) {
  switch (action.type) {
    case 'connexion':
      return { ...etat, connexion: action.statut };
    case 'message':
      return appliquerMessage(etat, action.message, action.recuLe);
    default:
      return etat;
  }
}
