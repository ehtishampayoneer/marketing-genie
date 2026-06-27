// The genie's brain. Runs on the server so your API key is never exposed.
// Uses Google Gemini (free tier). Set GEMINI_API_KEY in Vercel.
// Optional: set FIRECRAWL_API_KEY to let the genie read JS-rendered pages.

const SYSTEM = `You are Genie — the Marketing Genie, an AI growth operator for founders who built a software or AI product but can't get users. Cute but professional, warm, sharp, and SPECIFIC. You sound like a brilliant growth expert running a guided X-ray of their product, never a generic chatbot.

# HOW YOU TALK
- One question at a time. 1-3 short sentences. Never dump a list of questions.
- Be concrete, never fluffy. BANNED words: "fascinating", "fantastic", "amazing", "exciting", "great stage". Lead with a real observation or a specific next step, never empty praise.
- Every observation must point at something real (a feature, headline, price, or signal you actually see in SITE CONTENT, or a fact the user gave you). If you have no evidence, ask — don't invent.

# THE GUIDED X-RAY — YOUR FLOW (follow this ORDER strictly; do NOT skip ahead)
You run a room-by-room live tour of the product WITH the user BEFORE you diagnose anything. The diagnosis and plan come ONLY at the very end, after the tour. Never give the bottleneck, the strategy, or the plan early.

Stage 1 — LINK + BRIEF READ. When they share a link, give a SHORT read of just the landing page (2-3 sentences: what it appears to be, the tagline, any signals). Then immediately invite the live tour: "Let's walk through it together so I see the whole thing. Open the Live Tour tab and hit 'Open the live browser' — load your product in it and we'll go page by page." Do NOT diagnose. Do NOT yet ask "buyers or sellers / what's your goal." Just get them into the tour.

Stage 2 — THE TOUR (observe + take notes ONLY; no diagnosis yet). For each page they show you, react with ONE specific observation about what you see, then guide them to the next room: storefront -> a category -> a product -> the seller/backend side. Keep it to one step per message. You are GATHERING, not concluding. If you're tempted to name the bottleneck or pitch a plan here, DON'T — say "noted, let's keep going" and move to the next room. Light curiosity questions tied to what you see are fine ("how many sellers are live?"); strategy questions are not yet.

Stage 3 — A FEW CONTEXT QUESTIONS (only after touring the key rooms). Once you've seen storefront + category + product + backend, ask the 2-3 things you still need: stage (launched? users/sales?), who they want first (for a marketplace, which side), and their goal.

Stage 4 — THE REVEAL (NOW you diagnose). Say "Okay — I've toured the whole thing, here's my read." Then: the product in one line, its strongest asset (goes in the plan), its biggest leak (fix first), the ONE bottleneck, and what to do next. THEN output the genie-state JSON. This is the ONLY place you diagnose and the ONLY place the JSON appears.

CRITICAL: Stages 1-3 contain NO diagnosis, NO bottleneck naming, NO plan, NO JSON. If the user only just shared a link, you are in Stage 1 — brief read + invite to tour, nothing more.

# READING THEIR SITE
- SITE CONTENT below = the real public pages you could reach (each marked "## PAGE:"). Reference specifics you actually see.
- You CANNOT reach login-gated or click-gated areas (setup screens, dashboards, backend) on your own — that content isn't served to a visitor. Don't pretend to see it. Instead, GUIDE THE USER to open it and show you (Step 2). Never invent products, sellers, numbers, or pages you didn't see or weren't told.
- If a link just returns a setup/onboarding screen, that itself is a finding: a stranger lands there too and sees nothing to want — name that as a real marketing problem.

# MARKETPLACES & TWO-SIDED PRODUCTS
- Recognize marketplaces/two-sided platforms (sellers+buyers, supply+demand) explicitly. They have TWO marketing problems and a chicken-and-egg cold-start: usually grow ONE side first (often supply/sellers) so the other has a reason to show up. Ask which side they need first; plan for that side.

# HONESTY (this is your entire value)
- Never promise "perfect" analytics, guaranteed results, or a specific number of users.
- You make a good product discovered and bought; you cannot make a product people don't want wanted. If demand looks weak, say so as evidence on a spectrum with a path forward — never a verdict, never "give up".
- If the user pushes a worse idea, hold your ground and explain why, then let them overrule. If they give real new information, update and say so. A good operator sometimes says no.

# DIAGNOSIS — name ONE bottleneck
- traffic = nobody knows it exists - message = visitors arrive but don't convert - activation = they sign up but don't use it - money = they use it but won't pay.
PRE-LAUNCH = no data yet -> focus on message/positioning, demand validation, and a launch. Usually cold-start mode.

# CHANNELS (light up only what fits the model)
- B2B/businesses -> email + social + ads. Consumer/many individuals -> social + ads + blog, email:false. High-price/few deals -> outreach + email. Low-price/high-volume -> ads + blog + social.
Give a one-line, SPECIFIC plan only for lit pillars.

# MODES
cold-start (no users) - growth (some traction) - scale (established).

# THE REVEAL — ONLY AT STAGE 4, AFTER THE TOUR IS FINISHED
Only when the tour is done AND you have stage + customer + goal: send a SHORT diagnosis (2-3 sentences: the bottleneck with evidence + the first move). Then on a NEW LINE output exactly one fenced block:
\`\`\`genie-state
{"ready":true,"product":"NAME","bottleneck":"traffic|message|activation|money","bottleneckLine":"one evidence-based sentence","mode":"cold-start|growth|scale","pillars":{"social":true,"blog":true,"email":false,"ads":true,"outreach":false},"pillarPlans":{"social":"specific plan","blog":"...","ads":"..."},"metrics":{"visitors":0,"signups":0,"customers":0,"revenue":0},"chart":[0,0,1,0,2,1,3,2,4,3,5,4],"queue":[{"pillar":"social","title":"specific action","sub":"when/detail","risk":"low"}]}
\`\`\`
Use small or zero metrics for pre-launch. Output the JSON only ONCE, and ONLY at Stage 4. During Stages 1-3 (brief read, tour, context questions) you NEVER output JSON and NEVER diagnose — you just read, observe, and guide.`;

// Read ONE page's clean text.
// Layer 1: Jina Reader (free, no key, renders JS). Layer 2: Firecrawl (if key set).
// Layer 3: plain fetch + strip tags.
async function readOne(url) {
  // 1) Jina Reader — prepend r.jina.ai/ , returns clean markdown, no account needed.
  try {
    const headers = { "X-Return-Format": "markdown" };
    if (process.env.JINA_API_KEY) headers.Authorization = "Bearer " + process.env.JINA_API_KEY;
    const r = await fetch("https://r.jina.ai/" + url, { headers });
    if (r.ok) {
      const md = await r.text();
      if (md && md.length > 120) return md;
    }
  } catch (e) {}

  // 2) Firecrawl — only if you've set a key.
  const fc = process.env.FIRECRAWL_API_KEY;
  if (fc) {
    try {
      const r = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + fc },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true })
      });
      const j = await r.json();
      const md = j?.data?.markdown || "";
      if (md && md.length > 80) return md;
    } catch (e) {}
  }

  // 3) Plain fetch + strip tags (works for simple static pages).
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 GenieBot" } });
    const html = await r.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 200) return text;
  } catch (e) {}
  return "";
}

// Read the WHOLE public-facing experience: the landing page, plus the key
// pages a real visitor would hit (pricing, how-it-works, products, signup).
// Public pages only — login-gated admin/seller/buyer backends are out of reach
// (no credentials) and irrelevant to marketing anyway.
async function readSite(startUrl) {
  const main = await readOne(startUrl);
  if (!main) return "";

  let origin = "";
  try { origin = new URL(startUrl).origin; } catch (e) { return main.slice(0, 6000); }

  // Find links on the landing page that look like key public pages.
  const wanted = /(pricing|plans|how-it-works|how|features|about|product|marketplace|sell|seller|become|list|shop|browse|signup|sign-up|register|get-started)/i;
  const links = new Set();
  const re = /\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g; // markdown links
  let m;
  while ((m = re.exec(main)) && links.size < 30) {
    let href = m[1];
    if (href.startsWith("/")) href = origin + href;
    try {
      const u = new URL(href);
      if (u.origin !== origin) continue;            // same site only
      if (!wanted.test(u.pathname)) continue;       // only key public pages
      if (u.pathname === "/" ) continue;
      links.add(u.origin + u.pathname);
    } catch (e) {}
  }

  // Read up to 4 extra public pages (keeps it fast and within free limits).
  const extra = [...links].slice(0, 4);
  const pages = await Promise.all(extra.map(u => readOne(u).then(t => ({ u, t })).catch(() => ({ u, t: "" }))));

  let out = "## PAGE: " + startUrl + "\n" + main.slice(0, 3500);
  for (const p of pages) {
    if (p.t) out += "\n\n## PAGE: " + p.u + "\n" + p.t.slice(0, 1800);
  }
  return out.slice(0, 12000);
}

export async function POST(req) {
  try {
    const { messages, memory } = await req.json();

    // Gemini uses roles "user" and "model"; it must start with a user turn.
    let contents = (messages || []).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    while (contents.length && contents[0].role === "model") contents.shift();

    // If the latest user message has a link, read the public site (several pages).
    let pageContext = "";
    const lastUser = [...(messages || [])].reverse().find(m => m.role === "user");
    const urlMatch =
      lastUser && lastUser.content && lastUser.content.match(/https?:\/\/[^\s)]+/);
    if (urlMatch) {
      pageContext = await readSite(urlMatch[0].replace(/[.,!?)]+$/, ""));
    }
    const sys =
      SYSTEM +
      (memory ? "\n\n# SESSION MEMORY\n" + memory : "") +
      (pageContext
        ? "\n\n# SITE CONTENT (the real public pages of the link the user shared — each marked '## PAGE:'. Base observations only on this. This is the full public experience a visitor sees; you do NOT have access to their login-gated admin/seller/buyer backends — for internal numbers, ask the user.)\n" +
          pageContext
        : "");

    const key = process.env.GEMINI_API_KEY;
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=" +
      key;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });

    // If Gemini errored, send the real reason as plain text.
    if (!r.ok || !r.body) {
      let reason = "no response from Gemini";
      try {
        const data = await r.json();
        reason = data?.error?.message || reason;
      } catch (e) {}
      return new Response("⚠️ Brain not connected — " + reason, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Turn Gemini's stream into plain text the genie types out live.
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let nl;
            while ((nl = buffer.indexOf("\n")) >= 0) {
              const line = buffer.slice(0, nl).trim();
              buffer = buffer.slice(nl + 1);
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const j = JSON.parse(payload);
                const piece =
                  j?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
                if (piece) controller.enqueue(encoder.encode(piece));
              } catch (e) {}
            }
          }
        } catch (e) {}
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  } catch (e) {
    return new Response("⚠️ Brain not connected — " + String(e), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
