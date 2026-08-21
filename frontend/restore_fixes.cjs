const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let content = fs.readFileSync(fPath, 'utf8');

// 1. Add existing_day_images logic
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

content = content.replace(targetStr1, newStr1);

// 2. Add dayImages props to TimelineBuilder
const targetStr2 = `                <TimelineBuilder 
                    days={days} 
                    setDays={setDays} 
                    destinations={destinations} 
                    costConfig={costConfig}
                    setCostConfig={setCostConfig}
                    allServices={allServices}
                />`;

const newStr2 = `                <TimelineBuilder 
                    days={days} 
                    setDays={setDays} 
                    destinations={destinations} 
                    costConfig={costConfig}
                    setCostConfig={setCostConfig}
                    allServices={allServices}
                    dayImages={dayImages}
                    setDayImages={setDayImages}
                    dayImagePreviews={dayImagePreviews}
                    setDayImagePreviews={setDayImagePreviews}
                />`;

content = content.replace(targetStr2, newStr2);

fs.writeFileSync(fPath, content, 'utf8');
console.log('Fixed StaffFixedTourDesigner.jsx successfully!');
