import { useEffect, useState } from 'react';
import { formaterDuree, tempsRestantS } from '../lib/temps.js';

const ALERTE_S = 300; // le chrono passe au rouge sous 5 minutes

export default function Chrono({ session, decalageMs }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const minuteur = setInterval(() => setMaintenant(Date.now()), 250);
    return () => clearInterval(minuteur);
  }, []);

  const restant = tempsRestantS(session, maintenant, decalageMs);
  const urgent = restant !== null && restant <= ALERTE_S;

  return (
    <section className="carte chrono" data-urgent={urgent} aria-labelledby="titre-chrono">
      <h2 id="titre-chrono">Temps restant</h2>
      <p className="chrono-valeur">{restant === null ? '--:--' : formaterDuree(restant)}</p>
    </section>
  );
}
