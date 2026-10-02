const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

content = content.replace(
    /return \!selectedDep\.destination \|\| pDestName\?\.trim\(\) === selectedDep\.destination\?\.trim\(\);/g,
    "return !selectedDep.destination || pDestName?.trim().toLowerCase() === selectedDep.destination?.trim().toLowerCase();"
);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed case sensitivity');
