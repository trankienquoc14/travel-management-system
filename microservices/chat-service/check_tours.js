const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'travel_management'
  });

  const [tours] = await conn.query(`
    SELECT t.tour_id, t.tour_name, t.destination, t.duration_days, t.base_price,
           COUNT(d.departure_id) AS total_deps,
           COUNT(CASE WHEN d.departure_date >= CURDATE() AND d.status = 'Open' THEN 1 END) AS future_open_deps
    FROM tours t
    LEFT JOIN departures d ON t.tour_id = d.tour_id
    WHERE t.status = 'Active' AND (t.is_custom IS NULL OR t.is_custom = 0)
    GROUP BY t.tour_id, t.tour_name, t.destination, t.duration_days, t.base_price
    ORDER BY t.tour_id ASC
  `);

  console.log('=== ACTIVE TOURS AND DEPARTURES ===');
  tours.forEach(t => {
    console.log(`ID ${t.tour_id} | ${t.destination.padEnd(12)} | ${t.tour_name} (Total deps: ${t.total_deps}, Open future: ${t.future_open_deps})`);
  });

  await conn.end();
})();
