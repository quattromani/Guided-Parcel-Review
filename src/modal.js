export function initImageModal(assets = {}) {
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");
  const modalPlaceholder = document.getElementById("modalPlaceholder");
  const modalCaption = document.getElementById("modalCaption");
  const modalFilmstrip = document.getElementById("modalFilmstrip");
  const closeButton = document.getElementById("closeImageModal");
  const previousButton = document.getElementById("previousImage");
  const nextButton = document.getElementById("nextImage");
  const galleryItems = [
    { type: "image", src: assets.photo, caption: "Property Photo" },
    { type: "image", src: assets.sketch, caption: "Property Sketch" },
    { type: "placeholder", caption: "Additional Property Photo 1" },
    { type: "placeholder", caption: "Additional Property Photo 2" },
    { type: "placeholder", caption: "Additional Property Photo 3" }
  ].filter(item => item.type === "placeholder" || item.src);
  let currentIndex = 0;

  function setCurrentImage(index) {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];

    if (item.type === "image") {
      modalImage.src = item.src;
      modalImage.alt = item.caption;
      modalImage.classList.remove("hidden");
      modalPlaceholder.classList.add("hidden");
    } else {
      modalImage.src = "";
      modalImage.alt = "";
      modalImage.classList.add("hidden");
      modalPlaceholder.classList.remove("hidden");
    }

    modalCaption.textContent = item.caption;
    renderFilmstrip();
  }

  function renderFilmstrip() {
    modalFilmstrip.innerHTML = galleryItems.map((item, index) => `
      <button
        type="button"
        data-gallery-index="${index}"
        class="h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition ${index === currentIndex ? "ring-blue-400" : "ring-white/25 hover:ring-white/70"}"
        aria-label="Show ${item.caption}"
      >
        ${item.type === "image"
          ? `<img src="${item.src}" alt="${item.caption}" class="h-full w-full object-cover" />`
          : `<span class="flex h-full w-full items-center justify-center bg-slate-300 text-xl font-bold text-slate-500">FPO</span>`}
      </button>
    `).join("");

    modalFilmstrip.querySelectorAll("[data-gallery-index]").forEach(button => {
      button.addEventListener("click", () => setCurrentImage(Number(button.dataset.galleryIndex)));
    });
  }

  function close() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modalImage.src = "";
    modalImage.alt = "";
    modalCaption.textContent = "";
    document.body.classList.remove("overflow-hidden");
  }

  function open(src, caption) {
    const itemIndex = galleryItems.findIndex(item => item.src === src || item.caption === caption);
    setCurrentImage(itemIndex >= 0 ? itemIndex : 0);
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
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
    if (modal.classList.contains("hidden")) return;
    if (event.key === "ArrowLeft") showPrevious();
    if (event.key === "ArrowRight") showNext();
  });

  return { open, close };
}
