const fs = require('fs');
const mysql = require('mysql2/promise');

async function restoreToursTable() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'travel_management',
        multipleStatements: true
    });

    console.log('1. Setting foreign key checks to 0 and dropping table tours if exists...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS tours');

    console.log('2. Creating table tours...');
    const createTableSql = `
    CREATE TABLE \`tours\` (
      \`tour_id\` int(11) NOT NULL AUTO_INCREMENT,
      \`tour_name\` varchar(255) NOT NULL,
      \`description\` text DEFAULT NULL,
      \`destination\` varchar(255) DEFAULT NULL,
      \`duration_days\` int(11) DEFAULT NULL,
      \`base_price\` decimal(15,2) DEFAULT NULL,
      \`image_url\` varchar(255) DEFAULT NULL,
      \`status\` enum('Pending','Approved','Active','Inactive','Rejected') DEFAULT 'Pending',
      \`created_by\` int(11) DEFAULT NULL,
      \`base_cost\` decimal(15,2) DEFAULT 0.00 COMMENT 'Tổng chi phí gốc ghép dịch vụ',
      \`markup_percent\` int(11) DEFAULT 20 COMMENT 'Tỉ lệ lợi nhuận mong muốn (%)',
      \`design_data\` longtext DEFAULT NULL COMMENT 'Lưu trạng thái UI kéo thả',
      \`rejection_reason\` text DEFAULT NULL,
      \`is_custom\` tinyint(1) DEFAULT 0,
      PRIMARY KEY (\`tour_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    await connection.query(createTableSql);

    console.log('3. Reading INSERT statements for tours from travel_management.sql...');
    const sqlContent = fs.readFileSync('D:/KLTN/travel-management-system/travel_management.sql', 'utf8');
    
    const lines = sqlContent.split('\n');
    let tourInserts = [];
    let isToursInsert = false;
    let currentSql = '';

    for (let line of lines) {
        if (line.includes('INSERT INTO `tours`')) {
            isToursInsert = true;
            currentSql = line;
        } else if (isToursInsert) {
            currentSql += '\n' + line;
            if (line.trim().endsWith(';')) {
                tourInserts.push(currentSql);
                isToursInsert = false;
                currentSql = '';
            }
        }
    }

    console.log(`Found ${tourInserts.length} INSERT queries for tours.`);
    for (let i = 0; i < tourInserts.length; i++) {
        try {
            await connection.query(tourInserts[i]);
            console.log(`Inserted batch ${i + 1}`);
        } catch (e) {
            console.error(`Error inserting batch ${i + 1}:`, e.message);
        }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Table tours restored successfully!');

    // Verify row count
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM tours');
    console.log(`Total tours in database: ${rows[0].count}`);

    await connection.end();
}

restoreToursTable().catch(console.error);
