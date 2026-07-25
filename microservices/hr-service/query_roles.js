const seq = require('./config/database');
seq.query("SELECT * FROM roles").then(res => { console.log(res[0]); process.exit(); }).catch(console.error);
