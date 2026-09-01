const sequelize = require('./config/database');

async function createTripTables() {
  try {
    console.log("Đang khởi tạo các bảng departure_updates và trip_reports...");
    
    // 1. Tạo bảng departure_updates
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`departure_updates\` (
        \`update_id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`departure_id\` INT NOT NULL,
        \`guide_id\` INT NOT NULL,
        \`location\` VARCHAR(255) NOT NULL,
        \`activity\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`image_url\` VARCHAR(255) DEFAULT NULL,
        \`itinerary_id\` INT DEFAULT NULL,
        \`delay_minutes\` INT DEFAULT 0,
        \`delay_reason\` VARCHAR(255) DEFAULT NULL,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY \`departure_id\` (\`departure_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // Add itinerary_id, delay_minutes, delay_reason columns if departure_updates already existed
    try {
      await sequelize.query(`ALTER TABLE departure_updates ADD COLUMN itinerary_id INT DEFAULT NULL;`);
    } catch (e) {}
    try {
      await sequelize.query(`ALTER TABLE departure_updates ADD COLUMN delay_minutes INT DEFAULT 0;`);
    } catch (e) {}
    try {
      await sequelize.query(`ALTER TABLE departure_updates ADD COLUMN delay_reason VARCHAR(255) DEFAULT NULL;`);
    } catch (e) {}

    // 2. Tạo bảng trip_reports (Báo cáo chuyến đi của HDV)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`trip_reports\` (
        \`report_id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`departure_id\` INT NOT NULL,
        \`guide_id\` INT NOT NULL,
        \`total_passengers\` INT DEFAULT 0,
        \`checked_in_passengers\` INT DEFAULT 0,
        \`incident_count\` INT DEFAULT 0,
        \`vehicle_feedback\` TEXT DEFAULT NULL,
        \`hotel_feedback\` TEXT DEFAULT NULL,
        \`restaurant_feedback\` TEXT DEFAULT NULL,
        \`guide_notes\` TEXT NOT NULL,
        \`overall_rating\` VARCHAR(50) DEFAULT 'Xuất sắc',
        \`status\` ENUM('Submitted','Approved') NOT NULL DEFAULT 'Submitted',
        \`admin_note\` TEXT DEFAULT NULL,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY \`departure_id\` (\`departure_id\`),
        KEY \`guide_id\` (\`guide_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    console.log("✅ Đã tạo/cập nhật thành công các bảng departure_updates và trip_reports trong CSDL travel_management!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi tạo bảng:", error);
    process.exit(1);
  }
}

createTripTables();
