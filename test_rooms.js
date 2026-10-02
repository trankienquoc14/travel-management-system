const { calculateRooms, calculateDepartureCrossBooking } = require('./microservices/booking-service/utils/roomCalculator');

const rules = { max_adults: 2, max_children: 2, max_infants: 1, min_adults: 1 };

function testCase(name, paxList, expectedRooms, expectedSingle, expectedValid) {
    const res = calculateRooms(paxList, rules);
    console.log(`[${name}] Rooms: ${res.requiredRooms} (Exp: ${expectedRooms}), Single: ${res.singleRoomCount} (Exp: ${expectedSingle}), Valid: ${res.valid} (Exp: ${expectedValid})`);
    if (res.error) console.log('   Error:', res.error);
}

// Case 1
testCase('Case 1: 2 A, 2 C, 1 I', [
    { passenger_type: 'ADULT' }, { passenger_type: 'ADULT' },
    { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' }, { passenger_type: 'INFANT' }
], 1, 0, true);

// Case 2
testCase('Case 2: 2 A, 1 C, 1 TOD, 1 I', [
    { passenger_type: 'ADULT' }, { passenger_type: 'ADULT' },
    { passenger_type: 'CHILD' }, { passenger_type: 'TODDLER' }, { passenger_type: 'INFANT' }
], 1, 0, true);

// Case 3
testCase('Case 3: 2 A, 3 C', [
    { passenger_type: 'ADULT' }, { passenger_type: 'ADULT' },
    { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' }
], 2, 0, true);

// Case 4
testCase('Case 4: 2 A, 3 TOD', [
    { passenger_type: 'ADULT' }, { passenger_type: 'ADULT' },
    { passenger_type: 'TODDLER' }, { passenger_type: 'TODDLER' }, { passenger_type: 'TODDLER' }
], 2, 0, true);

// Case 5
testCase('Case 5: 2 A, 2 C, 2 I', [
    { passenger_type: 'ADULT' }, { passenger_type: 'ADULT' },
    { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' },
    { passenger_type: 'INFANT' }, { passenger_type: 'INFANT' }
], 2, 0, true);

// Case 6
testCase('Case 6: 3 A', [
    { passenger_type: 'ADULT' }, { passenger_type: 'ADULT' }, { passenger_type: 'ADULT' }
], 2, 0, true);

// Case 7
testCase('Case 7: 1 A single, 1 A non-single', [
    { passenger_type: 'ADULT', single_room: true }, { passenger_type: 'ADULT' }
], 2, 1, true);

// Case 8
testCase('Case 8: 2 A single', [
    { passenger_type: 'ADULT', single_room: true }, { passenger_type: 'ADULT', single_room: true }
], 2, 2, true);

// Case 9
testCase('Case 9: CHILD single', [
    { passenger_type: 'CHILD', single_room: true }
], 0, 0, false);

// Case 10
testCase('Case 10: TODDLER single', [
    { passenger_type: 'TODDLER', single_room: true }
], 0, 0, false);

// Case 11
testCase('Case 11: INFANT single', [
    { passenger_type: 'INFANT', single_room: true }
], 0, 0, false);


console.log('\n--- CROSS BOOKING TESTS ---');
function testCross(name, bookings, expected) {
    const res = calculateDepartureCrossBooking(bookings, rules);
    console.log(`[${name}] Total Rooms: ${res} (Expected: ${expected})`);
}

// Case 12
testCross('Case 12', [
    { booking_id: 1, passengers: [{ passenger_type: 'ADULT', single_room: true }, { passenger_type: 'ADULT', single_room: false }] },
    { booking_id: 2, passengers: [{ passenger_type: 'ADULT', single_room: false }] }
], 2);

// Case 13
testCross('Case 13: 1A+1C and 1A (Should merge)', [
    { booking_id: 1, passengers: [{ passenger_type: 'ADULT' }, { passenger_type: 'CHILD' }] },
    { booking_id: 2, passengers: [{ passenger_type: 'ADULT' }] }
], 1);

// Case 14
testCross('Case 14: 1A+2C+1I and 1A (Should merge)', [
    { booking_id: 1, passengers: [{ passenger_type: 'ADULT' }, { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' }, { passenger_type: 'INFANT' }] },
    { booking_id: 2, passengers: [{ passenger_type: 'ADULT' }] }
], 1);

// Case 15
testCross('Case 15: 2A+2C+1I and 1A (Should NOT merge)', [
    { booking_id: 1, passengers: [{ passenger_type: 'ADULT' }, { passenger_type: 'ADULT' }, { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' }, { passenger_type: 'INFANT' }] },
    { booking_id: 2, passengers: [{ passenger_type: 'ADULT' }] }
], 2);

