import WebSocket, { WebSocketServer } from 'ws';
import { getChatDetails, saveMessageToDatabase, updateMessageStatus } from '../helpers/querys.js';
import { sendMultimedia, sendWhatsAppMessage } from '../helpers/whatsapp.js';
import formatDate from '../helpers/formatDate.js';

const setupWebSocket = (server, pool) => {
    const wss = new WebSocketServer({ server });
    const date = formatDate(Date.now());

    wss.on('connection', (ws) => {
        console.log('Nuevo cliente conectado');

        ws.on('message', async (data) => {
            const parsedData = JSON.parse(data);
            console.log(parsedData)
            const { message, idChat, action, idMessage } = parsedData;

            try {
                if (action === 'message_read') {
                    // Actualiza el estado del mensaje a 'read' en la base de datos
                    await updateMessageStatus(pool, idMessage, 'read');

                    await pool.query('UPDATE chat SET unread = 0 WHERE id = ?', [idChat]);

                    
                    // Notifica a los demás clientes que el mensaje fue leído
                    notifyClients(wss, idMessage, idChat, null, 'message_read');
                } else {
                    // Obtener detalles del chat desde la base de datos
                    const { our_number, socio_number } = await getChatDetails(pool, idChat);

                    // Enviar el mensaje a través de la API de WhatsApp

                    if (parsedData.file) {
                        const { file, mimeType } = parsedData
                        sendMultimedia(our_number, socio_number, file, mimeType)

                        console.log('Entré aquí')
                    }

                    const messageId = await sendWhatsAppMessage(our_number, socio_number, message);

                    // Guardar el mensaje en la base de datos
                    const result = await saveMessageToDatabase(pool, messageId, idChat, message);
                    console.log('Mensaje guardado en la BD:', result);

                    // Notificar a todos los clientes conectados
                    console.log("Entro a notificar")
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
