const fs = require('fs');
let cf = fs.readFileSync('frontend/src/components/CustomerFooter.jsx', 'utf8');

// Container
cf = cf.replace(
  "<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '40px' }}>",
  "<div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '28px', marginBottom: '40px' }}>"
);

// Title 1
cf = cf.replace(
  "<h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Dịch Vụ & Khám Phá</h4>",
  "<h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dịch Vụ & Khám Phá</h4>"
);

// Title 2
cf = cf.replace(
  "<h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Hỗ Trợ & Liên Hệ</h4>",
  "<h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hỗ Trợ & Liên Hệ</h4>"
);

// Title 3
cf = cf.replace(
  "<h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Bản Đồ Vị Trí</h4>",
  "<h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bản Đồ Vị Trí</h4>"
);

// Title 4
cf = cf.replace(
  "<h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase' }}>Chấp Nhận Thanh Toán</h4>",
  "<h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Thanh Toán</h4>"
);

// Map Box
cf = cf.replace(
  "<div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: '180px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>",
  "<div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: '164px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>"
);

// Bottom Footer max width
cf = cf.replace(
  "<div style={{ borderTop: '1px solid #1e293b', padding: '24px 24px 0 24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>",
  "<div style={{ borderTop: '1px solid #1e293b', padding: '24px 32px 0 32px', maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>"
);

// Adjust Payment Icons height to 38px
cf = cf.replace(/height: '40px'/g, "height: '38px'");

fs.writeFileSync('frontend/src/components/CustomerFooter.jsx', cf, 'utf8');
