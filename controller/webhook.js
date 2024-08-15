
import { pool } from '../database/config.js';
import { wss } from '../index.js'
import 'dotenv/config';

const { WEBHOOK_VERIFY_TOKEN } = process.env;

export const verificar = async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
  
    // check the mode and token sent are correct
    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
      // respond with 200 OK and challenge token from the request
      res.status(200).send(challenge);
      console.log("Webhook verified successfully!");
    } else {
      // respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
};

// Suponiendo que tienes acceso al WebSocket Server (wss)
export const recibir = (req, res) => {  // Recibes el objeto WebSocket Server (wss)
    try {
        // var entry = req.body["entry"] ? req.body["entry"][0] : undefined;
        // var changes = entry ? entry["changes"][0] : undefined;
        // var value = changes ? changes["value"] : undefined;
        // var metadata = value ? value["metadata"] : undefined;
        // var contacts = value ? value["contacts"] : undefined;
        // var messages = value ? value["messages"] : undefined;

        // if (messages === undefined) return;

        // if (metadata && messages && contacts) {
        //     const { display_phone_number, phone_number_id } = metadata;

        //     const formattedMessages = messages.map(message => {
        //         if (message.text) {
        //             return {
        //                 ...message,
        //                 text: message.text.body
        //             };
        //         }
        //         return message;
        //     });

        //     const { name } = contacts[0].profile;

        //     const bodyJSON = JSON.stringify(req.body, null, 2)
        //     const message = req.body["entry"][0]["changes"][0]["value"]["messages"]
        //     console.log(message)

        //     // Aquí es donde puedes transmitir el mensaje a través del WebSocket
        //     const newMessage = {
        //         display_phone_number,
        //         phone_number_id,
        //         messages: formattedMessages,
        //         name
        //     };

            // Transmitir el nuevo mensaje a todos los clientes conectados
            wss.clients.forEach(client => {
                if (client.readyState === 1) { // 1 es el valor de WebSocket.OPEN
                    console.log('Enviando mensaje a través de WebSocket:', messages);
                    client.send(JSON.stringify({
                        idChat: 1,
                        message,
                        sender: 0, // Indica que el usuario envió el mensaje
                    }));
                }
            });

            console.log(newMessage);
            res.json(newMessage);
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

