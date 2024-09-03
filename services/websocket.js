import WebSocket, { WebSocketServer } from 'ws';
import { getChatDetails, saveMessageToDatabase } from '../helpers/querys.js';
import { sendWhatsAppMessage } from '../helpers/whatsapp.js';
import formatDate from '../helpers/formatDate.js';

const setupWebSocket = (server, pool) => {
    const wss = new WebSocketServer({ server });
    const date = formatDate(Date.now());

    wss.on('connection', (ws) => {
        console.log('Nuevo cliente conectado');

        ws.on('message', async (data) => {
            const parsedData = JSON.parse(data);
            const { message, idChat } = parsedData;

            try {
                // Obtener detalles del chat desde la base de datos
                const { our_number, socio_number } = await getChatDetails(pool, idChat);

                // Enviar el mensaje a través de la API de WhatsApp
                const messageId = await sendWhatsAppMessage(our_number, socio_number, message);

                // Guardar el mensaje en la base de datos
                const result = await saveMessageToDatabase(pool, messageId, idChat, message);
                console.log('Mensaje guardado en la BD:', result);

                // Notificar a todos los clientes conectados
                notifyClients(wss, messageId, idChat, message);
            } catch (error) {
                console.error('Error al manejar el mensaje:', error);
            }
        });
    });

    return wss;
};

const notifyClients = (wss, messageId, idChat, message) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                id: messageId,
                idChat,
                message,
                sender: 1, // Indica que el usuario envió el mensaje
                date: Date.now(),
                status: 'sent'
            }));
        }
    });
};

export default setupWebSocket;
