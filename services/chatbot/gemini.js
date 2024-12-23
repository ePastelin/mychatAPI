import { GoogleGenerativeAI } from "@google/generative-ai";
import { prompt } from "./index.js";
import { getMessageForBot } from "../../helpers/querys.js";
import { pool } from "../../database/config.js";

const apiKey = process.env.GEMINI_API_KEY 

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: prompt})

export const geminiResponse = async (userContent, idChat) => {
    const chat = model.startChat({
        history: getMessageForBot(pool, idChat)
    })

    let result = await chat.sendMessage(userContent)
    console.log(result)

    return result.response.text()
}


