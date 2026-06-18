// Render Markdown (what the model writes) into Telegram's HTML message format.
//
// Telegram's `sendMessage` with `parse_mode: "HTML"` supports a small tag set:
// <b> <i> <u> <s> <a> <code> <pre> <blockquote>. The default Telegram channel
// sends plain text with no parse mode, so Markdown shows up literally — this
// converter gives Telegram replies real formatting (bold, italics, links, code).

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

/** Escape the three characters Telegram's HTML parser treats specially. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

// Control-character sentinels bracket each code placeholder so it can never
// collide with real digits in the text, and they survive HTML escaping untouched.
const PH_OPEN = String.fromCharCode(0);
const PH_CLOSE = String.fromCharCode(1);

/**
 * Convert a Markdown string to Telegram-flavoured HTML. Fenced and inline code
 * are extracted first so their contents are never reinterpreted, then the
 * remaining text is HTML-escaped and the inline Markdown constructs are mapped to
 * Telegram tags. Anything not recognized falls through as escaped plain text.
 */
export function markdownToTelegramHtml(markdown: string): string {
  const codeBlocks: string[] = [];
  let text = markdown;
  const stash = (html: string): string => {
    codeBlocks.push(html);
    return `${PH_OPEN}${codeBlocks.length - 1}${PH_CLOSE}`;
  };

  // Fenced code blocks: ```lang\n...\n``` → <pre>…</pre>
  text = text.replace(/```[^\n]*\n([\s\S]*?)```/g, (_match, body: string) =>
    stash(`<pre>${escapeHtml(body.replace(/\n$/, ""))}</pre>`),
  );

  // Inline code: `...` → <code>…</code>
  text = text.replace(/`([^`\n]+)`/g, (_match, body: string) =>
    stash(`<code>${escapeHtml(body)}</code>`),
  );

  text = escapeHtml(text);

  // Links: [label](url)
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label: string, url: string) => {
    return `<a href="${url}">${label}</a>`;
  });

  // Headings (#, ##, …) → bold line.
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>");

  // Bold: **x** or __x__
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
  text = text.replace(/__([^_\n]+)__/g, "<b>$1</b>");

  // Italic: *x* or _x_
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<i>$2</i>");
  text = text.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<i>$2</i>");

  // Strikethrough: ~~x~~
  text = text.replace(/~~([^~\n]+)~~/g, "<s>$1</s>");

  // Bullet markers (-, *) at line start → a real bullet.
  text = text.replace(/^\s*[-*]\s+/gm, "• ");

  // Restore code placeholders.
  text = text.replace(
    new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, "g"),
    (_m, index: string) => codeBlocks[Number(index)] ?? "",
  );

  return text;
}
