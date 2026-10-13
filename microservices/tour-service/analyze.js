const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('travel_management', 'root', '', { dialect: 'mysql' });

async function analyze() {
    try {
        const [services] = await sequelize.query(`SELECT s.service_id, s.service_name, v.seat_capacity, v.license_plate, v.vehicle_model FROM services s JOIN vehicle_service_details v ON s.service_id = v.service_id WHERE s.service_type='Xe vận chuyển'`);
        const [vehicles] = await sequelize.query(`SELECT vehicle_id, license_plate, seat_capacity, vehicle_type, brand_model FROM vehicles`);
        
        console.log("=== SERVICES (Customer Facing) ===");
        console.table(services);
        console.log("\n=== VEHICLES (Internal Fleet) ===");
        console.table(vehicles);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
analyze();
