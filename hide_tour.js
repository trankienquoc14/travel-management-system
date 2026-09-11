const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/CustomerNavbar.jsx', 'utf8');

const targetStr = `{/* 4. Tự thiết kế Tour */}
                    <li 
                        className={activeTab === 'build-tour' ? 'active' : ''} `;

const replaceStr = `{/* 4. Tự thiết kế Tour */}
                    {user && (
                    <li 
                        className={activeTab === 'build-tour' ? 'active' : ''} `;

const targetEnd = `✨ Tự thiết kế Tour
                    </li>`;

const replaceEnd = `✨ Tự thiết kế Tour
                    </li>
                    )}`;

code = code.replace(targetStr, replaceStr);
code = code.replace(targetEnd, replaceEnd);

fs.writeFileSync('frontend/src/components/CustomerNavbar.jsx', code, 'utf8');
console.log('Done hiding Tự thiết kế tour');
