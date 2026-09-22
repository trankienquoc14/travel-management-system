const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({host: 'localhost', user: 'root', database: 'travel_erp'});
  const [rows] = await conn.execute('SELECT design_data FROM tours WHERE design_data IS NOT NULL LIMIT 2');
  rows.forEach(r => {
      try {
          const data = JSON.parse(r.design_data);
          console.log(JSON.stringify(data.costConfig?.selectedTransport, null, 2));
      } catch (e) { console.error(e) }
  });
  await conn.end();
})();
