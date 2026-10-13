const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

let lines = c.split('\n');
let idx = lines.findIndex(l => l.includes('const openAddModal'));
if (idx !== -1) {
    if (!lines[idx + 9].includes('imagePreview')) {
        lines.splice(idx + 9, 0, "        imagePreview: veh.image_url || '',");
        lines.splice(idx + 22, 0, "        imagePreview: '',");
        fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', lines.join('\n'));
        console.log("Successfully patched openAddModal with splicing.");
    } else {
        console.log("Already patched.");
    }
}
