const sequelize = require('./config/database');

async function setupDriverTables() {
  try {
    console.log("🚀 Đang khởi tạo các bảng CSDL cho Role Tài xế...");

    // 1. Thêm cột driver_id và vehicle_number vào bảng departures nếu chưa có
    try {
      await sequelize.query(`ALTER TABLE departures ADD COLUMN driver_id INT NULL;`);
      console.log("  + Đã thêm cột driver_id vào bảng departures.");
    } catch (e) {
      console.log("  - Cột driver_id đã tồn tại.");
    }

    try {
      await sequelize.query(`ALTER TABLE departures ADD COLUMN vehicle_number VARCHAR(50) NULL;`);
      console.log("  + Đã thêm cột vehicle_number vào bảng departures.");
    } catch (e) {
      console.log("  - Cột vehicle_number đã tồn tại.");
    }

    // 2. Tạo bảng driver_expenses (Kê khai chi phí chuyến đi: xăng dầu, cầu đường, bãi xe)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`driver_expenses\` (
        \`expense_id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`departure_id\` INT NOT NULL,
        \`driver_id\` INT NOT NULL,
        \`category\` VARCHAR(50) NOT NULL,
        \`amount\` DECIMAL(12, 2) NOT NULL,
        \`description\` TEXT NULL,
        \`receipt_image\` VARCHAR(255) NULL,
        \`status\` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY \`departure_id\` (\`departure_id\`),
        KEY \`driver_id\` (\`driver_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log("  + Đã khởi tạo thành công bảng driver_expenses.");

    // 3. Tạo bảng driver_incidents (Báo cáo sự cố hỏng hóc xe)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`driver_incidents\` (
        \`incident_id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`departure_id\` INT NULL,
        \`driver_id\` INT NOT NULL,
        \`vehicle_number\` VARCHAR(50) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`location\` VARCHAR(255) NULL,
        \`image_url\` VARCHAR(255) NULL,
        \`status\` ENUM('Reported', 'Processing', 'Resolved') DEFAULT 'Reported',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY \`driver_id\` (\`driver_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log("  + Đã khởi tạo thành công bảng driver_incidents.");

    // 4. Tạo tài khoản mẫu cho Role Tài xế nếu chưa có
    try {
      const [existing] = await sequelize.query(`SELECT user_id FROM users WHERE role = 8 OR role = 'Driver' LIMIT 1;`);
      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO users (full_name, email, password, role, phone, is_active)
          VALUES ('Nguyễn Văn Tài (Tài xế mẫu)', 'taixe@travelvn.com', '$2a$10$X8a4n6x0.5a.Z5U0...placeholder', 8, '0912345678', 1);
        `);
        console.log("  + Đã tạo tài khoản tài xế mẫu: taixe@travelvn.com (Role 8).");
      }
    } catch (e) {
      console.log("  - Tài khoản tài xế mẫu đã tồn tại hoặc bỏ qua.");
    }

    console.log("✅ HOÀN TẤT THIẾT LẬP CSDL CHO ROLE TÀI XẾ!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo bảng CSDL:", error);
    process.exit(1);
  }
}

setupDriverTables();
