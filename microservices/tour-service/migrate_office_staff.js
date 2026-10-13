const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('travel_management', 'root', '', { dialect: 'mysql' });

async function migrate() {
  try {
    console.log('Altering vehicles table...');
    await sequelize.query(`ALTER TABLE vehicles MODIFY status ENUM('AVAILABLE','IN_TOUR','MAINTENANCE','REPAIR','INACTIVE') DEFAULT 'AVAILABLE';`);
    
    console.log('Creating vehicle_status_history table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vehicle_status_history (
        history_id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        reason TEXT,
        updated_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Migration successful');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}
migrate();
