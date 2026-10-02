const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

content = content.replace(
    /const dest = destinations\.find\(d => d\.destination_id === p\.destination_id\);/g,
    "const dest = destinations.find(d => d.destination_id == p.destination_id);"
);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed type mismatch');
