import { processIncomingMessage, updateMessageStatus } from '../services/messageService.js';

export const verificar = (req, res) => {
    const { mode, verify_token, challenge } = req.query;

    console.log(req.query, process.env.WEBHOOK_VERIFY_TOKEN)
  
    if (mode === "subscribe" && verify_token === process.env.WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(challenge);
        console.log("Webhook verified successfully!");
    } else {
        res.sendStatus(403);
    }
};

export const recibir = async (req, res) => {
    try {
        const { messages, statuses } = req.body.entry[0].changes[0].value || {};
        if (statuses) await updateMessageStatus(statuses);
        if (messages) await processIncomingMessage(req.body);
    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
    } finally {
        res.send("EVENT_RECEIVED");
    }
};
