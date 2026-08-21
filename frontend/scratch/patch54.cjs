const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

c = c.replace(
    "</span>\n                    </h3>\n</div>\n                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>",
    "</span>\n                    </h3>\n                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', paddingRight: '0' }}>"
);

// We also need to fix the width of the Left Column which is currently a top row.
// Let's replace the fixed width flex: '0 0 340px' with width: '100%' since my patch53 failed to match it.
const leftColStart = c.indexOf("<div style={{ flex: '0 0 340px'");
if (leftColStart > -1) {
    const nextClose = c.indexOf(">", leftColStart);
    c = c.substring(0, leftColStart) + "<div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}" + c.substring(nextClose + 1);
}

// We need to fix the right column width as well.
const rightColStart = c.indexOf("<div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '24px'");
if (rightColStart > -1) {
    const nextClose = c.indexOf(">", rightColStart);
    c = c.substring(0, rightColStart) + "<div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6', overflow: 'hidden' }}" + c.substring(nextClose + 1);
}

fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Fixed extra div and column widths');
