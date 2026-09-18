const fs = require('fs');

const path = 'D:/KLTN/backend/controllers/customTourController.js';
let code = fs.readFileSync(path, 'utf8');

const regex = /const \{ payment_method = 'VNPAY' \} = req\.body;/;
code = code.replace(regex, "const { payment_method = 'VNPAY', passengers } = req.body;");

const regex2 = /(const \[bookingInsert\] = await sequelize\.query\([\s\S]*?transaction\s*\}\);)/;
code = code.replace(regex2, `$1\n
        const newBookingId = bookingInsert;
        if (passengers && Array.isArray(passengers) && passengers.length > 0) {
            for (const p of passengers) {
                if (p.full_name) {
                    await sequelize.query("INSERT INTO booking_passengers (booking_id, full_name) VALUES (?, ?)", { replacements: [newBookingId, p.full_name], transaction });
                }
            }
        }`);

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed customTourController');
