const fs = require('fs');
let code = fs.readFileSync('microservices/booking-service/controllers/bookingController.js', 'utf8');
code = code.replace("COALESCE(t.image_url,", "t.base_price, COALESCE(t.image_url,");
fs.writeFileSync('microservices/booking-service/controllers/bookingController.js', code, 'utf8');
console.log('Added base_price');
