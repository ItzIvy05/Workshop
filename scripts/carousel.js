(function () {
  "use strict";

  const EXTS = ["jpg", "png", "webp", "jpeg"];
  const MAX = 300;
  const MISS_LIMIT = 8;

  function head(url) {
    return fetch(url, { method: "HEAD", cache: "no-store" }).then((r) => r.ok).catch(() => false);
  }

  async function discover(src) {
    const base = src.endsWith("/") ? src : src + "/";
    const found = [];
    let miss = 0;
    for (let i = 0; i <= MAX; i++) {
      let hit = null;
      for (const ext of EXTS) {
        if (await head(base + i + "." + ext)) { hit = base + i + "." + ext; break; }
      }
      if (hit) { found.push(hit); miss = 0; }
      else { miss++; if (found.length > 0 && miss > MISS_LIMIT) break; if (found.length === 0 && i >= MISS_LIMIT) break; }
    }
    return found;
  }

  function bindLightbox(img) {
    img.addEventListener("click", (e) => {
      const lb = document.getElementById("lightbox");
      const lbi = document.getElementById("lightbox-img");
      if (!lb || !lbi) return;
      e.preventDefault();
      lbi.src = img.currentSrc || img.src;
      lb.classList.add("active");
    });
  }

  function setup(root, urls) {
    const track = root.querySelector(".carousel-track");
    if (urls) {
      track.innerHTML = "";
      urls.forEach((u) => {
        const slide = document.createElement("div");
        slide.className = "carousel-slide";
        const img = document.createElement("img");
        img.src = u;
        img.alt = "";
        img.loading = "lazy";
        bindLightbox(img);
        slide.appendChild(img);
        track.appendChild(slide);
      });
    }

    const slides = Array.from(track.children);
    if (slides.length === 0) { root.style.display = "none"; return; }

    const dotsWrap = root.querySelector(".carousel-dots");
    if (dotsWrap) dotsWrap.innerHTML = "";
    const interval = Math.max(parseInt(root.dataset.interval || "5000", 10), 5000);
    let index = 0;
    let timer = null;

    const dots = slides.map((_, i) => {
      if (!dotsWrap) return null;
      const d = document.createElement("button");
      d.className = "carousel-dot" + (i === 0 ? " active" : "");
      d.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(d);
      return d;
    });

    function render() {
      track.style.transform = "translateX(" + -index * 100 + "%)";
      dots.forEach((d, i) => { if (d) d.classList.toggle("active", i === index); });
    }
    function go(i, manual) {
      index = (i + slides.length) % slides.length;
      render();
      if (manual) restart();
    }
    function next() { go(index + 1); }
    function start() { if (!timer) timer = setInterval(next, interval); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    const nextBtn = root.querySelector(".carousel-next");
    const prevBtn = root.querySelector(".carousel-prev");
    if (nextBtn) nextBtn.addEventListener("click", () => go(index + 1, true));
    if (prevBtn) prevBtn.addEventListener("click", () => go(index - 1, true));

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);

    render();
    start();
  }

  window.addEventListener("DOMContentLoaded", async () => {
    const carousels = document.querySelectorAll(".carousel");
    for (const c of carousels) {
      if (c.dataset.src) {
        setup(c, await discover(c.dataset.src));
      } else {
        setup(c, null);
      }
    }
  });
})();
