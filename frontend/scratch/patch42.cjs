const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

c = c.replace(
    'const durationCount = parsedDesign?.itineraryDays?.length || tour.itineraries?.length || 0;',
    'const durationCount = parsedDesign?.days?.length || parsedDesign?.itineraryDays?.length || tour.itineraries?.length || 0;'
);

const startService = '{/* Dịch vụ cố định */}';
const endService = '{/* Lịch trình từng ngày theo timeline */}';

const sIdx = c.indexOf(startService);
const eIdx = c.indexOf(endService);

if (sIdx > -1 && eIdx > -1) {
    const toReplace = c.substring(sIdx, eIdx);
    c = c.replace(toReplace, '');
    fs.writeFileSync('src/components/TourDetail.jsx', c);
    console.log('Fixed durationCount and removed services');
} else {
    console.log('Could not find service blocks');
}
