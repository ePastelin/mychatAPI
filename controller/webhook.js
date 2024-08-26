import { pool } from '../database/config.js';
import formatNumber from '../helpers/formatNumber.js';
import { wss } from '../index.js';
import 'dotenv/config';

const { WEBHOOK_VERIFY_TOKEN } = process.env;

// Utilidad para extraer un campo anidado de un objeto con seguridad
const getNestedValue = (obj, path) => path.reduce((acc, key) => acc && acc[key] ? acc[key] : undefined, obj);

// Función para validar el webhook
export const verificar = async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
        console.log("Webhook verified successfully!");
    } else {
        res.sendStatus(403);
    }
};

// Procesa los estados de mensajes (statuses)
const processStatuses = async (statuses) => {
    if (statuses) {
        const { id, status } = statuses[0];
        console.log(`Updating message status: ID=${id}, Status=${status}`);
        await pool.query('UPDATE message SET status = ? WHERE id = ?', [status, id]);
    }
};

// Procesa y guarda los mensajes recibidos
const processMessages = async (metadata, messages, contacts) => {
    const { phone_number_id } = metadata;
    const from = getNestedValue(messages, [0, 'from']);
    const socioNumber = formatNumber(from);

    const [rows] = await pool.query('SELECT id FROM chat WHERE our_number = ? AND socio_number = ?', [phone_number_id, socioNumber]);
    const idChat = rows.length ? rows[0].id : null;

    if (!idChat) {
        console.error('Chat ID not found');
        return;
    }

    const idMessage = getNestedValue(messages, [0, 'id']);
    const messageBody = getNestedValue(messages, [0, 'text', 'body']);

    const [existingMessage] = await pool.query('SELECT * FROM message WHERE id = ?', [idMessage]);
    if (existingMessage.length > 0) {
        console.log('Duplicate message detected');
        return;
    }

    await pool.query('INSERT INTO message (id, chat_id, sender, message) VALUES (?, ?, 0, ?)', [idMessage, idChat, messageBody]);

    broadcastMessage(idChat, messageBody);
};

// Envía un mensaje a todos los clientes conectados por WebSocket
const broadcastMessage = (idChat, message) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ idChat, message, sender: 0 }));
        }
    });
};

// Función principal para manejar los mensajes entrantes
export const recibir = async (req, res) => {
    try {
        const entry = getNestedValue(req.body, ['entry', 0]);
        const changes = getNestedValue(entry, ['changes', 0]);
        const value = getNestedValue(changes, ['value']);
        
        const statuses = getNestedValue(value, ['statuses']);
        const metadata = getNestedValue(value, ['metadata']);
        const messages = getNestedValue(value, ['messages']);
        const contacts = getNestedValue(value, ['contacts']);

        await processStatuses(statuses);

        if (metadata && messages && contacts) {
            await processMessages(metadata, messages, contacts);
        }

        res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
        console.error('Error processing the message:', error);
        res.status(500).send("Internal Server Error");
    }
};