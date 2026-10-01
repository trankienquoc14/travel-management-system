const mysql = require('mysql2/promise');
(async () => {
    const conn = await mysql.createConnection({host: 'localhost', user: 'root', database: 'travel_management'});
    try {
        await conn.query("ALTER TABLE departures ADD COLUMN operational_status ENUM('Pending', 'Reviewing', 'Confirmed', 'Cancelled') DEFAULT 'Pending'");
        console.log('Added operational_status');
    } catch(e) { console.log(e.message); }
    try {
        await conn.query("ALTER TABLE departures ADD COLUMN decision_history JSON DEFAULT NULL");
        console.log('Added decision_history');
    } catch(e) { console.log(e.message); }
    await conn.end();
})();
