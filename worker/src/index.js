const ORIGIN = "https://tonymach.github.io";
const CORS = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "bad json" }, 400);
    }

    // ponytail: honeypot field, add Turnstile if bots actually show up
    if (body.website) return json({ ok: true });

    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ ok: false, error: "invalid email" }, 400);
    }

    await env.DB.prepare("INSERT OR IGNORE INTO signups (email, ts) VALUES (?, ?)")
      .bind(email, new Date().toISOString())
      .run();

    return json({ ok: true });
  },
};
