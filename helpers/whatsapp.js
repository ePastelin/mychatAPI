import api from "./axios.js";

export const sendWhatsAppMessage = async (ourNumber, socioNumber, message) => {
  if (!ourNumber || !socioNumber || !message) {
    throw new Error("Incomplete data paramaters");
  }

  const url = `https://graph.facebook.com/v20.0/${ourNumber}/messages`;

  const whatsappData = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: socioNumber,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };

  try {
    const response = await api.post(url, whatsappData);
    return response.data.messages[0].id;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      const metaErrorMessage = error.response.data.error.message;
      throw new Error(metaErrorMessage || "Error sending Whatsapp message");
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};
