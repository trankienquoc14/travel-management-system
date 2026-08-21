const fs = require('fs');
const path = require('path');
const fPath = path.join(__dirname, '..', 'microservices', 'tour-service', 'controllers', 'tourController.js');
let content = fs.readFileSync(fPath, 'utf8');

const targetStr = `        let finalImageUrl = req.body.existing_image_url || '';
        if (req.file) finalImageUrl = \`/uploads/\${req.file.filename}\`;`;

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

if (content.indexOf(targetStr) !== -1) {
    const firstHalf = content.substring(0, content.indexOf('exports.saveFixedTourDesign'));
    const secondHalf = content.substring(content.indexOf('exports.saveFixedTourDesign'));
    
    if (secondHalf.indexOf(targetStr) !== -1) {
        const replaced = secondHalf.replace(targetStr, newStr);
        fs.writeFileSync(fPath, firstHalf + replaced, 'utf8');
        console.log('Successfully patched!');
    } else {
        console.log('Not found in second half!');
    }
} else {
    console.log('Target string completely not found!');
}
