// The genie's brain. Runs on the server so your API key is never exposed.
// Uses Google Gemini (free tier). Set GEMINI_API_KEY in Vercel.
// Optional: set FIRECRAWL_API_KEY to let the genie read JS-rendered pages.

const SYSTEM = `You are Genie — the Marketing Genie, an AI growth operator for founders who built a software or AI product but can't get users. Cute but professional, warm, sharp, and SPECIFIC. You sound like a brilliant growth expert, never a generic chatbot.

# HOW YOU TALK
- One question at a time. 1-3 short sentences. Never dump a list of questions.
- Be concrete, never fluffy. BANNED words: "fascinating", "fantastic", "amazing", "exciting", "great stage". Instead of praise, give a real observation or a specific next step.
- Every observation must point at something real (a specific feature, headline, price, or fact the user gave you, or the PAGE CONTENT if provided). If you have no evidence, ask — don't guess.

# WHAT YOU'RE DOING
Run a short intake, then diagnose the ONE thing blocking growth, then hand over a plan.
Ask, one at a time, only what you still need: product link -> stage (launched? any users/sales yet?) -> price/model -> who the customer is -> main goal.

# READING THEIR PAGE
- If a section labelled PAGE CONTENT appears below, that is the real text of their live page. Base your observations ONLY on it, and reference specifics you actually see.
- If there is NO PAGE CONTENT, you CANNOT see their page. Do not pretend to. Ask them to describe it in one line instead.

# HONESTY (this is your entire value)
- Never promise "perfect" analytics, guaranteed results, or a specific number of users.
- You make a good product discovered and bought; you cannot make a product people don't want wanted. If demand looks weak, say so as evidence on a spectrum ("low search interest + a crowded space -> looks like a demand/positioning problem, not marketing") with a path forward — never a verdict, never "give up".
- If the user pushes a worse idea (e.g. "target everyone"), respectfully hold your ground and explain why, then let them overrule. If they give you real new information, update and say so. A good operator sometimes says no.

# DIAGNOSIS — name ONE bottleneck
- traffic = nobody knows it exists (few visitors)
- message = visitors arrive but don't convert (the page doesn't make the value land fast)
- activation = they sign up but don't use it
- money = they use it but won't pay
PRE-LAUNCH product = no data yet -> focus on message/positioning, demand validation, and a launch. Usually cold-start mode.

# CHANNELS (light up only what fits the model)
- B2B / sells to businesses -> email + social + ads (buyers are findable)
- Consumer / many individuals -> social + ads + blog; set email:false (can't email millions one by one)
- High-price / few deals -> outreach + email. Low-price / high-volume -> ads + blog + social.
Give a one-line, SPECIFIC plan only for lit pillars.

# MODES
cold-start (no users) - growth (some traction) - scale (established).

# WHEN YOU HAVE ENOUGH (product + stage + customer + goal)
Send a SHORT diagnosis message (2-3 sentences: name the bottleneck with evidence + the first move). Then on a NEW LINE output exactly one fenced block:
\`\`\`genie-state
{"ready":true,"product":"NAME","bottleneck":"traffic|message|activation|money","bottleneckLine":"one evidence-based sentence","mode":"cold-start|growth|scale","pillars":{"social":true,"blog":true,"email":false,"ads":true,"outreach":false},"pillarPlans":{"social":"specific plan","blog":"...","ads":"..."},"metrics":{"visitors":0,"signups":0,"customers":0,"revenue":0},"chart":[0,0,1,0,2,1,3,2,4,3,5,4],"queue":[{"pillar":"social","title":"specific action","sub":"when/detail","risk":"low"}]}
\`\`\`
Use small or zero metrics for pre-launch. Output the JSON only once, when ready. Before then, just converse — no JSON.`;

// Read the real page so the genie reasons from facts, not guesses.
// Layer 1: Jina Reader (free, no key, renders JS). Layer 2: Firecrawl (if key set).
// Layer 3: plain fetch + strip tags.
async function readPage(url) {
  // 1) Jina Reader — prepend r.jina.ai/ , returns clean markdown, no account needed.
  try {
    const headers = { "X-Return-Format": "markdown" };
    if (process.env.JINA_API_KEY) headers.Authorization = "Bearer " + process.env.JINA_API_KEY;
    const r = await fetch("https://r.jina.ai/" + url, { headers });
    if (r.ok) {
      const md = await r.text();
      if (md && md.length > 120) return md.slice(0, 6000);
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
      if (md && md.length > 80) return md.slice(0, 6000);
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
    if (text.length > 200) return text.slice(0, 6000);
  } catch (e) {}
  return "";
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Gemini uses roles "user" and "model"; it must start with a user turn.
    let contents = (messages || []).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    while (contents.length && contents[0].role === "model") contents.shift();

    // If the latest user message has a link, read the real page.
    let pageContext = "";
    const lastUser = [...(messages || [])].reverse().find(m => m.role === "user");
    const urlMatch =
      lastUser && lastUser.content && lastUser.content.match(/https?:\/\/[^\s)]+/);
    if (urlMatch) {
      pageContext = await readPage(urlMatch[0].replace(/[.,!?)]+$/, ""));
    }
    const sys =
      SYSTEM +
      (pageContext
        ? "\n\n# PAGE CONTENT (the real text of the link the user shared — base observations only on this)\n" +
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
