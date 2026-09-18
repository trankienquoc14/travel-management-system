const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('travel_management', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

async function addColumn() {
    try {
        await sequelize.query('ALTER TABLE bookings ADD COLUMN breakdown JSON DEFAULT NULL;');
        console.log('Column added successfully');
    } catch (e) {
        console.log('Error or already exists:', e.message);
    }
    process.exit(0);
}

addColumn();
