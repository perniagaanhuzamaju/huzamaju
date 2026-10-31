/**
 * Minimal, safe Markdown renderer for blog posts written by staff:
 * escapes all HTML first, then supports headings, bold, italic, links, lists and paragraphs.
 */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function inline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

export function renderMarkdown(md: string): string {
  const lines = esc(md).split(/\r?\n/);
  const out: string[] = [];
  let list: string[] | null = null;
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
    if (list) out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`);
    list = null;
  };
  for (const line of lines) {
    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (h) {
      flush();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
    } else if (li) {
      if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; }
      (list ??= []).push(li[1]);
    } else if (!line.trim()) {
      flush();
    } else {
      if (list) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`); list = null; }
      para.push(line.trim());
    }
  }
  flush();
  return out.join("\n");
}
