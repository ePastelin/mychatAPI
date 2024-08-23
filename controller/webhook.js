
import { pool } from '../database/config.js';
import formatNumber from '../helpers/formatNumber.js';
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
export const recibir = async (req, res) => {  // Recibes el objeto WebSocket Server (wss)
    try {
        var entry = req.body["entry"] ? req.body["entry"][0] : undefined;
        console.log("Aquí va el entry", entry)
        var changes = entry ? entry["changes"][0] : undefined;
    // console.log(changes, "Aquí veremos que hay en changes")
        console.log("Aquí vas los estados", statuses)
        var value = changes ? changes["value"] : undefined;
        var metadata = value ? value["metadata"] : undefined;
        var contacts = value ? value["contacts"] : undefined;
        var messages = value ? value["messages"] : undefined;
        var idMessage = messages ? messages[0]["id"] : undefined;
        // console.log(idMessage, "Este es el id del mensaje que llegó", messages)

        if (messages === undefined) return;

        if (metadata && messages && contacts) {
            const { phone_number_id } = metadata;

            const {from} = messages[0]

            const socioNumber = formatNumber(from)

            const [rows] = await pool.query('SELECT id FROM chat WHERE our_number = ? AND socio_number = ?', [phone_number_id, socioNumber]);

            const idChat = rows[0].id

            const {text} = req.body["entry"][0]["changes"][0]["value"]["messages"][0]
            const message = text.body

            const existingMessage = await pool.query('SELECT * FROM message WHERE id = ?', [idMessage])

            if (existingMessage[0].length > 0) {
                console.log('Mensaje duplicado')
                return
            }

            const envio = await pool.query('INSERT INTO message (id, chat_id, sender, message) VALUES (?, ?, 0, ?)', [idMessage, idChat, message]);

            wss.clients.forEach(client => {
                if (client.readyState === 1) { // 1 es el valor de WebSocket.OPEN
                    client.send(JSON.stringify({
                        idChat: idChat,
                        message,
                        sender: 0, // Indica que el usuario envió el mensaje
                    }));
                }
            });
    } else {}} catch (e) {
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

