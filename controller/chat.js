import axios from 'axios';
import { pool } from '../database/config.js';

export async function sendMessage(req, res) {

    const { message, idChat } = req.body

    const [rows] = await pool.query('SELECT our_number, socio_number FROM chat WHERE id = ?', [idChat]);
    const {our_number, socio_number} = rows[0]
    console.log(req.body)
    console.log(message)
    console.log(our_number, socio_number)
   

    try {
        const url = `https://graph.facebook.com/v20.0/${our_number}/messages`;
        const accessToken = 'EAAwzliYKTZBwBO65SDKzG1KVx0LdkGxYSXOWV8DCscUbwBXEnQCm0a8WgKcTYNMZBCtRRlfGslSt3kzwaKtiXqUPtSrmKSMPzWVq3aKGYM9bHrlwbQ5igZCqlQem769DiHHPt1BxKDQ3aIcTZBN1IVnK02ZBAS0HxEBzhj5nZAqDsWyGqYGfHY10tvJdgmTDqWFQZDZD';
        const data = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: socio_number, 
            type: 'text',
            text: {
                preview_url: false,
                body: message 
            }
        };

        const response = await axios.post(url, data, {
            params: {
                access_token: accessToken
            }
        });

        console.log(response)

        const envio = await pool.query('INSERT INTO message (chat_id, sender, message) VALUES (?, 1, ?)', [idChat, message])
        console.log(envio)

        res.json(response.data);
    } catch (error) {
        console.error('Error al enviar el mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export async function getChats(req, res) {

    const userId = req.id
    try {
        const [rows] = await pool.query(
            "SELECT COALESCE(GROUP_CONCAT(n.number_id SEPARATOR ','), '') AS phone_numbers FROM users_numbers n WHERE n.user_id = ?",
            [userId]
          );

        const phoneNumbers = rows[0].phone_numbers ? rows[0].phone_numbers.split(',') : []

        console.log(phoneNumbers)

        const [chats] = await pool.query(`
            SELECT c.*
            FROM chat c
            JOIN number n ON c.our_number = n.idnumber
            WHERE n.idnumber IN (?)
          `, [phoneNumbers]);

        res.json({phoneNumbers, chats})
    } catch(error) {
        console.error(error)
        res.status(500).json({error})
    }
} 

export async function getMessages(req, res) {

    const { id } = req.params

    try {
        const [rows] = await pool.query('SELECT * FROM message WHERE chat_id = (?) ORDER BY date ASC', [id])

        res.status(200).json(rows)
    }catch(error) {
        console.error(error)
        res.status(500).json({error})
    }

}