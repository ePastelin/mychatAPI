import axios from "axios";

const access_token = process.env.WHATSAPP_ACCESS_TOKEN

export const api = axios.create({
    baseURL: 'https://graph.facebook.com/v20.0/',
    params: {
      access_token
    }
  });

export const apiMultimedia = axios.create({
  baseURL: 'https://graph.facebook.com/v20.0/',
  headers: {
    Authorization: `Bearer ${access_token}`,
    'Content-Type': 'multipart/form-data'
  }
})

  export default api