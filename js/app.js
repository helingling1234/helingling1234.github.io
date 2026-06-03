/**
 * CV site — bilingual (EN/ZH).
 * All content from content.json (or window.CV_DATA when opened via file://).
 *
 * Language flow:
 *   - state.lang is "en" or "zh"
 *   - persisted in localStorage("cv-lang")
 *   - default: "en" (per user preference)
 *   - the floating button toggles, then renderAll() re-renders.
 */

const PUB_FOLD = 10; // English publications visible before "Show more"

// ── Global state ───────────────────────────────────────────────────────────
const state = {
  lang: "en",
  data: null
};

// ── Helpers ────────────────────────────────────────────────────────────────

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  children.forEach(c => {
    if (c == null) return;
    node.append(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Return localized field. Looks for `${base}Zh` when lang === "zh", else `base`. */
function L(obj, base) {
  if (!obj) return "";
  if (state.lang === "zh") {
    const zh = obj[base + "Zh"];
    if (zh != null && zh !== "") return zh;
  }
  return obj[base] || "";
}

/** Localized membership/etc. that uses {en, zh} shape. */
function Lpair(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (state.lang === "zh" && item.zh) return item.zh;
  return item.en || "";
}

function t(key) {
  const ui = (state.data && state.data.ui) || {};
  return (ui[state.lang] && ui[state.lang][key]) || (ui.en && ui.en[key]) || key;
}

// ── Render: profile ─────────────────────────────────────────────────────────

function renderProfile(p) {
  const lang = state.lang;
  const displayName = lang === "zh" ? (p.nameZh || p.name) : p.name;
  document.title = `${displayName} · ${t("docTitleSuffix")}`;
  document.getElementById("topbar-name").textContent = displayName;
  document.getElementById("footer-name").textContent = displayName;

  // Avatar fallback to initials
  const avatar = document.getElementById("avatar");
  const avatarImg = document.getElementById("avatar-img");
  // Clear any previously-injected initials before re-rendering
  avatar.querySelectorAll(".avatar-initials").forEach(n => n.remove());
  const showInitials = () => {
    const initials = document.createElement("span");
    initials.className = "avatar-initials";
    initials.textContent = getInitials(p.name);
    avatar.append(initials);
  };
  if (!avatarImg) {
    showInitials();
  } else {
    avatarImg.addEventListener("error", showInitials, { once: true });
    if (avatarImg.complete && avatarImg.naturalWidth === 0) showInitials();
  }

  document.getElementById("hero-name").textContent = displayName;
  document.getElementById("hero-title").textContent = L(p, "title");

  const interestsEl = document.getElementById("hero-interests");
  if (interestsEl) interestsEl.textContent = L(p, "researchInterests");

  const affEl = document.getElementById("hero-affiliations");
  affEl.innerHTML = "";
  const affs = lang === "zh" ? (p.affiliationsZh || p.affiliations || []) : (p.affiliations || []);
  affs.forEach(a => affEl.append(el("li", {}, a)));

  const emailEl = document.getElementById("hero-email");
  emailEl.href = `mailto:${p.email}`;
  emailEl.textContent = p.email;
}

// ── Render: timeline (education / experience) ───────────────────────────────

function renderTimeline(containerId, items, type) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = "";
  items.forEach(item => {
    const primary = type === "edu" ? L(item, "institution") : L(item, "org");
    const secondary = type === "edu" ? L(item, "degree") : L(item, "role");
    const period = L(item, "period");

    wrap.append(
      el("div", { class: "tl-item" },
        el("time", { class: "tl-period" }, period),
        el("div", { class: "tl-body" },
          el("p", { class: "tl-primary" }, primary),
          el("p", { class: "tl-secondary" }, secondary)
        )
      )
    );
  });
}

// ── Render: memberships ─────────────────────────────────────────────────────

function renderMemberships(items) {
  const list = document.getElementById("memberships-list");
  list.innerHTML = "";
  items.forEach(m => list.append(el("li", {}, Lpair(m))));
}

// ── Render: projects ────────────────────────────────────────────────────────

function renderProjects(projects) {
  renderProjectGroup("projects-pi", projects.pi || []);
  renderProjectGroup("projects-co", projects.coInvestigator || []);
}

function renderProjectGroup(containerId, items) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = "";
  items.forEach(proj => {
    const isOngoing = (proj.status || "").toLowerCase() === "ongoing";
    const statusClass = isOngoing ? "badge-ongoing" : "badge-completed";
    const statusText = isOngoing ? t("statusOngoing") : t("statusCompleted");

    wrap.append(
      el("div", { class: "proj-card" },
        el("p", { class: "proj-title" }, L(proj, "title")),
        el("div", { class: "proj-meta" },
          el("span", { class: "proj-funder" }, L(proj, "funder")),
        ),
        el("div", { class: "proj-meta" },
          el("span", {}, proj.id),
          el("span", { class: "sep" }, "·"),
          el("span", {}, proj.period),
          el("span", { class: `badge ${statusClass}` }, statusText)
        )
      )
    );
  });
}

// ── Render: publications ────────────────────────────────────────────────────

function renderPublications(pubs) {
  const list = document.getElementById("pub-english");
  list.innerHTML = "";
  const items = pubs.english || [];

  items.forEach((pub, i) => {
    const item = el("li", { class: `pub-item${i >= PUB_FOLD ? " hidden" : ""}` },
      el("span", { class: "pub-num" }),
      buildPubBody(pub, /*useZh=*/false)
    );
    list.append(item);
  });

  const btn = document.getElementById("pub-toggle");
  if (items.length > PUB_FOLD) {
    btn.hidden = false;
    btn.textContent = t("showMore").replace("{n}", items.length);
    btn.onclick = () => {
      list.querySelectorAll(".pub-item.hidden").forEach(li => li.classList.remove("hidden"));
      btn.hidden = true;
    };
  } else {
    btn.hidden = true;
  }

  const cnList = document.getElementById("pub-chinese");
  cnList.innerHTML = "";
  (pubs.chinese || []).forEach(pub => {
    cnList.append(
      el("li", { class: "pub-item" },
        el("span", { class: "pub-num" }),
        buildPubBody(pub, /*useZh=*/true)
      )
    );
  });
}

function buildPubBody(pub, useZhWhenAvailable) {
  const body = el("div", { class: "pub-body" });
  // For Chinese papers in Chinese mode, prefer citationZh.
  // For English papers, always show citation (English).
  let citation = pub.citation;
  if (useZhWhenAvailable && state.lang === "zh" && pub.citationZh) {
    citation = pub.citationZh;
  }
  body.append(el("p", { class: "pub-citation", html: citation }));

  const links = [];
  if (pub.pubmed) {
    links.push(el("a", {
      class: "pub-link pub-link-pubmed",
      href: pub.pubmed,
      target: "_blank",
      rel: "noopener noreferrer"
    }, "PubMed ↗"));
  }
  if (pub.doi) {
    links.push(el("a", {
      class: "pub-link pub-link-doi",
      href: `https://doi.org/${pub.doi}`,
      target: "_blank",
      rel: "noopener noreferrer"
    }, `DOI ↗`));
  }

  if (links.length) {
    const linkRow = el("div", { class: "pub-links" });
    links.forEach(l => linkRow.append(l));
    body.append(linkRow);
  }

  return body;
}

// ── Render: patents ─────────────────────────────────────────────────────────

function renderPatents(patents) {
  const wrap = document.getElementById("patents-list");
  wrap.innerHTML = "";
  patents.forEach(p => {
    wrap.append(
      el("div", { class: "patent-card" },
        el("div", {},
          el("p", { class: "patent-title" }, L(p, "title")),
          el("p", { class: "patent-meta" }, `${t("patentNo")} ${p.number}`)
        ),
        el("span", { class: "patent-role" }, L(p, "role"))
      )
    );
  });
}

// ── Apply UI labels (data-i18n / data-nav) ──────────────────────────────────

function applyStaticI18n() {
  // Sections / sub-headings / sidebar labels marked with data-i18n
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  });
  // Nav links
  document.querySelectorAll("[data-nav]").forEach(node => {
    const key = node.getAttribute("data-nav");
    node.textContent = t(key);
  });
  // Language toggle button itself
  const toggle = document.getElementById("lang-toggle");
  const toggleText = document.getElementById("lang-toggle-text");
  if (toggleText) toggleText.textContent = t("langSwitchTo");
  if (toggle) {
    toggle.setAttribute("aria-label", t("langSwitchAria"));
    toggle.setAttribute("title", t("langSwitchAria"));
  }
  // Document <html lang="…"> so CSS font-family rule can take effect
  document.documentElement.setAttribute("lang", state.lang);
  // Mobile menu button label
  const menuBtn = document.getElementById("menu-btn");
  if (menuBtn) menuBtn.setAttribute("aria-label", t("menuLabel"));
}

// ── Main render ─────────────────────────────────────────────────────────────

function renderAll() {
  if (!state.data) return;
  applyStaticI18n();
  renderProfile(state.data.profile);
  renderTimeline("education-list", state.data.education, "edu");
  renderTimeline("experience-list", state.data.experience, "exp");
  renderMemberships(state.data.memberships);
  renderProjects(state.data.projects);
  renderPublications(state.data.publications);
  renderPatents(state.data.patents);
}

// ── Navigation: active link on scroll, mobile menu ──────────────────────────

function initNav() {
  const topbar = document.getElementById("topbar");
  const navLinks = topbar.querySelectorAll(".topbar-nav a");
  const sections = [...navLinks]
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle("active",
          a.getAttribute("href") === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: "-30% 0px -60% 0px" });

  sections.forEach(s => observer.observe(s));

  window.addEventListener("scroll", () => {
    topbar.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  // Mobile menu
  const menuBtn = document.getElementById("menu-btn");
  const mobileNav = document.getElementById("mobile-nav");
  menuBtn.addEventListener("click", () => {
    const open = mobileNav.hidden === false;
    mobileNav.hidden = open;
    menuBtn.setAttribute("aria-expanded", String(!open));
  });
  mobileNav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      mobileNav.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      mobileNav.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
}

function initLangToggle() {
  const btn = document.getElementById("lang-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    state.lang = state.lang === "zh" ? "en" : "zh";
    try { localStorage.setItem("cv-lang", state.lang); } catch (e) { /* ignore */ }
    renderAll();
  });
}

// ── Boot ────────────────────────────────────────────────────────────────────

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  // Load saved language preference, default English
  try {
    const saved = localStorage.getItem("cv-lang");
    if (saved === "zh" || saved === "en") state.lang = saved;
  } catch (e) { /* localStorage may be blocked in file:// on some browsers */ }

  try {
    // Inline data first (works via file://), then fallback to fetch.
    let data = window.CV_DATA;
    if (!data) {
      const res = await fetch("content.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    }
    state.data = data;

    renderAll();
    initNav();
    initLangToggle();
  } catch (err) {
    console.error(err);
    document.getElementById("main").innerHTML =
      `<p style="color:#b91c1c;padding:3rem 0">
        Failed to load CV data. Please reload the page.
      </p>`;
  }
}

init();
