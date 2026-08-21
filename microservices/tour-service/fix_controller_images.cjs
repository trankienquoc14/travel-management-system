const fs = require('fs');
const fPath = 'controllers/tourController.js';
let content = fs.readFileSync(fPath, 'utf8');

const targetStr = `        let dayImages = {};
        if (req.files && Array.isArray(req.files)) {`;

const newStr = `        let dayImages = {};
        if (req.body.existing_dayImages) {
            try {
                dayImages = JSON.parse(req.body.existing_dayImages);
            } catch(e) {}
        }
        if (req.files && Array.isArray(req.files)) {`;

if (content.includes('let dayImages = {};')) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Fixed tourController existing_dayImages!');
} else {
    console.log('Target string not found');
}
