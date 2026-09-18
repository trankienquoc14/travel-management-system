const fs = require('fs');
let code = fs.readFileSync('microservices/booking-service/controllers/bookingController.js', 'utf8');

const oldStr = `        b.quote_id,
        b.departure_id,
        (SELECT GROUP_CONCAT(p.full_name SEPARATOR '||') FROM booking_passengers p WHERE p.booking_id = b.booking_id) AS passengers_list,`;

const newStr = `        b.quote_id,
        b.departure_id,
        t.tour_id,
        (SELECT GROUP_CONCAT(p.full_name SEPARATOR '||') FROM booking_passengers p WHERE p.booking_id = b.booking_id) AS passengers_list,`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('microservices/booking-service/controllers/bookingController.js', code, 'utf8');
console.log('Added tour_id to getMyBookings');
