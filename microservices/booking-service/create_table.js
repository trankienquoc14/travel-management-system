const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'travel_management'
        });

        const sql = `
        CREATE TABLE IF NOT EXISTS service_bookings (
            booking_id int(11) NOT NULL AUTO_INCREMENT,
            customer_id int(11) NOT NULL,
            service_id int(11) NOT NULL,
            quantity int(11) NOT NULL DEFAULT 1,
            usage_date date NOT NULL,
            total_amount decimal(15,2) NOT NULL,
            payment_method enum('Prepaid','Pay_at_Location') DEFAULT 'Prepaid',
            status enum('Pending','Confirmed','Paid','Rejected','Completed') DEFAULT 'Pending',
            voucher_code varchar(50) DEFAULT NULL,
            notes text DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (booking_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `;

        await connection.query(sql);
        console.log("Table 'service_bookings' created successfully.");
        await connection.end();
    } catch (error) {
        console.error("Error creating table:", error);
    }
}

createTable();
