const fs = require('fs');
const path = require('path');
const fPath = path.join(__dirname, '..', 'microservices', 'tour-service', 'controllers', 'tourController.js');
let content = fs.readFileSync(fPath, 'utf8');

const newStr = `        let finalImageUrl = req.body.existing_image_url || '';
        let dayImages = {};

        try {
            if (req.body.existing_day_images) {
                dayImages = JSON.parse(req.body.existing_day_images);
            }
        } catch(e){}

        if (req.files && Array.isArray(req.files)) {
            const mainImg = req.files.find(f => f.fieldname === 'image');
            if (mainImg) finalImageUrl = \`/uploads/\${mainImg.filename}\`;

            req.files.forEach(f => {
                if (f.fieldname.startsWith('dayImage_')) {
                    const dayIdx = f.fieldname.split('_')[1];
                    dayImages[dayIdx] = \`/uploads/\${f.filename}\`;
                }
            });
        }

        if (design_data) {
            try {
                let parsed = typeof design_data === 'string' ? JSON.parse(design_data) : design_data;
                parsed.dayImages = dayImages;
                design_data = JSON.stringify(parsed);
            } catch(e) {}
        }`;

let startIndex = content.indexOf('exports.saveFixedTourDesign =');
let funcStr = content.substring(startIndex);

let targetRegex = /let finalImageUrl = req\.body\.existing_image_url \|\| '';\s*if \(req\.file\) finalImageUrl = `\/uploads\/\$\{req\.file\.filename\}`;/g;

funcStr = funcStr.replace(targetRegex, newStr);

content = content.substring(0, startIndex) + funcStr;
fs.writeFileSync(fPath, content, 'utf8');
console.log('Successfully fixed by Node regex!');
