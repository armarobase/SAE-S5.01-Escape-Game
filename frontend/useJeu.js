import { useEffect, useReducer } from 'react';
import { etatInitial, reducer } from '../state/reducer.js';

const DELAI_MIN_MS = 1000;
const DELAI_MAX_MS = 10000;

function urlParDefaut() {
  const protocole = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocole}://${window.location.host}/ws`;
}

// Connexion WebSocket au backend, avec reconnexion automatique (délai doublé à chaque échec, plafonné).
// À chaque (re)connexion le serveur renvoie un instantané complet : l'écran se remet à jour tout seul.
export function useJeu(url = urlParDefaut()) {
  const [etat, dispatch] = useReducer(reducer, etatInitial);

  useEffect(() => {
    let socket = null;
    let minuteur = null;
    let essai = 0;
    let arrete = false;

    function ouvrir() {
      dispatch({ type: 'connexion', statut: essai === 0 ? 'connexion' : 'deconnecte' });
      socket = new WebSocket(url);

      socket.onopen = () => {
        essai = 0;
        dispatch({ type: 'connexion', statut: 'connecte' });
      };

      socket.onmessage = (evenement) => {
        let message;
        try {
          message = JSON.parse(evenement.data);
        } catch {
          return; // message mal formé : ignoré, l'écran ne plante pas
        }
        dispatch({ type: 'message', message, recuLe: Date.now() });
      };

      socket.onclose = () => {
        if (arrete) return;
        dispatch({ type: 'connexion', statut: 'deconnecte' });
        const delai = Math.min(DELAI_MIN_MS * 2 ** essai, DELAI_MAX_MS);
        essai += 1;
        minuteur = setTimeout(ouvrir, delai);
      };

      socket.onerror = () => socket.close();
    }

    ouvrir();
    return () => {
      arrete = true;
      clearTimeout(minuteur);
      if (socket) socket.close();
    };
  }, [url]);

  return etat;
}
