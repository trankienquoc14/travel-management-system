const fs = require('fs');
let content = fs.readFileSync('microservices/tour-service/controllers/tourController.js', 'utf8');

// Insert require
if (!content.includes('roomCalculator')) {
    content = "const { calculateDepartureCrossBooking } = require('../utils/roomCalculator');\n" + content;
}

// Find getOperationalDepartures and replace its logic
// Let's replace the whole function instead of string replacement since it might be messy.
// Actually, it's safer to find the query part and update it.

const oldQueryBlock = `SELECT 
                d.departure_id, d.tour_id, d.departure_date, d.return_date, 
                d.max_slots, d.available_slots, d.status, 
                d.operational_status, d.decision_history,
                t.tour_name, t.duration_days, t.design_data, t.is_custom, t.destination,
                IFNULL(SUM(b.required_rooms), 0) as total_required_rooms
            FROM departures d
            JOIN tours t ON d.tour_id = t.tour_id
            LEFT JOIN bookings b ON b.departure_id = d.departure_id AND b.booking_status != 'Cancelled'
            GROUP BY d.departure_id
            ORDER BY d.departure_date ASC`;

const newQueryBlock = `SELECT 
                d.departure_id, d.tour_id, d.departure_date, d.return_date, 
                d.max_slots, d.available_slots, d.status, 
                d.operational_status, d.decision_history,
                t.tour_name, t.duration_days, t.design_data, t.is_custom, t.destination
            FROM departures d
            JOIN tours t ON d.tour_id = t.tour_id
            ORDER BY d.departure_date ASC`;

content = content.replace(oldQueryBlock, newQueryBlock);

// We need to fetch passengers to calculate cross-booking for each departure.
const departuresMapBlockStart = `const departures = rows.map(r => {`;
const departuresMapBlockReplace = `
        // Fetch all active bookings and their passengers to calculate exact room allocations
        const [allBookings] = await sequelize.query(\`
            SELECT b.booking_id, b.departure_id, p.passenger_type, p.single_room
            FROM bookings b
            JOIN booking_passengers p ON b.booking_id = p.booking_id
            WHERE b.booking_status != 'Cancelled'
        \`);
        
        // Group by departure_id -> booking_id
        const departureBookings = {};
        for (const row of allBookings) {
            if (!departureBookings[row.departure_id]) departureBookings[row.departure_id] = {};
            if (!departureBookings[row.departure_id][row.booking_id]) {
                departureBookings[row.departure_id][row.booking_id] = { booking_id: row.booking_id, passengers: [] };
            }
            departureBookings[row.departure_id][row.booking_id].passengers.push({
                passenger_type: row.passenger_type,
                single_room: row.single_room === 1 || row.single_room === true
            });
        }

        const departures = await Promise.all(rows.map(async r => {
            let minPax = 15;
            let destName = r.destination;
            let roomRules = { max_adults: 2, max_children: 2, max_infants: 1, min_adults: 1, single_room_allowed: true };
            
            if (r.design_data) {
                try {
                    const parsed = typeof r.design_data === 'string' ? JSON.parse(r.design_data) : r.design_data;
                    if (parsed?.costConfig?.minimumPax) minPax = parsed.costConfig.minimumPax;
                    
                    // Attempt to extract specific room rules for this tour's accommodation
                    const days = parsed.days || parsed.itinerary || [];
                    for (const day of days) {
                        if (day.accommodation && day.accommodation.service_id) {
                            const [srvRows] = await sequelize.query("SELECT * FROM services WHERE service_id = ?", { replacements: [day.accommodation.service_id] });
                            if (srvRows.length > 0) {
                                const srv = srvRows[0];
                                roomRules = {
                                    max_adults: srv.max_adults !== undefined ? srv.max_adults : 2,
                                    max_children: srv.max_children !== undefined ? srv.max_children : 2,
                                    max_infants: srv.max_infants !== undefined ? srv.max_infants : 1,
                                    min_adults: srv.min_adults !== undefined ? srv.min_adults : 1,
                                    single_room_allowed: srv.single_room_allowed !== undefined ? !!srv.single_room_allowed : true
                                };
                                break;
                            }
                        }
                    }
                } catch(e) {}
            }
            
            // Calculate total_required_rooms using cross-booking algorithm
            let total_required_rooms = 0;
            const bksForDep = departureBookings[r.departure_id];
            if (bksForDep) {
                const bookingsArr = Object.values(bksForDep);
                total_required_rooms = calculateDepartureCrossBooking(bookingsArr, roomRules);
            }

            // Calculate current pax: max_slots - available_slots`;

content = content.replace("const departures = rows.map(r => {", departuresMapBlockReplace);

// Because we changed rows.map to await Promise.all(rows.map(async r => ...)), we need to make sure the closing brace matches
// Original closing:
/*
            return {
                ...r,
                min_pax: minPax,
                current_pax: currentPax,
                days_until: daysUntil,
                milestone: milestone,
                decision_history: decHistory
            };
        });
*/
const oldReturnBlock = `            return {
                ...r,
                min_pax: minPax,
                current_pax: currentPax,
                days_until: daysUntil,
                milestone: milestone,
                decision_history: decHistory
            };`;

const newReturnBlock = `            return {
                ...r,
                min_pax: minPax,
                current_pax: currentPax,
                days_until: daysUntil,
                milestone: milestone,
                decision_history: decHistory,
                total_required_rooms: total_required_rooms
            };`;

content = content.replace(oldReturnBlock, newReturnBlock);

fs.writeFileSync('microservices/tour-service/controllers/tourController.js', content);
console.log('done updating tour controller for cross booking');
