// Valeurs de game design, réunies dans un seul fichier pour les régler facilement.
// Elles sont provisoires : à valider avec l'équipe (docs/mqtt.md section 9, docs/GDD.md).

module.exports = {
  // Durée d'une partie : 40 min (GDD). Attention, la base met 1800 s (30 min) par défaut :
  // cette valeur doit être passée explicitement à la création de la session.
  DUREE_PARTIE_S: 40 * 60,

  // Dernier acte jouable : sa résolution donne la victoire.
  // 2 pour le jalon Prototype (Acte 1 complet + une énigme d'un acte suivant) ; passera à 4
  // quand les autres actes existeront.
  DERNIER_ACTE: 2,

  jauge: {
    MIN: 0,
    MAX: 100, // la base impose une jauge entre 0 et 100
    // Le monstre est déjà "gros" à l'arrivée : la pression se fait sentir tout de suite
    DEPART: 30,
    // La jauge monte quand les joueurs restent inactifs (GDD §2.1) : 0,2 point par seconde
    // après 15 s sans action. Sans rien faire, elle passe de 30 à 100 en 6 min environ.
    // Avec DELAI_INACTIVITE_S à 0, la jauge monte en continu.
    MONTEE_INACTIVITE_PAR_S: 0.2,
    DELAI_INACTIVITE_S: 15,
    // Baisse pour une action utile (couper une notification, résoudre une énigme...)
    BAISSE_PAR_ACTION: 5,
    // Pénalité pour une erreur (mauvais code, mauvais câble...)
    HAUSSE_PAR_ERREUR: 3,
  },

  acte1: {
    // Nombre de boutons et de notifications (docs/mqtt.md section 9).
    // Doit rester identique aux boutons déclarés dans database/migrations/002_capteurs.sql :
    // modifier les deux ensemble, sinon les valeurs du bouton en trop ne sont pas enregistrées en base.
    NB_BOUTONS: 3,
    // Identifiants des badges acceptés (celui du simulateur, en attendant les vrais badges)
    BADGES_AUTORISES: ['04A1B2C3'],
    // Luminosité considérée comme baissée quand le slider passe sous cette valeur (0 à 100)
    SEUIL_SLIDER: 20,
    // Capteur considéré comme couvert sous cette valeur (0 à 100). Une main fait tomber
    // la mesure presque à 0 : on garde une marge pour une salle peu éclairée.
    SEUIL_LUMIERE: 15,
    // Fragment du code final livré à la fin de l'acte, et sa place dans le code assemblé.
    // Code de 4 chiffres pour 3 actes : par exemple "4" / "27" / "1".
    FRAGMENT: '4',
    ORDRE_FRAGMENT: 1,
  },

  acte2: {
    // Durée d'absence continue devant l'écran avant de considérer la salle vide (docs/mqtt.md §3).
    // Le PIR ne détecte que le mouvement : des joueurs immobiles peuvent passer pour absents.
    // Trop court, l'énigme se résout sans que les joueurs aient compris ; trop long, elle
    // frustre. À régler lors des essais en conditions réelles (risque PIR du GDD §6).
    DELAI_ABSENCE_S: 10,
    // Fragment du code final livré à la fin de l'acte, et sa place dans le code assemblé
    // (voir acte1 : "4" / "27" / "1").
    FRAGMENT: '27',
    ORDRE_FRAGMENT: 2,
  },

  acte3: {
    // Nombre de ports du panneau de brassage (docs/mqtt.md section 9).
    // Doit rester identique aux ports déclarés dans database/migrations/002_capteurs.sql :
    // modifier les deux ensemble, sinon les valeurs du port en trop ne sont pas enregistrées en base.
    NB_PORTS: 4,
  },

  // Documents narratifs (logs, mails) affichés sur l'écran de jeu (contrat frontend/websocket.md).
  // Le texte est écrit dans le frontend ; ici, on décide seulement QUAND chaque document est débloqué.
  // C'est une décision de game design, provisoire (à valider avec Adam) :
  //   debloqueQuand: { acteResolu: 1 }                 quand toutes les énigmes de l'Acte 1 sont résolues
  //   debloqueQuand: { enigmeResolue: 'acte1_badge' }  dès qu'une énigme précise est résolue
  // fragmentActe : le document contient le fragment de code de cet acte (affiché dès qu'il est collecté).
  DOCUMENTS: [
    { id: 'acte1_log_notifications', debloqueQuand: { acteResolu: 1 } },
    { id: 'acte1_mail_dsi', debloqueQuand: { acteResolu: 1 }, fragmentActe: 1 },
    { id: 'acte2_log_autoplay', debloqueQuand: { acteResolu: 2 }, fragmentActe: 2 },
    { id: 'acte2_mail_marketing', debloqueQuand: { acteResolu: 2 } },
    { id: 'acte3_mail_reseau', debloqueQuand: { acteResolu: 3 }, fragmentActe: 3 },
    { id: 'acte3_log_ports', debloqueQuand: { acteResolu: 3 } },
    // acte4_alerte : moment du déblocage à décider avec l'Acte 4
  ],
};
