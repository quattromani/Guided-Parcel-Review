const GES_THEME_STORAGE_KEY = "ges-theme-preference";
const GES_THEME_OPTIONS = ["light", "dark"];
const GES_SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
let mediaListenerInstalled = false;

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeTheme(value) {
  return GES_THEME_OPTIONS.includes(value) ? value : systemTheme();
}

function storedTheme() {
  const value = safeStorage()?.getItem(GES_THEME_STORAGE_KEY);

  return GES_THEME_OPTIONS.includes(value) ? value : null;
}

function systemTheme() {
  return window.matchMedia?.(GES_SYSTEM_THEME_QUERY).matches ? "dark" : "light";
}

function selectedTheme() {
  return storedTheme() ?? "system";
}

function resolvedTheme(theme = selectedTheme()) {
  if (theme === "system") return systemTheme();
  return normalizeTheme(theme);
}

function setPressedState(theme, resolved) {
  document.querySelectorAll("[data-ges-theme-option]").forEach((button) => {
    const isActive = button.dataset.gesThemeOption === (theme === "system" ? resolved : theme);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.toggleAttribute("data-active", isActive);
  });
}

export function applyGesTheme(theme = selectedTheme()) {
  const selected = theme === "system" ? "system" : normalizeTheme(theme);
  const resolved = resolvedTheme(selected);

  document.documentElement.dataset.gesTheme = selected;
  document.documentElement.dataset.gesThemeResolved = resolved;
  setPressedState(selected, resolved);
}

export function setGesTheme(theme) {
  if (!GES_THEME_OPTIONS.includes(theme)) return;
  const selected = normalizeTheme(theme);
  const storage = safeStorage();

  storage?.setItem(GES_THEME_STORAGE_KEY, selected);

  applyGesTheme(selected);
}

function renderThemeIcon(option) {
  if (option === "light") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
    `;
  }

  if (option === "dark") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.5 14.2A7.2 7.2 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"></path>
        <path d="M18 3v3"></path>
        <path d="M19.5 4.5h-3"></path>
        <path d="M22 8v2"></path>
        <path d="M23 9h-2"></path>
      </svg>
    `;
  }

  return "";
}

export function renderGesThemeToggle() {
  const labels = {
    light: "Use light theme",
    dark: "Use dark theme"
  };

  return `
    <div class="ges-page-utility" aria-label="Page display options">
      <div class="ges-theme-toggle" role="group" aria-label="Color theme">
        ${GES_THEME_OPTIONS.map(option => `
          <button type="button" class="ges-theme-toggle__button" data-ges-theme-option="${option}" aria-pressed="false" aria-label="${labels[option]}" title="${labels[option]}">
            ${renderThemeIcon(option)}
            <span class="levy-sr-only">${labels[option]}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

export function installGesThemeToggle(root = document) {
  applyGesTheme();

  root.querySelectorAll("[data-ges-theme-option]").forEach((button) => {
    button.addEventListener("click", () => setGesTheme(button.dataset.gesThemeOption));
  });

  if (mediaListenerInstalled || !window.matchMedia) return;

  const systemThemeMedia = window.matchMedia(GES_SYSTEM_THEME_QUERY);
  const handleDefaultThemeChange = () => {
    if (!storedTheme()) {
      applyGesTheme("system");
    }
  };

  if (systemThemeMedia.addEventListener) {
    systemThemeMedia.addEventListener("change", handleDefaultThemeChange);
  } else if (systemThemeMedia.addListener) {
    systemThemeMedia.addListener(handleDefaultThemeChange);
  }

  mediaListenerInstalled = true;
}
