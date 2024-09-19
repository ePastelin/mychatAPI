import { pool } from "../database/config";

const updateTemplateStatus = async (id, status) => {
    const sql = `
      UPDATE templates
      SET status_id = (SELECT id FROM templateStatus WHERE value = ?)
      WHERE id = ?;
    `;
    
    try {
      const [result] = await pool.query(sql, [status, id]);
      console.log("hice la inserción")
      return result;
    } catch (error) {
      console.error('Error updating template status:', error);
      throw error;
    }
  };