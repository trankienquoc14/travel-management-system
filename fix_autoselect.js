const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

// 1. Add state for services
if (!content.includes('const [allServices, setAllServices]')) {
    content = content.replace(
        "const [destinations, setDestinations] = useState([]);",
        "const [destinations, setDestinations] = useState([]);\n    const [allServices, setAllServices] = useState([]);"
    );
}

// 2. Add fetch for services
if (!content.includes('/api/services')) {
    const fetchDestStr = "const destRes = await axios.get('http://localhost:5000/api/destinations', { headers });\n                if (destRes.data.success) setDestinations(destRes.data.data);";
    const fetchServStr = "const destRes = await axios.get('http://localhost:5000/api/destinations', { headers });\n                if (destRes.data.success) setDestinations(destRes.data.data);\n\n                const srvRes = await axios.get('http://localhost:5000/api/services', { headers });\n                if (srvRes.data.success) setAllServices(srvRes.data.data);";
    content = content.replace(fetchDestStr, fetchServStr);
}

// 3. Update hotelsMap logic to store service_id
content = content.replace(
    /let hotelName = '';/g,
    "let hotelName = '';\n            let hotelServiceId = null;"
);
content = content.replace(
    /hotelName = day\.accommodation\.name;/g,
    "hotelName = day.accommodation.name;\n                hotelServiceId = day.accommodation.service_id;"
);
content = content.replace(
    /rooms: rooms/g,
    "rooms: rooms,\n                        service_id: hotelServiceId"
);

// 4. Update autoServ to map service_id -> partner_id
const oldAutoServ = `        hotelsMap.forEach(h => {
            let matchedPartnerId = '';
            if (h.name) {
                const matched = partners.find(p => p.partner_name === h.name);
                if (matched) matchedPartnerId = matched.partner_id;
            }
            autoServ.push({`;

const newAutoServ = `        hotelsMap.forEach(h => {
            let matchedPartnerId = '';
            if (h.service_id && allServices.length > 0) {
                const srv = allServices.find(s => s.service_id == h.service_id);
                if (srv && srv.partner_id) matchedPartnerId = srv.partner_id;
            }
            if (!matchedPartnerId && h.name) {
                const matched = partners.find(p => p.partner_name === h.name);
                if (matched) matchedPartnerId = matched.partner_id;
            }
            // Auto-select the first available partner if still no match, because user requested to select one
            if (!matchedPartnerId && partners.length > 0) {
                // Find first hotel in this destination
                const availableHotels = partners.filter(p => {
                    const isHotel = p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn' || p.partner_type === 'Khách Sạn';
                    if (!isHotel) return false;
                    if (!selectedDep.destination) return true;
                    const dest = destinations.find(d => d.destination_id == p.destination_id);
                    const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                    if (!pDestName) return true;
                    return pDestName.trim().toLowerCase() === selectedDep.destination.trim().toLowerCase();
                });
                if (availableHotels.length > 0) {
                    matchedPartnerId = availableHotels[0].partner_id;
                }
            }
            
            autoServ.push({`;

content = content.replace(oldAutoServ, newAutoServ);

// 5. Update dependency array for autoServ
content = content.replace(
    /}, \[selectedDep, partners, destinations\]\);/g,
    "}, [selectedDep, partners, destinations, allServices]);"
);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed services fetch and auto selection');
