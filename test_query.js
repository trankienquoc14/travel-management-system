const sequelize = require('D:/KLTN/backend/config/database'); 
async function run() { 
    try {
        const [res] = await sequelize.query("SELECT b.booking_id, (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('name', full_name)), ']') FROM booking_passengers bp WHERE bp.booking_id = b.booking_id) as passengers_list FROM bookings b WHERE b.booking_id = 6");
        console.log(JSON.stringify(res, null, 2));
    } catch(e) {
        console.log(e);
    }
    process.exit(0); 
} 
run();
