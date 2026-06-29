// Outreach Operator backend.
// Actions:
//   "discover"  -> Brave Search for businesses matching a target description, return clean leads
//   "extract"   -> read one site, pull emails + phones + the bit that explains what they do
//   "writeMessage" -> per-prospect personalized message via Gemini, based on what we read

const BRAVE = "https://api.search.brave.com/res/v1/web/search";

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch (e) {}
  const action = body.action || "discover";

  try {
    if (action === "discover") return await discover(body);
    if (action === "extract")  return await extract(body);
    if (action === "writeMessage") return await writeMessage(body);
    return json({ error: "unknown-action" });
  } catch (e) {
    return json({ error: "exception", message: String(e) });
  }
}

/* ---------- DISCOVER ---------- */
// Searches for business sites that match the target description.
async function discover({ query, count = 10 }) {
  if (!query) return json({ leads: [], note: "no-query" });

  const key = process.env.BRAVE_API_KEY;
  if (!key) {
    // graceful no-key mode — UI keeps working; user sees the message
    return json({
      leads: [],
      note: "Add BRAVE_API_KEY in Vercel (free key from api.search.brave.com) to unlock prospect discovery."
    });
  }

  const r = await fetch(BRAVE + "?q=" + encodeURIComponent(query) + "&count=" + count, {
    headers: { "Accept": "application/json", "X-Subscription-Token": key }
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    return json({ leads: [], note: "Brave search failed: " + (t.slice(0, 200) || r.status) });
  }
  const d = await r.json();
  const results = (d?.web?.results || []).map(x => ({
    name: x.title || "",
    url: x.url || "",
    snippet: x.description || ""
  })).filter(x => x.url && !blockedDomain(x.url));

  // Dedup by domain.
  const seen = new Set();
  const leads = [];
  for (const x of results) {
    let host = "";
    try { host = new URL(x.url).hostname.replace(/^www\./, ""); } catch (e) {}
    if (!host || seen.has(host)) continue;
    seen.add(host);
    leads.push({ ...x, domain: host });
  }
  return json({ leads });
}

function blockedDomain(url) {
  // Skip directories, social platforms, marketplaces - we want the businesses' own sites.
  return /(facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|pinterest|reddit|wikipedia|amazon|ebay|yelp|tripadvisor|crunchbase|glassdoor|indeed|maps\.google)\.(com|net|org)/i.test(url);
}

/* ---------- EXTRACT ---------- */
// Read a business site and pull contacts + a short "what they do" summary.
async function extract({ url }) {
  if (!url) return json({ error: "no-url" });

  // Read via Jina Reader (free, JS-rendered) — same reader the diagnostic uses.
  let text = "";
  try {
    const r = await fetch("https://r.jina.ai/" + url, {
      headers: { "X-Return-Format": "markdown" }
    });
    if (r.ok) text = await r.text();
  } catch (e) {}

  // Also try /contact and /about pages — that's where emails live.
  let origin = "";
  try { origin = new URL(url).origin; } catch (e) {}
  const extraPaths = ["/contact", "/contact-us", "/about", "/about-us", "/get-in-touch"];
  for (const p of extraPaths) {
    if (!origin) break;
    try {
      const r = await fetch("https://r.jina.ai/" + origin + p, { headers: { "X-Return-Format": "markdown" } });
      if (r.ok) {
        const more = await r.text();
        if (more && more.length > 100) text += "\n\n" + more;
      }
    } catch (e) {}
  }

  const emails = extractEmails(text);
  const phones = extractPhones(text);
  const about  = firstMeaningfulParagraph(text);
  return json({ emails, phones, about, raw: text.slice(0, 4000) });
}

function extractEmails(text) {
  const re = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
  const found = (text.match(re) || []).map(s => s.toLowerCase());
  // Filter junk (sentry, wixpress, placeholders).
  const clean = found.filter(e =>
    !/sentry|wixpress|example\.com|domain\.com|yourdomain|youremail|test@|noreply|no-reply/i.test(e) &&
    !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e)
  );
  return [...new Set(clean)];
}

function extractPhones(text) {
  // simple-but-effective: catches +XX, hyphens, parens, spaces
  const re = /(\+?\d[\d\s().-]{8,17}\d)/g;
  const found = (text.match(re) || []).map(s => s.replace(/\s+/g, " ").trim());
  return [...new Set(found)].slice(0, 5);
}

function firstMeaningfulParagraph(text) {
  // grab the first non-trivial paragraph for context
  const paras = text.split(/\n{2,}/).map(p => p.replace(/\s+/g, " ").trim()).filter(p => p.length > 80 && !/^#|^\[/.test(p));
  return paras[0] ? paras[0].slice(0, 400) : "";
}

/* ---------- WRITE MESSAGE ---------- */
// Per-prospect personalized email via Gemini.
async function writeMessage({ prospect, product, channel = "email" }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ message: "", error: "no-gemini-key" });

  const SYS =
    "You write SHORT, HIGH-DELIVERY outreach messages founders would actually send. RULES:\n" +
    "- Length: " + (channel === "email" ? "60-90 words MAX" : "40-60 words MAX") + ". No exceptions.\n" +
    "- Open with ONE specific observation about THEIR business from the context provided. Never generic praise.\n" +
    "- ONE clear ask. ONE sentence.\n" +
    "- No buzzwords ('leverage', 'synergize', 'cutting-edge', 'revolutionary', 'game-changer', 'in this dynamic landscape'). BANNED.\n" +
    "- No 'I hope this email finds you well.' Get to the point.\n" +
    "- Subject line if email: 6 words max, lowercase casual, no clickbait.\n" +
    "- Plain conversational human English. The reader should not be able to tell an AI wrote it.\n" +
    "- Output ONLY the message (with 'Subject: ...' on first line for email), no preamble.";

  const prompt =
    "PROSPECT:\nName: " + (prospect.name || prospect.domain || "") +
    "\nWebsite: " + (prospect.url || "") +
    "\nWhat they do: " + (prospect.about || prospect.snippet || "(unknown)") +
    "\n\nMY PRODUCT:\n" + (product || "(not provided)") +
    "\n\nChannel: " + channel +
    "\n\nWrite the message now.";

  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYS }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } }
      })
    }
  );

  let text = "";
  try {
    const d = await r.json();
    text = d?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  } catch (e) {}
  return json({ message: text.trim() });
}

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } });
}
