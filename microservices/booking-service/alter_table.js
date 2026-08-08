const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'travel_management'
        });

        const sql = `
        ALTER TABLE service_requests 
        ADD COLUMN service_booking_id int(11) DEFAULT NULL AFTER departure_id;
        `;

        await connection.query(sql);
        console.log("Table 'service_requests' altered successfully.");
        await connection.end();
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'service_booking_id' already exists.");
        } else {
            console.error("Error altering table:", error);
        }
    }
}

alterTable();
