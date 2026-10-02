const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

// 1. Add state
if (!content.includes('const [destinations, setDestinations]')) {
    content = content.replace(
        "const [partners, setPartners] = useState([]);",
        "const [partners, setPartners] = useState([]);\n    const [destinations, setDestinations] = useState([]);"
    );
}

// 2. Add fetch
if (!content.includes('/api/destinations')) {
    const fetchPartnersStr = "const partRes = await axios.get('http://localhost:5000/api/partners', { headers });\n                if (partRes.data.success) setPartners(partRes.data.data);";
    const fetchDestStr = "const partRes = await axios.get('http://localhost:5000/api/partners', { headers });\n                if (partRes.data.success) setPartners(partRes.data.data);\n\n                const destRes = await axios.get('http://localhost:5000/api/destinations', { headers });\n                if (destRes.data.success) setDestinations(destRes.data.data);";
    content = content.replace(fetchPartnersStr, fetchDestStr);
}

// 3. Fix the dropdown filter again
const oldFilter = /\{partners\.filter\(p => \(p\.partner_type === 'Hotel' \|\| p\.partner_type === 'Accommodation' \|\| p\.partner_type === 'Khách sạn'\) && \(\!selectedDep\.destination \|\| p\.destination_name\?\.trim\(\) === selectedDep\.destination\?\.trim\(\)\)\)\.map\(p => \(/g;
const newFilter = `{partners.filter(p => {
                                            if (p.partner_type !== 'Hotel' && p.partner_type !== 'Accommodation' && p.partner_type !== 'Khách sạn') return false;
                                            const dest = destinations.find(d => d.destination_id === p.destination_id);
                                            const pDestName = dest ? dest.destination_name : (p.destination_name || null);
                                            return !selectedDep.destination || pDestName?.trim() === selectedDep.destination?.trim();
                                        }).map(p => (`;
content = content.replace(oldFilter, newFilter);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed using frontend destinations');
