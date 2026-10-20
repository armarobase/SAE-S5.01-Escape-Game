const ACTES = [
  { numero: 1, nom: 'Alerte surcharge' },
  { numero: 2, nom: 'La salle de visionnage' },
  { numero: 3, nom: 'La salle de brassage' },
  { numero: 4, nom: "Code d'autorisation" },
];

const LIBELLES_ETAT = { verrouillee: 'verrouillée', active: 'en cours', resolue: 'résolue' };

function etatActe(enigmes) {
  if (enigmes.length === 0) return 'verrouillee';
  if (enigmes.every((e) => e.etat === 'resolue')) return 'resolue';
  if (enigmes.some((e) => e.etat !== 'verrouillee')) return 'active';
  return 'verrouillee';
}

// Progression par acte, avec le détail des énigmes. L'état est écrit en toutes lettres
// (pas seulement une couleur) pour rester lisible quel que soit l'écran.
export default function Actes({ enigmes }) {
  return (
    <section className="carte" aria-labelledby="titre-actes">
      <h2 id="titre-actes">Progression</h2>
      <ol className="actes">
        {ACTES.map(({ numero, nom }) => {
          const duActe = enigmes.filter((e) => e.acte === numero);
          const etat = etatActe(duActe);
          return (
            <li key={numero} className="acte" data-etat={etat}>
              <p className="acte-titre">
                <span>
                  Acte {numero} : {nom}
                </span>
                <span className="etiquette">{LIBELLES_ETAT[etat]}</span>
              </p>
              {duActe.length > 1 && (
                <ul className="enigmes">
                  {duActe.map((e) => (
                    <li key={e.code} data-etat={e.etat}>
                      {e.nom} <span className="etiquette">{LIBELLES_ETAT[e.etat]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
