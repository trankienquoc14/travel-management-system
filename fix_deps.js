const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

content = content.replace("}, [selectedDep, partners]);", "}, [selectedDep, partners, destinations]);");

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed deps');
