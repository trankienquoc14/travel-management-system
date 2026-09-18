const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Add state
code = code.replace(
    `const [detailBooking, setDetailBooking] = useState(null);`,
    `const [detailBooking, setDetailBooking] = useState(null);\n    const [ticketBooking, setTicketBooking] = useState(null);`
);

// 2. Find Ticket Pass Container Design block in detailBooking modal
const ticketStartStr = `{/* Ticket Pass Container Design */}`;
const ticketEndStr = `🖨️ IN VÉ\n                                    </button>\n                                </div>\n                            </div>`;

const startIndex = code.indexOf(ticketStartStr);
const endIndex = code.indexOf(ticketEndStr) + ticketEndStr.length;

if (startIndex === -1 || endIndex < startIndex) {
    console.log("Could not find ticket block bounds");
    process.exit(1);
}

const ticketBlock = code.substring(startIndex, endIndex);

// Remove the ticketBlock from detailBooking modal
code = code.substring(0, startIndex) + code.substring(endIndex);

// 3. Add "Xem vé điện tử" button to the footer of detailBooking
const footerStart = `Đóng cửa sổ\n                            </button>`;
const newFooter = `Đóng cửa sổ\n                            </button>\n                            {!detailBooking.isService && <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 24px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>\n                                🎟️ Xem vé điện tử\n                            </button>}`;
code = code.replace(footerStart, newFooter);

// 4. Create the new ticketBooking modal
const newTicketModal = `
            {/* MODAL 1B: VÉ ĐIỆN TỬ */}
            {ticketBooking && (
                <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
                    <div style={{ maxWidth: '850px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        
                        <div className="print-modal" style={{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', width: '100%', marginBottom: '24px' }}>
                            
                            {/* Left Side (Main) */}
                            <div style={{ flex: 1, padding: '32px', borderRight: '2px dashed #cbd5e1', position: 'relative' }}>
                                {/* Cutouts */}
                                <div style={{ position: 'absolute', top: '-16px', right: '-16px', width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', borderBottom: 'none', borderRight: 'none', transform: 'rotate(45deg)', zIndex: 1 }}></div>
                                <div style={{ position: 'absolute', bottom: '-16px', right: '-16px', width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)', zIndex: 1 }}></div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                    <div>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284c7', letterSpacing: '-0.5px' }}>TravelVN</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>E-Ticket Pass</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Hạng vé / Class</span>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>STANDARD</div>
                                    </div>
                                </div>

                                {/* Tour Info Block */}
                                <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Hành trình / Journey</span>
                                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '6px', lineHeight: '1.4' }}>{ticketBooking.tour_name}</div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                        <div>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Khởi hành / Departure</span>
                                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0284c7', marginTop: '4px' }}>
                                                {getDepartureTime(ticketBooking)} | {formatDate(ticketBooking.departure_date)}
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Xuất phát tại / From</span>
                                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                                                {getDepartureLocation(ticketBooking)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Hành khách / Passenger</span>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{ticketBooking.customer_name || 'Khách hàng'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Mã đơn / Order ID</span>
                                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>#{ticketBooking.booking_id}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Side (Stub & QR) */}
                            <div style={{ width: '220px', padding: '32px 24px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                
                                {/* QR Code Image generating dynamically via API */}
                                <div style={{ width: '130px', height: '130px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TRAVELVN-TICKET-\${ticketBooking.booking_id}\`} alt="QR Code" style={{ width: '100%', height: '100%' }} />
                                </div>

                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Mã đặt chỗ / PNR</div>
                                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>#{ticketBooking.booking_id}</div>
                                
                                {/* Status */}
                                <div style={{ marginTop: '16px', padding: '6px 12px', background: ticketBooking.payment_status === 'Paid' ? '#dcfce7' : '#fef3c7', color: ticketBooking.payment_status === 'Paid' ? '#166534' : '#92400e', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                                    {ticketBooking.payment_status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </div>
                            </div>
                        </div>

                        {/* Actions (no-print) */}
                        <div className="no-print" style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => setTicketBooking(null)} style={{ padding: '12px 28px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                Đóng cửa sổ
                            </button>
                            <button onClick={() => window.print()} style={{ padding: '12px 32px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(2,132,199,0.3)' }}>
                                🖨️ In vé
                            </button>
                            <button onClick={() => window.print()} style={{ padding: '12px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(15,23,42,0.3)' }} title="Lưu lại dưới dạng PDF (chọn Save as PDF khi in)">
                                📥 Tải PDF
                            </button>
                        </div>
                        
                    </div>
                </div>
            )}
`;

// Insert after MODAL 1 ends
const modal1End = `MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH`;
code = code.replace(`{/* ${modal1End} */}`, newTicketModal + `\n            {/* ${modal1End} */}`);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Successfully refactored tickets!');
