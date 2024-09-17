import api from "../helpers/axios"

export const createTemplate = async (req, res) => {

    const { body } = req
    const metaId = process.env.META_ID
    const url = `${metaId}/message_templates` 

    console.log(body)
    
    const response = await api.post(url, body)

    res.status(200).json(response)
}