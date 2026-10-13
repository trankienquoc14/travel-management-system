const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const oldInputStr = `<div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Link Hình ảnh xe (URL)</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={styles.input}
                />
              </div>`;

const newInputStr = `<div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Hình ảnh xe</label>
                {formData.imagePreview && (
                  <div style={{ marginBottom: '10px' }}>
                    <img src={getImageUrl(formData.imagePreview)} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({ 
                        ...formData, 
                        imageFile: file,
                        imagePreview: URL.createObjectURL(file)
                      });
                    }
                  }}
                  style={styles.input}
                />
              </div>`;

if (c.includes('Link Hình ảnh xe (URL)')) {
    c = c.replace(oldInputStr, newInputStr);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Successfully replaced image input with file upload.");
} else {
    console.log("Could not find old image input.");
}
