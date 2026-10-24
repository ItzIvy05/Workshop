(function () {
  "use strict";

  const BASE = "resources/wiki/";
  let MANIFEST = null;
  let FLAT = [];
  let INDEX = null;

  function esc(s) {
    return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  function byOrder(a, b) {
    return (!!a.last - !!b.last) || a.title.localeCompare(b.title);
  }

  function flatten(man) {
    const flat = [];
    [...man.parts].sort(byOrder).forEach((part) => {
      let n = 0;
      [...part.chapters].sort(byOrder).forEach((ch) => {
        n += 1;
        flat.push({ part: part.title, num: String(n), depth: 0, ch });
        (ch.children || []).forEach((sub, si) => {
          flat.push({ part: part.title, num: n + "." + (si + 1), depth: 1, ch: sub });
        });
      });
    });
    return flat;
  }

  function buildSidebar(man, flat) {
    const nav = document.getElementById("wk-nav");
    let html = "";
    let seen = null;
    flat.forEach((f) => {
      if (f.part !== seen) {
        html += '<p class="wk-part">' + esc(f.part) + "</p>";
        seen = f.part;
      }
      html += '<a class="wk-link depth-' + f.depth + '" href="#' + f.ch.id + '" data-id="' + f.ch.id + '">' +
        '<span class="wk-num">' + f.num + ".</span> " + esc(f.ch.title) + "</a>";
    });
    nav.innerHTML = html;
  }

  function setActive(id) {
    document.querySelectorAll("#wk-nav .wk-link").forEach((a) => {
      a.classList.toggle("active", a.dataset.id === id);
    });
  }

  function chapterFor(id) {
    return FLAT.find((f) => f.ch.id === id) || FLAT[0];
  }

  async function show(id) {
    const entry = chapterFor(id);
    const body = document.getElementById("wk-body");
    const idx = FLAT.indexOf(entry);

    body.innerHTML = '<p class="wk-loading">Loading…</p>';
    try {
      const res = await fetch(BASE + entry.ch.file, { cache: "no-cache" });
      if (!res.ok) throw new Error(entry.ch.file + " " + res.status);
      body.innerHTML = window.renderMarkdown(await res.text(), BASE);
    } catch (e) {
      body.innerHTML = '<div class="wk-callout warn"><p>Could not load this page.</p><p>' + esc(String(e.message || e)) + "</p></div>";
    }

    setActive(entry.ch.id);
    document.title = entry.ch.title + " - Lumina Wiki";
    document.getElementById("wk-crumb").textContent = entry.part;

    const prev = FLAT[idx - 1];
    const next = FLAT[idx + 1];
    const mk = (f, dir) => f
      ? '<a class="wk-pn ' + dir + '" href="#' + f.ch.id + '"><span>' + (dir === "prev" ? "Previous" : "Next") +
        "</span><strong>" + esc(f.ch.title) + "</strong></a>"
      : "<span></span>";
    const pn = document.getElementById("wk-prevnext");
    pn.innerHTML = mk(prev, "prev") + mk(next, "next");
    pn.hidden = !prev && !next;

    document.querySelector(".wk-main").scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function route() {
    const id = location.hash.replace(/^#/, "");
    const entry = FLAT.find((f) => f.ch.id === id);
    if (entry) { show(id); return; }
    const anchor = document.getElementById(id);
    if (id && anchor) { anchor.scrollIntoView(); return; }
    show(FLAT[0].ch.id);
  }

  async function buildIndex() {
    if (INDEX) return INDEX;
    INDEX = await Promise.all(FLAT.map(async (f) => {
      let text = "";
      try {
        const res = await fetch(BASE + f.ch.file, { cache: "force-cache" });
        if (res.ok) text = await res.text();
      } catch (e) { text = ""; }
      const plain = plainify(text);
      return {
        id: f.ch.id,
        title: f.ch.title,
        part: f.part,
        plain: plain,
        hay: (f.ch.title + " " + f.part + " " + plain).toLowerCase()
      };
    }));
    return INDEX;
  }

  function plainify(raw) {
    return raw
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)(\{[^}]*\})?/g, "$1")
      .replace(/^\s*#{1,4}\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/\[!WARNING\]/gi, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/[*`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function snippet(plain, term) {
    const at = plain.toLowerCase().indexOf(term);
    if (at < 0) return plain.slice(0, 120) + "…";
    const from = Math.max(0, at - 45);
    return (from ? "…" : "") + plain.slice(from, from + 130).trim() + "…";
  }

  async function search(q) {
    const box = document.getElementById("wk-results");
    const term = q.trim().toLowerCase();

    if (term.length < 2) { box.hidden = true; box.innerHTML = ""; return; }

    const idx = await buildIndex();
    const hits = idx.filter((e) => e.hay.includes(term)).slice(0, 8);

    box.hidden = false;
    if (!hits.length) {
      box.innerHTML = '<p class="wk-noresult">No matches for “' + esc(q.trim()) + "”</p>";
      return;
    }
    box.innerHTML = hits.map((e) =>
      '<a href="#' + e.id + '"><strong>' + esc(e.title) + '</strong><span class="wk-rpart">' +
      esc(e.part) + "</span><span>" + esc(snippet(e.plain, term)) + "</span></a>"
    ).join("");
  }

  function initSearch() {
    const input = document.getElementById("wk-search");
    const box = document.getElementById("wk-results");
    if (!input) return;

    let t = null;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => search(input.value), 140);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { input.value = ""; box.hidden = true; input.blur(); }
    });

    box.addEventListener("click", (e) => {
      if (e.target.closest("a")) { box.hidden = true; input.value = ""; }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".wk-search")) box.hidden = true;
    });
  }

  function initSidebarToggle() {
    const btn = document.getElementById("wk-toggle");
    const shell = document.querySelector(".wk-shell");
    if (!btn || !shell) return;
    btn.addEventListener("click", () => {
      const open = shell.classList.toggle("nav-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.getElementById("wk-nav").addEventListener("click", (e) => {
      if (e.target.closest("a")) shell.classList.remove("nav-open");
    });
  }

  async function init() {
    try {
      const res = await fetch(BASE + "manifest.json", { cache: "no-cache" });
      MANIFEST = await res.json();
    } catch (e) {
      document.getElementById("wk-body").innerHTML =
        '<div class="wk-callout warn"><p>Could not load the wiki manifest.</p></div>';
      return;
    }
    FLAT = flatten(MANIFEST);
    buildSidebar(MANIFEST, FLAT);
    initSearch();
    initSidebarToggle();
    window.addEventListener("hashchange", route);
    route();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
