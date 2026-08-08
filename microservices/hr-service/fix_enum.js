const mysql = require('mysql2/promise');
async function run() {
    const con = await mysql.createConnection({host:'localhost', user:'root', password:'', database: 'travel_management'});
    try {
        await con.query("ALTER TABLE services MODIFY status ENUM('Active', 'Inactive', 'Pending') DEFAULT 'Active'");
        await con.query("ALTER TABLE partner_services MODIFY status ENUM('Active', 'Inactive', 'Pending') DEFAULT 'Active'");
        console.log("Altered ENUMs successfully");
        
        // Also update the empty status ones to 'Pending'
        await con.query("UPDATE services SET status = 'Pending' WHERE status = ''");
        await con.query("UPDATE partner_services SET status = 'Pending' WHERE status = ''");
        console.log("Updated empty statuses");
    } catch(e) {
        console.error(e);
    }
    con.end();
}
run();