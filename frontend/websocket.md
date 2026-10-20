# Contrat WebSocket

Le backend pousse en direct l'état de la partie vers l'écran de jeu (frontend React).
Le canal est **à sens unique** : le serveur envoie, le frontend ne fait qu'écouter. Les actions du frontend (démarrer une partie, lire le classement) passent par l'API REST.

- **URL** : `ws://<hôte>:3000/ws` (même port que l'API REST ; en développement, le proxy de Vite relaie `/ws`)
- **Format** : un message JSON par trame, avec un champ `type`
- **Bibliothèque conseillée côté backend** : `ws`, attachée au serveur HTTP d'Express (`new WebSocketServer({ server, path: '/ws' })`)

## Principe : instantané + mises à jour

À **chaque connexion** (y compris après une coupure), le serveur envoie d'abord un message `etat` complet. Le frontend n'a donc rien à rejouer : il se remet à jour tout seul. Ensuite le serveur envoie des messages plus petits (`jauge`, `narratif`, `postes`) pour les changements fréquents, et un nouvel `etat` complet pour les changements structurels (nouvelle partie, énigme résolue, changement d'acte, fin de partie).

Le frontend ignore tout message dont le `type` est inconnu ou dont le contenu est invalide, comme le backend le fait pour les messages MQTT hors contrat.

## Messages serveur → frontend

### `etat` : instantané complet

```json
{
  "type": "etat",
  "serveurMs": 1793613600000,
  "session": {
    "id": 7,
    "statut": "en_cours",
    "acte": 2,
    "jauge": 38,
    "dureeLimiteS": 1800,
    "debutLe": "2026-11-02T10:00:00.000Z",
    "nbErreurs": 1
  },
  "enigmes": [
    { "code": "acte1_badge", "acte": 1, "nom": "Ouverture de la console", "etat": "resolue" }
  ],
  "narratifs": [
    { "id": "acte1_mail_dsi", "fragment": "42", "brouille": false }
  ],
  "postes": { "acte1": "online", "acte2": "online", "acte3": "offline", "acte4": "online" }
}
```

| Champ | Description |
|---|---|
| `serveurMs` | Heure du serveur en millisecondes (`Date.now()`). Le frontend en déduit l'écart avec l'horloge du navigateur pour que le chrono soit juste. |
| `session` | Session courante, ou `null` s'il n'y en a pas. Mêmes valeurs que la table `session` (`acte_courant` devient `acte`, `duree_limite_s` devient `dureeLimiteS`, `debut_le` devient `debutLe`, `nb_erreurs` devient `nbErreurs`). `statut` : `attente`, `en_cours`, `victoire`, `defaite`. |
| `enigmes` | Énigmes de la session (table `enigme`). `etat` : `verrouillee`, `active`, `resolue`. |
| `narratifs` | Tous les documents déjà débloqués (voir ci-dessous). Permet de retrouver l'écran après un rechargement de page. |
| `postes` | État des 4 postes physiques, déduit des messages Last Will MQTT : `online` ou `offline`. Un poste absent est affiché « inconnu ». |

### `jauge` : mise à jour de la jauge

```json
{ "type": "jauge", "valeur": 45 }
```

`valeur` est un nombre entre 0 et 100 (le frontend borne de toute façon). À envoyer après chaque action utile ou erreur, sans renvoyer tout l'état.

### `narratif` : nouveau document débloqué

```json
{ "type": "narratif", "id": "acte2_log_autoplay", "fragment": "7", "brouille": false }
```

Le serveur n'envoie **que l'identifiant** du log ou du mail et, s'il en contient un, la **valeur du fragment de code**. Le texte est écrit dans le frontend (`frontend/src/contenu/narratif.js`) : c'est du contenu de présentation, alors que les valeurs de code, elles, restent décidées par le backend.

| Champ | Description |
|---|---|
| `id` | Identifiant du document (table ci-dessous). |
| `fragment` | Valeur du fragment (chaîne) pour les documents qui en contiennent un, sinon `null`. |
| `brouille` | `true` si le monstre a brouillé ce fragment (Acte 4) : le frontend affiche des `▒` à la place de la valeur. |

Quand le monstre brouille un fragment à l'Acte 4, le backend renvoie un `etat` complet avec `brouille: true` sur les documents concernés.

### `postes` : changement d'état d'un poste

```json
{ "type": "postes", "postes": { "acte3": "offline" } }
```

Seuls les postes qui changent sont à indiquer.

## Documents disponibles

| `id` | Type | Acte | Fragment |
|---|---|---|---|
| `acte1_log_notifications` | log | 1 | non |
| `acte1_mail_dsi` | mail | 1 | oui (1er segment) |
| `acte2_log_autoplay` | log | 2 | oui (2e segment) |
| `acte2_mail_marketing` | mail | 2 | non |
| `acte3_mail_reseau` | mail | 3 | oui (3e segment) |
| `acte3_log_ports` | log | 3 | non |
| `acte4_alerte` | log | 4 | non |

Les documents sont écrits pour que les segments se lisent **dans l'ordre chronologique** (12/03, 02/06, 19/09), qui est l'ordre des actes. Le backend doit donc attribuer `ordre_assemblage = acte` aux fragments. **Point à valider en équipe** : si on préfère un ordre aléatoire par session, il faudra ajouter un indice dans les documents.

## Fin de partie et classement

Quand la partie se termine, le serveur envoie un `etat` avec `session.statut` à `victoire` ou `defaite`. Le frontend affiche alors le bandeau de fin et charge `GET /api/scores` pour afficher le score de la partie. **Le backend doit donc enregistrer le score (`enregistrerScore`) avant d'envoyer cet `etat` final**, sinon le score de la partie n'apparaît pas dans le classement.

## Tester sans le backend

`npm run mock` dans `frontend/` lance un faux serveur qui respecte ce contrat (REST + WebSocket sur le port 3000) et déroule une partie complète en environ une minute. Voir `frontend/README.md`.
