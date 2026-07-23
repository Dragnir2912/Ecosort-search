/**
 * Grille de points interactive plein ecran.
 *
 * Le canvas reste fixe derriere toute l'application. Les points proches du
 * curseur s'allument progressivement et le scroll ajoute une legere parallaxe.
 * L'effet reste statique si l'utilisateur prefere reduire les animations.
 */
(function () {
  const background = document.querySelector(".bg-fx");
  if (!background) return;

  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const canvas = document.createElement("canvas");
  canvas.id = "app-bg-particles";
  canvas.setAttribute("aria-hidden", "true");
  background.prepend(canvas);

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const COLOR = { r: 43, g: 230, b: 164 };
  const SPACING = coarsePointer ? 30 : 27;
  const POINTER_RADIUS = coarsePointer ? 110 : 175;
  const BASE_ALPHA = 0.075;
  const MAX_DPR = coarsePointer ? 1.35 : 1.75;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = null;
  let pointerSeen = false;
  let scrollVelocity = 0;
  let lastScrollY = window.scrollY || 0;
  let gridOffsetY = 0;

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.42,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.42,
    strength: 0,
    targetStrength: 0,
  };

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function drawDot(x, y, radius, alpha) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${COLOR.r}, ${COLOR.g}, ${COLOR.b}, ${alpha})`;
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    if (pointer.strength > 0.01) {
      const halo = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, POINTER_RADIUS * 1.25);
      halo.addColorStop(0, `rgba(${COLOR.r}, ${COLOR.g}, ${COLOR.b}, ${0.055 * pointer.strength})`);
      halo.addColorStop(0.45, `rgba(${COLOR.r}, ${COLOR.g}, ${COLOR.b}, ${0.022 * pointer.strength})`);
      halo.addColorStop(1, "rgba(43, 230, 164, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(pointer.x - POINTER_RADIUS * 1.25, pointer.y - POINTER_RADIUS * 1.25, POINTER_RADIUS * 2.5, POINTER_RADIUS * 2.5);
    }

    const offsetY = ((gridOffsetY % SPACING) + SPACING) % SPACING;
    const cols = Math.ceil(width / SPACING) + 2;
    const rows = Math.ceil(height / SPACING) + 2;

    for (let row = -1; row < rows; row += 1) {
      const y = row * SPACING + offsetY;
      for (let col = -1; col < cols; col += 1) {
        const x = col * SPACING + SPACING * 0.5;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const proximity = pointer.strength * Math.max(0, 1 - distance / POINTER_RADIUS);
        const eased = proximity * proximity * (3 - 2 * proximity);
        const alpha = BASE_ALPHA + eased * 0.72;
        const radius = 0.72 + eased * 1.25;
        drawDot(x, y, radius, alpha);
      }
    }
  }

  function frame() {
    rafId = null;
    if (document.hidden) return;

    pointer.x += (pointer.targetX - pointer.x) * 0.16;
    pointer.y += (pointer.targetY - pointer.y) * 0.16;
    pointer.strength += (pointer.targetStrength - pointer.strength) * 0.12;
    gridOffsetY += scrollVelocity * 0.18;
    scrollVelocity *= 0.82;
    draw();

    const pointerMoving = Math.abs(pointer.targetX - pointer.x) + Math.abs(pointer.targetY - pointer.y) > 0.15;
    const strengthMoving = Math.abs(pointer.targetStrength - pointer.strength) > 0.01;
    if (pointerMoving || strengthMoving || Math.abs(scrollVelocity) > 0.04) scheduleFrame();
  }

  function scheduleFrame() {
    if (!rafId && !reducedMotion && !document.hidden) rafId = requestAnimationFrame(frame);
  }

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      pointerSeen = true;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointer.targetStrength = 1;
      scheduleFrame();
    },
    { passive: true }
  );

  document.documentElement.addEventListener("pointerleave", () => {
    pointer.targetStrength = 0;
    scheduleFrame();
  });

  window.addEventListener(
    "scroll",
    () => {
      const currentScrollY = window.scrollY || 0;
      scrollVelocity += Math.max(-18, Math.min(18, currentScrollY - lastScrollY));
      lastScrollY = currentScrollY;
      if (!pointerSeen && !coarsePointer) pointer.targetStrength = 0.28;
      scheduleFrame();
    },
    { passive: true }
  );

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      draw();
      scheduleFrame();
    }
  });

  resize();
  if (!reducedMotion) scheduleFrame();
})();
