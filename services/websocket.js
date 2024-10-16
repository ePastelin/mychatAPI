import WebSocket, { WebSocketServer } from 'ws';
import { getChatDetails, saveMessageToDatabase, updateMessageStatus } from '../helpers/querys.js';
import { sendMultimedia, sendWhatsAppMessage } from '../helpers/whatsapp.js';
import formatDate from '../helpers/formatDate.js';

const setupWebSocket = (server, pool) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {

        ws.on('message', async (data) => {
            const parsedData = JSON.parse(data);
            const { message, idChat, action, idMessage } = parsedData;

            try {
                if (action === 'message_read') {
                    await updateMessageStatus(pool, idMessage, 'read');
                    await pool.query('UPDATE chat SET unread = 0 WHERE id = ?', [idChat]);

                    notifyClients(wss, idMessage, idChat, null, 'message_read');
                } else {
                    const { our_number, socio_number } = await getChatDetails(pool, idChat);
                    const messageId = await sendWhatsAppMessage(our_number, socio_number, message);

                    await saveMessageToDatabase(pool, messageId, idChat, message);

                    notifyClients(wss, messageId, idChat, message, 'message');
                }
            } catch (error) {
                console.error('Error al manejar el mensaje:', error);
            }
        });
    });

    return wss;
};

const notifyClients = (wss, messageId, idChat, message, action) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                action: action || 'message',
                idMessage: messageId,
                idChat,
                message,
                sender: 1, // Indica que el usuario envió el mensaje
                date: Date.now(),
                status: action === 'message_read' ? 'read' : 'sent'
            }));
        }
    });
};

export default setupWebSocket;
