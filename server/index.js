import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
    runUpdatePrice,
    runMarketReport,
    runValidateKey,
    resolveCerebrasKey,
    resolveTavilyKey,
    aiConfigured,
    AI_MODEL,
} from '../api/_ai.js';

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
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ====================================================================
//  API de IA (Cerebras + Tavily) — misma lógica que Vercel
// ====================================================================
app.post('/api/update-price', async (req, res) => {
    const cerebrasKey = resolveCerebrasKey({ headers: req.headers, body: req.body });
    const tavilyKey = resolveTavilyKey({ headers: req.headers, body: req.body });
    const { status, data } = await runUpdatePrice({ body: req.body || {}, cerebrasKey, tavilyKey });
    res.status(status).json(data);
});

app.post('/api/market-report', async (req, res) => {
    const cerebrasKey = resolveCerebrasKey({ headers: req.headers, body: req.body });
    const tavilyKey = resolveTavilyKey({ headers: req.headers, body: req.body });
    const { status, data } = await runMarketReport({ body: req.body || {}, cerebrasKey, tavilyKey });
    res.status(status).json(data);
});

app.post('/api/validate-key', async (req, res) => {
    const cerebrasKey = resolveCerebrasKey({ headers: req.headers, body: req.body });
    const { status, data } = await runValidateKey(cerebrasKey);
    res.status(status).json(data);
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true, model: AI_MODEL, cerebrasConfigured: aiConfigured() });
});

// ====================================================================
//  TIEMPO REAL (WebSockets) — solo en el servidor local
// ====================================================================
io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado:", socket.id);

    socket.on("updatePrice", (data) => {
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
    console.log(`Servidor Socket.io + API IA corriendo en puerto ${PORT}`);
    if (!aiConfigured()) {
        console.warn("⚠️  CEREBRAS_API_KEY no está en .env (puedes ingresarla desde la interfaz).");
    } else {
        console.log(`✅ Cerebras configurado con el modelo "${AI_MODEL}"`);
    }
});
