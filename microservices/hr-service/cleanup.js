const mysql = require('mysql2/promise');
async function run() {
    const con = await mysql.createConnection({host:'localhost', user:'root', password:'', database: 'travel_management'});
    try {
        const [s] = await con.query("SELECT service_id, service_name, image_url, status FROM services ORDER BY service_id DESC LIMIT 10");
        console.log("Services:", s);
        
        // Clean up duplicates
        await con.query("DELETE FROM partner_services WHERE status = 'Pending' AND service_id > 15");
        await con.query("DELETE FROM services WHERE status = 'Pending' AND service_id > 15");
        console.log("Cleaned up duplicates > 15");
    } catch(e) {
        console.error(e);
    }
    con.end();
}
run();