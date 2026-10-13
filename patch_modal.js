const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/StaffVehicleManagement.jsx', 'utf8');

const start = c.indexOf('{/* Modal Cập Nhật Trạng Thái */}');
const end = c.indexOf('</div>\n  );\n};');
const target = c.substring(start, end);

const replacement = `{/* Modal Cập Nhật Trạng Thái */}
      {showStatusModal && selectedVehicle && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '700' }}>
                Cập nhật trạng thái xe: <span style={{ color: '#0194f3' }}>{selectedVehicle.license_plate}</span>
              </h2>
              <button type="button" onClick={() => setShowStatusModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handleStatusSubmit}>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.label}>Trạng thái hiện tại:</span>
                <span style={styles.badge(selectedVehicle.status)}>
                  {selectedVehicle.status === 'AVAILABLE' ? 'Sẵn sàng' : selectedVehicle.status === 'MAINTENANCE' ? 'Đang bảo dưỡng' : selectedVehicle.status === 'REPAIR' ? 'Đang sửa chữa' : 'Tạm ngưng'}
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>Trạng thái mới</label>
                <select 
                  style={{...styles.input, backgroundColor: '#f8fafc', cursor: 'pointer', outline: 'none', height: '42px'}} 
                  value={statusData.new_status}
                  onChange={(e) => setStatusData({ ...statusData, new_status: e.target.value })}
                  required
                >
                  <option value="AVAILABLE">Sẵn sàng</option>
                  <option value="MAINTENANCE">Đang bảo dưỡng</option>
                  <option value="REPAIR">Đang sửa chữa</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>
              </div>

              {(statusData.new_status === 'MAINTENANCE' || statusData.new_status === 'REPAIR') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={styles.label}>Ngày bắt đầu</label>
                    <input 
                      type="date" 
                      required
                      value={statusData.start_date}
                      onChange={(e) => setStatusData({ ...statusData, start_date: e.target.value })}
                      style={{...styles.input, outline: 'none', height: '42px'}}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Dự kiến hoàn thành</label>
                    <input 
                      type="date" 
                      required
                      value={statusData.end_date}
                      onChange={(e) => setStatusData({ ...statusData, end_date: e.target.value })}
                      style={{...styles.input, outline: 'none', height: '42px'}}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '28px' }}>
                <label style={styles.label}>
                  {statusData.new_status === 'AVAILABLE' ? 'Lý do hoàn tất / Ghi chú (Nếu có)' : 'Lý do / Ghi chú (Bắt buộc)'}
                </label>
                <textarea 
                  rows="3"
                  required={statusData.new_status !== 'AVAILABLE'}
                  placeholder={statusData.new_status === 'AVAILABLE' ? "VD: Đã hoàn thành sửa chữa..." : "Ghi chú chi tiết bảo dưỡng/sửa chữa..."}
                  value={statusData.reason}
                  onChange={(e) => setStatusData({ ...statusData, reason: e.target.value })}
                  style={{...styles.input, outline: 'none', resize: 'vertical', minHeight: '80px', padding: '12px'}}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => setShowStatusModal(false)} style={{...styles.btnSecondary, padding: '10px 24px'}}>Hủy</button>
                <button type="submit" style={{...styles.btnPrimary, padding: '10px 24px', boxShadow: '0 4px 6px -1px rgba(1, 148, 243, 0.2)'}}>Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    `;

c = c.replace(target, replacement);

fs.writeFileSync('frontend/src/components/StaffVehicleManagement.jsx', c);
console.log("Modal UI updated successfully.");
