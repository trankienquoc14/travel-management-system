const mysql = require('mysql2/promise');

(async () => {
    try {
        const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'travel_management' });
        await db.query("UPDATE custom_tour_quotes SET approval_status = 'Quote_Sent' WHERE quote_id = 10");
        console.log('Manually updated quote 10 to Quote_Sent');
        db.end();
    } catch (e) {
        console.log(e);
    }
})();
