import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffVehicleIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Filter States
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Resolve Form Data
  const [resolveData, setResolveData] = useState({
    action: 'REPAIR',
    reason: ''
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/tours/fleet/staff/incidents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setIncidents(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách sự cố:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải dữ liệu sự cố.' });
    } finally {
      setLoading(false);
    }
  };

  const openResolveModal = (inc) => {
    setSelectedIncident(inc);
    setResolveData({
      action: 'REPAIR',
      reason: ''
    });
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const token = localStorage.getItem('token');
      const payload = {
        status: resolveData.action === 'RESOLVED' ? 'Resolved' : 'Processing',
        action: resolveData.action,
        reason: resolveData.reason
      };
      await axios.put(`${GATEWAY_URL}/api/tours/fleet/staff/incidents/${selectedIncident.incident_id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMsg({ type: 'success', text: `Đã xử lý sự cố thành công!` });
      setShowResolveModal(false);
      fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật sự cố');
    }
  };

  const filteredIncidents = incidents.filter(i => {
    if (filterStatus === 'ALL') return true;
    return i.status === filterStatus;
  });

  return (
    <div style={styles.container}>
      <div style={styles.headerArea}>
        <div>
          <h1 style={styles.pageTitle}>Báo cáo sự cố xe (Office Staff)</h1>
          <p style={styles.pageSubtitle}>Tiếp nhận và xử lý sự cố từ tài xế</p>
        </div>
        <div>
          <button style={styles.btnSecondary} onClick={fetchIncidents}>
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

      <div style={styles.filterBar}>
        <select style={styles.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">Tất cả sự cố</option>
          <option value="Reported">Chưa xử lý (Reported)</option>
          <option value="Processing">Đang xử lý (Processing)</option>
          <option value="Resolved">Đã giải quyết (Resolved)</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Đang tải dữ liệu...</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Mã sự cố</th>
                <th style={styles.th}>Biển số</th>
                <th style={styles.th}>Loại xe / Dòng xe</th>
                <th style={styles.th}>Tiêu đề / Mô tả</th>
                <th style={styles.th}>Thời gian báo</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(inc => (
                <tr key={inc.incident_id}>
                  <td style={styles.td}>SC-{inc.incident_id.toString().padStart(4, '0')}</td>
                  <td style={styles.td}><strong>{inc.vehicle_number}</strong></td>
                  <td style={styles.td}>{inc.brand_model || 'N/A'}</td>
                  <td style={styles.td}>
                    <strong>{inc.title}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{inc.description}</div>
                  </td>
                  <td style={styles.td}>{new Date(inc.created_at).toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(inc.status)}>
                      {inc.status === 'Reported' ? 'Chưa xử lý' : inc.status === 'Processing' ? 'Đang xử lý' : 'Đã giải quyết'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {inc.status !== 'Resolved' && (
                      <button style={styles.btnPrimarySmall} onClick={() => openResolveModal(inc)}>Xử lý</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Không có sự cố nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Xử Lý Sự Cố */}
      {showResolveModal && selectedIncident && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h2 style={{ marginTop: 0, fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              Xử lý sự cố: SC-{selectedIncident.incident_id.toString().padStart(4, '0')}
            </h2>
            <form onSubmit={handleResolveSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>Xe báo cáo: <strong>{selectedIncident.vehicle_number}</strong></div>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>Nội dung: {selectedIncident.description}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Hướng xử lý</label>
                <select 
                  style={styles.select} 
                  value={resolveData.action}
                  onChange={(e) => setResolveData({ ...resolveData, action: e.target.value })}
                  required
                >
                  <option value="REPAIR">Đưa xe vào Đang sửa chữa (Cập nhật trạng thái xe)</option>
                  <option value="PROCESSING">Đang xử lý (Không đổi trạng thái xe)</option>
                  <option value="RESOLVED">Đánh dấu đã giải quyết xong</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>Ghi chú xử lý / Lý do</label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Ghi chú các bước đã xử lý..."
                  value={resolveData.reason}
                  onChange={(e) => setResolveData({ ...resolveData, reason: e.target.value })}
                  style={styles.input}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowResolveModal(false)} style={styles.btnSecondary}>Hủy</button>
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
  container: { padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  headerArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' },
  pageSubtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  btnPrimary: { backgroundColor: '#0194f3', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  btnPrimarySmall: { backgroundColor: '#0194f3', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
  btnSecondary: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' },
  filterBar: { display: 'flex', gap: '12px', marginBottom: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  input: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', width: '100%', boxSizing: 'border-box' },
  select: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', backgroundColor: '#fff', minWidth: '200px' },
  tableContainer: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '13px', fontWeight: '700', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b' },
  badge: (status) => {
    let bg = '#e2e8f0'; let c = '#475569';
    if (status === 'Reported') { bg = '#fee2e2'; c = '#991b1b'; }
    if (status === 'Processing') { bg = '#fef9c3'; c = '#854d0e'; }
    if (status === 'Resolved') { bg = '#dcfce7'; c = '#166534'; }
    return { backgroundColor: bg, color: c, padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', display: 'inline-block' };
  },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#fff', width: '500px', maxWidth: '90%', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' },
  alert: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '500' },
  closeAlert: { cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' },
  loading: { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '15px' }
};

export default StaffVehicleIncidents;
