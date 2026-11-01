import { formaterDuree } from '../lib/temps.js';

export default function Classement({ scores, sessionId, erreur }) {
  const meilleurs = scores.slice(0, 5);
  return (
    <section className="carte" aria-labelledby="titre-classement">
      <h2 id="titre-classement">Classement</h2>
      {erreur && <p className="erreur">Classement indisponible : {erreur}</p>}
      {!erreur && meilleurs.length === 0 && <p className="vide">Aucune partie terminée.</p>}
      {meilleurs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Points</th>
              <th scope="col">Temps</th>
              <th scope="col">Erreurs</th>
              <th scope="col">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {meilleurs.map((s, i) => (
              <tr key={s.id} data-courante={s.session_id === sessionId}>
                <td>{i + 1}</td>
                <td>{s.points}</td>
                <td>{formaterDuree(s.temps_s)}</td>
                <td>{s.nb_erreurs}</td>
                <td>{s.victoire ? 'Victoire' : 'Défaite'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
