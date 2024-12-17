import { pool } from "../../database/config.js";

// Servicio que contiene las queries
export const dashboardService = {
  async getUsers() {
    const [rows] = await pool.query("SELECT id, username FROM users WHERE isActive = 1");
    return rows;
  },

  async getTotalChats() {
    const [rows] = await pool.query("SELECT COUNT(*) AS total_chats FROM chat");
    return rows[0].total_chats;
  },

  async getChatsGrowth() {
    const [currentMonth] = await pool.query(
      `SELECT COUNT(*) AS chats_current_month 
       FROM chat 
       WHERE MONTH(create_date) = MONTH(CURDATE()) AND YEAR(create_date) = YEAR(CURDATE())`
    );

    const [previousMonth] = await pool.query(
      `SELECT COUNT(*) AS chats_previous_month 
       FROM chat 
       WHERE MONTH(create_date) = MONTH(CURDATE()) - 1 AND YEAR(create_date) = YEAR(CURDATE())`
    );

    const current = currentMonth[0]?.chats_current_month || 0;
    const previous = previousMonth[0]?.chats_previous_month || 0; // Default to 0 if no data

    let percentageIncrease;
    if (previous === 0) {
      percentageIncrease = current > 0 ? null : 0; // Null for "not applicable" when previous is 0
    } else {
      percentageIncrease = ((current - previous) / previous) * 100;
    }

    return { current, previous, percentageIncrease: percentageIncrease };
  },

  async getTopUserStats() {
    const [activeUser] = await pool.query(
      `SELECT u.id, u.username, COUNT(c.id) AS active_chats 
       FROM users u 
       JOIN chat c ON u.id = c.user 
       WHERE c.isActive = 1 
       GROUP BY u.id 
       ORDER BY active_chats DESC 
       LIMIT 1`
    );

    const [inactiveUser] = await pool.query(
      `SELECT u.id, u.username, COUNT(c.id) AS inactive_chats 
       FROM users u 
       JOIN chat c ON u.id = c.user 
       WHERE c.isActive = 0 
       GROUP BY u.id 
       ORDER BY inactive_chats DESC 
       LIMIT 1`
    );

    return {
      mostActive: activeUser[0] || null,
      mostInactive: inactiveUser[0] || null,
    };
  },

  async getMonthlySummary(year) {
    const [rows] = await pool.query(
      `SELECT 
        MONTH(create_date) AS month, 
        COUNT(*) AS total_chats
       FROM chat
       WHERE YEAR(create_date) = ?
       GROUP BY MONTH(create_date)`,
      [year]
    );

    // Mapear meses por nombre
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    // Crear un objeto con los meses y sus respectivos valores
    const labels = months;
    const data = months.map((_, index) => {
      const data = rows.find((row) => row.month === index + 1);
      return data ? data.total_chats : 0; // Si no hay datos para el mes, poner 0
    });

    const total = data.reduce((sum, value) => sum + value, 0);

    const title = 'Chats por mes';

    return { labels, data, total, title };
  },

  async getMonthlyMessageSummary(year) {
    const [rows] = await pool.query(
      `SELECT 
        MONTH(date) AS month, 
        COUNT(*) AS total_messages
       FROM message
       WHERE YEAR(date) = ?
       GROUP BY MONTH(date)`,
      [year]
    );
  
    // Mapear meses por nombre
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
  
    // Crear un objeto con los meses y sus respectivos valores
    const labels = months;
    const data = months.map((_, index) => {
      const row = rows.find((row) => row.month === index + 1);
      return row ? row.total_messages : 0; // Si no hay datos para el mes, poner 0
    });
    const total = data.reduce((sum, value) => sum + value, 0);
  
    const title = 'Mensajes por mes';
  
    return { labels, data, total, title };
  },
  
  async getTop4Users() {
    const [rows] = await pool.query(
      `SELECT 
        u.id, 
        u.username, 
        COUNT(c.id) AS total_chats, 
        (COUNT(c.id) / (SELECT COUNT(*) FROM chat WHERE isActive = 1)) * 100 AS percentage 
       FROM users u 
       JOIN chat c ON u.id = c.user 
       GROUP BY u.id 
       ORDER BY total_chats DESC 
       LIMIT 4`
    );
    return rows;
  },

  async getInactiveChatsGrowth() {
    const [currentMonth] = await pool.query(
      `SELECT COUNT(*) AS inactive_current_month
       FROM chat
       WHERE MONTH(create_date) = MONTH(CURDATE()) AND YEAR(create_date) = YEAR(CURDATE()) AND isActive = 0`
    );

    const [previousMonth] = await pool.query(
      `SELECT COUNT(*) AS inactive_previous_month
       FROM chat
       WHERE MONTH(create_date) = MONTH(CURDATE()) - 1 AND YEAR(create_date) = YEAR(CURDATE()) AND isActive = 0`
    );

    const current = currentMonth[0]?.inactive_current_month || 0;
    const previous = previousMonth[0]?.inactive_previous_month || 0;

    const growthPercentage = previous === 0 
      ? current * 100 
      : ((current - previous) / previous) * 100;

    return {title: 'Desactivos', current, previous, growthPercentage };
  },

  async getActiveChatsGrowth() {
    const [currentMonth] = await pool.query(
      `SELECT COUNT(*) AS active_current_month
       FROM chat
       WHERE MONTH(create_date) = MONTH(CURDATE()) AND YEAR(create_date) = YEAR(CURDATE()) AND isActive = 1`
    );

    const [previousMonth] = await pool.query(
      `SELECT COUNT(*) AS active_previous_month
       FROM chat
       WHERE MONTH(create_date) = MONTH(CURDATE()) - 1 AND YEAR(create_date) = YEAR(CURDATE()) AND isActive = 1`
    );

    const current = currentMonth[0]?.active_current_month || 0;
    const previous = previousMonth[0]?.active_previous_month || 0;

    const growthPercentage = previous === 0 
      ? current * 100 
      : ((current - previous) / previous) * 100;

    return {title: 'Activos', current, previous, growthPercentage };
  },

  async getMessagesGrowth() {
    const [currentMonth] = await pool.query(
      `SELECT COUNT(*) AS messages_current_month
       FROM message
       WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`
    );

    const [previousMonth] = await pool.query(
      `SELECT COUNT(*) AS messages_previous_month
       FROM message
       WHERE MONTH(date) = MONTH(CURDATE()) - 1 AND YEAR(date) = YEAR(CURDATE())`
    );

    const current = currentMonth[0]?.messages_current_month || 0;
    const previous = previousMonth[0]?.messages_previous_month || 0;

    const growthPercentage = previous === 0 
      ? current * 100 
      : ((current - previous) / previous) * 100;

    return {title: 'Mensajes', current, previous, growthPercentage };
  },

  async getYearlyChatSummary() {
    const [rows] = await pool.query(
      `SELECT 
          YEAR(create_date) AS year, 
          COUNT(*) AS total_chats
       FROM chat
       WHERE YEAR(create_date) >= 2024
       GROUP BY YEAR(create_date)
       ORDER BY YEAR(create_date)`
    );
  
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  
    const labels = years;
    const data = years.map((year) => {
      const row = rows.find((r) => r.year === year);
      return row ? row.total_chats : 0;
    });
  
    const total = data.reduce((sum, value) => sum + value, 0);
    const title = 'Chats por Año';
  
    return { labels, data, total, title };
  },

  async getYearlyMessageSummary() {
    const [rows] = await pool.query(
      `SELECT 
          YEAR(date) AS year, 
          COUNT(*) AS total_messages
       FROM message
       WHERE YEAR(date) >= 2024
       GROUP BY YEAR(date)
       ORDER BY YEAR(date)`
    );
  
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  
    const labels = years;
    const data = years.map((year) => {
      const row = rows.find((r) => r.year === year);
      return row ? row.total_messages : 0;
    });
  
    const total = data.reduce((sum, value) => sum + value, 0);
    const title = 'Mensajes por Año';
  
    return { labels, data, total, title };
  }
  
  
};
