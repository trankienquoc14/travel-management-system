const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

const targetStr = "minWidth: '280px', maxWidth: '300px', flex: '1 0 auto',";
if (code.includes(targetStr)) {
    code = code.replace(targetStr, "minWidth: 'calc(25% - 15px)', maxWidth: 'calc(25% - 15px)', flex: '0 0 auto',");
    fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
    console.log('Fixed card width');
} else {
    console.log('String not found');
}
