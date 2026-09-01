const sequelize = require('./config/database');

async function createTable() {
  try {
    console.log("Đang khởi tạo bảng leave_requests...");
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`leave_requests\` (
        \`request_id\` int(11) NOT NULL AUTO_INCREMENT,
        \`employee_id\` int(11) NOT NULL,
        \`request_type\` enum('Future_Leave','Past_Explanation') NOT NULL DEFAULT 'Future_Leave',
        \`leave_type\` varchar(100) DEFAULT NULL,
        \`explanation_type\` varchar(100) DEFAULT NULL,
        \`start_date\` date DEFAULT NULL,
        \`end_date\` date DEFAULT NULL,
        \`target_date\` date DEFAULT NULL,
        \`proposed_check_in\` time DEFAULT NULL,
        \`proposed_check_out\` time DEFAULT NULL,
        \`reason\` text NOT NULL,
        \`attachment_url\` varchar(255) DEFAULT NULL,
        \`status\` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
        \`manager_id\` int(11) DEFAULT NULL,
        \`manager_note\` text DEFAULT NULL,
        \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`request_id\`),
        KEY \`employee_id\` (\`employee_id\`),
        CONSTRAINT \`leave_requests_ibfk_1\` FOREIGN KEY (\`employee_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log("✅ Đã tạo thành công bảng leave_requests trong CSDL travel_management!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi tạo bảng leave_requests:", error);
    process.exit(1);
  }
}

createTable();
