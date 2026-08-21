const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

c = c.replace(
    '<option value="">Chưa phân công HDV</option>',
    '<option value="" style={{ background: \'#fff\', color: \'#111827\' }}>Chưa phân công HDV</option>'
);
c = c.replace(
    '<option key={g.user_id} value={g.user_id}>{g.full_name}</option>',
    '<option key={g.user_id} value={g.user_id} style={{ background: \'#fff\', color: \'#111827\' }}>{g.full_name}</option>'
);

fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Fixed guide select option styles');
