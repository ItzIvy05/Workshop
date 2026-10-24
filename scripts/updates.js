(function () {
  "use strict";

  const BASE = "resources/lumina/updates/";
  const KEYS = ["version", "date", "cover", "banner", "summary", "tag"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const ARROW = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  let POSTS = [];
  let current = -1;
  let pushed = false;
  let returnFocus = null;
  let modal = null;
  let pageTitle = "";

  function esc(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function slug(v) {
    return "v" + v.replace(/[^a-zA-Z0-9.]/g, "-");
  }

  function niceDate(s) {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m || +m[2] < 1 || +m[2] > 12) return s;
    return MONTHS[+m[2] - 1] + " " + +m[3] + ", " + m[1];
  }

  // header is the lines before the first blank one: "# title" then "key: value"
  function parse(id, text) {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const post = { id, title: id, version: "", date: "", cover: "", banner: "", summary: "", tag: "Update", body: "" };
    let i = 0;
    while (i < lines.length && lines[i].trim()) {
      const line = lines[i].trim();
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (line[0] === "#") {
        post.title = line.replace(/^#+\s*/, "");
      } else if (kv && KEYS.includes(kv[1].toLowerCase())) {
        post[kv[1].toLowerCase()] = kv[2].trim();
      }
      i++;
    }
    post.body = lines.slice(i).join("\n");
    return post;
  }

  function coverOf(p) {
    if (!p.cover) return "resources/lumina/cover.jpg";
    return BASE + p.cover;
  }

  function bannerOf(p) {
    if (!p.banner) return coverOf(p);
    return BASE + p.banner;
  }

  function metaOf(p) {
    let html = '<span class="up-tag">' + esc(p.tag) + "</span>";
    if (p.date) html += '<span class="up-date">' + esc(niceDate(p.date)) + "</span>";
    return html;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function tile(p, featured) {
    const a = el("a", featured ? "up-tile up-featured" : "up-tile");
    const h = featured ? "h2" : "h3";
    a.href = "#" + encodeURIComponent(p.id);
    let info = '<span class="up-meta">' + metaOf(p) + "</span><" + h + ' class="up-title">' + esc(p.title) + "</" + h + ">";
    if (p.summary) info += '<p class="up-sum">' + esc(p.summary) + "</p>";
    if (featured) info += '<span class="up-read">Read update' + ARROW + "</span>";
    a.innerHTML = '<span class="up-thumb"><img src="' + esc(coverOf(p)) + '" alt="" decoding="async"' + (featured ? "" : ' loading="lazy"') + '></span><span class="up-info">' + info + "</span>";
    return a;
  }

  function renderGrid(mount) {
    mount.innerHTML = "";
    if (!POSTS.length) {
      mount.appendChild(el("div", "cl-empty", "No updates yet."));
      return;
    }
    mount.appendChild(el("p", "section-eyebrow", "Latest"));
    mount.appendChild(tile(POSTS[0], true));
    if (POSTS.length < 2) return;
    const grid = el("div", "up-grid");
    POSTS.slice(1).forEach((p) => grid.appendChild(tile(p, false)));
    mount.appendChild(el("p", "section-eyebrow up-older", "Earlier updates"));
    mount.appendChild(grid);
  }

  function fill(p) {
    const foot = modal.querySelector(".up-foot");
    modal.querySelector(".up-cover img").src = bannerOf(p);
    modal.querySelector(".up-head .up-meta").innerHTML = metaOf(p);
    modal.querySelector("#up-title").textContent = p.title;
    modal.querySelector(".up-body").innerHTML = window.renderMarkdown(p.body, BASE);
    foot.hidden = !p.version;
    if (p.version) foot.innerHTML = '<a class="btn btn-primary" href="changelog.html#' + slug(p.version) + '">Full ' + esc(p.version) + " changelog" + ARROW + "</a>";
  }

  function open(i) {
    if (current < 0) {
      returnFocus = document.activeElement;
      document.documentElement.classList.add("up-lock");
      modal.classList.add("open");
    }
    current = i;
    fill(POSTS[i]);
    modal.scrollTop = 0;
    modal.querySelector(".up-prev").disabled = i === 0;
    modal.querySelector(".up-next").disabled = i === POSTS.length - 1;
    modal.querySelector(".up-panel").focus({ preventScroll: true });
    document.title = POSTS[i].title + " - Lumina Updates";
  }

  function close() {
    if (current < 0) return;
    current = -1;
    modal.classList.remove("open");
    document.documentElement.classList.remove("up-lock");
    document.title = pageTitle;
    // drop the body after the fade so embedded videos stop
    setTimeout(clearBody, 300);
    if (returnFocus) returnFocus.focus({ preventScroll: true });
  }

  function clearBody() {
    if (current < 0) modal.querySelector(".up-body").innerHTML = "";
  }

  function dismiss() {
    if (pushed) {
      history.back();
      return;
    }
    history.replaceState(null, "", location.pathname + location.search);
    close();
  }

  function go(i) {
    if (i < 0 || i >= POSTS.length) return;
    location.replace("#" + encodeURIComponent(POSTS[i].id));
  }

  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const i = POSTS.findIndex((p) => p.id === id);
    if (i >= 0) {
      open(i);
      return;
    }
    pushed = false;
    close();
  }

  function onKey(e) {
    if (current < 0) return;
    if (document.getElementById("lightbox").classList.contains("active")) return;
    if (e.key === "Escape") dismiss();
    if (e.key === "ArrowLeft") go(current - 1);
    if (e.key === "ArrowRight") go(current + 1);
  }

  function wire(mount) {
    mount.addEventListener("click", (e) => {
      if (e.target.closest(".up-tile")) pushed = true;
    });
    modal.querySelector(".up-close").addEventListener("click", dismiss);
    modal.querySelector(".up-prev").addEventListener("click", () => go(current - 1));
    modal.querySelector(".up-next").addEventListener("click", () => go(current + 1));
    modal.addEventListener("click", (e) => {
      if (!e.target.closest(".up-panel, .up-rail")) dismiss();
    });
    // capture runs before the image lightbox closes itself on escape
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("hashchange", route);
  }

  async function load(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(url + " → " + res.status);
    return res.text();
  }

  async function init() {
    const mount = document.getElementById("updates");
    modal = document.getElementById("up-modal");
    pageTitle = document.title;
    mount.innerHTML = '<div class="cl-loading">Loading updates…</div>';
    try {
      const files = JSON.parse(await load(BASE + "manifest.json"));
      const texts = await Promise.all(files.map((f) => load(BASE + f)));
      POSTS = files.map((f, i) => parse(f.replace(/\.md$/i, ""), texts[i]));
    } catch (e) {
      mount.innerHTML = '<div class="cl-error">Could not load the updates.<br><small>' + esc(String(e.message || e)) + "</small></div>";
      return;
    }
    renderGrid(mount);
    wire(mount);
    route();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
