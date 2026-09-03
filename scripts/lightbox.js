document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  if (!lightbox || !lightboxImg) return;

  const prevBtn = lightbox.querySelector(".lb-prev");
  const nextBtn = lightbox.querySelector(".lb-next");

  let list = null;
  let index = 0;

  function show(i) {
    index = (i + list.length) % list.length;
    lightboxImg.src = list[index];
  }

  function openGallery(urls, start) {
    if (!urls || !urls.length) return;
    list = urls;
    lightbox.classList.add("active", "has-nav");
    show(start || 0);
  }

  function openSingle(src) {
    list = null;
    lightbox.classList.remove("has-nav");
    lightboxImg.src = src;
    lightbox.classList.add("active");
  }

  function close() {
    lightbox.classList.remove("active", "has-nav");
    lightboxImg.src = "";
    list = null;
  }

  window.openGallery = openGallery;

  document.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img) return;
    if (img.id === "lightbox-img") return;
    if (img.closest(".carousel")) return;
    if (img.closest("[data-no-lightbox]")) return;
    e.preventDefault();
    openSingle(img.currentSrc || img.src);
  });

  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); if (list) show(index - 1); });
  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); if (list) show(index + 1); });

  lightbox.addEventListener("click", (e) => {
    if (e.target.closest(".lb-nav")) return;
    close();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") close();
    if (!list) return;
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
});
