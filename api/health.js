import { AI_MODEL, aiConfigured, applyCors } from "./_ai.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.status(200).json({ ok: true, model: AI_MODEL, cerebrasConfigured: aiConfigured() });
}
