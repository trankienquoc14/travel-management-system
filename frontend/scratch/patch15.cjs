const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

c = c.replace(
    /const ids = \[\.\.\.new Set\(dd\.days\.map\(d => d\.end_destination_id\)\.filter\(Boolean\)\)\];/,
    `const startOriginId = dd.days[0]?.start_destination_id;
            const rawIds = [...new Set(dd.days.map(d => d.end_destination_id).filter(Boolean))];
            const ids = rawIds.filter(id => String(id) !== String(startOriginId));`
);

fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);
