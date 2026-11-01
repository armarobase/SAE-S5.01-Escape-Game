import { documentNarratif } from '../lib/narratif.js';

function Document({ doc }) {
  return (
    <article className="document" data-type={doc.type} data-brouille={doc.brouille}>
      <header>
        <span className="etiquette">{doc.type === 'mail' ? 'Mail' : 'Log'}</span>
        <h3>{doc.titre}</h3>
      </header>
      {doc.type === 'mail' && doc.de && <p className="document-de">De : {doc.de}</p>}
      <pre>{doc.corps}</pre>
      {doc.brouille && (
        <p className="document-alerte">Données corrompues par le Data-Monstre.</p>
      )}
    </article>
  );
}

// Logs et mails débloqués, le plus récent en haut. La zone est annoncée aux lecteurs d'écran
// quand un nouveau document arrive.
export default function Narratif({ narratifs }) {
  const documents = narratifs.map(documentNarratif).reverse();
  return (
    <section className="carte narratif" aria-labelledby="titre-narratif">
      <h2 id="titre-narratif">Documents récupérés</h2>
      {documents.length === 0 && (
        <p className="vide">Aucun document pour l'instant. Résolvez une énigme pour en débloquer.</p>
      )}
      <div aria-live="polite">
        {documents.map((doc) => (
          <Document key={doc.id} doc={doc} />
        ))}
      </div>
    </section>
  );
}
