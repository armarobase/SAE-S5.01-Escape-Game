# Contrat MQTT

**Statut** : proposition v0.1, à valider par l'équipe
**Rédaction** : Sékou-Oumar Diallo

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
- **Présence (PIR)** : la carte envoie l'état brut du capteur. Le délai avant de considérer la salle vide est appliqué par le backend (réglable).
- **Ports de l'Acte 3** : au démarrage, la carte publie l'état de tous ses ports, pour que le backend connaisse la situation de départ.
- **Code de l'Acte 4** : la saisie chiffre par chiffre (joystick) est gérée localement par la carte, qui l'affiche sur le LCD. Seul le code complet est envoyé ; la vérification se fait uniquement côté backend.

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

Valeurs possibles de `statut` : `"attente"`, `"en_cours"`, `"victoire"`, `"defaite"`.

Le LCD de l'Acte 4 sert aux messages du jeu (consignes, code refusé, brouillage). Pendant la saisie, c'est la carte qui affiche les chiffres choisis.

## 5. Statut des postes

Chaque carte signale si elle est connectée :

| Topic | Valeur | QoS | Retained |
|---|---|---|---|
| `datamonstre/poste/acte1/statut` (idem `acte2`, `acte3`, `acte4`) | `"online"` / `"offline"` | 1 | oui |

- À la connexion, la carte publie `"online"`.
- Elle déclare un **Last Will** (testament) avec la valeur `"offline"` : si elle se déconnecte brutalement (panne, coupure WiFi), le broker publie ce message à sa place.
- Le backend sait ainsi quel poste est hors ligne et peut basculer sur le simulateur pour cet acte (mode de secours de la JPO).

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

| Point | Valeur proposée | Avec qui |
|---|---|---|
| Nombre de boutons (Acte 1) | 3 | Yassine, Ali (game design) |
| Nombre de ports (Acte 3) | 4 | Yassine, Ali (game design) |
| Longueur du code final | 4 chiffres | Yassine, Ali (game design) |
| Seuil d'envoi slider / lumière | variation de 5 | Bassirou (IoT) |
| Format de l'identifiant RFID | texte | Bassirou (selon le module Grove) |

## Historique

| Version | Date | Modification |
|---|---|---|
| 0.1 | 17/10/2026 | Première proposition |
