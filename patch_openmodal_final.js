const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const targetStr = `  const openAddModal = (veh = null) => {
    if (veh) {
      setEditVehicle(veh);
      setFormData({
        vehicle_code: veh.vehicle_code || '',
        license_plate: veh.license_plate || '',
        seat_capacity: veh.seat_capacity || 7,
        vehicle_type: veh.vehicle_type || 'Xe 7 chỗ',
        brand_model: veh.brand_model || '',
        image_url: veh.image_url || '',
        color: veh.color || 'Trắng',
        status: veh.status || 'AVAILABLE',
        notes: veh.notes || ''
      });
    } else {
      setEditVehicle(null);
      setFormData({
        vehicle_code: '',
        license_plate: '',
        seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ',
        brand_model: '',
        image_url: '',
        color: 'Trắng',
        status: 'AVAILABLE',
        notes: ''
      });
    }
    setShowAddModal(true);
  };`;

const replacementStr = `  const openAddModal = (veh = null) => {
    if (veh) {
      setEditVehicle(veh);
      setFormData({
        vehicle_code: veh.vehicle_code || '',
        license_plate: veh.license_plate || '',
        seat_capacity: veh.seat_capacity || 7,
        vehicle_type: veh.vehicle_type || 'Xe 7 chỗ',
        brand_model: veh.brand_model || '',
        image_url: veh.image_url || '',
        imagePreview: veh.image_url || '',
        color: veh.color || 'Trắng',
        status: veh.status || 'AVAILABLE',
        notes: veh.notes || ''
      });
    } else {
      setEditVehicle(null);
      setFormData({
        vehicle_code: '',
        license_plate: '',
        seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ',
        brand_model: '',
        image_url: '',
        imagePreview: '',
        color: 'Trắng',
        status: 'AVAILABLE',
        notes: ''
      });
    }
    setShowAddModal(true);
  };`;

// Use regex or indexOf to replace
if (c.includes('const openAddModal = (veh = null) => {')) {
  // Try exact replace
  if (c.includes(targetStr)) {
    c = c.replace(targetStr, replacementStr);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Successfully patched openAddModal with exact match.");
  } else {
    // Splice line by line
    let lines = c.split('\\n');
    let idx = lines.findIndex(l => l.includes('const openAddModal'));
    if (idx !== -1) {
       // Just insert imagePreview
       lines.splice(idx + 9, 0, "        imagePreview: veh.image_url || '',");
       lines.splice(idx + 22, 0, "        imagePreview: '',");
       fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', lines.join('\\n'));
       console.log("Successfully patched openAddModal with splicing.");
    }
  }
}
