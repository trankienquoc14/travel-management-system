const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

c = c.replace(
    /if \(resFixed\.data\.success\) \{\s*setAllFixedTours\(resFixed\.data\.data\);\s*\}/,
    `if (resFixed.data.success) {
                setAllFixedTours(resFixed.data.data);
            }
            if (resDest && resDest.data.success) {
                setDestinations(resDest.data.data);
            }`
);

fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);
