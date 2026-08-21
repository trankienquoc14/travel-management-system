const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'StaffFixedTourDesigner.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

const oldTag = `<TimelineBuilder 
                    days={days} 
                    setDays={setDays} 
                    destinations={destinations} 
                    costConfig={costConfig}
                    setCostConfig={setCostConfig}
                    allServices={allServices}
                />`;

const newTag = `<TimelineBuilder 
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

content = content.replace(oldTag, newTag);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Updated StaffFixedTourDesigner props');
