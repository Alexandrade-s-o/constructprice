import { runUpdatePrice, resolveApiKey, applyCors } from "./_groq.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }
  const apiKey = resolveApiKey({ headers: req.headers, body: req.body });
  const { status, data } = await runUpdatePrice({ body: req.body || {}, apiKey });
  res.status(status).json(data);
}
