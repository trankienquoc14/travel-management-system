const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

const modalStart = c.indexOf('{showAddModal && (');
const modalEnd = c.indexOf('      {/* Modal Báo Bảo Dưỡng */}');

if (modalStart !== -1 && modalEnd !== -1) {
    const modalTarget = c.substring(modalStart, modalEnd);
    
    const newModal = `{showAddModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, width: '800px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b', fontWeight: '600' }}>
                {editVehicle ? \`Chỉnh sửa thông tin xe (\${editVehicle.license_plate})\` : 'Thêm xe mới'}
              </h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <form id="vehicleForm" onSubmit={handleFormSubmit}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={styles.label}>Mã quản lý xe</label>
                    <input 
                      type="text" 
                      placeholder="VD: XE-7C-01"
                      value={formData.vehicle_code}
                      onChange={(e) => setFormData({ ...formData, vehicle_code: e.target.value })}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Biển số xe *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="VD: 43A-123.45"
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={styles.label}>Số chỗ ngồi *</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.seat_capacity}
                      onChange={(e) => {
                        const seats = parseInt(e.target.value, 10) || 0;
                        setFormData({ 
                          ...formData, 
                          seat_capacity: seats,
                          vehicle_type: \`Xe \${seats} chỗ\` 
                        });
                      }}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Phân loại xe</label>
                    <input 
                      type="text" 
                      placeholder="VD: Xe Limousine"
                      value={formData.vehicle_type}
                      onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={styles.label}>Dòng xe / Đời xe</label>
                    <input 
                      type="text" 
                      placeholder="VD: Toyota Fortuner 2023"
                      value={formData.brand_model}
                      onChange={(e) => setFormData({ ...formData, brand_model: e.target.value })}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Màu xe</label>
                    <input 
                      type="text" 
                      placeholder="VD: Trắng, Đen, Bạc"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={styles.label}>Hình ảnh xe</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <div style={{ width: '160px', height: '100px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formData.imagePreview ? (
                        <img src={getImageUrl(formData.imagePreview)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có ảnh</span>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155', transition: 'all 0.2s' }}>
                        Thay ảnh
                        <input 
                          type="file" 
                          accept="image/*"
                          style={{ display: 'none' }}
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
                        />
                      </label>
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>Định dạng JPG, PNG. Khuyên dùng tỉ lệ 16:9.</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={styles.label}>Ghi chú tình trạng xe</label>
                  <textarea 
                    rows="3"
                    placeholder="Tiện ích xe (Wifi, Tủ lạnh), lốp mới thay, ngày kiểm định..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ ...styles.input, resize: 'vertical' }}
                  ></textarea>
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #e2e8f0', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ ...styles.btnSecondary, padding: '10px 24px' }}>Hủy</button>
              <button type="submit" form="vehicleForm" style={{ ...styles.btnPrimary, padding: '10px 24px' }}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

`;
    c = c.substring(0, modalStart) + newModal + c.substring(modalEnd);
    fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
    console.log("Successfully refined Add/Edit Modal UI.");
} else {
    console.log("Could not find Add Modal boundary.");
}
