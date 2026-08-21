const fs = require('fs');
const path = require('path');

function fixTourController() {
    const fPath = path.join(__dirname, '..', 'microservices', 'tour-service', 'controllers', 'tourController.js');
    let content = fs.readFileSync(fPath, 'utf8');

    const startIdx = content.indexOf('exports.saveFixedTourDesign =');
    if (startIdx === -1) {
        console.log("Could not find exports.saveFixedTourDesign");
        return;
    }

    const endIdx = content.indexOf('exports.getDestinationResources =', startIdx);
    if (endIdx === -1) {
        console.log("Could not find end of saveFixedTourDesign");
        return;
    }

    let funcBody = content.substring(startIdx, endIdx);

    const oldBlock = `        let finalImageUrl = req.body.existing_image_url || '';
        if (req.file) finalImageUrl = \`/uploads/\${req.file.filename}\`;`;

    const newBlock = `        let finalImageUrl = req.body.existing_image_url || '';
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
                let parsed = JSON.parse(design_data);
                parsed.dayImages = dayImages;
                design_data = JSON.stringify(parsed);
            } catch(e) {}
        }`;

    if (funcBody.includes(oldBlock)) {
        funcBody = funcBody.replace(oldBlock, newBlock);
        content = content.substring(0, startIdx) + funcBody + content.substring(endIdx);
        fs.writeFileSync(fPath, content, 'utf8');
        console.log("Successfully patched saveFixedTourDesign!");
    } else {
        console.log("Could not find oldBlock in funcBody. Let's see funcBody excerpt:");
        console.log(funcBody.substring(0, 1500));
    }
}

fixTourController();
