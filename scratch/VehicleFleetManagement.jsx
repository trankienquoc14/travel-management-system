import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const VehicleFleetManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Filter & Search States
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    vehicle_code: '',
    license_plate: '',
    seat_capacity: 7,
    vehicle_type: 'Xe 7 chỗ',
    brand_model: '',
    image_url: '',
    color: 'Trắng',
    status: 'AVAILABLE',
    notes: '',
    imageFile: null,
    imagePreview: null
  });

  const [maintData, setMaintData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
    reason: 'Bảo dưỡng định kỳ / Thay dầu / Đăng kiểm'
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/tours/fleet/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setVehicles(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách đội xe:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải dữ liệu đội xe.' });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (veh = null) => {
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
        notes: veh.notes || '',
        imageFile: null,
        imagePreview: veh.image_url || null
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
        notes: '',
        imageFile: null,
        imagePreview: null
      });
    }
    setShowAddModal(true);
  };

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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
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
        await axios.put(`${GATEWAY_URL}/api/tours/fleet/vehicles/${editVehicle.vehicle_id}`, fd, config);
        setAlertMsg({ type: 'success', text: `Đã cập nhật xe ${formData.license_plate} thành công!` });
      } else {
        await axios.post(`${GATEWAY_URL}/api/tours/fleet/vehicles`, fd, config);
        setAlertMsg({ type: 'success', text: `Đã thêm phương tiện ${formData.license_plate} vào đội xe!` });
      }

      setShowAddModal(false);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi lưu thông tin xe');
    }
  };

  const handleMaintSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${GATEWAY_URL}/api/tours/fleet/maintenance`, {
        vehicle_id: selectedVehicle.vehicle_id,
        ...maintData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setAlertMsg({ type: 'success', text: `Đã chuyển xe ${selectedVehicle.license_plate} sang chế độ bảo dưỡng!` });
        setShowMaintModal(false);
        fetchVehicles();
      } else {
        alert(res.data?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tạo lịch bảo dưỡng');
    }
  };

  const handleDelete = async (vehicleId, plate) => {
    if (!window.confirm(`Bạn có chắc muốn xóa xe ${plate} khỏi hệ thống?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${GATEWAY_URL}/api/tours/fleet/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMsg({ type: 'success', text: `Đã xóa xe ${plate} khỏi hệ thống.` });
      fetchVehicles();
    } catch (err) {
      alert('Không thể xóa xe này.');
    }
  };

  // Extract unique categories
  const categoriesList = Array.from(new Set(vehicles.map(v => v.vehicle_type || `Xe ${v.seat_capacity} chỗ`))).sort();

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    if (selectedCategory !== 'ALL' && (v.vehicle_type || `Xe ${v.seat_capacity} chỗ`) !== selectedCategory) {
      return false;
    }
    if (selectedStatus === 'AVAILABLE' && v.status !== 'AVAILABLE') return false;
    if (selectedStatus === 'IN_TOUR' && (v.status !== 'IN_TOUR' && !v.current_tour)) return false;
    if (selectedStatus === 'MAINTENANCE' && (v.status !== 'MAINTENANCE' && !v.current_maintenance)) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const codeMatch = (v.vehicle_code || '').toLowerCase().includes(q);
      const plateMatch = (v.license_plate || '').toLowerCase().includes(q);
      const modelMatch = (v.brand_model || '').toLowerCase().includes(q);
      if (!codeMatch && !plateMatch && !modelMatch) return false;
    }
    return true;
  });

  const getStatusBadge = (v) => {
    const isMaint = v.status === 'MAINTENANCE' || v.current_maintenance;
    const isTour = v.status === 'IN_TOUR' || v.current_tour;
    if (isMaint) return <span style={{ ...styles.badge, backgroundColor: '#fee2e2', color: '#991b1b' }}>Bảo dưỡng</span>;
    if (isTour) return <span style={{ ...styles.badge, backgroundColor: '#fef9c3', color: '#854d0e' }}>Đang đi tour</span>;
    return <span style={{ ...styles.badge, backgroundColor: '#dcfce7', color: '#166534' }}>Sẵn sàng</span>;
  };

  const getStatusText = (v) => {
    if (v.current_maintenance) return v.current_maintenance.reason;
    if (v.current_tour) return `Tour: ${v.current_tour.tour_name}`;
    return v.status === 'AVAILABLE' ? 'Không có lịch trình' : v.status;
  };

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const maintVehicles = vehicles.filter(v => v.status === 'MAINTENANCE' || v.current_maintenance).length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header & Stats */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>Quản lý phương tiện</h1>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Tổng số xe</div>
            <div style={styles.statValue}>{totalVehicles}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Sẵn sàng</div>
            <div style={{ ...styles.statValue, color: '#166534' }}>{availableVehicles}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Bảo dưỡng</div>
            <div style={{ ...styles.statValue, color: '#991b1b' }}>{maintVehicles}</div>
          </div>
        </div>
      </div>

      {alertMsg.text && (
        <div style={{ padding: '12px 16px', backgroundColor: alertMsg.type === 'error' ? '#fee2e2' : '#dcfce7', color: alertMsg.type === 'error' ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {alertMsg.text}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={styles.label}>Tìm kiếm phương tiện</label>
          <input 
            type="text" 
            placeholder="Mã xe, biển số, dòng xe..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={{ width: '180px' }}>
          <label style={styles.label}>Loại xe</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={styles.input}>
            <option value="ALL">Tất cả loại xe</option>
            {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div style={{ width: '180px' }}>
          <label style={styles.label}>Trạng thái</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={styles.input}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Sẵn sàng</option>
            <option value="IN_TOUR">Đang đi tour</option>
            <option value="MAINTENANCE">Bảo dưỡng</option>
          </select>
        </div>
        {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
          <button onClick={() => { setSelectedCategory('ALL'); setSelectedStatus('ALL'); setSearchTerm(''); }} style={styles.btnSecondary}>
            Xóa bộ lọc
          </button>
        )}
        <div style={{ marginLeft: 'auto' }}>
           <button onClick={() => openAddModal(null)} style={styles.btnPrimary}>+ Thêm phương tiện</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</div>
        ) : filteredVehicles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy phương tiện phù hợp.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={styles.th}>Hình ảnh</th>
                  <th style={styles.th}>Mã xe</th>
                  <th style={styles.th}>Biển số</th>
                  <th style={styles.th}>Loại xe</th>
                  <th style={styles.th}>Dòng xe</th>
                  <th style={styles.th}>Số chỗ</th>
                  <th style={styles.th}>Trạng thái</th>
                  <th style={styles.th}>Hoạt động / Ghi chú</th>
                  <th style={styles.th}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(v => (
                  <tr key={v.vehicle_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={styles.td}>
                      <div style={{ width: '56px', height: '40px', borderRadius: '4px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                        <img 
                          src={v.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&q=80'} 
                          alt={v.license_plate}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=120&q=80'; }}
                        />
                      </div>
                    </td>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{v.vehicle_code || `XE-${v.vehicle_id}`}</td>
                    <td style={{ ...styles.td, color: '#0194f3', fontWeight: '600' }}>{v.license_plate}</td>
                    <td style={styles.td}>{v.vehicle_type}</td>
                    <td style={styles.td}>{v.brand_model || '-'}</td>
                    <td style={styles.td}>{v.seat_capacity}</td>
                    <td style={styles.td}>{getStatusBadge(v)}</td>
                    <td style={{ ...styles.td, color: '#64748b', fontSize: '13px' }}>{getStatusText(v)}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openAddModal(v)} style={styles.btnAction}>Sửa</button>
                        <button onClick={() => { setSelectedVehicle(v); setShowMaintModal(true); }} style={styles.btnAction}>Bảo dưỡng</button>
                        <button onClick={() => handleDelete(v.vehicle_id, v.license_plate)} style={{ ...styles.btnAction, color: '#ef4444' }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {showAddModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '700px' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px', marginBottom: '20px', color: '#0f172a' }}>
              {editVehicle ? `Sửa thông tin phương tiện: ${editVehicle.license_plate}` : 'Thêm phương tiện mới'}
            </h2>
            <form onSubmit={handleFormSubmit}>
              
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {/* Left col: Image */}
                <div style={{ width: '220px' }}>
                  <label style={styles.label}>Hình ảnh phương tiện</label>
                  <div style={{ width: '100%', height: '140px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có ảnh</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                  <button type="button" onClick={() => fileInputRef.current.click()} style={{ ...styles.btnSecondary, width: '100%' }}>
                    Thay đổi hình ảnh
                  </button>
                  {formData.imageFile && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#166534', textAlign: 'center' }}>
                      Đã chọn ảnh mới
                    </div>
                  )}
                </div>

                {/* Right col: Form details */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={styles.label}>Mã quản lý xe</label>
                      <input type="text" placeholder="Để trống tự tạo" value={formData.vehicle_code} onChange={e => setFormData({...formData, vehicle_code: e.target.value})} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.label}>Biển số xe *</label>
                      <input type="text" required value={formData.license_plate} onChange={e => setFormData({...formData, license_plate: e.target.value})} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.label}>Số chỗ ngồi *</label>
                      <input type="number" required value={formData.seat_capacity} onChange={e => {
                        const seats = parseInt(e.target.value, 10);
                        setFormData({ ...formData, seat_capacity: seats, vehicle_type: `Xe ${seats} chỗ` });
                      }} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.label}>Phân loại xe</label>
                      <input type="text" value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.label}>Dòng xe / Đời xe</label>
                      <input type="text" placeholder="VD: Ford Transit" value={formData.brand_model} onChange={e => setFormData({...formData, brand_model: e.target.value})} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.label}>Màu xe</label>
                      <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} style={styles.input} />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={styles.label}>Ghi chú tình trạng</label>
                    <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ ...styles.input, resize: 'vertical' }}></textarea>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={styles.btnSecondary}>Hủy</button>
                <button type="submit" style={styles.btnPrimary}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Maint */}
      {showMaintModal && selectedVehicle && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h2 style={{ marginTop: 0, fontSize: '18px', marginBottom: '20px' }}>Bảo dưỡng: {selectedVehicle.license_plate}</h2>
            <form onSubmit={handleMaintSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Từ ngày</label>
                <input type="date" required value={maintData.start_date} onChange={e => setMaintData({...maintData, start_date: e.target.value})} style={styles.input} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Đến ngày (dự kiến)</label>
                <input type="date" required value={maintData.end_date} onChange={e => setMaintData({...maintData, end_date: e.target.value})} style={styles.input} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={styles.label}>Lý do</label>
                <input type="text" required value={maintData.reason} onChange={e => setMaintData({...maintData, reason: e.target.value})} style={styles.input} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowMaintModal(false)} style={styles.btnSecondary}>Hủy</button>
                <button type="submit" style={styles.btnPrimary}>Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  btnPrimary: { backgroundColor: '#0194f3', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' },
  btnSecondary: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#334155', fontSize: '14px' },
  btnAction: { backgroundColor: 'transparent', border: 'none', color: '#0194f3', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: 0 },
  badge: { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', display: 'inline-block' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  statBox: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', minWidth: '140px' },
  statLabel: { fontSize: '13px', color: '#64748b', marginBottom: '8px' },
  statValue: { fontSize: '24px', fontWeight: '600', color: '#0f172a' },
  th: { padding: '12px 16px', color: '#475569', fontWeight: '600' },
  td: { padding: '12px 16px', color: '#1e293b' }
};

export default VehicleFleetManagement;
