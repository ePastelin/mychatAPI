import axios from 'axios'
import api, { apiMultimedia } from './axios.js';

export const sendWhatsAppMessage = async (ourNumber, socioNumber, message) =>{
    const url = `https://graph.facebook.com/v20.0/${ourNumber}/messages`
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    const whatsappData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: socioNumber,
        type: 'text',
        text: {
            preview_url: false,
            body: message
        }
    };

    const response = await api.post(url, whatsappData);

    return response.data.messages[0].id
}

export const sendMultimedia = async (ourNumber, file) => {
    console.log(file)
    const url = `${ourNumber}/media?messaging_product=whatsapp`;
   
    try {
    const response = await apiMultimedia.post(url, file);

    console.log(response)
    console.log(file)
    
    return response.data;
    } catch(error) {
        console.log(error)
        return error
    }
    
};
