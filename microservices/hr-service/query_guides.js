const seq = require('./config/database');
seq.query("SELECT user_id, full_name, email FROM users WHERE role_id = 5").then(res => { console.log(res[0]); process.exit(); }).catch(console.error);
