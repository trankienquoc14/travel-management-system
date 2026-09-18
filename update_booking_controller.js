const fs = require('fs');
let code = fs.readFileSync('microservices/booking-service/controllers/bookingController.js', 'utf8');

const queryRegex = /INSERT INTO bookings \(customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes\)\s*VALUES \(\?, \?, NULL, \?, NOW\(\), \?, 'Pending', 'Unpaid', \?\)/;
const queryReplacement = `INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes, breakdown)
      VALUES (?, ?, NULL, ?, NOW(), ?, 'Pending', 'Unpaid', ?, ?)`;

const replacementRegex = /replacements: \[customer_id, departure_id, count, amount, notes \|\| null\],/;
const replacementStr = `replacements: [customer_id, departure_id, count, amount, notes || null, req.body.breakdown ? JSON.stringify(req.body.breakdown) : null],`;

code = code.replace(queryRegex, queryReplacement).replace(replacementRegex, replacementStr);

// Also modify getMyBookings to return breakdown
const selectRegex = /b\.notes,\s*b\.quote_id,/;
const selectReplacement = `b.notes,\n        b.breakdown,\n        b.quote_id,`;
code = code.replace(selectRegex, selectReplacement);

fs.writeFileSync('microservices/booking-service/controllers/bookingController.js', code, 'utf8');
console.log('Updated bookingController.js');
