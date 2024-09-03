import axios from 'axios'

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

    const response = await axios.post(url, whatsappData, {
        params: { access_token: accessToken }
    });

    return response.data.messages[0].id
}