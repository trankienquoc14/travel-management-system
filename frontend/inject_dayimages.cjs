const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let c = fs.readFileSync(fPath, 'utf8');

c = c.replace(/const \[destinations, setDestinations\] = useState\(\[\]\);/, `const [destinations, setDestinations] = useState([]);
    const [dayImages, setDayImages] = useState({});
    const [dayImagePreviews, setDayImagePreviews] = useState({});`);

c = c.replace(/data\.append\('design_data', design_data\);/, `data.append('design_data', design_data);

            Object.keys(dayImages).forEach(dayIndex => {
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
            data.append('existing_day_images', JSON.stringify(existingUrls));`);

c = c.replace(/setCostConfig\(parsed\.costConfig \|\| \{\}\);/, `setCostConfig(parsed.costConfig || {});
                        if (parsed.dayImages) setDayImagePreviews(parsed.dayImages);`);

c = c.replace(/setDays\(\[\]\);\n                        setCostConfig\(\{\}\);/, `setDays([]);
                        setDayImages({});
                        setDayImagePreviews({});
                        setCostConfig({});`);

c = c.replace(/<TimelineBuilder([\s\S]*?)allServices=\{allServices\}/, `<TimelineBuilder$1allServices={allServices}
                    dayImages={dayImages}
                    setDayImages={setDayImages}
                    dayImagePreviews={dayImagePreviews}
                    setDayImagePreviews={setDayImagePreviews}`);

fs.writeFileSync(fPath, c, 'utf8');
console.log('Injected dayImages logic carefully into StaffFixedTourDesigner.jsx!');
