const sequelize = require('./config/database');

async function inspectVehicles() {
    try {
        console.log('--- TABLES IN DB ---');
        const [tables] = await sequelize.query(`SHOW TABLES`);
        console.log(tables.map(t => Object.values(t)[0]));

        const vehicleTables = tables.map(t => Object.values(t)[0]).filter(t => t.includes('vehicle') || t.includes('car') || t.includes('transport') || t.includes('driver'));
        console.log('\n--- VEHICLE RELATED TABLES ---', vehicleTables);

        for (const tbl of vehicleTables) {
            console.log(`\n=== COLUMNS IN ${tbl} ===`);
            const [cols] = await sequelize.query(`DESCRIBE ${tbl}`);
            console.log(cols.map(c => `${c.Field} (${c.Type})`));
            
            const [rows] = await sequelize.query(`SELECT * FROM ${tbl} LIMIT 10`);
            console.log(`Sample rows in ${tbl} (${rows.length} total):`, rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

inspectVehicles();
