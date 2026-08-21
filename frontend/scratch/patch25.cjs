const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

c = c.replace(
    /    useEffect\(\(\) => \{\n        fetchTourDetail\(\);\n    \}, \[id\]\);\n\n    async function fetchTourDetail\(\) \{[\s\S]*?    \};\n/g,
    `    const fetchTourDetail = async () => {
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

    useEffect(() => {
        fetchTourDetail();
    }, [id]);\n`
);
fs.writeFileSync('src/components/TourDetail.jsx', c);
