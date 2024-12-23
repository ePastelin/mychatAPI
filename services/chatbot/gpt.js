import OpenAI from 'openai';
import { prompt } from './index'

const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({apiKey});

export const gptResponse = async (userContent) => {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'developer', content: prompt},
            { role: 'user', content: userContent}
        ]
    })
    return completion.choices[0].message.content;
}
