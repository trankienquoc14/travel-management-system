const fs = require('fs');
let content = fs.readFileSync('microservices/booking-service/controllers/bookingController.js', 'utf8');

// Add require
if (!content.includes('roomCalculator')) {
    content = "const { calculateRooms } = require('../utils/roomCalculator');\n" + content;
}

// Find the calculation spot
const searchTarget = "const count = num_people || (req.body.num_adults ? req.body.num_adults + (req.body.num_children || 0) : 1);";
const calcLogic = `const count = num_people || (req.body.num_adults ? req.body.num_adults + (req.body.num_children || 0) : 1);
    
    let requiredRooms = 0;
    let singleRoomCount = 0;
    if (req.body.passengers && Array.isArray(req.body.passengers)) {
        // Find if this departure has specific room rules. For now, use defaults or fetch from services if needed.
        // As requested, we use the default rules unless specified
        const roomResult = calculateRooms(req.body.passengers, { max_adults: 2, max_children: 2, max_infants: 1, min_adults: 1 });
        if (!roomResult.valid) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: roomResult.error });
        }
        requiredRooms = roomResult.requiredRooms;
        singleRoomCount = roomResult.singleRoomCount;
    }
`;

content = content.replace(searchTarget, calcLogic);

// Replace INSERT INTO bookings
content = content.replace('INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes, breakdown)', 
                          'INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes, breakdown, required_rooms, single_room_count)');

content = content.replace("VALUES (?, ?, NULL, ?, NOW(), ?, 'Pending', 'Unpaid', ?, ?)",
                          "VALUES (?, ?, NULL, ?, NOW(), ?, 'Pending', 'Unpaid', ?, ?, ?, ?)");

content = content.replace("replacements: [customer_id, departure_id, count, amount, notes || null, req.body.breakdown ? JSON.stringify(req.body.breakdown) : null]",
                          "replacements: [customer_id, departure_id, count, amount, notes || null, req.body.breakdown ? JSON.stringify(req.body.breakdown) : null, requiredRooms, singleRoomCount]");

fs.writeFileSync('microservices/booking-service/controllers/bookingController.js', content);
console.log('done updating booking controller rooms');
