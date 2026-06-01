import { Material } from "../types";

// URL del backend (Express + Groq). Se puede sobreescribir con VITE_API_URL.
const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3001";

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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
