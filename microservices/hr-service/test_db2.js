const mysql = require('mysql2/promise');
async function run() {
    const con = await mysql.createConnection({host:'localhost', user:'root', password:'', database: 'travel_management'});
    try {
        const [s] = await con.query("SELECT * FROM partner_services ORDER BY partner_service_id DESC LIMIT 10");
        console.log("Partner Services:");
        console.table(s);
    } catch(e) {}
    con.end();
}
run();