// Tour page reader — free, no keys, no server to host.
// Reads whatever page URL the user pastes during the guided tour,
// using Jina Reader (free, renders JS sites), with a plain-fetch fallback.

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch (e) {}
  const action = body.action || "read";

  // "start"/"stop" are no-ops in the free tour (no live browser to manage).
  if (action !== "read") {
    return json({ ok: true });
  }

  const url = (body.url || "").trim();
  if (!url) return json({ content: "", title: "" });

  const content = await readPage(url);
  return json({ content: content.slice(0, 6000), title: titleFrom(content, url) });
}

async function readPage(url) {
  // 1) Jina Reader — free, no key, renders JavaScript sites.
  try {
    const headers = { "X-Return-Format": "markdown" };
    if (process.env.JINA_API_KEY) headers.Authorization = "Bearer " + process.env.JINA_API_KEY;
    const r = await fetch("https://r.jina.ai/" + url, { headers });
    if (r.ok) {
      const md = await r.text();
      if (md && md.length > 80) return md;
    }
  } catch (e) {}

  // 2) Plain fetch + strip tags (works for simple/static pages).
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 GenieBot" } });
    const html = await r.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 120) return text;
  } catch (e) {}

  return "";
}

function titleFrom(content, url) {
  const m = content.match(/^#\s+(.+)$/m) || content.match(/Title:\s*(.+)/);
  if (m) return m[1].slice(0, 80).trim();
  try { return new URL(url).pathname.replace(/\/$/, "").split("/").pop() || "Page"; } catch (e) { return "Page"; }
}

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } });
}
