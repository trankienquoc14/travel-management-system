const fs = require('fs');

let lines = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8').split('\n');

const idx = lines.findIndex(l => l.includes('Link Hình ảnh xe (URL)'));

if (idx !== -1) {
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

    // Remove 9 lines from idx - 1 (which includes the wrapper div and the input)
    lines.splice(idx - 1, 10, newInputStr);

    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', lines.join('\n'));
    console.log("Splice success!");
} else {
    console.log("Could not find the text.");
}
