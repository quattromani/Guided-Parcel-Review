import { copy, copyTemplate } from "./content/site-copy.js?v=db3aed6";

export function initImageModal(assets = {}) {
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const modalCaption = document.getElementById("modalCaption");
  const modalFilmstrip = document.getElementById("modalFilmstrip");
  const closeButton = document.getElementById("closeImageModal");
  const previousButton = document.getElementById("previousImage");
  const nextButton = document.getElementById("nextImage");
  const galleryItems = [
    { src: assets.photo, caption: copy("modals.image.propertyPhoto", "Property Photo") },
    { src: assets.sketch, caption: copy("modals.image.propertySketch", "Property Sketch") },
    ...(assets.additionalPhotos || [])
  ].filter(item => item.src);
  let currentIndex = 0;

  function setCurrentImage(index) {
    if (!galleryItems.length) return;

    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];

    modalImage.src = item.src;
    modalImage.alt = item.caption;
    modalImage.classList.remove("is-hidden");
    modalCaption.textContent = item.caption;
    renderFilmstrip();
  }

  function renderFilmstrip() {
    modalFilmstrip.innerHTML = galleryItems.map((item, index) => `
      <button
        type="button"
        data-gallery-index="${index}"
        class="height-16 width-24 flex-shrink-0 clip-overflow radius-md ring-size-2 transition-base ${index === currentIndex ? "ring-color-control" : "ring-color-inverse-subtle hover-ring-color-inverse"}"
        aria-label="${copyTemplate("modals.image.showTemplate", { caption: item.caption }, `Show ${item.caption}`)}"
      >
        <img src="${item.src}" alt="${item.caption}" class="height-full width-full media-cover" />
      </button>
    `).join("");

    modalFilmstrip.querySelectorAll("[data-gallery-index]").forEach(button => {
      button.addEventListener("click", () => setCurrentImage(Number(button.dataset.galleryIndex)));
    });
  }

  function close() {
    modal.classList.add("is-hidden");
    modal.classList.remove("display-flex");
    modalImage.src = "";
    modalImage.alt = "";
    modalCaption.textContent = "";
    document.body.classList.remove("clip-overflow");
  }

  function open(src, caption) {
    if (!galleryItems.length) return;

    const itemIndex = galleryItems.findIndex(item => item.src === src || item.caption === caption);
    setCurrentImage(itemIndex >= 0 ? itemIndex : 0);
    modal.classList.remove("is-hidden");
    modal.classList.add("display-flex");
    document.body.classList.add("clip-overflow");
  }

  function showPrevious() {
    setCurrentImage(currentIndex - 1);
  }

  function showNext() {
    setCurrentImage(currentIndex + 1);
  }

  modal.addEventListener("click", close);
  closeButton.addEventListener("click", close);
  previousButton.addEventListener("click", showPrevious);
  nextButton.addEventListener("click", showNext);
  modal.querySelector("div").addEventListener("click", event => event.stopPropagation());

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
    if (modal.classList.contains("is-hidden")) return;
    if (event.key === "ArrowLeft") showPrevious();
    if (event.key === "ArrowRight") showNext();
  });

  return { open, close };
}
