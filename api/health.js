import { GROQ_MODEL, groqConfigured, applyCors } from "./_groq.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.status(200).json({ ok: true, model: GROQ_MODEL, groqConfigured: groqConfigured() });
}
