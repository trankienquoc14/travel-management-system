const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

// 1. Remove the garbage at the end
const garbage = "\\n        imagePreview: veh.image_url || '',\\n        imagePreview: '',";
if (c.endsWith(garbage)) {
    c = c.substring(0, c.length - garbage.length);
}
// Also check if there's a trailing \n added or something
if (c.endsWith(garbage + '\n')) {
    c = c.substring(0, c.length - garbage.length - 1);
}
// Let's just use replace
c = c.replace("\\n        imagePreview: veh.image_url || '',\\n        imagePreview: '',", "");

// 2. Properly insert imagePreview into openAddModal
let lines = c.split('\n');
let idx = lines.findIndex(l => l.includes('const openAddModal ='));
if (idx !== -1) {
    // check if it's already there
    if (!lines[idx + 9].includes('imagePreview')) {
        lines.splice(idx + 9, 0, "        imagePreview: veh.image_url || '',");
    }
    
    // finding the else branch for openAddModal
    let elseIdx = lines.findIndex((l, i) => i > idx && l.includes('} else {'));
    if (elseIdx !== -1) {
        if (!lines[elseIdx + 7].includes('imagePreview')) {
            lines.splice(elseIdx + 7, 0, "        imagePreview: '',");
        }
    }
    
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', lines.join('\n'));
    console.log("Successfully fixed the syntax error and injected imagePreview.");
} else {
    console.log("Could not find openAddModal");
}
