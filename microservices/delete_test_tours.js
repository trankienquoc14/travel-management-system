const mysql = require('mysql2/promise');

async function cleanupTestTours() {
    const conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'travel_management'
    });

    console.log('1. Setting foreign key checks to 0...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    const testTourIds = [53, 54, 55, 56];
    
    console.log('2. Finding test departures...');
    const [testDeps] = await conn.query('SELECT departure_id FROM departures WHERE tour_id IN (?)', [testTourIds]);
    const depIds = testDeps.map(d => d.departure_id);
    
    if (depIds.length > 0) {
        console.log('Deleting bookings for test departures:', depIds);
        await conn.query('DELETE FROM bookings WHERE departure_id IN (?)', [depIds]);
        console.log('Deleting test departures:', depIds);
        await conn.query('DELETE FROM departures WHERE departure_id IN (?)', [depIds]);
    }

    console.log('3. Deleting itineraries for test tours...');
    await conn.query('DELETE FROM itineraries WHERE tour_id IN (?)', [testTourIds]);

    console.log('4. Deleting test tours...');
    await conn.query('DELETE FROM tours WHERE tour_id IN (?) OR tour_name LIKE "%Test%" OR tour_name LIKE "%test%"', [testTourIds]);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const [remaining] = await conn.query('SELECT tour_id, tour_name, destination, status FROM tours ORDER BY tour_id ASC');
    console.log(`\n--- CLEAN REMAINING TOURS (${remaining.length}) ---`);
    remaining.forEach(r => console.log(`${r.tour_id} |\t ${r.destination.padEnd(15)} |\t ${r.tour_name}`));

    await conn.end();
}

cleanupTestTours().catch(console.error);
