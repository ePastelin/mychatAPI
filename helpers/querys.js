export const saveMessageToDatabase = async (pool, messageId, chatId, message) => {
    const result = await pool.query(
        'INSERT INTO message (id, idChat, sender, message) VALUES (?, ?, 1, ?)', 
        [messageId, chatId, message]
    );
    
    const saving = await pool.query(
        'UPDATE chat SET last_message = ?, last_date = NOW() WHERE id = ?', 
        [message, chatId]
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

export const updateMessageStatus = async (pool, idMessage, status) => {
    await pool.query('UPDATE message SET status = ? WHERE id = ?', [status, idMessage]);
}

export const createChats = async (body) => {

    const {id, ourNumber, socioNumber, chatType, lastMessage, socioName} = body

    await pool.query('INSERT INTO chat (id, our_number, socio_number, chat_type, last_message, socio_name) VALUES (?, ?, ?, ?, ?, ?)', 
        [id, ourNumber, socioNumber, chatType, lastMessage, socioName]
    )
}