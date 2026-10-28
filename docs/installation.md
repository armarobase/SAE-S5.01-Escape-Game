# Installation et lancement

## Prérequis

- Git
- Docker Desktop (broker Mosquitto et base PostgreSQL)
- Node.js 22 ou plus (backend, simulateur, faux écran, frontend)
- IDE Arduino 2, avec le paquet "Arduino SAMD Boards" et les bibliothèques WiFiNINA et ArduinoMqttClient (postes physiques uniquement)

Ports utilisés : 1883 (MQTT), 5432 (PostgreSQL), 3000 (API REST et WebSocket du backend), 5173 (frontend en développement).

## Première installation

1. Créer le fichier `.env` à la racine à partir du modèle, puis remplacer les valeurs `changer-moi`. Le backend et le simulateur lisent tous les deux ce fichier.

   ```
   cp .env.example .env
   ```

2. Créer le compte MQTT (même mot de passe que `MQTT_PASSWORD` dans `.env`) :

   ```
   docker compose run --rm --user mosquitto mosquitto mosquitto_passwd -c -b /mosquitto/config/passwd datamonstre <mot_de_passe>
   ```

   Le `--user mosquitto` est indispensable : sans lui, le fichier appartient à root et Mosquitto refuse de démarrer ("Unable to open pwfile"). Pour changer le mot de passe plus tard, supprimer `mosquitto/config/passwd`, relancer cette commande, puis `docker compose restart mosquitto` (Mosquitto ne relit le fichier qu'au démarrage). Ce fichier n'est pas dans le dépôt.

3. Installer les dépendances (à refaire après un `git pull` qui modifie un `package.json`) :

   ```
   cd backend && npm install
   cd ../simulator && npm install
   ```

## Base de données

Les scripts de `database/migrations/` (`001_schema.sql`, `002_capteurs.sql`...) sont exécutés automatiquement **au premier démarrage** du conteneur postgres, quand son volume est vide.

Une migration ajoutée plus tard n'est donc **pas** appliquée à une base existante. Pour repartir de zéro (toutes les parties et tous les scores sont effacés) :

```
docker compose down -v
docker compose up -d mosquitto postgres
```

Vérifier que les tables existent (utilisateur et base : valeurs `POSTGRES_USER` et `POSTGRES_DB` du `.env`) :

```
docker compose exec postgres psql -U <utilisateur> -d <base> -c "\dt"
```

## Lancement en développement

### 1. Broker et base de données

```
docker compose up -d mosquitto postgres
```

`docker compose ps` doit afficher les deux services "Up".

Pour suivre tous les messages MQTT du jeu (dans un terminal dédié, qui reste en attente) :

```
docker compose exec mosquitto mosquitto_sub -u datamonstre -P <mot_de_passe> -t "datamonstre/#" -v
```

Pour envoyer un message à la main :

```
docker compose exec mosquitto mosquitto_pub -u datamonstre -P <mot_de_passe> -t datamonstre/acte1/bouton/2 -m "{\"valeur\":\"appui\"}"
```

### 2. Backend

```
cd backend
npm run dev
```

Il redémarre tout seul à chaque modification. Vérifier qu'il répond : http://localhost:3000/api/health doit renvoyer `{"status":"ok","db":"ok"}`.

### 3. Écran de jeu

Sans le frontend, un faux écran en console affiche tout ce que le backend envoie aux écrans par WebSocket :

```
cd backend
npm run ecran
```

Au démarrage, il reçoit un message `etat` (« aucune partie » tant qu'aucune partie n'est lancée) avec l'état des postes.

### 4. Lancer une partie

PowerShell :

```
Invoke-RestMethod -Method Post http://localhost:3000/api/sessions
```

cmd :

```
curl -X POST http://localhost:3000/api/sessions
```

La partie dure 40 minutes. Voir la partie en cours : `Invoke-RestMethod http://localhost:3000/api/sessions/en-cours`.

### 5. Simulateur de capteurs

```
cd simulator
npm start              # scénario complet de l'Acte 1
npm start -- acte2     # Acte 2 (capteur de présence), une fois l'Acte 1 résolu
npm start -- invalide  # messages incorrects : le backend doit les refuser sans s'arrêter
```

Pour l'Acte 2, le backend résout l'énigme quand la salle reste vide pendant `DELAI_ABSENCE_S` secondes (10 s, réglable dans `backend/src/game/config.js`) : le scénario se termine avant, la résolution apparaît ensuite. Avec le réglage actuel (`DERNIER_ACTE: 2`), la fin de l'Acte 2 donne la victoire.

Voir les scores : `Invoke-RestMethod http://localhost:3000/api/scores`.

### 6. Tests unitaires

```
cd backend
npm test
```

## Pièges sous Windows

- **Guillemets du JSON** : les commandes `mosquitto_pub` avec du JSON fonctionnent telles quelles dans l'invite de commandes (cmd). Dans PowerShell, les guillemets sont mal transmis ("Unknown option") : ajouter `--%` juste après `docker` (`docker --% compose exec ...`) ou taper `cmd` pour basculer.
- **`Invoke-RestMethod`** est une commande PowerShell, `curl -X POST` une commande cmd. Ne pas les taper dans un terminal occupé par `mosquitto_sub` ou `npm run dev` : ouvrir un nouveau terminal.
- **`npm test` ou `npm run ...` à la racine** du dépôt donne "Could not read package.json" : il n'y a pas de `package.json` à la racine, se placer d'abord dans `backend/` ou `simulator/`.
- **`mosquitto_sub` n'est pas reconnu** : Mosquitto n'est pas installé sur Windows, il tourne dans Docker. Toujours passer par `docker compose exec mosquitto ...`, depuis la racine du dépôt.
- **PDF du GDD illisible après un `git pull`** : voir `docs/guide-equipe.md`.

## Tout lancer avec Docker

Pas encore disponible : le service `backend` de `docker-compose.yml` se construit à partir de `backend/Dockerfile`, qui n'existe pas encore. Lancer uniquement `mosquitto` et `postgres` avec Docker, et le backend avec `npm run dev`.
