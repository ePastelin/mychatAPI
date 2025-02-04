import { pool } from "../../database/config.js"
import { booleanToNumber } from "../services/booleanToNumber.js"

export const chatbotRepository = {
    getChatbotStatus: async () => {
        const [ status ] = await pool.query('SELECT is_bot_active FROM chatbot WHERE id = 1')
        return status[0].is_bot_active
    },

    changeStatus: async (status) => {
        const [ chatbot ] = await pool.query('UPDATE chatbot SET is_bot_active = ? WHERE id = 1', [booleanToNumber(status)])
        return chatbot
    }

}