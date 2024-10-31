import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { getChats } from "../../controller/chat";
import { pool } from "../../database/config";
import { __esModule } from "@babel/preset-env";

jest.mock("../../database/config", () => ({
  __esModule: true,
  getConnection: jest.fn(),
  pool: {
    query: jest.fn(),
  },
}));

let req, res;

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

    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM chat WHERE user = ?`,
      [req.id]
    );
    expect(res.json).toHaveBeenCalledWith({ chats: mockChats });
  });

  test("Should return status 500 with error info when there's an error on database", async () => {
    pool.query.mockRejectedValue({ error: "unknow error" });

    await getChats(req, res);

    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM chat WHERE user = ?`,
      [req.id]
    );
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
});
