// Lógica compartida de Groq usada tanto por las funciones serverless de Vercel
// (carpeta /api) como por el servidor local de desarrollo (server/index.js).

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// compound-mini es más liviano y rápido que compound (1 sola búsqueda web por turno),
// y evita el error 413 (request_too_large) del tier gratuito de Groq.
export const GROQ_MODEL = process.env.GROQ_MODEL || "groq/compound-mini";
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

/** Llama a la API de Groq y devuelve el contenido + herramientas ejecutadas. */
export const callGroq = async (messages, { temperature = 0.2, apiKey, maxTokens = 1024 } = {}) => {
  const key = apiKey || ENV_API_KEY;
  if (!key) {
    throw new Error(
      "Falta la API Key de Groq. Ingrésala en la pantalla de Configuración o configúrala en Vercel."
    );
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    // max_tokens acota los tokens reservados por Groq para el cálculo del límite
    // del plan gratuito; sin él, se reserva el máximo del modelo y produce un 413.
    body: JSON.stringify({ model: GROQ_MODEL, temperature, max_tokens: maxTokens, messages }),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Mensajes más claros para los errores más comunes de Groq.
    if (res.status === 413) {
      throw new Error(
        "La consulta superó el límite de tokens del plan gratuito de Groq. Intenta de nuevo en unos segundos o usa el modelo 'groq/compound-mini'."
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("API Key de Groq inválida o sin permisos. Revísala en Configuración.");
    }
    if (res.status === 429) {
      throw new Error("Demasiadas solicitudes a Groq. Espera un momento e inténtalo de nuevo.");
    }
    throw new Error(`Groq respondió ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message || {};
  return {
    content: message.content || "",
    executedTools: message.executed_tools || [],
  };
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
    const { content, executedTools } = await callGroq(
      [
        {
          role: "system",
          content:
            "Eres un asistente experto en precios de materiales de construcción en Colombia. Usas búsqueda web para obtener datos reales y respondes solo con JSON.",
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

    return {
      status: 200,
      data: {
        price: data.newPrice,
        lastUpdated: getToday(),
        url: finalUrl || currentUrl || "",
        supplier: data.supplier || currentSupplier,
        trend: ["up", "down", "stable"].includes(data.trend) ? data.trend : "stable",
        description: data.reason || "",
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
    const { content } = await callGroq(
      [
        {
          role: "system",
          content:
            "Eres un analista del sector construcción en Colombia. Usas búsqueda web para datos actuales.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.4, apiKey, maxTokens: 1024 }
    );
    return { status: 200, data: { report: content || "No se obtuvo respuesta." } };
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
