const mysql = require('mysql2/promise');
async function run() {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'travel_management' });
    await conn.query("UPDATE custom_tour_requests SET status = 'Customer_Revision' WHERE request_id = 24");
    await conn.query("UPDATE custom_tour_requests SET status = 'Manager_Rejected' WHERE request_id = 25");
    console.log('Fixed DB statuses for testing!');
    process.exit(0);
}
run();
