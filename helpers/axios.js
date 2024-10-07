import axios from "axios";

const access_token = process.env.WHATSAPP_ACCESS_TOKEN

export const api = axios.create({
    baseURL: 'https://graph.facebook.com/v20.0/',
    params: {
      access_token
    }
  });

export const apiImage = axios.create({
  baseURL: '',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

  export default api