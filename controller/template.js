import api from "../helpers/axios.js";

export const createTemplate = async (req, res) => {
    try {
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
    } catch (error) {
        // Aquí procesamos y respondemos solo con información útil del error
        console.error("Error al crear la plantilla:", error.message);

        // Si Axios genera un error, puedes acceder a 'error.response' para obtener detalles del error HTTP
        if (error.response) {
            return res.status(error.response.status).json({
                message: "Error en la solicitud a la API",
                details: error.response.data,
            });
        } else if (error.request) {
            // El error ocurrió al hacer la solicitud, pero no se recibió respuesta
            return res.status(500).json({
                message: "No se recibió respuesta del servidor de la API",
            });
        } else {
            // Algo salió mal al configurar la solicitud
            return res.status(500).json({
                message: "Error al configurar la solicitud a la API",
                details: error.message,
            });
        }
    }
};
