const mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'travel_management' });
  const [rows] = await db.query(`
    SELECT 
        r.request_id, 
        r.status, 
        q.quote_price AS quoted_price,
        q.approval_status
    FROM custom_tour_requests r
    LEFT JOIN (
        SELECT q1.* FROM custom_tour_quotes q1
        INNER JOIN (SELECT MAX(quote_id) AS max_id FROM custom_tour_quotes GROUP BY request_id) q2 
        ON q1.quote_id = q2.max_id
    ) q ON r.request_id = q.request_id
    ORDER BY r.request_id DESC LIMIT 1
  `);
  console.log(rows);
  db.end();
})();
