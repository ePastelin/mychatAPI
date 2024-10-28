import sharp from 'sharp';
import { pool } from '../database/config.js';
import api, { apiMultimedia } from '../helpers/axios.js';
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

export const optimazeImage = async (image) => await sharp(image).resize({ width: 800}).webp({ quality: 70}).toBuffer()  

export const saveMultimedia = async (id, idChat, idMessage, mime_type, type, filename) => {
    const response = await api(id)
    const { url } = response.data

    const multimediaResponse = await apiMultimedia.get(url, {
        responseType: 'arraybuffer'
    })
    const { data } = multimediaResponse
    const typeNumber = type === 'document' ? 5 : type === 'image' && 1
    const multimedia = type === 'document' ? data : type === 'image' && await optimazeImage(data)

    await pool.query('INSERT INTO message (id, idChat, sender, media, type, mimeType, filename) VALUES (?, ?, 1, ?, ?, ?, ?)', [idMessage, idChat, multimedia, typeNumber, mime_type, filename]);
    
        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({ idChat, sender: 1, date: Date.now(), status: 'sent', idMessage: idMessage, media: multimedia, type: typeNumber, mimeType: mime_type, filename }));
            }
        });
    } 


export const processIncomingMessage = async (body) => {
    
    try {
        const { metadata, messages } = body.entry[0].changes[0].value;
        const { phone_number_id } = metadata;
        const socioNumber = formatNumber(messages[0].from);

        const [[{id: idChat, user: idUser}]] = await pool.query('SELECT id,  user FROM chat WHERE our_number = ? AND socio_number = ?', [phone_number_id, socioNumber]);

        const { id: idMessage, text } = messages[0];
        const { type } = messages[0]

        if (type !== 'text') {
            const message = {
                image: messages[0].image,
                document: messages[0].document,
                sticker: messages[0].sticker
              } [type] 

            const { id, mime_type } = message 

            const response = await api(id)
            const { url } = response.data

            const multimediaResponse = await apiMultimedia.get(url, {
                responseType: 'arraybuffer'
            }) 
            const { data } = multimediaResponse

            const multimedia = type ==='image' ? await optimazeImage(data) : data 
            const filename = type === 'document' ? message.filename : ''
            const typeNumber = type === 'image' || type === 'sticker' ? 1 : type === 'document' && 5

            await pool.query('INSERT INTO message (id, idChat, sender, media, type, mimeType, filename) VALUES (?, ?, 0, ?, ?, ?, ?)', [idMessage, idChat, multimedia, typeNumber, mime_type, filename]);
            await pool.query('UPDATE chat SET last_message = ?, unread = unread + 1, last_date = NOW() WHERE id = ?', ['Multimedia 📁', idChat])

            wss.clients.forEach(client => {
                if (client.readyState === 1 && client.idUser === idUser) {
                    client.send(JSON.stringify({ idChat, sender: 0, date: Date.now(), status: 'sent', idMessage: idMessage, media: multimedia, type: typeNumber, mimeType: mime_type, filename }));
                }
            });
            return 
        } 

        const message = text.body;

        const [existingMessage] = await pool.query('SELECT * FROM message WHERE id = ?', [idMessage]);
        if (existingMessage.length > 0) {
            console.log('Mensaje duplicado');
            return;
        }

        await pool.query('INSERT INTO message (id, idChat, sender, message) VALUES (?, ?, 0, ?)', [idMessage, idChat, message]);
        await pool.query('UPDATE chat SET last_message = ?, unread = unread + 1, last_date = NOW() WHERE id = ?', [message, idChat])

        wss.clients.forEach(client => {
            console.log("Reciviendo mensajes y viendo el idUser; ", idUser, client.idUser)
            if (client.readyState === 1 && client.idUser === idUser) {
                client.send(JSON.stringify({ idChat, message, sender: 0, date: Date.now(), status: 'sent', idMessage: idMessage }));
            }
        });
    } catch (error) {
        console.error('Error processing incoming message:', error);
    }
};
