const mysql = require('mysql2/promise');
(async () => {
    try {
        const conn = await mysql.createConnection({host: 'localhost', user: 'root', database: 'travel_management'});
        
        // Add passenger_type and single_room to booking_passengers
        console.log('Adding passenger_type and single_room to booking_passengers...');
        try {
            await conn.execute("ALTER TABLE booking_passengers ADD COLUMN passenger_type ENUM('ADULT', 'CHILD', 'TODDLER', 'INFANT') DEFAULT 'ADULT'");
            await conn.execute("ALTER TABLE booking_passengers ADD COLUMN single_room BOOLEAN DEFAULT false");
            console.log('OK booking_passengers');
        } catch (e) {
            console.log('booking_passengers altered already? ', e.message);
        }

        // Add max_adults, max_children, max_infants, min_adults, single_room_allowed to services
        console.log('Adding room constraints to services...');
        try {
            await conn.execute("ALTER TABLE services ADD COLUMN max_adults INT DEFAULT 2");
            await conn.execute("ALTER TABLE services ADD COLUMN max_children INT DEFAULT 2");
            await conn.execute("ALTER TABLE services ADD COLUMN max_infants INT DEFAULT 1");
            await conn.execute("ALTER TABLE services ADD COLUMN min_adults INT DEFAULT 1");
            await conn.execute("ALTER TABLE services ADD COLUMN single_room_allowed BOOLEAN DEFAULT true");
            await conn.execute("ALTER TABLE services ADD COLUMN single_room_supplement DECIMAL(10,2) DEFAULT 0");
            console.log('OK services');
        } catch (e) {
            console.log('services altered already? ', e.message);
        }

        await conn.end();
        console.log('Done migration');
    } catch (err) {
        console.error(err);
    }
})();
