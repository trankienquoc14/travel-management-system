const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

c = c.replace('const img = parsedDesign?.dayImages?.[day.dayIndex] || bgImage;', `
    let img = parsedDesign?.dayImages?.[day.dayIndex];
    if (img && !img.startsWith('http')) {
        let path = img;
        if (path.startsWith('/uploads/')) path = path.replace('/uploads/', '');
        if (!path.startsWith('uploads/')) path = 'uploads/' + path;
        img = 'http://localhost:5000/' + path;
    }
    img = img || bgImage;
`);
fs.writeFileSync('src/components/TourDetail.jsx', c);
