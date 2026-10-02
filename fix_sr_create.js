const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

// 1. Update the dependency array
content = content.replace("}, [selectedDep]);", "}, [selectedDep, partners]);");

// 2. Update autoServ construction
const oldHotelsLoop = `        hotelsMap.forEach(h => {
            autoServ.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'HOTEL',
                partner_id: '',
                quantity: h.rooms,
                hotelName: h.name,
                details: { checkIn: h.checkIn, checkOut: h.checkOut, nights: h.nights }
            });
        });`;

const newHotelsLoop = `        hotelsMap.forEach(h => {
            let matchedPartnerId = '';
            if (h.name) {
                const matched = partners.find(p => p.partner_name === h.name);
                if (matched) matchedPartnerId = matched.partner_id;
            }
            autoServ.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'HOTEL',
                partner_id: matchedPartnerId,
                quantity: h.rooms,
                hotelName: h.name,
                details: { checkIn: h.checkIn, checkOut: h.checkOut, nights: h.nights }
            });
        });`;

content = content.replace(oldHotelsLoop, newHotelsLoop);

// 3. Update the filter for the dropdown
const oldDropdown = `{partners.filter(p => p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn').map(p => (`;
const newDropdown = `{partners.filter(p => (p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn') && (!selectedDep.destination || p.destination_name === selectedDep.destination)).map(p => (`;

content = content.replace(oldDropdown, newDropdown);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed ServiceRequestCreate');
