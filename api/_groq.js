// Lógica compartida de Groq usada tanto por las funciones serverless de Vercel
// (carpeta /api) como por el servidor local de desarrollo (server/index.js).

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Modelo con búsqueda web en vivo (compound). compound-mini es el más liviano.
export const GROQ_MODEL = process.env.GROQ_MODEL || "groq/compound-mini";
// Modelo normal de respaldo (sin búsqueda web) para cuando el plan gratuito
// rechaza la búsqueda en vivo con un 413 (request_too_large).
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || "llama-3.3-70b-versatile";
const ENV_API_KEY = process.env.GROQ_API_KEY;

export const groqConfigured = () => !!ENV_API_KEY;
export const getToday = () => new Date().toISOString().split("T")[0];

/** Limpia el texto de respuesta para extraer el JSON válido. */
export const cleanJsonString = (text) => {
  let clean = (text || "").trim();
  if (clean.includes("```")) {
    const match = clean.match(/```(?:json)?([\s\S]*?)```/);
    if (match) clean = match[1];
    else clean = clean.replace(/```(json)?/g, "").replace(/```/g, "");
  }
  const first = clean.indexOf("{");
  const last = clean.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    clean = clean.slice(first, last + 1);
  }
  return clean.trim();
};

/**
 * Resuelve la API Key: primero la que envía el usuario desde la interfaz
 * (cabecera x-groq-key o campo apiKey en el cuerpo) y, si no, la del entorno.
 */
export const resolveApiKey = ({ headers = {}, body = {} } = {}) => {
  const fromHeader = headers["x-groq-key"] || headers["X-Groq-Key"];
  const fromBody = body.apiKey;
  return (fromHeader || fromBody || ENV_API_KEY || "").trim();
};

/** Llama a la API de Groq con un modelo concreto. Lanza Error con .status en caso de fallo. */
const rawGroqCall = async (messages, { temperature, apiKey, maxTokens, model }) => {
  const key = apiKey || ENV_API_KEY;
  if (!key) {
    const err = new Error(
      "Falta la API Key de Groq. Ingrésala en la pantalla de Configuración o configúrala en Vercel."
    );
    err.status = 401;
    throw err;
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, temperature, max_tokens: maxTokens, messages }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let message;
    if (res.status === 401 || res.status === 403) {
      message = "API Key de Groq inválida o sin permisos. Revísala en Configuración.";
    } else if (res.status === 429) {
      message = "Demasiadas solicitudes a Groq. Espera un momento e inténtalo de nuevo.";
    } else {
      message = `Groq respondió ${res.status}: ${errText}`;
    }
    const err = new Error(message);
    err.status = res.status;
    err.body = errText;
    throw err;
  }

  const data = await res.json();
  const msg = data?.choices?.[0]?.message || {};
  return { content: msg.content || "", executedTools: msg.executed_tools || [] };
};

const isTooLarge = (err) =>
  err?.status === 413 || /request_too_large|too.large|413/i.test(err?.body || err?.message || "");

/**
 * Llama a Groq con búsqueda web en vivo (compound) y, si el plan gratuito lo
 * rechaza por tamaño (413), reintenta con un modelo normal sin búsqueda.
 * Devuelve { content, executedTools, liveSearch }.
 */
export const callGroq = async (messages, { temperature = 0.2, apiKey, maxTokens = 1024 } = {}) => {
  try {
    const out = await rawGroqCall(messages, { temperature, apiKey, maxTokens, model: GROQ_MODEL });
    return { ...out, liveSearch: true };
  } catch (err) {
    if (!isTooLarge(err)) throw err;
    // Fallback: modelo normal sin búsqueda web (datos del conocimiento del modelo).
    const out = await rawGroqCall(messages, {
      temperature,
      apiKey,
      maxTokens,
      model: FALLBACK_MODEL,
    });
    return { ...out, liveSearch: false };
  }
};

const extractUrlFromTools = (executedTools) => {
  for (const tool of executedTools || []) {
    const results =
      tool?.search_results?.results ||
      tool?.output?.results ||
      (Array.isArray(tool?.search_results) ? tool.search_results : null);
    if (Array.isArray(results)) {
      const hit = results.find((r) => r?.url);
      if (hit) return hit.url;
    }
  }
  return null;
};

/** Busca el precio real de un material. Devuelve { status, data }. */
export const runUpdatePrice = async ({ body = {}, apiKey } = {}) => {
  const { name, unit, url: currentUrl, supplier: currentSupplier } = body;
  if (!name) {
    return { status: 400, data: { error: "Falta el nombre del material." } };
  }

  const prompt = `
BÚSQUEDA DE PRECIO REAL DE MATERIALES DE CONSTRUCCIÓN EN COLOMBIA (fecha de hoy: ${getToday()}).
Material: "${name}"
Unidad: ${unit || "unidad"}

OBJETIVO: Busca en internet el precio más ACTUAL y la fuente exacta.

INSTRUCCIONES:
1. Prioriza grandes superficies: Homecenter, Easy, Constructor (Sodimac), Cemex, Argos.
2. También considera ferreterías locales, MercadoLibre Colombia y depósitos de materiales.
3. El precio debe ser en pesos colombianos (COP) y corresponder a la unidad indicada.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO, SIN TEXTO ADICIONAL, CON ESTE FORMATO EXACTO:
{
  "newPrice": number,
  "url": "URL verificable de la fuente del precio",
  "supplier": "Nombre de la tienda o ferretería",
  "reason": "Detalle breve del proveedor o ubicación",
  "trend": "up" | "down" | "stable"
}
`.trim();

  try {
    const { content, executedTools, liveSearch } = await callGroq(
      [
        {
          role: "system",
          content:
            "Eres un asistente experto en precios de materiales de construcción en Colombia. Cuando puedes, usas búsqueda web para datos reales. Respondes SOLO con JSON.",
        },
        { role: "user", content: prompt },
      ],
      { apiKey, maxTokens: 700 }
    );

    let data;
    try {
      data = JSON.parse(cleanJsonString(content));
    } catch {
      return {
        status: 502,
        data: { error: "La IA no devolvió un precio válido.", raw: content },
      };
    }

    if (typeof data.newPrice !== "number" || isNaN(data.newPrice)) {
      return {
        status: 502,
        data: { error: "La IA no encontró un precio numérico.", raw: content },
      };
    }

    let finalUrl = data.url;
    if (!finalUrl || finalUrl === "" || /URL|ejemplo|placeholder/i.test(finalUrl)) {
      finalUrl = extractUrlFromTools(executedTools) || currentUrl || "";
    }

    // Si fue por el modelo de respaldo (sin búsqueda en vivo), es un estimado.
    const reason = data.reason || "";
    const description = liveSearch
      ? reason
      : `Estimado (sin búsqueda web en vivo por límite del plan gratuito de Groq). ${reason}`.trim();

    return {
      status: 200,
      data: {
        price: data.newPrice,
        lastUpdated: getToday(),
        url: liveSearch ? finalUrl || currentUrl || "" : currentUrl || "",
        supplier: data.supplier || currentSupplier,
        trend: ["up", "down", "stable"].includes(data.trend) ? data.trend : "stable",
        description,
        estimated: !liveSearch,
      },
    };
  } catch (error) {
    return { status: 500, data: { error: error.message } };
  }
};

/** Genera el reporte de mercado. Devuelve { status, data }. */
export const runMarketReport = async ({ body = {}, apiKey } = {}) => {
  const { summary } = body;
  const prompt = `
Genera un reporte ejecutivo breve sobre el mercado de la construcción en Colombia HOY (${getToday()}).
Busca en internet noticias recientes sobre el precio del acero, el cemento y la TRM (dólar).
${summary ? `Compara con estos precios guardados del usuario: ${summary}.` : ""}
Tono profesional. Máximo 3 párrafos cortos. Responde en español.
`.trim();

  try {
    const { content, liveSearch } = await callGroq(
      [
        {
          role: "system",
          content:
            "Eres un analista del sector construcción en Colombia. Cuando puedes, usas búsqueda web para datos actuales.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.4, apiKey, maxTokens: 1024 }
    );
    const note = liveSearch
      ? ""
      : "⚠️ Reporte generado con conocimiento general del modelo (sin búsqueda web en vivo, por el límite del plan gratuito de Groq).\n\n";
    return { status: 200, data: { report: note + (content || "No se obtuvo respuesta."), liveSearch } };
  } catch (error) {
    return { status: 500, data: { error: error.message } };
  }
};

/** Valida una API Key contra Groq. Devuelve { status, data }. */
export const runValidateKey = async (apiKey) => {
  if (!apiKey) {
    return { status: 400, data: { valid: false, error: "No se proporcionó ninguna API Key." } };
  }
  try {
    const r = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (r.ok) return { status: 200, data: { valid: true } };
    const detail = await r.text();
    return {
      status: 200,
      data: { valid: false, error: `Groq rechazó la clave (${r.status}).`, detail },
    };
  } catch (error) {
    return { status: 500, data: { valid: false, error: error.message } };
  }
};

/** Aplica cabeceras CORS y responde OPTIONS. Devuelve true si era preflight. */
export const applyCors = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-groq-key");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
};
