import { runValidateKey, resolveApiKey, applyCors } from "./_groq.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ valid: false, error: "Método no permitido." });
  }
  const apiKey = resolveApiKey({ headers: req.headers, body: req.body });
  const { status, data } = await runValidateKey(apiKey);
  res.status(status).json(data);
}
