const fs = require('fs');

let content = fs.readFileSync('scratch/VehicleFleetManagement_original.jsx', 'utf8');

// 1. Imports
content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect, useRef } from 'react';"
);

// 2. State & Hooks
content = content.replace(
    "notes: ''\n  });",
    "notes: '',\n    imageFile: null,\n    imagePreview: null\n  });\n\n  const fileInputRef = useRef(null);\n"
);
content = content.replace(
    "notes: veh.notes || ''",
    "notes: veh.notes || '',\n        imageFile: null,\n        imagePreview: veh.image_url || null"
);
content = content.replace(
    "notes: ''\n      });\n    }\n    setShowAddModal(true);",
    "notes: '',\n        imageFile: null,\n        imagePreview: null\n      });\n    }\n    setShowAddModal(true);"
);

// 3. handleImageChange
const handleImageChangeCode = `
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Chỉ cho phép định dạng JPG, JPEG, PNG, WEBP');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: previewUrl
      }));
    }
  };
`;
content = content.replace("const handleFormSubmit = async (e) => {", handleImageChangeCode + "\n  const handleFormSubmit = async (e) => {");

// 4. handleFormSubmit formData
const newSubmitCode = `const handleFormSubmit = async (e) => {
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
  };`;
content = content.replace(/const handleFormSubmit = async \(e\) => \{[\s\S]*?fetchVehicles\(\);\n    \} catch \(err\) \{\n      alert.*?;\n    \}\n  \};/, newSubmitCode);

// 5. Remove Emojis & UI fixes
content = content.replace('🚌 Quản Lý Đội Xe & Phân Loại Phương Tiện', 'Quản lý Đội Xe & Phân loại Phương tiện');
content = content.replace('🔄 Tải lại dữ liệu', 'Tải lại dữ liệu');
content = content.replace('➕ Thêm Phương Tiện Mới', 'Thêm phương tiện mới');
content = content.replace('🔍 Tìm Mã xe / Biển số / Dòng xe:', 'Tìm kiếm Mã xe / Biển số / Dòng xe:');
content = content.replace('🚌 Phân loại loại xe:', 'Phân loại xe:');
content = content.replace('🚦 Trạng thái vận hành:', 'Trạng thái vận hành:');
content = content.replace('🧹 Xóa bộ lọc', 'Xóa bộ lọc');
content = content.replace('🟢 Sẵn sàng hoạt động', 'Sẵn sàng hoạt động');
content = content.replace('🟡 Đang phục vụ Tour', 'Đang phục vụ Tour');
content = content.replace('🔴 Đang bảo dưỡng / Sửa chữa', 'Đang bảo dưỡng / Sửa chữa');

content = content.replace('🚌 {catName.toUpperCase()}', '{catName.toUpperCase()}');
content = content.replace('🟢 Sẵn sàng:', 'Sẵn sàng:');
content = content.replace('🔴 Bảo dưỡng:', 'Bảo dưỡng:');
content = content.replace('📦 Tổng:', 'Tổng:');

content = content.replace('isMaint ? \'🔴 Bảo dưỡng\' : isTour ? \'🟡 Đang đi Tour\' : \'🟢 Sẵn sàng\'', 'isMaint ? \'Bảo dưỡng\' : isTour ? \'Đang đi Tour\' : \'Sẵn sàng\'');
content = content.replace('🚘 Biển số:', 'Biển số:');
content = content.replace('🏎️ Dòng/Đời xe:', 'Dòng/Đời xe:');
content = content.replace('🎨 Màu xe & Số chỗ:', 'Màu xe & Số chỗ:');
content = content.replace('🛠️ Bảo dưỡng:', 'Bảo dưỡng:');
content = content.replace('🗺️ Đang đi Tour:', 'Đang đi Tour:');
content = content.replace('📝 {v.notes}', '{v.notes}');
content = content.replace('✏️ Sửa', 'Sửa');
content = content.replace('🛠️ Bảo dưỡng', 'Bảo dưỡng');
content = content.replace('🗑️ Xóa', 'Xóa');
content = content.replace('✏️ Chỉnh Sửa Thông Tin Xe', 'Chỉnh sửa thông tin xe');
content = content.replace('➕ Thêm Xe Mới Vào Đội Xe', 'Thêm xe mới');
content = content.replace('💾 Lưu Xe', 'Lưu thay đổi');
content = content.replace('🛠️ Đưa Xe', 'Đưa Xe');
content = content.replace('🛠️ Xác Nhận Bảo Dưỡng', 'Xác nhận bảo dưỡng');
content = content.replace('📌 Mã:', 'Mã:');

// 6. Style fixes
content = content.replace(/btnPrimary: \{ backgroundColor: '#2563eb'/g, "btnPrimary: { backgroundColor: '#0194f3'");
content = content.replace(/card: \{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba\(0,0,0,0\.05\)'/g, "card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'");
content = content.replace(/fontWeight: '800'/g, "fontWeight: '700'");
content = content.replace(/fontWeight: '700'/g, "fontWeight: '600'");

// 7. Modal Image Upload field
const imageUploadCode = `
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Hình ảnh phương tiện</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '120px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>Không có ảnh</div>
                    )}
                  </div>
                  <div>
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png, image/webp"
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                    <button type="button" onClick={() => fileInputRef.current.click()} style={{ ...styles.btnSecondary, padding: '6px 12px', fontSize: '13px' }}>
                      Thay đổi hình ảnh
                    </button>
                    {formData.imageFile && (
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#166534' }}>Đã chọn ảnh mới</div>
                    )}
                  </div>
                </div>
              </div>
`;

content = content.replace(
    /<div style={{ marginBottom: '12px' }}>\s*<label style={styles.label}>Link Hình ảnh xe \(URL\)<\/label>\s*<input\s*type="text"\s*placeholder="https:\/\/images.unsplash.com\/..."\s*value=\{formData.image_url\}\s*onChange=\{\(e\) => setFormData\(\{ ...formData, image_url: e.target.value \}\)\}\s*style=\{styles.input\}\s*\/>\s*<\/div>/,
    imageUploadCode
);


fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', content);
console.log("Done");
