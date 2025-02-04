export const changeChatbotStatus = async (chatbotRepository) => {
    const chatbotStatus = await chatbotRepository.getChatbotStatus()

    const botStatusChanged = !chatbotStatus // !true = false || !false = true

    await chatbotRepository.changeStatus(botStatusChanged)

    return botStatusChanged
}

export const getChatbotStatus = async (chatbotRepository) => {
    return await chatbotRepository.getChatbotStatus()
}