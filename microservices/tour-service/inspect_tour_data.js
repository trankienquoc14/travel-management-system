const sequelize = require('./config/database');

async function inspect() {
    try {
        const [partners] = await sequelize.query(`
            SELECT partner_id, partner_name, partner_type, destination_id 
            FROM partners 
            WHERE partner_type = 'Restaurant' OR partner_type = 'Nhà hàng'
        `);

        console.log(`Found ${partners.length} restaurant partners:`);
        console.log(partners);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

inspect();
