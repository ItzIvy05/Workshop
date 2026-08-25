(function () {
  "use strict";

  const CATS = [
    { key: "added", label: "Added", test: (w) => w.startsWith("add") },
    { key: "updated", label: "Updated", test: (w) => w.startsWith("updat") },
    { key: "removed", label: "Removed", test: (w) => w.startsWith("remov") },
    { key: "fixed", label: "Fixed", test: (w) => w.startsWith("fix") || w.startsWith("bug") }
  ];
  const ORDER = ["added", "updated", "removed", "fixed", "other"];
  const LABELS = { other: "Changed" };

  function categorize(line) {
    const first = (line.split(/\s+/)[0] || "").toLowerCase();
    for (const c of CATS) {
      if (c.test(first)) {
        const rest = line.slice(line.indexOf(" ") + 1).trim();
        return { key: c.key, label: c.label, text: rest || line };
      }
    }
    return { key: "other", label: "Changed", text: line };
  }

  function parse(text) {
    const versions = [];
    let cur = null;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("//")) continue;
      if (line[0] === "#") {
        const body = line.replace(/^#+\s*/, "");
        const parts = body.split(/\s*\|\s*|\s+-\s+/);
        cur = { version: (parts[0] || "").trim(), date: (parts[1] || "").trim(), cats: {} };
        versions.push(cur);
        continue;
      }
      if (!cur) { cur = { version: "Unreleased", date: "", cats: {} }; versions.push(cur); }
      const c = categorize(line);
      (cur.cats[c.key] = cur.cats[c.key] || { label: c.label, list: [] }).list.push(c.text);
    }
    return versions;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function slug(v) {
    return "v" + v.replace(/[^a-zA-Z0-9.]/g, "-");
  }

  function render(mount, versions) {
    mount.innerHTML = "";
    if (versions.length === 0) {
      mount.appendChild(el("div", "cl-empty", "No changelog entries yet."));
      return;
    }

    const toc = el("div", "cl-toc");
    versions.forEach((v) => {
      const a = el("a", "cl-toc-item", esc(v.version) + (v.date ? '<span class="cl-toc-date">' + esc(v.date) + "</span>" : ""));
      a.href = "#" + slug(v.version);
      toc.appendChild(a);
    });
    mount.appendChild(toc);

    versions.forEach((v) => {
      const sec = el("section", "cl-version");
      sec.id = slug(v.version);
      const head = el("div", "cl-vhead");
      head.innerHTML = '<h2 class="cl-vnum">' + esc(v.version) + "</h2>" + (v.date ? '<span class="cl-vdate">' + esc(v.date) + "</span>" : "");
      sec.appendChild(head);

      ORDER.forEach((key) => {
        const group = v.cats[key];
        if (!group) return;
        const label = group.label || LABELS[key] || key;
        const block = el("div", "cl-cat cl-" + key);
        block.appendChild(el("span", "cl-badge cl-badge-" + key, esc(label) + " <span class=\"cl-count\">" + group.list.length + "</span>"));
        const ul = el("ul", "cl-list");
        group.list.forEach((item) => ul.appendChild(el("li", null, esc(item))));
        block.appendChild(ul);
        sec.appendChild(block);
      });

      mount.appendChild(sec);
    });
  }

  async function initChangelog(config) {
    const mount = typeof config.mount === "string" ? document.querySelector(config.mount) : config.mount;
    if (!mount) return;
    mount.innerHTML = '<div class="cl-loading">Loading changelog…</div>';
    try {
      const bust = config.url + (config.url.includes("?") ? "&" : "?") + "_=" + Date.now();
      const res = await fetch(bust, { cache: "no-store" });
      if (!res.ok) throw new Error(config.url + " → " + res.status);
      render(mount, parse(await res.text()));
    } catch (e) {
      mount.innerHTML = '<div class="cl-error">Could not load the changelog.<br><small>' + esc(String(e.message || e)) + "</small></div>";
    }
  }

  window.initChangelog = initChangelog;
})();
