(function () {
  "use strict";

  function initNavState() {
    const nav = document.querySelector(".site-nav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initNavToggle() {
    const btn = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav nav");
    if (!btn || !nav) return;

    if (!nav.id) nav.id = "site-menu";
    btn.setAttribute("aria-controls", nav.id);

    const close = () => {
      if (!nav.classList.contains("open")) return;
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
    };

    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".site-nav")) close();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    }, { passive: true });
  }

  function initReveal() {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((n) => n.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    nodes.forEach((n) => io.observe(n));
  }

  function initDocSpy() {
    const links = [...document.querySelectorAll(".doc-nav a[href^='#']")];
    if (!links.length) return;

    const map = new Map();
    links.forEach((a) => {
      const el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) map.set(el, a);
    });
    if (!map.size) return;

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        const a = map.get(e.target);
        if (a) a.classList.add("active");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });

    map.forEach((_a, el) => spy.observe(el));
  }

  function boot() {
    initNavState();
    initNavToggle();
    initReveal();
    initDocSpy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
