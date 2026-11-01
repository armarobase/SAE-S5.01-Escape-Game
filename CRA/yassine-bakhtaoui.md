**CRA Yassine Bakhtaoui**

Projet : Data-Monstre (SAÉ S5.01)

Rôles : game design, BDD, frontend, backend, tests

---

**Semaine du 12/10/2026 au 18/10/2026**

Cette semaine, j'ai relu le GDD pour repérer les parties qui me reviennent, puis parcouru le dépôt pour voir ce qui existait déjà côté backend et base de données. Les fichiers de la logique de jeu (jauge, machines à états des actes) étaient encore vides et le dossier de tests ne contenait rien. J'ai donc commencé par la jauge du monstre, qui relie les quatre actes et conditionne la victoire et la défaite.

J'ai écrit la logique de la jauge dans backend/src/game/jauge.js, sous forme de fonctions pures, sans accès à la base ni au MQTT, pour pouvoir les tester facilement. La jauge reste bornée entre 0 et 100. Elle monte lentement quand les joueurs restent inactifs plus de 15 secondes, baisse de 5 points à chaque action utile et monte de 3 points à chaque erreur. Une fonction détecte la défaite quand elle atteint 100. Une autre calcule, pour l'Acte 4, combien de fragments du code sont brouillés selon la jauge à l'arrivée dans l'acte (aucun sous 25, puis un de plus tous les 25 points, jusqu'à trois). Elle brouille d'abord les actes les plus récents, et son résultat est prévu pour la fonction brouillerFragments déjà présente dans db/fragments.js.

J'ai ensuite écrit les premiers tests du projet dans backend/tests/jauge.test.js, avec le module de test intégré à Node (8 tests, tous réussis). J'ai aussi remplacé le script « npm test » du backend, qui renvoyait seulement une erreur, par une vraie commande de test.

**Difficultés rencontrées**

Les valeurs de la jauge (vitesse de montée, points gagnés ou perdus, seuils de l'Acte 4) ne sont pas définies dans le GDD. J'ai donc fait des choix provisoires, qu'il faudra valider avec l'équipe et ajuster en jouant. Au début, la commande de test ne trouvait pas les fichiers quand je lui donnais le dossier tests/ : je l'ai remplacée par la découverte automatique des fichiers de test. Enfin, la jauge n'est pas encore branchée aux machines à états des actes, car celles-ci ne sont pas écrites.

**Objectifs pour la semaine prochaine**

Faire relire la logique de la jauge par l'équipe et fixer ensemble les valeurs définitives. Brancher ensuite la jauge au backend : appliquer les changements quand un message MQTT arrive, enregistrer la valeur avec majJauge et la diffuser en WebSocket. Commencer la machine à états de l'Acte 1 avec Bassirou, qui a écrit le programme de la carte, puis ajouter des tests sur cette machine à états.
