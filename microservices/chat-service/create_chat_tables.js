const mysql = require('../node_modules/mysql2/promise');

async function createChatTables() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'travel_management'
  });

  console.log('Connected to MySQL travel_management');

  // 1. Tạo bảng chat_conversations
  await conn.query(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      conversation_id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NULL,
      guest_id VARCHAR(100) NULL,
      customer_name VARCHAR(150) NOT NULL,
      customer_email VARCHAR(150) NULL,
      customer_phone VARCHAR(50) NULL,
      staff_id INT NULL,
      status ENUM('active', 'closed') DEFAULT 'active',
      last_message TEXT NULL,
      last_message_at DATETIME NULL,
      last_message_sender ENUM('customer', 'staff', 'bot') NULL,
      unread_staff_count INT NOT NULL DEFAULT 0,
      unread_customer_count INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_customer (customer_id),
      INDEX idx_guest (guest_id),
      INDEX idx_staff (staff_id),
      INDEX idx_status (status),
      INDEX idx_last_message_at (last_message_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ Created chat_conversations table');

  // 2. Tạo bảng chat_messages
  await conn.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      message_id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_type ENUM('customer', 'staff', 'bot') NOT NULL,
      sender_id INT NULL,
      sender_name VARCHAR(150) NOT NULL,
      message_type ENUM('text', 'image', 'file', 'location', 'audio') NOT NULL DEFAULT 'text',
      content TEXT NULL,
      file_url VARCHAR(500) NULL,
      file_name VARCHAR(255) NULL,
      file_size INT NULL,
      latitude DECIMAL(10, 8) NULL,
      longitude DECIMAL(11, 8) NULL,
      duration INT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_conversation (conversation_id),
      INDEX idx_created (created_at),
      CONSTRAINT fk_chat_conv FOREIGN KEY (conversation_id) 
        REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ Created chat_messages table');

  await conn.end();
  console.log('🚀 Done creating chat tables!');
}

createChatTables().catch(err => {
  console.error('Error creating chat tables:', err);
  process.exit(1);
});
