/**
 * scroll-fx.js - reveal au scroll, boutons magnetiques, timeline du pipeline,
 * ambiance de fond reactive au scroll. Utilise GSAP + ScrollTrigger (CDN,
 * plugins gratuits uniquement) quand disponibles, sinon repli sur
 * IntersectionObserver / listeners scroll simples.
 */
(function () {
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  // --- Navigation flottante : pleine largeur en haut, compacte au scroll ---
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    let navFrame = null;
    const updateNavbar = () => {
      navFrame = null;
      navbar.classList.toggle("is-scrolled", window.scrollY > 52);
    };
    const requestNavbarUpdate = () => {
      if (!navFrame) navFrame = requestAnimationFrame(updateNavbar);
    };
    window.addEventListener("scroll", requestNavbarUpdate, { passive: true });
    updateNavbar();
  }

  // --- Reveal generique au scroll (sections/cartes marquees .reveal) ---
  const revealEls = document.querySelectorAll(".reveal");
  if (reducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else if (hasGSAP) {
    revealEls.forEach((el, i) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          delay: (i % 5) * 0.06,
          scrollTrigger: { trigger: el, start: "top 88%" },
          onStart: () => el.classList.add("is-visible"),
        }
      );
    });
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // --- Timeline "Comment ca marche" : ligne de progression liee au scroll ---
  const pipeline = document.querySelector(".pipeline");
  const pipelineFill = document.querySelector(".pipeline-progress-fill");
  if (pipeline && pipelineFill) {
    if (hasGSAP && !reducedMotion) {
      gsap.to(pipelineFill, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: pipeline,
          start: "top 70%",
          end: "bottom 60%",
          scrub: 0.6,
        },
      });
    } else {
      const update = () => {
        const rect = pipeline.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.min(Math.max((vh * 0.7 - rect.top) / (rect.height * 0.6), 0), 1);
        pipelineFill.style.transform = `scaleY(${progress})`;
      };
      window.addEventListener("scroll", update, { passive: true });
      update();
    }
  }

  // --- Ambiance rouge/orange globale : reagit legerement au scroll ---
  const ambient = document.querySelector(".ambient-warm");
  if (ambient) {
    const updateAmbient = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const frac = docHeight > 0 ? window.scrollY / docHeight : 0;
      ambient.style.setProperty("--ambient-scroll-y", `${frac * 60}px`);
      ambient.style.opacity = String(0.12 + frac * 0.08);
    };
    window.addEventListener("scroll", updateAmbient, { passive: true });
    updateAmbient();
  }

  // --- Tilt leger + position souris (pour le hover color takeover en CSS) sur
  // les cartes categories ---
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
      card.style.setProperty("--my", `${(py + 0.5) * 100}%`);
      if (!reducedMotion) {
        const maxTilt = 14;
        card.style.transform = `perspective(900px) rotateX(${(-py * maxTilt).toFixed(2)}deg) rotateY(${(px * maxTilt).toFixed(2)}deg) translateY(-10px) scale(1.02)`;
      }
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  // --- Boutons magnetiques ---
  document.querySelectorAll(".magnetic").forEach((btn) => {
    if (reducedMotion) return;
    const strength = 0.35;
    const radius = 70;
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) {
        btn.style.transform = `translate(${dx * strength}px, ${dy * strength}px) scale(1.04)`;
        btn.classList.add("is-magnet-active");
      }
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
      btn.classList.remove("is-magnet-active");
    });
  });
})();
