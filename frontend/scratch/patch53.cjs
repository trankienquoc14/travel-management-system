const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

c = c.replace(
    "<div style={{ flex: 1, display: 'flex', gap: '24px', width: '100%', height: 'calc(100vh - 140px)' }}>",
    "<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>"
);

c = c.replace(
    "<div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}>",
    "<div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}>\n<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>"
);

c = c.replace(
    "</button>\n                    </div>\n                    \n                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>",
    "</button>\n                    </div>\n                    \n                    <h3 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: '800', display: 'flex', alignItems: 'center' }}>"
);

c = c.replace(
    "</span>\n                    </h3>\n                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '4px' }}>",
    "</span>\n                    </h3>\n</div>\n                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>"
);

c = c.replace(
    "boxShadow: selectedTour?.tour_id === t.tour_id ? '0 8px 20px rgba(1, 148, 243, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)'",
    "flex: '0 0 300px', boxShadow: selectedTour?.tour_id === t.tour_id ? '0 8px 20px rgba(1, 148, 243, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)'"
);

c = c.replace(
    "{/* RIGHT COLUMN: Config Area */}\n                <div style={{ flex: 1, background: '#fff', borderRadius: '24px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}>",
    "{/* BOTTOM ROW: Config Area */}\n                <div style={{ width: '100%', background: '#fff', borderRadius: '24px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'visible', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}>"
);

c = c.replace(
    "<div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>",
    "<div style={{ width: '100%', padding: '30px' }}>"
);

fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Layout replaced');
