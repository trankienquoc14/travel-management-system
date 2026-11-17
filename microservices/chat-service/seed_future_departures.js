const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'travel_management'
  });

  const [tours] = await conn.query(`
    SELECT t.tour_id, t.tour_name, t.destination, t.duration_days
    FROM tours t
    LEFT JOIN departures d ON t.tour_id = d.tour_id AND d.departure_date >= CURDATE() AND d.status = 'Open'
    WHERE t.status = 'Active' AND (t.is_custom IS NULL OR t.is_custom = 0)
    GROUP BY t.tour_id, t.tour_name, t.destination, t.duration_days
    HAVING COUNT(d.departure_id) = 0
  `);

  console.log(`Found ${tours.length} active tours with no future open departures.`);

  for (const tour of tours) {
    // Add two upcoming departures in Dec 2026 and Jan 2027
    const days = Number(tour.duration_days) || 3;
    
    // Dep 1: mid December 2026 (e.g. 2026-12-15)
    const depDate1 = '2026-12-15';
    const ret1 = new Date('2026-12-15T00:00:00Z');
    ret1.setDate(ret1.getDate() + days - 1);
    const retDate1 = ret1.toISOString().split('T')[0];

    // Dep 2: early January 2027 (e.g. 2027-01-10)
    const depDate2 = '2027-01-10';
    const ret2 = new Date('2027-01-10T00:00:00Z');
    ret2.setDate(ret2.getDate() + days - 1);
    const retDate2 = ret2.toISOString().split('T')[0];

    await conn.query(`
      INSERT INTO departures (tour_id, departure_date, return_date, max_slots, available_slots, status, operational_status)
      VALUES (?, ?, ?, 30, 25, 'Open', 'Confirmed'),
             (?, ?, ?, 30, 28, 'Open', 'Pending')
    `, [tour.tour_id, depDate1, retDate1, tour.tour_id, depDate2, retDate2]);

    console.log(`+ Added 2 departures for Tour ${tour.tour_id} (${tour.tour_name})`);
  }

  console.log('Seeding future departures completed.');
  await conn.end();
})();
