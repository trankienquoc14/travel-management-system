const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Update the button condition and text in the detail modal footer
const detailFooterRegex = /\{!detailBooking\.isService && \(\s*<button onClick=\{\(\) => setTicketBooking\(detailBooking\)\} style=\{\{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' \}\}>\s*<i className="fas fa-print"><\/i> In Vé Điện Tử\s*<\/button>\s*\)\}/;

const newDetailFooterBtn = `{!detailBooking.isService && detailBooking.payment_status === 'Paid' && (
                                <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-ticket-alt"></i> Xem Vé Điện Tử
                                </button>
                            )}`;

if (code.match(detailFooterRegex)) {
    code = code.replace(detailFooterRegex, newDetailFooterBtn);
    console.log('Fixed detail footer button');
} else {
    // try slightly different regex if formatting changed
    const fallbackRegex = /\{!detailBooking\.isService && \([\s\S]*?<\/button>\s*\)\}/;
    if (code.match(fallbackRegex)) {
        code = code.replace(fallbackRegex, newDetailFooterBtn);
        console.log('Fixed detail footer button (fallback regex)');
    }
}

// 2. Replace MODAL 4 entirely
const modal4Regex = /\{\/\* MODAL 4: E-TICKET DOWNLOAD MODAL \*\/\}[\s\S]*?(?=\{\/\* MODAL 2:)/;

const newModal4 = `{/* MODAL 4: E-TICKET DOWNLOAD MODAL */}
            {ticketBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '100vh', overflowY: 'auto', padding: '20px' }}>
                        
                        <div id="ticket-content-to-pdf" style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%' }}>
                            {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => {
                                let depLoc = 'Hồ Chí Minh';
                                let depTime = '06:00 AM';
                                try {
                                    if (ticketBooking.design_data) {
                                        const d = typeof ticketBooking.design_data === 'string' ? JSON.parse(ticketBooking.design_data) : ticketBooking.design_data;
                                        if (d.departureCity) depLoc = d.departureCity;
                                        if (d.startTime) depTime = d.startTime;
                                    } else if (ticketBooking.requirements) {
                                        const r = typeof ticketBooking.requirements === 'string' ? JSON.parse(ticketBooking.requirements) : ticketBooking.requirements;
                                        if (r.departureCity) depLoc = r.departureCity;
                                        if (r.startTime) depTime = r.startTime;
                                    }
                                } catch(e) {}

                                return (
                                    <div key={idx} className={\`print-modal \${idx > 0 && idx % 2 === 0 ? 'html2pdf__page-break' : ''}\`} style={{ display: 'flex', background: '#fff', borderRadius: '24px', overflow: 'hidden', width: '100%', maxWidth: '850px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                                        {/* Left Side */}
                                        <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                                <div>
                                                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#0284c7', letterSpacing: '-0.5px', lineHeight: 1 }}>TravelVN</div>
                                                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', letterSpacing: '1.5px', marginTop: '6px' }}>E-TICKET PASS</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>HẠNG VÉ / CLASS</div>
                                                    <div style={{ fontSize: '20px', color: '#0f172a', fontWeight: '900' }}>STANDARD</div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '32px' }}>
                                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>HÀNH TRÌNH / JOURNEY</div>
                                                <div style={{ fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>{ticketBooking.tour_name}</div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                                                <div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>KHỞI HÀNH / DEPARTURE</div>
                                                    <div style={{ fontSize: '18px', color: '#0284c7', fontWeight: '700' }}>{depTime} | {formatDate(ticketBooking.departure_date)}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>XUẤT PHÁT TẠI / FROM</div>
                                                    <div style={{ fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>{depLoc}</div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid #f1f5f9', margin: '0 0 24px 0' }}></div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>HÀNH KHÁCH / PASSENGER</div>
                                                    <div style={{ fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>{getPassengerName(ticketBooking, idx)}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>MÃ ĐƠN / ORDER ID</div>
                                                    <div style={{ fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>#{ticketBooking.booking_id}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dotted Divider */}
                                        <div style={{ width: '2px', background: 'repeating-linear-gradient(to bottom, #cbd5e1 0, #cbd5e1 8px, transparent 8px, transparent 16px)' }}></div>

                                        {/* Right Side */}
                                        <div style={{ width: '260px', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                                            <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                                                <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=BKG-\${ticketBooking.booking_id}-PAX-\${idx}\`} alt="QR Code" style={{ width: '140px', height: '140px', display: 'block' }} />
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>MÃ ĐẶT CHỖ / PNR</div>
                                            <div style={{ fontSize: '32px', color: '#0f172a', fontWeight: '900', marginBottom: '20px' }}>#{ticketBooking.booking_id}</div>
                                            <div style={{ padding: '8px 20px', background: '#dcfce7', color: '#166534', borderRadius: '24px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ĐÃ THANH TOÁN</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Buttons Footer */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                            <button onClick={() => setTicketBooking(null)} style={{ padding: '12px 28px', background: '#ffffff', color: '#334155', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                Đóng cửa sổ
                            </button>
                            <button onClick={() => window.print()} style={{ padding: '12px 28px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}>
                                <i className="fas fa-print"></i> In vé
                            </button>
                            <button onClick={handleDownloadPDF} style={{ padding: '12px 28px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(15,23,42,0.3)' }}>
                                <i className="fas fa-download"></i> Tải PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            `;

if (code.match(modal4Regex)) {
    code = code.replace(modal4Regex, newModal4);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed modal 4');
} else {
    console.log('Regex failed for modal 4');
}
