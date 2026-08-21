const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

c = c.replace(
    /    useEffect\(\(\) => \{\n        fetchTours\(\);\n        fetchDestinations\(\);\n        fetchTransportServices\(\);\n    \}, \[\]\);\n\n    useEffect\(\(\) => \{\n        if \(editTourData && editTourData\.tour_id\) \{\n            handleEditTour\(editTourData\);\n        \}\n    \}, \[editTourData\]\);\n/g,
    ''
);

// We need to inject them after handleEditTour
const injectAnchor = 'if (!isEditing) {';
c = c.replace(injectAnchor, `    useEffect(() => {
        fetchTours();
        fetchDestinations();
        fetchTransportServices();
    }, []);

    useEffect(() => {
        if (editTourData && editTourData.tour_id) {
            handleEditTour(editTourData);
        }
    }, [editTourData]);

    if (!isEditing) {`);

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
