import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const DriverAssignedVehicles = ({ setActiveTab, setSelectedDeparture, selectedDeparture }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState('');
  
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchDriverTours();
  }, []);

  const fetchDriverTours = async () => {
    setLoading(true);
    setAlertMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/tours/fleet/driver-assigned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setAssignments(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch phân công tài xế:", err);
      setAlertMsg('Không thể tải thông tin lịch phân công xe. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = (item, targetTab = 'driver_schedule') => {
    if (setSelectedDeparture) {
      setSelectedDeparture({
        departure_id: item.departure_id,
        tour_id: item.tour_id || item.departure_id,
        tour_name: item.tour_name,
        destination: item.destination,
        departure_date: item.start_date || item.departure_date,
        return_date: item.end_date,
        vehicle_number: item.license_plate,
        guide_name: item.guide_name,
        guide_phone: item.guide_phone,
        status: item.assignment_status === 'ASSIGNED' ? 'Open' : item.assignment_status
      });
    }
    if (setActiveTab) {
      setActiveTab(targetTab);
    }
  };

  // Filter logic
  const filteredAssignments = assignments.filter(item => {
    // Filter status
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ASSIGNED' && item.assignment_status !== 'ASSIGNED') return false;
      if (statusFilter === 'IN_PROGRESS' && item.assignment_status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'COMPLETED' && item.assignment_status !== 'COMPLETED') return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTour = (item.tour_name || '').toLowerCase().includes(q);
      const matchDest = (item.destination || '').toLowerCase().includes(q);
      const matchPlate = (item.license_plate || '').toLowerCase().includes(q);
      const matchGuide = (item.guide_name || '').toLowerCase().includes(q);
      const matchCode = (item.departure_id || '').toString().includes(q);
      if (!matchTour && !matchDest && !matchPlate && !matchGuide && !matchCode) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return { text: '🟢 Đã Giao Việc', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' };
      case 'IN_PROGRESS':
        return { text: '🟡 Đang Vận Hành', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
      case 'COMPLETED':
        return { text: '✅ Hoàn Thành', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
      default:
        return { text: status || '🟢 Đã Giao Việc', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' };
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🚌 KHÔNG GIAN TÀI XẾ • ĐIỀU HÀNH PHƯƠNG TIỆN
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Danh Sách Chuyến Xe & Phương Tiện Được Giao
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Theo dõi biển số xe, thông số kỹ thuật, lịch di chuyển và thông tin Hướng dẫn viên đồng hành.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchDriverTours} style={styles.btnRefresh}>
            🔄 Tải lại dữ liệu
          </button>
        </div>
      </div>

      {/* ALERT MESSAGE */}
      {alertMsg && (
        <div style={{ padding: '14px 18px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '20px', fontWeight: '600', fontSize: '14px', border: '1px solid #fca5a5' }}>
          ⚠️ {alertMsg}
        </div>
      )}

      {/* KPI STATS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={styles.kpiCard}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>📋 Tổng chuyến xe được giao</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{assignments.length} chuyến</div>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700', textTransform: 'uppercase' }}>🟢 Sẵn sàng / Đã giao việc</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#047857', marginTop: '6px' }}>
            {assignments.filter(a => a.assignment_status === 'ASSIGNED' || !a.assignment_status).length} chuyến
          </div>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>🟡 Đang phục vụ tour</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', marginTop: '6px' }}>
            {assignments.filter(a => a.assignment_status === 'IN_PROGRESS').length} chuyến
          </div>
        </div>

        <div style={{ ...styles.kpiCard, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '700', textTransform: 'uppercase' }}>🚘 Chiếc xe phụ trách</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb', marginTop: '8px' }}>
            {assignments.length > 0 ? assignments[0].license_plate : 'Chưa phân công'}
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* SEARCH INPUT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px' }}>
            <span style={{ fontSize: '16px', color: '#64748b' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Tìm theo tên tour, biển số xe, điểm đến, tên HDV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* STATUS FILTER BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>⚡ Trạng thái:</span>
            {[
              { id: 'ALL', label: 'Tất cả', count: assignments.length },
              { id: 'ASSIGNED', label: '🟢 Đã giao việc', count: assignments.filter(a => a.assignment_status === 'ASSIGNED' || !a.assignment_status).length },
              { id: 'IN_PROGRESS', label: '🟡 Đang đi tour', count: assignments.filter(a => a.assignment_status === 'IN_PROGRESS').length },
              { id: 'COMPLETED', label: '✅ Hoàn thành', count: assignments.filter(a => a.assignment_status === 'COMPLETED').length }
            ].map(st => {
              const isActive = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: isActive ? 'none' : '1px solid #cbd5e1',
                    background: isActive ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                    color: isActive ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{st.label}</span>
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: isActive ? '#fff' : '#0369a1',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '800'
                  }}>
                    {st.count}
                  </span>
                </button>
              );
            })}

            {(searchTerm || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                ✕ Xóa lọc
              </button>
            )}
          </div>

        </div>
      </div>

      {/* TABLE SECTION */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>⏳</div>
          <div style={{ fontWeight: '600' }}>Đang tải danh sách chuyến xe được phân công...</div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              
              {/* TABLE HEADER */}
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={styles.th}>Mã đoàn & Tên Tour</th>
                  <th style={styles.th}>Chiếc Xe Được Giao</th>
                  <th style={styles.th}>Thời Gian Di Chuyển</th>
                  <th style={styles.th}>Hướng Dẫn Viên Đồng Hành</th>
                  <th style={styles.th}>Trạng Thái</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody>
                {filteredAssignments.map(item => {
                  const badge = getStatusBadge(item.assignment_status);
                  const isSelected = selectedDeparture && selectedDeparture.departure_id === item.departure_id;

                  return (
                    <tr 
                      key={item.assignment_id} 
                      style={{ 
                        borderBottom: '1px solid #e2e8f0', 
                        backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* COL 1: TOUR & DESTINATION */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                            #{item.departure_id}
                          </span>
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                            📍 {item.destination || 'Điểm đến'}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4' }}>
                          {item.tour_name}
                        </div>
                      </td>

                      {/* COL 2: VEHICLE INFO */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          🚘 <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 10px', borderRadius: '6px' }}>
                            {item.license_plate}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                          <div>• Dòng xe: <strong>{item.brand_model || item.vehicle_type || 'Xe du lịch'}</strong> ({item.seat_capacity} chỗ)</div>
                          <div>• Màu xe: <strong>{item.color || 'Trắng'}</strong></div>
                        </div>
                        {item.vehicle_notes && (
                          <div style={{ marginTop: '6px', fontSize: '11px', color: '#059669', fontStyle: 'italic', background: '#ecfdf5', padding: '4px 8px', borderRadius: '6px' }}>
                            🛠️ {item.vehicle_notes}
                          </div>
                        )}
                      </td>

                      {/* COL 3: DATES */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>
                          📅 {item.start_date ? new Date(item.start_date).toLocaleDateString('vi-VN') : (item.departure_date ? new Date(item.departure_date).toLocaleDateString('vi-VN') : 'N/A')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          ➔ {item.end_date ? new Date(item.end_date).toLocaleDateString('vi-VN') : 'N/A'}
                        </div>
                      </td>

                      {/* COL 4: TOUR GUIDE */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🚩 {item.guide_name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa phân công HDV</span>}
                        </div>

                        {item.guide_phone && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>📞 {item.guide_phone}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <a 
                                href={`tel:${item.guide_phone}`}
                                style={{ background: '#dcfce7', color: '#15803d', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}
                              >
                                Gọi
                              </a>
                              <a 
                                href={`https://zalo.me/${item.guide_phone}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ background: '#e0f2fe', color: '#0369a1', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}
                              >
                                Zalo
                              </a>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* COL 5: STATUS */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                        <span style={{ 
                          backgroundColor: badge.bg, 
                          color: badge.color, 
                          border: `1px solid ${badge.border}`, 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          fontWeight: '800',
                          display: 'inline-block'
                        }}>
                          {badge.text}
                        </span>
                      </td>

                      {/* COL 6: ACTIONS */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'top', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleSelectTrip(item, 'driver_schedule')}
                            style={styles.btnPrimaryAction}
                          >
                            🚀 Nhận chuyến & Xem lịch
                          </button>

                          <button
                            onClick={() => handleSelectTrip(item, 'driver_expenses')}
                            style={styles.btnSecondaryAction}
                          >
                            💵 Kê khai chi phí
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>

          {/* EMPTY STATE */}
          {filteredAssignments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>Không tìm thấy chuyến xe nào được giao phù hợp với tìm kiếm.</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Thử thay đổi từ khóa hoặc xóa bộ lọc để xem đầy đủ danh sách.</div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

const styles = {
  btnRefresh: { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#334155', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  kpiCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
  searchInput: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#ffffff' },
  th: { padding: '14px 18px', color: '#334155', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  btnPrimaryAction: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', width: '100%', maxWidth: '170px' },
  btnSecondaryAction: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', width: '100%', maxWidth: '170px' }
};

export default DriverAssignedVehicles;
