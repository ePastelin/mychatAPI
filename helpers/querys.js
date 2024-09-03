export const saveMessageToDatabase = async (pool, messageId, chatId, message) => {
    const result = await pool.query(
        'INSERT INTO message (id, chat_id, sender, message) VALUES (?, ?, 1, ?)', 
        [messageId, chatId, message]
    );
    return result;
};

export const getChatDetails = async (pool, chatId) => {
    const [rows] = await pool.query(
        'SELECT our_number, socio_number FROM chat WHERE id = ?', 
        [chatId]
    );
    return rows[0];
};