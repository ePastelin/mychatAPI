export const changeChatbotStatus = async (chatbotRepository) => {
    const chatbotStatus = await chatbotRepository.getChatbotStatus()

    const botStatusChanged = !chatbotStatus // !true = false || !false = true

    const updatedChatbot = await chatbotRepository.changeStatus(botStatusChanged)

    return updatedChatbot
}

export const getChatbotStatus = async (chatbotRepository) => {
    return await chatbotRepository.getChatbotStatus()
}