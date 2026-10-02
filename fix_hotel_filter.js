const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

// The line is: 
// {partners.filter(p => (p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn') && (!selectedDep.destination || p.destination_name === selectedDep.destination)).map(p => (

content = content.replace(
    /p\.partner_type === 'Accommodation' \|\| p\.partner_type === 'Khách sạn'/g,
    "p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn'"
);

// We should also handle destination safely, maybe trim
content = content.replace(
    /p\.destination_name === selectedDep\.destination/g,
    "p.destination_name?.trim() === selectedDep.destination?.trim()"
);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed Hotel filter type');
