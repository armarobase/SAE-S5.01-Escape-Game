# CRA - Ali Ben Akremi

Projet : Data-Monstre (SAÉ S5.01)
Rôles : base de données, architecture, game design, backend, IoT

---

## Semaine du 12/10/2026 au 18/10/2026

### Réalisé cette semaine
- Conception et création de la base de données PostgreSQL (`database/migrations/`) :
  - schéma à 6 entités issues du GDD : `session`, `enigme`, `capteur`, `evenement`, `fragment_code`, `score`
  - contraintes d'intégrité (états des énigmes, bornes de la jauge, clés étrangères)
  - une seule partie en cours à la fois, garantie par la base (index unique), car les messages MQTT ne portent pas d'identifiant de session
  - insertion des 12 capteurs du contrat MQTT (`docs/mqtt.md`)
- Couche d'accès aux données du backend (`backend/src/db/`) : un fichier par table, pool de connexions PostgreSQL partagé, catalogue des énigmes créées à chaque session
- Persistance des messages MQTT : chaque message valide met à jour la dernière valeur du capteur et alimente le journal de la partie ; les messages hors contrat sont ignorés et journalisés
- API REST : démarrer, consulter et terminer une session, journal d'événements d'une session, classement des scores
- `/api/health` vérifie maintenant aussi la connexion à la base ; ajout d'un gestionnaire d'erreurs pour qu'une erreur inattendue ne fasse pas tomber le serveur
- Documentation : section « Base de données » ajoutée à `docs/architecture.md`
- Tests : schéma et routes validés sur un PostgreSQL local (création de session, refus d'une seconde session en cours, enregistrement MQTT, fin de partie avec score, refus d'une double fin de partie)
- Travail livré sur la branche `feature/base-de-donnees`, avec pull request pour relecture

### Difficultés rencontrées
- Docker n'est pas installé sur mon poste : impossible de tester avec `docker compose`. J'ai validé sur un PostgreSQL embarqué, mais le démarrage complet via Docker reste à vérifier
- Les scripts SQL ne s'exécutent qu'au premier démarrage du conteneur PostgreSQL : toute modification du schéma demande de recréer le volume (`docker compose down -v`)
- La formule de calcul du score n'est pas définie dans le GDD : une formule provisoire a été posée, à valider avec l'équipe

### Objectifs pour la semaine prochaine
- Faire relire et fusionner la pull request, puis vérifier le démarrage complet avec Docker
- Valider avec Yassine la formule du score et les valeurs encore ouvertes du contrat MQTT (nombre de boutons, de ports, longueur du code)
- Implémenter la machine à états de l'Acte 1 et le calcul de la jauge (`backend/src/game/`), en s'appuyant sur la base
- Ajouter le WebSocket pour envoyer la jauge au frontend
- Écrire des tests sur les routes et la persistance

### Temps passé
- 5h

---
