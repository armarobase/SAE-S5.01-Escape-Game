# Contrat MQTT

**Statut** : version 1.2 en relecture (compléments de l'Acte 4). Les versions 1.0 et 1.1 sont validées par l'équipe.
**Rédaction** : Sékou-Oumar Diallo ; Acte 3 : Ali Ben Akremi

Ce document définit tous les messages échangés entre les postes physiques (ou le simulateur) et le backend. Il fait référence : toute modification doit être répercutée dans le code des cartes (`iot/`), le simulateur (`simulator/`) et le backend (`backend/`), puis notée dans l'historique en bas de page.

## 1. Principes

- **Les cartes envoient des faits bruts, le backend décide.** Une carte publie ce qu'elle mesure (luminosité, appui, présence) ; c'est le backend qui juge si une énigme est résolue. Les seuils et délais se règlent donc côté serveur, sans reprogrammer les cartes.
- **Le backend est la seule source de vérité.** C'est lui qui commande les LED, le bargraph et le LCD. Une carte ne change pas l'état du jeu de son côté.
- **On publie seulement quand quelque chose change**, jamais à chaque tour de boucle.

## 2. Conventions

### Nommage des topics

```
datamonstre/<acte>/<élément>[/<numéro>]
```

- Tout en minuscules, sans accent ni espace
- Numérotation à partir de 1
- Exemples : `datamonstre/acte1/badge`, `datamonstre/acte3/port/2`

### Format des messages

Tous les messages sont en JSON et contiennent un champ `valeur` :

```json
{ "valeur": 42 }
```

Le champ `timestamp` (millisecondes depuis 1970) est **facultatif**. Les cartes Arduino n'ont pas d'horloge réglée et ne l'envoient pas ; c'est le backend qui horodate chaque message à sa réception. Le simulateur peut l'ajouter pour mesurer la latence.

```json
{ "valeur": 42, "timestamp": 1792233938537 }
```

## 3. Messages des postes vers le backend (capteurs)

| Topic | Valeur | Envoyé quand | QoS |
|---|---|---|---|
| `datamonstre/acte1/badge` | identifiant du badge (texte) | à chaque scan | 1 |
| `datamonstre/acte1/bouton/1` à `/3` | `"appui"` | à chaque appui | 1 |
| `datamonstre/acte1/slider` | entier de 0 à 100 | variation de plus de 5 | 0 |
| `datamonstre/acte1/lumiere` | entier de 0 à 100 | variation de plus de 5 | 0 |
| `datamonstre/acte2/presence` | `true` / `false` | changement d'état | 1 |
| `datamonstre/acte3/port/1` à `/4` | `"branche"` / `"debranche"` | changement d'état | 1 |
| `datamonstre/acte4/code` | code saisi (texte, ex. `"4271"`) | validation par le joueur | 1 |

Précisions :

- **Slider et lumière** : valeur ramenée sur 0 à 100 par la carte. En plus du seuil de 5, une carte n'envoie pas plus de 5 messages par seconde pour un même capteur.
- **Bouton** : la carte signale l'appui, c'est le backend qui bascule l'état (coupé ou actif) et renvoie l'ordre à la LED.
- **Présence (PIR)** : la carte envoie l'état brut du capteur. Le délai avant de considérer la salle vide est appliqué par le backend (réglable, `DELAI_ABSENCE_S` dans `backend/src/game/config.js`). Le backend ne compte l'absence qu'après avoir reçu au moins un `true` pendant l'Acte 2 : la carte doit donc bien publier `true` quand quelqu'un est détecté, et ne rien envoyer tant que l'état ne change pas.
- **Ports de l'Acte 3** : au démarrage, la carte publie l'état de tous ses ports. Le backend ne peut les lire qu'une fois l'Acte 3 commencé (les messages des autres actes sont ignorés) : il suppose donc tous les câbles **branchés** au début de l'acte, et la carte ne republie pas un port qui n'a pas changé. Un message qui ne change pas l'état d'un port (redélivrance, état initial) est sans effet. Ports à garder ou à débrancher : `PORTS_ACTIFS` dans `backend/src/game/config.js`.
- **Poste de l'Acte 3** : Arduino Mega + Ethernet Shield, relié en filaire. Il suit les mêmes règles de connexion que les autres postes (identifiant `poste-acte3`, statut et Last Will, section 5).
- **Code de l'Acte 4** : le joueur choisit les chiffres un par un avec le joystick, et la carte affiche sa saisie sur le LCD. Quand il valide, la carte envoie **le code complet en une seule fois** (texte de chiffres, par exemple `"4271"`), puis efface sa saisie pour un nouvel essai. Elle ne vérifie rien : c'est le backend qui décide si le code est bon et qui répond sur le LCD (section 4). La manière de choisir et de valider les chiffres au joystick est propre au programme de la carte ; le contrat ne fixe que le message envoyé. Le contrat resterait identique avec un clavier 4x4, puisque seule la saisie sur la carte changerait.
- **Brouillage de l'Acte 4** : le nombre de fragments brouillés par le monstre (selon la jauge à l'arrivée dans l'acte) ne passe pas par MQTT. Il concerne les documents affichés à l'écran (contrat WebSocket, `frontend/websocket.md`) ; le LCD peut seulement l'annoncer.

## 4. Messages du backend vers les postes (actionneurs)

| Topic | Valeur | QoS | Retained |
|---|---|---|---|
| `datamonstre/acte1/led/1` à `/3` | `"on"` / `"off"` | 1 | oui |
| `datamonstre/acte1/bargraph` | entier de 0 à 10 (niveau de la jauge) | 0 | oui |
| `datamonstre/acte3/led/1` à `/4` | `"vert"` / `"rouge"` / `"eteint"` | 1 | oui |
| `datamonstre/acte4/lcd` | `{ "ligne1": "...", "ligne2": "..." }` (16 caractères max par ligne) | 1 | oui |
| `datamonstre/jeu/etat` | voir ci-dessous | 1 | oui |

État du jeu, publié à chaque changement :

```json
{ "valeur": { "statut": "en_cours", "acte": 2 } }
```

LED des ports (Acte 3) : `"vert"` tant que le câble est branché, `"rouge"` dès qu'il est débranché, `"eteint"` hors jeu. La couleur ne dit pas si le choix est bon : débrancher un port encore actif donne aussi une LED rouge, et fait monter la jauge. Chaque port a deux LED physiques (une verte, une rouge) mais un seul topic : c'est la carte qui allume la bonne LED selon la valeur reçue (`"eteint"` éteint les deux).

Valeurs possibles de `statut` : `"attente"`, `"en_cours"`, `"victoire"`, `"defaite"`.

Le LCD de l'Acte 4 sert aux messages du jeu (consignes, code refusé, brouillage). Pendant la saisie, c'est la carte qui affiche les chiffres choisis.

LCD de l'Acte 4, précisions :

- **Texte sans accents**, en ASCII simple : l'afficheur LCD Grove n'affiche pas les caractères accentués (é, è, à, ç...). Le backend écrit donc `"Code refuse"` et non `"Code refusé"`. Au plus 16 caractères par ligne : le backend coupe ou abrège ses messages, la carte n'a rien à tronquer.
- **Quand le backend écrit** : au début de l'Acte 4 (consigne) et en réponse à **chaque** code reçu (accepté ou refusé), pour que les joueurs aient toujours un retour. Message retained : une carte qui redémarre réaffiche tout de suite le dernier message.
- **Partage de l'écran avec la saisie** : la carte affiche le dernier message reçu du backend, puis reprend l'affichage de la saisie dès que le joueur touche au joystick.

## 5. Statut des postes

Chaque carte signale si elle est connectée :

| Topic | Valeur | QoS | Retained |
|---|---|---|---|
| `datamonstre/poste/acte1/statut` (idem `acte2`, `acte3`, `acte4`) | `"online"` / `"offline"` | 1 | oui |

- À la connexion, la carte publie `"online"`.
- Elle déclare un **Last Will** (testament) avec la valeur `"offline"` : si elle se déconnecte brutalement (panne, coupure WiFi), le broker publie ce message à sa place.
- Le backend sait ainsi quel poste est hors ligne et peut basculer sur le simulateur pour cet acte (mode de secours de la JPO).
- Ces règles valent pour tous les postes, quelle que soit leur connexion : WiFi pour les actes 1, 2 et 4 (MKR WiFi 1010), Ethernet pour l'Acte 3 (Mega + Ethernet Shield). Le Last Will est publié par le broker dès qu'il perd la connexion avec la carte, câble réseau débranché compris.

## 6. Règles techniques

**QoS (qualité de service)**
- **1** pour les événements qu'on ne doit pas perdre (badge, bouton, port, code, ordres aux LED).
- **0** pour les valeurs continues (slider, lumière, bargraph) : un message perdu est remplacé par le suivant.

**Messages retained (conservés par le broker)**
- Utilisés pour les ordres aux actionneurs, l'état du jeu et le statut des postes.
- Une carte qui redémarre en pleine partie reçoit immédiatement le dernier état et se remet à jour toute seule.
- Jamais pour les capteurs : un ancien appui de bouton ne doit pas être rejoué.

**Identifiants de connexion (client ID)**
- Uniques par client : `poste-acte1`, `poste-acte2`, `poste-acte3`, `poste-acte4`, `backend`, `simulateur`.
- Deux clients avec le même identifiant se déconnectent mutuellement en boucle.

## 7. Sécurité

- **Authentification obligatoire** : aucune connexion anonyme (`allow_anonymous false` dans `mosquitto.conf`).
- **Identifiants hors du dépôt** : dans `.env` pour le backend et le simulateur, dans `secrets.h` pour les cartes.
- **Validation côté backend** : un message dont le JSON est invalide, le topic inconnu ou la valeur hors limites est ignoré et journalisé, sans interrompre la partie.
- **À faire après le Prototype** : un compte par poste avec des droits limités (ACL), pour qu'une carte ne puisse publier que sur les topics de son acte et lire ceux qui la concernent.

## 8. Tester sans matériel

Suivre tous les messages du jeu :

```
docker compose exec mosquitto mosquitto_sub -u datamonstre -P <mot_de_passe> -t "datamonstre/#" -v
```

Simuler un appui sur le bouton 2 de l'Acte 1 :

```
docker compose exec mosquitto mosquitto_pub -u datamonstre -P <mot_de_passe> -t datamonstre/acte1/bouton/2 -m "{\"valeur\":\"appui\"}"
```

Pour rejouer un scénario complet : `simulator/`.

## 9. Points à valider avec l'équipe

### Valeurs déjà implémentées, à confirmer

Elles fonctionnent dans le code actuel. Les changer ne demande que de modifier le fichier indiqué (et parfois la carte).

| Point | Valeur actuelle | Fichier | Avec qui |
|---|---|---|---|
| Nombre de boutons (Acte 1) | 3 | `backend/src/game/config.js` (`acte1.NB_BOUTONS`), `iot/acte1/acte1.ino` | Yassine, Ali (game design) |
| Seuil d'envoi slider / lumière | variation de 5 | `iot/acte1/acte1.ino` (`SEUIL_VARIATION`) | Bassirou (IoT) |
| Format de l'identifiant RFID | texte de 10 caractères (ex. `1D00CC4C6E`) | `iot/acte1/acte1.ino`, `backend/src/game/config.js` (`BADGES_AUTORISES`) | Bassirou (IoT) |
| Nombre de ports (Acte 3) | 4 | `backend/src/game/config.js` (`acte3.NB_PORTS`), `database/migrations/002_capteurs.sql` | Yassine, Ali (game design) |
| Ports utiles (Acte 3) | port 1 seulement (les autres sont à débrancher) ; doit correspondre au plan de câblage du décor | `backend/src/game/config.js` (`acte3.PORTS_ACTIFS`) | Yassine, Ali (game design) |
| Délai de confirmation (Acte 3) | 2 s de configuration stable avant de résoudre | `backend/src/game/config.js` (`acte3.DELAI_CONFIRMATION_S`) | Yassine, Ali (game design) |
| Fragments du code | `"4"` (Acte 1), `"27"` (Acte 2), `"1"` (Acte 3), dans cet ordre : code `4271` | `backend/src/game/config.js` (`FRAGMENT`, `ORDRE_FRAGMENT`) | Yassine, Ali (game design) |
| Règle du brouillage (Acte 4) | fragments brouillés selon la jauge à l'arrivée : 0 sous 25, 1 de 25 à 49, 2 de 50 à 74, 3 à partir de 75 | `backend/src/game/jauge.js` (`nbFragmentsBrouilles`) | Yassine, Ali (game design) |

### Décisions encore ouvertes

| Point | Valeur proposée | Avec qui |
|---|---|---|
| Longueur du code final | 4 chiffres (la longueur des trois fragments réunis). À fixer aussi dans la carte, qui doit savoir combien de chiffres saisir | Yassine, Ali (game design), Bassirou (IoT) |
| Nombre d'essais et pénalité en cas de code faux | essais illimités ; chaque code faux compte comme une erreur (jauge +3, `HAUSSE_PAR_ERREUR`) et affiche `"Code refuse"` sur le LCD | Yassine, Ali (game design) |
| Moment du document `acte4_alerte` | dès le début de l'Acte 4 | Yassine, Ali (game design), Adam (écran) |

## Historique

| Version | Date | Modification |
|---|---|---|
| 0.1 | 17/10/2026 | Première proposition |
| 1.0 | 25/10/2026 | Version validée par l'équipe (actes 1 et 2) |
| 1.1 | 15/11/2026 | Compléments de l'Acte 3 par Ali : état de départ des ports, LED des ports, `PORTS_ACTIFS` |
| 1.2 | 26/11/2026 | Compléments de l'Acte 4 : saisie du code au joystick, messages du LCD (sans accents, réponse à chaque code), postes en Ethernet, points à valider séparés entre valeurs implémentées et décisions ouvertes. En relecture |
