const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('travel_management', 'root', '', { dialect: 'mysql' });

async function syncImages() {
    try {
        const [services] = await sequelize.query(`
            SELECT s.service_id, v.seat_capacity 
            FROM services s 
            JOIN vehicle_service_details v ON s.service_id = v.service_id 
            WHERE s.service_type='Xe vận chuyển'
        `);
        const [vehicles] = await sequelize.query(`
            SELECT seat_capacity, image_url 
            FROM vehicles
        `);
        
        for (const s of services) {
            const match = vehicles.find(v => v.seat_capacity === s.seat_capacity && v.image_url);
            if (match) {
                await sequelize.query(`UPDATE services SET image_url = ? WHERE service_id = ?`, {
                    replacements: [match.image_url, s.service_id]
                });
                console.log(`Updated service ${s.service_id} (capacity ${s.seat_capacity}) with image ${match.image_url}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
syncImages();
