import sharp from "sharp";
import { pool } from "../database/config.js";
import api, { apiMultimedia } from "../helpers/axios.js";
import formatNumber from "../helpers/formatNumber.js";
import { wss } from "../index.js";
import WebSocket from "ws";
import { getChatDetails, saveMessageToDatabase } from "../helpers/querys.js";
import fs from "fs";
import path from "path";
import __dirname from "../helpers/getDirname.cjs";
import { gptResponse, geminiResponse } from "./chatbot/index.js";
import { sendWhatsAppMessage } from "../helpers/whatsapp.js";

export const updateMessageStatus = async (statuses) => {
  try {
    const { id, status } = statuses[0];
    await pool.query("UPDATE message SET status = ? WHERE id = ?", [status, id]);
    const [[{ idChat }]] = await pool.query("SELECT idChat from message WHERE id = ?", [id]);
    const { user: idUser } = await getChatDetails(pool, idChat);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.idUser == idUser) {
        client.send(
          JSON.stringify({
            idMessage: id,
            status,
          })
        );
      }
    });
  } catch (error) {
    console.error("Error updating message status:", error);
  }
};

export const optimazeImage = async (image) =>
  await sharp(image).resize({ width: 800 }).webp({ quality: 70 }).toBuffer();

export const saveMultimedia = async (id, idChat, idMessage, mime_type, type, filename, idUser) => {
  const response = await api(id);
  const { url } = response.data;

  const multimediaResponse = await apiMultimedia.get(url, {
    responseType: "arraybuffer",
  });
  const { data } = multimediaResponse;
  const typeNumber = type === "document" ? 5 : type === "image" && 1;
  const multimedia = type === "document" ? data : type === "image" && (await optimazeImage(data));

  const folderPath = path.join(__dirname, `multimedia/${idChat}/${type}/sent`);
  const filePath = path.join(folderPath, filename);
  const bdPath = `/multimedia/${idChat}/${type}/sent/${filename}`;

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  fs.writeFileSync(filePath, multimedia);

  await pool.query(
    "INSERT INTO message (id, idChat, sender, media, type, mimeType, filename) VALUES (?, ?, 1, ?, ?, ?, ?)",
    [idMessage, idChat, bdPath, typeNumber, mime_type, filename]
  );

  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.idUser == idUser) {
      client.send(
        JSON.stringify({
          idChat,
          sender: 1,
          date: Date.now(),
          status: "sent",
          idMessage: idMessage,
          media: bdPath,
          type: typeNumber,
          mimeType: mime_type,
          filename,
          isActive: 1
        })
      );
    }
  });
  
  return
};

export const processIncomingMessage = async (body) => {
  try {
    const { metadata, messages } = body.entry[0].changes[0].value;
    const { phone_number_id } = metadata;
    console.log(metadata, messages)
    const socioNumber = formatNumber(messages[0].from);

    const [chatResult] = await pool.query(
      "SELECT id, user FROM chat WHERE our_number = ? AND socio_number = ?",
      [phone_number_id, socioNumber]
    );
    
    let idChat, idUser;
    
    if (chatResult.length > 0) {
      idChat = chatResult[0].id;
      idUser = chatResult[0].user;
    } else {
      // Create a new chat entry if it doesn't exist
      const [createChat] = await pool.query(
        "INSERT INTO chat (our_number, socio_number, last_message, last_date, unread, isActive, user) VALUES (?, ?, ?, NOW(), 0, 1, 84)",
        [phone_number_id, socioNumber, "New conversation"]
      );
      idChat = createChat.insertId;
      idUser = 84; // Assign a default user if necessary
    }

    const { id: idMessage, text } = messages[0];
    const { type } = messages[0];



    if (type === "button") {
      const message = messages[0].button.text;

      const [existingMessage] = await pool.query("SELECT * FROM message WHERE id = ?", [idMessage]);
      if (existingMessage.length > 0) {
        console.log("Mensaje duplicado");
        return;
      }

      await pool.query("INSERT INTO message (id, idChat, sender, message) VALUES (?, ?, 0, ?)", [
        idMessage,
        idChat,
        message,
      ]);

      await pool.query(
        "UPDATE chat SET last_message = ?, unread = unread + 1, last_date = NOW(), isActive = 0 WHERE id = ?",
        [message, idChat]
      );

      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.idUser == idUser) {
          client.send(
            JSON.stringify({
              idChat,
              message,
              sender: 0,
              date: Date.now(),
              status: "sent",
              idMessage: idMessage,
              isActive: 0,
            })
          );
        }
      });

      return;
    }

    if (type !== "text") {
      const message = {
        image: messages[0].image,
        document: messages[0].document,
        sticker: messages[0].sticker,
      }[type];

      const { id, mime_type } = message;

      const response = await api(id);
      const { url } = response.data;

      const multimediaResponse = await apiMultimedia.get(url, {
        responseType: "arraybuffer",
      });
      const { data } = multimediaResponse;

      const multimedia = type === "image" ? await optimazeImage(data) : data;
      const filename = type === "document" ? message.filename : "";
      const typeNumber = type === "image" || type === "sticker" ? 1 : type === "document" && 5;

      const folderPath = path.join(__dirname, `multimedia/${idChat}/${type}/sent`);
      const filePath = path.join(folderPath, filename);
      const bdPath = `/multimedia/${idChat}/${type}/sent/${filename}`;

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      fs.writeFileSync(filePath, multimedia);

      await pool.query(
        "INSERT INTO message (id, idChat, sender, media, type, mimeType, filename) VALUES (?, ?, 0, ?, ?, ?, ?)",
        [idMessage, idChat, bdPath, typeNumber, mime_type, filename]
      );
      await pool.query(
        "UPDATE chat SET last_message = ?, unread = unread + 1, last_date = NOW() WHERE id = ?",
        ["Multimedia 📁", idChat]
      );

      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.idUser == idUser) {
          client.send(
            JSON.stringify({
              idChat,
              sender: 0,
              date: Date.now(),
              status: "sent",
              idMessage: idMessage,
              media: bdPath,
              type: typeNumber,
              mimeType: mime_type,
              filename,
              isActive: 1
            })
          );
        }
      });
      return;
    }

    const message = text.body;

    const [existingMessage] = await pool.query("SELECT * FROM message WHERE id = ?", [idMessage]);
    if (existingMessage.length > 0) {
      console.log("Mensaje duplicado");
      return;
    }

    await pool.query("INSERT INTO message (id, idChat, sender, message) VALUES (?, ?, 0, ?)", [
      idMessage,
      idChat,
      message,
    ]);
    await pool.query(
      "UPDATE chat SET last_message = ?, unread = unread + 1, last_date = NOW() WHERE id = ?",
      [message, idChat]
    );

    const [[{ is_bot_active: isChatbotActive }]] = await pool.query(
      "SELECT is_bot_active FROM chatbot WHERE id = 1"
    )
  
    let botResponse = null 
    if(idUser === 84 && !!isChatbotActive) {
      botResponse = await geminiResponse(message, idChat)
      // botResponse = await gptResponse(message, idChat) 
      const messageId = await sendWhatsAppMessage(phone_number_id, socioNumber, botResponse);
      await saveMessageToDatabase(pool, messageId, idChat, botResponse);

    }
    wss.clients.forEach(async (client) => {
      if (client.readyState === 1 && client.idUser == idUser) {
        await client.send(
          JSON.stringify({
            idChat,
            message,
            sender: 0,
            date: Date.now(),
            status: "sent",
            idMessage: idMessage,
            isActive: 1
          })
        );
        if (botResponse) {
        await client.send(
          JSON.stringify({
            idChat,
            botResponse,
            sender: 1, 
            date: Date.now(),
            idMessage: idMessage,
            isActive: 1
          })
        )
        }
      }
    });
  } catch (error) {
    console.error("Error processing incoming message:", error);
  }
};
