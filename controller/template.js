import api from "../helpers/axios.js"
import replaceVariables from "../helpers/replaceVariables.js";
import { pool } from "../database/config.js";

const metaId = process.env.META_ID;

export const createTemplate = async (req, res) => {
        const { body } = req;
        const url = `${metaId}/message_templates`;
        let headerText = '';
        let bodyText = '';
        let footerText = '';
        let originalHeaderText = '';
        let originalBodyText = '';
        let originalFooterText = '';
        let headerExamples = null;
        let bodyExamples = null;
        let buttons = null;

        const { name, language, components } = body

        components.forEach(component => {
            if (component.type === 'HEADER') {
              // Guardar el texto original del HEADER sin modificar
              originalHeaderText = component.text;
          
              // Reemplazar variables en el HEADER usando el ejemplo
              if (component.example && component.example.header_text) {
                headerExamples = component.example.header_text;
                headerText = replaceVariables(component.text, component.example.header_text);
              } else {
                headerText = component.text;
              }
          
            } else if (component.type === 'BODY') {
              // Guardar el texto original del BODY sin modificar
              originalBodyText = component.text;
          
              // Reemplazar variables en el BODY usando el ejemplo
              if (component.example && component.example.body_text) {
                bodyExamples = component.example.body_text;
                bodyText = replaceVariables(component.text, component.example.body_text); // Usar el primer array en el ejemplo
              } else {
                bodyText = component.text;
              }
          
            } else if (component.type === 'FOOTER') {
              // Guardar el texto original del FOOTER sin modificar
              originalFooterText = component.text;
              footerText = component.text;
          
            } else if (component.type === 'BUTTONS') {
              buttons = component.buttons;
            }
          });

        const content = `${originalHeaderText}\n${originalBodyText}\n${originalFooterText}`
         

        console.log(body);

        const { data } = await api.post(url, body);

        const {status, id, category} = data


        console.log(language)
        const languageResult = await pool.query(
            'SELECT id FROM languages WHERE language_code = ?', [language]
        );
        
        const language_id = languageResult[0][0].id;
        console.log(language_id)

        console.log(category)
        const categoryResult = await pool.query(
            'SELECT id FROM categories WHERE value = ?', [category]
        );

        const category_id = categoryResult[0][0].id;

        console.log(category_id)

        const insertResult = await pool.query(
            `INSERT INTO templates (id, name, category_id, language_id, header, body, footer, buttons, header_examples, body_examples, status_id, content) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [id, name, category_id, language_id, headerText, bodyText, footerText, JSON.stringify(buttons), JSON.stringify(headerExamples), JSON.stringify(bodyExamples), content]
          );

        // Asegúrate de que 'data' no sea undefined o null antes de continuar
        if (!data) {
            return res.status(500).json({ error: "No se recibió respuesta del API." });
        }

        console.log(data);

        return res.status(200).json(data);  // Responde solo con la data relevante

};

export const getTemplate = async (req, res) => {

  try {
  const { id } = req.params

  const [result] = await pool.query(`SELECT t.*, l.language_code FROM templates t JOIN languages l ON t.language_id = l.id WHERE t.id = ?`, [id]);

  console.log('this is my data', result)

  return res.status(200).json(result)

  } catch(error) {
    console.log(error)
    return res.status(500)
  }
  }

export const sendTemplate = async (req, res) => {
    const { whatsapp, database } = req.body
    const { message, socioName, ourNumber} = database
    const url = `${ourNumber}/messages`

    const { data } = await api.post(url, whatsapp)
    console.log(data)
    const idMessage = data.messages[0].id
    console.log(idMessage)
    const socioNumber = data.contacts[0].input
    console.log(data)
    console.log(idMessage)

    const [chatRes] = await pool.query(`INSERT INTO chat (our_number, socio_number, chat_type, last_message, socio_name) 
            VALUES (?, ?, ?, ?, ?)`,
            [ourNumber, socioNumber, 1, message, socioName])

    const idChat = chatRes.insertId

    const [messageRes] = await pool.query(`INSERT INTO message (id, idChat, sender, message, status) 
            VALUES (?, ?, ?, ?, ?)`,
            [idMessage, idChat, 1, message, 'delivered'])


    return res.status(201)
  

}

export const getTemplates = async (req, res) => {
  try {
  const [templates] = await pool.query('SELECT t.id, t.name, c.name AS category_name, l.name AS language_name, ts.name AS status_name, t.allow_category_change, t.created_at, t.updated_at, t.content, t.buttons, t.header, t.body, t.footer FROM templates t JOIN categories c ON t.category_id = c.id JOIN languages l ON t.language_id = l.id JOIN templateStatus ts ON t.status_id = ts.id')

  console.log(templates)
  return res.status(200).json(templates)

  } catch(error) {
    console.log(error)
    return res.status(500)
  }
}
