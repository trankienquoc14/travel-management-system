const { calculateRooms, calculateDepartureCrossBooking } = require('./microservices/booking-service/utils/roomCalculator');

const rules = { max_adults: 2, max_children: 2, max_infants: 1, min_adults: 1 };

function testCase(name, paxList, expectedRooms) {
    const res = calculateRooms(paxList, rules);
    console.log(`[${name}] Rooms: ${res.requiredRooms} (Expected: ${expectedRooms}) | Valid: ${res.valid}`);
    if (!res.valid) console.log('   Error:', res.error);
    else console.log('   Rooms:', JSON.stringify(res.rooms));
}

function testCross(name, bookings, expectedRooms) {
    const res = calculateDepartureCrossBooking(bookings, rules);
    console.log(`[${name}] Total Rooms: ${res} (Expected: ${expectedRooms})`);
}

console.log('--- TEST CASES ---');

testCase('CASE 1', [
    { passenger_type: 'ADULT', single_room: true },
    { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' },
    { passenger_type: 'INFANT' }
], 1);

testCase('CASE 2', [
    { passenger_type: 'ADULT', single_room: true },
    { passenger_type: 'CHILD' }, { passenger_type: 'TODDLER' },
    { passenger_type: 'INFANT' }
], 1);

testCross('CASE 3', [
    { booking_id: 'A', passengers: [
        { passenger_type: 'ADULT', single_room: true },
        { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' },
        { passenger_type: 'INFANT' }
    ]},
    { booking_id: 'B', passengers: [
        { passenger_type: 'ADULT', single_room: false }
    ]}
], 2);

testCross('CASE 4', [
    { booking_id: 'A', passengers: [
        { passenger_type: 'ADULT', single_room: false },
        { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' },
        { passenger_type: 'INFANT' }
    ]},
    { booking_id: 'B', passengers: [
        { passenger_type: 'ADULT', single_room: false }
    ]}
], 1);

testCross('CASE 5', [
    { booking_id: 'A', passengers: [
        { passenger_type: 'ADULT', single_room: true },
        { passenger_type: 'CHILD' }
    ]},
    { booking_id: 'B', passengers: [
        { passenger_type: 'ADULT', single_room: false }
    ]}
], 2);

testCross('CASE 6', [
    { booking_id: 'A', passengers: [
        { passenger_type: 'ADULT', single_room: true },
        { passenger_type: 'CHILD' }, { passenger_type: 'CHILD' },
        { passenger_type: 'INFANT' }
    ]},
    { booking_id: 'B', passengers: [
        { passenger_type: 'CHILD' } // Note: booking B is invalid on its own if min_adults=1, so it shouldn't even pass calculateRooms, resulting in it not being merged.
    ]}
], 1);
