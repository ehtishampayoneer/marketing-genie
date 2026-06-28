// Live co-browser via Steel (open-source). Opens a real browser session you can
// embed and drive; the genie reads whatever page is loaded.
// Set STEEL_API_KEY in Vercel. Free tier: sessions + 2 concurrent.

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
    // 1) Start a live session; return its embeddable debugUrl live view.
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
      // The embeddable interactive live view is the session's debugUrl.
      const debug = s.debugUrl || s.debug_url || "";
      const viewer = debug
        ? debug + (debug.includes("?") ? "&" : "?") + "interactive=true&showControls=true"
        : "";
      return json({
        sessionId: s.id,
        viewerUrl: viewer,
        sessionViewerUrl: s.sessionViewerUrl || s.session_viewer_url || ""
      });
    }

    // 2) Read whatever page is at the given URL (the genie's "eyes").
    if (action === "read") {
      const r = await fetch(STEEL + "/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Steel-Api-Key": key },
        body: JSON.stringify({ url: body.url, format: ["markdown"] })
      });
      const d = await r.json();
      const content =
        d?.content?.markdown ||
        d?.markdown ||
        (typeof d?.content === "string" ? d.content : "") ||
        "";
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
