// Live co-browser via Steel (open-source, self-hosted).
//
// ── WHERE STEEL RUNS ────────────────────────────────────────────────
// FREE / LOCAL (now):  run Steel on your computer with one Docker command
//   docker run -p 3000:3000 -p 9223:9223 ghcr.io/steel-dev/steel-browser
//   then STEEL_BASE_URL stays http://localhost:3000  (the default below)
//
// PAID / CLOUD (later, for mobile + other users): deploy Steel to Railway,
//   then in Vercel set ONE env var  STEEL_BASE_URL = https://your-steel.up.railway.app
//   Nothing else changes. Same API, same code.
// ────────────────────────────────────────────────────────────────────

const STEEL = (process.env.STEEL_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch (e) {}
  const action = body.action || "start";

  try {
    // 1) Start a live browser session and return its embeddable live-view URL.
    if (action === "start") {
      const r = await fetch(STEEL + "/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dimensions: { width: 1280, height: 800 } })
      });
      const s = await r.json().catch(() => ({}));
      if (!r.ok || !s.id) {
        return json({ error: "start-failed", message: "Couldn't reach your Steel browser. Is it running? (docker run … steel-browser)" });
      }
      // Self-hosted live viewer: the session page on your Steel server.
      const viewer = STEEL + "/v1/sessions/" + s.id + "/live?interactive=true&showControls=true";
      const debug = s.debugUrl || s.sessionViewerUrl || "";
      return json({ sessionId: s.id, viewerUrl: viewer, debugUrl: debug, steelBase: STEEL });
    }

    // 2) Read the current page in the session (the genie's "eyes").
    if (action === "read") {
      const r = await fetch(STEEL + "/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: body.url, format: ["markdown"] })
      });
      const d = await r.json().catch(() => ({}));
      const content =
        d?.content?.markdown || d?.markdown ||
        (typeof d?.content === "string" ? d.content : "") || "";
      return json({ content: content.slice(0, 6000), title: d?.metadata?.title || "" });
    }

    // 3) Release the session when the tour ends.
    if (action === "stop") {
      if (body.sessionId) {
        await fetch(STEEL + "/v1/sessions/" + body.sessionId + "/release", { method: "POST" }).catch(() => {});
      }
      return json({ stopped: true });
    }

    return json({ error: "unknown-action" });
  } catch (e) {
    return json({ error: "exception", message: "Couldn't reach your Steel browser at " + STEEL + ". Make sure Docker is running it." });
  }
}

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } });
}
