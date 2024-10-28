import { pool } from '../database/config.js';
import api, { apiMultimedia } from '../helpers/axios.js';
import { getChatDetails } from '../helpers/querys.js';
import { saveMultimedia } from '../services/messageService.js';

export async function sendMessage(req, res) {

    const { message, idChat } = req.body

    const [rows] = await pool.query('SELECT our_number, socio_number FROM chat WHERE id = ?', [idChat]);
    const {our_number, socio_number} = rows[0]
   

    try {
        const url = `${our_number}/messages`;
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

        const response = await api.post(url, data) 
        console.log(response)

        const envio = await pool.query('INSERT INTO message (idChat, sender, message) VALUES (?, 1, ?)', [idChat, message])
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
        const [ chats ] = await pool.query(`SELECT * FROM chat WHERE user = ?`, [userId])

        res.json({chats})
    } catch(error) {
        console.error(error)
        res.status(500).json({error})
    }
} 

export async function getMessages(req, res) {

    const { id } = req.params

    try {
        const [rows] = await pool.query('SELECT * FROM message WHERE idChat = (?) ORDER BY date ASC', [id])

        res.status(200).json(rows)
    }catch(error) {
        console.error(error)
        res.status(500).json({error})
    }

}

export async function sendMultimedia(req, res) {
    const { file } = req
    const { idChat} = req.body

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded'})
    }
    
    const { our_number, socio_number } = await getChatDetails(pool, idChat) 

    const url = `${our_number}/media?messaging_product=whatsapp`;
    const {mimetype, buffer, originalname} = file
    const type = mimetype.startsWith('image/') ? 'image' : mimetype.startsWith('application/') && 'document' 
    const blob = new Blob([buffer], {type: mimetype})
    const formData = new FormData()
    formData.append('file', blob, originalname)

    try {
        const response = await apiMultimedia.post(url, formData)
        const { id } = response.data

        const message = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: socio_number,
            type,
        }

        if (type === 'image') message.image = {id}
        else if (type === 'document') message.document = {id, filename: originalname}
        else return res.json({ok: false, data: 'Formato no válido'}).status(400)

        const sendResponse = await apiMultimedia.post(`${our_number}/messages`, message)

        await saveMultimedia(id, idChat, sendResponse.data.messages[0].id, mimetype, type, originalname)
    } catch(error) {
           console.log(error.response.data) 
    }

}