import { pool } from '../database/config.js';
import formatDate from '../helpers/formatDate.js';
import formatNumber from '../helpers/formatNumber.js';
import { wss } from '../index.js';
import WebSocket from 'ws';

export const updateMessageStatus = async (statuses) => {
    try {
        const { id, status } = statuses[0];
        await pool.query('UPDATE message SET status = ? WHERE id = ?', [status, id]);

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    idMessage: id,
                    status,
                }));
            }
        })
    } catch (error) {
        console.error('Error updating message status:', error);
    }
};

export const processIncomingMessage = async (body) => {
    const date = formatDate(Date.now())
    console.log(body)
    
    try {
        const { metadata, contacts, messages } = body.entry[0].changes[0].value;
        const { phone_number_id } = metadata;
        const socioNumber = formatNumber(messages[0].from);

        const [rows] = await pool.query('SELECT id FROM chat WHERE our_number = ? AND socio_number = ?', [phone_number_id, socioNumber]);
        const idChat = rows[0].id;
        const { id: idMessage, text } = messages[0];
        const message = text.body;

        const [existingMessage] = await pool.query('SELECT * FROM message WHERE id = ?', [idMessage]);
        if (existingMessage.length > 0) {
            console.log('Mensaje duplicado');
            return;
        }

        await pool.query('INSERT INTO message (id, chat_id, sender, message) VALUES (?, ?, 0, ?)', [idMessage, idChat, message]);

        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({ idChat, message, sender: 0, date: Date.now() }));
            }
        });
    } catch (error) {
        console.error('Error processing incoming message:', error);
    }
};
