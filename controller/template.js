import api from "../helpers/axios.js";

export const createTemplate = async (req, res) => {
        const { body } = req;
        const metaId = process.env.META_ID;
        const url = `${metaId}/message_templates`;
        let headerText = '';
        let bodyText = '';
        let footerText = '';
        let buttonsJson = null;

        const { name, category, language, components } = body

        components.forEach(component => {
            if (component.type === 'HEADER') {
              headerText = component.text;
            } else if (component.type === 'BODY') {
              bodyText = component.text;
            }
            else if (component.type === 'FOOTER') {
              footerText = component.text;
            }
            else if (component.type === 'BUTTONS') {
              buttonsJson = component.buttons;
            }
          });

        const content = `${header}\n${body}\n${footer}`
         

        console.log(body);

        const { data } = await api.post(url, body);

        const {status, id} = data

        const languageResult = await pool.query(
            'SELECT id FROM languages WHERE language_code = ?', [language]
        );
        
        const language_id = languageResult.rows[0].id;

        const categoryResult = await pool.query(
            'SELECT id FROM categories WHERE value = ?', [status]
        );

        const category_id = categoryResult.rows[0].id;

        const insertResult = await pool.query(
            `INSERT INTO templates (id, name, category_id, language_id, content, buttons, status_id) 
            VALUES (?. ?, ?, ?, ?, ?, 1)`,
            [id, name, category_id, language_id, content, JSON.stringify(buttons)]
        );

        // Asegúrate de que 'data' no sea undefined o null antes de continuar
        if (!data) {
            return res.status(500).json({ error: "No se recibió respuesta del API." });
        }

        console.log(data);

        return res.status(200).json(data);  // Responde solo con la data relevante

};
