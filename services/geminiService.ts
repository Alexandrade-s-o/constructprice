import { GoogleGenAI } from "@google/genai";
import { Material } from "../types";

// Helper to get today's date YYYY-MM-DD
const getToday = () => new Date().toISOString().split('T')[0];

/**
 * Limpia el texto de respuesta para extraer el JSON válido.
 */
const cleanJsonString = (text: string): string => {
  let clean = text.trim();
  // Remove markdown code blocks if present
  if (clean.includes('```')) {
    const match = clean.match(/```(?:json)?([\s\S]*?)```/);
    if (match) clean = match[1];
    else clean = clean.replace(/```(json)?/g, '').replace(/```/g, '');
  }
  return clean.trim();
};

export const updateMaterialWithAI = async (material: Material): Promise<Partial<Material> | null> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    console.warn("Se requiere una API Key de Gemini válida.");
    return null;
  }

  try {
    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      tools: [{ googleSearch: {} }]
    });

    const prompt = `
      BUSQUEDA DE PRECIO REAL DE MATERIALES DE CONSTRUCCIÓN EN COLOMBIA
      Material: "${material.name}"
      Unidad: ${material.unit}
      
      OBJETIVO: Encontrar el precio más actual y la fuente exacta.

      INSTRUCCIONES DE BÚSQUEDA AVANZADA:
      1. Prioriza grandes superficies: Homecenter, Easy, Constructor, Ferretería Samir.
      2. BUSCA TAMBIÉN EN FERRETERÍAS LOCALES: Busca en Facebook Marketplace Colombia, Instagram de ferreterías, o páginas de ferreterías locales (ej. "Ferretería en Bogotá", "Depósito de materiales Medellín").
      3. Si encuentras un precio en MercadoLibre, úsalo si es de un vendedor confiable.
      
      REQUISITO OBLIGATORIO:
      - DEBES proveer un LINK (URL) verificable de donde sacaste el precio.
      - Si es una ferretería local sin web, busca su página de Facebook o Instagram y usa ese link.
  
      RESPUESTA (JSON):
      {
        "newPrice": number,
        "url": "LINK_OBLIGATORIO_DE_LA_FUENTE",
        "supplier": "Nombre de la Ferretería o Tienda",
        "reason": "Ubicación o detalle del proveedor (ej. 'Ferretería El Martillo - Bogotá')",
        "trend": "up" | "down" | "stable"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    console.log("AI Response for", material.name, ":", textResponse);

    try {
      const jsonStr = cleanJsonString(textResponse);
      const data = JSON.parse(jsonStr);

      // Intentar recuperar URL de los metadatos de búsqueda si no está en el JSON
      let finalUrl = data.url;
      const grounding = response.groundingMetadata;
      if ((!finalUrl || finalUrl === "" || finalUrl.includes("URL_DIRECTA")) && grounding?.groundingChunks) {
        const webChunk = grounding.groundingChunks.find((chunk: any) => chunk.web?.uri);
        if (webChunk) finalUrl = webChunk.web.uri;
      }

      if (data.newPrice) {
        return {
          price: data.newPrice,
          lastUpdated: getToday(),
          url: finalUrl && finalUrl !== "" ? finalUrl : material.url,
          supplier: data.supplier || material.supplier,
          trend: data.trend as 'up' | 'down' | 'stable',
          description: data.reason
        };
      }
    } catch (parseError) {
      console.error("Error al procesar JSON de la IA:", parseError, "Response:", textResponse);
    }
  } catch (error) {
    console.error("Error en updateMaterialWithAI para", material.name, ":", error);
  }
  return null;
};

export const generateMarketReport = async (materials: Material[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") return "Se requiere una API Key válida.";

  try {
    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      tools: [{ googleSearch: {} }]
    });

    const summary = materials.map(m => `${m.name}: $${m.price} COP`).slice(0, 8).join(', ');

    const prompt = `
      Genera un reporte ejecutivo breve sobre el mercado de la construcción en Colombia HOY.
      Analiza noticias recientes de Homecenter, el precio del acero, el cemento y la TRM.
      Compara con mis precios guardados: ${summary}.
      Tono profesional, máximo 3 párrafos cortos.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error al generar reporte:", error);
    return "No se pudo generar el reporte en este momento. Verifique la conexión o API Key.";
  }
};