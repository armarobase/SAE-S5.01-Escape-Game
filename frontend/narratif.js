// Logs et mails de l'univers MOKADEM Corp (GDD §3.1), débloqués au fil des énigmes.
// Le backend n'envoie que l'identifiant du document et, s'il en contient un, la valeur du fragment
// de code (contrat : docs/websocket.md). Le texte est écrit ici, car c'est un choix de présentation.
// {{fragment}} est remplacé par la valeur du fragment, ou par des « ▒ » si le monstre l'a brouillé.
//
// Ordre de lecture des fragments : l'ordre chronologique des documents (12/03, puis 02/06, puis 19/09).
// Il correspond à l'ordre des actes, donc le backend doit attribuer ordre_assemblage = acte.

export const CATALOGUE = {
  acte1_log_notifications: {
    type: 'log',
    acte: 1,
    titre: 'notifications-service : activité 24 h',
    corps: [
      '[03:14:07] push-gateway   : 18 204 notifications envoyées',
      '[03:14:07] push-gateway   : 17 951 ouvertes en moins de 2 s, puis ignorées',
      '[03:14:09] push-gateway   : relance automatique programmée (J+1, J+3, J+7)',
      '[03:14:12] monitor        : charge CPU à 91 %, aucun utilisateur actif',
      '[03:14:12] monitor        : coût énergétique estimé : 41 kWh/jour',
    ].join('\n'),
  },

  acte1_mail_dsi: {
    type: 'mail',
    acte: 1,
    titre: 'Re : Re : Re : Arrêt du service « Rappels malins » ?',
    de: 'a.lefort@mokadem-corp.example',
    objet: 'Re : Re : Re : Arrêt du service « Rappels malins » ?',
    corps: [
      'Bonjour,',
      '',
      "Personne ne sait plus qui a demandé ce service, mais il tourne toujours. Je ne veux pas",
      "être celui qui l'éteint sans validation : si la direction hésite, je note ici la",
      "première partie du code d'arrêt d'urgence, au cas où : {{fragment}}.",
      '',
      'Le 12/03, A. Lefort, DSI',
    ].join('\n'),
  },

  acte2_log_autoplay: {
    type: 'log',
    acte: 2,
    titre: 'player-service : lecture en continu',
    corps: [
      '[21:02:44] player        : lecture épisode 14 (saison 3)',
      '[21:03:10] presence      : mouvement détecté devant le poste',
      '[21:03:10] player        : spectateur présent, aucune proposition d’arrêt',
      '[21:59:58] player        : épisode 15 lancé automatiquement',
      '[02:16:31] player        : épisode 22 lancé automatiquement',
      '[02:16:31] note admin    : second segment du code d’arrêt : {{fragment}} (02/06)',
    ].join('\n'),
  },

  acte2_mail_marketing: {
    type: 'mail',
    acte: 2,
    titre: 'Bilan : « temps de visionnage record »',
    de: 'm.bernard@mokadem-corp.example',
    objet: 'Bilan : « temps de visionnage record »',
    corps: [
      "Bravo à tous ! Le temps moyen de visionnage a doublé depuis l'activation de la lecture",
      'automatique.',
      '',
      "Petite précision de l'équipe technique : personne ne regarde plus après minuit,",
      "mais la lecture continue et les serveurs de streaming tournent à plein régime.",
      "Faut-il vraiment s'en réjouir ?",
    ].join('\n'),
  },

  acte3_mail_reseau: {
    type: 'mail',
    acte: 3,
    titre: 'Salle de brassage : inventaire des liaisons',
    de: 'k.diop@mokadem-corp.example',
    objet: 'Salle de brassage : inventaire des liaisons',
    corps: [
      "J'ai raturé le plan de câblage à la main : seules les liaisons marquées « actives » servent",
      "encore. Les autres alimentent des serveurs qu'on a oubliés (un ancien projet de test,",
      'une sauvegarde en double, un serveur de démonstration).',
      '',
      "Dernier segment du code d'arrêt d'urgence, à ne pas perdre : {{fragment}}.",
      '',
      'Le 19/09, K. Diop, réseau',
    ].join('\n'),
  },

  acte3_log_ports: {
    type: 'log',
    acte: 3,
    titre: 'switch-core : état des ports',
    corps: [
      'port 1 : lien actif, trafic faible mais régulier',
      'port 2 : lien actif, aucun trafic depuis 412 jours',
      'port 3 : lien actif, trafic quasi nul',
      'port 4 : lien actif, sauvegarde nocturne dupliquée',
      '',
      '=> consommation constante : 38 W par port, trafic utile ou non',
    ].join('\n'),
  },

  acte4_alerte: {
    type: 'log',
    acte: 4,
    titre: 'ALERTE : procédure d’arrêt d’urgence',
    corps: [
      '[ALERTE] Le Data-Monstre approche de sa charge maximale.',
      "Pour l'arrêter, saisir le code d'arrêt d'urgence complet.",
      "Il est réparti en trois segments, à lire dans l'ordre des dates des documents.",
      "Si un segment est illisible, le monstre l'a brouillé : cherchez-le dans les logs et mails.",
    ].join('\n'),
  },
};
