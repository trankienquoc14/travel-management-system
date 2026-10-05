import React, { useState, useEffect } from 'react';
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
    notes: ''
  });

  const [maintData, setMaintData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
    reason: 'Bảo dưỡng định kỳ / Thay dầu / Đăng kiểm'
  });

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
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editVehicle) {
        await axios.put(`${GATEWAY_URL}/api/tours/fleet/vehicles/${editVehicle.vehicle_id}`, formData, config);
        setAlertMsg({ type: 'success', text: `Đã cập nhật xe ${formData.license_plate} thành công!` });
      } else {
        await axios.post(`${GATEWAY_URL}/api/tours/fleet/vehicles`, formData, config);
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
    if (!window.confirm(`Bạn có chắc muốn xóa xe ${plate} khỏi Đội xe?`)) return;
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

  // Trích xuất danh mục các loại xe độc nhất
  const categoriesList = Array.from(new Set(vehicles.map(v => v.vehicle_type || `Xe ${v.seat_capacity} chỗ`))).sort();

  // Filter vehicles logic
  const filteredVehicles = vehicles.filter(v => {
    // Filter Category
    if (selectedCategory !== 'ALL' && (v.vehicle_type || `Xe ${v.seat_capacity} chỗ`) !== selectedCategory) {
      return false;
    }
    // Filter Status
    if (selectedStatus === 'AVAILABLE' && v.status !== 'AVAILABLE') return false;
    if (selectedStatus === 'IN_TOUR' && (v.status !== 'IN_TOUR' && !v.current_tour)) return false;
    if (selectedStatus === 'MAINTENANCE' && (v.status !== 'MAINTENANCE' && !v.current_maintenance)) return false;

    // Search term (Code, License Plate, Model)
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const codeMatch = (v.vehicle_code || '').toLowerCase().includes(q);
      const plateMatch = (v.license_plate || '').toLowerCase().includes(q);
      const modelMatch = (v.brand_model || '').toLowerCase().includes(q);
      if (!codeMatch && !plateMatch && !modelMatch) return false;
    }

    return true;
  });

  // Group vehicles by Category
  const groupedVehicles = {};
  filteredVehicles.forEach(v => {
    const cat = v.vehicle_type || `Xe ${v.seat_capacity} chỗ`;
    if (!groupedVehicles[cat]) groupedVehicles[cat] = [];
    groupedVehicles[cat].push(v);
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🚌 Quản Lý Đội Xe & Phân Loại Phương Tiện
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Phân loại theo dòng xe, quản lý chi tiết mã xe, biển số, hình ảnh và kiểm soát lịch bảo dưỡng.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchVehicles} style={styles.btnSecondary}>🔄 Tải lại dữ liệu</button>
          <button onClick={() => openAddModal(null)} style={styles.btnPrimary}>➕ Thêm Phương Tiện Mới</button>
        </div>
      </div>

      {alertMsg.text && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: alertMsg.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: alertMsg.type === 'error' ? '#991b1b' : '#166534',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          {alertMsg.text}
        </div>
      )}

      {/* Thanh Bộ Lọc & Tìm Kiếm */}
      <div style={{ backgroundColor: '#fff', padding: '18px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
          
          {/* Ô Tìm Kiếm */}
          <div>
            <label style={styles.label}>🔍 Tìm Mã xe / Biển số / Dòng xe:</label>
            <input 
              type="text" 
              placeholder="VD: XE-7C-01, 43A-123.45, Fortuner..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Lọc Theo Loại Xe */}
          <div>
            <label style={styles.label}>🚌 Phân loại loại xe:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.select}
            >
              <option value="ALL">-- Tất cả loại xe ({vehicles.length}) --</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat} ({vehicles.filter(v => (v.vehicle_type || `Xe ${v.seat_capacity} chỗ`) === cat).length} xe)</option>
              ))}
            </select>
          </div>

          {/* Lọc Theo Trạng Thái */}
          <div>
            <label style={styles.label}>🚦 Trạng thái vận hành:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={styles.select}
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="AVAILABLE">🟢 Sẵn sàng hoạt động ({vehicles.filter(v => v.status === 'AVAILABLE').length})</option>
              <option value="IN_TOUR">🟡 Đang phục vụ Tour ({vehicles.filter(v => v.status === 'IN_TOUR' || v.current_tour).length})</option>
              <option value="MAINTENANCE">🔴 Đang bảo dưỡng / Sửa chữa ({vehicles.filter(v => v.status === 'MAINTENANCE' || v.current_maintenance).length})</option>
            </select>
          </div>

          {/* Reset button */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
            <button 
              onClick={() => { setSelectedCategory('ALL'); setSelectedStatus('ALL'); setSearchTerm(''); }}
              style={{ ...styles.btnSecondary, width: '100%', padding: '10px' }}
            >
              🧹 Xóa bộ lọc
            </button>
          </div>

        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>⏳ Đang tải thông tin đội xe...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {Object.keys(groupedVehicles).map(catName => {
            const listInCat = groupedVehicles[catName];
            return (
              <div key={catName} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                
                {/* Tiêu Đề Loại Xe */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🚌 {catName.toUpperCase()}
                  </h2>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: '700' }}>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px' }}>
                      🟢 Sẵn sàng: {listInCat.filter(v => v.status === 'AVAILABLE').length}
                    </span>
                    <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '12px' }}>
                      🔴 Bảo dưỡng: {listInCat.filter(v => v.status === 'MAINTENANCE' || v.current_maintenance).length}
                    </span>
                    <span style={{ background: '#eff6ff', color: '#1e40af', padding: '4px 10px', borderRadius: '12px' }}>
                      📦 Tổng: {listInCat.length} xe
                    </span>
                  </div>
                </div>

                {/* Danh Sách Các Xe Nhỏ Thuộc Loại Xe Này */}
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                  {listInCat.map(v => {
                    const isMaint = v.status === 'MAINTENANCE' || v.current_maintenance;
                    const isTour = v.status === 'IN_TOUR' || v.current_tour;
                    const fallbackImg = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';

                    return (
                      <div key={v.vehicle_id} style={styles.card}>
                        
                        {/* Hình Ảnh Xe & Mã Xe */}
                        <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', backgroundColor: '#e2e8f0' }}>
                          <img 
                            src={v.image_url || fallbackImg} 
                            alt={v.license_plate}
                            onError={(e) => { e.target.src = fallbackImg; }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#0f172a', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', opacity: 0.9 }}>
                            📌 Mã: {v.vehicle_code || `XE-${v.vehicle_id}`}
                          </span>
                          <span style={{ position: 'absolute', top: '8px', right: '8px' }}>
                            <span style={styles.badge(v.status)}>
                              {isMaint ? '🔴 Bảo dưỡng' : isTour ? '🟡 Đang đi Tour' : '🟢 Sẵn sàng'}
                            </span>
                          </span>
                        </div>

                        {/* Thông Tin Xe */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                              🚘 Biển số: <span style={{ color: '#2563eb' }}>{v.license_plate}</span>
                            </div>
                          </div>

                          <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                              <span style={{ color: '#64748b' }}>🏎️ Dòng/Đời xe:</span>
                              <strong>{v.brand_model || 'Chưa cập nhật'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                              <span style={{ color: '#64748b' }}>🎨 Màu xe & Số chỗ:</span>
                              <strong>{v.color || 'Trắng'} - <span style={{ color: '#0284c7' }}>{v.seat_capacity} chỗ</span></strong>
                            </div>
                          </div>

                          {v.current_maintenance && (
                            <div style={{ margin: '8px 0', padding: '8px', background: '#fef2f2', borderRadius: '6px', fontSize: '11px', color: '#991b1b', borderLeft: '3px solid #ef4444' }}>
                              <strong>🛠️ Bảo dưỡng:</strong> {v.current_maintenance.reason} ({v.current_maintenance.start_date} ➔ {v.current_maintenance.end_date})
                            </div>
                          )}

                          {v.current_tour && (
                            <div style={{ margin: '8px 0', padding: '8px', background: '#fefce8', borderRadius: '6px', fontSize: '11px', color: '#854d0e', borderLeft: '3px solid #f59e0b' }}>
                              <strong>🗺️ Đang đi Tour:</strong> {v.current_tour.tour_name} ({v.current_tour.driver_name || 'Tài xế'})
                            </div>
                          )}

                          {v.notes && (
                            <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                              📝 {v.notes}
                            </div>
                          )}
                        </div>

                        {/* Footer nút hành động */}
                        <div style={styles.cardFooter}>
                          <button 
                            onClick={() => openAddModal(v)}
                            style={{ ...styles.btnSmall, backgroundColor: '#3b82f6', color: '#fff' }}
                          >
                            ✏️ Sửa
                          </button>
                          <button 
                            onClick={() => { setSelectedVehicle(v); setShowMaintModal(true); }}
                            style={{ ...styles.btnSmall, backgroundColor: '#f59e0b', color: '#fff' }}
                          >
                            🛠️ Bảo dưỡng
                          </button>
                          <button 
                            onClick={() => handleDelete(v.vehicle_id, v.license_plate)}
                            style={{ ...styles.btnSmall, backgroundColor: '#ef4444', color: '#fff' }}
                          >
                            🗑️ Xóa
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}

          {filteredVehicles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#475569' }}>Không tìm thấy phương tiện nào phù hợp bộ lọc.</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Thử thay đổi từ khóa tìm kiếm hoặc bấm "Xóa bộ lọc".</div>
            </div>
          )}

        </div>
      )}

      {/* Modal Thêm / Chỉnh Sửa Xe */}
      {showAddModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h2 style={{ marginTop: 0, fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              {editVehicle ? `✏️ Chỉnh Sửa Thông Tin Xe (${editVehicle.license_plate})` : '➕ Thêm Xe Mới Vào Đội Xe'}
            </h2>
            <form onSubmit={handleFormSubmit}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={styles.label}>Mã quản lý xe</label>
                  <input 
                    type="text" 
                    placeholder="VD: XE-7C-01"
                    value={formData.vehicle_code}
                    onChange={(e) => setFormData({ ...formData, vehicle_code: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Biển số xe * (VD: 43A-123.45)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="43A-123.45"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={styles.label}>Số chỗ ngồi *</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.seat_capacity}
                    onChange={(e) => {
                      const seats = parseInt(e.target.value, 10);
                      setFormData({ 
                        ...formData, 
                        seat_capacity: seats,
                        vehicle_type: `Xe ${seats} chỗ` 
                      });
                    }}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Phân loại loại xe</label>
                  <input 
                    type="text" 
                    placeholder="VD: Xe 7 chỗ, Xe 16 chỗ..."
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={styles.label}>Dòng xe / Đời xe</label>
                  <input 
                    type="text" 
                    placeholder="VD: Toyota Fortuner 2023"
                    value={formData.brand_model}
                    onChange={(e) => setFormData({ ...formData, brand_model: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Màu xe</label>
                  <input 
                    type="text" 
                    placeholder="VD: Trắng, Đen, Bạc"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Link Hình ảnh xe (URL)</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Ghi chú tình trạng xe</label>
                <textarea 
                  rows="3"
                  placeholder="Tiện ích xe (Wifi, Tủ lạnh), lốp mới thay, ngày kiểm định..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={styles.input}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={styles.btnSecondary}>Hủy</button>
                <button type="submit" style={styles.btnPrimary}>💾 Lưu Xe</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Báo Bảo Dưỡng */}
      {showMaintModal && selectedVehicle && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h2 style={{ marginTop: 0, fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              🛠️ Đưa Xe <span style={{ color: '#2563eb' }}>{selectedVehicle.license_plate}</span> Vào Bảo Dưỡng
            </h2>
            <form onSubmit={handleMaintSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Từ ngày</label>
                <input 
                  type="date" 
                  required
                  value={maintData.start_date}
                  onChange={(e) => setMaintData({ ...maintData, start_date: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Đến ngày dự kiến hoàn thành</label>
                <input 
                  type="date" 
                  required
                  value={maintData.end_date}
                  onChange={(e) => setMaintData({ ...maintData, end_date: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Lý do bảo dưỡng / Sửa chữa</label>
                <input 
                  type="text" 
                  required
                  placeholder="VD: Thay dầu, thay lốp, đăng kiểm định kỳ..."
                  value={maintData.reason}
                  onChange={(e) => setMaintData({ ...maintData, reason: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowMaintModal(false)} style={styles.btnSecondary}>Hủy</button>
                <button type="submit" style={{ ...styles.btnPrimary, backgroundColor: '#f59e0b' }}>🛠️ Xác Nhận Bảo Dưỡng</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  btnPrimary: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
  btnSecondary: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' },
  btnSmall: { border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' },
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  cardFooter: { display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end' },
  badge: (status) => {
    const isMaint = status === 'MAINTENANCE';
    const isTour = status === 'IN_TOUR';
    return {
      backgroundColor: isMaint ? '#fee2e2' : isTour ? '#fef9c3' : '#dcfce7',
      color: isMaint ? '#991b1b' : isTour ? '#854d0e' : '#166534',
      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700'
    };
  },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }
};

export default VehicleFleetManagement;
