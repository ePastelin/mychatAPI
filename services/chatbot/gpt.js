import OpenAI from 'openai';
import { prompt } from './index.js'
import { getMessageForGPTBot } from '../../helpers/querys.js';
import { pool } from '../../database/config.js';

const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({apiKey});

export const gptResponse = async (userContent, idChat) => {
    const messages = await getMessageForGPTBot(pool, idChat);
    messages.push({role: 'user', content: userContent})
    
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages 
    })
    return completion.choices[0].message.content;
}
