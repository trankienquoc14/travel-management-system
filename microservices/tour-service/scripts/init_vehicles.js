const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize('travel_management', 'root', '', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: console.log
});

async function initDB() {
  try {
    console.log('--- Creating vehicles table ---');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
        license_plate VARCHAR(50) NOT NULL UNIQUE,
        seat_capacity INT NOT NULL,
        vehicle_type VARCHAR(100) NOT NULL,
        brand_model VARCHAR(150),
        color VARCHAR(50),
        status ENUM('AVAILABLE', 'IN_TOUR', 'MAINTENANCE', 'INACTIVE') DEFAULT 'AVAILABLE',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('--- Creating vehicle_maintenances table ---');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vehicle_maintenances (
        maintenance_id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason VARCHAR(255),
        status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'IN_PROGRESS',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('--- Creating tour_vehicle_assignments table ---');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tour_vehicle_assignments (
        assignment_id INT AUTO_INCREMENT PRIMARY KEY,
        departure_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        driver_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'ASSIGNED',
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert sample physical vehicles if empty
    const [existing] = await sequelize.query(`SELECT COUNT(*) as count FROM vehicles`);
    if (existing[0].count === 0) {
      console.log('--- Inserting sample vehicles ---');
      await sequelize.query(`
        INSERT INTO vehicles (license_plate, seat_capacity, vehicle_type, brand_model, color, status, notes) VALUES
        ('43A-123.45', 7, 'Xe 7 chỗ', 'Toyota Fortuner 2023', 'Trắng', 'AVAILABLE', 'Xe mới bảo dưỡng định kỳ, lốp tốt'),
        ('43A-999.88', 7, 'Xe 7 chỗ', 'Toyota Innova Cross 2024', 'Đen', 'AVAILABLE', 'Xe mới nhập đội, nội thất da cao cấp'),
        ('43B-012.34', 29, 'Xe 29 chỗ', 'Thaco Town 2023', 'Trắng-Xanh', 'AVAILABLE', 'Trang bị wifi, tủ lạnh mini, Micro'),
        ('43B-055.66', 29, 'Xe 29 chỗ', 'Hyundai County 2022', 'Bạc', 'MAINTENANCE', 'Đang thay hệ thống phanh tại gara (04/10 - 08/10)'),
        ('43B-777.99', 16, 'Xe 16 chỗ', 'Ford Transit Luxury 2023', 'Trắng', 'AVAILABLE', 'Ghế da ngả thoải mái, điều hòa 2 dàn'),
        ('43B-888.11', 45, 'Xe 45 chỗ', 'Hyundai Universe Express', 'Đỏ-Trắng', 'AVAILABLE', 'Hầm hàng rộng 3 khoang, karaoke gia đình')
      `);
      console.log('✅ Sample vehicles inserted!');
    }

    console.log('🎉 Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

initDB();
