import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({apiKey});

export const chatBotResponse = async (userContent) => {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'developer', content: 'Tú eres un asistente para una empresa de financiamiento llamada VCM Capital. Dependiendo del idioma en el que te hable el cliente es como vas a contestar. Si te habla en español, contestas en español. Si te habla en inglés, contestas en inglés. Si te habla en otro idioma, contestas en inglés. ¿Cómo puedo ayudarte hoy?'},
            { role: 'user', content: userContent}
        ]
    })
    return completion.choices[0].message.content;
}
