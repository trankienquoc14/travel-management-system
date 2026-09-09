const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/TourListPage.jsx', 'utf8');

const s1 = code.indexOf('            {/* 2. HERO BANNER KEN BURNS & FLOATING SEARCH BAR */}');
const s2 = code.indexOf('            <section ref={showcaseRef}');

if (s1 !== -1 && s2 !== -1) {
    code = code.substring(0, s1) + '            <div style={{ paddingTop: "100px" }}></div>\n\n' + code.substring(s2);
}

code = code.replace(/<CustomerNavbar activeTab=\"home\" \/>/, '<CustomerNavbar activeTab=\"explore\" />');
code = code.replace(/❍ Tour Đang Được Quan Tâm/, '🔥 Khám Phá Tất Cả Chuyến Đi');

fs.writeFileSync('frontend/src/components/TourListPage.jsx', code, 'utf8');