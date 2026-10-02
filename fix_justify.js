const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');
content = content.replace(/justify: 'space-between'/g, "justifyContent: 'space-between'");
fs.writeFileSync('frontend/src/components/Dashboard.jsx', content);
console.log('Fixed');
