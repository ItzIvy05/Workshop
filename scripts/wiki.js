(function () {
  "use strict";

  const BASE = "resources/wiki/";
  let MANIFEST = null;
  let FLAT = [];
  let INDEX = null;

  function esc(s) {
    return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  function src(p) {
    return /^(https?:)?\/\//.test(p) ? p : BASE + p;
  }

  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (m, a, p) => '<img src="' + src(p) + '" alt="' + a + '" loading="lazy" decoding="async">');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)\{\.btn\}/g,
      '<a class="btn btn-primary" href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, h) =>
      '<a href="' + h + '"' + (/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : "") + ">" + t + "</a>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return s;
  }

  function slugify(s) {
    return s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  }

  function render(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim()) { i++; continue; }

      if (line.trim().startsWith("```")) {
        const buf = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++; }
        i++;
        out.push('<pre class="wk-code"><code>' + esc(buf.join("\n")) + "</code></pre>");
        continue;
      }

      const vid = line.match(/^<video id="([^"]+)"(?:\s+title="([^"]*)")?\s*><\/video>$/);
      if (vid) {
        out.push('<div class="wk-video"><iframe src="https://www.youtube-nocookie.com/embed/' + vid[1] +
          '" title="' + (vid[2] || "Video") + '" loading="lazy" allowfullscreen></iframe></div>');
        i++;
        continue;
      }

      if (line.trim().startsWith("|") && (lines[i + 1] || "").trim().startsWith("|") &&
          /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        const head = cells(lines[i]);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(cells(lines[i])); i++; }
        out.push('<div class="wk-tablewrap"><table class="wk-table"><thead><tr>' +
          head.map((h) => "<th>" + inline(h) + "</th>").join("") + "</tr></thead><tbody>" +
          rows.map((r) => "<tr>" + r.map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") +
          "</tbody></table></div>");
        continue;
      }

      if (/^---+$/.test(line.trim())) { out.push("<hr>"); i++; continue; }

      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        const lvl = h[1].length;
        const txt = h[2].trim();
        const tag = lvl === 1 ? "h1" : "h" + lvl;
        const id = lvl > 1 ? ' id="' + slugify(txt) + '"' : "";
        out.push("<" + tag + id + ">" + inline(txt) + "</" + tag + ">");
        i++;
        continue;
      }

      if (line.trimStart().startsWith(">")) {
        const buf = [];
        let warn = false;
        while (i < lines.length && lines[i].trimStart().startsWith(">")) {
          let t = lines[i].trimStart().replace(/^>\s?/, "");
          if (/^\[!WARNING\]/i.test(t)) { warn = true; t = t.replace(/^\[!WARNING\]\s*/i, ""); }
          buf.push(t);
          i++;
        }
        out.push('<div class="wk-callout' + (warn ? " warn" : "") + '">' +
          buf.filter(Boolean).map((t) => "<p>" + inline(t) + "</p>").join("") + "</div>");
        continue;
      }

      if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        const ordered = /^\s*\d+\.\s+/.test(line);
        const items = [];
        const re = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/;
        while (i < lines.length && re.test(lines[i])) {
          items.push(lines[i].match(re)[1]);
          i++;
        }
        const tag = ordered ? "ol" : "ul";
        out.push("<" + tag + ' class="wk-list">' + items.map((t) => "<li>" + inline(t) + "</li>").join("") + "</" + tag + ">");
        continue;
      }

      const buf = [];
      while (i < lines.length && lines[i].trim() &&
             !/^(#{1,4})\s/.test(lines[i]) && !lines[i].trimStart().startsWith(">") &&
             !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) &&
             !lines[i].trim().startsWith("|") && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i].trim());
        i++;
      }
      if (buf.length) out.push("<p>" + inline(buf.join(" ")) + "</p>");
    }

    return out.join("\n");
  }

  function flatten(man) {
    const flat = [];
    man.parts.forEach((part) => {
      let n = 0;
      part.chapters.forEach((ch) => {
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
      body.innerHTML = render(await res.text());
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
