# Guide d'équipe

Ce qu'il faut savoir pour travailler sur le dépôt. L'installation complète est dans `docs/installation.md`.

## Ce qui est en place (Prototype)

| Partie | État |
|---|---|
| Broker Mosquitto | Authentification obligatoire, sous Docker |
| Contrat MQTT | `docs/mqtt.md` (topics, formats, QoS, retained) |
| Base PostgreSQL | Tables des parties, énigmes, capteurs, journal, fragments, scores (`database/migrations/`) |
| Backend | Validation des messages, Actes 1 et 2 jouables, jauge, timer de 40 min, victoire et défaite, score, ordres aux LED, API REST |
| Écran de jeu | Diffusion par WebSocket selon `frontend/websocket.md` ; faux écran en console : `npm run ecran` dans `backend/` |
| Simulateur | `simulator/` : scénarios Acte 1, Acte 2 et messages invalides |
| Poste de l'Acte 1 | Programme sur la branche `feature/iot-acte1`, à tester avec le backend |
| Actes 3 et 4 | À faire |

Fin de partie actuelle : la résolution de l'Acte 2 donne la victoire (`DERNIER_ACTE` dans `backend/src/game/config.js`, passera à 4).

## Où se trouvent les choses

- **Valeurs de game design** (durée, jauge, seuils, badges acceptés, fragments, déblocage des documents) : `backend/src/game/config.js`. Toutes provisoires, à valider ensemble.
- **Contrats** : `docs/mqtt.md` (postes ↔ backend) et `frontend/websocket.md` (backend → écran). Ne jamais inventer un topic ou un message qui n'y figure pas : proposer d'abord la modification.
- **Architecture et rôle de chaque fichier** : `docs/architecture.md`.
- **Déroulé de la démo** : `docs/demo-prototype.md`.
- **Matériel réel** : `docs/materiel.md`.

## Règles Git

- Une branche par tâche : `feature/...`, `fix/...`, `docs/...`, `chore/...`, créée depuis un `main` à jour :

  ```
  git switch main
  git pull
  git switch -c feature/ma-tache
  ```

- Pas de commit direct sur `main` : on passe par une pull request, relue par un autre membre avant la fusion.
- Faire `git pull` avant de commencer, pour éviter les commits de fusion inutiles.
- Messages de commit en français, qui disent ce qui change (pas « Add files via upload » ni « Update »).
- Éviter l'envoi de fichiers par l'interface web de GitHub : il casse l'arborescence (fichiers à plat, doublons comme `narratif (1).js`).
- Ne pas fusionner une ancienne branche partie d'un `main` dépassé sans l'avoir mise à jour : elle peut écraser du travail déjà fusionné.
- Supprimer les branches locales déjà fusionnées :

  ```
  git fetch -p
  git branch --merged
  git branch -d <nom-de-la-branche>
  ```

## Secrets

- Jamais de mot de passe dans le code ni dans le dépôt.
- Backend et simulateur : fichier `.env` à la racine (modèle : `.env.example`).
- Cartes : `secrets.h` (modèle : `iot/secrets.example.h` sur la branche `feature/iot-acte1`).
- `mosquitto/config/passwd` se génère en local (voir `docs/installation.md`), il n'est pas dans le dépôt.

## Comptes-rendus (CRA)

Un fichier par personne dans `CRA/` (par exemple `CRA/sekou-oumar.md`), complété chaque semaine.

## Tests

```
cd backend
npm test
```

Les tests de la logique de jeu, de la validation et du WebSocket tournent sans broker ni base. À lancer avant chaque pull request.

## PDF du GDD corrompu

Si `docs/GDD_Groupe305-306Storm.pdf` ne s'ouvre plus ou apparaît comme modifié dans `git status` sans qu'on y ait touché, la copie locale a été abîmée par une conversion des fins de ligne. Le fichier `.gitattributes` l'empêche désormais, mais une copie déjà abîmée doit être restaurée depuis Git :

```
git restore docs/GDD_Groupe305-306Storm.pdf
```

Si la copie abîmée a déjà été commitée, la récupérer depuis `main` sur GitHub :

```
git fetch
git checkout origin/main -- docs/GDD_Groupe305-306Storm.pdf
```

## Équipe

| Membre | Rôle principal |
|---|---|
| Sékou-Oumar Diallo | Backend/API, MQTT, sécurité, simulateur, documentation, agile |
| Ali Ben Akremi | Base de données, architecture, game design |
| Yassine Bakhtaoui | Game design, backend |
| Adam Mokadem | Frontend |
| Bassirou Doucouré | IoT, capteurs, câblage |
