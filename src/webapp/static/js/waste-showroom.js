/**
 * Showroom immersif des 5 poubelles.
 *
 * Trois produits sont exposes en profondeur. Lors d'un changement, l'image
 * sortante se fragmente en bandes horizontales et la suivante emerge dans un
 * flash colore, comme la transition produit de la video de reference.
 */
(function () {
  const CATEGORIES = window.WASTE_CATEGORIES || [];
  const hasGSAP = typeof gsap !== "undefined";
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t = (key, params) => (window.EcoSortI18n ? window.EcoSortI18n.t(key, params) : key);

  const stageEl = document.getElementById("waste-showroom");
  const trackEl = document.getElementById("showroom-stage");
  const ambientEl = document.getElementById("showroom-ambient");

  const uiOverview = document.getElementById("ui-overview");
  const uiCategory = document.getElementById("ui-category");
  const titleEl = document.getElementById("showroom-title");
  const descEl = document.getElementById("showroom-desc");
  const prevBtn = document.getElementById("showroom-prev");
  const nextBtn = document.getElementById("showroom-next");
  const dotsEl = document.getElementById("showroom-dots");

  const catBackBtn = document.getElementById("category-back");
  const catChip = document.getElementById("category-chip");
  const catTitle = document.getElementById("category-page-title");
  const catDef = document.getElementById("category-page-def");
  const catAccepted = document.getElementById("category-accepted");
  const catRefused = document.getElementById("category-refused");
  const catTips = document.getElementById("category-tips-list");
  const catPrevBtn = document.getElementById("category-prev");
  const catNextBtn = document.getElementById("category-next");

  if (!stageEl || !trackEl || !CATEGORIES.length) return;

  const COUNT = CATEGORIES.length;

  function buildSlices(cat) {
    return Array.from({ length: 10 }, (_, sliceIndex) => {
      const top = sliceIndex * 10;
      const bottom = 100 - (sliceIndex + 1) * 10;
      const shift = (sliceIndex % 2 === 0 ? 1 : -1) * (34 + (sliceIndex % 4) * 12);
      const lift = (sliceIndex - 4.5) * 2.4;
      return `<span class="stage-slice" data-base-shift="${shift}" style="--slice-index:${sliceIndex}; --slice-lift:${lift}px; clip-path:inset(${top}% 0 ${bottom}% 0); background-image:url('${cat.heroImage}')"></span>`;
    }).join("");
  }

  // --- Construction des produits (une image persistante par categorie) ---
  const items = CATEGORIES.map((cat, i) => {
    const item = document.createElement("div");
    item.className = "stage-item";
    item.dataset.index = String(i);
    item.innerHTML = `
      <div class="stage-light" style="--c:${cat.color}" aria-hidden="true"></div>
      <div class="stage-shadow" style="--c:${cat.color}"></div>
      <div class="stage-visual">
        <img class="stage-img" src="${cat.heroImage}" alt="${escapeHtml(cat.label)}" draggable="false">
        <div class="stage-slices" aria-hidden="true">${buildSlices(cat)}</div>
        <div class="stage-scanline" style="--c:${cat.color}" aria-hidden="true"></div>
      </div>
    `;
    trackEl.appendChild(item);
    return item;
  });

  const transitionFx = document.createElement("div");
  transitionFx.className = "showroom-transition-flash";
  transitionFx.setAttribute("aria-hidden", "true");
  trackEl.appendChild(transitionFx);

  // La fiche categorie utilise une image dediee dont la source est remplacee
  // explicitement. Elle ne depend donc plus des opacites du showroom.
  const categoryProduct = document.createElement("div");
  categoryProduct.className = "category-stage-product";
  categoryProduct.setAttribute("aria-hidden", "true");
  categoryProduct.innerHTML = `
    <div class="category-stage-light"></div>
    <div class="category-stage-shadow"></div>
    <div class="category-stage-visual">
      <img class="category-stage-ghost" alt="" draggable="false">
      <img class="category-stage-image" alt="" draggable="false">
      <div class="category-stage-scanline"></div>
    </div>
  `;
  trackEl.appendChild(categoryProduct);
  const categoryStageImage = categoryProduct.querySelector(".category-stage-image");
  const categoryStageGhost = categoryProduct.querySelector(".category-stage-ghost");
  let categorySwapTimer = null;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Etat ---
  let activeIndex = 0;
  let isAnimating = false;
  let hoveredIndex = -1;
  let mode = "overview"; // "overview" | "category"
  let selectionTimeline = null;
  let selectionHandoff = null;

  function signedDistance(i, active) {
    let d = i - active;
    if (d > COUNT / 2) d -= COUNT;
    if (d < -COUNT / 2) d += COUNT;
    return d;
  }

  function itemTransform(distance) {
    const abs = Math.abs(distance);
    const scale = abs === 0 ? 1 : abs === 1 ? 0.66 : 0.34;
    const x = distance * 88; // trois produits lisibles, espaces comme dans la reference
    const z = -abs * 230;
    const rotY = THREE_clamp(-distance * 21, -48, 48);
    const opacity = abs === 0 ? 1 : abs === 1 ? 0.56 : 0;
    return { x, z, rotY, scale, opacity };
  }
  function THREE_clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function applyItemStyle(item, t, instant) {
    const img = item.querySelector(".stage-img");
    const shadow = item.querySelector(".stage-shadow");
    const transform = `translate(-50%, -50%) translateX(${t.x}%) translateZ(${t.z}px) rotateY(${t.rotY}deg) scale(${t.scale})`;
    if (instant || !hasGSAP || reducedMotion) {
      item.style.transform = transform;
      img.style.opacity = String(t.opacity);
      shadow.style.opacity = String(t.opacity * 0.7);
    } else {
      // On anime via un proxy pour pouvoir interpoler tous les params ensemble.
      const current = item._t || t;
      const proxy = { ...current };
      gsap.to(proxy, {
        x: t.x,
        z: t.z,
        rotY: t.rotY,
        scale: t.scale,
        opacity: t.opacity,
        duration: 0.8,
        ease: "power3.inOut",
        onUpdate: () => {
          item.style.transform = `translate(-50%, -50%) translateX(${proxy.x}%) translateZ(${proxy.z}px) rotateY(${proxy.rotY}deg) scale(${proxy.scale})`;
          img.style.opacity = String(proxy.opacity);
          shadow.style.opacity = String(proxy.opacity * 0.7);
        },
      });
    }
    item._t = t;
  }

  function layoutItems(instant) {
    items.forEach((item, i) => {
      const d = signedDistance(i, activeIndex);
      const t = itemTransform(d);
      item.dataset.distance = String(d);
      item.classList.toggle("is-active", d === 0);
      item.classList.toggle("is-neighbor", Math.abs(d) === 1);
      item.setAttribute("aria-hidden", String(Math.abs(d) > 1));
      item.style.zIndex = String(100 - Math.abs(d));
      applyItemStyle(item, t, instant);
    });
  }

  function pulseTransition(cat) {
    stageEl.style.setProperty("--transition-color", cat.color);
    transitionFx.classList.remove("is-active");
    void transitionFx.offsetWidth;
    transitionFx.classList.add("is-active");
    window.setTimeout(() => transitionFx.classList.remove("is-active"), 900);
  }

  function animateProductSwap(outgoingIndex, incomingIndex, direction) {
    if (reducedMotion || outgoingIndex === incomingIndex) return;
    const outgoing = items[outgoingIndex];
    const incoming = items[incomingIndex];
    const directionSign = direction >= 0 ? 1 : -1;

    outgoing.querySelectorAll(".stage-slice").forEach((slice) => {
      const baseShift = Number(slice.dataset.baseShift || 0);
      slice.style.setProperty("--slice-x", `${baseShift * directionSign}px`);
    });
    incoming.style.setProperty("--enter-rotate", `${directionSign * -16}deg`);

    outgoing.classList.remove("is-slicing");
    incoming.classList.remove("is-entering");
    void outgoing.offsetWidth;
    outgoing.classList.add("is-slicing");
    incoming.classList.add("is-entering");
    stageEl.classList.add("is-product-transition");
    pulseTransition(CATEGORIES[incomingIndex]);

    window.setTimeout(() => {
      outgoing.classList.remove("is-slicing");
      incoming.classList.remove("is-entering");
      stageEl.classList.remove("is-product-transition");
    }, 960);
  }

  function updateAmbient(cat) {
    if (ambientEl) {
      ambientEl.style.transition = "background 0.9s ease";
      ambientEl.style.setProperty("--amb-color", cat.glow);
    }
    // Expose la couleur active pour d'autres effets (fond a points du hero).
    window.EcoSortActiveColor = cat.color;
  }

  function updateOverviewCopy(cat) {
    if (titleEl) titleEl.textContent = cat.label;
    if (descEl) descEl.textContent = cat.definition;
    dotsEl.querySelectorAll(".dot-btn").forEach((d, i) => {
      d.setAttribute("aria-selected", String(i === activeIndex));
      d.classList.toggle("is-active", i === activeIndex);
    });
  }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = "";
    CATEGORIES.forEach((cat, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot-btn";
      dot.style.setProperty("--c", cat.color);
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", cat.label);
      dot.setAttribute("aria-selected", String(i === activeIndex));
      dot.addEventListener("click", () => goTo(i));
      dotsEl.appendChild(dot);
    });
  }

  function goTo(index, opts) {
    opts = opts || {};
    if (isAnimating && !opts.force) return;
    const next = ((index % COUNT) + COUNT) % COUNT;
    if (next === activeIndex && !opts.force) return;
    const outgoingIndex = activeIndex;
    const rawDistance = signedDistance(next, outgoingIndex);
    isAnimating = true;
    animateProductSwap(outgoingIndex, next, rawDistance);
    activeIndex = next;
    layoutItems(false);
    updateAmbient(CATEGORIES[activeIndex]);
    updateOverviewCopy(CATEGORIES[activeIndex]);
    window.setTimeout(() => {
      isAnimating = false;
    }, reducedMotion ? 80 : 980);
  }
  function next() {
    goTo(activeIndex + 1);
  }
  function prev() {
    goTo(activeIndex - 1);
  }

  buildDots();
  layoutItems(true);
  updateAmbient(CATEGORIES[activeIndex]);
  updateOverviewCopy(CATEGORIES[activeIndex]);

  // --- Survol / clic sur une poubelle ---
  items.forEach((item, i) => {
    item.addEventListener("mouseenter", () => {
      if (mode !== "overview") return;
      hoveredIndex = i;
    });
    item.addEventListener("mouseleave", () => {
      if (hoveredIndex === i) hoveredIndex = -1;
    });
    item.addEventListener("click", () => {
      if (mode !== "overview" || isAnimating) return;
      if (i === activeIndex) triggerSelect();
      else goTo(i);
    });
  });

  // --- Fleches, clavier, molette, glisser/swipe ---
  prevBtn && prevBtn.addEventListener("click", prev);
  nextBtn && nextBtn.addEventListener("click", next);

  window.addEventListener("keydown", (e) => {
    if (mode !== "overview") return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "Enter") triggerSelect();
  });

  // Molette : uniquement le geste horizontal (trackpad) declenche la
  // navigation. Le scroll vertical normal de la page n'est jamais intercepte
  // (sinon impossible de scroller la page avec la souris au-dessus du hero).
  let wheelLocked = false;
  stageEl.addEventListener(
    "wheel",
    (e) => {
      if (mode !== "overview" || wheelLocked) return;
      if (Math.abs(e.deltaX) < 24 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      wheelLocked = true;
      if (e.deltaX > 0) next();
      else prev();
      window.setTimeout(() => (wheelLocked = false), 700);
    },
    { passive: false }
  );

  let dragStartX = null;
  trackEl.addEventListener("pointerdown", (e) => {
    if (mode !== "overview") return;
    dragStartX = e.clientX;
  });
  window.addEventListener("pointerup", (e) => {
    if (dragStartX === null) return;
    const delta = e.clientX - dragStartX;
    dragStartX = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) next();
    else prev();
  });

  // --- Tilt subtil au mouvement de la souris (les vignettes restent 3D) ---
  let mouseNX = 0;
  let mouseNY = 0;
  if (!reducedMotion) {
    stageEl.addEventListener("mousemove", (e) => {
      const rect = stageEl.getBoundingClientRect();
      mouseNX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseNY = (e.clientY - rect.top) / rect.height - 0.5;
    });
    stageEl.addEventListener("mouseleave", () => {
      mouseNX = 0;
      mouseNY = 0;
    });

    let tiltX = 0;
    let tiltY = 0;
    (function tiltLoop() {
      requestAnimationFrame(tiltLoop);
      tiltX += (-mouseNY * 6 - tiltX) * 0.08;
      tiltY += (mouseNX * 8 - tiltY) * 0.08;
      trackEl.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      trackEl.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);

      items.forEach((item, i) => {
        const isHovered = mode === "overview" && i === hoveredIndex && i !== activeIndex && !isAnimating;
        const targetScale = isHovered ? 1.06 : 1;
        const current = item._hoverScale || 1;
        const eased = current + (targetScale - current) * 0.15;
        item._hoverScale = eased;
        const visual = item.querySelector(".stage-visual");
        visual.style.setProperty("--hover-scale", eased.toFixed(4));
      });
    })();
  }

  // --- Animation de selection ---
  function clearSelectionHandoff() {
    if (!selectionHandoff) return;
    selectionHandoff.clone.remove();
    selectionHandoff.sourceImage.style.opacity = selectionHandoff.sourceOpacity;
    selectionHandoff = null;
  }

  function createSelectionHandoff(cat) {
    clearSelectionHandoff();
    const sourceImage = items[activeIndex].querySelector(".stage-img");
    if (!sourceImage) return null;

    // La seconde image est mesuree avant d'etre affichee. Le clone peut ainsi
    // rejoindre exactement sa position, quelle que soit la taille de l'ecran.
    renderCategoryProduct(cat, false);
    const previousDisplay = categoryProduct.style.display;
    const previousVisibility = categoryProduct.style.visibility;
    categoryProduct.style.display = "block";
    categoryProduct.style.visibility = "hidden";
    const sourceRect = sourceImage.getBoundingClientRect();
    let targetRect = categoryStageImage.getBoundingClientRect();
    categoryProduct.style.display = previousDisplay;
    categoryProduct.style.visibility = previousVisibility;

    if (!sourceRect.width || !sourceRect.height) return null;
    if (!targetRect.width || !targetRect.height) {
      const productRect = categoryProduct.getBoundingClientRect();
      const width = productRect.width || sourceRect.width;
      const height = width * (sourceRect.height / sourceRect.width);
      targetRect = {
        left: productRect.left || sourceRect.left,
        top: productRect.top || sourceRect.top,
        width,
        height,
      };
    }

    const clone = sourceImage.cloneNode(false);
    clone.className = "category-handoff-product";
    clone.alt = "";
    clone.setAttribute("aria-hidden", "true");
    Object.assign(clone.style, {
      left: `${sourceRect.left}px`,
      top: `${sourceRect.top}px`,
      width: `${sourceRect.width}px`,
      height: `${sourceRect.height}px`,
    });
    document.body.appendChild(clone);

    selectionHandoff = {
      clone,
      sourceImage,
      sourceOpacity: sourceImage.style.opacity,
      targetRect,
    };
    sourceImage.style.opacity = "0";
    return selectionHandoff;
  }

  function triggerSelect() {
    if (isAnimating) return;
    isAnimating = true;
    const cat = CATEGORIES[activeIndex];
    const duration = reducedMotion ? 0.01 : 0.82;
    const handoff = createSelectionHandoff(cat);
    const fallbackAnimations = [];
    let hasFinished = false;

    const finishSelection = () => {
      if (hasFinished) return;
      hasFinished = true;
      fallbackAnimations.forEach((animation) => animation.cancel());
      selectionTimeline = null;
      enterCategoryMode(cat.id, true);
      const categoryHash = `#/categorie/${cat.id}`;
      if (window.location.hash !== categoryHash) window.location.hash = categoryHash;
    };

    uiOverview.classList.add("is-fading");
    if (!reducedMotion) pulseTransition(cat);

    if (hasGSAP) {
      if (selectionTimeline) selectionTimeline.kill();
      selectionTimeline = gsap.timeline({
        defaults: { ease: "power4.inOut" },
        onComplete: finishSelection,
      });
      const tl = selectionTimeline;
      items.forEach((item, i) => {
        if (i === activeIndex) return;
        const d = signedDistance(i, activeIndex);
        const dir = d === 0 ? 1 : Math.sign(d);
        const proxy = { x: item._t.x, z: item._t.z, rotY: item._t.rotY, scale: item._t.scale, opacity: item._t.opacity };
        tl.to(
          proxy,
          {
            x: dir * 70,
            z: -400,
            scale: 0.1,
            opacity: 0,
            duration: duration * 0.85,
            onUpdate: () => {
              item.style.transform = `translate(-50%, -50%) translateX(${proxy.x}%) translateZ(${proxy.z}px) rotateY(${proxy.rotY}deg) scale(${proxy.scale})`;
              item.querySelector(".stage-img").style.opacity = String(proxy.opacity);
              item.querySelector(".stage-shadow").style.opacity = String(proxy.opacity);
            },
          },
          0
        );
      });

      if (handoff) {
        tl.to(
          handoff.clone,
          {
            left: handoff.targetRect.left,
            top: handoff.targetRect.top,
            width: handoff.targetRect.width,
            height: handoff.targetRect.height,
            duration,
          },
          0
        );
      }
    } else {
      items.forEach((item, i) => {
        if (i === activeIndex) return;
        const neighborAnimation = item.animate(
          [
            { opacity: 1, transform: item.style.transform },
            { opacity: 0, transform: `${item.style.transform} scale(0.82)` },
          ],
          { duration: duration * 1000, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards" }
        );
        fallbackAnimations.push(neighborAnimation);
      });
      if (handoff) {
        const animation = handoff.clone.animate(
          [
            {
              left: handoff.clone.style.left,
              top: handoff.clone.style.top,
              width: handoff.clone.style.width,
              height: handoff.clone.style.height,
            },
            {
              left: `${handoff.targetRect.left}px`,
              top: `${handoff.targetRect.top}px`,
              width: `${handoff.targetRect.width}px`,
              height: `${handoff.targetRect.height}px`,
            },
          ],
          { duration: duration * 1000, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards" }
        );
        animation.finished.then(finishSelection).catch(finishSelection);
      } else {
        window.setTimeout(finishSelection, duration * 1000);
      }
    }
    updateAmbient(cat);
  }

  // --- Page categorie ---
  function renderCategoryPage(cat) {
    catChip.textContent = cat.short;
    catChip.style.setProperty("--c", cat.color);
    catTitle.textContent = cat.label;
    catDef.textContent = cat.definition;
    catAccepted.innerHTML = cat.accepted.map((it) => `<li>${escapeHtml(it)}</li>`).join("");
    catRefused.innerHTML = cat.refused.map((it) => `<li>${escapeHtml(it)}</li>`).join("");
    catTips.innerHTML = cat.tips.map((it) => `<li>${escapeHtml(it)}</li>`).join("");
    const previous = CATEGORIES[(activeIndex - 1 + COUNT) % COUNT];
    const following = CATEGORIES[(activeIndex + 1) % COUNT];
    catPrevBtn.textContent = `\u2190 ${previous.short}`;
    catNextBtn.textContent = `${following.short} \u2192`;
    catPrevBtn.setAttribute("aria-label", t("category.view", { label: previous.label }));
    catNextBtn.setAttribute("aria-label", t("category.view", { label: following.label }));
  }

  function renderCategoryProduct(cat, animate) {
    const previousSrc = categoryStageImage.getAttribute("src");
    categoryProduct.style.setProperty("--c", cat.color);
    categoryStageImage.alt = cat.label;

    if (animate && previousSrc && previousSrc !== cat.heroImage && !reducedMotion) {
      categoryStageGhost.src = previousSrc;
      categoryStageImage.src = cat.heroImage;
      categoryProduct.classList.remove("is-swapping");
      void categoryProduct.offsetWidth;
      categoryProduct.classList.add("is-swapping");
      if (categorySwapTimer) window.clearTimeout(categorySwapTimer);
      categorySwapTimer = window.setTimeout(() => {
        categoryProduct.classList.remove("is-swapping");
        categoryStageGhost.removeAttribute("src");
        categorySwapTimer = null;
      }, 820);
    } else {
      categoryProduct.classList.remove("is-swapping");
      categoryStageGhost.removeAttribute("src");
      categoryStageImage.src = cat.heroImage;
    }
  }

  function layoutCategoryItems(idx, instant) {
    items.forEach((item, i) => {
      const img = item.querySelector(".stage-img");
      const shadow = item.querySelector(".stage-shadow");
      const isActive = i === idx;
      const distance = signedDistance(i, idx);
      const direction = distance === 0 ? 1 : Math.sign(distance);
      const state = isActive
        ? { x: 0, z: 200, rotY: 0, scale: 1.3, opacity: 1 }
        : { x: direction * 80, z: -400, rotY: direction * -8, scale: 0.1, opacity: 0 };
      const transform = isActive
        ? "translate(-50%, -58%) translateZ(200px) scale(1.3)"
        : `translate(-50%, -50%) translateX(${state.x}%) translateZ(${state.z}px) rotateY(${state.rotY}deg) scale(${state.scale})`;

      item.dataset.distance = String(distance);
      item.classList.toggle("is-active", isActive);
      item.classList.toggle("is-neighbor", false);
      item.setAttribute("aria-hidden", String(!isActive));
      item.style.zIndex = isActive ? "101" : String(80 - Math.abs(distance));
      item._t = state;

      if (!instant && hasGSAP && !reducedMotion) {
        gsap.killTweensOf(item);
        gsap.killTweensOf(img);
        gsap.killTweensOf(shadow);
        gsap.to(item, { transform, duration: 0.65, ease: "power3.inOut", overwrite: true });
        gsap.to(img, { opacity: state.opacity, duration: 0.42, ease: "power2.inOut", overwrite: true });
        gsap.to(shadow, { opacity: isActive ? 0.5 : 0, duration: 0.42, ease: "power2.inOut", overwrite: true });
      } else {
        item.style.transform = transform;
        img.style.opacity = String(state.opacity);
        shadow.style.opacity = isActive ? "0.5" : "0";
      }
    });
  }

  function enterCategoryMode(catId, instant) {
    const idx = CATEGORIES.findIndex((c) => c.id === catId);
    if (idx < 0) return;
    const hasSelectionHandoff = Boolean(selectionHandoff);
    if (selectionTimeline) {
      selectionTimeline.kill();
      selectionTimeline = null;
    }
    const previousIndex = activeIndex;
    const changesProduct = mode === "category" && previousIndex !== idx && !instant;
    activeIndex = idx;
    mode = "category";
    stageEl.dataset.mode = "category";
    document.body.classList.add("is-category-mode");
    uiOverview.classList.add("hidden");
    uiOverview.classList.remove("is-fading");
    uiCategory.classList.remove("hidden");
    if (hasSelectionHandoff && !reducedMotion) {
      uiCategory.classList.remove("is-entering");
      void uiCategory.offsetWidth;
      uiCategory.classList.add("is-entering");
      window.setTimeout(() => uiCategory.classList.remove("is-entering"), 620);
    }
    catBackBtn.classList.remove("hidden");
    renderCategoryPage(CATEGORIES[idx]);
    renderCategoryProduct(CATEGORIES[idx], changesProduct);
    layoutCategoryItems(idx, instant);
    updateAmbient(CATEGORIES[idx]);
    isAnimating = changesProduct;
    if (changesProduct) window.setTimeout(() => (isAnimating = false), reducedMotion ? 80 : 980);
    if (hasSelectionHandoff) window.requestAnimationFrame(clearSelectionHandoff);
  }

  function exitCategoryMode() {
    mode = "overview";
    stageEl.dataset.mode = "overview";
    document.body.classList.remove("is-category-mode");
    uiCategory.classList.add("hidden");
    catBackBtn.classList.add("hidden");
    uiOverview.classList.remove("hidden");
    window.setTimeout(() => uiOverview.classList.remove("is-fading"), 20);
    layoutItems(false);
    updateAmbient(CATEGORIES[activeIndex]);
    updateOverviewCopy(CATEGORIES[activeIndex]);
    isAnimating = true;
    window.setTimeout(() => {
      isAnimating = false;
    }, 850);
  }

  catBackBtn.addEventListener("click", () => {
    window.location.hash = "";
  });
  catPrevBtn.addEventListener("click", () => {
    if (isAnimating) return;
    const idx = (activeIndex - 1 + COUNT) % COUNT;
    window.location.hash = `#/categorie/${CATEGORIES[idx].id}`;
  });
  catNextBtn.addEventListener("click", () => {
    if (isAnimating) return;
    const idx = (activeIndex + 1) % COUNT;
    window.location.hash = `#/categorie/${CATEGORIES[idx].id}`;
  });

  function syncFromHash() {
    const match = /^#\/categorie\/([a-z0-9]+)$/i.exec(window.location.hash);
    if (match) {
      enterCategoryMode(match[1], mode !== "category");
    } else if (mode === "category") {
      exitCategoryMode();
    }
  }
  window.addEventListener("hashchange", syncFromHash);
  syncFromHash();
})();
