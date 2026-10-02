/**
 * Calculates the required number of rooms based on passenger breakdown and hotel rules.
 * @param {Array} passengers - List of passengers: { passenger_type: 'ADULT'|'CHILD'|'TODDLER'|'INFANT', single_room: boolean }
 * @param {Object} roomRules - Room constraints: { max_adults, max_children, max_infants, min_adults }
 * @returns {Object} { valid: boolean, requiredRooms: number, singleRoomCount: number, error: string, rooms: Array }
 */
function calculateRooms(passengers, roomRules) {
    const { max_adults = 2, max_children = 2, max_infants = 1, min_adults = 1 } = roomRules || {};

    let singleAdults = 0;
    let nonSingleAdults = 0;
    let remainingChildren = 0; // Child + Toddler
    let remainingInfants = 0;

    for (const p of passengers) {
        if (p.passenger_type !== 'ADULT' && p.single_room === true) {
            return { valid: false, requiredRooms: 0, singleRoomCount: 0, error: 'Chỉ người lớn mới được phép chọn phòng đơn.' };
        }

        if (p.passenger_type === 'ADULT') {
            if (p.single_room) {
                singleAdults++;
            } else {
                nonSingleAdults++;
            }
        } else if (p.passenger_type === 'CHILD' || p.passenger_type === 'TODDLER') {
            remainingChildren++;
        } else if (p.passenger_type === 'INFANT') {
            remainingInfants++;
        }
    }

    const N = singleAdults;
    const M = nonSingleAdults;
    const C = remainingChildren;
    const I = remainingInfants;

    // A single room has EXACTLY 1 adult (the single adult).
    // If min_adults > 1, the single room violates it.
    if (min_adults > 1 && N > 0) {
        return { valid: false, requiredRooms: 0, singleRoomCount: N, error: `Phòng yêu cầu tối thiểu ${min_adults} người lớn, nhưng có khách chọn phòng đơn (chỉ 1 người).` };
    }

    // We must find the minimum number of shared rooms (K >= 0) for the M non-single adults
    // such that all constraints are met.
    let K = Math.ceil(M / max_adults);
    let validPacking = false;

    // Edge case: No non-single adults, but we need more capacity for children/infants
    // than what the N single rooms can provide.
    // In that case, we would need to open a shared room.
    // BUT if min_adults > 0, we can't open a shared room without adults.
    if (M === 0 && K === 0 && (C > N * max_children || I > N * max_infants)) {
        if (min_adults > 0) {
            return { valid: false, requiredRooms: 0, singleRoomCount: N, error: 'Không đủ người lớn để kèm trẻ em/em bé theo quy định phòng, hoặc vượt quá sức chứa.' };
        }
    }

    while (true) {
        // Can we satisfy min_adults for the K shared rooms?
        if (M > 0 && M < K * min_adults) {
            break; // Not enough non-single adults to satisfy min_adults in K rooms
        }

        // Can we satisfy children and infant capacities across ALL (N + K) rooms?
        if ((N + K) * max_children >= C && (N + K) * max_infants >= I) {
            // Also ensure we didn't exceed max_adults in shared rooms
            // (Math.ceil(M / max_adults) already guarantees K * max_adults >= M, but let's double check)
            if (M <= K * max_adults) {
                validPacking = true;
                break;
            }
        }

        K++; // Add another shared room and try again
        // Stop if we don't even have enough adults to open a new room
        if (M < K * min_adults) {
            break;
        }
        // Safety break
        if (K > M + C + I) break;
    }

    if (!validPacking && (M > 0 || C > 0 || I > 0 || N > 0)) {
        return { valid: false, requiredRooms: 0, singleRoomCount: N, error: 'Không thể phân bổ phòng hợp lệ (vượt sức chứa hoặc thiếu người lớn).' };
    }

    // Distribution
    const rooms = [];
    for (let i = 0; i < N; i++) rooms.push({ adults: 1, children: 0, infants: 0, single_room: true });
    for (let i = 0; i < K; i++) rooms.push({ adults: 0, children: 0, infants: 0, single_room: false });

    // Distribute non-single adults into the K shared rooms
    let tempAdults = M;
    let idx = N;
    while (tempAdults > 0 && K > 0) {
        rooms[idx].adults++;
        tempAdults--;
        idx++;
        if (idx >= N + K) idx = N;
    }

    // Distribute children into ALL rooms
    let tempChildren = C;
    while (tempChildren > 0) {
        let placed = false;
        for (let i = 0; i < N + K; i++) {
            if (rooms[i].children < max_children) {
                rooms[i].children++;
                tempChildren--;
                placed = true;
                break;
            }
        }
        if (!placed) break; 
    }

    // Distribute infants into ALL rooms
    let tempInfants = I;
    while (tempInfants > 0) {
        let placed = false;
        for (let i = 0; i < N + K; i++) {
            if (rooms[i].infants < max_infants) {
                rooms[i].infants++;
                tempInfants--;
                placed = true;
                break;
            }
        }
        if (!placed) break;
    }

    return { 
        valid: true, 
        requiredRooms: N + K, 
        singleRoomCount: N, 
        error: null,
        rooms
    };
}

/**
 * Perform cross-booking optimization across multiple bookings of a departure.
 * @param {Array} bookings - Array of booking objects, each must have a .passengers array and .booking_id
 * @param {Object} roomRules - Constraints.
 * @returns {Number} Optimized total required rooms.
 */
function calculateDepartureCrossBooking(bookings, roomRules) {
    const { max_adults = 2, max_children = 2, max_infants = 1 } = roomRules || {};
    let totalRooms = [];

    // First, pack each booking individually
    for (const b of bookings) {
        const res = calculateRooms(b.passengers, roomRules);
        if (res.valid) {
            // Tag rooms with booking_id so we know where they came from
            const taggedRooms = res.rooms.map(r => ({ ...r, booking_ids: [b.booking_id] }));
            totalRooms = totalRooms.concat(taggedRooms);
        }
    }

    // Now, cross-booking: We can merge rooms if:
    // 1. Both are single_room = false
    // 2. Both contain ADULTS (we only cross-book ADULT non-single <-> ADULT non-single)
    // 3. The combined adults <= max_adults, children <= max_children, infants <= max_infants
    // 4. They come from DIFFERENT bookings (booking_ids don't intersect)
    let optimized = true;
    while (optimized) {
        optimized = false;
        for (let i = 0; i < totalRooms.length; i++) {
            for (let j = i + 1; j < totalRooms.length; j++) {
                const r1 = totalRooms[i];
                const r2 = totalRooms[j];

                if (r1.single_room || r2.single_room) continue;
                if (r1.adults === 0 || r2.adults === 0) continue; // Only merge ADULT <-> ADULT

                // Check intersection of booking_ids
                const intersect = r1.booking_ids.some(id => r2.booking_ids.includes(id));
                if (intersect) continue;

                // Check capacities
                if (r1.adults + r2.adults <= max_adults &&
                    r1.children + r2.children <= max_children &&
                    r1.infants + r2.infants <= max_infants) {
                    
                    // Merge them
                    r1.adults += r2.adults;
                    r1.children += r2.children;
                    r1.infants += r2.infants;
                    r1.booking_ids = [...r1.booking_ids, ...r2.booking_ids];

                    // Remove r2
                    totalRooms.splice(j, 1);
                    optimized = true;
                    break;
                }
            }
            if (optimized) break;
        }
    }

    return totalRooms.length;
}

module.exports = { calculateRooms, calculateDepartureCrossBooking };
