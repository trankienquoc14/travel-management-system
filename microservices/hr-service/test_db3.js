const mysql = require('mysql2/promise');
async function run() {
    const con = await mysql.createConnection({host:'localhost', user:'root', password:'', database: 'travel_management'});
    try {
        const [s] = await con.query("SELECT * FROM services WHERE service_name LIKE '%Suite%'");
        console.log("Services:");
        console.table(s);
    } catch(e) {}
    con.end();
}
run();