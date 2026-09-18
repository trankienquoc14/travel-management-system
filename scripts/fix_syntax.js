const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<\/div>\s*\}\)\}\s*<\/div>\s*\{\/\* Actions \(no-print\) \*\/\}/g;
const replacement = `</div>\n</div>\n                            ))}\n                        </div>\n\n                        {/* Actions (no-print) */}`;
code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed syntax error');