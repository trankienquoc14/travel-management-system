const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'StaffFixedTourDesigner.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

const oldUI = `                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Ảnh đại diện</label>
                        <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>`;

const newUI = `                    <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: '1' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Ảnh đại diện</label>
                                {formData.image_url && !formData.image && (
                                    <img src={'http://localhost:5002' + formData.image_url} alt="Avatar" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                                )}
                                {formData.image && (
                                    <img src={URL.createObjectURL(formData.image)} alt="Avatar" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                                )}
                                <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div style={{ flex: '2', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Thư viện ảnh Tour (Gallery)</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                    {galleryPreviews.map((url, index) => (
                                        <div key={index} style={{ position: 'relative' }}>
                                            <img src={url.startsWith('/') ? 'http://localhost:5002' + url : url} alt="Gallery" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
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
                            </div>
                        </div>
                    </div>`;

content = content.replace(oldUI, newUI);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Updated StaffFixedTourDesigner.jsx step2');
