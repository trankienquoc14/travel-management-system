const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const oldOpenModal = `  const openAddModal = (veh = null) => {
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
        vehicle_code: '', license_plate: '', seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ', brand_model: '', image_url: '',
        color: 'Trắng', status: 'AVAILABLE', notes: ''
      });
    }
    setShowAddModal(true);
  };`;

const newOpenModal = `  const openAddModal = (veh = null) => {
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
        vehicle_code: '', license_plate: '', seat_capacity: 7,
        vehicle_type: 'Xe 7 chỗ', brand_model: '', image_url: '', imagePreview: '',
        color: 'Trắng', status: 'AVAILABLE', notes: ''
      });
    }
    setShowAddModal(true);
  };`;

if (c.includes('const openAddModal = (veh = null) => {')) {
    c = c.replace(oldOpenModal, newOpenModal);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Successfully updated openAddModal with imagePreview.");
} else {
    console.log("Could not find openAddModal block");
}
