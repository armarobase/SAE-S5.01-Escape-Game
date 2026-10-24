// Valeurs de game design, réunies dans un seul fichier pour les régler facilement.
// Elles sont provisoires : à valider avec l'équipe (docs/mqtt.md section 9, docs/GDD.md).

module.exports = {
  // Durée d'une partie : 40 min (GDD). Attention, la base met 1800 s (30 min) par défaut :
  // cette valeur doit être passée explicitement à la création de la session.
  DUREE_PARTIE_S: 40 * 60,

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
    // Nombre de boutons et de notifications (docs/mqtt.md section 9)
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
};
