const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('travel_management', 'root', '', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: console.log
});

async function updateSchema() {
  try {
    const [cols] = await sequelize.query('DESCRIBE vehicles');
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('vehicle_code')) {
      await sequelize.query('ALTER TABLE vehicles ADD COLUMN vehicle_code VARCHAR(50) AFTER vehicle_id');
      console.log('Added vehicle_code');
    }
    if (!colNames.includes('image_url')) {
      await sequelize.query('ALTER TABLE vehicles ADD COLUMN image_url VARCHAR(255) AFTER brand_model');
      console.log('Added image_url');
    }

    // Update existing rows with vehicle_code if empty
    await sequelize.query(`
      UPDATE vehicles 
      SET vehicle_code = CONCAT('XE-', seat_capacity, 'C-0', vehicle_id) 
      WHERE vehicle_code IS NULL OR vehicle_code = ''
    `);

    // Add image_url default sample image links individually
    await sequelize.query("UPDATE vehicles SET image_url = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80' WHERE seat_capacity = 7 AND (image_url IS NULL OR image_url = '')");
    await sequelize.query("UPDATE vehicles SET image_url = 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80' WHERE seat_capacity = 16 AND (image_url IS NULL OR image_url = '')");
    await sequelize.query("UPDATE vehicles SET image_url = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80' WHERE seat_capacity = 29 AND (image_url IS NULL OR image_url = '')");
    await sequelize.query("UPDATE vehicles SET image_url = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80' WHERE seat_capacity = 45 AND (image_url IS NULL OR image_url = '')");

    console.log('✅ Vehicles table schema updated successfully!');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
}
updateSchema();
