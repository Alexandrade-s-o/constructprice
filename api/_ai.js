// Lógica compartida de IA: Cerebras (modelo LLM) + Tavily (búsqueda web real).
// Usada tanto por las funciones serverless de Vercel (/api) como por el
// servidor local de desarrollo (server/index.js).

const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
export const AI_MODEL = process.env.CEREBRAS_MODEL || "llama-3.3-70b";
const ENV_CEREBRAS_KEY = process.env.CEREBRAS_API_KEY;
const ENV_TAVILY_KEY = process.env.TAVILY_API_KEY;

export const aiConfigured = () => !!ENV_CEREBRAS_KEY;
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

/** Resuelve la API Key de Cerebras (cabecera x-cerebras-key, cuerpo o entorno). */
export const resolveCerebrasKey = ({ headers = {}, body = {} } = {}) => {
  const fromHeader = headers["x-cerebras-key"] || headers["X-Cerebras-Key"];
  return (fromHeader || body.cerebrasKey || ENV_CEREBRAS_KEY || "").trim();
};

/** Resuelve la API Key de Tavily (búsqueda web real). */
export const resolveTavilyKey = ({ headers = {}, body = {} } = {}) => {
  const fromHeader = headers["x-tavily-key"] || headers["X-Tavily-Key"];
  return (fromHeader || body.tavilyKey || ENV_TAVILY_KEY || "").trim();
};

/** Llama al modelo de Cerebras (API compatible con OpenAI). */
export const callCerebras = async (messages, { temperature = 0.2, apiKey, maxTokens = 1024 } = {}) => {
  const key = apiKey || ENV_CEREBRAS_KEY;
  if (!key) {
    const err = new Error(
      "Falta la API Key de Cerebras. Ingrésala en la pantalla de Configuración."
    );
    err.status = 401;
    throw err;
  }

  const res = await fetch(CEREBRAS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: AI_MODEL, temperature, max_tokens: maxTokens, messages }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let message;
    if (res.status === 401 || res.status === 403) {
      message = "API Key de Cerebras inválida o sin permisos. Revísala en Configuración.";
    } else if (res.status === 429) {
      message = "Demasiadas solicitudes a Cerebras. Espera un momento e inténtalo de nuevo.";
    } else {
      message = `Cerebras respondió ${res.status}: ${errText}`;
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
};

/** Busca en la web con Tavily. Devuelve un array de { title, url, content }. */
export const tavilySearch = async (query, apiKey, maxResults = 6) => {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: "basic",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    const e = new Error(`Tavily respondió ${res.status}: ${t}`);
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
};

/** Construye un bloque de contexto a partir de resultados de búsqueda. */
const buildSearchContext = (results) =>
  results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${(r.content || "").slice(0, 600)}`)
    .join("\n\n");

/** Normaliza los datos de precio devueltos por el modelo. */
const buildPriceData = (parsed, { url, currentUrl, currentSupplier, liveSearch }) => {
  const reason = parsed.reason || "";
  const description = liveSearch
    ? reason
    : `Estimado (sin búsqueda web en vivo). ${reason}`.trim();
  return {
    price: parsed.newPrice,
    lastUpdated: getToday(),
    url: url || currentUrl || "",
    supplier: parsed.supplier || currentSupplier,
    trend: ["up", "down", "stable"].includes(parsed.trend) ? parsed.trend : "stable",
    description,
    estimated: !liveSearch,
  };
};

const PRICE_FORMAT = `
RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO, SIN TEXTO ADICIONAL, CON ESTE FORMATO EXACTO:
{
  "newPrice": number,
  "url": "URL verificable de la fuente del precio",
  "supplier": "Nombre de la tienda o ferretería",
  "reason": "Detalle breve del proveedor o ubicación",
  "trend": "up" | "down" | "stable"
}`.trim();

/** Busca el precio real de un material. Devuelve { status, data }. */
export const runUpdatePrice = async ({ body = {}, cerebrasKey, tavilyKey } = {}) => {
  const { name, unit, url: currentUrl, supplier: currentSupplier } = body;
  if (!name) {
    return { status: 400, data: { error: "Falta el nombre del material." } };
  }

  try {
    // ---- Camino A: búsqueda web REAL con Tavily + Cerebras ----
    if (tavilyKey) {
      try {
        const results = await tavilySearch(
          `precio ${name} ${unit || ""} construcción ferretería Colombia`,
          tavilyKey,
          6
        );
        if (results.length) {
          const context = buildSearchContext(results);
          const content = await callCerebras(
            [
              {
                role: "system",
                content:
                  "Eres experto en precios de materiales de construcción en Colombia. Extrae el precio real (en COP) a partir de los RESULTADOS DE BÚSQUEDA WEB y usa una de sus URLs como fuente. " +
                  PRICE_FORMAT,
              },
              {
                role: "user",
                content: `Material: "${name}" (unidad: ${unit || "unidad"}).\n\nRESULTADOS DE BÚSQUEDA WEB:\n${context}`,
              },
            ],
            { temperature: 0.1, apiKey: cerebrasKey, maxTokens: 700 }
          );
          const parsed = JSON.parse(cleanJsonString(content));
          if (typeof parsed.newPrice === "number" && !isNaN(parsed.newPrice)) {
            const urls = results.map((r) => r.url);
            const url = urls.includes(parsed.url) ? parsed.url : urls[0];
            return {
              status: 200,
              data: buildPriceData(parsed, { url, currentUrl, currentSupplier, liveSearch: true }),
            };
          }
        }
      } catch (e) {
        console.error("Búsqueda Tavily falló, se usa solo Cerebras:", e.message);
      }
    }

    // ---- Camino B: Cerebras sin búsqueda (estimado por conocimiento del modelo) ----
    const content = await callCerebras(
      [
        {
          role: "system",
          content:
            "Eres experto en precios de materiales de construcción en Colombia. Da tu mejor estimación de precio en COP. " +
            PRICE_FORMAT,
        },
        { role: "user", content: `Material: "${name}" (unidad: ${unit || "unidad"}).` },
      ],
      { temperature: 0.2, apiKey: cerebrasKey, maxTokens: 700 }
    );

    let parsed;
    try {
      parsed = JSON.parse(cleanJsonString(content));
    } catch {
      return { status: 502, data: { error: "La IA no devolvió un precio válido.", raw: content } };
    }
    if (typeof parsed.newPrice !== "number" || isNaN(parsed.newPrice)) {
      return { status: 502, data: { error: "La IA no encontró un precio numérico.", raw: content } };
    }
    return {
      status: 200,
      data: buildPriceData(parsed, { url: currentUrl, currentUrl, currentSupplier, liveSearch: false }),
    };
  } catch (error) {
    return { status: error.status || 500, data: { error: error.message } };
  }
};

/** Genera el reporte de mercado. Devuelve { status, data }. */
export const runMarketReport = async ({ body = {}, cerebrasKey, tavilyKey } = {}) => {
  const { summary } = body;
  const basePrompt = `
Genera un reporte ejecutivo breve sobre el mercado de la construcción en Colombia HOY (${getToday()}).
Analiza el precio del acero, el cemento y la TRM (dólar).
${summary ? `Compara con estos precios guardados del usuario: ${summary}.` : ""}
Tono profesional. Máximo 3 párrafos cortos. Responde en español.
`.trim();

  try {
    // ---- Camino A: búsqueda web REAL con Tavily + Cerebras ----
    if (tavilyKey) {
      try {
        const results = await tavilySearch(
          `noticias precio acero cemento TRM dólar construcción Colombia ${getToday()}`,
          tavilyKey,
          6
        );
        if (results.length) {
          const context = buildSearchContext(results);
          const content = await callCerebras(
            [
              {
                role: "system",
                content:
                  "Eres un analista del sector construcción en Colombia. Redacta el reporte usando los RESULTADOS DE BÚSQUEDA WEB reales que se te dan.",
              },
              { role: "user", content: `${basePrompt}\n\nRESULTADOS DE BÚSQUEDA WEB:\n${context}` },
            ],
            { temperature: 0.4, apiKey: cerebrasKey, maxTokens: 1024 }
          );
          return { status: 200, data: { report: content || "No se obtuvo respuesta.", liveSearch: true } };
        }
      } catch (e) {
        console.error("Búsqueda Tavily falló, se usa solo Cerebras:", e.message);
      }
    }

    // ---- Camino B: Cerebras sin búsqueda ----
    const content = await callCerebras(
      [
        { role: "system", content: "Eres un analista del sector construcción en Colombia." },
        { role: "user", content: basePrompt },
      ],
      { temperature: 0.4, apiKey: cerebrasKey, maxTokens: 1024 }
    );
    const note =
      "⚠️ Reporte basado en el conocimiento del modelo (sin búsqueda web en vivo). Agrega una API Key de Tavily en Configuración para datos en tiempo real.\n\n";
    return { status: 200, data: { report: note + (content || "No se obtuvo respuesta."), liveSearch: false } };
  } catch (error) {
    return { status: error.status || 500, data: { error: error.message } };
  }
};

/** Valida una API Key de Cerebras haciendo una llamada mínima al endpoint real de chat. */
export const runValidateKey = async (apiKey) => {
  if (!apiKey) {
    return { status: 400, data: { valid: false, error: "No se proporcionó ninguna API Key." } };
  }
  try {
    await callCerebras([{ role: "user", content: "ping" }], {
      apiKey,
      maxTokens: 1,
      temperature: 0,
    });
    return { status: 200, data: { valid: true } };
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return {
        status: 200,
        data: {
          valid: false,
          error:
            "Cerebras rechazó la clave (inválida o sin permisos). Verifica que copiaste tu API Key de Cerebras (empieza con 'csk-') desde cloud.cerebras.ai, sin espacios.",
        },
      };
    }
    return { status: 200, data: { valid: false, error: error.message } };
  }
};

/** Aplica cabeceras CORS y responde OPTIONS. Devuelve true si era preflight. */
export const applyCors = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-cerebras-key, x-tavily-key");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
};
