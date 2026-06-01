import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
    runUpdatePrice,
    runMarketReport,
    runValidateKey,
    resolveApiKey,
    groqConfigured,
    GROQ_MODEL,
} from '../api/_groq.js';

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
//  API de Groq (búsqueda web en tiempo real) — misma lógica que Vercel
// ====================================================================
app.post('/api/update-price', async (req, res) => {
    const apiKey = resolveApiKey({ headers: req.headers, body: req.body });
    const { status, data } = await runUpdatePrice({ body: req.body || {}, apiKey });
    res.status(status).json(data);
});

app.post('/api/market-report', async (req, res) => {
    const apiKey = resolveApiKey({ headers: req.headers, body: req.body });
    const { status, data } = await runMarketReport({ body: req.body || {}, apiKey });
    res.status(status).json(data);
});

app.post('/api/validate-key', async (req, res) => {
    const apiKey = resolveApiKey({ headers: req.headers, body: req.body });
    const { status, data } = await runValidateKey(apiKey);
    res.status(status).json(data);
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true, model: GROQ_MODEL, groqConfigured: groqConfigured() });
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
    console.log(`Servidor Socket.io + API Groq corriendo en puerto ${PORT}`);
    if (!groqConfigured()) {
        console.warn("⚠️  GROQ_API_KEY no está en .env (puedes ingresarla desde la interfaz).");
    } else {
        console.log(`✅ Groq configurado con el modelo "${GROQ_MODEL}"`);
    }
});
