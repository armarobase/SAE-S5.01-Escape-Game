import { useCallback, useEffect, useState } from 'react';
import { useJeu } from './hooks/useJeu.js';
import { demarrerPartie, listerScores } from './api.js';
import Jauge from './components/Jauge.jsx';
import Chrono from './components/Chrono.jsx';
import Actes from './components/Actes.jsx';
import Narratif from './components/Narratif.jsx';
import Postes from './components/Postes.jsx';
import Classement from './components/Classement.jsx';
import Fin from './components/Fin.jsx';

const LIBELLES_CONNEXION = {
  connexion: 'Connexion au serveur…',
  connecte: 'Connecté',
  deconnecte: 'Connexion perdue, nouvelle tentative…',
};

export default function App() {
  const etat = useJeu();
  const { session, connexion } = etat;
  const statut = session ? session.statut : null;
  const terminee = statut === 'victoire' || statut === 'defaite';

  const [scores, setScores] = useState([]);
  const [erreurScores, setErreurScores] = useState(null);
  const [erreurDemarrage, setErreurDemarrage] = useState(null);

  const chargerScores = useCallback(() => {
    listerScores()
      .then((liste) => {
        setScores(liste);
        setErreurScores(null);
      })
      .catch((err) => setErreurScores(err.message));
  }, []);

  // Le classement se recharge quand une partie se termine ou qu'aucune n'est en cours
  useEffect(() => {
    if (statut === null || terminee) chargerScores();
  }, [statut, terminee, chargerScores]);

  async function lancer() {
    setErreurDemarrage(null);
    try {
      await demarrerPartie();
      // L'état de la partie arrive ensuite par le WebSocket
    } catch (err) {
      setErreurDemarrage(err.message);
    }
  }

  const scoreDeLaPartie = session ? scores.find((s) => s.session_id === session.id) : undefined;
  const enJeu = session && !terminee;

  return (
    <div className="page">
      <header className="entete">
        <h1>
          Data-<span>Monstre</span>
        </h1>
        <div className="entete-etat">
          <Postes postes={etat.postes} />
          <p className="connexion" data-connexion={connexion} role="status">
            {LIBELLES_CONNEXION[connexion]}
          </p>
        </div>
      </header>

      {terminee && <Fin session={session} score={scoreDeLaPartie} />}

      {enJeu ? (
        <main className="jeu">
          <div className="colonne">
            <Jauge valeur={session.jauge} />
            <Chrono session={session} decalageMs={etat.decalageMs} />
            <Actes enigmes={etat.enigmes} />
          </div>
          <div className="colonne">
            <Narratif narratifs={etat.narratifs} />
          </div>
        </main>
      ) : (
        <main className="attente">
          {!terminee && (
            <section className="carte">
              <h2>Aucune partie en cours</h2>
              <p>Le data center est calme. Pour lancer une partie, démarrez une nouvelle session.</p>
            </section>
          )}
          <div className="actions">
            <button type="button" onClick={lancer}>
              {terminee ? 'Nouvelle partie' : 'Démarrer la partie'}
            </button>
            {erreurDemarrage && <p className="erreur">{erreurDemarrage}</p>}
          </div>
          <Classement scores={scores} sessionId={session ? session.id : null} erreur={erreurScores} />
          {terminee && <Narratif narratifs={etat.narratifs} />}
        </main>
      )}
    </div>
  );
}
