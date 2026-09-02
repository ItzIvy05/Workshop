(function () {
  "use strict";

  const EXTS = ["jpg", "jpeg", "png", "webp"];
  const MAX = 120;
  const PROBE_DEPTH = 10;

  function head(url) {
    return fetch(url, { method: "HEAD" }).then((r) => r.ok).catch(() => false);
  }

  function cacheGet(key) {
    try {
      const raw = sessionStorage.getItem("gal:" + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function cacheSet(key, list) {
    try { sessionStorage.setItem("gal:" + key, JSON.stringify(list)); } catch (e) {}
  }

  async function usedExtensions(base) {
    const tries = [];
    for (let i = 0; i <= PROBE_DEPTH; i++) {
      for (const ext of EXTS) tries.push({ ext: ext, url: base + i + "." + ext });
    }
    const hits = await Promise.all(tries.map((t) => head(t.url).then((ok) => (ok ? t.ext : null))));
    return [...new Set(hits.filter(Boolean))];
  }

  async function scan(base) {
    const exts = await usedExtensions(base);
    if (!exts.length) return [];

    const tries = [];
    for (let i = 0; i <= MAX; i++) {
      for (const ext of exts) tries.push({ i: i, url: base + i + "." + ext });
    }
    const hits = await Promise.all(tries.map((t) => head(t.url).then((ok) => (ok ? t : null))));
    return hits.filter(Boolean).sort((a, b) => a.i - b.i).map((t) => t.url);
  }

  async function discover(src) {
    const base = src.endsWith("/") ? src : src + "/";
    const cached = cacheGet(base);
    if (cached) return cached;
    const list = await scan(base);
    if (list.length) cacheSet(base, list);
    return list;
  }

  function setup(root, urls) {
    const track = root.querySelector(".carousel-track");
    if (urls) {
      track.innerHTML = "";
      urls.forEach((u, i) => {
        const slide = document.createElement("div");
        slide.className = "carousel-slide";
        const img = document.createElement("img");
        img.dataset.src = u;
        img.alt = "";
        img.decoding = "async";
        img.dataset.index = String(i);
        slide.appendChild(img);
        track.appendChild(slide);
      });
    }

    const slides = Array.from(track.children);
    if (slides.length === 0) { root.style.display = "none"; return; }

    const imgs = slides.map((s) => s.querySelector("img"));
    const list = imgs.map((im) => (im && (im.dataset.src || im.src)) || "");

    const dotsWrap = root.querySelector(".carousel-dots");
    if (dotsWrap) dotsWrap.innerHTML = "";
    const interval = Math.max(parseInt(root.dataset.interval || "5000", 10), 5000);
    let index = 0;
    let timer = null;

    function hydrate(i) {
      for (const k of [i - 1, i, i + 1]) {
        const im = imgs[(k + imgs.length) % imgs.length];
        if (im && !im.src && im.dataset.src) im.src = im.dataset.src;
      }
    }

    const dots = slides.map((_, i) => {
      if (!dotsWrap) return null;
      const d = document.createElement("button");
      d.className = "carousel-dot" + (i === 0 ? " active" : "");
      d.type = "button";
      d.setAttribute("aria-label", "Go to slide " + (i + 1));
      d.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(d);
      return d;
    });

    function render() {
      track.style.transform = "translateX(" + -index * 100 + "%)";
      dots.forEach((d, i) => { if (d) d.classList.toggle("active", i === index); });
      hydrate(index);
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

    imgs.forEach((im, i) => {
      if (!im) return;
      im.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.openGallery) window.openGallery(list, i);
      });
    });

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
      setup(c, c.dataset.src ? await discover(c.dataset.src) : null);
    }
  });
})();
