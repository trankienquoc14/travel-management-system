import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffVehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Status Form Data
  const [statusData, setStatusData] = useState({
    new_status: 'AVAILABLE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
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

  const openStatusModal = (veh) => {
    if (veh.status === 'IN_TOUR') {
      alert("Không thể chuyển trạng thái thủ công đối với xe Đang đi tour.");
      return;
    }
    setSelectedVehicle(veh);
    setStatusData({
      new_status: veh.status !== 'IN_TOUR' ? veh.status : 'AVAILABLE',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
      reason: ''
    });
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${GATEWAY_URL}/api/tours/fleet/staff/vehicles/${selectedVehicle.vehicle_id}/status`, statusData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMsg({ type: 'success', text: `Cập nhật trạng thái xe ${selectedVehicle.license_plate} thành công!` });
      setShowStatusModal(false);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật trạng thái xe');
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

  const categories = [...new Set(filteredVehicles.map(v => v.vehicle_type))].sort();

  return (
    <div style={styles.container}>
      <div style={styles.headerArea}>
        <div>
          <h1 style={styles.pageTitle}>Quản lý Phương tiện (Office Staff)</h1>
          <p style={styles.pageSubtitle}>Theo dõi tình trạng và cập nhật hoạt động của xe</p>
        </div>
        <div>
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
          {[...new Set(vehicles.map(v => v.vehicle_type))].map(t => (
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
              {filteredVehicles.filter(v => v.vehicle_type === cat).map(v => (
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

                    {v.notes && (
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '16px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                        {v.notes}
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                      <button 
                        onClick={() => openStatusModal(v)} 
                        style={v.status === 'IN_TOUR' ? {...styles.btnSecondary, width: '100%', opacity: 0.5, cursor: 'not-allowed'} : {...styles.btnPrimary, width: '100%'}}
                        disabled={v.status === 'IN_TOUR'}
                      >
                        Cập nhật trạng thái
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal Cập Nhật Trạng Thái */}
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
  cardFooter: { display: 'flex', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end' },
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
