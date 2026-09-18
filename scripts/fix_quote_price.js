const fs = require('fs');

let code = fs.readFileSync('microservices/tour-service/controllers/customTourController.js', 'utf8');

const regex = /quote\.quote_price \* quote\.people_count/g;
code = code.replace(regex, 'quote.quote_price');

fs.writeFileSync('microservices/tour-service/controllers/customTourController.js', code, 'utf8');
console.log('Fixed double multiplication in customTourController');