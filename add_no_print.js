const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Navbar
code = code.replace(/<CustomerNavbar activeTab="my-bookings" \/>/, '<div className="no-print"><CustomerNavbar activeTab="my-bookings" /></div>');

// 2. Main Content
code = code.replace(/<div style=\{\{ maxWidth: '1200px', margin: '0 auto', padding: '36px 20px' \}\}>/, '<div className="no-print" style={{ maxWidth: \'1200px\', margin: \'0 auto\', padding: \'36px 20px\' }}>');

// 3. Footer
code = code.replace(/<footer className="home-footer" style=\{\{ marginTop: 'auto' \}\}>/, '<footer className="home-footer no-print" style={{ marginTop: \'auto\' }}>');

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Added no-print classes');
