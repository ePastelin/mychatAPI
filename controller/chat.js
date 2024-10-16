import { pool } from '../database/config.js';
import api, { apiMultimedia } from '../helpers/axios.js';
import { getChatDetails } from '../helpers/querys.js';
import { saveMultimedia } from '../services/messageService.js';

export async function sendMessage(req, res) {

    const { message, idChat } = req.body

    const [rows] = await pool.query('SELECT our_number, socio_number FROM chat WHERE id = ?', [idChat]);
    const {our_number, socio_number} = rows[0]
    console.log(req.body)
    console.log(message)
    console.log(our_number, socio_number)
   

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
        // const [rows] = await pool.query(
        //     "SELECT COALESCE(GROUP_CONCAT(n.number_id SEPARATOR ','), '') AS phone_numbers FROM users_numbers n WHERE n.user_id = ?",
        //     [userId]
        //   );

        // const phoneNumbers = rows[0].phone_numbers ? rows[0].phone_numbers.split(',') : []

        // console.log(phoneNumbers)

        // const [chats] = await pool.query(`
        //     SELECT c.*
        //     FROM chat c
        //     JOIN number n ON c.our_number = n.idnumber
        //     WHERE n.idnumber IN (?)
        //   `, [phoneNumbers]);

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
    console.log(file, idChat)

    if (!file) {
        console.log('No file')
        return res.status(400).json({ error: 'No file uploaded'})
    }

    console.log('Theres file')
    
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
        console.log(sendResponse.data.contacts, sendResponse.data.messages)


        const responseSaveMultimedia = await saveMultimedia(id, idChat, sendResponse.data.messages[0].id, mimetype, type, originalname)
        console.log(responseSaveMultimedia)

    } catch(error) {
            // Accede al error de Axios para obtener detalles específicos
    if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.log('Status:', error.response.status); // Código de estado HTTP
        console.log('Headers:', error.response.headers); // Headers de la respuesta
        console.log('Data:', JSON.stringify(error.response.data, null, 2)); // El objeto completo del error
    } else if (error.request) {
        // La petición fue hecha pero no hubo respuesta
        console.log('Request:', error.request);
    } else {
        // Algo sucedió al configurar la solicitud que lanzó un error
        console.log('Error Message:', error.message);
    }

    // Opcional: muestra el error completo en formato de string para ver toda su estructura
    console.log('Error Config:', JSON.stringify(error.config, null, 2));
    }

}