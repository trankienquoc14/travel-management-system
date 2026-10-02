const fs = require('fs');
let content = fs.readFileSync('microservices/booking-service/controllers/bookingController.js', 'utf8');
content = content.replace('INSERT INTO booking_passengers (booking_id, full_name, identity_number, gender, birth_date, is_checked_in)', 'INSERT INTO booking_passengers (booking_id, full_name, identity_number, gender, birth_date, is_checked_in, passenger_type, single_room)');
content = content.replace('VALUES (?, ?, ?, ?, ?, 0)', 'VALUES (?, ?, ?, ?, ?, 0, ?, ?)');
content = content.replace("replacements: [newBookingId, p.full_name, p.identity_number || null, p.gender || 'Other', p.birth_date || null]", "replacements: [newBookingId, p.full_name, p.identity_number || null, p.gender || 'Other', p.birth_date || null, p.passenger_type || 'ADULT', !!p.single_room]");
fs.writeFileSync('microservices/booking-service/controllers/bookingController.js', content);
console.log('done');
