const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

// Add margin Top to child pricing block
const target1 = `            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#0ea5e9' }}>Chính sách giá trẻ em</h3>`;

const replace1 = `            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#0ea5e9' }}>Chính sách giá trẻ em</h3>`;

c = c.replace(target1, replace1);

// Decrease margin Top of pricing footer
const target2 = `<div style={{ marginTop: '40px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>`;

const replace2 = `<div style={{ marginTop: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>`;

c = c.replace(target2, replace2);

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
console.log('Fixed margin CSS');
