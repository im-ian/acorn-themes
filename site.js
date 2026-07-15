const listElement = document.querySelector("#theme-list");
const searchElement = document.querySelector("#theme-search");
const emptyElement = document.querySelector("#empty-state");
const nameElement = document.querySelector("#active-name");
const indexElement = document.querySelector("#active-index");
const modeElement = document.querySelector("#active-mode");
const versionElement = document.querySelector("#active-version");
const countElement = document.querySelector("#theme-count");
const fileElement = document.querySelector("#terminal-file");
const cssLink = document.querySelector("#css-link");
const copyNameButton = document.querySelector("#copy-theme-name");
const shareButton = document.querySelector("#share-theme");
const paletteElement = document.querySelector("#palette-strip");
const toastElement = document.querySelector("#toast");
const inspectorNameElement = document.querySelector("#inspector-active-name");
const filterButtons = [...document.querySelectorAll("[data-mode]")];

let themes = [];
let filteredThemes = [];
let activeTheme = null;
let activeMode = "all";
let toastTimer = null;

const paletteTokens = [
  "--color-bg",
  "--color-bg-elevated",
  "--color-accent",
  "--color-fg",
  "--color-warning",
  "--color-danger",
];

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => toastElement.classList.remove("is-visible"),
    1800,
  );
}

function optionMarkup(theme, index) {
  const active = activeTheme?.id === theme.id;
  return `
    <button
      class="theme-option${active ? " is-active" : ""}"
      type="button"
      role="option"
      aria-selected="${active}"
      data-theme-id="${theme.id}"
    >
      <span class="theme-option-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="theme-option-name">${theme.label}</span>
      <span class="theme-option-mode">${theme.mode}</span>
    </button>`;
}

function renderList() {
  const query = searchElement.value.trim().toLowerCase();
  filteredThemes = themes.filter(
    (theme) =>
      (activeMode === "all" || theme.mode === activeMode) &&
      `${theme.label} ${theme.id}`.toLowerCase().includes(query),
  );
  listElement.innerHTML = filteredThemes
    .map((theme) => optionMarkup(theme, themes.indexOf(theme)))
    .join("");
  emptyElement.hidden = filteredThemes.length > 0;
}

function updatePalette() {
  const styles = getComputedStyle(document.querySelector("#theme-preview-root"));
  paletteElement.innerHTML = paletteTokens
    .map((token) => {
      const color = styles.getPropertyValue(token).trim() || "transparent";
      return `<i style="--swatch:${color}" title="${token}: ${color}"></i>`;
    })
    .join("");
}

async function activateTheme(theme, updateHistory = true) {
  if (!theme) return;
  try {
    const response = await fetch(`./${theme.file}`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const css = await response.text();
    let style = document.querySelector("#preview-theme");
    if (!style) {
      style = document.createElement("style");
      style.id = "preview-theme";
      document.head.append(style);
    }
    style.textContent = css.replaceAll(
      `:root[data-acorn-theme="${theme.id}"]`,
      "#theme-preview-root",
    );
    document.querySelector("#theme-preview-root").dataset.acornTheme = theme.id;
    activeTheme = theme;

    const index = themes.findIndex((item) => item.id === theme.id);
    nameElement.textContent = theme.label;
    inspectorNameElement.textContent = theme.label;
    indexElement.textContent = `${String(index + 1).padStart(2, "0")} / ${String(themes.length).padStart(2, "0")}`;
    modeElement.textContent = `${theme.mode.toUpperCase()} INTERFACE`;
    versionElement.textContent = `CATALOG VERSION ${theme.version}`;
    fileElement.textContent = `${theme.id}.css`;
    cssLink.href = `./${theme.file}`;
    cssLink.download = `${theme.id}.css`;
    document.title = `${theme.label} — Acorn Theme Archive`;
    document.querySelector("#theme-preview-root").style.colorScheme = theme.mode;

    if (updateHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set("theme", theme.id);
      history.replaceState(null, "", url);
    }

    renderList();
    requestAnimationFrame(updatePalette);
  } catch (error) {
    showToast(`Could not load ${theme.label}: ${error.message}`);
  }
}

listElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme-id]");
  if (!button) return;
  void activateTheme(themes.find((theme) => theme.id === button.dataset.themeId));
});

searchElement.addEventListener("input", renderList);

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    activeMode = button.dataset.mode;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderList();
  });
}

shareButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Theme link copied");
  } catch {
    showToast("Copy the URL from your browser");
  }
});

copyNameButton.addEventListener("click", async () => {
  if (!activeTheme) return;
  try {
    await navigator.clipboard.writeText(activeTheme.label);
    showToast(`Copied ${activeTheme.label}`);
  } catch {
    showToast(`Theme name: ${activeTheme.label}`);
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchElement) {
    event.preventDefault();
    searchElement.focus();
    return;
  }
  if (
    document.activeElement === searchElement ||
    !["ArrowUp", "ArrowDown"].includes(event.key) ||
    filteredThemes.length === 0
  ) {
    return;
  }
  event.preventDefault();
  const current = filteredThemes.findIndex((theme) => theme.id === activeTheme?.id);
  const delta = event.key === "ArrowDown" ? 1 : -1;
  const next = (Math.max(current, 0) + delta + filteredThemes.length) % filteredThemes.length;
  void activateTheme(filteredThemes[next]);
});

async function initialize() {
  try {
    const response = await fetch("./manifest.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    themes = manifest.themes;
    countElement.textContent = `${themes.length} PALETTES`;
    document.querySelector("#manifest-theme-count").textContent = String(
      themes.length,
    );
    const requestedId = new URLSearchParams(window.location.search).get("theme");
    const initial = themes.find((theme) => theme.id === requestedId) ?? themes[0];
    renderList();
    await activateTheme(initial, false);
  } catch (error) {
    nameElement.textContent = "Archive unavailable";
    showToast(`Could not load manifest: ${error.message}`);
  }
}

void initialize();
