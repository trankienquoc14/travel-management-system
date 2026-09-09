const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

code = code.replace(
    /minWidth: '280px', maxWidth: '320px', flex: '1 0 auto', scrollSnapAlign: 'start', height: '100%',/g, 
    "minWidth: '280px', maxWidth: '320px', flex: '1 0 auto', scrollSnapAlign: 'start', height: '380px',"
);

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
console.log('Fixed card height to 380px successfully');
