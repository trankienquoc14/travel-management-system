const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('travel_management', 'root', '', { dialect: 'mysql' });

async function fixServices() {
    try {
        // 1. Inactivate duplicates
        // We will keep ID 4 (16 chỗ), 5 (9 chỗ), 22 (7 chỗ), 23 (11 chỗ), 24 (29 chỗ), 25 (45 chỗ).
        // We will inactivate ID 14 (16 chỗ duplicate) and 15 (29 chỗ duplicate).
        await sequelize.query(`UPDATE services SET status = 'Inactive' WHERE service_id IN (14, 15)`);
        console.log("Inactivated duplicate services (14, 15)");

        // 2. Create missing "Xe 4 chỗ" service
        // First, check if a 4 chỗ service already exists (even if inactive)
        const [existing4] = await sequelize.query(`
            SELECT s.service_id FROM services s 
            JOIN vehicle_service_details vsd ON s.service_id = vsd.service_id 
            WHERE vsd.seat_capacity = 4
        `);

        if (existing4.length === 0) {
            // Get an image from a 4-seat vehicle
            const [veh4] = await sequelize.query(`SELECT image_url FROM vehicles WHERE seat_capacity = 4 LIMIT 1`);
            const imageUrl = veh4.length > 0 ? veh4[0].image_url : '';

            // Insert into services
            const [insertRes] = await sequelize.query(`
                INSERT INTO services (service_name, service_type, description, status, unit, base_cost, selling_price, image_url)
                VALUES ('Xe Sedan 4 chỗ / Ngày', 'Xe vận chuyển', 'Xe 4 chỗ đời mới, di chuyển linh hoạt, tiện lợi cho gia đình hoặc cặp đôi.', 'Active', 'Xe/Ngày', 800000, 850000, ?)
            `, { replacements: [imageUrl] });

            const newServiceId = insertRes;

            // Insert into vehicle_service_details
            await sequelize.query(`
                INSERT INTO vehicle_service_details (service_id, vehicle_type, seat_capacity, driver_required, vehicle_status)
                VALUES (?, 'Xe Sedan 4 chỗ / Ngày', 4, 1, 'AVAILABLE')
            `, { replacements: [newServiceId] });
            
            console.log("Created missing service for 4 chỗ: ID " + newServiceId);
        } else {
            console.log("4 chỗ service already exists: ID " + existing4[0].service_id);
            await sequelize.query(`UPDATE services SET status = 'Active' WHERE service_id = ?`, { replacements: [existing4[0].service_id] });
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

fixServices();
