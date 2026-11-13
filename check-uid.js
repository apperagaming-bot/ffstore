// api/check-uid.js  (Vercel serverless function)
// Set two Environment Variables in Vercel:
//   LOOKUP_URL = provider URL with {uid} in it, e.g. https://provider.example/player?uid={uid}
//   LOOKUP_KEY = your provider API key (leave empty if none)

export default async function handler(req, res) {
  const uid = String(req.query.uid || "").trim();

  if (!/^\d{8,12}$/.test(uid)) {
    return res.status(400).json({ ok: false, error: "UID must be 8 to 12 digits." });
  }

  try {
    const url = process.env.LOOKUP_URL.replace("{uid}", uid);
    const headers = process.env.LOOKUP_KEY
      ? { Authorization: "Bearer " + process.env.LOOKUP_KEY }
      : {};
    const r = await fetch(url, { headers });
    if (!r.ok) return res.status(404).json({ ok: false, error: "UID not found." });

    const d = await r.json();

    // Change these field names to match what YOUR provider returns.
    const name = d.nickname || d.name;
    const level = d.level;
    const likes = d.likes;
    const region = String(d.region || "").toUpperCase();

    if (!name) return res.status(404).json({ ok: false, error: "UID not found." });
    if (region !== "IND") {
      return res.status(400).json({ ok: false, error: "Only India server UIDs are supported." });
    }

    res.setHeader("Cache-Control", "s-maxage=60");
    return res.status(200).json({ ok: true, uid, name, level, likes, region });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Check service is busy. Try again in a minute." });
  }
}
