const fs = require('fs');
const content = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => { if (l.includes('type="file"')) console.log(i+1, l); });
