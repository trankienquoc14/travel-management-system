const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'StaffFixedTourDesigner.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add states
const stateInjection = `    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [dayImages, setDayImages] = useState({});
    const [dayImagePreviews, setDayImagePreviews] = useState({});`;

content = content.replace(/const \[imageFile, setImageFile\] = useState\(null\);\s*const \[imagePreview, setImagePreview\] = useState\(''\);/, stateInjection);

// 2. Add existing data loading
const existingDataLoad = `                if (data.image_url) {
                    setImagePreview(data.image_url);
                }
                if (data.design_data) {
                    try {
                        const parsed = typeof data.design_data === 'string' ? JSON.parse(data.design_data) : data.design_data;
                        if (parsed.gallery) setGalleryPreviews(parsed.gallery);
                        if (parsed.dayImages) setDayImagePreviews(parsed.dayImages);
                    } catch(e) {}
                }`;

content = content.replace(/if \(data\.image_url\) \{\s*setImagePreview\(data\.image_url\);\s*\}/, existingDataLoad);

// 3. Update handleSave
const formDataAppend = `        if (imageFile) {
            formData.append('image', imageFile);
        } else if (imagePreview) {
            formData.append('existing_image_url', imagePreview);
        }

        galleryFiles.forEach(file => {
            formData.append('gallery', file);
        });
        const existingGallery = galleryPreviews.filter(url => typeof url === 'string' && url.startsWith('/'));
        formData.append('existing_gallery', JSON.stringify(existingGallery));

        Object.keys(dayImages).forEach(dayIndex => {
            formData.append('dayImage_' + dayIndex, dayImages[dayIndex]);
        });
        
        const existingDayImages = {};
        Object.keys(dayImagePreviews).forEach(dayIndex => {
            const url = dayImagePreviews[dayIndex];
            if (typeof url === 'string' && url.startsWith('/')) {
                existingDayImages[dayIndex] = url;
            }
        });
        formData.append('existing_day_images', JSON.stringify(existingDayImages));`;

content = content.replace(/if \(imageFile\) \{\s*formData\.append\('image', imageFile\);\s*\} else if \(imagePreview\) \{\s*formData\.append\('existing_image_url', imagePreview\);\s*\}/, formDataAppend);

// 4. Add UI for Gallery
const galleryUI = `                            {/* Image Avatar */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ảnh đại diện Tour (Avatar)</label>
                                {imagePreview && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <img src={imagePreview.startsWith('/') ? 'http://localhost:5002' + imagePreview : imagePreview} alt="Preview" style={{ width: '200px', borderRadius: '4px' }} />
                                        <br/>
                                        <button onClick={() => { setImagePreview(''); setImageFile(null); }} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginTop: '5px' }}>Xóa ảnh</button>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setImageFile(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }
                                }} />
                            </div>

                            {/* Gallery Images */}
                            <div style={{ marginBottom: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Thư viện ảnh Tour (Gallery)</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                    {galleryPreviews.map((url, index) => (
                                        <div key={index} style={{ position: 'relative' }}>
                                            <img src={url.startsWith('/') ? 'http://localhost:5002' + url : url} alt="Gallery" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                            <button 
                                                onClick={() => {
                                                    const newPreviews = [...galleryPreviews];
                                                    newPreviews.splice(index, 1);
                                                    setGalleryPreviews(newPreviews);
                                                    
                                                    if (!url.startsWith('/')) {
                                                        const fileIndex = galleryFiles.findIndex(f => f.preview === url);
                                                        if (fileIndex > -1) {
                                                            const newFiles = [...galleryFiles];
                                                            newFiles.splice(fileIndex, 1);
                                                            setGalleryFiles(newFiles);
                                                        }
                                                    }
                                                }}
                                                style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >X</button>
                                        </div>
                                    ))}
                                </div>
                                <input type="file" accept="image/*" multiple onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    if (files.length > 0) {
                                        const filePreviews = files.map(f => {
                                            const url = URL.createObjectURL(f);
                                            f.preview = url;
                                            return url;
                                        });
                                        setGalleryFiles([...galleryFiles, ...files]);
                                        setGalleryPreviews([...galleryPreviews, ...filePreviews]);
                                    }
                                    e.target.value = null; // reset input
                                }} />
                            </div>`;

content = content.replace(/<div style=\{\{ marginBottom: '15px' \}\}>\s*<label style=\{\{ display: 'block', marginBottom: '8px', fontWeight: '500' \}\}>nh \`i di\?n Tour<\/label>[\s\S]*?<\/div>\s*<\/div>/, galleryUI + '\n                        </div>');
// Wait, the regex for replacing Avatar is hard to get right because of unicode.
// Let's just do an exact index replace.
let indexOfAvatarStart = content.indexOf('<div style={{ marginBottom: \'15px\' }}>');
if (indexOfAvatarStart > -1) {
    let indexOfAvatarLabel = content.indexOf('Tour', indexOfAvatarStart);
    if (indexOfAvatarLabel > -1 && indexOfAvatarLabel - indexOfAvatarStart < 200) {
        // Find the closing div of this section
        let indexOfAvatarEnd = content.indexOf('</div>', indexOfAvatarStart);
        indexOfAvatarEnd = content.indexOf('</div>', indexOfAvatarEnd + 1); // inner div
        indexOfAvatarEnd = content.indexOf('</div>', indexOfAvatarEnd + 1); // outer div? Wait, let's just do a string replace of the entire block.
    }
}
