const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'controllers', 'tourController.js');
let content = fs.readFileSync(targetFile, 'utf8');

const oldLogic = `        let finalImageUrl = req.body.existing_image_url || '';
        if (req.file) finalImageUrl = \`/uploads/\${req.file.filename}\`;`;

const newLogic = `        let finalImageUrl = req.body.existing_image_url || '';
        let designDataObj = null;
        if (design_data) {
            try { designDataObj = JSON.parse(design_data); } catch(e) {}
        }
        
        let galleryImages = req.body.existing_gallery ? JSON.parse(req.body.existing_gallery) : [];
        let dayImages = req.body.existing_day_images ? JSON.parse(req.body.existing_day_images) : {};

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const url = \`/uploads/\${file.filename}\`;
                if (file.fieldname === 'image') {
                    finalImageUrl = url;
                } else if (file.fieldname === 'gallery') {
                    galleryImages.push(url);
                } else if (file.fieldname.startsWith('dayImage_')) {
                    const dayIndex = file.fieldname.split('_')[1];
                    dayImages[dayIndex] = url;
                }
            });
        }
        
        if (designDataObj) {
            designDataObj.gallery = galleryImages;
            designDataObj.dayImages = dayImages;
            // Update design_data string
            req.body.design_data = JSON.stringify(designDataObj);
        }`;

content = content.replace(oldLogic, newLogic);
// Oh wait, in the query it uses `design_data` variable which was destructured from req.body.
// So we need to update the `design_data` variable itself!

// Let's do a better replace.
const finalNewLogic = `        let finalImageUrl = req.body.existing_image_url || '';
        let parsedDesignData = null;
        try {
            if (design_data) parsedDesignData = JSON.parse(design_data);
        } catch(e) {}
        
        let galleryImages = req.body.existing_gallery ? JSON.parse(req.body.existing_gallery) : [];
        let dayImages = req.body.existing_day_images ? JSON.parse(req.body.existing_day_images) : {};

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const url = \`/uploads/\${file.filename}\`;
                if (file.fieldname === 'image') {
                    finalImageUrl = url;
                } else if (file.fieldname === 'gallery') {
                    galleryImages.push(url);
                } else if (file.fieldname.startsWith('dayImage_')) {
                    const dayIndex = file.fieldname.split('_')[1];
                    dayImages[dayIndex] = url;
                }
            });
        }
        
        if (parsedDesignData) {
            parsedDesignData.gallery = galleryImages;
            parsedDesignData.dayImages = dayImages;
            // We must re-assign to design_data variable since it's used in the SQL query
            design_data = JSON.stringify(parsedDesignData);
        }`;
        
// wait, `design_data` is destructured as const.
// `const { ..., design_data = null } = req.body;`
// We need to re-destructure or change it to let. Let's fix that.
content = content.replace(/const {\s*tour_id,([^}]+)\s*status = 'Pending',([^}]+)\s*design_data = null\s*} = req\.body;/, `let {
            tour_id, $1
            status = 'Pending', $2
            design_data = null
        } = req.body;`);
        
content = content.replace(oldLogic, finalNewLogic);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Updated tourController.js');
