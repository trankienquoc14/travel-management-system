import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const TourVehicleDispatching = () => {
  const [departures, setDepartures] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resDep, resDrivers] = await Promise.all([
        axios.get(`${GATEWAY_URL}/api/tours/operations/departures`, config),
        axios.get(`${GATEWAY_URL}/api/driver/all`, config).catch(() => ({ data: { success: true, data: [] } }))
      ]);

      if (resDep.data && resDep.data.success) {
        setDepartures(resDep.data.data || []);
      }
      if (resDrivers.data && resDrivers.data.success) {
        setDrivers(resDrivers.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách tour vận hành:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải danh sách chuyến đi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDeparture = async (dep) => {
    setSelectedDeparture(dep);
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setAvailableVehicles([]);
    setLoadingVehicles(true);

    try {
      const token = localStorage.getItem('token');
      const startDate = dep.departure_date ? new Date(dep.departure_date).toISOString().split('T')[0] : '';
      const endDate = dep.end_date ? new Date(dep.end_date).toISOString().split('T')[0] : startDate;

      const res = await axios.get(`${GATEWAY_URL}/api/tours/fleet/available-vehicles`, {
        params: { start_date: startDate, end_date: endDate },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setAvailableVehicles(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi lọc xe rảnh:", err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeparture || !selectedVehicleId || !selectedDriverId) {
      alert("Vui lòng chọn đầy đủ: Chuyến đi, Chiếc xe (Biển số) và Tài xế!");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const startDate = selectedDeparture.departure_date ? new Date(selectedDeparture.departure_date).toISOString().split('T')[0] : '';
      const endDate = selectedDeparture.end_date ? new Date(selectedDeparture.end_date).toISOString().split('T')[0] : startDate;

      const res = await axios.post(`${GATEWAY_URL}/api/tours/fleet/dispatch`, {
        departure_id: selectedDeparture.departure_id,
        vehicle_id: selectedVehicleId,
        driver_id: selectedDriverId,
        start_date: startDate,
        end_date: endDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setAlertMsg({ type: 'success', text: '🎉 Phân công Xe & Tài xế thành công!' });
        setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
        handleSelectDeparture(selectedDeparture);
      } else {
        alert(res.data?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi điều xe');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          🧭 Điều Xe Vận Hành Tour & Phân Công Tài Xế
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
          Lựa chọn chuyến đi, tra cứu xe rảnh theo từng Biển số xe & kiểm tra độ rảnh của Tài xế trước khi phân công.
        </p>
      </div>

      {alertMsg.text && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: alertMsg.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: alertMsg.type === 'error' ? '#991b1b' : '#166534',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: '600'
        }}>
          {alertMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>⏳ Đang tải danh sách vận hành...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Cột Trái: Danh sách Tour sắp khởi hành */}
          <div style={styles.box}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              📍 Danh Sách Tour Sắp Khởi Hành
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>
              {departures.map(dep => {
                const isSelected = selectedDeparture?.departure_id === dep.departure_id;
                return (
                  <div 
                    key={dep.departure_id} 
                    onClick={() => handleSelectDeparture(dep)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                      {dep.tour_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: '600', marginTop: '4px' }}>
                      📅 Khởi hành: {dep.departure_date ? new Date(dep.departure_date).toLocaleDateString('vi-VN') : '—'} ➔ {dep.end_date ? new Date(dep.end_date).toLocaleDateString('vi-VN') : '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>👥 Khách đăng ký: <strong>{dep.booked_seats || 0} người</strong></span>
                      <span>🚌 Loại xe yêu cầu: <strong>{dep.vehicle_type || 'Theo đoàn'}</strong></span>
                    </div>
                  </div>
                );
              })}
              {departures.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có tour nào cần điều xe.</div>
              )}
            </div>
          </div>

          {/* Cột Phải: Bảng điều xe & phân công */}
          <div style={styles.box}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              🚌 Khai Thác Xe & Phân Công Tài Xế
            </h2>

            {!selectedDeparture ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
                👈 Vui lòng chọn một chuyến đi từ danh sách bên trái để tiến hành điều xe.
              </div>
            ) : (
              <form onSubmit={handleDispatchSubmit}>
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <div><strong>Tour đã chọn:</strong> {selectedDeparture.tour_name}</div>
                  <div><strong>Thời gian:</strong> {selectedDeparture.departure_date ? new Date(selectedDeparture.departure_date).toLocaleDateString('vi-VN') : ''} đến {selectedDeparture.end_date ? new Date(selectedDeparture.end_date).toLocaleDateString('vi-VN') : ''}</div>
                </div>

                {/* Tra cứu Xe rảnh */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={styles.label}>1. Chọn Chiếc Xe RẢNH (Theo Biển Số Xe) *</label>
                  {loadingVehicles ? (
                    <div style={{ fontSize: '13px', color: '#64748b' }}>🔍 Đang lọc danh sách xe rảnh không vướng lịch...</div>
                  ) : (
                    <select
                      required
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      style={styles.select}
                    >
                      <option value="">-- Chọn chiếc xe rảnh theo Biển số --</option>
                      {availableVehicles.map(v => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>
                          🚘 Biển số: {v.license_plate} | {v.brand_model || v.vehicle_type} ({v.seat_capacity} chỗ) - Màu {v.color || 'trắng'}
                        </option>
                      ))}
                    </select>
                  )}
                  {availableVehicles.length === 0 && !loadingVehicles && (
                    <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                      ⚠️ Không tìm thấy chiếc xe nào rảnh trong khoảng thời gian này hoặc xe đang bảo dưỡng.
                    </div>
                  )}
                </div>

                {/* Chọn Tài Xế rảnh */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={styles.label}>2. Chọn Tài Xế Phụ Trách Chuyến Xe *</label>
                  <select
                    required
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">-- Chọn Tài xế rảnh lịch --</option>
                    {drivers.map(d => (
                      <option key={d.user_id} value={d.user_id}>
                        👨‍✈️ {d.full_name} ({d.phone || 'SĐT chưa cập nhật'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Xem trước tóm tắt */}
                {selectedVehicleId && selectedDriverId && (
                  <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', color: '#166534', marginBottom: '20px', fontSize: '13px' }}>
                    <strong>✅ Tóm tắt lệnh điều xe:</strong>
                    <div>• Chiếc xe giao: <strong>{availableVehicles.find(v => String(v.vehicle_id) === String(selectedVehicleId))?.license_plate}</strong></div>
                    <div>• Tài xế phụ trách: <strong>{drivers.find(d => String(d.user_id) === String(selectedDriverId))?.full_name}</strong></div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
                >
                  {submitting ? '⏳ Đang lưu lệnh...' : '💾 Xác Nhận Lưu Lệnh Điều Xe & Giao Việc'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  box: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' }
};

export default TourVehicleDispatching;
