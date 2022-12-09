# TODO list

* régler les problèmes d'interface:
  * le focus n'est pas facile à prendre au début (le zoom ne marche pas avant le premier clic)
  * réduire la taille du bandeau en bas
  * zoomer sur l'emprise de l'image produite
  * comment afficher les carrefours quand on relance le rendu ? Effacer l'ancien, ne remplacer que s'il se chevauche, ...

* régler le rendu:
  * séparer les blancs des noirs en couches séparées
  * repenser le dessin des passages piétons pour qu'ils considèrent le nombre de voies

* régler les problèmes de généralisation:
  * modifier le tracé des trottoirs s'il y a un passage piéton dans le virage. Dans ce cas, on ajoute un segment fixe (largeur 2 mètres par exemple)
  * si la voie se rétrécit, adapter le tracé ?