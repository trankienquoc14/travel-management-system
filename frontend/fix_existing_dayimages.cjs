const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let content = fs.readFileSync(fPath, 'utf8');

const targetStr = `            Object.keys(dayImages).forEach(dayIndex => {
                data.append('dayImage_' + dayIndex, dayImages[dayIndex]);
            });`;

const newStr = `            Object.keys(dayImages).forEach(dayIndex => {
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
            data.append('existing_dayImages', JSON.stringify(existingUrls));`;

if (content.includes("data.append('dayImage_' + dayIndex, dayImages[dayIndex]);")) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Fixed existing_dayImages payload!');
} else {
    console.log('Target string not found');
}
