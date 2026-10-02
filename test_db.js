const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('travel_management', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

async function test() {
    const [tours] = await sequelize.query('SELECT destination FROM tours LIMIT 5');
    console.log('Tours destinations:', tours);
    
    const [partners] = await sequelize.query('SELECT p.partner_name, d.destination_name FROM partners p LEFT JOIN destinations d ON p.destination_id = d.destination_id WHERE p.partner_type = "Accommodation" OR p.partner_type = "Khách sạn" LIMIT 5');
    console.log('Partners destinations:', partners);
    
    await sequelize.close();
}
test();
