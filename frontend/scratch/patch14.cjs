const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

c = c.replace(
    /return dest \? dest\.name : '';/g,
    "return dest ? dest.destination_name : '';"
);

c = c.replace(
    /return dest \? dest\.name : 'Chưa rõ';/g,
    "return dest ? dest.destination_name : 'Chưa rõ';"
);

fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);
