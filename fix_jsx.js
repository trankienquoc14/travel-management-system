const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<\/div>\s*\);\s*\}\)\}/g;
code = code.replace(regex, "</div></React.Fragment>);})}");

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
