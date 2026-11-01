import { formaterDuree } from '../lib/temps.js';

// Bandeau de fin de partie, avec le score de la partie si le backend l'a déjà calculé
export default function Fin({ session, score }) {
  const victoire = session.statut === 'victoire';
  return (
    <section className="carte fin" data-victoire={victoire} role="status">
      <h2>{victoire ? 'Data-Monstre désactivé' : 'Le Data-Monstre a gagné'}</h2>
      <p>
        {victoire
          ? 'Le code d’arrêt d’urgence est accepté : le data center retrouve un rythme raisonnable.'
          : 'Le temps est écoulé ou la jauge a atteint son maximum : le data center est verrouillé.'}
      </p>
      {score && (
        <p className="fin-score">
          {score.points} points en {formaterDuree(score.temps_s)}, {score.nb_erreurs} erreur
          {score.nb_erreurs > 1 ? 's' : ''}
        </p>
      )}
    </section>
  );
}
