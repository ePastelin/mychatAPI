import { pool } from "../database/config.js";
import { apiMultimedia } from "../helpers/axios.js";
import { getChatDetails } from "../helpers/querys.js";
import { gptResponse } from "../services/chatbot/index.js";
import { saveMultimedia } from "../services/messageService.js";

export async function getChats(req, res) {
  const userId = req.id;

  try {
    const [chats] = await pool.query(`SELECT * FROM chat WHERE user = ? AND isDeleted = 0`, [userId]);

    res.json({ chats });
  } catch (error) {
    res.status(500).json(error);
  }
}

export async function getAdminChats(req, res) {
  try {
    const [chats] = await pool.query(
      "SELECT c.id, c.socio_name, c.socio_number, c.isActive, DATE_FORMAT(c.create_date, '%d/%m/%Y') as create_date, u.username, c.user FROM chat c JOIN users u ON c.user = u.id WHERE c.isDeleted = 0"
    );

    console.log(chats);
    res.json(chats);
  } catch (error) {
    req.status(500).json(error);
  }
}

export async function updateChatInfo(req, res) {
  const { id } = req.params;
  const { body } = req;

  try {
    await pool.query("UPDATE chat SET ? WHERE id = ?", [body, id]);
    res.statusText = "Actualizado con éxito"
    res.status(201).json({
      ok: true,
      message: "Chat actualizado con éxito"
    })
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error en la actualización"
    });
  }
}

export async function deleteChat(req, res) {
  const { id } = req.params;

  try {
    await pool.query("UPDATE chat SET isDeleted = 1 WHERE id = ?", [id])
    res.statusText = "Chat eliminado con éxito"
    res.status(201).json({
      ok: true,
      message: "Eliminado con éxito"
    })
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: "Error eliminando"
    })
  }
  
}

export async function getMessages(req, res) {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT * FROM message WHERE idChat = (?) ORDER BY date ASC", [id]);

    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json(error);
  }
}

export async function sendMultimedia(req, res) {
  const { file } = req;
  const { idChat } = req.body;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  if (!idChat) {
    return res.status(400).json({ error: "No idChat in the request" });
  }

  const { mimetype, buffer, originalname } = file;
  const type = mimetype.startsWith("image/") ? "image" : mimetype.startsWith("application/") && "document";

  if (type !== "image" && type !== "document")
    return res.status(400).json({ ok: false, data: "Formato no válido" });

  try {
    const { our_number, socio_number, user: idUser } = await getChatDetails(pool, idChat);
    const url = `${our_number}/media?messaging_product=whatsapp`;
    const blob = new Blob([buffer], { type: mimetype });
    const formData = new FormData();

    formData.append("file", blob, originalname);

    const response = await apiMultimedia.post(url, formData);
    const { id } = response.data;
    const message = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: socio_number,
      type,
    };

    if (type === "image") message.image = { id };
    else if (type === "document") message.document = { id, filename: originalname };

    const sendResponse = await apiMultimedia.post(`${our_number}/messages`, message);
    await saveMultimedia(id, idChat, sendResponse.data.messages[0].id, mimetype, type, originalname, idUser);

    res.status(200).json({ ok: true, message: "Multimedia sent successfully" });
  } catch (error) {
    return res.status(400).json(error);
  }
}

export async function chatBot(req, res) {
  const { message } = req.body;

  try {
    const response = await gptResponse(message);
    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ error });
  }
}
