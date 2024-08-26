import express from 'express';
import { createServer } from 'http';
import webhook from './routes/webhook.routes.js';
import chat from './routes/chat.routes.js';
import auth from './routes/auth.routes.js';
import { getConnection } from './database/config.js';
import cors from 'cors';
import setupWebSocket from './services/websocket.js';
import routes from './routes/index.js'

const app = express();
const server = createServer(app);  // Combina el servidor HTTP y Express
const PORT = process.env.PORT || 3000;

// Inicializa el WebSocket Server
export const wss = setupWebSocket(server)

// Database connection
getConnection();

app.use(cors());
app.use(express.json());


app.use("/api", webhook);
app.use('/api/chat', chat);
app.use('/api/auth', auth);



server.listen(PORT, () => {
    console.log("El servidor está escuchando en el puerto: " + PORT);
});
