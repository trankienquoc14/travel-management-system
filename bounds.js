const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

const s1 = code.indexOf('            <section ref={showcaseRef}');
const s2 = code.indexOf('            {/* ===============================================');

console.log('31', s1, 's2', s2);

