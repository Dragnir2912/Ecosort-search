/**
 * Traductions de l'interface et preference de langue persistante.
 * Le module est charge apres waste-data.js et avant les composants visuels.
 */
(function () {
  const STORAGE_KEY = "ecosort_language";
  const supportedLanguages = ["fr", "en"];

  const messages = {
    fr: {
      "nav.guides": "Consignes de tri",
      "nav.how": "Comment ça marche",
      "nav.language": "Langue",
      "nav.french": "Français",
      "nav.english": "English",
      "nav.ready": "IA prête",
      "hero.eyebrow": "Tri sélectif assisté par intelligence artificielle",
      "hero.title": "Trouvez le produit.<br>Laissez l'IA trier.",
      "hero.tagline": "Recherchez un article, l'IA analyse son emballage et vous indique instantanément la bonne poubelle.",
      "hero.placeholder": "Entrez le nom d'un produit (ex : bouteille Coca-Cola)",
      "hero.search": "Rechercher",
      "showroom.back": "Retour",
      "showroom.choose": "Choisissez une poubelle",
      "showroom.previous": "Poubelle précédente",
      "showroom.next": "Poubelle suivante",
      "showroom.dots": "Choisir une catégorie de tri",
      "showroom.hint": "Cliquez sur la poubelle active pour la découvrir - glissez ou utilisez les flèches pour changer",
      "category.accepted": "À déposer",
      "category.refused": "À éviter",
      "category.tips": "Les bons gestes",
      "category.previous": "Précédente",
      "category.next": "Suivante",
      "category.view": "Voir {label}",
      "results.for": "Résultats pour",
      "results.empty": "Aucun produit trouvé. Essayez un autre mot-clé.",
      "categories.eyebrow": "Guide essentiel",
      "categories.title": "Les 5 consignes de tri",
      "categories.sub": "Chaque produit est classé dans l'une de ces 5 catégories strictes.",
      "pipeline.eyebrow": "Une réponse en quelques secondes",
      "pipeline.title": "Comment ça marche",
      "pipeline.step1.title": "1. Trouvez votre produit",
      "pipeline.step1.desc": "Saisissez son nom pour afficher rapidement les choix les plus pertinents.",
      "pipeline.step2.title": "2. L’IA l’analyse",
      "pipeline.step2.desc": "EcoSort identifie sa matière et sa catégorie grâce au nom et à l’image du produit.",
      "pipeline.step3.title": "3. Triez au bon endroit",
      "pipeline.step3.desc": "La bonne poubelle apparaît immédiatement avec une consigne claire et facile à retenir.",
      "analysis.loading": "Analyse IA en cours",
      "result.sub": "Jetez cet article dans la poubelle indiquée.",
      "result.newSearch": "Nouvelle recherche",
      "result.seeGuides": "Voir toutes les consignes",
      "result.throwIn": "Jetez dans la {label}",
      "result.detected": "Catégorie détectée",
      "result.productLabel": "Produit analysé",
      "history.label": "Historique de tri",
      "history.previous": "Voir les tris précédents",
      "history.next": "Voir les tris suivants",
      "history.items": "Derniers tris",
      "history.more": "Tout voir",
      "history.moreCount": "Tout voir ({count})",
      "history.recent": "Vos derniers tris",
      "history.title": "Historique complet",
      "history.close": "Fermer l'historique",
      "history.closeShort": "Fermer",
      "history.unknown": "Catégorie inconnue",
      "colors.yellow": "Jaune",
      "colors.green": "Verte",
      "colors.blue": "Bleue",
      "colors.brown": "Marron",
      "footer.tagline": "Le bon geste de tri, au bon moment.",
      "footer.navigation": "Navigation secondaire",
      "footer.search": "Nouvelle recherche",
      "footer.guide": "Guide de tri",
      "footer.how": "Fonctionnement",
      "footer.github": "Code source sur GitHub",
      "footer.note": "Les consignes peuvent varier selon votre commune. Vérifiez les règles locales en cas de doute.",
      "footer.copyright": "© 2026 EcoSort-Search. Tous droits réservés.",
      "app.serviceUnavailable": "Le service de recherche est momentanément indisponible.",
      "app.product": "Produit",
    },
    en: {
      "nav.guides": "Sorting guide",
      "nav.how": "How it works",
      "nav.language": "Language",
      "nav.french": "Français",
      "nav.english": "English",
      "nav.ready": "AI ready",
      "hero.eyebrow": "AI-powered waste sorting",
      "hero.title": "Find the product.<br>Let AI sort it.",
      "hero.tagline": "Search for an item and AI will analyse its packaging and instantly show you the right bin.",
      "hero.placeholder": "Enter a product name (e.g. Coca-Cola bottle)",
      "hero.search": "Search",
      "showroom.back": "Back",
      "showroom.choose": "Choose a bin",
      "showroom.previous": "Previous bin",
      "showroom.next": "Next bin",
      "showroom.dots": "Choose a sorting category",
      "showroom.hint": "Select the active bin to learn more - swipe or use the arrows to browse",
      "category.accepted": "Put in",
      "category.refused": "Keep out",
      "category.tips": "Good habits",
      "category.previous": "Previous",
      "category.next": "Next",
      "category.view": "View {label}",
      "results.for": "Results for",
      "results.empty": "No products found. Try another keyword.",
      "categories.eyebrow": "Essential guide",
      "categories.title": "The 5 sorting categories",
      "categories.sub": "Every product is assigned to one of these five clear categories.",
      "pipeline.eyebrow": "An answer in seconds",
      "pipeline.title": "How it works",
      "pipeline.step1.title": "1. Find your product",
      "pipeline.step1.desc": "Enter its name to quickly display the most relevant matches.",
      "pipeline.step2.title": "2. AI analyses it",
      "pipeline.step2.desc": "EcoSort identifies its material and category from the product name and image.",
      "pipeline.step3.title": "3. Use the right bin",
      "pipeline.step3.desc": "The correct bin appears instantly with clear, memorable guidance.",
      "analysis.loading": "AI analysis in progress",
      "result.sub": "Place this item in the indicated bin.",
      "result.newSearch": "New search",
      "result.seeGuides": "View all sorting guidance",
      "result.throwIn": "Place it in the {label}",
      "result.detected": "Detected category",
      "result.productLabel": "Analysed product",
      "history.label": "Sorting history",
      "history.previous": "View previous items",
      "history.next": "View next items",
      "history.items": "Recent sorted items",
      "history.more": "View all",
      "history.moreCount": "View all ({count})",
      "history.recent": "Your recent items",
      "history.title": "Full history",
      "history.close": "Close history",
      "history.closeShort": "Close",
      "history.unknown": "Unknown category",
      "colors.yellow": "Yellow",
      "colors.green": "Green",
      "colors.blue": "Blue",
      "colors.brown": "Brown",
      "footer.tagline": "The right sorting choice, right when you need it.",
      "footer.navigation": "Secondary navigation",
      "footer.search": "New search",
      "footer.guide": "Sorting guide",
      "footer.how": "How it works",
      "footer.github": "Source code on GitHub",
      "footer.note": "Sorting rules may vary by location. Check your local guidance when in doubt.",
      "footer.copyright": "© 2026 EcoSort-Search. All rights reserved.",
      "app.serviceUnavailable": "The search service is temporarily unavailable.",
      "app.product": "Product",
    },
  };

  const englishCategories = {
    jaune: {
      label: "YELLOW bin",
      short: "Yellow",
      definition: "All lightweight household packaging: plastic, metal and cardboard.",
      cardDescription: "Lightweight packaging: bottles, cans, tins, cartons, containers and cardboard.",
      materials: "plastic - metal - cardboard",
      imageAlt: "yellow recycling bin",
      accepted: ["Soft drink and water bottles", "Drink cans", "Food tins", "Milk and juice cartons", "Shampoo and cleaning bottles", "Flattened cardboard boxes"],
      refused: ["Hard plastic objects such as toys or bowls", "Packaging heavily soiled with food", "Plastic bags and flexible film", "Expanded polystyrene"],
      tips: ["Empty and quickly rinse containers", "Do not nest packaging inside other packaging", "Flatten boxes and bottles to save space"],
    },
    verte: {
      label: "GREEN bin",
      short: "Green",
      definition: "Glass packaging only: bottles, pots and jars.",
      cardDescription: "Glass packaging only: drink bottles, jam jars and food jars. No broken tableware.",
      materials: "glass",
      imageAlt: "green glass recycling bin",
      accepted: ["Glass juice and wine bottles", "Jam jars", "Glass food jars"],
      refused: ["Broken tableware and drinking glasses", "Windows and mirrors", "Light bulbs and fluorescent tubes", "Porcelain and ceramics"],
      tips: ["Remove metal caps and lids", "A quick emptying is enough; deep cleaning is unnecessary", "Do not deliberately break glass before disposal"],
    },
    bleue: {
      label: "BLUE bin",
      short: "Blue",
      definition: "Clean and dry paper products.",
      cardDescription: "Clean paper: flyers, newspapers, magazines, notebooks, books and envelopes.",
      materials: "paper",
      imageAlt: "blue paper recycling bin",
      accepted: ["Advertising flyers", "Newspapers and magazines", "Notebooks and books", "Envelopes with or without windows"],
      refused: ["Greasy or dirty paper", "Wallpaper", "Photos and laminated paper", "Used tissues and paper towels"],
      tips: ["Remove rubber bands and plastic wrapping", "Paper may be crumpled and does not need flattening", "Put heavily soiled paper with residual waste"],
    },
    d3e: {
      label: "Electronics collection (WEEE)",
      short: "WEEE",
      definition: "Any device powered by batteries or mains electricity.",
      cardDescription: "Battery-powered or plugged-in products: phones, headphones, chargers, mixers and watches.",
      materials: "electronics",
      imageAlt: "electronics collection bin",
      accepted: ["Smartphones and tablets", "Headphones and chargers", "Small household appliances", "Watches and calculators"],
      refused: ["Light bulbs and fluorescent tubes", "Loose batteries", "Large household appliances"],
      tips: ["Use a dedicated electronics collection point", "Erase personal data before disposal", "Remove detachable batteries whenever possible"],
    },
    marron: {
      label: "BROWN / BLACK bin",
      short: "Brown",
      definition: "Residual waste that cannot be recycled.",
      cardDescription: "Residual waste: food scraps, flexible packaging, hygiene products and mixed-material objects.",
      materials: "residual waste",
      imageAlt: "brown residual waste bin",
      accepted: ["Food scraps", "Flexible plastic bags and film", "Used tissues and wipes", "Non-recyclable mixed-material objects"],
      refused: ["Recyclable glass, paper, cardboard and metal", "Batteries and electronics", "Chemical or hazardous products"],
      tips: ["First check whether another sorting category applies", "Wrap sharp items for collection safety", "Reduce the volume before disposal whenever possible"],
    },
  };

  function readLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (supportedLanguages.includes(saved)) return saved;
    } catch (err) {
      // Storage may be disabled; French remains the safe default.
    }
    return "fr";
  }

  const language = readLanguage();

  function t(key, params) {
    let value = messages[language][key] || messages.fr[key] || key;
    Object.entries(params || {}).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, String(replacement));
    });
    return value;
  }

  function localizeCategories() {
    if (language !== "en") return;
    (window.WASTE_CATEGORIES || []).forEach((category) => {
      const translation = englishCategories[category.id];
      if (translation) Object.assign(category, translation);
    });
  }

  function localizeCategoryCards() {
    (window.WASTE_CATEGORIES || []).forEach((category) => {
      const card = document.querySelector(`.category-card[data-category="${category.id}"]`);
      if (!card) return;
      const title = card.querySelector(".category-title");
      if (title) title.textContent = category.label;
      if (language === "en") {
        const description = card.querySelector(".category-desc");
        const materials = card.querySelector(".category-materials");
        const image = card.querySelector(".category-photo");
        if (description) description.textContent = category.cardDescription;
        if (materials) materials.textContent = category.materials;
        if (image) image.alt = category.imageAlt;
      }
    });
  }

  function applyTranslations() {
    document.documentElement.lang = language;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      element.innerHTML = t(element.dataset.i18nHtml);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    const current = document.getElementById("language-current");
    if (current) current.textContent = language.toUpperCase();
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.language === language));
    });
    localizeCategoryCards();
  }

  function setupLanguageMenu() {
    const picker = document.getElementById("language-picker");
    const toggle = document.getElementById("language-toggle");
    const menu = document.getElementById("language-menu");
    if (!picker || !toggle || !menu) return;

    const closeMenu = () => {
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    };
    const openMenu = () => {
      menu.classList.remove("hidden");
      toggle.setAttribute("aria-expanded", "true");
      const selected = menu.querySelector('[aria-checked="true"]');
      if (selected) selected.focus();
    };

    toggle.addEventListener("click", () => {
      if (menu.classList.contains("hidden")) openMenu();
      else closeMenu();
    });
    menu.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextLanguage = button.dataset.language;
        if (!supportedLanguages.includes(nextLanguage)) return;
        if (nextLanguage === language) {
          closeMenu();
          return;
        }
        try {
          localStorage.setItem(STORAGE_KEY, nextLanguage);
        } catch (err) {
          // The reload still applies the default if storage is unavailable.
        }
        window.location.reload();
      });
    });
    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) closeMenu();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.classList.contains("hidden")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  localizeCategories();
  window.EcoSortI18n = { language, t };
  applyTranslations();
  setupLanguageMenu();
})();
