const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/BookingForm.jsx', 'utf8');

const regex = /num_people: totalPax, \/\/ Gửi tổng số người xuống backend\s*total_amount: totalAmount,/;
const replacement = `num_people: totalPax, // Gửi tổng số người xuống backend
                    total_amount: totalAmount,
                    breakdown: pax,`;
if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('frontend/src/components/BookingForm.jsx', code, 'utf8');
    console.log('Added breakdown to BookingForm.jsx');
} else {
    console.log('Regex did not match');
}
