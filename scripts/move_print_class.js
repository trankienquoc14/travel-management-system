const fs = require('fs');

// 1. Read JSX
let jsx = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 2. Remove print-modal from the modal wrapper
jsx = jsx.replace(
    `<div className="print-modal" style={{ backgroundColor: '#ffffff', borderRadius: '28px'`,
    `<div style={{ backgroundColor: '#ffffff', borderRadius: '28px'`
);

// 3. Add print-modal to the Ticket Pass wrapper
const ticketTarget = `<div style={{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', marginTop: '20px' }}>`;
const ticketReplacement = `<div className="print-modal" style={{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', marginTop: '20px' }}>`;

jsx = jsx.replace(ticketTarget, ticketReplacement);

// Write back
fs.writeFileSync('frontend/src/components/MyBookings.jsx', jsx, 'utf8');
console.log('Moved print-modal class');
