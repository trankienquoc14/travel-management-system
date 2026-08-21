const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let content = fs.readFileSync(fPath, 'utf8');

const targetStr = `                <TimelineBuilder 
                    days={days} 
                    setDays={setDays} 
                    destinations={destinations} 
                    costConfig={costConfig}
                    setCostConfig={setCostConfig}
                    allServices={allServices}
                />`;

const newStr = `                <TimelineBuilder 
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

if (content.includes('allServices={allServices}')) {
    content = content.replace(targetStr, newStr);
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Passed image props to TimelineBuilder!');
} else {
    console.log('Target string not found');
}
