const fs = require('fs');
const fPath = 'src/components/TourBuilder/DayCard.jsx';
let c = fs.readFileSync(fPath, 'utf8');

c = c.replace(/🏨 Lưu trú tại \{endDestName \|\| 'Điểm đến'\}/, 
              `🏨 Lưu trú tại {(destinations.find(d => String(d.destination_id) === String(day.end_destination_id))?.destination_name) || 'Điểm đến'}`);

fs.writeFileSync(fPath, c, 'utf8');
console.log('Fixed endDestName reference error!');
