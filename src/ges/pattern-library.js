import { installGesThemeToggle } from "../ges-theme.js?v=befd9ce";
import { initGlobalHeader } from "./global-header.js?v=befd9ce";

initGlobalHeader();
installGesThemeToggle(document);

document.querySelectorAll("[data-ges-density]").forEach((button) => {
  button.addEventListener("click", () => {
    const density = button.dataset.gesDensity;
    document.querySelectorAll("[data-density-target]").forEach((target) => {
      target.dataset.density = density;
    });
    document.querySelectorAll("[data-ges-density]").forEach((item) => {
      item.toggleAttribute("data-active", item === button);
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    });
  });
});

document.querySelector("[data-print-pattern-library]")?.addEventListener("click", () => {
  window.print();
});
