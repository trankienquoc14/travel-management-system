const fs = require('fs');
let lines = fs.readFileSync('src/components/TourDetail.jsx', 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('const fetchTourDetail = async () => {'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('};') && lines[i-1].includes('alert('));

if (startIdx !== -1 && endIdx !== -1) {
    const newFetch = `    const fetchTourDetail = async () => {
        try {
            const [tourRes, destRes] = await Promise.all([
                axios.get(\`http://localhost:5000/api/tours/\${id}\`),
                axios.get(\`http://localhost:5000/api/destinations\`)
            ]);
            
            if (destRes.data.success) {
                setDestinations(destRes.data.data);
            }

            if (tourRes.data.success) {
                let data = tourRes.data.data;
                while (Array.isArray(data)) data = data[0];
                setTour(data);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tải thông tin tour!');
        }
    };

    const getDestString = (tourObj, design) => {
        try {
            if (!design || !design.days) return tourObj.destination;
            const startOriginId = design.days[0]?.start_destination_id;
            const rawIds = [...new Set(design.days.map(d => d.end_destination_id).filter(Boolean))];
            const ids = rawIds.filter(id => String(id) !== String(startOriginId));
            const names = ids.map(idx => {
                const dest = destinations.find(x => String(x.destination_id) === String(idx));
                return dest ? dest.destination_name : '';
            }).filter(Boolean);
            return names.length > 0 ? names.join(' - ') : tourObj.destination;
        } catch(e) {
            return tourObj.destination;
        }
    };`;

    lines.splice(startIdx, endIdx - startIdx + 1, newFetch);
    fs.writeFileSync('src/components/TourDetail.jsx', lines.join('\n'));
} else {
    console.error("COULD NOT FIND fetchTourDetail indices", startIdx, endIdx);
}
