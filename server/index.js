import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// Carga automática de variables de entorno desde .env (Node 20.6+)
try {
    process.loadEnvFile('.env');
} catch (e) {
    // .env opcional: si no existe, se usan las variables del sistema
}

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // En producción, especificar el dominio del frontend
        methods: ["GET", "POST"]
    }
});

// ====================================================================
//  INTEGRACIÓN CON GROQ (Búsqueda web en tiempo real)
//  Usamos el modelo "groq/compound" que tiene búsqueda web integrada.
//  Docs: https://console.groq.com/docs/agentic-tooling
// ====================================================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Modelo agentico con web search en vivo. Se puede sobreescribir con GROQ_MODEL.
const GROQ_MODEL = process.env.GROQ_MODEL || "groq/compound";

const getToday = () => new Date().toISOString().split('T')[0];

/**
 * Limpia el texto de respuesta para extraer el JSON válido.
 */
const cleanJsonString = (text) => {
    let clean = (text || "").trim();
    if (clean.includes('```')) {
        const match = clean.match(/```(?:json)?([\s\S]*?)```/);
        if (match) clean = match[1];
        else clean = clean.replace(/```(json)?/g, '').replace(/```/g, '');
    }
    // Si hay texto alrededor, intentar quedarse con el primer objeto JSON.
    const first = clean.indexOf('{');
    const last = clean.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
        clean = clean.slice(first, last + 1);
    }
    return clean.trim();
};

/**
 * Resuelve la API Key a usar: primero la que envía el usuario desde la interfaz
 * (cabecera x-groq-key o campo apiKey en el cuerpo) y, si no, la del entorno (.env).
 */
const resolveApiKey = (req) => {
    const fromHeader = req?.headers?.['x-groq-key'];
    const fromBody = req?.body?.apiKey;
    return (fromHeader || fromBody || GROQ_API_KEY || "").trim();
};

/**
 * Llama a la API de Groq y devuelve el contenido del mensaje + herramientas usadas.
 */
const callGroq = async (messages, { temperature = 0.2, apiKey } = {}) => {
    const key = apiKey || GROQ_API_KEY;
    if (!key) {
        throw new Error("Falta la API Key de Groq. Ingrésala en la pantalla de Configuración o en el archivo .env");
    }

    const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            temperature,
            messages
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq respondió ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const message = data?.choices?.[0]?.message || {};
    return {
        content: message.content || "",
        executedTools: message.executed_tools || []
    };
};

/**
 * Intenta extraer una URL de fuente desde las herramientas de búsqueda ejecutadas.
 */
const extractUrlFromTools = (executedTools) => {
    for (const tool of executedTools || []) {
        const results =
            tool?.search_results?.results ||
            tool?.output?.results ||
            (Array.isArray(tool?.search_results) ? tool.search_results : null);
        if (Array.isArray(results)) {
            const hit = results.find(r => r?.url);
            if (hit) return hit.url;
        }
    }
    return null;
};

// --------------------------------------------------------------------
//  Endpoint: Buscar el precio real de un material en la web (Colombia)
// --------------------------------------------------------------------
app.post('/api/update-price', async (req, res) => {
    const { name, unit, url: currentUrl, supplier: currentSupplier } = req.body || {};

    if (!name) {
        return res.status(400).json({ error: "Falta el nombre del material." });
    }

    const prompt = `
BÚSQUEDA DE PRECIO REAL DE MATERIALES DE CONSTRUCCIÓN EN COLOMBIA (fecha de hoy: ${getToday()}).
Material: "${name}"
Unidad: ${unit || 'unidad'}

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
        const { content, executedTools } = await callGroq([
            { role: "system", content: "Eres un asistente experto en precios de materiales de construcción en Colombia. Usas búsqueda web para obtener datos reales y respondes solo con JSON." },
            { role: "user", content: prompt }
        ], { apiKey: resolveApiKey(req) });

        let data;
        try {
            data = JSON.parse(cleanJsonString(content));
        } catch (parseErr) {
            console.error("No se pudo parsear el JSON de Groq:", content);
            return res.status(502).json({ error: "La IA no devolvió un precio válido.", raw: content });
        }

        if (typeof data.newPrice !== 'number' || isNaN(data.newPrice)) {
            return res.status(502).json({ error: "La IA no encontró un precio numérico.", raw: content });
        }

        let finalUrl = data.url;
        if (!finalUrl || finalUrl === "" || /URL|ejemplo|placeholder/i.test(finalUrl)) {
            finalUrl = extractUrlFromTools(executedTools) || currentUrl || "";
        }

        const result = {
            price: data.newPrice,
            lastUpdated: getToday(),
            url: finalUrl || currentUrl || "",
            supplier: data.supplier || currentSupplier,
            trend: ['up', 'down', 'stable'].includes(data.trend) ? data.trend : 'stable',
            description: data.reason || ""
        };

        // Notificar a todos los clientes conectados en tiempo real.
        // (El id lo añade el cliente al emitir; aquí respondemos los datos.)
        res.json(result);
    } catch (error) {
        console.error("Error en /api/update-price:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// --------------------------------------------------------------------
//  Endpoint: Generar reporte de mercado de la construcción
// --------------------------------------------------------------------
app.post('/api/market-report', async (req, res) => {
    const { summary } = req.body || {};

    const prompt = `
Genera un reporte ejecutivo breve sobre el mercado de la construcción en Colombia HOY (${getToday()}).
Busca en internet noticias recientes sobre el precio del acero, el cemento y la TRM (dólar).
${summary ? `Compara con estos precios guardados del usuario: ${summary}.` : ''}
Tono profesional. Máximo 3 párrafos cortos. Responde en español.
`.trim();

    try {
        const { content } = await callGroq([
            { role: "system", content: "Eres un analista del sector construcción en Colombia. Usas búsqueda web para datos actuales." },
            { role: "user", content: prompt }
        ], { temperature: 0.4, apiKey: resolveApiKey(req) });

        res.json({ report: content || "No se obtuvo respuesta." });
    } catch (error) {
        console.error("Error en /api/market-report:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Healthcheck simple
app.get('/api/health', (req, res) => {
    res.json({ ok: true, model: GROQ_MODEL, groqConfigured: !!GROQ_API_KEY });
});

// Valida que una API Key de Groq sea correcta (consulta ligera al listado de modelos)
app.post('/api/validate-key', async (req, res) => {
    const key = resolveApiKey(req);
    if (!key) {
        return res.status(400).json({ valid: false, error: "No se proporcionó ninguna API Key." });
    }
    try {
        const r = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": `Bearer ${key}` }
        });
        if (r.ok) {
            return res.json({ valid: true });
        }
        const errText = await r.text();
        return res.status(200).json({ valid: false, error: `Groq rechazó la clave (${r.status}).`, detail: errText });
    } catch (error) {
        return res.status(500).json({ valid: false, error: error.message });
    }
});

// ====================================================================
//  TIEMPO REAL (WebSockets)
// ====================================================================
io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado:", socket.id);

    // Cuando un usuario actualiza un precio desde el Frontend
    socket.on("updatePrice", (data) => {
        console.log("Precio actualizado recibido:", data);

        // Emitir el evento a TODOS los usuarios conectados (Broadcast)
        io.emit("priceUpdated", {
            id: data.id,
            price: data.price,
            trend: data.trend,
            lastUpdated: new Date().toISOString()
        });
    });

    socket.on("disconnect", () => {
        console.log("Usuario desconectado:", socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor Socket.io + API Groq corriendo en puerto ${PORT}`);
    if (!GROQ_API_KEY) {
        console.warn("⚠️  GROQ_API_KEY no está configurada. Crea un archivo .env con GROQ_API_KEY=tu_clave");
    } else {
        console.log(`✅ Groq configurado con el modelo "${GROQ_MODEL}"`);
    }
});
