/**
 * waste-data.js - source unique des 5 catégories de tri pour le hero et les
 * pages catégorie. Couleurs/labels alignés sur CATEGORY_INFO côté backend
 * (src/webapp/inference.py) - ne pas diverger sans mettre à jour les deux.
 *
 * Ordre du tableau = ordre du carrousel (jaune au centre au démarrage).
 */
(function () {
  window.WASTE_CATEGORIES = [
    {
      id: "jaune",
      label: "Poubelle JAUNE",
      short: "Jaune",
      color: "#FFD400",
      glow: "#FFE873",
      model: "/static/assets/3d/bin-yellow.glb",
      heroImage: "/static/img/hero/img_poubelle_jaune.png",
      wasteImage: "/static/img/waste/poubelle_jaune.png",
      definition: "Tous les emballages ménagers légers : plastique, métal et carton.",
      accepted: [
        "Bouteilles de soda et d'eau",
        "Canettes de boisson",
        "Boîtes de conserve",
        "Briques de lait ou de jus",
        "Flacons de shampooing",
        "Cartons de colis (aplatis)",
      ],
      refused: [
        "Vaisselle et objets en plastique dur (jouets, bassines)",
        "Emballages souillés par des restes alimentaires",
        "Sacs plastiques et films souples",
        "Polystyrène expansé",
      ],
      tips: [
        "Videz et rincez rapidement les contenants avant de les jeter",
        "Ne pas imbriquer les emballages les uns dans les autres",
        "Aplatissez les cartons et bouteilles pour gagner de la place",
      ],
    },
    {
      id: "verte",
      label: "Poubelle VERTE",
      short: "Verte",
      color: "#00E676",
      glow: "#7CFFB2",
      model: "/static/assets/3d/bin-green.glb",
      heroImage: "/static/img/hero/img_poubelle_verte.png",
      wasteImage: "/static/img/waste/poubelle_verte.png",
      definition: "Uniquement le verre d'emballage : bouteilles, pots et bocaux.",
      accepted: [
        "Bouteilles de jus ou de vin en verre",
        "Pots de confiture",
        "Bocaux de conserve en verre",
      ],
      refused: [
        "Vaisselle cassée (assiettes, verres à boire)",
        "Vitres et miroirs",
        "Ampoules et néons",
        "Porcelaine et céramique",
      ],
      tips: [
        "Retirez les bouchons et couvercles métalliques avant de jeter",
        "Inutile de laver le verre à fond, un simple vidage suffit",
        "Ne cassez pas le verre volontairement, cela complique le tri",
      ],
    },
    {
      id: "bleue",
      label: "Poubelle BLEUE",
      short: "Bleue",
      color: "#00AEEF",
      glow: "#7FE0FF",
      model: "/static/assets/3d/bin-blue.glb",
      heroImage: "/static/img/hero/img_poubelle_bleue.png",
      wasteImage: "/static/img/waste/poubelle_bleue.png",
      definition: "Tous les papiers graphiques propres et secs.",
      accepted: [
        "Prospectus publicitaires",
        "Journaux et magazines",
        "Cahiers et livres",
        "Enveloppes (avec ou sans fenêtre)",
      ],
      refused: [
        "Papier gras ou souillé (essuie-tout, papier cuisson)",
        "Papier peint",
        "Photos et papier plastifié",
        "Mouchoirs et serviettes en papier usagés",
      ],
      tips: [
        "Retirez les élastiques et films plastiques autour des liasses",
        "Le papier peut être froissé, pas besoin de l'aplatir",
        "Un papier trop sale part avec les déchets résiduels",
      ],
    },
    {
      id: "d3e",
      label: "Bac Électronique (D3E)",
      short: "D3E",
      color: "#00F0FF",
      glow: "#B2FBFF",
      model: "/static/assets/3d/bin-gray.glb",
      heroImage: "/static/img/hero/img_poubelle_grise.png",
      wasteImage: "/static/img/waste/poubelle_grise.png",
      definition: "Tout appareil fonctionnant à piles, batterie ou sur secteur.",
      accepted: [
        "Smartphones et tablettes",
        "Écouteurs et chargeurs",
        "Petit électroménager (mixeurs, sèche-cheveux)",
        "Montres et calculatrices",
      ],
      refused: [
        "Ampoules et néons (filière dédiée)",
        "Piles et batteries seules non intégrées",
        "Gros électroménager (à déposer en déchetterie)",
      ],
      tips: [
        "Déposez en point de collecte D3E plutôt qu'à la poubelle classique",
        "Effacez vos données personnelles avant de vous en séparer",
        "Retirez les piles amovibles quand c'est possible",
      ],
    },
    {
      id: "marron",
      label: "Poubelle MARRON / NOIRE",
      short: "Marron",
      color: "#D97757",
      glow: "#F0B79C",
      model: "/static/assets/3d/bin-residual.glb",
      heroImage: "/static/img/hero/img_poubelle_marron.png",
      wasteImage: "/static/img/waste/poubelle_marron.png",
      definition: "Les déchets résiduels non recyclables.",
      accepted: [
        "Restes alimentaires",
        "Emballages plastiques souples (sachets, films)",
        "Produits d'hygiène (mouchoirs, lingettes)",
        "Objets multicouches non recyclables",
      ],
      refused: [
        "Verre, papier, carton et métal recyclables",
        "Piles, batteries et électronique (filière D3E)",
        "Produits chimiques ou dangereux",
      ],
      tips: [
        "Vérifiez d'abord si l'objet ne correspond pas à une autre poubelle",
        "Emballez les déchets tranchants pour la sécurité de la collecte",
        "Réduisez le volume avant de jeter quand c'est possible",
      ],
    },
  ];
})();
