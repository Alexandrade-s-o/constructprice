// Gestión de las API Keys introducidas por el usuario desde la interfaz.
// Se guardan en el navegador (localStorage) y se envían al backend en cada llamada.
// - Cerebras: modelo de IA (obligatoria).
// - Tavily: búsqueda web real (opcional, para precios/reportes en vivo).

const CEREBRAS_KEY = "cerebras_api_key";
const TAVILY_KEY = "tavily_api_key";

const read = (k: string): string => {
  try {
    return localStorage.getItem(k) || "";
  } catch {
    return "";
  }
};

const write = (k: string, value: string): void => {
  try {
    if (value) localStorage.setItem(k, value.trim());
    else localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
};

export const getCerebrasKey = (): string => read(CEREBRAS_KEY);
export const setCerebrasKey = (v: string): void => write(CEREBRAS_KEY, v);

export const getTavilyKey = (): string => read(TAVILY_KEY);
export const setTavilyKey = (v: string): void => write(TAVILY_KEY, v);

// La app está "configurada" si al menos hay clave de Cerebras (la IA).
export const hasApiKey = (): boolean => getCerebrasKey().length > 0;
