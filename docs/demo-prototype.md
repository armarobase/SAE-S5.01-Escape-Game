# Démo du Prototype

Déroulé de la démonstration du jalon Prototype (mi-novembre) : Acte 1 complet et Acte 2 (capteur de présence). La victoire arrive à la fin de l'Acte 2 (`DERNIER_ACTE: 2` dans `backend/src/game/config.js`).

Les commandes sont détaillées dans `docs/installation.md`.

## Avant la démo

### Matériel

- PC (ou Raspberry Pi 3B+) qui fait tourner Docker et le backend. À compléter : machine retenue pour la démo.
- Poste de l'Acte 1 : Arduino MKR WiFi 1010 + MKR Connector Carrier, lecteur RFID Grove et badge, 3 boutons, 3 LED, potentiomètre rectiligne (slider), capteur de lumière (voir `docs/materiel.md`).
- Poste de l'Acte 2 : MKR WiFi 1010 + capteur de présence PIR. À compléter : programme du poste pas encore écrit, l'Acte 2 se joue pour l'instant avec le simulateur.
- Un cache pour couvrir le capteur de lumière.
- Écran de jeu. À compléter : le frontend d'Adam n'est pas encore lançable (voir « Points ouverts ») ; en attendant, le faux écran `npm run ecran` montre ce que reçoit l'écran.
- Réseau WiFi local. À compléter : nom du réseau et adresse du broker renseignés dans `secrets.h` des cartes.

### Réglages à vérifier dans `backend/src/game/config.js`

- `BADGES_AUTORISES` contient l'identifiant du vrai badge. À compléter : identifiant du badge (au premier scan, le backend affiche `badge non autorisé : <identifiant>` ; le copier dans la liste).
- `SEUIL_SLIDER` et `SEUIL_LUMIERE` conviennent au matériel. À compléter : valeurs relevées lors d'un essai (slider en bas, capteur couvert).
- `DELAI_ABSENCE_S` (Acte 2) convient à la salle. À compléter : valeur retenue après essai.

### Services à lancer

1. `docker compose up -d mosquitto postgres`
2. `cd backend` puis `npm run dev`
3. Écran de jeu : `cd backend` puis `npm run ecran` (ou le frontend quand il sera lançable)
4. Brancher les postes.

### Vérifications

- http://localhost:3000/api/health renvoie `{"status":"ok","db":"ok"}`.
- **Postes en ligne** : le terminal du backend affiche `[Jeu] Poste acte1 : online`, et le premier `etat` reçu par l'écran contient `"acte1":"online"`.
- **Écran connecté** : le terminal du backend affiche `[WS] Écran connecté`.
- **Aucune partie bloquée** : `Invoke-RestMethod http://localhost:3000/api/sessions/en-cours` doit répondre « Aucune partie en cours » (erreur 404). Sinon, voir le plan B.
- Les 3 LED de l'Acte 1 s'allument au lancement de la partie.

## Déroulé d'une partie

### Lancer la partie

PowerShell : `Invoke-RestMethod -Method Post http://localhost:3000/api/sessions` (cmd : `curl -X POST http://localhost:3000/api/sessions`).

À l'écran : `etat` en cours, acte 1, jauge à 30, 40 minutes. Sur le poste : les 3 LED s'allument.

### Acte 1 : alerte surcharge

| Le joueur... | À l'écran | Sur le poste |
|---|---|---|
| scanne le badge | énigme « Ouverture de la console » résolue, la jauge baisse | rien |
| appuie sur chaque bouton pour couper les notifications | la jauge baisse à la première coupure de chaque notification ; énigme résolue quand les 3 sont coupées | la LED du bouton s'éteint (un nouvel appui la rallume) |
| baisse le slider sous le seuil | énigme « Réglage de l'écran » résolue, la jauge baisse | rien |
| couvre le capteur de lumière | énigme « Mise en veille » résolue, la jauge baisse | rien |

Après le badge, les trois autres énigmes se font dans l'ordre que les joueurs veulent. Quand les 4 sont résolues : deux documents apparaissent (`acte1_log_notifications`, `acte1_mail_dsi` avec le fragment « 4 ») et la partie passe à l'acte 2.

Si personne n'agit pendant 15 s, la jauge remonte toute seule (0,2 point par seconde). Jauge pleine : défaite.

### Acte 2 : salle de visionnage

| Le joueur... | À l'écran |
|---|---|
| se place devant le capteur de présence | rien (l'autoplay continue) |
| s'éloigne et ne bouge plus pendant 10 s | énigme « Autoplay infini » résolue, documents `acte2_log_autoplay` (fragment « 27 ») et `acte2_mail_marketing`, puis **victoire** |

Un retour devant le capteur avant la fin des 10 s remet le décompte à zéro.

Avec le simulateur : `cd simulator` puis `npm start -- acte2`.

### Fin de partie

L'écran affiche la victoire ou la défaite. Le score est consultable avec `Invoke-RestMethod http://localhost:3000/api/scores`.

## Remise à zéro entre deux parties

- **Slider remis en haut.** Le poste n'envoie une valeur que si elle change : un slider laissé en bas ne serait pas relu au début de la partie suivante, et les joueurs devraient le remonter puis le redescendre.
- **Capteur de lumière découvert** (retirer le cache).
- **Notifications et LED** : rien à faire à la main, les boutons n'ont pas d'état. Au lancement de la partie suivante, le backend rallume les 3 LED et remet toutes les notifications à « actives ».
- **Personne devant le capteur de présence** de l'Acte 2.
- **Ranger le badge** hors de portée du lecteur.
- **Partie suivante** : vérifier qu'aucune partie n'est en cours (`Invoke-RestMethod http://localhost:3000/api/sessions/en-cours`), puis relancer `Invoke-RestMethod -Method Post http://localhost:3000/api/sessions`.
- À compléter : remise en place du décor (plan de câblage, documents papier).

## Plan B

### Une carte ne répond plus

- Le terminal du backend affiche `[Jeu] Poste acte1 : offline`, et l'écran reçoit un message `postes`.
- Rebrancher ou redémarrer la carte : elle se reconnecte, publie `online` et récupère d'elle-même l'état des LED (messages retained).
- Si elle ne revient pas, jouer l'acte avec le simulateur, depuis un autre terminal :

  ```
  cd simulator
  npm start              # Acte 1
  npm start -- acte2     # Acte 2
  ```

  Le simulateur joue l'acte complet. Les énigmes déjà résolues par les joueurs sont simplement ignorées par le backend. Exception : si les joueurs avaient coupé une partie des notifications sans finir l'énigme, le simulateur appuie une fois sur chaque bouton et rallume donc celles qui étaient coupées. Dans ce cas, envoyer à la main un appui sur chaque bouton dont la LED est allumée (dans cmd, depuis la racine du dépôt, en remplaçant le numéro du bouton) :

  ```
  docker compose exec mosquitto mosquitto_pub -u datamonstre -P <mot_de_passe> -t datamonstre/acte1/bouton/2 -m "{\"valeur\":\"appui\"}"
  ```

### Le backend redémarre en pleine partie

La partie en mémoire est perdue, mais la base la croit encore « en cours », et aucune nouvelle partie ne peut être lancée (erreur 409 « Une partie est déjà en cours »). Au redémarrage, le backend affiche l'identifiant de la session bloquée.

1. Trouver son identifiant : `Invoke-RestMethod http://localhost:3000/api/sessions/en-cours`
2. La terminer (PowerShell) :

   ```
   Invoke-RestMethod -Method Post http://localhost:3000/api/sessions/<id>/terminer -ContentType 'application/json' -Body '{"statut":"defaite"}'
   ```

3. Relancer une partie.

Attention : la partie interrompue compte alors comme une défaite dans les scores. Un statut « abandonnée » est prévu avec Ali.

### Le broker ou la base ne répond plus

`docker compose restart mosquitto` ou `docker compose restart postgres`, puis vérifier http://localhost:3000/api/health.

## Points ouverts

- Frontend : pas encore lançable tel qu'il est dans le dépôt (voir le message à Adam).
- Programme du poste de l'Acte 2.
- Valeurs réelles : badge, seuils, délai d'absence.
- À compléter : durée prévue de la démo et répartition des rôles dans l'équipe pendant la démo.
