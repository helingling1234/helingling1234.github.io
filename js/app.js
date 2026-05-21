/**
 * CV site — all content loaded from content.json
 * To add / edit items: modify content.json and reload the page.
 */

const PUB_FOLD = 8; // number of English publications visible before "Show more"

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

// ── Render: profile ─────────────────────────────────────────────────────────

function renderProfile(p) {
  document.title = `${p.name} · CV`;
  document.getElementById("topbar-name").textContent = p.name;
  document.getElementById("footer-name").textContent = p.name;

  // Show initials as fallback only if the avatar image is missing or fails.
  const avatar = document.getElementById("avatar");
  const avatarImg = document.getElementById("avatar-img");
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

  const heroZh = document.getElementById("hero-zh");
  if (heroZh && p.nameZh) heroZh.textContent = p.nameZh;
  document.getElementById("hero-name").textContent = p.name;
  document.getElementById("hero-title").textContent = p.title;

  if (p.researchInterests) {
    document.getElementById("hero-interests").textContent = p.researchInterests;
  }

  const affEl = document.getElementById("hero-affiliations");
  affEl.innerHTML = "";
  (p.affiliations || []).forEach(a => {
    affEl.append(el("li", {}, a));
  });

  const emailEl = document.getElementById("hero-email");
  emailEl.href = `mailto:${p.email}`;
  emailEl.textContent = p.email;
}

// ── Render: timeline (education / experience) ───────────────────────────────

function renderTimeline(containerId, items, type) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = "";
  items.forEach(item => {
    const primary = type === "edu" ? item.institution : item.org;
    const secondary = type === "edu" ? item.degree : item.role;

    wrap.append(
      el("div", { class: "tl-item" },
        el("div", {},
          el("p", { class: "tl-primary" }, primary),
          el("p", { class: "tl-secondary" }, secondary)
        ),
        el("time", { class: "tl-period" }, item.period)
      )
    );
  });
}

// ── Render: memberships ──────────────────────────────────────────────────────

function renderMemberships(items) {
  const list = document.getElementById("memberships-list");
  list.innerHTML = "";
  items.forEach(m => list.append(el("li", {}, m)));
}

// ── Render: projects ─────────────────────────────────────────────────────────

function renderProjects(projects) {
  renderProjectGroup("projects-pi", projects.pi || []);
  renderProjectGroup("projects-co", projects.coInvestigator || []);
}

function renderProjectGroup(containerId, items) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = "";
  items.forEach(proj => {
    const statusClass = proj.status?.toLowerCase() === "ongoing"
      ? "badge-ongoing" : "badge-completed";

    wrap.append(
      el("div", { class: "proj-card" },
        el("p", { class: "proj-title" }, proj.title),
        el("div", { class: "proj-meta" },
          el("span", { class: "proj-funder" }, proj.funder),
        ),
        el("div", { class: "proj-meta" },
          el("span", {}, proj.id),
          el("span", { class: "sep" }, "·"),
          el("span", {}, proj.period),
          el("span", { class: `badge ${statusClass}` }, proj.status)
        )
      )
    );
  });
}

// ── Render: publications ─────────────────────────────────────────────────────

function renderPublications(pubs) {
  const list = document.getElementById("pub-english");
  list.innerHTML = "";
  const items = pubs.english || [];

  items.forEach((pub, i) => {
    const item = el("li", { class: `pub-item${i >= PUB_FOLD ? " hidden" : ""}` },
      el("span", { class: "pub-num" }),
      buildPubBody(pub)
    );
    list.append(item);
  });

  const btn = document.getElementById("pub-toggle");
  if (items.length > PUB_FOLD) {
    btn.hidden = false;
    btn.textContent = `Show all ${items.length} publications`;
    btn.onclick = () => {
      list.querySelectorAll(".pub-item.hidden").forEach(li => li.classList.remove("hidden"));
      btn.hidden = true;
    };
  }

  const cnList = document.getElementById("pub-chinese");
  cnList.innerHTML = "";
  (pubs.chinese || []).forEach(pub => {
    cnList.append(
      el("li", { class: "pub-item" },
        el("span", { class: "pub-num" }),
        buildPubBody(pub)
      )
    );
  });
}

function buildPubBody(pub) {
  const body = el("div", { class: "pub-body" });
  body.append(el("p", { class: "pub-citation", html: pub.citation }));

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

// ── Render: patents ──────────────────────────────────────────────────────────

function renderPatents(patents) {
  const wrap = document.getElementById("patents-list");
  wrap.innerHTML = "";
  patents.forEach(p => {
    wrap.append(
      el("div", { class: "patent-card" },
        el("div", {},
          el("p", { class: "patent-title" }, p.title),
          el("p", { class: "patent-meta" }, `Patent No. ${p.number}`)
        ),
        el("span", { class: "patent-role" }, p.role)
      )
    );
  });
}

// ── Navigation: active link on scroll, mobile menu ─────────────────────────

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

  // Auto-close mobile menu if window resized to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      mobileNav.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// ── Boot ─────────────────────────────────────────────────────────────────────

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  try {
    // Data is loaded synchronously from js/data.js (window.CV_DATA)
    // so the page works when opened directly via file:// (no server needed).
    // If you prefer editing content.json instead, run a local server:
    //   python3 -m http.server 8080
    // and uncomment the fetch block below.
    let data = window.CV_DATA;

    if (!data) {
      const res = await fetch("content.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    }

    renderProfile(data.profile);
    renderTimeline("education-list", data.education, "edu");
    renderTimeline("experience-list", data.experience, "exp");
    renderMemberships(data.memberships);
    renderProjects(data.projects);
    renderPublications(data.publications);
    renderPatents(data.patents);
    initNav();
  } catch (err) {
    console.error(err);
    document.getElementById("main").innerHTML =
      `<p style="color:#b91c1c;padding:3rem 0">
        Failed to load CV data. Please reload the page.
      </p>`;
  }
}

init();
