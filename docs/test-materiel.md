# Tester le backend avec le matériel (jalon Prototype)

Ce guide sert à brancher le vrai poste de l'Acte 1 sur le backend, à vérifier chaque élément, puis à jouer une partie complète comme à la démo.

**Objectif du jalon 2 (Prototype)** : l'Acte 1 complet joué sur le vrai matériel, puis l'Acte 2 (au moins une énigme d'un acte suivant), joué avec le simulateur tant que son poste n'est pas programmé. La partie se termine en victoire à la fin de l'Acte 2.

Les commandes d'installation sont détaillées dans `docs/installation.md`, le format des messages dans `docs/mqtt.md`.

## 1. Ce qu'il faut

- Un PC avec Docker Desktop et Node.js, le dépôt à jour (`git switch main` puis `git pull`) et le fichier `.env` rempli.
- Le poste de l'Acte 1 : MKR WiFi 1010 + MKR Connector Carrier, lecteur RFID Grove et le badge bleu, 3 boutons, 3 LED, potentiomètre rectiligne (slider), capteur de lumière. Câblage actuel (`iot/acte1/acte1.ino`) :

  | Élément | Connecteur |
  |---|---|
  | Boutons 1, 2, 3 | 0, 1, 2 |
  | LED 1, 2, 3 | 3, A4, A3 |
  | Slider | A1 |
  | Capteur de lumière | A2 |
  | Lecteur RFID | SERIAL (Serial1, 9600 bauds) |

- **Un réseau WiFi en 2,4 GHz** auquel le PC et la carte sont tous les deux connectés. La MKR WiFi 1010 ne voit pas le 5 GHz, et ne sait pas se connecter aux réseaux à identifiant personnel comme eduroam. Le plus simple : le partage de connexion d'un téléphone, ou un petit routeur dédié.

## 2. Préparer le PC (serveur)

1. Démarrer le broker et la base, depuis la racine du dépôt :

   ```
   docker compose up -d mosquitto postgres
   ```

2. Démarrer le backend :

   ```
   cd backend
   npm install
   npm run dev
   ```

   Vérifier http://localhost:3000/api/health : `{"status":"ok","db":"ok"}`.

3. Relever l'adresse IP du PC sur le réseau WiFi :

   ```
   ipconfig
   ```

   Ligne « Adresse IPv4 » de la carte WiFi, par exemple `192.168.43.20`. C'est l'adresse du broker pour la carte.

4. **Ouvrir le port 1883 dans le pare-feu Windows**, sinon la carte ne peut pas joindre le broker. Dans un PowerShell lancé **en administrateur** :

   ```
   New-NetFirewallRule -DisplayName "Mosquitto Data-Monstre" -Direction Inbound -Protocol TCP -LocalPort 1883 -Action Allow
   ```

5. Dans un autre terminal (cmd, à la racine du dépôt), suivre tous les messages du jeu. Ce terminal reste ouvert pendant tout le test :

   ```
   docker compose exec mosquitto mosquitto_sub -u datamonstre -P <mot_de_passe> -t "datamonstre/#" -v
   ```

## 3. Préparer la carte

1. Copier `iot/secrets.example.h` dans `iot/acte1/secrets.h` et le remplir :
   - `SECRET_WIFI_SSID` et `SECRET_WIFI_PASSWORD` : le réseau 2,4 GHz ;
   - `SECRET_MQTT_HOST` : l'adresse IP du PC relevée plus haut ;
   - `SECRET_MQTT_USERNAME` et `SECRET_MQTT_PASSWORD` : les mêmes que `MQTT_USERNAME` et `MQTT_PASSWORD` dans `.env`.

   `secrets.h` n'est jamais commité (il est dans `.gitignore`).

2. Ouvrir `iot/acte1/acte1.ino` dans l'IDE Arduino, carte « Arduino MKR WiFi 1010 », puis téléverser.

3. Ouvrir le moniteur série à **9600 bauds**. On doit lire, dans l'ordre :

   ```
   [WiFi] Connexion à ...
   [WiFi] Connecté, IP : ...
   [MQTT] Connexion à ...
   [MQTT] Connecté et abonné aux LED
   ```

## 4. Vérifier la liaison, élément par élément (sans partie)

Avant toute partie, on vérifie que chaque capteur envoie bien ses messages. Sans partie en cours, le backend les reçoit, les enregistre, et écrit `[Jeu] Message ignoré (aucune partie en cours)` : c'est normal.

| Test | Dans `mosquitto_sub` | Dans le terminal du backend |
|---|---|---|
| Carte allumée | `datamonstre/poste/acte1/statut {"valeur":"online"}` | `[Jeu] Poste acte1 : online` |
| Badge posé sur le lecteur | `datamonstre/acte1/badge {"valeur":"1D00CC4C6E"}` (une seule fois tant que le badge reste posé) | `[MQTT] datamonstre/acte1/badge ...` |
| Appui sur chaque bouton | `datamonstre/acte1/bouton/1` à `/3` `{"valeur":"appui"}` | un message par appui, pas de doublon |
| Slider déplacé | `datamonstre/acte1/slider {"valeur":...}` entre 0 et 100 | aucun `Message ignoré (valeur hors limites ...)` |
| Main sur le capteur de lumière | `datamonstre/acte1/lumiere {"valeur":...}` qui chute | |
| Carte débranchée | `datamonstre/poste/acte1/statut {"valeur":"offline"}` (quelques secondes après) | `[Jeu] Poste acte1 : offline` |

**Relever les valeurs réelles** pendant ce test, elles servent aux seuils :
- slider tout en haut : ___ ; tout en bas : ___ ;
- lumière de la salle : ___ ; capteur couvert par une main : ___.

Le backend résout l'écran quand le slider passe **sous 20** et la mise en veille quand la lumière passe **sous 15** (`SEUIL_SLIDER` et `SEUIL_LUMIERE` dans `backend/src/game/config.js`). Si le slider est monté à l'envers (100 en bas), le dire : on inverse la valeur dans la carte, pas dans le backend.

**Tester les LED à la main** (cmd, à la racine du dépôt) : la LED 2 doit s'éteindre puis se rallumer.

```
docker compose exec mosquitto mosquitto_pub -u datamonstre -P <mot_de_passe> -t datamonstre/acte1/led/2 -m "{\"valeur\":\"off\"}"
docker compose exec mosquitto mosquitto_pub -u datamonstre -P <mot_de_passe> -t datamonstre/acte1/led/2 -m "{\"valeur\":\"on\"}"
```

## 5. La boucle de gameplay complète

1. **Remettre le poste à zéro** : slider tout en haut, capteur de lumière découvert, badge hors du lecteur.
2. **Ouvrir l'écran de jeu** (faux écran en console), dans un nouveau terminal :

   ```
   cd backend
   npm run ecran
   ```

3. **Lancer une partie** (PowerShell) :

   ```
   Invoke-RestMethod -Method Post http://localhost:3000/api/sessions
   ```

   Attendu : les 3 LED s'allument, l'écran affiche une partie en cours à l'acte 1, jauge 30, 2400 s.

4. **Jouer l'Acte 1** :

   | Le joueur... | Sur le poste | Dans le backend | À l'écran |
   |---|---|---|---|
   | pose le badge | rien | `[Jeu] Énigme acte1_badge : resolue`, puis les 3 autres énigmes passent à `active` | jauge −5 |
   | appuie sur un bouton | la LED s'éteint | à la 3e : `[Jeu] Énigme acte1_notifications : resolue` | jauge −5 à la première coupure de chaque bouton |
   | rappuie sur un bouton | la LED se rallume | | la jauge ne bouge pas |
   | baisse le slider sous 20 | rien | `[Jeu] Énigme acte1_ecran : resolue` | jauge −5 |
   | couvre le capteur de lumière | rien | `[Jeu] Énigme acte1_veille : resolue` | jauge −5 |

   Après le badge, les trois autres énigmes se font dans n'importe quel ordre. Un bouton appuyé **avant** le badge est ignoré (`[Jeu] Message ignoré : ...`). Quand les 4 énigmes sont résolues : `[Jeu] Acte 1 résolu, fragment collecté`, deux documents arrivent à l'écran et la partie passe à l'acte 2.

   Si personne n'agit pendant 15 s, la jauge remonte toute seule (0,2 point par seconde).

5. **Jouer l'Acte 2 avec le simulateur** (le poste de l'Acte 2 n'est pas encore programmé) :

   ```
   cd simulator
   npm start -- acte2
   ```

   Environ 10 s après la fin du scénario : `[Jeu] Partie ... terminée : victoire`, et l'écran affiche la victoire.

6. **Vérifier le score** : `Invoke-RestMethod http://localhost:3000/api/scores`.

7. **Jouer aussi une défaite** : lancer une partie et ne rien faire. Après environ 6 minutes, la jauge atteint 100 et la partie se termine en défaite.

## 6. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `[WiFi] Échec` en boucle | réseau en 5 GHz, mot de passe faux, réseau type eduroam | partage de connexion d'un téléphone en 2,4 GHz |
| `[MQTT] Échec, code -2` | broker injoignable | vérifier `SECRET_MQTT_HOST` (IP du PC), le pare-feu (étape 2.4), que le PC et la carte sont sur le même réseau |
| `[MQTT] Échec, code 4` ou `5` | identifiants refusés | `SECRET_MQTT_USERNAME` / `PASSWORD` identiques à `.env` |
| La carte se connecte puis se déconnecte en boucle | un autre client utilise `poste-acte1` | une seule carte flashée avec ce programme à la fois |
| `[Jeu] Message ignoré : badge non autorisé : XXXX` | badge inconnu du backend | ajouter l'identifiant affiché dans `BADGES_AUTORISES` (`backend/src/game/config.js`) |
| `[MQTT] Message ignoré (valeur hors limites ...)` | valeur en dehors de 0 à 100 | corriger la conversion dans la carte (`map(...)`) |
| Le slider ou la lumière ne résout jamais l'énigme | seuil trop bas pour le matériel | relever les valeurs (section 4) et ajuster `SEUIL_SLIDER` / `SEUIL_LUMIERE` |
| Les LED ne réagissent pas | abonnement absent ou ordre ignoré | moniteur série : `[MQTT] Ordre ignoré ...` ; tester à la main (section 4) |
| `Une partie est déjà en cours` (erreur 409) | backend redémarré pendant une partie | voir « Plan B » dans `docs/demo-prototype.md` |

## 7. Résultats à renvoyer à l'équipe

- [ ] Carte connectée, statut `online` puis `offline` au débranchement
- [ ] Badge reconnu, une seule fois par passage
- [ ] 3 boutons : un message par appui, LED qui s'éteint et se rallume
- [ ] Slider : valeurs relevées ___ (haut) / ___ (bas), énigme résolue
- [ ] Lumière : valeurs relevées ___ (salle) / ___ (couvert), énigme résolue
- [ ] Acte 1 résolu sur le matériel, passage à l'acte 2
- [ ] Victoire avec l'Acte 2 au simulateur, score enregistré
- [ ] Défaite par la jauge
- Problèmes rencontrés : ___
