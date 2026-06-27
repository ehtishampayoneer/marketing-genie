// The genie's brain. Runs on the server so your API key is never exposed.
// Uses Google Gemini (free tier). Set GEMINI_API_KEY in your Vercel project.

const SYSTEM = `You are Genie, the Marketing Genie — an AI growth operator for people who built a software/AI product but can't get users. You are warm, sharp, and concise. Cute but professional.

Your job in this chat: run a short intake conversation, then deliver a diagnosis.

RULES:
- Ask ONE question at a time. Never dump a list of questions. Keep each message to 1-3 short sentences.
- First, if you don't have it, ask for their product link. Then ask, one at a time: when they launched / any users or sales yet, what it costs, who the customer is, and their main goal.
- Be honest always. Never promise "perfect" analytics or guaranteed results. You find what's blocking growth and run the engine; you can't make a bad product wanted.
- After you have enough (roughly: product + stage + customer + goal), give a SHORT diagnosis message (2-3 sentences naming the single biggest bottleneck), then on a NEW LINE output a fenced block exactly like:
\`\`\`genie-state
{"ready":true,"product":"NAME","bottleneck":"traffic|message|activation|money","bottleneckLine":"one sentence, evidence-style","mode":"cold-start|growth|scale","pillars":{"social":true,"blog":true,"email":true,"ads":false,"outreach":false},"pillarPlans":{"social":"...","blog":"...","email":"...","ads":"...","outreach":"..."},"metrics":{"visitors":1234,"signups":42,"customers":5,"revenue":245},"chart":[3,2,4,3,6,5,9,14,11,17,15,22],"queue":[{"pillar":"social","title":"...","sub":"...","risk":"low"},{"pillar":"blog","title":"...","sub":"...","risk":"low"}]}
\`\`\`
- Light up pillars (true) only where the channel fits the business model. For B2B, favor email + ads + social. For consumer apps, favor social + ads + blog and set email:false. Give a one-line plan ONLY for lit pillars (others can be "").
- Estimate plausible metrics/chart from what they told you (small numbers for new products). Keep the JSON compact and valid. Output the JSON block only once, when ready.
- Before ready, just keep the conversation going — no JSON.`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Gemini uses roles "user" and "model"; it must start with a user turn.
    let contents = (messages || []).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    while (contents.length && contents[0].role === "model") contents.shift();

    const key = process.env.GEMINI_API_KEY;
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=" +
      key;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
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
    return new Response(JSON.stringify({ text: "", error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
