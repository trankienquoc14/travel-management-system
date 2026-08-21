const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let content = fs.readFileSync(fPath, 'utf8');

const newStr = `<label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Ảnh đại diện (Cover) *</label>
                        {formData.image_url && !formData.image && (
                            <div style={{ marginBottom: '8px' }}>
                                <img src={formData.image_url.startsWith('/') ? 'http://localhost:5002' + formData.image_url : formData.image_url} alt="Cover" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Ảnh hiện tại</span>
                            </div>
                        )}
                        {formData.image && (
                            <span style={{ display: 'block', fontSize: '13px', color: '#10b981', marginBottom: '8px', fontWeight: 'bold' }}>Đã chọn ảnh mới: {formData.image.name}</span>
                        )}
                        <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />`;

if (content.includes('Ảnh đại diện (Cover) *</label>')) {
    let replaced = content.replace(/<label style=\{\{ display: 'block', marginBottom: '8px', fontWeight: 'bold' \}\}>Ảnh đại diện \(Cover\) \*<\/label>\s*<input type="file" accept="image\/\*" onChange=\{e => setFormData\(\{\.\.\.formData, image: e\.target\.files\[0\]\}\)\} style=\{\{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1' \}\} \/>/, newStr);
    fs.writeFileSync(fPath, replaced, 'utf8');
    console.log('Fixed image preview!');
} else {
    console.log('Label not found.');
}
