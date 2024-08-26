// websocket.js
import WebSocket, { WebSocketServer } from 'ws';
import axios from 'axios';
import { pool } from '../database/config.js'; // Asegúrate de importar la conexión a la base de datos
import formatDate from '../helpers/formatDate.js';

const setupWebSocket = (server) => {
    const wss = new WebSocketServer({ server });
    const date = formatDate(Date.now())

    wss.on('connection', (ws) => {
        console.log('Nuevo cliente conectado');

        ws.on('message', async (data) => {
            const parsedData = JSON.parse(data);
            const { message, idChat } = parsedData;

            try {
                // Obtén los números relacionados a ese chat
                const [rows] = await pool.query('SELECT our_number, socio_number FROM chat WHERE id = ?', [idChat]);
                const { our_number, socio_number } = rows[0];

                // Configura la solicitud a la API de WhatsApp
                const url = `https://graph.facebook.com/v20.0/${our_number}/messages`;
                const accessToken = 'EAAwzliYKTZBwBO65SDKzG1KVx0LdkGxYSXOWV8DCscUbwBXEnQCm0a8WgKcTYNMZBCtRRlfGslSt3kzwaKtiXqUPtSrmKSMPzWVq3aKGYM9bHrlwbQ5igZCqlQem769DiHHPt1BxKDQ3aIcTZBN1IVnK02ZBAS0HxEBzhj5nZAqDsWyGqYGfHY10tvJdgmTDqWFQZDZD'; // Cambia esto por tu token válido
                const whatsappData = {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: socio_number, 
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: message 
                    }
                };

                // Envía el mensaje a través de la API de WhatsApp
                const response = await axios.post(url, whatsappData, {
                    params: {
                        access_token: accessToken
                    }
                });

                const { data } = response

                const { id } = data.messages[0]

                console.log('Respuesta de la API de WhatsApp:', response.data);

                // Inserta el mensaje en la base de datos
                const result = await pool.query(
                    'INSERT INTO message (id, chat_id, sender, message, date) VALUES (?, ?, 1, ?, ?)', 
                    [id, idChat, message, date]
                );
                console.log('Mensaje guardado en la BD:', result);

                // Notificar a todos los clientes conectados que hay un nuevo mensaje
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            idChat,
                            message,
                            sender: 1, // Indica que el usuario envió el mensaje
                            date: date,
                            status: 'sent'
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
