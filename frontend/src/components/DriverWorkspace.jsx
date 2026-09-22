import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/partner.css';

const DriverWorkspace = ({ activeTab, selectedDeparture, setSelectedDeparture, setActiveTab }) => {
  const [trips, setTrips] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form states - Chi phí
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'Fuel', amount: '', description: '' });
  const [expenseFile, setExpenseFile] = useState(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Form states - Sự cố
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: '', vehicle_number: '', description: '', location: '' });
  const [incidentFile, setIncidentFile] = useState(null);
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  // Supervision mode for Admin/Manager
  const [driversList, setDriversList] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('all');

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userRoleId = currentUser ? (currentUser.role !== undefined ? currentUser.role : currentUser.role_id) : null;
  const isAdminOrManager = currentUser && [1, 2, 3, '1', '2', '3'].includes(userRoleId);

  useEffect(() => {
    if (isAdminOrManager) {
      fetchDriversList();
    }
    fetchTrips('all');
  }, []);

  useEffect(() => {
    if (selectedDeparture) {
      fetchItinerary(selectedDeparture.tour_id);
      fetchExpenses(selectedDeparture.departure_id);
      fetchIncidents(selectedDeparture.departure_id);
    }
  }, [selectedDeparture]);

  const fetchDriversList = async () => {
    try {
      const token = localStorage.getItem('token');
      let drivers = [];
      try {
        const res = await axios.get('http://localhost:5000/api/driver/all-drivers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          drivers = res.data.data;
        }
      } catch (err) {
        console.warn('API all-drivers gặp lỗi, chuyển sang fallback API HR:', err);
      }

      if (drivers.length === 0) {
        const hrRes = await axios.get('http://localhost:5000/api/hr/employees', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null);

        if (hrRes?.data?.success && Array.isArray(hrRes.data.data)) {
          drivers = hrRes.data.data
            .filter(e => Number(e.role_id) === 8 || e.role_name === 'Driver' || e.role_name === 'Tài xế')
            .map(e => ({
              driver_id: e.user_id,
              full_name: e.full_name,
              email: e.email,
              phone: e.phone
            }));
        }
      }

      setDriversList(drivers);
    } catch (err) {
      console.error('Lỗi tải danh sách tài xế:', err);
    }
  };

  const fetchTrips = async (driverId = selectedDriverId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/driver/work?driver_id=${driverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTrips(res.data.data || []);
        if (res.data.data.length > 0 && !selectedDeparture) {
          setSelectedDeparture(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách chuyến xe:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverChange = (newDriverId) => {
    setSelectedDriverId(newDriverId);
    setSelectedDeparture(null);
    fetchTrips(newDriverId);
  };

  const fetchItinerary = async (tourId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/driver/tours/${tourId}/itinerary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setItineraries(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải lịch trình tour:', err);
    }
  };

  const fetchExpenses = async (departureId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/driver/departures/${departureId}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setExpenses(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách chi phí:', err);
    }
  };

  const fetchIncidents = async (departureId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/driver/departures/${departureId}/incidents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIncidents(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi tải sự cố xe:', err);
    }
  };

  const handleSelectTrip = (trip) => {
    setSelectedDeparture(trip);
    setActiveTab('driver_schedule');
  };

  const handleStatusChange = async (departureId, newStatus) => {
    const msg = newStatus === 'Closed' ? 'Đang chạy / Đi tour' : newStatus === 'Completed' ? 'Hoàn thành chuyến xe' : 'Mở chuyến';
    if (!window.confirm(`Xác nhận đổi trạng thái chuyến xe sang "${msg}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/driver/departures/${departureId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert(res.data.message);
        setTrips(prev => prev.map(t => t.departure_id === departureId ? { ...t, status: newStatus } : t));
        if (selectedDeparture?.departure_id === departureId) {
          setSelectedDeparture(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!selectedDeparture) return alert('Vui lòng chọn chuyến xe kê khai!');
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return alert('Vui lòng nhập số tiền hợp lệ!');

    setIsSubmittingExpense(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('departure_id', selectedDeparture.departure_id);
      formData.append('category', expenseForm.category);
      formData.append('amount', expenseForm.amount);
      formData.append('description', expenseForm.description);
      if (expenseFile) formData.append('receipt_image', expenseFile);

      const res = await axios.post('http://localhost:5000/api/driver/expenses', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert(res.data.message);
        setShowExpenseModal(false);
        setExpenseForm({ category: 'Fuel', amount: '', description: '' });
        setExpenseFile(null);
        fetchExpenses(selectedDeparture.departure_id);
      }
    } catch (err) {
      alert('Lỗi gửi kê khai chi phí: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.title.trim()) return alert('Vui lòng nhập tiêu đề sự cố!');
    if (!incidentForm.vehicle_number.trim()) return alert('Vui lòng nhập biển số xe!');

    setIsSubmittingIncident(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      if (selectedDeparture) formData.append('departure_id', selectedDeparture.departure_id);
      formData.append('vehicle_number', incidentForm.vehicle_number);
      formData.append('title', incidentForm.title);
      formData.append('description', incidentForm.description);
      formData.append('location', incidentForm.location);
      if (incidentFile) formData.append('image', incidentFile);

      const res = await axios.post('http://localhost:5000/api/driver/incidents', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert(res.data.message);
        setShowIncidentModal(false);
        setIncidentForm({ title: '', vehicle_number: '', description: '', location: '' });
        setIncidentFile(null);
        if (selectedDeparture) fetchIncidents(selectedDeparture.departure_id);
      }
    } catch (err) {
      alert('Lỗi gửi báo cáo sự cố xe: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return { text: 'Chuẩn bị đi', bg: '#e0f2fe', color: '#0369a1' };
      case 'Closed': return { text: 'Đang di chuyển', bg: '#fef3c7', color: '#d97706' };
      case 'Completed': return { text: 'Hoàn thành', bg: '#dcfce7', color: '#15803d' };
      default: return { text: status, bg: '#f1f5f9', color: '#475569' };
    }
  };

  const filteredTrips = trips.filter(t => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      t.tour_name?.toLowerCase().includes(term) ||
      t.destination?.toLowerCase().includes(term) ||
      t.departure_id?.toString().includes(term) ||
      (t.vehicle_number && t.vehicle_number.toLowerCase().includes(term));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderDepartureSelector = () => (
    <div style={{
      background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0',
      marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>🔄 Đang xem chuyến xe:</span>
        <select
          value={selectedDeparture ? selectedDeparture.departure_id : ''}
          onChange={(e) => {
            const deptId = parseInt(e.target.value);
            const matched = trips.find(t => t.departure_id === deptId);
            if (matched) setSelectedDeparture(matched);
          }}
          style={{
            padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px',
            fontWeight: '700', color: '#1e3a8a', background: '#f8fafc', outline: 'none', cursor: 'pointer'
          }}
        >
          {trips.map(t => (
            <option key={t.departure_id} value={t.departure_id}>
              {t.tour_name} (Xe: {t.vehicle_number || 'Chưa gán xe'} - Đoàn #{t.departure_id})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {selectedDeparture && selectedDeparture.status === 'Open' && (
          <button
            onClick={() => handleStatusChange(selectedDeparture.departure_id, 'Closed')}
            style={{ padding: '8px 14px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
          >
            🚀 Đóng nhận khách & Xuất phát
          </button>
        )}
        {selectedDeparture && selectedDeparture.status === 'Closed' && (
          <button
            onClick={() => handleStatusChange(selectedDeparture.departure_id, 'Completed')}
            style={{ padding: '8px 14px', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
          >
            ✅ Hoàn thành Chuyến xe
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #1e3a8a', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>Đang tải danh sách chuyến xe...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0px', minHeight: '80vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🛡️ BANNER GIÁM SÁT DÀNH CHO ADMIN & MANAGER */}
      {isAdminOrManager && (
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff',
          padding: '16px 20px', borderRadius: '14px', marginBottom: '20px', display: 'flex',
          justify: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase' }}>
              🛡️ CHẾ ĐỘ GIÁM SÁT ĐIỀU HÀNH XE
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: '800' }}>
              👁️ Theo Dõi Lịch Trình & Chi Phí Chuyến Xe Của Tài Xế
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '600' }}>Lọc theo Tài xế:</span>
            <select
              value={selectedDriverId}
              onChange={(e) => handleDriverChange(e.target.value)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: '1px solid #475569',
                background: '#1e293b', color: '#ffffff', fontWeight: '700', fontSize: '13px'
              }}
            >
              <option value="all">🌐 Tất cả Tài xế trong hệ thống</option>
              {driversList.map(d => (
                <option key={d.driver_id} value={d.driver_id}>
                  🚌 Tài xế #{d.driver_id}: {d.full_name} ({d.phone || d.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 🚀 TAB 1: DANH SÁCH CHUYẾN XE ĐƯỢC PHÂN CÔNG (TABLE VIEW) */}
      {activeTab === 'driver_assigned' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                🚌 ĐIỀU HÀNH XE • PHÂN CÔNG TÀI XẾ
              </div>
              <h3 style={{ margin: '4px 0 0 0', color: '#0f172a', fontSize: '22px', fontWeight: '800' }}>
                Danh sách Chuyến xe Được Phân công
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                Danh sách tổng hợp các đoàn tour du lịch mà bạn phụ trách lái xe đưa đón.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '10px', minWidth: '120px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Tổng chuyến xe:</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{trips.length} chuyến</div>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 16px', borderRadius: '10px', minWidth: '120px' }}>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>Đang đi tour:</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#15803d' }}>
                  {trips.filter(t => t.status === 'Closed').length} chuyến
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <span style={{ fontSize: '16px' }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm theo tên tour, điểm đến, biển số xe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Trạng thái:</span>
              {['all', 'Open', 'Closed', 'Completed'].map((st) => {
                const label = st === 'all' ? 'Tất cả' : st === 'Open' ? 'Chuẩn bị đi' : st === 'Closed' ? 'Đang đi' : 'Hoàn thành';
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                      border: isActive ? 'none' : '1px solid #cbd5e1',
                      background: isActive ? '#0284c7' : '#ffffff', color: isActive ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BẢNG CHUYẾN XE */}
          {filteredTrips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚌</div>
              <div style={{ fontWeight: '600' }}>Không tìm thấy chuyến xe nào phù hợp.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Mã đoàn</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Biển số xe</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Tên Tour & Điểm đến</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Thời gian di chuyển</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Hướng dẫn viên</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Trạng thái</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map(t => {
                    const badge = getStatusBadge(t.status);
                    const isCurrent = selectedDeparture?.departure_id === t.departure_id;

                    return (
                      <tr key={t.departure_id} style={{ borderBottom: '1px solid #e2e8f0', background: isCurrent ? '#f0f9ff' : '#fff' }}>
                        <td style={{ padding: '14px', fontWeight: '800', color: '#1e3a8a' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                            #{t.departure_id}
                          </span>
                        </td>
                        <td style={{ padding: '14px', fontWeight: '800', color: '#0f172a' }}>
                          🚌 <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '6px' }}>
                            {t.vehicle_number || 'Chưa gán xe'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', fontWeight: '700', color: '#0f172a' }}>
                          <div>{t.tour_name}</div>
                          <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600' }}>📍 {t.destination}</div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b' }}>
                            📅 {new Date(t.departure_date).toLocaleDateString('vi-VN')} → {new Date(t.return_date).toLocaleDateString('vi-VN')}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>⏱️ {t.duration_days || 3} ngày</div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: '700', color: '#334155' }}>🚩 {t.guide_name || 'Chưa gán HDV'}</div>
                          {t.guide_phone && <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {t.guide_phone}</div>}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ background: badge.bg, color: badge.color, fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
                            {badge.text}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleSelectTrip(t)}
                            style={{
                              padding: '8px 14px', background: isCurrent ? '#059669' : '#0284c7', color: '#fff',
                              border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                            }}
                          >
                            {isCurrent ? '✅ Đang quản lý' : '🚀 Nhận chuyến & Quản lý'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 🚀 CHI TIẾT CÁC TAB VẬN HÀNH */}
      {activeTab !== 'driver_assigned' && (
        !selectedDeparture ? (
          <div style={{ background: '#fff', padding: '40px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚌</div>
            <h3 style={{ color: '#0f172a', margin: '0 0 8px 0', fontWeight: '800' }}>Chưa chọn chuyến xe nào</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              Vui lòng chọn một chuyến xe từ <strong>"Danh sách chuyến xe được phân công"</strong> để bắt đầu xem lịch trình hoặc kê khai chi phí.
            </p>
            <button
              onClick={() => setActiveTab('driver_assigned')}
              style={{ padding: '10px 20px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              📋 Đến Danh Sách Chuyến Xe Được Phân Công
            </button>
          </div>
        ) : (
          <div>
            {renderDepartureSelector()}

            {/* TAB: LỊCH TRÌNH & ĐIỂM ĐÓN TRẢ */}
            {activeTab === 'driver_schedule' && (
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>SỔ TAY LÁI XE • LỘ TRÌNH ĐƯỜNG ĐI</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                      🚌 {selectedDeparture.tour_name} (Xe: {selectedDeparture.vehicle_number || 'Chưa gán xe'})
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                      📍 Điểm đến: <strong>{selectedDeparture.destination}</strong> • 📅 Khởi hành: <strong>{new Date(selectedDeparture.departure_date).toLocaleDateString('vi-VN')}</strong>
                    </p>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDeparture.destination)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: '10px 16px', background: '#0284c7', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🗺️ Mở Bản Đồ Chỉ Đường (Google Maps)
                  </a>
                </div>

                {/* DANH SÁCH LỊCH TRÌNH NGÀY */}
                {itineraries.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                    Chưa cập nhật mốc thời gian lịch trình chi tiết cho chuyến đi này.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {itineraries.map(it => (
                      <div key={it.itinerary_id} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ background: '#0284c7', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
                            NGÀY {it.day_number}
                          </span>
                          <h5 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{it.title}</h5>
                        </div>
                        <div style={{ padding: '16px', fontSize: '13px', color: '#334155', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                          {it.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: PHỐI HỢP HƯỚNG DẪN VIÊN */}
            {activeTab === 'driver_contacts' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>HƯỚNG DẪN VIÊN PHỤ TRÁCH ĐOÀN</div>
                  <h4 style={{ margin: '8px 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                    🚩 {selectedDeparture.guide_name || 'Chưa phân công HDV'}
                  </h4>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div>📞 <strong>Số điện thoại:</strong> {selectedDeparture.guide_phone || 'Chưa cập nhật'}</div>
                    <div>✉️ <strong>Email liên hệ:</strong> {selectedDeparture.guide_email || 'Chưa cập nhật'}</div>
                  </div>

                  {selectedDeparture.guide_phone && (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <a
                        href={`tel:${selectedDeparture.guide_phone}`}
                        style={{ flex: 1, padding: '10px', background: '#166534', color: '#fff', textDecoration: 'none', borderRadius: '8px', textAlign: 'center', fontWeight: '700', fontSize: '13px' }}
                      >
                        📞 Gọi Ngay
                      </a>
                      <a
                        href={`https://zalo.me/${selectedDeparture.guide_phone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ flex: 1, padding: '10px', background: '#0284c7', color: '#fff', textDecoration: 'none', borderRadius: '8px', textAlign: 'center', fontWeight: '700', fontSize: '13px' }}
                      >
                        💬 Chat Zalo
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>THÔNG TIN XE & SỨC CHỨA</div>
                  <h4 style={{ margin: '8px 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                    🚌 Xe: {selectedDeparture.vehicle_number || 'Chưa đăng ký'}
                  </h4>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div>👥 <strong>Tổng số chỗ ngồi:</strong> {selectedDeparture.max_slots} chỗ</div>
                    <div>✅ <strong>Khách đã đặt trên xe:</strong> {selectedDeparture.max_slots - selectedDeparture.available_slots} khách</div>
                    <div>🚗 <strong>Loại xe khuyến nghị:</strong> Xe du lịch 29-45 chỗ đời mới</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: KÊ KHAI CHI PHÍ CHUYẾN ĐI */}
            {activeTab === 'driver_expenses' && (
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                      ⛽ Kê khai Chi phí Chuyến đi
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                      Nhập tiền xăng dầu, vé cầu đường, phí đỗ xe phát sinh thực tế.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    style={{ padding: '10px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                  >
                    ➕ Thêm Kê Khai Chi Phí
                  </button>
                </div>

                {/* BẢNG CHI PHÍ */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px' }}>Loại chi phí</th>
                        <th style={{ padding: '12px' }}>Số tiền (VND)</th>
                        <th style={{ padding: '12px' }}>Mô tả</th>
                        <th style={{ padding: '12px' }}>Hóa đơn / Ảnh</th>
                        <th style={{ padding: '12px' }}>Trạng thái</th>
                        <th style={{ padding: '12px' }}>Ngày kê khai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có khoản chi phí nào được kê khai.</td>
                        </tr>
                      ) : (
                        expenses.map(e => (
                          <tr key={e.expense_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px', fontWeight: '700' }}>
                              {e.category === 'Fuel' ? '⛽ Xăng dầu' : e.category === 'Toll' ? '🛣️ Vé trạm Toll' : e.category === 'Parking' ? '🅿️ Phí bãi xe' : '📦 Chi phí khác'}
                            </td>
                            <td style={{ padding: '12px', fontWeight: '800', color: '#b91c1c' }}>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(e.amount)}
                            </td>
                            <td style={{ padding: '12px' }}>{e.description || '—'}</td>
                            <td style={{ padding: '12px' }}>
                              {e.receipt_image ? (
                                <a href={`http://localhost:5000${e.receipt_image}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: '600' }}>Xem ảnh hóa đơn</a>
                              ) : 'Không có'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                background: e.status === 'Approved' ? '#dcfce7' : e.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                color: e.status === 'Approved' ? '#15803d' : e.status === 'Rejected' ? '#b91c1c' : '#d97706',
                                padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '11px'
                              }}>
                                {e.status === 'Approved' ? 'Đã phê duyệt' : e.status === 'Rejected' ? 'Từ chối' : 'Chờ duyệt'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#64748b' }}>{new Date(e.created_at).toLocaleDateString('vi-VN')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: BÁO CÁO SỰ CỐ XE */}
            {activeTab === 'driver_incidents' && (
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                      🛠️ Báo cáo Sự cố & Bảo dưỡng Xe
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                      Báo cáo hỏng hóc, va chạm hoặc đề xuất bảo dưỡng xe cho Ban quản lý.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIncidentForm({ title: '', vehicle_number: selectedDeparture?.vehicle_number || '', description: '', location: '' });
                      setShowIncidentModal(true);
                    }}
                    style={{ padding: '10px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                  >
                    🚨 Báo Cáo Sự Cố Khẩn Cấp
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {incidents.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                      Không có báo cáo sự cố xe nào cho chuyến đi này.
                    </div>
                  ) : (
                    incidents.map(inc => (
                      <div key={inc.incident_id} style={{ border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px', background: '#fff5f5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '15px', color: '#991b1b', fontWeight: '800' }}>
                            🚨 {inc.title} (Xe: {inc.vehicle_number})
                          </h5>
                          <span style={{ background: inc.status === 'Resolved' ? '#dcfce7' : '#fee2e2', color: inc.status === 'Resolved' ? '#15803d' : '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', fontSize: '11px' }}>
                            {inc.status === 'Resolved' ? 'Đã khắc phục' : inc.status === 'Processing' ? 'Đang xử lý' : 'Đã báo cáo'}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#475569' }}>{inc.description}</p>
                        {inc.location && <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>📍 Vị trí: {inc.location}</div>}
                        {inc.image_url && (
                          <div style={{ marginTop: '10px' }}>
                            <a href={`http://localhost:5000${inc.image_url}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: '600', fontSize: '12px' }}>📷 Xem ảnh hiện trường sự cố</a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* MODAL KÊ KHAI CHI PHÍ */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>
              ⛽ Kê Khai Chi Phí Chuyến Đi
            </h3>
            <form onSubmit={handleAddExpense}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Loại chi phí *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="Fuel">⛽ Xăng dầu</option>
                  <option value="Toll">🛣️ Vé qua trạm Toll</option>
                  <option value="Parking">🅿️ Phí đỗ xe / Bãi xe</option>
                  <option value="Other">📦 Chi phí khác</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Số tiền (VND) *</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 500000"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Ghi chú / Mô tả chi tiết</label>
                <textarea
                  rows="3"
                  placeholder="Nhập tên cây xăng, trạm thu phí..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Ảnh đính kèm Hóa đơn / Biên nhận</label>
                <input type="file" accept="image/*" onChange={(e) => setExpenseFile(e.target.files[0])} style={{ fontSize: '13px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowExpenseModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '700', fontSize: '13px' }}>
                  Hủy
                </button>
                <button type="submit" disabled={isSubmittingExpense} style={{ padding: '8px 16px', background: '#0284c7', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                  {isSubmittingExpense ? 'Đang gửi...' : 'Gửi Kê Khai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BÁO CÁO SỰ CỐ XE */}
      {showIncidentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#991b1b', fontSize: '18px', fontWeight: '800' }}>
              🚨 Báo Cáo Sự Cố Xe Khẩn Cấp
            </h3>
            <form onSubmit={handleReportIncident}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Biển số xe *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 29B-123.45"
                  value={incidentForm.vehicle_number}
                  onChange={(e) => setIncidentForm({ ...incidentForm, vehicle_number: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Tiêu đề sự cố *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nổ lốp trên cao tốc, hỏng điều hòa xe..."
                  value={incidentForm.title}
                  onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Vị trí hiện tại của xe</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đèo Hải Vân, Km 45..."
                  value={incidentForm.location}
                  onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Mô tả chi tiết sự cố</label>
                <textarea
                  rows="3"
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Ảnh chụp hiện trường sự cố</label>
                <input type="file" accept="image/*" onChange={(e) => setIncidentFile(e.target.files[0])} style={{ fontSize: '13px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowIncidentModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '700', fontSize: '13px' }}>
                  Hủy
                </button>
                <button type="submit" disabled={isSubmittingIncident} style={{ padding: '8px 16px', background: '#dc2626', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                  {isSubmittingIncident ? 'Đang gửi...' : 'Gửi Báo Cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverWorkspace;
