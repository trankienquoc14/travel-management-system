const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/StaffVehicleManagement.jsx', 'utf8');

c = c.replace(
  "input: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }",
  "input: { padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1e293b' }"
);

c = c.replace(
  "select: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff', minWidth: '150px' }",
  "select: { padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff', minWidth: '150px', fontFamily: 'inherit', color: '#1e293b' }"
);

fs.writeFileSync('frontend/src/components/StaffVehicleManagement.jsx', c);
console.log('Inputs updated');
