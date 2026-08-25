(function () {
  "use strict";

  const SEP = "_separator";

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    return (bytes / 1024).toFixed(2) + " KiB";
  }

  function parseModlist(text) {
    const out = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/\s+$/, "");
      if (!line || line[0] === "#") continue;
      let marker = "";
      let body = line;
      if (line[0] === "+" || line[0] === "-" || line[0] === "*") {
        marker = line[0];
        body = line.slice(1);
      }
      if (body.endsWith(SEP)) {
        out.push({ type: "sep", name: body.slice(0, -SEP.length).trim() });
      } else {
        const enabled = marker === "+" || marker === "*";
        const name = marker === "+" || marker === "-" ? body : line;
        out.push({ type: "mod", name, enabled });
      }
    }
    out.reverse();
    return out;
  }

  function parsePlugins(text) {
    const out = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line[0] === "#") continue;
      const enabled = line[0] === "*";
      out.push({ type: "plugin", name: enabled ? line.slice(1) : line, enabled });
    }
    return out;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function svgChevron() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  }

  function buildCard(file) {
    const items = file.items;
    const isModlist = file.type === "modlist";
    const total = items.filter((i) => i.type !== "sep").length;
    const enabledCount = items.filter((i) => i.type !== "sep" && i.enabled).length;

    const card = el("div", "lo-card collapsed");

    const head = el("div", "lo-head");
    head.innerHTML =
      '<div class="lo-file"><span class="lo-doc">📄</span>' +
      '<div><span class="lo-name">' + escapeHtml(file.label) + "</span>" +
      '<div class="lo-meta">' + fmtSize(file.size) + " &bull; " + enabledCount + "/" + total +
      (isModlist ? " mods enabled" : " plugins enabled") + "</div></div></div>" +
      '<div class="lo-actions"><button class="lo-btn lo-collapse" title="Collapse">' + svgChevron() + "</button></div>";
    card.appendChild(head);

    const body = el("div", "lo-body");

    const toolbar = el("div", "lo-toolbar");
    toolbar.innerHTML = '<div class="lo-search"><span>🔍</span><input type="text" placeholder="Search content..."></div>';
    if (isModlist) {
      toolbar.appendChild(el("button", "lo-collapse-all", "Collapse categories"));
    }
    body.appendChild(toolbar);

    const list = el("div", "lo-list");
    const groups = [];
    const flatRows = [];
    let index = 0;
    let current = null;

    function newGroup(name) {
      const g = el("div", "lo-group");
      const header = el("button", "lo-group-head", "<span>" + escapeHtml(name) + '</span><span class="lo-group-count"></span>');
      const rowsWrap = el("div", "lo-group-rows");
      g.appendChild(header);
      g.appendChild(rowsWrap);
      const obj = { el: g, header, rowsWrap, rows: [], collapsed: false, count: 0 };
      header.addEventListener("click", () => {
        obj.collapsed = !obj.collapsed;
        applyFilters();
      });
      groups.push(obj);
      list.appendChild(g);
      return obj;
    }

    for (const it of items) {
      if (it.type === "sep") {
        current = newGroup(it.name || "Uncategorized");
        continue;
      }
      index++;
      const row = el("div", "lo-row " + (it.enabled ? "on" : "off"));
      row.innerHTML =
        '<span class="lo-idx">' + index + "</span>" +
        '<span class="lo-modname">' + escapeHtml(it.name) + "</span>" +
        (it.enabled ? "" : '<span class="lo-tag">disabled</span>');
      const rec = { el: row, name: it.name.toLowerCase() };
      if (isModlist) {
        if (!current) current = newGroup("Uncategorized");
        current.rowsWrap.appendChild(row);
        current.rows.push(rec);
        current.count++;
        current.header.querySelector(".lo-group-count").textContent = "(" + current.count + " items)";
      } else {
        list.appendChild(row);
        flatRows.push(rec);
      }
    }
    body.appendChild(list);
    card.appendChild(body);

    const searchInput = toolbar.querySelector("input");

    function applyFilters() {
      const tokens = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const searching = tokens.length > 0;
      const test = (name) => tokens.every((t) => name.includes(t));
      if (isModlist) {
        for (const g of groups) {
          let any = false;
          for (const r of g.rows) {
            const m = !searching || test(r.name);
            if (m) any = true;
            r.el.style.display = m ? "" : "none";
          }
          g.el.style.display = any ? "" : "none";
          g.el.classList.toggle("collapsed", searching ? false : g.collapsed);
        }
      } else {
        for (const r of flatRows) {
          r.el.style.display = !searching || test(r.name) ? "" : "none";
        }
      }
    }

    searchInput.addEventListener("input", applyFilters);
    head.addEventListener("click", () => card.classList.toggle("collapsed"));

    const collapseAll = toolbar.querySelector(".lo-collapse-all");
    if (collapseAll) {
      collapseAll.addEventListener("click", () => {
        const anyOpen = groups.some((g) => !g.collapsed);
        groups.forEach((g) => (g.collapsed = anyOpen));
        collapseAll.textContent = anyOpen ? "Expand categories" : "Collapse categories";
        applyFilters();
      });
    }

    applyFilters();
    return card;
  }

  async function loadFile(spec) {
    const bust = spec.url + (spec.url.includes("?") ? "&" : "?") + "_=" + Date.now();
    const res = await fetch(bust, { cache: "no-store" });
    if (!res.ok) throw new Error(spec.url + " → " + res.status);
    const text = await res.text();
    const size = new Blob([text]).size;
    const items = spec.type === "plugins" ? parsePlugins(text) : parseModlist(text);
    return { ...spec, size, items };
  }

  async function initLoadOrder(config) {
    const mount = typeof config.mount === "string" ? document.querySelector(config.mount) : config.mount;
    if (!mount) return;
    mount.innerHTML = '<div class="lo-loading">Loading load order…</div>';
    try {
      const files = await Promise.all(config.files.map(loadFile));
      mount.innerHTML = "";
      files.forEach((f) => mount.appendChild(buildCard(f)));
    } catch (e) {
      mount.innerHTML = '<div class="lo-error">Could not load the list files.<br><small>' + escapeHtml(String(e.message || e)) + "</small></div>";
    }
  }

  window.initLoadOrder = initLoadOrder;
})();
