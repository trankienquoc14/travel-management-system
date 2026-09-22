const fs = require('fs');

let cf = fs.readFileSync('frontend/src/components/CustomerFooter.jsx', 'utf8');

const addressBlock = `<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#94a3b8', fontSize: '14px' }}>
                            <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '50%' }}>
                                <MapPin size={18} style={{ color: '#38bdf8' }} />
                            </div>
                            <span style={{ lineHeight: '1.5' }}>190 Pasteur, Phường Xuân Hòa,<br/>Quận 1, TP. Hồ Chí Minh</span>
                        </div>`;

const newMapBlock = `<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#94a3b8', fontSize: '14px' }}>
                            <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '50%' }}>
                                <MapPin size={18} style={{ color: '#38bdf8' }} />
                            </div>
                            <span style={{ lineHeight: '1.5' }}>190 Pasteur, Phường Xuân Hòa,<br/>Quận 1, TP. Hồ Chí Minh</span>
                        </div>
                        
                        {/* MAP EMBED */}
                        <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: '140px' }}>
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.349681534062!2d106.6908422153343!3d10.784507092315758!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528cb3e77f0bf%3A0x5db422eeb8e860bc!2s190%20Pasteur%2C%20Ph%C6%B0%E1%BB%9Dng%206%2C%20Qu%E1%BA%ADn%203%2C%20Th%C3%A0nh%20ph%E1%BB%91%20H%E1%BB%93%20Ch%C3%AD%20Minh%2C%20Vietnam!5e0!3m2!1sen!2s!4v1689154940000!5m2!1sen!2s" 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0, display: 'block' }} 
                                allowFullScreen="" 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>`;

cf = cf.replace(addressBlock, newMapBlock);
fs.writeFileSync('frontend/src/components/CustomerFooter.jsx', cf, 'utf8');
console.log('Added map');
