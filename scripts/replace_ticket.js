const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<div style=\{\{ background: 'linear-gradient[^>]+>\s*<div>\s*<div[^>]+>VÉ ĐIỆN TỬ E-TICKET PASS<\/div>\s*<div[^>]+>Hành khách: \{detailBooking\.customer_name \|\| 'Khách hàng'\}<\/div>\s*<div[^>]+>SĐT liên hệ: \{detailBooking\.customer_phone \|\| 'N\/A'\}<\/div>\s*<\/div>\s*<button[^>]+>\s*🖨️ In Vé Điện Tử\s*<\/button>\s*<\/div>/g;

const replacement = `<div style={{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', marginTop: '20px' }}>
                                {/* Left Side (Main) */}
                                <div style={{ flex: 1, padding: '24px', borderRight: '2px dashed #cbd5e1', position: 'relative' }}>
                                    {/* Cutouts */}
                                    <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', borderBottom: 'none', borderRight: 'none', transform: 'rotate(45deg)', zIndex: 1 }}></div>
                                    <div style={{ position: 'absolute', bottom: '-12px', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)', zIndex: 1 }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Hành khách / Passenger</span>
                                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{detailBooking.customer_name || 'Khách hàng'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Hạng vé / Class</span>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0284c7', marginTop: '2px' }}>E-TICKET</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Liên hệ / Contact</span>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>{detailBooking.customer_phone || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Email</span>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detailBooking.customer_email || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right Side (Stub & Actions) */}
                                <div style={{ width: '180px', padding: '24px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Mã đặt chỗ</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', letterSpacing: '2px', marginBottom: '16px' }}>#{detailBooking.booking_id}</div>
                                    
                                    {/* Fake Barcode */}
                                    <div style={{ width: '100%', height: '40px', background: 'repeating-linear-gradient(to right, #0f172a, #0f172a 3px, transparent 3px, transparent 6px, #0f172a 6px, #0f172a 7px, transparent 7px, transparent 9px, #0f172a 9px, #0f172a 14px, transparent 14px, transparent 16px)', opacity: 0.8, marginBottom: '16px' }}></div>
                                    
                                    <button onClick={() => window.print()} style={{ width: '100%', padding: '10px 0', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                        🖨️ IN VÉ
                                    </button>
                                </div>
                            </div>`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Replaced ticket pass');
} else {
    console.log('Regex did not match');
}