const mysql = require('mysql2/promise'); 
async function run() { 
    const c = await mysql.createConnection({host:'localhost',user:'root',password:'',database:'travel_management'}); 
    const [rows] = await c.query("SELECT * FROM service_requests WHERE service_type = 'RESTAURANT' ORDER BY request_id DESC LIMIT 1"); 
    console.log(rows[0].request_content); 
    c.end(); 
} 
run();
