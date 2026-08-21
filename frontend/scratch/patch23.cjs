const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

// Fix duplicated overview
const dupRegex = /\{\(parsedDesign\?\.categories\?\.length > 0 \|\| parsedDesign\?\.highlights\) && \([\s\S]*?<\/div>\n                    \)\}\n                    \n                    \{\(parsedDesign\?\.categories\?\.length > 0 \|\| parsedDesign\?\.highlights\) && \([\s\S]*?<\/div>\n                    \)\}/;

c = c.replace(dupRegex, (match) => {
    // Just keep the first half
    return match.substring(0, match.length / 2).trim();
});

// Fix set-state-in-effect and hoisting
c = c.replace(
    /    const fetchTourDetail = async \(\) => \{[\s\S]*?    \};\n\n    useEffect\(\(\) => \{\n        fetchTourDetail\(\);\n    \}, \[id\]\);/,
    `    useEffect(() => {
        const fetchTourDetail = async () => {
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
        fetchTourDetail();
    }, [id]);`
);

fs.writeFileSync('src/components/TourDetail.jsx', c);
