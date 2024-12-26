import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import cors from "cors";
import path from "path";
import { getConnection, pool } from "./database/config.js";
import setupWebSocket from "./services/websocket.js";
import routes from "./routes/index.js";
import __dirname from "./helpers/getDirname.cjs";

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("CERT_PATH:", process.env.CERT_PATH);

const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === "true";

const app = express();
const server = USE_HTTPS
  ? https.createServer(
      {
        cert: fs.readFileSync(process.env.CERT_PATH),
        key: fs.readFileSync(process.env.KEY_PATH),
        cert: fs.readFileSync(process.env.CA_PATH),
      },
      app
    )
  : http.createServer(app);

export const wss = setupWebSocket(server, pool);

getConnection();

app.use(cors());
app.use(express.json());
app.use(routes);

app.use("/multimedia", express.static(path.join(__dirname, "multimedia")));

server.listen(PORT, () => {
  console.log(`Servidor ${USE_HTTPS ? "HTTPS" : "HTTP"} escuchando en el puerto ${PORT}`);
});