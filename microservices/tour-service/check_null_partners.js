const sequelize = require('./config/database');

async function checkNullPartners() {
    try {
        const [nullPartners] = await sequelize.query(`
            SELECT partner_id, partner_name, partner_type, destination_id 
            FROM partners 
            WHERE destination_id IS NULL OR destination_id = 0
        `);
        console.log(`Partners with NULL or 0 destination_id count: ${nullPartners.length}`);
        if (nullPartners.length > 0) {
            console.log(nullPartners);
        }

    } catch(e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkNullPartners();
