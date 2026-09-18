const fs = require('fs');
let code = fs.readFileSync('D:/KLTN/backend/controllers/bookingController.js', 'utf8');

// 1. Update getMyBookings to select passengers_list
const selectRegex = /COALESCE\(t\.image_url, 'https:\/\/images\.unsplash\.com\/photo-1488646953014-85cb44e25828\?q=80&w=1000'\) AS image_url/;
const newSelect = `COALESCE(t.image_url, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000') AS image_url,
        (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('name', full_name)), ']') FROM booking_passengers bp WHERE bp.booking_id = b.booking_id) as passengers_list`;

if (code.match(selectRegex)) {
    code = code.replace(selectRegex, newSelect);
    console.log('Fixed getMyBookings query');
}

// 2. Update createBooking to insert passengers
const createBookingRegex = /const \{ departure_id, num_people, total_amount, notes, payment_method = 'VNPAY_QR' \} = req\.body;/;
const newCreateBooking = `const { departure_id, num_people, total_amount, notes, payment_method = 'VNPAY_QR', passengers } = req.body;`;

if (code.match(createBookingRegex)) {
    code = code.replace(createBookingRegex, newCreateBooking);
    console.log('Added passengers to req.body destructing');
}

const afterInsertBookingRegex = /const newBookingId = result;/;
const insertPassengers = `const newBookingId = result;

    if (passengers && Array.isArray(passengers) && passengers.length > 0) {
      for (const p of passengers) {
        if (p.full_name) {
          await sequelize.query(\`
            INSERT INTO booking_passengers (booking_id, full_name)
            VALUES (?, ?)
          \`, { replacements: [newBookingId, p.full_name], transaction });
        }
      }
    }`;

if (code.match(afterInsertBookingRegex)) {
    code = code.replace(afterInsertBookingRegex, insertPassengers);
    console.log('Added logic to insert passengers');
}

fs.writeFileSync('D:/KLTN/backend/controllers/bookingController.js', code, 'utf8');
