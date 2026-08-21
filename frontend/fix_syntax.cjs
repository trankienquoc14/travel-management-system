const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let c = fs.readFileSync(fPath, 'utf8');

c = c.replace(/setDayImages\(\{\}\);\n                        setDayImagePreviews\(\{\}\);\n                        setCostConfig\(\{/g, 'setCostConfig({');

fs.writeFileSync(fPath, c, 'utf8');
console.log('Fixed StaffFixedTourDesigner.jsx syntax error!');
