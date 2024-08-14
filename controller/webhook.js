
import { pool } from '../database/config.js';
import { wss } from '../index.js'

export const verificar = (req, res) => {
    try {
        var tokenandercode = "TOKENMETA";
        var token = req.query["hub.verify_token"];
        var challenge = req.query["hub.challenge"];

        if (challenge != null && token != null && token == tokenandercode) {
            res.send(challenge);
        } else {
            res.status(400).send();
        }
    } catch (e) {
        console.error('Error en la verificación:', e);
        res.status(400).send();
    }
};

// Suponiendo que tienes acceso al WebSocket Server (wss)
export const recibir = (req, res) => {  // Recibes el objeto WebSocket Server (wss)
    try {
        var entry = req.body["entry"] ? req.body["entry"][0] : undefined;
        var changes = entry ? entry["changes"][0] : undefined;
        var value = changes ? changes["value"] : undefined;
        var metadata = value ? value["metadata"] : undefined;
        var contacts = value ? value["contacts"] : undefined;
        var messages = value ? value["messages"] : undefined;

        if (messages === undefined) return;

        if (metadata && messages && contacts) {
            const { display_phone_number, phone_number_id } = metadata;

            const formattedMessages = messages.map(message => {
                if (message.text) {
                    return {
                        ...message,
                        text: message.text.body
                    };
                }
                return message;
            });

            const { name } = contacts[0].profile;

            // Aquí es donde puedes transmitir el mensaje a través del WebSocket
            const newMessage = {
                display_phone_number,
                phone_number_id,
                messages: formattedMessages,
                name
            };

            // Transmitir el nuevo mensaje a todos los clientes conectados
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(newMessage));
                }
            });

            console.log(newMessage);
            res.json(newMessage);
        } else {
            throw new Error("value, messages, or contacts is undefined");
        }
    } catch (e) {
        console.error('Error al procesar el mensaje:', e);
        res.send("EVENT_RECEIVED");
    }
};

export async function test(req, res) {
    const { message, idChat } = req.body;
    console.log('Datos recibidos:', { message, idChat });

    try {
        const [rows] = await pool.query('SELECT our_number, socio_number FROM chat WHERE id = ?', [idChat]);
        if (rows.length === 0) {
            throw new Error('No se encontró el chat con el ID proporcionado');
        }
        const { our_number, socio_number } = rows[0];
        console.log('Datos del chat:', { our_number, socio_number });

        // Simulación de envío de mensaje a través de WebSocket
        const simulatedResponse = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: socio_number,
            type: 'text',
            text: {
                preview_url: false,
                body: message
            }
        };

        // Simula la inserción del mensaje en la base de datos
        const envio = await pool.query('INSERT INTO message (chat_id, sender, message) VALUES (?, 0, ?)', [idChat, message]);
        console.log('Resultado de la inserción:', envio);

        // Notificar a todos los clientes conectados que hay un nuevo mensaje
        wss.clients.forEach(client => {
            if (client.readyState === 1) { // 1 es el valor de WebSocket.OPEN
                console.log('Enviando mensaje a través de WebSocket:', message);
                client.send(JSON.stringify({
                    idChat,
                    message,
                    sender: 0, // Indica que el usuario envió el mensaje
                }));
            }
        });

        res.json(simulatedResponse);
    } catch (error) {
        console.error('Error al simular el envío del mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

