const fs = require('fs');
const file = 'frontend/src/components/MyBookings.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/ fontFamily: '"Courier New", Courier, monospace',/g, '');
code = code.replace(/ letterSpacing: '0.5px'/g, '');

// Also let's change TỔNG THANH TOÁN 20px -> 18px to match standard sizing a bit better, if 20px is too big.
// But wait, the standard size for total in the rest of the app might be 18px or 20px. Let's keep it as is, or make it 18px.
// Actually, earlier it was 18px: <div style={{ fontSize: '18px', fontWeight: 'bold' ...
// Let's change 20px back to 18px for the TỔNG THANH TOÁN value
code = code.replace(/fontSize: '20px', fontWeight: '900'/g, `fontSize: '18px', fontWeight: '800'`);

fs.writeFileSync(file, code, 'utf8');
console.log('Removed monospace font and adjusted sizes');
