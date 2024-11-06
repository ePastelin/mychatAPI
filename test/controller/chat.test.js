import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { getChats, getMessages, sendMultimedia } from "../../controller/chat";
import { pool } from "../../database/config";
import { getChatDetails } from "../../helpers/querys";
import { apiMultimedia } from "../../helpers/axios";
import { saveMultimedia } from "../../services/messageService";

jest.mock("../../database/config", () => ({
  __esModule: true,
  getConnection: jest.fn(),
  pool: {
    query: jest.fn(),
  },
}));

let req, res, messageId, mediaId, userId;

beforeEach(() => {
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
});

describe("getChats controller", () => {
  beforeEach(() => {
    req = {
      id: 1,
      file: {
        mimeType: "image/png",
        buffer: Buffer.from("test buffer"),
        originalName: "test.png",
      },
      body: { idChat: crypto.randomUUID() },
    };
  });
  test("should response with chats", async () => {
    const mockChats = [
      {
        id: 1,
        ourNumber: 233424234342,
        socio_number: 23423423423,
        messages: "Chat 1",
        chat_type: 1,
        last_message: "Hola",
        socio_name: "Eduardo",
        last_date: "2024-10-30 12:58:54",
        unread: 3,
        user: 1,
      },
    ];
    pool.query.mockResolvedValueOnce([mockChats]);

    await getChats(req, res);

    expect(pool.query).toHaveBeenCalledWith(`SELECT * FROM chat WHERE user = ?`, [req.id]);
    expect(res.json).toHaveBeenCalledWith({ chats: mockChats });
  });

  test("Should return status 500 with error info when there's an error on database", async () => {
    pool.query.mockRejectedValue({ error: "unknow error" });

    await getChats(req, res);

    expect(pool.query).toHaveBeenCalledWith(`SELECT * FROM chat WHERE user = ?`, [req.id]);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "unknow error" });
  });

  test("Should return TypeError if there's no idUser in request", async () => {
    req.id = null;
    await expect(getChats(req.res)).rejects.toThrow(TypeError);
  });
});

describe("getMessages", () => {
  beforeEach(() => {
    req = {
      params: {
        id: 1,
      },
    };
  });

  test("Should return with the messages of the chat", async () => {
    const mockMessages = [
      {
        id: "wamid.HBgNNTIxOTk4MjkzMzIzMBUCABIYFjNFQjAxMjM0RUI1Nzg0NzdDODA1OTYA",
        idChat: 19,
        sender: 0,
        date: "2024-10-21T12:37:57.000Z",
        message: "?",
        type: null,
        status: "read",
        media: null,
        filename: null,
        mimeType: null,
      },
      {
        id: "wamid.HBgNNTIxOTk4MjkzMzIzMBUCABIYFjNFQjA0MkRDNjhDMjBFNEI5NEMwRDYA",
        idChat: 19,
        sender: 0,
        date: "2024-10-21T12:38:07.000Z",
        message: "Hola",
        type: null,
        status: "read",
        media: null,
        filename: null,
        mimeType: null,
      },
      {
        id: "wamid.HBgNNTIxOTk4MjkzMzIzMBUCABEYEjcyODk0NEVERDhDQkU4OTA0MwA=",
        idChat: 19,
        sender: 1,
        date: "2024-10-21T12:40:01.000Z",
        message: "?",
        type: null,
        status: "read",
        media: null,
        filename: null,
        mimeType: null,
      },
    ];

    pool.query.mockResolvedValueOnce([mockMessages]);

    await getMessages(req, res);

    expect(pool.query).toHaveBeenCalledWith("SELECT * FROM message WHERE idChat = (?) ORDER BY date ASC", [
      req.params.id,
    ]);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(mockMessages);
  });

  test("should return status 500 if the query fails and a message error", async () => {
    pool.query.mockRejectedValue({ error: "database error" });

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "database error" });
  });
});

jest.mock("../../services/messageService", () => ({
  saveMultimedia: jest.fn(),
}));
jest.mock("../../helpers/querys", () => ({
  getChatDetails: jest.fn(),
}));
jest.mock("../../helpers/axios", () => ({
  apiMultimedia: {
    post: jest.fn(),
  },
}));

describe("sendMultimedia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      file: {
        mimetype: "image/png",
        buffer: Buffer.from("test buffer"),
        originalname: "test.png",
      },
      body: { idChat: 1 },
    };
    messageId = crypto.randomUUID();
    mediaId = crypto.randomUUID();
    userId = "34";
  });

  describe("should return status 400 when catch an error", () => {
    test("getChatDetails fails", async () => {
      getChatDetails.mockRejectedValue({ message: "error with getChatDetails" });

      await sendMultimedia(req, res);

      expect(getChatDetails).toHaveBeenCalledWith(pool, req.body.idChat);
      expect(apiMultimedia.post).toHaveBeenCalledTimes(0);
      expect(res.status).toHaveBeenCalledWith(400);
      expect({ message: "error with getChatDetails" });
    });

    test("apiMultimedia first call fails", async () => {
      getChatDetails.mockResolvedValue({
        our_number: "our_number",
        socio_number: "socio_number",
        user: userId,
      });
      apiMultimedia.post.mockRejectedValue({ message: "error sending multimedia" });

      await sendMultimedia(req, res);

      expect(getChatDetails).toHaveBeenCalledTimes(1);
      expect(apiMultimedia.post).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "error sending multimedia" });
    });
  });

  test("should upload a file and send it succesfully", async () => {
    req.file.mimetype = "application/pdf";
    req.file.originname = "test.pdf";

    getChatDetails.mockResolvedValue({
      our_number: "our_number",
      socio_number: "socio_number",
      user: userId,
    });

    const { mimetype, buffer, originalname } = req.file;
    const type = mimetype.startsWith("image/") ? "image" : mimetype.startsWith("application/") && "document";
    const url = `our_number/media?messaging_product=whatsapp`;

    const blob = new Blob([buffer], { type: mimetype });
    const formData = new FormData();
    formData.append("file", blob, originalname);

    apiMultimedia.post
      .mockResolvedValueOnce({ data: { id: mediaId } })
      .mockResolvedValueOnce({ data: { messages: [{ id: messageId }] } });

    const message = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "socio_number",
      type,
    };

    if (type === "image") message.image = { id: mediaId };
    else if (type === "document") message.document = { id: mediaId, filename: originalname };

    await sendMultimedia(req, res);

    expect(getChatDetails).toHaveBeenCalledWith(pool, req.body.idChat);
    expect(apiMultimedia.post).toHaveBeenCalledTimes(2);
    expect(apiMultimedia.post).toHaveBeenNthCalledWith(1, url, formData);
    expect(apiMultimedia.post).toHaveBeenNthCalledWith(2, `our_number/messages`, message);
    expect(saveMultimedia).toHaveBeenCalledWith(
      mediaId,
      1,
      messageId,
      mimetype,
      "document",
      originalname,
      userId
    );
    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  test("should upload an image and send a message succesfully", async () => {
    getChatDetails.mockResolvedValue({
      our_number: "our_number",
      socio_number: "socio_number",
      user: userId,
    });

    const { mimetype, buffer, originalname } = req.file;
    const type = mimetype.startsWith("image/") ? "image" : mimetype.startsWith("application/") && "document";
    const url = `our_number/media?messaging_product=whatsapp`;

    const blob = new Blob([buffer], { type: mimetype });
    const formData = new FormData();
    formData.append("file", blob, originalname);

    apiMultimedia.post
      .mockResolvedValueOnce({ data: { id: mediaId } })
      .mockResolvedValueOnce({ data: { messages: [{ id: messageId }] } });

    await sendMultimedia(req, res);

    const message = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "socio_number",
      type,
    };

    if (type === "image") message.image = { id: mediaId };
    else if (type === "document") message.document = { id: mediaId, filename: originalname };

    expect(getChatDetails).toHaveBeenCalledWith(pool, req.body.idChat);
    expect(apiMultimedia.post).toHaveBeenCalledTimes(2);
    expect(apiMultimedia.post).toHaveBeenNthCalledWith(1, url, formData);
    expect(apiMultimedia.post).toHaveBeenNthCalledWith(2, `our_number/messages`, message);
    expect(saveMultimedia).toHaveBeenCalledWith(
      mediaId,
      1,
      messageId,
      mimetype,
      "image",
      originalname,
      userId
    );
    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  test("should return status 400 if the format is not valid or dangerous", async () => {
    req.file.mimetype = "undefined/exe";
    req.file.originname = "test.exe";

    await sendMultimedia(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, data: "Formato no válido" });
  });

  test("should not make any consult if the data is wrong", async () => {
    req.file.mimetype = "undefined/exe";
    req.file.originname = "test.exe";

    await sendMultimedia(req, res);

    expect(apiMultimedia.post).toHaveBeenCalledTimes(0);
    expect(getChatDetails).toHaveBeenCalledTimes(0);
  });

  test("should return status 400 if there is not a file in the request", async () => {
    req.file = null;

    await sendMultimedia(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "No file uploaded" });
    expect(apiMultimedia.post).toHaveBeenCalledTimes(0);
  });
});
