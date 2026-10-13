const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('travel_management', 'root', '', { dialect: 'mysql' });

async function run() {
    try {
        const [services] = await sequelize.query(`
            SELECT s.service_id, s.service_name, vsd.seat_capacity,
                   (
                       SELECT COUNT(*) FROM travel_management.vehicles v 
                       WHERE v.seat_capacity = vsd.seat_capacity 
                       AND v.status = 'AVAILABLE'
                   ) as available_vehicles_count
            FROM services s
            JOIN vehicle_service_details vsd ON s.service_id = vsd.service_id
            WHERE s.service_type='Xe vận chuyển'
        `);
        console.log(services);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
