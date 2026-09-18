const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{\/\* MODAL 2: YÊU CẦU HỦY \/ ĐỔI LỊCH \*\/\}/;

const newModals = `{/* MODAL 3: XEM CHI TIẾT LỊCH TRÌNH */}
            {itineraryModalBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '800px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                🗺️ Lịch trình: {itineraryModalBooking.tour_name}
                            </h3>
                            <button onClick={() => setItineraryModalBooking(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
                            {(() => {
                                if (loadingRemote || remoteDays === null) return <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải dữ liệu lịch trình...</div>;
                                const days = remoteDays;
                                if (!days || days.length === 0) return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình.</div>;
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {days.map((day, idx) => (
                                            <div key={idx} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                                <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0284c7', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ background: '#e0f2fe', padding: '4px 12px', borderRadius: '20px', fontSize: '14px' }}>Ngày {day.day}</span>
                                                    {day.title}
                                                </h4>
                                                <div style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                                                    {day.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: E-TICKET DOWNLOAD MODAL */}
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

            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH */}`;

if (code.match(regex)) {
    code = code.replace(regex, newModals);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Inserted Modals 3 and 4 successfully');
} else {
    console.log('Failed to find Modal 2 marker');
}
