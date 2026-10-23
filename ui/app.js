// RiskPulse workshop console -- vanilla JS, no build step, no dependencies.
// Reads env-status.json (written by scripts/env_check.py) and data/roadmap.json.

const NEEDED_FROM = {
  python3: "Needed immediately -- runs this console.",
  git: "Needed immediately -- to pull each feature.",
  node: "Needed from Feature 8 (React frontend build).",
  npm: "Needed from Feature 8 (React frontend build).",
  docker: "Needed from Feature 8+ (Postgres/Redis services).",
  docker_compose: "Needed from Feature 8+ (Postgres/Redis services).",
  internet: "Needed for package installs and Feature 4 (OpenRouter).",
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

async function loadEnv() {
  const container = document.getElementById("env-chips");
  try {
    const res = await fetch("env-status.json", { cache: "no-store" });
    if (!res.ok) throw new Error("no env-status.json yet");
    const data = await res.json();
    renderEnv(container, data);
  } catch (err) {
    container.innerHTML =
      '<span class="chip chip-warn"><span class="dot"></span> env-status.json not found yet -- run ./run.sh once to generate it</span>';
  }
}

function renderEnv(container, data) {
  container.innerHTML = "";
  const checks = data.checks || {};
  Object.keys(LABELS).forEach((key) => {
    const info = checks[key];
    const chip = document.createElement("span");
    const available = info && info.available;
    chip.className = "chip " + (available ? "chip-ok" : "chip-missing");
    const dot = '<span class="dot"></span>';
    const label = LABELS[key];
    const meta = available
      ? (info.version || "").toString().slice(0, 40)
      : NEEDED_FROM[key] || "not detected";
    chip.title = NEEDED_FROM[key] || "";
    chip.innerHTML = `${dot} ${label} <span class="chip-meta">${escapeHtml(meta)}</span>`;
    container.appendChild(chip);
  });
}

async function loadRoadmap() {
  const root = document.getElementById("roadmap-root");
  try {
    const res = await fetch("data/roadmap.json", { cache: "no-store" });
    const data = await res.json();
    renderRoadmap(root, data);
    document.title = `${data.app} · Workshop Console`;
  } catch (err) {
    root.innerHTML = '<p style="color:var(--text-muted)">Could not load roadmap.json</p>';
  }
}

function renderRoadmap(root, data) {
  root.innerHTML = "";
  (data.categories || []).forEach((category) => {
    const section = document.createElement("div");
    section.className = "roadmap-category";

    const heading = document.createElement("h3");
    heading.textContent = category.label;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "roadmap-grid";

    category.features.forEach((feature) => {
      grid.appendChild(renderFeatureCard(feature));
    });

    section.appendChild(grid);
    root.appendChild(section);
  });
}

function renderFeatureCard(feature) {
  const card = document.createElement("div");
  card.className = `feature-card status-${feature.status}`;

  const modePillClass = feature.mode === "live" ? "pill-live" : "pill-takehome";
  const modeLabel = feature.mode === "live" ? "live" : "take-home";
  const statusLabel = (feature.status || "upcoming").replace("-", " ");

  card.innerHTML = `
    <div class="fc-top">
      <span class="fc-id">#${feature.id}</span>
      <span class="pill pill-status-${feature.status}">${escapeHtml(statusLabel)}</span>
    </div>
    <h4>${escapeHtml(feature.title)}</h4>
    <div class="fc-capability">${escapeHtml(feature.capability)}</div>
    <div class="fc-foot">
      <span class="pill ${modePillClass}">${modeLabel}</span>
      <span class="fc-prompts">${feature.prompts} prompt${feature.prompts === 1 ? "" : "s"}</span>
    </div>
  `;
  return card;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

loadEnv();
loadRoadmap();
