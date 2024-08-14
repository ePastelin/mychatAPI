import express from 'express';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws'; 
import webhook from './routes/webhook.routes.js';
import chat from './routes/chat.routes.js';
import auth from './routes/auth.routes.js';
// import { getConnection } from './database/config.js';
import cors from 'cors';

const app = express();
const server = createServer(app);  // Combina el servidor HTTP y Express
const PORT = process.env.PORT || 3000;

// Inicializa el WebSocket Server
export const wss = new WebSocketServer({ server });

// Database connection
// getConnection();

app.use(cors());
app.use(express.json());
app.use("/api", webhook);
app.use('/api/chat', chat);
app.use('/api/auth', auth);

// Configura el WebSocket Server
wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');
    ws.on('message', (message) => {
        console.log('Mensaje recibido:', message);
    });
});

server.listen(PORT, () => {
    console.log("El servidor está escuchando en el puerto: " + PORT);
});
