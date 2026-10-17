# Contrat MQTT

Statut : brouillon, à valider par l'équipe.

Ce document fixe les topics et le format des messages échangés entre les cartes (ou le simulateur) et le backend. Toute modification doit être répercutée dans le code des cartes, le simulateur et le backend.

## Convention de nommage des topics

```
datamonstre/<acte>/<capteur>[/<numéro>]
```

Exemples : `datamonstre/acte1/badge/scan`, `datamonstre/acte3/port/2`

## Format des messages

Tous les messages sont en JSON :

```json
{ "valeur": 512, "timestamp": 1792233938537 }
```

## Liste des topics

| Topic | Émetteur | Valeur | Description |
|---|---|---|---|
| `datamonstre/acte1/badge/scan` | Poste Acte 1 | à définir | |
| `datamonstre/acte1/bouton/<n>` | Poste Acte 1 | à définir | |
| `datamonstre/acte1/slider` | Poste Acte 1 | à définir | |
| `datamonstre/acte1/lumiere` | Poste Acte 1 | à définir | |
| `datamonstre/acte2/presence` | Poste Acte 2 | à définir | |
| `datamonstre/acte3/port/<n>` | Poste Acte 3 | à définir | |
| `datamonstre/acte4/code` | Poste Acte 4 | à définir | |
