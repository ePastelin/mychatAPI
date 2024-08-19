// websocket.js
import WebSocket, { WebSocketServer } from 'ws';
import { pool } from './database/config.js'; // Asegúrate de importar la conexión a la base de datos

const setupWebSocket = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('Nuevo cliente conectado');

        ws.on('message', async (data) => {
            const parsedData = JSON.parse(data);
            const { message, idChat } = parsedData;

            try {
                // Inserta el mensaje en la base de datos
                const result = await pool.query(
                    'INSERT INTO message (chat_id, sender, message) VALUES (?, 1, ?)', 
                    [idChat, message]
                );
                console.log('Mensaje guardado en la BD:', result);

                // Notificar a todos los clientes conectados que hay un nuevo mensaje
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            idChat,
                            message,
                            sender: 1, // Indica que el usuario envió el mensaje
                        }));
                    }
                });
            } catch (error) {
                console.error('Error al guardar el mensaje o enviar a los clientes:', error);
            }
        });
    });

    return wss;
};

export default setupWebSocket;
