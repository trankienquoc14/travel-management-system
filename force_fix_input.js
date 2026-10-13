const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const startStr = `<div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Link Hình ảnh xe (URL)</label>`;
const startIdx = c.indexOf(startStr);

if (startIdx !== -1) {
    const endStr = `</div>`;
    const endIdx = c.indexOf(endStr, startIdx + startStr.length) + endStr.length;
    
    const target = c.substring(startIdx, endIdx);
    
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

    c = c.substring(0, startIdx) + newInputStr + c.substring(endIdx);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Successfully forced replacement of image input.");
} else {
    console.log("Could not find startStr.");
}
