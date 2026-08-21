const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let content = fs.readFileSync(fPath, 'utf8');

const targetStr1 = `            Object.keys(dayImages).forEach(dayIndex => {
                data.append('dayImage_' + dayIndex, dayImages[dayIndex]);
            });`;

const newStr1 = `            Object.keys(dayImages).forEach(dayIndex => {
                data.append('dayImage_' + dayIndex, dayImages[dayIndex]);
            });
            
            const existingUrls = {};
            if (dayImagePreviews) {
                Object.keys(dayImagePreviews).forEach(k => {
                    if (typeof dayImagePreviews[k] === 'string' && dayImagePreviews[k].startsWith('/')) {
                        existingUrls[k] = dayImagePreviews[k];
                    }
                });
            }
            data.append('existing_day_images', JSON.stringify(existingUrls));`;

if (content.includes("data.append('dayImage_' + dayIndex, dayImages[dayIndex]);")) {
    content = content.replace(targetStr1, newStr1);
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Fixed payload');
}
