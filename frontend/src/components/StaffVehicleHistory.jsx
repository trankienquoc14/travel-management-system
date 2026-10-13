import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffVehicleHistory = () => {
  const [vehicles, setVehicles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchHistory(selectedVehicleId);
    } else {
      setHistory([]);
    }
  }, [selectedVehicleId]);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
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
      setLoadingVehicles(false);
    }
  };

  const fetchHistory = async (vid) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/tours/fleet/staff/vehicles/${vid}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch sử:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải lịch sử xe.' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatStatus = (s) => {
    if (s === 'AVAILABLE') return 'Sẵn sàng';
    if (s === 'IN_TOUR') return 'Đang đi Tour';
    if (s === 'MAINTENANCE') return 'Đang bảo dưỡng';
    if (s === 'REPAIR') return 'Đang sửa chữa';
    if (s === 'INACTIVE') return 'Tạm ngưng';
    return s;
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerArea}>
        <div>
          <h1 style={styles.pageTitle}>Lịch sử trạng thái xe (Office Staff)</h1>
          <p style={styles.pageSubtitle}>Xem log thay đổi trạng thái của từng phương tiện</p>
        </div>
      </div>

      {alertMsg.text && (
        <div style={{...styles.alert, backgroundColor: alertMsg.type === 'error' ? '#fee2e2' : '#dcfce7', color: alertMsg.type === 'error' ? '#991b1b' : '#166534'}}>
          {alertMsg.text}
          <span style={styles.closeAlert} onClick={() => setAlertMsg({type: '', text: ''})}>&times;</span>
        </div>
      )}

      <div style={styles.filterBar}>
        <label style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '12px' }}>Chọn phương tiện:</label>
        {loadingVehicles ? (
          <span>Đang tải danh sách...</span>
        ) : (
          <select 
            style={styles.select} 
            value={selectedVehicleId} 
            onChange={(e) => setSelectedVehicleId(e.target.value)}
          >
            <option value="">-- Chọn một xe để xem lịch sử --</option>
            {vehicles.map(v => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.license_plate} - {v.brand_model}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedVehicleId ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Vui lòng chọn một xe ở trên để xem lịch sử.</div>
      ) : loadingHistory ? (
        <div style={styles.loading}>Đang tải dữ liệu...</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Thời gian</th>
                <th style={styles.th}>Trạng thái cũ</th>
                <th style={styles.th}>Trạng thái mới</th>
                <th style={styles.th}>Lý do / Ghi chú</th>
                <th style={styles.th}>Người cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.history_id}>
                  <td style={styles.td}>{new Date(h.created_at).toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(h.old_status)}>{formatStatus(h.old_status)}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge(h.new_status)}>{formatStatus(h.new_status)}</span>
                  </td>
                  <td style={styles.td}>{h.reason || '-'}</td>
                  <td style={styles.td}>{h.user_name || 'Hệ thống'}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Chưa có lịch sử trạng thái cho xe này.</td>
                </tr>
              )}
            </tbody>
          </table>
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
  filterBar: { display: 'flex', alignItems: 'center', marginBottom: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  select: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff', minWidth: '300px' },
  tableContainer: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: '700', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b' },
  badge: (status) => {
    let bg = '#e2e8f0'; let c = '#475569';
    if (status === 'AVAILABLE') { bg = '#dcfce7'; c = '#166534'; }
    if (status === 'IN_TOUR') { bg = '#fef9c3'; c = '#854d0e'; }
    if (status === 'MAINTENANCE') { bg = '#ffedd5'; c = '#9a3412'; }
    if (status === 'REPAIR') { bg = '#fee2e2'; c = '#991b1b'; }
    return { backgroundColor: bg, color: c, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', display: 'inline-block' };
  },
  alert: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '500' },
  closeAlert: { cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' },
  loading: { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '15px' }
};

export default StaffVehicleHistory;
