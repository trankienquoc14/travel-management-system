const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

c = c.replace(
    'if (day.meals?.breakfast) includedBreakfast++;',
    'if (day.meals?.breakfast === true || day.meals?.breakfast === \'external\') includedBreakfast++;'
);
c = c.replace(
    'if (day.meals?.lunch) includedLunch++;',
    'if (day.meals?.lunch === true || day.meals?.lunch === \'external\') includedLunch++;'
);
c = c.replace(
    'if (day.meals?.dinner) includedDinner++;',
    'if (day.meals?.dinner === true || day.meals?.dinner === \'external\') includedDinner++;'
);

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
console.log('Fixed StaffFixedTourDesigner variable cost logic');
