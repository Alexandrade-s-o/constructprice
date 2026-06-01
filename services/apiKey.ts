// Gestión de las API Keys introducidas por el usuario desde la interfaz.
// Se guardan en el navegador (localStorage) y se envían al backend en cada llamada.
// - Groq: modelo de IA (obligatoria).
// - Tavily: búsqueda web real (opcional, para precios/reportes en vivo).

const GROQ_KEY = "groq_api_key";
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

export const getGroqKey = (): string => read(GROQ_KEY);
export const setGroqKey = (v: string): void => write(GROQ_KEY, v);

export const getTavilyKey = (): string => read(TAVILY_KEY);
export const setTavilyKey = (v: string): void => write(TAVILY_KEY, v);

// La app está "configurada" si al menos hay clave de Groq (la IA).
export const hasApiKey = (): boolean => getGroqKey().length > 0;
