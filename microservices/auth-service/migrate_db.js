const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'travel_management'
    });

    try {
        console.log("Dropping old table if needed...");
        // Not dropping itinerary_places yet just to be safe, but we will create the new one
        console.log("Creating itinerary_activities table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`itinerary_activities\` (
                \`activity_id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                \`itinerary_id\` int(11) NOT NULL,
                \`activity_type\` ENUM('Place', 'Accommodation', 'Transport', 'Meal', 'FreeTime') NOT NULL,
                \`reference_id\` int(11) DEFAULT NULL,
                \`start_time\` time DEFAULT NULL,
                \`end_time\` time DEFAULT NULL,
                \`order_index\` int(11) DEFAULT 1,
                \`note\` text DEFAULT NULL,
                FOREIGN KEY (\`itinerary_id\`) REFERENCES \`itineraries\`(\`itinerary_id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
    }
}

migrate();
