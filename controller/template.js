import api from "../helpers/axios.js"
import { pool } from "../database/config.js";

export const createTemplate = async (req, res) => {
        const { body } = req;
        const metaId = process.env.META_ID;
        const url = `${metaId}/message_templates`;
        let headerText = '';
        let bodyText = '';
        let footerText = '';
        let buttonsJson = null;

        const { name, language, components } = body

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

        const content = `${headerText}\n${bodyText}\n${footerText}`
         

        console.log(body);

        const { data } = await api.post(url, body);

        const {status, id, category} = data


        console.log(language)
        const languageResult = await pool.query(
            'SELECT id FROM languages WHERE language_code = ?', [language]
        );
        
        const language_id = languageResult[0].id;

        console.log(category)
        const categoryResult = await pool.query(
            'SELECT id FROM categories WHERE value = ?', [category]
        );

        const category_id = categoryResult[0].id;

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
