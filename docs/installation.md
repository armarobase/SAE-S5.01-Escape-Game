# Installation et lancement

## Prérequis

- Git
- Docker Desktop
- Node.js 22 (pour lancer le backend et le simulateur hors Docker)
- IDE Arduino 2, avec le paquet "Arduino SAMD Boards" et les bibliothèques WiFiNINA et ArduinoMqttClient

## Première installation

1. Créer le fichier `.env` à partir du modèle, puis remplacer les valeurs `changer-moi` :

   ```
   cp .env.example .env
   ```

2. Créer le compte MQTT (même mot de passe que `MQTT_PASSWORD` dans `.env`) :

   ```
   docker compose run --rm mosquitto mosquitto_passwd -c -b /mosquitto/config/passwd datamonstre <mot_de_passe>
   ```

3. Installer les dépendances :

   ```
   cd backend && npm install
   cd ../simulator && npm install
   ```

## Lancement en développement

Démarrer le broker et la base de données :

```
docker compose up -d mosquitto postgres
```

Démarrer le backend (redémarre tout seul à chaque modification) :

```
cd backend
npm run dev
```

Vérifier que le serveur répond : http://localhost:3000/api/health

Dans un autre terminal, lancer le simulateur de capteurs :

```
cd simulator
npm start
```

Les messages envoyés par le simulateur doivent s'afficher dans le terminal du backend.

## Tout lancer avec Docker

```
docker compose up --build
```
