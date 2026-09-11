const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/CustomerNavbar.jsx', 'utf8');

const regexLi = /(<li\s+className=\{activeTab === 'explore' \? 'active' : ''\}[\s\S]*?Khám phá\s*<\/li>)/;

code = code.replace(regexLi, (match, p1) => {
    return p1 + `\n\n                    {/* 3.5. Liên hệ */}
                    <li 
                        className={activeTab === 'contact' ? 'active' : ''} 
                        onClick={() => navigate('/contact')} 
                        style={{ 
                            cursor: 'pointer', 
                            fontWeight: activeTab === 'contact' ? '800' : '600',
                            color: activeTab === 'contact' ? '#0194f3' : '#475569',
                            fontSize: '15px',
                            transition: 'color 0.2s ease'
                        }}
                    >
                        Liên hệ
                    </li>`;
});

fs.writeFileSync('frontend/src/components/CustomerNavbar.jsx', code, 'utf8');
console.log('Added Contact link to Navbar');
