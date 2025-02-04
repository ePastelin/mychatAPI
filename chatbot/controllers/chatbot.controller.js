import { chatbotRepository } from "../repositories/chatbot.repository.js"
import { changeChatbotStatus, getChatbotStatus } from "../use-cases/chatbot.use-cases.js"

export const changeChatbotStatusController = async (_req, res) => {
    try {
        await changeChatbotStatus(chatbotRepository)

        res.status(201).json({
            ok: true,
            message: "Estatus del chatbot cambiado con éxito"
        })
    } catch(error) {
        res.status(400).json({
            ok: false,
            message: 'Error al cambiar el estado del chatbot'
        })
    }
}

export const getChatbotStatusController = async (_req, res) => {

    const status = await getChatbotStatus(chatbotRepository)

    try {
       res.status(200).json({
        ok: true,
        data: status
       }) 
    } catch(error) {
        console.log(error)
        res.status(400).json({
            ok: false,
            message: "No se pudo encontrar el chatbot"
        })
    }
}