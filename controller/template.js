import api from "../helpers/axios.js";

export const createTemplate = async (req, res) => {
        const { body } = req;
        const metaId = process.env.META_ID;
        const url = `${metaId}/message_templates`;

        console.log(body);

        const { data } = await api.post(url, body);
        

        // Asegúrate de que 'data' no sea undefined o null antes de continuar
        if (!data) {
            return res.status(500).json({ error: "No se recibió respuesta del API." });
        }

        console.log(data);

        return res.status(200).json(data);  // Responde solo con la data relevante

};
