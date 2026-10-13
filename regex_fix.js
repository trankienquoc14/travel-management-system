const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const regex = /onClick=\{\(\) => \{ setSelectedVehicle\(v\); setShowMaintModal\(true\); \}\}\s*style=\{\{ \.\.\.styles\.btnSmall, backgroundColor: '#f59e0b', color: '#fff' \}\}/;

const replacement = `onClick={() => { setSelectedVehicle(v); fetchHistory(v.vehicle_id); setShowMaintModal(true); }}
                            style={{ ...styles.btnSmall, backgroundColor: '#64748b', color: '#fff' }}`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Successfully replaced button attributes via regex.");
} else {
    console.log("Regex didn't match.");
}
