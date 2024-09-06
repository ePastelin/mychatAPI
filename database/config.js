import { createPool } from "mysql2/promise";
import 'dotenv/config';


const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT } = process.env;

export const pool = createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    port: DB_PORT,
})

console.log(DB_HOST, DB_PORT)

export const getConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected');
        connection.release(); // Release the connection back to the pool
    }catch (error) {
        console.log(error);
        throw new Error('Database connection failed');
    }
}