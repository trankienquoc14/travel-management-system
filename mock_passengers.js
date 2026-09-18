const sequelize = require('D:/KLTN/backend/config/database'); 
async function run() { 
    try {
        await sequelize.query("INSERT INTO booking_passengers (booking_id, full_name) VALUES (4, 'Trần Kiến Quốc')");
        await sequelize.query("INSERT INTO booking_passengers (booking_id, full_name) VALUES (4, 'Nguyễn Thị Minh H')"); 
        console.log('Mocked');
    } catch(e) {
        console.log(e);
    }
    process.exit(0); 
} 
run();
