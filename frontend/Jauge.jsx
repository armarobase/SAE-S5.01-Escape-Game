import { niveauJauge, NIVEAUX } from '../lib/jauge.js';

// Jauge du « poids du monstre » : le cœur de l'écran, lisible de loin (GDD §2.1)
export default function Jauge({ valeur }) {
  const arrondie = Math.round(valeur);
  const niveau = niveauJauge(valeur);

  return (
    <section className="carte jauge" data-niveau={niveau.id} aria-labelledby="titre-jauge">
      <h2 id="titre-jauge">Poids du monstre</h2>
      <p className="jauge-valeur">
        {arrondie}
        <span className="jauge-unite"> %</span>
      </p>
      <div
        className="jauge-barre"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={arrondie}
        aria-valuetext={`${arrondie} % : ${niveau.libelle}`}
        aria-label="Poids du monstre"
      >
        <div className="jauge-remplissage" style={{ width: `${valeur}%` }} />
        {NIVEAUX.slice(1).map((n) => (
          <span key={n.id} className="jauge-palier" style={{ left: `${n.min}%` }} aria-hidden="true" />
        ))}
      </div>
      <p className="jauge-niveau">{niveau.libelle}</p>
    </section>
  );
}
