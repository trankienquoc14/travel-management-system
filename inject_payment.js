const fs = require('fs');
let cf = fs.readFileSync('frontend/src/components/CustomerFooter.jsx', 'utf8');

// 1. Change grid minmax
cf = cf.replace('minmax(280px, 1fr)', 'minmax(200px, 1fr)');

// 2. Remove bottom footer payment text
const bottomPayment = `                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Thanh toán:</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', color: '#1a1f71', fontStyle: 'italic' }}>VISA</div>
                        <div style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', color: '#ff5f00' }}>MasterCard</div>
                        <div style={{ background: '#a50064', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', color: '#ffffff' }}>MoMo</div>
                        <div style={{ background: '#005baa', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', color: '#ffffff' }}>VNPay</div>
                    </div>
                </div>`;
cf = cf.replace(bottomPayment, '');

// 3. Add Col 5
const col5 = `                </div>

                {/* COL 5: THANH TOÁN */}
                <div>
                    <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase' }}>Chấp Nhận Thanh Toán</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#1a1f71', fontWeight: '900', fontSize: '16px', fontStyle: 'italic', letterSpacing: '-0.5px' }}>VISA</span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexDirection: 'column', lineHeight: '1' }}>
                            <span style={{ color: '#1a1f71', fontSize: '9px', fontWeight: '500' }}>Verified by</span>
                            <span style={{ color: '#1a1f71', fontWeight: '900', fontSize: '14px', fontStyle: 'italic' }}>VISA</span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '14px', height: '14px', background: '#eb001b', borderRadius: '50%', zIndex: 2 }}></div>
                                <div style={{ width: '14px', height: '14px', background: '#f79e1b', borderRadius: '50%', marginLeft: '-6px', zIndex: 1, opacity: 0.9 }}></div>
                            </div>
                            <span style={{ color: '#111', fontWeight: 'bold', fontSize: '11px' }}>MasterCard</span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '-0.5px' }}>
                                <span style={{ color: '#ed1c24' }}>VN</span><span style={{ color: '#005baa' }}>PAY</span>
                            </span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', gap: '2px' }}>
                            <div style={{ background: '#004899', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '1px 3px', borderRadius: '2px' }}>J</div>
                            <div style={{ background: '#ed1c24', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '1px 3px', borderRadius: '2px' }}>C</div>
                            <div style={{ background: '#009f4d', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '1px 3px', borderRadius: '2px' }}>B</div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: '900', fontSize: '14px' }}>
                                <span style={{ color: '#0068ff' }}>Zalo</span><span style={{ color: '#00c300' }}>Pay</span>
                            </span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexDirection: 'column', lineHeight: '1', padding: '0 4px', textAlign: 'center' }}>
                            <span style={{ color: '#002663', fontWeight: '900', fontSize: '8px' }}>AMERICAN</span>
                            <span style={{ color: '#002663', fontWeight: '900', fontSize: '8px' }}>EXPRESS</span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#a50064', fontWeight: '900', fontSize: '15px', letterSpacing: '-0.5px' }}>momo</span>
                        </div>
                    </div>
                </div>`;

cf = cf.replace('                </div>\n\n            </div>', col5 + '\n\n            </div>');

fs.writeFileSync('frontend/src/components/CustomerFooter.jsx', cf, 'utf8');
console.log('Done');
