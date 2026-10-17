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
   docker compose run --rm --user mosquitto mosquitto mosquitto_passwd -c -b /mosquitto/config/passwd datamonstre <mot_de_passe>
   ```

   Le `--user mosquitto` est indispensable : sans lui, le fichier appartient à root et Mosquitto refuse de démarrer ("Unable to open pwfile"). Pour changer le mot de passe plus tard, supprimer `mosquitto/config/passwd`, relancer cette commande, puis `docker compose restart mosquitto` (Mosquitto ne relit le fichier qu'au démarrage).

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

Vérifier que le broker tourne (`docker compose ps` doit afficher "Up"), puis tester l'échange de messages dans deux terminaux.

Écoute :

```
docker compose exec mosquitto mosquitto_sub -u datamonstre -P <mot_de_passe> -t "datamonstre/#" -v
```

Envoi :

```
docker compose exec mosquitto mosquitto_pub -u datamonstre -P <mot_de_passe> -t datamonstre/acte1/bouton/2 -m "{\"valeur\":\"appui\"}"
```

**Sous Windows** : ces commandes fonctionnent telles quelles dans l'invite de commandes (cmd). Dans PowerShell, les guillemets du JSON sont mal transmis ("Unknown option") ; ajouter `--%` juste après `docker` (`docker --% compose exec ...`) ou taper `cmd` pour basculer.

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
