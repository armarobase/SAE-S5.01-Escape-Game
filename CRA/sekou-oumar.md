# CRA - Sékou-Oumar Diallo

Projet : Data-Monstre (SAÉ S5.01)
Rôles : backend/API, sécurité, IoT, documentation, agile

---

## Semaine du 05/10/2026 au 11/10/2026

### Réalisé cette semaine
- Relecture du GDD v1.0 pour identifier les tâches qui me reviennent (backend/API, IoT, documentation, agile) et l'ordre dans lequel les traiter
- Comparaison des besoins matériels du GDD avec la liste des équipements IoT disponibles :
  - pas d'ESP32 : remplacement envisagé par l'Arduino MKR WiFi 1010 (WiFi + MQTT)
  - RFID Grove disponible à la place du RC522 (à vérifier : fréquence des badges et tension d'alimentation)
  - éléments absents : contacts reed (Acte 3), clavier matriciel 4×4 (Acte 4), LED bicolores
  - pistes de remplacement : boucles de câbles sur un Arduino Mega pour l'Acte 3, joystick + LCD ou clavier à acheter pour l'Acte 4
- Clonage du dépôt et mise en place de l'environnement de travail (VS Code, Git)
- Réflexion sur l'organisation du dépôt : une branche par fonctionnalité, `main` réservée aux versions qui fonctionnent

### Difficultés rencontrées
- Le matériel disponible ne correspond pas entièrement au GDD : une mise à jour (v1.1) sera nécessaire

### Objectifs pour la semaine prochaine
- Demander au professeur le nombre d'exemplaires de chaque équipement
- Définir avec l'équipe le contrat MQTT (liste des topics et format JSON des messages)
- Proposer une convention de branches et une arborescence du dépôt (backend, frontend, iot, docs, CRA)
- Initialiser le backend Node.js + Express et le connecter à un broker Mosquitto local
- Créer le backlog du projet (issues + jalon Prototype mi-novembre)

### Temps passé
- 4h

---