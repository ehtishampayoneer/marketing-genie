// Live co-browser via Steel (open-source). Opens a real browser session you can
// embed and drive; the genie reads whatever page is loaded.
// Set STEEL_API_KEY in Vercel. Free tier: 15-min sessions, 2 concurrent.

const STEEL = "https://api.steel.dev/v1";

export async function POST(req) {
  const key = process.env.STEEL_API_KEY;
  if (!key) {
    return json({ error: "no-key", message: "Add STEEL_API_KEY in Vercel to enable the live browser." }, 200);
  }

  let body = {};
  try { body = await req.json(); } catch (e) {}
  const action = body.action || "start";

  try {
    // 1) Start a live session and return its embeddable interactive viewer URL.
    if (action === "start") {
      const r = await fetch(STEEL + "/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Steel-Api-Key": key },
        body: JSON.stringify({ timeout: 900000 }) // 15 min
      });
      const s = await r.json();
      if (!r.ok || !s.id) {
        return json({ error: "start-failed", message: s?.message || "Could not start a browser session." }, 200);
      }
      // Interactive viewer = user can click/scroll/type; showControls = URL + back/forward.
      const viewer =
        (s.sessionViewerUrl || ("https://app.steel.dev/sessions/" + s.id)) +
        "?interactive=true&showControls=true";
      return json({ sessionId: s.id, viewerUrl: viewer });
    }

    // 2) Read whatever page is currently loaded in the session (the genie's "eyes").
    if (action === "read") {
      const r = await fetch(STEEL + "/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Steel-Api-Key": key },
        body: JSON.stringify({ url: body.url, format: ["markdown"], delay: 1, useProxy: false })
      });
      const d = await r.json();
      const content = d?.content?.markdown || d?.markdown || "";
      return json({ content: content.slice(0, 6000), title: d?.metadata?.title || "" });
    }

    // 3) Release the session when the tour is done.
    if (action === "stop") {
      await fetch(STEEL + "/sessions/" + body.sessionId + "/release", {
        method: "POST",
        headers: { "Steel-Api-Key": key }
      }).catch(() => {});
      return json({ stopped: true });
    }

    return json({ error: "unknown-action" }, 200);
  } catch (e) {
    return json({ error: "exception", message: String(e) }, 200);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
