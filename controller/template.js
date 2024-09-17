import api from "../helpers/axios"

export const createTemplate = async (req, res) => {

    const { body } = req

    console.log(body)
    
    const response = await api.post(url, body)

    res.status(200).json(response)
}