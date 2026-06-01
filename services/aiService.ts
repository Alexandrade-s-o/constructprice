import { Material } from "../types";
import { getGroqKey, getTavilyKey } from "./apiKey";

// URL del backend (Express + funciones serverless).
// - En producción (Vercel) usa rutas relativas ("") → las funciones serverless de /api.
// - En desarrollo apunta al servidor local (puerto 3001).
// - Se puede sobreescribir con VITE_API_URL.
const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:3001" : "");

// Cabeceras con las API Keys que el usuario ingresó en la interfaz (si existen).
const buildHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const groq = getGroqKey();
  const tavily = getTavilyKey();
  if (groq) headers["x-groq-key"] = groq;
  if (tavily) headers["x-tavily-key"] = tavily;
  return headers;
};

/** Valida una API Key de Groq contra el backend. */
export const validateApiKey = async (
  key: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_URL}/api/validate-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-groq-key": key },
      body: JSON.stringify({ groqKey: key }),
    });
    return await res.json();
  } catch (error) {
    return {
      valid: false,
      error:
        "No se pudo conectar con el servidor. Verifica que el backend esté corriendo (npm run server).",
    };
  }
};

/**
 * Busca el precio real de un material en la web usando Groq (modelo con búsqueda web).
 * La llamada se hace al backend para no exponer la API Key en el navegador.
 */
export const updateMaterialWithAI = async (
  material: Material
): Promise<Partial<Material> | null> => {
  try {
    const res = await fetch(`${API_URL}/api/update-price`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        name: material.name,
        unit: material.unit,
        url: material.url,
        supplier: material.supplier,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Error al actualizar precio:", err.error || res.statusText);
      return null;
    }

    const data = await res.json();
    return {
      price: data.price,
      lastUpdated: data.lastUpdated,
      url: data.url || material.url,
      supplier: data.supplier || material.supplier,
      trend: data.trend as "up" | "down" | "stable",
      description: data.description,
    };
  } catch (error) {
    console.error("No se pudo conectar con el servidor de precios:", error);
    return null;
  }
};

/**
 * Genera un reporte de mercado de la construcción en Colombia usando Groq.
 */
export const generateMarketReport = async (
  materials: Material[]
): Promise<string> => {
  try {
    const summary = materials
      .map((m) => `${m.name}: $${m.price} COP`)
      .slice(0, 8)
      .join(", ");

    const res = await fetch(`${API_URL}/api/market-report`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ summary }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return `No se pudo generar el reporte: ${err.error || res.statusText}`;
    }

    const data = await res.json();
    return data.report || "No se obtuvo respuesta del servidor.";
  } catch (error) {
    console.error("Error al generar reporte:", error);
    return "No se pudo conectar con el servidor. Verifica que el backend esté corriendo (node server/index.js).";
  }
};
