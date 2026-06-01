// Gestión de la API Key de Groq introducida por el usuario desde la interfaz.
// Se guarda en el navegador (localStorage) y se envía al backend en cada llamada.

const STORAGE_KEY = "groq_api_key";

export const getApiKey = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

export const setApiKey = (key: string): void => {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

export const hasApiKey = (): boolean => getApiKey().length > 0;
