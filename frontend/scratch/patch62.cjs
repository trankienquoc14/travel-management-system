const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

c = c.replace(
    '<option value="Open">Mở Bán</option>\n                                                            <option value="Closed">Khóa</option>\n                                                            <option value="Completed">Hoàn Tất</option>',
    '<option value="Open" style={{ background: \'#fff\', color: \'#111827\' }}>Mở Bán</option>\n                                                            <option value="Closed" style={{ background: \'#fff\', color: \'#111827\' }}>Khóa</option>\n                                                            <option value="Completed" style={{ background: \'#fff\', color: \'#111827\' }}>Hoàn Tất</option>'
);

fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Fixed option styles');
