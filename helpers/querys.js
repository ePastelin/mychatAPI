export const saveMessageToDatabase = async (pool, messageId, chatId, message) => {
    const result = await pool.query(
        'INSERT INTO message (id, chat_id, sender, message) VALUES (?, ?, 1, ?)', 
        [messageId, chatId, message]
    );
    
    const saving = await pool.query(
        'INSERT INTO chat (last_message) VALUES (?) WHERE id = ?', [message, chatId]
    )

    return result;
};

export const getChatDetails = async (pool, chatId) => {
    const [rows] = await pool.query(
        'SELECT our_number, socio_number FROM chat WHERE id = ?', 
        [chatId]
    );
    return rows[0];
};

export const updateMessageStatus = async (pool, idMessage, status) => {
    await pool.query('UPDATE message SET status = ? WHERE id = ?', [status, idMessage]);
}