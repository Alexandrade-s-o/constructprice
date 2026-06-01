import { runMarketReport, resolveGroqKey, resolveTavilyKey, applyCors } from "./_ai.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }
  const groqKey = resolveGroqKey({ headers: req.headers, body: req.body });
  const tavilyKey = resolveTavilyKey({ headers: req.headers, body: req.body });
  const { status, data } = await runMarketReport({ body: req.body || {}, groqKey, tavilyKey });
  res.status(status).json(data);
}
