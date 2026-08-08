const mysql = require('mysql2/promise');
async function run() {
    const con = await mysql.createConnection({host:'localhost', user:'root', password:'', database: 'travel_management'});
    try {
        const [s] = await con.query("SELECT service_id, service_name, image_url, status FROM services ORDER BY service_id DESC LIMIT 5");
        console.log(s);
    } catch(e) {}
    con.end();
}
run();