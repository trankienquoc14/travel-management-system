const fs = require('fs');
let content = fs.readFileSync('microservices/booking-service/controllers/bookingController.js', 'utf8');

// The original logic I injected:
const badLogicStart = `    let requiredRooms = 0;
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
    }`;

// Replace it with nothing first
content = content.replace(badLogicStart, "let requiredRooms = 0; let singleRoomCount = 0;");

// Now find where it checks departure_id and gets depRows
const queryToReplace = `SELECT departure_id, departure_date, return_date, available_slots, status 
        FROM departures WHERE departure_id = ?`;
        
const newQuery = `SELECT d.departure_id, d.departure_date, d.return_date, d.available_slots, d.status, t.design_data 
        FROM departures d
        JOIN tours t ON d.tour_id = t.tour_id
        WHERE d.departure_id = ?`;

content = content.replace(queryToReplace, newQuery);

// Find the line checking if (depRows.length > 0)
const depCheck = `if (depRows.length > 0) {
        const dep = depRows[0];`;
        
const logicToInsert = `if (depRows.length > 0) {
        const dep = depRows[0];
        
        if (req.body.passengers && Array.isArray(req.body.passengers)) {
            // Default rules
            let roomRules = { max_adults: 2, max_children: 2, max_infants: 1, min_adults: 1 };
            
            // Try to extract specific rules from tour design_data
            if (dep.design_data) {
                try {
                    const parsed = typeof dep.design_data === 'string' ? JSON.parse(dep.design_data) : dep.design_data;
                    const days = parsed.days || parsed.itinerary || [];
                    // Find first day with accommodation that might have rules
                    for (const day of days) {
                        if (day.accommodation && day.accommodation.service_id) {
                            const [srvRows] = await sequelize.query("SELECT * FROM services WHERE service_id = ?", { replacements: [day.accommodation.service_id], transaction });
                            if (srvRows.length > 0) {
                                const srv = srvRows[0];
                                roomRules = {
                                    max_adults: srv.max_adults !== undefined ? srv.max_adults : 2,
                                    max_children: srv.max_children !== undefined ? srv.max_children : 2,
                                    max_infants: srv.max_infants !== undefined ? srv.max_infants : 1,
                                    min_adults: srv.min_adults !== undefined ? srv.min_adults : 1,
                                    single_room_allowed: srv.single_room_allowed !== undefined ? !!srv.single_room_allowed : true
                                };
                                break; // Just take the first hotel's rule
                            }
                        }
                    }
                } catch(e) {
                    console.error("Error parsing design_data for room rules", e);
                }
            }
            
            // Validate if single_room_allowed
            const hasSingle = req.body.passengers.some(p => p.passenger_type === 'ADULT' && p.single_room);
            if (hasSingle && roomRules.single_room_allowed === false) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Loại phòng khách sạn của tour này không cho phép chọn phòng đơn.' });
            }

            const roomResult = calculateRooms(req.body.passengers, roomRules);
            if (!roomResult.valid) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: roomResult.error });
            }
            requiredRooms = roomResult.requiredRooms;
            singleRoomCount = roomResult.singleRoomCount;
        }`;

content = content.replace(depCheck, logicToInsert);
fs.writeFileSync('microservices/booking-service/controllers/bookingController.js', content);
console.log('done refining booking controller room logic');
