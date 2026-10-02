const fs = require('fs');
let content = fs.readFileSync('microservices/tour-service/controllers/tourController.js', 'utf8');

const queryToReplace = `SELECT 
                d.departure_id, d.tour_id, d.departure_date, d.return_date, 
                d.max_slots, d.available_slots, d.status, 
                d.operational_status, d.decision_history,
                t.tour_name, t.duration_days, t.design_data, t.is_custom, t.destination
            FROM departures d
            JOIN tours t ON d.tour_id = t.tour_id
            ORDER BY d.departure_date ASC`;

const newQuery = `SELECT 
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

content = content.replace(queryToReplace, newQuery);

fs.writeFileSync('microservices/tour-service/controllers/tourController.js', content);
console.log('done updating tour controller');
