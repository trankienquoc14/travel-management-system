const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const targetRegex = /<div style=\{\{ marginBottom: '12px' \}\}>\s*<label style=\{styles\.label\}>Link Hình ảnh xe \(URL\)<\/label>\s*<input[^>]+>\s*<\/div>/g;

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

if (targetRegex.test(c)) {
    c = c.replace(targetRegex, newInputStr);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Replaced via regex successfully!");
} else {
    console.log("Regex still didn't match.");
}
