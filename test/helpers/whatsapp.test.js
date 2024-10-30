import { jest, test, describe, expect } from "@jest/globals";

import api from "../../helpers/axios";
import { sendWhatsAppMessage, sendMultimedia } from "../../helpers/whatsapp";
import { __esModule } from "@babel/preset-env";

jest.mock("../../helpers/axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
  apiMultimedia: {
    post: jest.fn(),
  },
}));

const ourNumber = "255264754344614";
const socioNumber = "529982933230";
const message = "Hello";

describe("sendWhatsappMessage function", () => {
  test("should send a Whatsapp message and return the message ID", async () => {
    const mockRespone = {
      data: {
        messages: [
          {
            id: "wamid.HBgNNTIxOTk4MjkzMzIzMBUCABEYEjdDNzg0NTlBREMyN0E4NjIyQwA=",
          },
        ],
      },
    };

    api.post.mockResolvedValueOnce(mockRespone);

    const messageId = await sendWhatsAppMessage(
      ourNumber,
      socioNumber,
      message
    );

    expect(api.post).toHaveBeenCalledWith(
      `https://graph.facebook.com/v20.0/${ourNumber}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: socioNumber,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }
    );

    expect(messageId).toBe(
      "wamid.HBgNNTIxOTk4MjkzMzIzMBUCABEYEjdDNzg0NTlBREMyN0E4NjIyQwA="
    );
  });

  test("should throw an error if there's no paramaters", async () => {
    await expect(sendWhatsAppMessage(ourNumber, socioNumber)).rejects.toThrow(
      "Incomplete data paramaters"
    );
    await expect(sendWhatsAppMessage(ourNumber)).rejects.toThrow(
      "Incomplete data paramaters"
    );
    await expect(sendWhatsAppMessage()).rejects.toThrow(
      "Incomplete data paramaters"
    );
  });

  test("should throw an error if the access token could not be decrypted", async () => {
    api.post.mockRejectedValue({
      response: {
        data: {
          error: {
            message: "The access token could not be decrypted",
            type: "OAuthException",
            code: 190,
            fbtrace_id: "ASjj7DrYqbYxr-EoH0xt5Mw",
          },
        },
      },
    });

    await expect(
      sendWhatsAppMessage(ourNumber, socioNumber, message)
    ).rejects.toThrow("The access token could not be decrypted");
  });
});
