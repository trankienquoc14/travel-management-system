const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

// 1. Inject getImageUrl
const helper = `
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('/')) return \`\${GATEWAY_URL}\${url}\`;
    return url;
  };

`;
if (!c.includes('const getImageUrl')) {
    c = c.replace('  useEffect(() => {', helper + '  useEffect(() => {');
}
c = c.replace('src={v.image_url || fallbackImg}', 'src={getImageUrl(v.image_url) || fallbackImg}');
c = c.replace('src={formData.imagePreview}', 'src={getImageUrl(formData.imagePreview)}');

// 2. Fix handleFormSubmit
const startForm = c.indexOf('const handleFormSubmit = async (e) => {');
const endForm = c.indexOf('const handleMaintSubmit = async (e) => {');
if (startForm !== -1 && endForm !== -1) {
    const targetStr = c.substring(startForm, endForm);
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
}

// 3. Remove emojis and fix button
c = c.replace(/✏️ Sửa/g, 'Sửa');
c = c.replace(/🗑️ Xóa/g, 'Xóa');

const btnRegex = /onClick=\{\(\) => \{ setSelectedVehicle\(v\); setShowMaintModal\(true\); \}\}\s*style=\{\{ \.\.\.styles\.btnSmall, backgroundColor: '#f59e0b', color: '#fff' \}\}\s*>\s*🛠️ Bảo dưỡng/g;
c = c.replace(btnRegex, `onClick={() => { setSelectedVehicle(v); fetchHistory(v.vehicle_id); setShowMaintModal(true); }}
                            style={{ ...styles.btnSmall, backgroundColor: '#64748b', color: '#fff' }}
                          >
                            Xem tình trạng`);

// 4. Inject history state
const stateRegex = /const \[maintData, setMaintData\] = useState\(\{ start_date: '', end_date: '', reason: '' \}\);/;
const stateInject = `const [maintData, setMaintData] = useState({ start_date: '', end_date: '', reason: '' });
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async (vid) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(\`\${GATEWAY_URL}/api/tours/fleet/staff/vehicles/\${vid}/history\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.data && res.data.success) {
        setVehicleHistory(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };`;
c = c.replace(stateRegex, stateInject);

// 5. Replace MaintModal
const modalStartStr = '{showMaintModal && selectedVehicle && (';
const modalStart = c.lastIndexOf(modalStartStr); // Use lastIndexOf to safely find the modal at the bottom
const modalEndStr = '</div>\n  );\n};';
const modalEnd = c.lastIndexOf(modalEndStr);

if (modalStart !== -1 && modalEnd !== -1) {
    const newModal = `{showMaintModal && selectedVehicle && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, width: '600px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ marginTop: 0, fontSize: '18px', margin: 0 }}>
                Tình trạng phương tiện: <span style={{ color: '#2563eb' }}>{selectedVehicle.license_plate}</span>
              </h2>
              <button type="button" onClick={() => setShowMaintModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '16px', display: 'flex', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Trạng thái kỹ thuật</label>
                <div style={{ marginTop: '4px', fontSize: '15px', fontWeight: 'bold', color: selectedVehicle.status === 'AVAILABLE' ? '#166534' : selectedVehicle.status === 'MAINTENANCE' ? '#9a3412' : selectedVehicle.status === 'REPAIR' ? '#991b1b' : '#475569' }}>
                  {selectedVehicle.status === 'AVAILABLE' ? 'Sẵn sàng' : selectedVehicle.status === 'MAINTENANCE' ? 'Đang bảo dưỡng' : selectedVehicle.status === 'REPAIR' ? 'Đang sửa chữa' : 'Tạm ngưng'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Trạng thái vận hành</label>
                <div style={{ marginTop: '4px', fontSize: '15px', fontWeight: 'bold', color: selectedVehicle.current_tour ? '#854d0e' : '#334155' }}>
                  {selectedVehicle.current_tour ? 'Đang đi tour' : 'Không có lịch chạy'}
                </div>
              </div>
            </div>

            {selectedVehicle.current_maintenance && (
              <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                <strong style={{ color: '#991b1b', fontSize: '14px' }}>Thông tin Bảo dưỡng / Sửa chữa:</strong>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px' }}>
                  Lý do: {selectedVehicle.current_maintenance.reason}<br/>
                  Thời gian: {selectedVehicle.current_maintenance.start_date} ➔ {selectedVehicle.current_maintenance.end_date}
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '15px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>Lịch sử cập nhật trạng thái</h3>
              {loadingHistory ? (
                <div style={{ fontSize: '13px', color: '#64748b' }}>Đang tải lịch sử...</div>
              ) : vehicleHistory.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Ngày</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Trạng thái</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Người C.Nhật</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Lý do</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleHistory.map((h, i) => (
                        <tr key={i}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{new Date(h.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold' }}>
                            {h.new_status === 'AVAILABLE' ? 'Sẵn sàng' : h.new_status === 'MAINTENANCE' ? 'Bảo dưỡng' : h.new_status === 'REPAIR' ? 'Sửa chữa' : 'Tạm ngưng'}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{h.user_name || 'Hệ thống'}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{h.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#64748b' }}>Chưa có lịch sử trạng thái cho xe này.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowMaintModal(false)} style={{ ...styles.btnPrimary }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    `;
    c = c.substring(0, modalStart) + newModal + c.substring(modalEnd);
}

fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
console.log("All patches applied safely and successfully!");
