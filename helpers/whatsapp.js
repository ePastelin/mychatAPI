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

export const sendMultimedia = async (ourNumber, socioNumber, file, mimeType) => {
    console.log(file)
    const url = `${ourNumber}/media?messaging_product=whatsapp`;
    
    const formData = new FormData();
    formData.append('file', file);
   
    try {
    const response = await apiMultimedia.post(url, formData);

    console.log(response)
    console.log(file)
    
    return response.data;
    } catch(error) {
        console.log(error)
        return error
    }
    
};
