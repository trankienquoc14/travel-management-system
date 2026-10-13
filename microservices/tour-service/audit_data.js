const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('travel_management', 'root', '', { dialect: 'mysql' });

async function run() {
    try {
        const [services] = await sequelize.query(`
            SELECT s.service_id, s.service_name, v.seat_capacity, s.image_url 
            FROM services s 
            JOIN vehicle_service_details v ON s.service_id = v.service_id 
            WHERE s.service_type='Xe vận chuyển'
        `);
        const [vehicles] = await sequelize.query(`
            SELECT vehicle_id, seat_capacity, vehicle_type, brand_model, image_url, status 
            FROM vehicles
        `);
        
        console.log(JSON.stringify({services, vehicles}, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
