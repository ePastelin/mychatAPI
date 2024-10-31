import express from "express";
import { createServer } from "http";
import { getConnection } from "./database/config.js";
import cors from "cors";
import setupWebSocket from "./services/websocket.js";
import routes from "./routes/index.js";
import { pool } from "./database/config.js";
import path from "path";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

export const wss = setupWebSocket(server, pool);

getConnection();

app.use(cors());
app.use(express.json());

app.use(routes);

app.use('/multimedia', express.static(path.join(__dirname, 'multimedia')));

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log("El servidor está escuchando en el puerto: " + PORT);
  });
}
