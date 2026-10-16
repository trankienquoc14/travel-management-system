import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffVehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleServices, setVehicleServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Alert banner
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Form Data for Edit / Add
  const [formData, setFormData] = useState({
    vehicle_name: '',
    base_cost: 0,
    selling_price: 0,
    price: 0,
    service_id: '',
    vehicle_code: '',
    license_plate: '',
    seat_capacity: 7,
    vehicle_type: 'Xe 7 chỗ',
    brand_model: '',
    imagePreview: '',
    image_url: '',
    imageFile: null,
    color: 'Trắng',
    status: 'AVAILABLE',
    notes: ''
  });

  // Maintenance Data
  const [maintData, setMaintData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    reason: ''
  });

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('/')) return `${GATEWAY_URL}${url}`;
    return url;
  };
  const fallbackImg = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [resVehicles, resServices] = await Promise.all([
        axios.get(`${GATEWAY_URL}/api/tours/fleet/vehicles`, { headers }),
        axios.get(`${GATEWAY_URL}/api/services`, { headers }).catch(() => ({ data: { data: [] } }))
      ]);

      if (resVehicles.data && resVehicles.data.success) {
        setVehicles(resVehicles.data.data || []);
      }
      if (resServices.data && resServices.data.data) {
        const internalRoadServices = resServices.data.data
          .filter(s => s.vehicle_service_id != null && s.service_type === 'Xe vận chuyển' && !s.partner_id)
          .sort((a, b) => Number(a.capacity || 0) - Number(b.capacity || 0));
        setVehicleServices(internalRoadServices);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách đội xe:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải dữ liệu đội xe.' });
    } finally {
      setLoading(false);
    }
  };

  // 1. MỞ MODAL SỬA
  const openEditModal = (veh) => {
    setEditVehicle(veh);
    setFormData({
      vehicle_name: veh.vehicle_name || veh.brand_model || '',
      base_cost: veh.base_cost !== undefined && veh.base_cost !== null ? veh.base_cost : 0,
      selling_price: veh.selling_price !== undefined && veh.selling_price !== null ? veh.selling_price : (veh.price || 0),
      price: veh.selling_price !== undefined && veh.selling_price !== null ? veh.selling_price : (veh.price || 0),
      service_id: veh.service_id || '',
      vehicle_code: veh.vehicle_code || '',
      license_plate: veh.license_plate || '',
      seat_capacity: veh.seat_capacity || 7,
      vehicle_type: veh.vehicle_type || 'Xe 7 chỗ',
      brand_model: veh.brand_model || '',
      imagePreview: veh.image_url || '',
      image_url: veh.image_url || '',
      imageFile: null,
      color: veh.color || 'Trắng',
      status: veh.status || 'AVAILABLE',
      notes: veh.notes || ''
    });
    setShowEditModal(true);
  };

  // 1.1 MỞ MODAL THÊM XE MỚI
  const openAddModal = () => {
    const defaultSvc = vehicleServices.find(s => Number(s.capacity) === 7) || vehicleServices[0];
    setEditVehicle(null);
    setFormData({
      vehicle_name: '',
      base_cost: defaultSvc ? Number(defaultSvc.base_cost || 0) : 0,
      selling_price: defaultSvc ? Number(defaultSvc.selling_price || 0) : 0,
      price: defaultSvc ? Number(defaultSvc.selling_price || defaultSvc.base_cost || 0) : 0,
      service_id: defaultSvc ? defaultSvc.service_id : '',
      vehicle_code: '',
      license_plate: '',
      seat_capacity: defaultSvc ? Number(defaultSvc.capacity) : 7,
      vehicle_type: defaultSvc ? (defaultSvc.vehicle_detail_type || `Xe ${defaultSvc.capacity} chỗ`) : 'Xe 7 chỗ',
      brand_model: '',
      imagePreview: '',
      image_url: '',
      imageFile: null,
      color: 'Trắng',
      status: 'AVAILABLE',
      notes: ''
    });
    setShowEditModal(true);
  };

  // LƯU FORM SỬA / THÊM
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
        setAlertMsg({ type: 'success', text: `Đã cập nhật thông tin xe ${formData.license_plate} thành công!` });
      } else {
        await axios.post(`${GATEWAY_URL}/api/tours/fleet/vehicles`, fd, config);
        setAlertMsg({ type: 'success', text: `Đã thêm phương tiện ${formData.license_plate} vào đội xe thành công!` });
      }

      setShowEditModal(false);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi lưu thông tin xe');
    }
  };

  // 2. MỞ MODAL BẢO DƯỠNG
  const openMaintenanceModal = (veh) => {
    if (veh.status === 'IN_TOUR') {
      alert("Xe hiện đang đi tour, không thể đưa vào bảo dưỡng!");
      return;
    }
    setSelectedVehicle(veh);
    setMaintData({
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      reason: ''
    });
    setShowMaintModal(true);
  };

  // XÁC NHẬN ĐƯA VÀO BẢO DƯỠNG
  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${GATEWAY_URL}/api/tours/fleet/staff/vehicles/${selectedVehicle.vehicle_id}/status`, {
        new_status: 'MAINTENANCE',
        start_date: maintData.start_date,
        end_date: maintData.end_date,
        reason: maintData.reason || 'Bảo dưỡng định kỳ'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAlertMsg({ type: 'success', text: `Đã đưa xe ${selectedVehicle.license_plate} vào chế độ bảo dưỡng!` });
      setShowMaintModal(false);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật bảo dưỡng xe');
    }
  };

  // HOÀN TẤT BẢO DƯỠNG (Chuyển về Sẵn sàng)
  const handleCompleteMaintenance = async () => {
    if (!selectedVehicle) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${GATEWAY_URL}/api/tours/fleet/staff/vehicles/${selectedVehicle.vehicle_id}/status`, {
        new_status: 'AVAILABLE',
        reason: maintData.reason || 'Đã hoàn tất bảo dưỡng, xe sẵn sàng hoạt động'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAlertMsg({ type: 'success', text: `Xe ${selectedVehicle.license_plate} đã hoàn tất bảo dưỡng và sẵn sàng hoạt động!` });
      setShowMaintModal(false);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi hoàn tất bảo dưỡng');
    }
  };

  // 3. XÓA XE
  const handleDeleteVehicle = async (vehicleId, plate, status) => {
    if (status === 'IN_TOUR') {
      alert(`Xe ${plate} hiện đang đi tour, không thể xóa khỏi hệ thống!`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa xe biển số "${plate}" khỏi Đội xe?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${GATEWAY_URL}/api/tours/fleet/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMsg({ type: 'success', text: `Đã xóa xe ${plate} khỏi hệ thống thành công.` });
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa xe này.');
    }
  };

  // Filter logic
  const filteredVehicles = vehicles.filter(v => {
    if (selectedCategory !== 'ALL' && v.vehicle_type !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && v.status !== selectedStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!v.vehicle_code?.toLowerCase().includes(term) && 
          !v.license_plate?.toLowerCase().includes(term) &&
          !v.brand_model?.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const categories = [...new Set(filteredVehicles.map(v => v.vehicle_type || `Xe ${v.seat_capacity} chỗ`))].sort();

  return (
    <div style={styles.container}>
      <div style={styles.headerArea}>
        <div>
          <h1 style={styles.pageTitle}>Quản lý Phương tiện (Office Staff)</h1>
          <p style={styles.pageSubtitle}>Theo dõi tình trạng, điều chỉnh và quản lý bảo dưỡng xe nội bộ</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            style={{ ...styles.btnPrimary, display: 'flex', alignItems: 'center', gap: '6px' }} 
            onClick={openAddModal}
          >
            <span>+</span> Thêm xe mới
          </button>
          <button style={styles.btnSecondary} onClick={fetchVehicles}>
            Tải lại dữ liệu
          </button>
        </div>
      </div>

      {alertMsg.text && (
        <div style={{...styles.alert, backgroundColor: alertMsg.type === 'error' ? '#fee2e2' : '#dcfce7', color: alertMsg.type === 'error' ? '#991b1b' : '#166534'}}>
          {alertMsg.text}
          <span style={styles.closeAlert} onClick={() => setAlertMsg({type: '', text: ''})}>&times;</span>
        </div>
      )}

      {/* Tóm tắt */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Tổng xe</div>
          <div style={styles.statValue}>{vehicles.length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Sẵn sàng</div>
          <div style={{...styles.statValue, color: '#166534'}}>{vehicles.filter(v => v.status === 'AVAILABLE').length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Đang đi tour</div>
          <div style={{...styles.statValue, color: '#ca8a04'}}>{vehicles.filter(v => v.status === 'IN_TOUR').length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Đang bảo dưỡng</div>
          <div style={{...styles.statValue, color: '#ea580c'}}>{vehicles.filter(v => v.status === 'MAINTENANCE').length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Đang sửa chữa</div>
          <div style={{...styles.statValue, color: '#dc2626'}}>{vehicles.filter(v => v.status === 'REPAIR').length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Tạm ngưng</div>
          <div style={{...styles.statValue, color: '#475569'}}>{vehicles.filter(v => v.status === 'INACTIVE').length}</div>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input 
          type="text" 
          placeholder="Tìm kiếm Mã xe / Biển số / Dòng xe..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...styles.input, width: '300px' }}
        />
        <select style={styles.select} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="ALL">Tất cả loại xe</option>
          {[...new Set(vehicles.map(v => v.vehicle_type || `Xe ${v.seat_capacity} chỗ`))].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select style={styles.select} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="AVAILABLE">Sẵn sàng</option>
          <option value="IN_TOUR">Đang đi Tour</option>
          <option value="MAINTENANCE">Đang bảo dưỡng</option>
          <option value="REPAIR">Đang sửa chữa</option>
          <option value="INACTIVE">Tạm ngưng</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Đang tải dữ liệu...</div>
      ) : (
        categories.map(cat => (
          <div key={cat} style={{ marginBottom: '32px' }}>
            <h2 style={styles.categoryTitle}>{cat.toUpperCase()}</h2>
            <div style={styles.grid}>
              {filteredVehicles.filter(v => (v.vehicle_type || `Xe ${v.seat_capacity} chỗ`) === cat).map(v => (
                <div key={v.vehicle_id} style={styles.card}>
                  <div style={{ height: '180px', overflow: 'hidden' }}>
                    <img 
                      src={getImageUrl(v.image_url) || fallbackImg} 
                      alt={v.license_plate}
                      onError={(e) => { e.target.src = fallbackImg; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                    />
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                        Mã: {v.vehicle_code || 'N/A'}
                      </span>
                      <span style={styles.badge(v.status)}>
                        {v.status === 'AVAILABLE' ? 'Sẵn sàng' : v.status === 'IN_TOUR' ? 'Đang đi Tour' : v.status === 'MAINTENANCE' ? 'Bảo dưỡng' : v.status === 'REPAIR' ? 'Sửa chữa' : 'Tạm ngưng'}
                      </span>
                    </div>
                    
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
                      Biển số: <span style={{ color: '#0194f3' }}>{v.license_plate}</span>
                    </h3>

                    <div style={{ marginBottom: '8px', fontSize: '13px', color: '#334155' }}>
                      <div style={{ color: '#64748b', marginBottom: '2px', fontSize: '12px' }}>Dòng/Đời xe:</div>
                      <div style={{ fontWeight: '600' }}>{v.brand_model || 'N/A'}</div>
                    </div>

                    <div style={{ marginBottom: '12px', fontSize: '13px', color: '#334155' }}>
                      <div style={{ color: '#64748b', marginBottom: '2px', fontSize: '12px' }}>Màu xe & Số chỗ:</div>
                      <div style={{ fontWeight: '600' }}>{v.color || 'N/A'} - {v.seat_capacity} chỗ</div>
                    </div>

                    {v.service_name && (
                      <div style={{ marginBottom: '12px', fontSize: '12px', color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 10px', borderRadius: '6px', fontWeight: '600' }}>
                        🔗 {v.service_name} ({Number(v.base_cost || 0).toLocaleString('vi-VN')}đ/ngày)
                      </div>
                    )}

                    {v.notes && (
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '16px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                        {v.notes}
                      </div>
                    )}

                    {/* Footer 3 Nút hành động: Sửa, Bảo dưỡng, Xóa */}
                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: '8px' }}>
                      <button 
                        onClick={() => openEditModal(v)} 
                        style={{
                          backgroundColor: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          padding: '9px 8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                          transition: 'all 0.2s'
                        }}
                        title="Chỉnh sửa thông tin xe"
                      >
                        ✏️ Sửa
                      </button>

                      <button 
                        onClick={() => openMaintenanceModal(v)} 
                        disabled={v.status === 'IN_TOUR'}
                        style={{
                          backgroundColor: v.status === 'IN_TOUR' ? '#f1f5f9' : (v.status === 'MAINTENANCE' ? '#ea580c' : '#f59e0b'),
                          color: v.status === 'IN_TOUR' ? '#94a3b8' : '#fff',
                          border: 'none',
                          padding: '9px 6px',
                          borderRadius: '8px',
                          cursor: v.status === 'IN_TOUR' ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          boxShadow: v.status === 'IN_TOUR' ? 'none' : '0 2px 4px rgba(245, 158, 11, 0.2)',
                          transition: 'all 0.2s'
                        }}
                        title={v.status === 'IN_TOUR' ? "Xe đang đi tour, không thể bảo dưỡng" : (v.status === 'MAINTENANCE' ? "Đang bảo dưỡng (Bấm để cập nhật / hoàn tất)" : "Đưa vào bảo dưỡng")}
                      >
                        🔧 {v.status === 'MAINTENANCE' ? 'Đang bảo dưỡng' : 'Bảo dưỡng'}
                      </button>

                      <button 
                        onClick={() => handleDeleteVehicle(v.vehicle_id, v.license_plate, v.status)} 
                        disabled={v.status === 'IN_TOUR'}
                        style={{
                          backgroundColor: v.status === 'IN_TOUR' ? '#f1f5f9' : '#ef4444',
                          color: v.status === 'IN_TOUR' ? '#94a3b8' : '#fff',
                          border: 'none',
                          padding: '9px 8px',
                          borderRadius: '8px',
                          cursor: v.status === 'IN_TOUR' ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          boxShadow: v.status === 'IN_TOUR' ? 'none' : '0 2px 4px rgba(239, 68, 68, 0.2)',
                          transition: 'all 0.2s'
                        }}
                        title={v.status === 'IN_TOUR' ? "Xe đang đi tour, không thể xóa" : "Xóa xe khỏi hệ thống"}
                      >
                        🗑️ Xóa
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* MODAL 1: SỬA / THÊM XE */}
      {showEditModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, width: '800px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: '700' }}>
                {editVehicle ? `✏️ Chỉnh sửa thông tin xe (${editVehicle.license_plate})` : '➕ Thêm xe mới vào Đội xe'}
              </h2>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '6px' }}>
              <form id="vehicleEditForm" onSubmit={handleFormSubmit}>
                
                {/* Tên xe */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={styles.label}>Tên xe *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="VD: VinFast Lux A2.0 Turbo, Toyota Fortuner Legender..."
                    value={formData.vehicle_name}
                    onChange={(e) => setFormData({ ...formData, vehicle_name: e.target.value })}
                    style={{ ...styles.input, height: '42px', fontWeight: '600', borderColor: '#3b82f6' }}
                  />
                </div>

                {/* Giá vốn & Giá bán */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                  <div>
                    <label style={styles.label}>💰 Giá vốn (VNĐ/ngày) *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="VD: 800.000"
                        value={formData.base_cost !== undefined && formData.base_cost !== null ? Number(formData.base_cost).toLocaleString('vi-VN') : '0'}
                        onChange={(e) => {
                          const rawVal = Number(e.target.value.replace(/\D/g, '')) || 0;
                          setFormData({ ...formData, base_cost: rawVal });
                        }}
                        style={{ ...styles.input, height: '42px', paddingRight: '60px', fontWeight: '700', color: '#059669', borderColor: '#10b981' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#059669', fontSize: '13px', fontWeight: '700' }}>
                        đ/ngày
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={styles.label}>🏷️ Giá bán (VNĐ/ngày) *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        required
                        placeholder="VD: 950.000"
                        value={formData.selling_price !== undefined && formData.selling_price !== null ? Number(formData.selling_price).toLocaleString('vi-VN') : '0'}
                        onChange={(e) => {
                          const rawVal = Number(e.target.value.replace(/\D/g, '')) || 0;
                          setFormData({ ...formData, selling_price: rawVal, price: rawVal });
                        }}
                        style={{ ...styles.input, height: '42px', paddingRight: '60px', fontWeight: '700', color: '#d97706', borderColor: '#f59e0b' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#d97706', fontSize: '13px', fontWeight: '700' }}>
                        đ/ngày
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mã xe & Biển số xe */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                  <div>
                    <label style={styles.label}>Mã quản lý xe</label>
                    <input 
                      type="text" 
                      placeholder="VD: XE-16C-06"
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
                      placeholder="VD: 72B-222.16"
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                      style={{ ...styles.input, height: '42px', fontWeight: '700', color: '#0284c7' }}
                    />
                  </div>
                </div>

                {/* Số chỗ & Loại xe */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                  <div>
                    <label style={styles.label}>Số chỗ ngồi *</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.seat_capacity}
                      onChange={(e) => {
                        const seats = parseInt(e.target.value, 10) || 0;
                        const matchedSvc = vehicleServices.find(s => Number(s.capacity) === seats);
                        setFormData({ 
                          ...formData, 
                          seat_capacity: seats,
                          service_id: matchedSvc ? matchedSvc.service_id : formData.service_id,
                          vehicle_type: matchedSvc ? (matchedSvc.vehicle_detail_type || `Xe ${seats} chỗ`) : `Xe ${seats} chỗ`,
                          base_cost: matchedSvc && (!formData.base_cost || !editVehicle) ? Number(matchedSvc.base_cost || 0) : formData.base_cost,
                          selling_price: matchedSvc && (!formData.selling_price || !editVehicle) ? Number(matchedSvc.selling_price || 0) : formData.selling_price,
                          price: matchedSvc && (!formData.price || !editVehicle) ? Number(matchedSvc.selling_price || matchedSvc.base_cost || 0) : formData.price
                        });
                      }}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Phân loại xe</label>
                    <input 
                      type="text" 
                      placeholder="VD: Xe 16 chỗ / Xe SUV"
                      value={formData.vehicle_type}
                      onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                </div>

                {/* Dòng xe & Màu xe */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
                  <div>
                    <label style={styles.label}>Dòng xe / Đời xe</label>
                    <input 
                      type="text" 
                      placeholder="VD: Mercedes-Benz Sprinter Executive"
                      value={formData.brand_model}
                      onChange={(e) => setFormData({ ...formData, brand_model: e.target.value })}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Màu xe</label>
                    <input 
                      type="text" 
                      placeholder="VD: Xám, Trắng, Đen, Bạc..."
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{ ...styles.input, height: '42px' }}
                    />
                  </div>
                </div>

                {/* Ảnh xe */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={styles.label}>Hình ảnh xe</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '14px', border: '1px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <div style={{ width: '150px', height: '95px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formData.imagePreview ? (
                        <img src={getImageUrl(formData.imagePreview)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có ảnh</span>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                        📷 Tải ảnh mới
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
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>Định dạng JPG, PNG. Ảnh rõ nét góc trước xe.</p>
                    </div>
                  </div>
                </div>

                {/* Ghi chú */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={styles.label}>Ghi chú tình trạng xe</label>
                  <textarea 
                    rows="3"
                    placeholder="Bảo dưỡng định kỳ ga máy lạnh tại gara Vũng Tàu..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{ ...styles.input, resize: 'vertical' }}
                  ></textarea>
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ ...styles.btnSecondary, padding: '10px 24px' }}>Hủy</button>
              <button type="submit" form="vehicleEditForm" style={{ ...styles.btnPrimary, padding: '10px 24px' }}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BẢO DƯỠNG XE */}
      {showMaintModal && selectedVehicle && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, width: '550px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '700' }}>
                🔧 Bảo dưỡng xe: <span style={{ color: '#0194f3' }}>{selectedVehicle.license_plate}</span>
              </h2>
              <button type="button" onClick={() => setShowMaintModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>&times;</button>
            </div>
            
            {selectedVehicle.status === 'MAINTENANCE' ? (
              <div>
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', marginBottom: '20px', color: '#9a3412', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Phương tiện đang trong trạng thái Bảo dưỡng</strong>
                    <div style={{ fontSize: '13px', color: '#7c2d12' }}>
                      {selectedVehicle.notes ? `Ghi chú hiện tại: ${selectedVehicle.notes}` : 'Xe tạm thời không thể phân công vào các tour cho đến khi hoàn tất bảo dưỡng.'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={styles.label}>Ghi chú hoàn tất bảo dưỡng (Nếu có)</label>
                  <textarea 
                    rows="3"
                    placeholder="VD: Đã thay dầu máy, kiểm định an toàn kỹ thuật hoàn tất..."
                    value={maintData.reason}
                    onChange={(e) => setMaintData({ ...maintData, reason: e.target.value })}
                    style={{...styles.input, outline: 'none', resize: 'vertical', minHeight: '70px', padding: '10px'}}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button type="button" onClick={() => setShowMaintModal(false)} style={{ ...styles.btnSecondary, padding: '10px 20px' }}>Đóng</button>
                  <button 
                    type="button" 
                    onClick={handleCompleteMaintenance}
                    style={{ 
                      backgroundColor: '#16a34a', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '10px 20px', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontWeight: '600', 
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ✅ Hoàn tất bảo dưỡng (Về Sẵn sàng)
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleMaintenanceSubmit}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={styles.label}>Trạng thái hiện tại:</span>
                  <span style={styles.badge(selectedVehicle.status)}>
                    {selectedVehicle.status === 'AVAILABLE' ? 'Sẵn sàng' : selectedVehicle.status === 'REPAIR' ? 'Đang sửa chữa' : 'Tạm ngưng'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={styles.label}>Ngày bắt đầu bảo dưỡng *</label>
                    <input 
                      type="date" 
                      required
                      value={maintData.start_date}
                      onChange={(e) => setMaintData({ ...maintData, start_date: e.target.value })}
                      style={{...styles.input, outline: 'none', height: '42px'}}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Dự kiến hoàn thành *</label>
                    <input 
                      type="date" 
                      required
                      value={maintData.end_date}
                      onChange={(e) => setMaintData({ ...maintData, end_date: e.target.value })}
                      style={{...styles.input, outline: 'none', height: '42px'}}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={styles.label}>Nội dung / Lý do bảo dưỡng *</label>
                  <textarea 
                    rows="3"
                    required
                    placeholder="VD: Bảo dưỡng định kỳ ga máy lạnh tại gara Vũng Tàu, thay nhớt..."
                    value={maintData.reason}
                    onChange={(e) => setMaintData({ ...maintData, reason: e.target.value })}
                    style={{...styles.input, outline: 'none', resize: 'vertical', minHeight: '80px', padding: '10px'}}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button type="button" onClick={() => setShowMaintModal(false)} style={{ ...styles.btnSecondary, padding: '10px 20px' }}>Hủy</button>
                  <button 
                    type="submit" 
                    style={{ 
                      backgroundColor: '#ea580c', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '10px 20px', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontWeight: '600', 
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🔧 Xác nhận đưa vào bảo dưỡng
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  headerArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' },
  pageSubtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  btnPrimary: { backgroundColor: '#0194f3', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnSecondary: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' },
  statsRow: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  statBox: { flex: '1', minWidth: '120px', backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
  statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' },
  statValue: { fontSize: '24px', fontWeight: 'bold', color: '#0f172a' },
  filterBar: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  input: { padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1e293b' },
  select: { padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', backgroundColor: '#fff', minWidth: '150px', fontFamily: 'inherit', color: '#1e293b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  categoryTitle: { fontSize: '16px', color: '#334155', fontWeight: '700', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' },
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' },
  badge: (status) => {
    let bg = '#e2e8f0'; let c = '#475569';
    if (status === 'AVAILABLE') { bg = '#dcfce7'; c = '#166534'; }
    if (status === 'IN_TOUR') { bg = '#fef9c3'; c = '#854d0e'; }
    if (status === 'MAINTENANCE') { bg = '#ffedd5'; c = '#9a3412'; }
    if (status === 'REPAIR') { bg = '#fee2e2'; c = '#991b1b'; }
    return { backgroundColor: bg, color: c, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' };
  },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#fff', width: '500px', maxWidth: '90%', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' },
  alert: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '500' },
  closeAlert: { cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' },
  loading: { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '15px' }
};

export default StaffVehicleManagement;
