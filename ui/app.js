// RiskPulse workshop console -- vanilla JS, no build step, no dependencies.
// Reads env-status.json (written by scripts/env_check.py) and data/roadmap.json.

const NEEDED_FROM = {
  python3: "Runs this console",
  git: "Pulling each feature",
  node: "Feature 8 (React frontend)",
  npm: "Feature 8 (React frontend)",
  docker: "Feature 8+ (Postgres/Redis)",
  docker_compose: "Feature 8+ (Postgres/Redis)",
  internet: "Installs + Feature 4 (OpenRouter)",
};

const LABELS = {
  python3: "Python 3",
  node: "Node.js",
  npm: "npm",
  docker: "Docker",
  docker_compose: "Docker Compose",
  git: "Git",
  internet: "Internet",
};

const ICONS = {
  check: '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M3 8.5l3 3 7-7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cross: '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  warn: '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M8 2l7 12H1z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><line x1="8" y1="6.5" x2="8" y2="9.5" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="11.6" r="0.8" fill="currentColor"/></svg>',
};

const STAT_ICONS = {
  features: '<svg viewBox="0 0 16 16" width="17" height="17"><rect x="1" y="1" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.9"/><rect x="9" y="1" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.5"/><rect x="1" y="9" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.5"/><rect x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.9"/></svg>',
  env: '<svg viewBox="0 0 16 16" width="17" height="17"><path d="M8 1.5l5.5 2.3v3.6c0 3.5-2.3 6.4-5.5 7.1-3.2-.7-5.5-3.6-5.5-7.1V3.8L8 1.5z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  category: '<svg viewBox="0 0 16 16" width="17" height="17"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="1.4"/><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.4"/><line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" stroke-width="1.4"/></svg>',
  live: '<svg viewBox="0 0 16 16" width="17" height="17"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg>',
};

let roadmapData = null;
let activeCategory = "all";

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- Environment ----------

async function loadEnv() {
  const tbody = document.getElementById("env-tbody");
  try {
    const res = await fetch("env-status.json", { cache: "no-store" });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    renderEnv(tbody, data);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">env-status.json not found yet -- run ./run.sh once to generate it.</td></tr>';
    document.getElementById("sidebar-env-summary").textContent = "run ./run.sh to check";
  }
}

function renderEnv(tbody, data) {
  const checks = data.checks || {};
  const keys = Object.keys(LABELS);
  let passing = 0;

  tbody.innerHTML = keys.map((key) => {
    const info = checks[key] || { available: false };
    if (info.available) passing += 1;
    const statusClass = info.available ? "ok" : "missing";
    const icon = info.available ? ICONS.check : ICONS.cross;
    const statusText = info.available ? "Detected" : "Not found";
    const detail = info.available ? (info.version || "").toString().slice(0, 48) : "&mdash;";
    return `
      <tr>
        <td class="cell-title">${escapeHtml(LABELS[key])}</td>
        <td><span class="status-flag ${statusClass}">${icon} ${statusText}</span></td>
        <td class="muted">${escapeHtml(detail)}</td>
        <td class="muted">${escapeHtml(NEEDED_FROM[key] || "")}</td>
      </tr>`;
  }).join("");

  document.getElementById("sidebar-env-summary").innerHTML =
    `<strong>${passing}/${keys.length}</strong> checks passing`;

  renderStats(passing, keys.length);
}

// ---------- Roadmap ----------

async function loadRoadmap() {
  try {
    const res = await fetch("data/roadmap.json", { cache: "no-store" });
    const data = await res.json();
    roadmapData = data;
    document.title = `${data.app} · Workshop Console`;
    renderFilters(data);
    renderRoadmapTable();
    renderStats();
  } catch (err) {
    document.getElementById("roadmap-tbody").innerHTML =
      '<tr><td colspan="6" class="muted">Could not load roadmap.json</td></tr>';
  }
}

function renderFilters(data) {
  const row = document.getElementById("filter-row");
  const pills = [{ id: "all", label: "All" }, ...data.categories.map((c) => ({ id: c.id, label: c.label }))];
  row.innerHTML = pills.map((p) =>
    `<button class="filter-pill ${p.id === activeCategory ? "is-active" : ""}" data-filter="${p.id}">${escapeHtml(p.label)}</button>`
  ).join("");

  row.querySelectorAll(".filter-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.filter;
      row.querySelectorAll(".filter-pill").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderRoadmapTable();
    });
  });
}

function renderRoadmapTable() {
  if (!roadmapData) return;
  const tbody = document.getElementById("roadmap-tbody");
  const rows = [];

  roadmapData.categories.forEach((category) => {
    if (activeCategory !== "all" && activeCategory !== category.id) return;
    category.features.forEach((feature) => {
      const modeClass = feature.mode === "live" ? "pill-live" : "pill-takehome";
      const modeLabel = feature.mode === "live" ? "live" : "take-home";
      const statusLabel = (feature.status || "upcoming").replace("-", " ");
      rows.push(`
        <tr>
          <td class="muted">#${feature.id}</td>
          <td>
            <div class="cell-title">${escapeHtml(feature.title)}</div>
            <div class="cell-sub">${feature.prompts} prompt${feature.prompts === 1 ? "" : "s"}</div>
          </td>
          <td class="muted">${escapeHtml(feature.capability)}</td>
          <td><span class="pill pill-category">${escapeHtml(category.label)}</span></td>
          <td><span class="pill ${modeClass}">${modeLabel}</span></td>
          <td><span class="pill pill-status-${feature.status}">${escapeHtml(statusLabel)}</span></td>
        </tr>`);
    });
  });

  tbody.innerHTML = rows.join("") || '<tr><td colspan="6" class="muted">No features in this category.</td></tr>';
}

// ---------- Stat cards ----------

function renderStats(envPassing, envTotal) {
  const root = document.getElementById("overview");
  if (!roadmapData) return;

  let total = 0, live = 0, done = 0;
  roadmapData.categories.forEach((c) => c.features.forEach((f) => {
    total += 1;
    if (f.mode === "live") live += 1;
    if (f.status === "done") done += 1;
  }));

  const envLabel = envTotal ? `${envPassing}/${envTotal}` : "--";

  const cards = [
    { icon: STAT_ICONS.features, value: `${done}/${total}`, label: "Features built" },
    { icon: STAT_ICONS.live, value: `${live}`, label: "Live-session features" },
    { icon: STAT_ICONS.category, value: `${roadmapData.categories.length}`, label: "Capability categories" },
    { icon: STAT_ICONS.env, value: envLabel, label: "Environment checks passing" },
  ];

  root.innerHTML = cards.map((c) => `
    <div class="stat-card">
      <div class="stat-icon">${c.icon}</div>
      <div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>
    </div>`).join("");
}

// ---------- Nav + misc ----------

function wireNav() {
  document.querySelectorAll(".nav-item[data-target]").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-item[data-target]").forEach((l) => l.classList.remove("is-active"));
      link.classList.add("is-active");
    });
  });
}

function setDate() {
  const el = document.getElementById("topbar-date");
  const now = new Date();
  el.textContent = now.toLocaleString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

wireNav();
setDate();
loadRoadmap().then(loadEnv);
