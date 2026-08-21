const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'StaffFixedTourDesigner.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add states
const stateInjection = `    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [dayImages, setDayImages] = useState({});
    const [dayImagePreviews, setDayImagePreviews] = useState({});`;

content = content.replace(/    const \[formData, setFormData\] = useState\(\{/, stateInjection + '\n    const [formData, setFormData] = useState({');

// 2. Add existing data loading
const fetchLoadRegex = /setFormData\(\{\s*tour_id:\s*tourData\.tour_id,[\s\S]*?image_url:\s*tourData\.image_url\s*\}\);/;
const fetchLoadMatch = content.match(fetchLoadRegex);
if (fetchLoadMatch) {
    const newFetchLoad = fetchLoadMatch[0] + `
                try {
                    const parsed = typeof tourData.design_data === 'string' ? JSON.parse(tourData.design_data) : tourData.design_data;
                    if (parsed && parsed.gallery) setGalleryPreviews(parsed.gallery);
                    if (parsed && parsed.dayImages) setDayImagePreviews(parsed.dayImages);
                } catch(e) {}`;
    content = content.replace(fetchLoadMatch[0], newFetchLoad);
}

// 3. Reset states on cancel/new
const resetStateRegex = /setFormData\(\{ tour_id: null, tour_name: '', description: '', image: null, image_url: '' \}\);/;
const resetStateMatch = content.match(resetStateRegex);
if (resetStateMatch) {
    content = content.replace(resetStateMatch[0], resetStateMatch[0] + `
                        setGalleryFiles([]);
                        setGalleryPreviews([]);
                        setDayImages({});
                        setDayImagePreviews({});`);
}
// 3b. Reset inside useEffect
const useEffectReset = /setFormData\(\{ tour_id: null, tour_name: '', description: '', destination: '', image: null, image_url: '' \}\);/;
const useEffectResetMatch = content.match(useEffectReset);
if (useEffectResetMatch) {
    content = content.replace(useEffectResetMatch[0], useEffectResetMatch[0] + `
            setGalleryFiles([]);
            setGalleryPreviews([]);
            setDayImages({});
            setDayImagePreviews({});`);
}


// 4. Update handleSave
const formDataAppend = `            if (formData.image) data.append('image', formData.image);
            else if (formData.image_url) data.append('existing_image_url', formData.image_url);

            galleryFiles.forEach(file => {
                data.append('gallery', file);
            });
            const existingGallery = galleryPreviews.filter(url => typeof url === 'string' && url.startsWith('/'));
            data.append('existing_gallery', JSON.stringify(existingGallery));

            Object.keys(dayImages).forEach(dayIndex => {
                data.append('dayImage_' + dayIndex, dayImages[dayIndex]);
            });
            
            const existingDayImages = {};
            Object.keys(dayImagePreviews).forEach(dayIndex => {
                const url = dayImagePreviews[dayIndex];
                if (typeof url === 'string' && url.startsWith('/')) {
                    existingDayImages[dayIndex] = url;
                }
            });
            data.append('existing_day_images', JSON.stringify(existingDayImages));`;

content = content.replace(/if \(formData\.image\) data\.append\('image_url', formData\.image\);/, formDataAppend);

// 5. Update TimelineBuilder props
const timelineBuilderPropsOld = `<TimelineBuilder 
                                days={days} 
                                setDays={setDays} 
                            />`;
const timelineBuilderPropsNew = `<TimelineBuilder 
                                days={days} 
                                setDays={setDays} 
                                dayImages={dayImages}
                                setDayImages={setDayImages}
                                dayImagePreviews={dayImagePreviews}
                                setDayImagePreviews={setDayImagePreviews}
                            />`;

content = content.replace(timelineBuilderPropsOld, timelineBuilderPropsNew);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Updated StaffFixedTourDesigner.jsx step1');
