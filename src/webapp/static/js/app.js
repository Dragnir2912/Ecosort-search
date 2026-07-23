const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsSection = document.getElementById("results");
const resultsGrid = document.getElementById("results-grid");
const resultsEmpty = document.getElementById("results-empty");
const queryLabel = document.getElementById("query-label");
const analysisOverlay = document.getElementById("analysis-overlay");
const resultOverlay = document.getElementById("result-overlay");
const resultIcon = document.getElementById("result-icon");
const resultTitle = document.getElementById("result-title");
const resultSource = document.getElementById("result-source");
const resultProductName = document.getElementById("result-product-name");
const resetBtn = document.getElementById("reset-btn");
const seeCategoriesBtn = document.getElementById("see-categories-btn");
const historyStrip = document.getElementById("history-strip");
const historyItems = document.getElementById("history-items");
const historyScrollPrev = document.getElementById("history-scroll-prev");
const historyScrollNext = document.getElementById("history-scroll-next");
const historyMoreBtn = document.getElementById("history-more");
const historyPanel = document.getElementById("history-panel");
const historyPanelItems = document.getElementById("history-panel-items");
const historyPanelBackdrop = document.getElementById("history-panel-backdrop");
const historyCloseBtn = document.getElementById("history-close");

const HISTORY_KEY = "ecosort_history_v1";
const HISTORY_MAX = 30;
const t = (key, params) => (window.EcoSortI18n ? window.EcoSortI18n.t(key, params) : key);
const currentLocale = window.EcoSortI18n && window.EcoSortI18n.language === "en" ? "en-GB" : "fr-FR";

const CATEGORY_ICONS_SVG = {
  jaune: '<svg viewBox="0 0 64 64" fill="none"><path d="M26 4h12v8l4 6v38a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V18l4-6V4z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
  verte: '<svg viewBox="0 0 64 64" fill="none"><path d="M22 12h20v6l-4 4v32a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V22l-4-4v-6h4z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
  bleue: '<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="10" width="44" height="44" rx="4" stroke="currentColor" stroke-width="3"/><line x1="18" y1="24" x2="46" y2="24" stroke="currentColor" stroke-width="3"/><line x1="18" y1="34" x2="46" y2="34" stroke="currentColor" stroke-width="3"/></svg>',
  d3e: '<svg viewBox="0 0 64 64" fill="none"><rect x="18" y="6" width="28" height="52" rx="5" stroke="currentColor" stroke-width="3"/><line x1="26" y1="50" x2="38" y2="50" stroke="currentColor" stroke-width="3"/></svg>',
  marron: '<svg viewBox="0 0 64 64" fill="none"><path d="M14 20h36l-3 36a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4L14 20z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
};
const DEFAULT_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';

// --- Section categories : synchronisee avec /api/categories (source unique
// de verite partagee avec le backend pour les couleurs/labels officiels). ---
async function loadCategories() {
  try {
    const response = await fetch("/api/categories");
    const data = await response.json();
    const categories = data.categories || {};
    Object.entries(categories).forEach(([key, info]) => {
      const card = document.querySelector(`.category-card[data-category="${key}"]`);
      if (!card) return;
      card.dataset.color = info.color;
      card.style.setProperty("--c", info.color);
      const title = card.querySelector(".category-title");
      const localCategory = (window.WASTE_CATEGORIES || []).find((category) => category.id === key);
      if (title) title.textContent = localCategory ? localCategory.label : info.label;
      const swatch = card.querySelector(".category-swatch");
      if (swatch) swatch.style.setProperty("--c", info.color);
      const fb = card.querySelector(".category-icon-fallback");
      if (fb) fb.style.setProperty("--c", info.color);
    });
  } catch (err) {
    console.warn("[app] /api/categories indisponible, valeurs statiques conservees.", err);
  }
}
loadCategories();

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  resultsSection.classList.remove("hidden");
  resultsGrid.innerHTML = renderSkeletons();
  resultsEmpty.classList.add("hidden");
  queryLabel.textContent = `"${query}"`;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
    const data = await response.json();
    renderResults(data.products || []);
  } catch (err) {
    resultsGrid.innerHTML = "";
    resultsEmpty.textContent = t("app.serviceUnavailable");
    resultsEmpty.classList.remove("hidden");
  }
});

function renderSkeletons() {
  return Array.from({ length: 6 })
    .map(
      () => `
    <div class="card" style="pointer-events:none;">
      <div class="thumb" style="background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.09), rgba(255,255,255,0.04)); background-size: 200% 100%; animation: shimmer 1.2s infinite;"></div>
      <div style="height:12px; width:80%; background:rgba(255,255,255,0.08); border-radius:4px; margin-bottom:8px;"></div>
      <div style="height:14px; width:40%; background:rgba(255,255,255,0.08); border-radius:4px;"></div>
    </div>`
    )
    .join("");
}

function renderResults(products) {
  if (!products.length) {
    resultsGrid.innerHTML = "";
    resultsEmpty.classList.remove("hidden");
    return;
  }
  resultsEmpty.classList.add("hidden");
  resultsGrid.innerHTML = products
    .map(
      (p, i) => `
    <div class="card" data-index="${i}">
      <div class="thumb">${p.image_url ? `<img src="${p.image_url}" alt="" loading="lazy">` : ""}</div>
      <p class="name">${escapeHtml(p.title || t("app.product"))}</p>
      <p class="price">${p.price || ""}</p>
    </div>`
    )
    .join("");

  resultsGrid.querySelectorAll(".card").forEach((card, i) => {
    card.addEventListener("click", () => classifyProduct(products[i]));
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function classifyProduct(product) {
  analysisOverlay.classList.remove("hidden");
  startNeuralAnimation();
  const startTime = Date.now();

  let result;
  try {
    const response = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_name: product.title, image_url: product.image_url }),
    });
    result = await response.json();
  } catch (err) {
    result = { category: "marron", label: "Poubelle MARRON / NOIRE", color: "#D97757", glow: "#F0B79C", source: "erreur", confidence: 0 };
  }

  const elapsed = Date.now() - startTime;
  const minDelay = 1400;
  if (elapsed < minDelay) {
    await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
  }

  stopNeuralAnimation();
  analysisOverlay.classList.add("hidden");
  showResult(result, product.title);
  pushHistory(result, product.title);
}

function showResult(result, productTitle) {
  resultOverlay.classList.remove("is-revealed");
  resultOverlay.style.setProperty("--burst-color", result.glow || result.color);
  resultOverlay.style.background = `radial-gradient(circle at 50% 35%, ${result.glow}22, #05080e 78%)`;
  resultOverlay.style.color = "#fff";
  const catData = (window.WASTE_CATEGORIES || []).find((c) => c.id === result.category);
  if (catData) {
    resultIcon.innerHTML = `<img src="${catData.wasteImage}" alt="${escapeHtml(catData.label)}">`;
    resultIcon.classList.add("has-photo");
  } else {
    resultIcon.innerHTML = CATEGORY_ICONS_SVG[result.category] || DEFAULT_ICON_SVG;
    resultIcon.classList.remove("has-photo");
  }
  resultIcon.style.color = result.color;
  resultIcon.style.boxShadow = `0 0 70px ${result.color}88, inset 0 0 20px ${result.color}44`;
  resultIcon.style.background = `${result.color}33`;
  const localizedLabel = catData ? catData.label : result.label;
  resultTitle.textContent = t("result.throwIn", { label: localizedLabel });
  resultSource.textContent = t("result.detected");
  resultProductName.textContent = productTitle || t("app.product");

  const iris = document.getElementById("iris-wipe");
  iris.style.background = `radial-gradient(circle at 50% 45%, ${result.glow}55, ${result.color}33 45%, #05080e 85%)`;

  resultOverlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    resultOverlay.classList.add("is-revealed");
  });
}

resetBtn.addEventListener("click", () => {
  resultOverlay.classList.add("hidden");
  resultOverlay.classList.remove("is-revealed");
  searchInput.focus();
});

if (seeCategoriesBtn) {
  seeCategoriesBtn.addEventListener("click", () => {
    resultOverlay.classList.add("hidden");
    resultOverlay.classList.remove("is-revealed");
  });
}

// --- Historique de tri (localStorage, purement front) ---
function getHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (err) {
    return [];
  }
}

function pushHistory(result, productTitle) {
  const history = getHistory();
  history.unshift({ ...result, productTitle: productTitle || t("app.product"), ts: Date.now() });
  const trimmed = history.slice(0, HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  renderHistory(trimmed);
}

function renderHistory(history) {
  const items = history || getHistory();
  if (!items.length) {
    historyStrip.classList.add("hidden");
    historyPanel.classList.add("hidden");
    return;
  }
  historyStrip.classList.remove("hidden");
  historyMoreBtn.textContent = t("history.moreCount", { count: items.length });
  historyItems.innerHTML = items
    .map(
      (entry, i) => {
        const category = (window.WASTE_CATEGORIES || []).find((item) => item.id === entry.category);
        const label = category ? category.label : entry.label;
        return `
    <button type="button" class="history-chip" data-index="${i}" style="--c:${entry.color};" title="${escapeHtml(label)}">
      <span class="dot"></span>${escapeHtml(truncate(entry.productTitle, 18))}
    </button>`;
      }
    )
    .join("");

  historyItems.querySelectorAll(".history-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const entry = items[Number(chip.dataset.index)];
      if (entry) showResult(entry, entry.productTitle);
    });
  });

  historyPanelItems.innerHTML = items
    .map(
      (entry, i) => {
        const category = (window.WASTE_CATEGORIES || []).find((item) => item.id === entry.category);
        const label = category ? category.label : entry.label || t("history.unknown");
        return `
    <button type="button" class="history-panel-entry" data-index="${i}" style="--c:${entry.color};">
      <span class="dot" aria-hidden="true"></span>
      <span class="history-entry-copy">
        <span class="history-entry-title">${escapeHtml(entry.productTitle || t("app.product"))}</span>
        <span class="history-entry-category">${escapeHtml(label)}</span>
      </span>
      <time class="history-entry-time" datetime="${formatHistoryDateTime(entry.ts)}">${formatHistoryTime(entry.ts)}</time>
    </button>`;
      }
    )
    .join("");

  historyPanelItems.querySelectorAll(".history-panel-entry").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = items[Number(button.dataset.index)];
      if (!entry) return;
      closeHistoryPanel();
      showResult(entry, entry.productTitle);
    });
  });

  requestAnimationFrame(updateHistoryScrollButtons);
}

function formatHistoryTime(timestamp) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(currentLocale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch (err) {
    return "";
  }
}

function formatHistoryDateTime(timestamp) {
  const date = new Date(timestamp || Date.now());
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function updateHistoryScrollButtons() {
  if (!historyItems || !historyScrollPrev || !historyScrollNext) return;
  const maxScroll = Math.max(0, historyItems.scrollWidth - historyItems.clientWidth);
  const hasOverflow = maxScroll > 3;
  historyScrollPrev.classList.toggle("hidden", !hasOverflow);
  historyScrollNext.classList.toggle("hidden", !hasOverflow);
  historyScrollPrev.disabled = historyItems.scrollLeft <= 3;
  historyScrollNext.disabled = historyItems.scrollLeft >= maxScroll - 3;
}

function scrollHistory(direction) {
  historyItems.scrollBy({ left: direction * Math.max(180, historyItems.clientWidth * 0.72), behavior: "smooth" });
}

let historyLastFocus = null;
function openHistoryPanel() {
  historyLastFocus = document.activeElement;
  historyPanel.classList.remove("hidden");
  document.body.classList.add("history-open");
  historyCloseBtn.focus();
}

function closeHistoryPanel() {
  if (historyPanel.classList.contains("hidden")) return;
  historyPanel.classList.add("hidden");
  document.body.classList.remove("history-open");
  if (historyLastFocus && typeof historyLastFocus.focus === "function") historyLastFocus.focus();
}

historyScrollPrev.addEventListener("click", () => scrollHistory(-1));
historyScrollNext.addEventListener("click", () => scrollHistory(1));
historyItems.addEventListener("scroll", updateHistoryScrollButtons, { passive: true });
window.addEventListener("resize", updateHistoryScrollButtons, { passive: true });
historyMoreBtn.addEventListener("click", openHistoryPanel);
historyPanelBackdrop.addEventListener("click", closeHistoryPanel);
historyCloseBtn.addEventListener("click", closeHistoryPanel);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !historyPanel.classList.contains("hidden")) closeHistoryPanel();
});

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len - 1) + "…" : str;
}

renderHistory();

let neuralAnimationId = null;

function startNeuralAnimation() {
  const canvas = document.getElementById("neural-canvas");
  const ctx = canvas.getContext("2d");
  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const nodeCount = 36;
  const nodes = Array.from({ length: nodeCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    });

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.strokeStyle = `rgba(0, 255, 157, ${1 - dist / 140})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "#00ff9d";
      ctx.fill();
    });

    neuralAnimationId = requestAnimationFrame(frame);
  }
  frame();

  canvas._resizeHandler = resize;
}

function stopNeuralAnimation() {
  if (neuralAnimationId) cancelAnimationFrame(neuralAnimationId);
  neuralAnimationId = null;
  const canvas = document.getElementById("neural-canvas");
  if (canvas._resizeHandler) window.removeEventListener("resize", canvas._resizeHandler);
}

const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
document.head.appendChild(styleSheet);
