const LIBELLES = { online: 'en ligne', offline: 'hors ligne', inconnu: 'inconnu' };

// État des quatre postes physiques (Last Will MQTT), utile pour repérer une panne avant la JPO
export default function Postes({ postes }) {
  return (
    <ul className="postes" aria-label="État des postes">
      {Object.entries(postes).map(([acte, statut]) => (
        <li key={acte} data-statut={statut}>
          Poste {acte.replace('acte', '')} : {LIBELLES[statut]}
        </li>
      ))}
    </ul>
  );
}
