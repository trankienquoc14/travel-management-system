const fs = require('fs');
const data = fs.readFileSync('travel_management.sql', 'utf8');
const match = data.match(/CREATE TABLE `partners`[\s\S]*?;/);
console.log(match ? match[0] : 'Not found');
