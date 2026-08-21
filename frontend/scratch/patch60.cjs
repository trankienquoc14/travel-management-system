const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');
c = c.replace(
    'onClick={handleAddDeparture}',
    "onClick={() => setDepartures([...departures, { departure_date: '', return_date: '', max_slots: 30, guide_id: null, status: 'Open' }])}"
);
fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Fixed handleAddDeparture');
