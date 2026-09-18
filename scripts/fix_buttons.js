const fs = require('fs');
let jsx = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

jsx = jsx.replace(
    `<button onClick={() => window.print()} style={{ width: '100%', padding: '10px 0', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>`,
    `<button className="no-print" onClick={() => window.print()} style={{ width: '100%', padding: '10px 0', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>`
);

// We should also ensure the close button at top right is hidden.
// Let's find it.
jsx = jsx.replace(
    `onClick={() => setDetailBooking(null)}\r\n                                style={{ position: 'absolute', top: '16px', right: '16px'`,
    `className="no-print"\r\n                                onClick={() => setDetailBooking(null)}\r\n                                style={{ position: 'absolute', top: '16px', right: '16px'`
);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', jsx, 'utf8');
console.log('Fixed buttons');