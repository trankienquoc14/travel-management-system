const fs = require('fs');
const c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
    if (l.includes('type="number"')) {
        console.log('L' + i + ': ' + l.trim());
    }
});
