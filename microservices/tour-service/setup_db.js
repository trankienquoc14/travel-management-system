const mysql = require('mysql2/promise');
(async () => {
    try {
        const conn = await mysql.createConnection({host: 'localhost', user: 'root', database: 'travel_management'});
        await conn.execute(`CREATE TABLE IF NOT EXISTS service_request_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL,
            departure_id INT NOT NULL,
            request_type ENUM('INITIAL', 'SUPPLEMENT') DEFAULT 'INITIAL',
            passenger_count INT,
            created_by INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) DEFAULT 'DRAFT'
        )`);
        
        try {
            await conn.execute(`ALTER TABLE service_requests ADD COLUMN group_id INT, ADD COLUMN service_type VARCHAR(50), ADD COLUMN quantity INT`);
        } catch (err) {
            console.log("Alter table might already exist: ", err.message);
        }
        
        console.log('DB updated');
        await conn.end();
    } catch (e) {
        console.error(e);
    }
})();
