(function () {
  "use strict";

  let BASE = "";

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

  window.renderMarkdown = function (md, base) {
    BASE = base;
    return render(md);
  };
})();
