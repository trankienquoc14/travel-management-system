const seq = require('./config/database');
seq.query("ALTER TABLE departures ADD COLUMN guide_id INT NULL")
  .then(() => { console.log('Done'); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
