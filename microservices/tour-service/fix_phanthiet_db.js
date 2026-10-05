const sequelize = require('./config/database');

async function fixDb() {
    try {
        console.log('Fixing partners with NULL destination_id...');
        
        // Update Phú Quý Island Hotel & Centara Mirage Resort Mũi Né -> destination_id = 11 (Mũi Né)
        const [res1] = await sequelize.query(`
            UPDATE partners 
            SET destination_id = 11 
            WHERE partner_name LIKE '%Phú Quý%' OR partner_name LIKE '%Mũi Né%' OR partner_name LIKE '%Phan Thiết%'
            AND (destination_id IS NULL OR destination_id = 0)
        `);
        console.log('Updated partners for Mũi Né/Phan Thiết/Phú Quý:', res1);

        // Check if there are services for Phú Quý Island Hotel
        const [p55] = await sequelize.query(`SELECT partner_id, partner_name FROM partners WHERE partner_name LIKE '%Phú Quý%'`);
        if (p55.length > 0) {
            const pId = p55[0].partner_id;
            const [srvs] = await sequelize.query(`SELECT service_id, service_name FROM services WHERE partner_id = ${pId}`);
            console.log(`Services for Phú Quý Island Hotel (partner_id ${pId}):`, srvs);
            if (srvs.length === 0) {
                console.log('Adding room service for Phú Quý Island Hotel...');
                await sequelize.query(`
                    INSERT INTO services (partner_id, destination_id, service_name, service_type, base_cost, selling_price, unit, status)
                    VALUES (${pId}, 11, 'Phòng Deluxe Sea View', 'Khách sạn', 700000.00, 900000.00, 'Phòng/Đêm', 'Active')
                `);
            }
        }

    } catch(e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

fixDb();
