import { prompt } from "../services/chatbot/prompt.js";

export const saveMessageToDatabase = async (pool, messageId, chatId, message) => {
  const result = await pool.query("INSERT INTO message (id, idChat, sender, message) VALUES (?, ?, 1, ?)", [
    messageId,
    chatId,
    message,
  ]);

  await pool.query("UPDATE chat SET last_message = ?, last_date = NOW() WHERE id = ?", [message, chatId]);

  return result;
};

export const getChatDetails = async (pool, chatId) => {
  const [rows] = await pool.query("SELECT our_number, socio_number, user FROM chat WHERE id = ?", [chatId]);
  return rows[0];
};

export const updateMessageStatus = async (pool, idMessage, status) => {
  await pool.query("UPDATE message SET status = ? WHERE id = ?", [status, idMessage]);
};

export const createChats = async (body) => {
  const { id, ourNumber, socioNumber, chatType, lastMessage, socioName } = body;

  await pool.query(
    "INSERT INTO chat (id, our_number, socio_number, chat_type, last_message, socio_name) VALUES (?, ?, ?, ?, ?, ?)",
    [id, ourNumber, socioNumber, chatType, lastMessage, socioName]
  );
};

export const getMessageForGEMINIBot = async (pool, chatId) => {
  const query = `
SELECT sender, message, type, date
FROM (
    SELECT sender, message, type, date
    FROM message
    WHERE idChat = ? AND type = 6
    ORDER BY date DESC
    LIMIT 6
) subquery
ORDER BY date ASC;
    `;

  const [rows] = await pool.query(query, [chatId]);

  const formattedMessages = rows.map((row) => ({
    role: row.sender === 1 ? "model" : "user",
    parts: [{ text: row.message }],
  }));

  if (formattedMessages[0].role !== "user") {
    formattedMessages.unshift({ role: "user", parts: [{ text: "Hola" }] });
  }

  console.log(formattedMessages, "formattedMessages");
  return formattedMessages;
};

export const getMessageForGPTBot = async (pool, chatId) => {
  const query = `
SELECT sender, message, type, date
FROM (
    SELECT sender, message, type, date
    FROM message
    WHERE idChat = ? AND type = 6
    ORDER BY date DESC
    LIMIT 6
) subquery
ORDER BY date ASC;
    `;

  const [rows] = await pool.query(query, [chatId]);

  const formattedMessages = rows.map((row) => ({
    role: row.sender === 1 ? "assistant" : "user",
    content: row.message,
  }));

  formattedMessages.push({ role: "system", content: prompt });
  if (formattedMessages[0].role !== "user") {
    formattedMessages.unshift({ role: "user", content: "Hola" });
  }

  console.log(formattedMessages, "formattedMessages");

  return formattedMessages;
};
