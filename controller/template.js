import api from "../helpers/axios.js";
import replaceVariables from "../helpers/replaceVariables.js";
import { pool } from "../database/config.js";

const metaId = process.env.META_ID;

export const createTemplate = async (req, res) => {
  const { body } = req;
  const url = `${metaId}/message_templates`;
  let headerText = "";
  let bodyText = "";
  let footerText = "";
  let originalHeaderText = "";
  let originalBodyText = "";
  let originalFooterText = "";
  let headerExamples = null;
  let bodyExamples = null;
  let buttons = null;

  const { name, language, components } = body;

  components.forEach((component) => {
    if (component.type === "HEADER") {
      originalHeaderText = component.text;

      if (component.example && component.example.header_text) {
        headerExamples = component.example.header_text;
        headerText = replaceVariables(
          component.text,
          component.example.header_text
        );
      } else {
        headerText = component.text;
      }
    } else if (component.type === "BODY") {
      originalBodyText = component.text;

      if (component.example && component.example.body_text) {
        bodyExamples = component.example.body_text;
        bodyText = replaceVariables(
          component.text,
          component.example.body_text
        ); 
      } else {
        bodyText = component.text;
      }
    } else if (component.type === "FOOTER") {
      originalFooterText = component.text;
      footerText = component.text;
    } else if (component.type === "BUTTONS") {
      buttons = component.buttons;
    }
  });

  const content = `${originalHeaderText}\n${originalBodyText}\n${originalFooterText}`;
try {
 const { data } = await api.post(url, body);

  const { id, category } = data;

  const languageResult = await pool.query(
    "SELECT id FROM languages WHERE language_code = ?",
    [language]
  );

  const language_id = languageResult[0][0].id;

  const categoryResult = await pool.query(
    "SELECT id FROM categories WHERE value = ?",
    [category]
  );

  const category_id = categoryResult[0][0].id;

  await pool.query(
    `INSERT INTO templates (id, name, category_id, language_id, header, body, footer, buttons, header_examples, body_examples, status_id, content, body_variables, header_variables) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    [
      id,
      name,
      category_id,
      language_id,
      headerText,
      bodyText,
      footerText,
      JSON.stringify(buttons),
      JSON.stringify(headerExamples),
      JSON.stringify(bodyExamples),
      content,
      originalBodyText,
      originalHeaderText,
    ]
  );

  return res.status(200).json(data);
} catch(error) {
  console.log('error: ', error)
  res.status(500).json(error.data)
}
  
};

export const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `SELECT t.*, l.language_code FROM templates t JOIN languages l ON t.language_id = l.id WHERE t.id = ?`,
      [id]
    );

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
};

export const sendTemplate = async (req, res) => {
  const { whatsapp, database } = req.body;
  const { message, socioName, ourNumber } = database;
  const { id } = req;
  const url = `${ourNumber}/messages`;

  const socioNumber = whatsapp.to;

  try {
    const [existingChat] = await pool.query(
      `SELECT id, user FROM chat WHERE our_number = ? AND socio_number = ? LIMIT 1`,
      [ourNumber, socioNumber]
    );

    let idChat;

    if (existingChat.length > 0) {
      const chatOwner = existingChat[0].user;
      idChat = existingChat[0].id;

      if (chatOwner !== id) {
        return res
          .status(403)
          .json({
            ok: false,
            message: "No tienes permiso para enviar mensajes en este chat",
          });
      } else {
        const { data } = await api.post(url, whatsapp);
        const idMessage = data.messages[0].id;

        await pool.query(
          `INSERT INTO message (id, idChat, sender, message, status) 
             VALUES (?, ?, ?, ?, ?)`,
          [idMessage, idChat, 1, message, "delivered"]
        );

        await pool.query(
          "UPDATE chat SET last_message = ?, last_date = NOW() WHERE id = ?",
          [message, idChat]
        );

        return res.status(200).json({ ok: true });
      }
    } else {
      const { data } = await api.post(url, whatsapp);
      const idMessage = data.messages[0].id;

      const [chatRes] = await pool.query(
        `INSERT INTO chat (our_number, socio_number, chat_type, last_message, socio_name, user) 
           VALUES (?, ?, ?, ?, ?, ?)`,
        [ourNumber, socioNumber, 1, message, socioName, id]
      );

      idChat = chatRes.insertId;

      await pool.query(
        `INSERT INTO message (id, idChat, sender, message, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [idMessage, idChat, 1, message, "delivered"]
      );

      return res.status(200).json({ ok: true });
    }
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const [templates] = await pool.query(
      "SELECT t.id, t.name, c.name AS category_name, l.name AS language_name, ts.name AS status_name, t.allow_category_change, t.created_at, t.updated_at, t.content, t.buttons, t.header, t.body, t.footer FROM templates t JOIN categories c ON t.category_id = c.id JOIN languages l ON t.language_id = l.id JOIN templateStatus ts ON t.status_id = ts.id"
    );
    const [languages] = await pool.query("SELECT name FROM languages");
    const [categories] = await pool.query("SELECT name FROM categories");
    const [status] = await pool.query("SELECT name FROM templateStatus");

    const result = {
      templates,
      languages: languages.map((lang) => ({
        value: lang.name,
        label: lang.name,
      })),
      categories: categories.map((cat) => ({
        value: cat.name,
        label: cat.name,
      })),
      status: status.map((stat) => ({ value: stat.name, label: stat.name })),
    };

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
};
