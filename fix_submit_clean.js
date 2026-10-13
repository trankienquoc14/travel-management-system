const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const start = c.indexOf('const handleFormSubmit = async (e) => {');
const end = c.indexOf('const handleMaintSubmit = async (e) => {');
if (start !== -1 && end !== -1) {
    const targetStr = c.substring(start, end);

    const replacement = `const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { 
        headers: { 
          Authorization: \`Bearer \${token}\`,
          'Content-Type': 'multipart/form-data'
        } 
      };

      const fd = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'imageFile' && key !== 'imagePreview') {
          if (formData[key] !== null && formData[key] !== undefined) {
             fd.append(key, formData[key]);
          }
        }
      });

      if (formData.imageFile) {
        fd.append('image', formData.imageFile);
      }

      if (editVehicle) {
        await axios.put(\`\${GATEWAY_URL}/api/tours/fleet/vehicles/\${editVehicle.vehicle_id}\`, fd, config);
        setAlertMsg({ type: 'success', text: \`Đã cập nhật xe \${formData.license_plate} thành công!\` });
      } else {
        await axios.post(\`\${GATEWAY_URL}/api/tours/fleet/vehicles\`, fd, config);
        setAlertMsg({ type: 'success', text: \`Đã thêm phương tiện \${formData.license_plate} vào đội xe!\` });
      }

      setShowAddModal(false);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi lưu thông tin xe');
    }
  };

  `;

    c = c.replace(targetStr, replacement);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Replaced handleFormSubmit successfully.");
} else {
    console.log("Could not find start or end index.");
}
