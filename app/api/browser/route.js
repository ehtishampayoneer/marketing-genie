// Page reader — fights through JS-heavy Shopify sites, rate limits, and stale caches.
// Returns explicit error info so we can debug instead of guessing.

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch (e) {}
  if ((body.action || "read") !== "read") return json({ ok: true });

  const url = (body.url || "").trim();
  if (!url) return json({ content: "", title: "", error: "no-url" });

  const result = await readPage(url);
  return json({
    content: (result.content || "").slice(0, 8000),
    title: titleFrom(result.content || "", url),
    source: result.source,
    debug: result.debug,
    error: result.error
  });
}

async function readPage(url) {
  const jinaKey = process.env.JINA_API_KEY;
  const tries = [];

  // ---- Attempt 1: Jina with browser engine (Shopify/JS-heavy) ----
  try {
    const headers = {
      "X-Return-Format": "markdown",
      "X-Engine": "browser",
      "X-No-Cache": "true",
      "X-Timeout": "25"
    };
    if (jinaKey) headers.Authorization = "Bearer " + jinaKey;
    const r = await fetch("https://r.jina.ai/" + url, { headers });
    const status = r.status;
    const md = r.ok ? await r.text() : "";
    tries.push({ tier: "jina-browser", status, length: md.length });
    if (r.ok && md.length > 200 && hasRealContent(md)) {
      return { content: md, source: "jina-browser", debug: tries };
    }
    // If rate-limited, wait and retry once
    if (status === 429) {
      await sleep(4000);
      const r2 = await fetch("https://r.jina.ai/" + url, { headers });
      const md2 = r2.ok ? await r2.text() : "";
      tries.push({ tier: "jina-browser-retry", status: r2.status, length: md2.length });
      if (r2.ok && md2.length > 200 && hasRealContent(md2)) {
        return { content: md2, source: "jina-browser-retry", debug: tries };
      }
    }
  } catch (e) {
    tries.push({ tier: "jina-browser", error: String(e).slice(0, 100) });
  }

  // ---- Attempt 2: Jina default engine (lightweight, faster, sometimes works when browser fails) ----
  try {
    const headers = {
      "X-Return-Format": "markdown",
      "X-No-Cache": "true",
      "X-Timeout": "15"
    };
    if (jinaKey) headers.Authorization = "Bearer " + jinaKey;
    const r = await fetch("https://r.jina.ai/" + url, { headers });
    const md = r.ok ? await r.text() : "";
    tries.push({ tier: "jina-default", status: r.status, length: md.length });
    if (r.ok && md.length > 200 && hasRealContent(md)) {
      return { content: md, source: "jina-default", debug: tries };
    }
  } catch (e) {
    tries.push({ tier: "jina-default", error: String(e).slice(0, 100) });
  }

  // ---- Attempt 3: Plain fetch with realistic Chrome headers (works for static + Shopify HTML) ----
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache"
      },
      redirect: "follow"
    });
    const status = r.status;
    const html = r.ok ? await r.text() : "";
    const text = htmlToText(html);
    tries.push({ tier: "fetch", status, htmlLength: html.length, textLength: text.length });
    if (r.ok && text.length > 300) {
      return { content: text, source: "fetch", debug: tries };
    }
  } catch (e) {
    tries.push({ tier: "fetch", error: String(e).slice(0, 100) });
  }

  return {
    content: "",
    source: "none",
    debug: tries,
    error: "All readers returned empty. Tried: " + tries.map(t => t.tier + "(" + (t.status || t.error || "?") + ":" + (t.length || t.textLength || 0) + ")").join(", ")
  };
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(h[1-6]|p|li|br|div|section|article)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

// A page has "real content" if it isn't just nav, footer, and link skeletons.
function hasRealContent(md) {
  // Remove markdown links, images, and metadata header
  const cleaned = md
    .replace(/^---[\s\S]*?---/m, "")          // strip front-matter
    .replace(/^Title:.*$/gm, "")
    .replace(/^URL Source:.*$/gm, "")
    .replace(/^Markdown Content:.*$/gm, "")
    .replace(/\!\[.*?\]\(.*?\)/g, "")          // images
    .replace(/\[.*?\]\(.*?\)/g, "")            // links
    .replace(/^[#*\-_=\s>]+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 150;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function titleFrom(content, url) {
  const m = content.match(/^Title:\s*(.+)$/m) || content.match(/^#\s+(.+)$/m);
  if (m) return m[1].slice(0, 80).trim();
  try { return new URL(url).pathname.replace(/\/$/, "").split("/").pop() || "Page"; } catch (e) { return "Page"; }
}

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } });
}
