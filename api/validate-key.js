import { runValidateKey, resolveGroqKey, applyCors } from "./_ai.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ valid: false, error: "Método no permitido." });
  }
  const groqKey = resolveGroqKey({ headers: req.headers, body: req.body });
  const { status, data } = await runValidateKey(groqKey);
  res.status(status).json(data);
}
