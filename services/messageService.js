import { pool } from '../database/config.js';
import api, { apiMultimedia } from '../helpers/axios.js';
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

export const saveMultimedia = async (id, idChat, idMessage, mime_type) => {
    const response = await api(id)
    
    const { url } = response.data

    const multimediaResponse = await apiMultimedia.get(url, {
        responseType: 'arraybuffer'
    })

    const multimedia = multimediaResponse.data

    await pool.query('INSERT INTO message (id, idChat, sender, media, type, mimeType) VALUES (?, ?, 0, ?, 1, ?)', [idMessage, idChat, multimedia, mime_type]);

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ idChat, sender: 1, date: Date.now(), status: 'sent', idMessage: idMessage, media: multimedia, type: 1, mimeType: mime_type }));
        }
    });


}

export const processIncomingMessage = async (body) => {
    
    try {
        const { metadata, contacts, messages } = body.entry[0].changes[0].value;
        const { phone_number_id } = metadata;
        const socioNumber = formatNumber(messages[0].from);

        

        const [rows] = await pool.query('SELECT id FROM chat WHERE our_number = ? AND socio_number = ?', [phone_number_id, socioNumber]);
        const idChat = rows[0].id;
        const { id: idMessage, text } = messages[0];
        const { type } = messages[0]

        if (type === 'image' || type === 'document' || type === 'sticker') {
            let id
            if (type === 'image') { id = messages[0].image.id } 
            if (type === 'document') { id = messages[0].document.id } 
            if (type === 'sticker') { id = messages[0].sticker.id } 

            console.log('id', id)
            const response = await api(id)
            console.log('first petition', response)

            const {url} = response.data

            const multimediaResponse = await apiMultimedia.get(url, {
                responseType: 'arraybuffer'
            }) 

            console.log(multimediaResponse, 'without data')
            console.log(multimediaResponse.data, 'image response')
    
            const multimedia = multimediaResponse.data

            console.log('info about document', messages[0].document)
            
            if (type === 'image') {
            const {mime_type} = messages[0].image
            console.log(messages[0].image)
            await pool.query('INSERT INTO message (id, idChat, sender, media, type, mimeType) VALUES (?, ?, 0, ?, 1, ?)', [idMessage, idChat, multimedia, mime_type]);

            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ idChat, sender: 0, date: Date.now(), status: 'sent', idMessage: idMessage, media: multimedia, type: 1, mimeType: mime_type }));
                }
            });
            return 
            }

            if (type === 'sticker') {
            const {mime_type} = messages[0].sticker
            console.log(messages[0].sticker)
            await pool.query('INSERT INTO message (id, idChat, sender, media, type, mimeType) VALUES (?, ?, 0, ?, 1, ?)', [idMessage, idChat, multimedia, mime_type]);

            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ idChat, sender: 0, date: Date.now(), status: 'sent', idMessage: idMessage, media: multimedia, type: 1, mimeType: mime_type }));
                }
            });
            return
            }

            if (type === 'document') {
             const {filename, mime_type} = messages[0].document
             await pool.query('INSERT INTO message (id, idChat, sender, media, type, filename, mimeType) VALUES (?, ?, 0, ?, 5, ?, ?)', [idMessage, idChat, multimedia, filename, mime_type]);

            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ idChat, sender: 0, date: Date.now(), status: 'sent', idMessage: idMessage, media: multimedia, type: 5, filename: filename, mimeType: mime_type,  }));
                }
            });
            return
            }
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
            if (client.readyState === 1) {
                client.send(JSON.stringify({ idChat, message, sender: 0, date: Date.now(), status: 'sent', idMessage: idMessage }));
            }
        });
    } catch (error) {
        console.error('Error processing incoming message:', error);
    }
};
