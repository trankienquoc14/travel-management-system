const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

const regex = /const fetchTourDetail = async \(\) => \{[\s\S]*?alert\('Lỗi khi tải thông tin tour!'\);\n        \}\n    \};/;

const newFetch = `const fetchTourDetail = async () => {
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

c = c.replace(regex, newFetch);

fs.writeFileSync('src/components/TourDetail.jsx', c);
