import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // En producción, especificar el dominio del frontend
        methods: ["GET", "POST"]
    }
});

// Simulación de Base de Datos en Memoria (Hasta conectar con DB real)
let materialsCache = {};

io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado:", socket.id);

    // Cuando un usuario actualiza un precio desde el Frontend
    socket.on("updatePrice", (data) => {
        console.log("Precio actualizado recibido:", data);

        // Aquí iría la lógica de actualización en Base de Datos (PostgreSQL/Supabase)
        /*
          await db.query('UPDATE materials SET price = $1 WHERE id = $2', [data.price, data.id]);
          await db.query('INSERT INTO price_history ...');
        */

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

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Servidor Socket.io corriendo en puerto ${PORT}`);
});
