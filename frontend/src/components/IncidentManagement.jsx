import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/partner.css';

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Open', 'Resolved'
  const [searchQuery, setSearchQuery] = useState('');

  // Trạng thái xử lý sự cố (Modal giải quyết)
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/tours/incidents/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIncidents(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách sự cố:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolveModal = (incident) => {
    setSelectedIncident(incident);
    setResolutionNotes(incident.resolution_notes || '');
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return alert('Vui lòng nhập ghi chú hoặc chỉ đạo giải quyết sự cố.');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/tours/incidents/${selectedIncident.incident_id}/status`,
        {
          status: 'Resolved',
          resolution_notes: resolutionNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert('Đã cập nhật trạng thái giải quyết sự cố thành công!');
        setShowResolveModal(false);
        setSelectedIncident(null);
        setResolutionNotes('');
        fetchIncidents();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenIncident = async (id) => {
    if (!window.confirm('Bạn có muốn mở lại sự cố này và tiếp tục xử lý?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/tours/incidents/${id}/status`,
        {
          status: 'Open',
          resolution_notes: '' // Xóa ghi chú cũ hoặc giữ lại tùy chọn
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert('Đã mở lại sự cố thành công!');
        fetchIncidents();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể mở lại sự cố.');
    }
  };

  // Lọc danh sách sự cố
  const filteredIncidents = incidents.filter(inc => {
    // Lọc theo trạng thái
    if (filterStatus !== 'All' && inc.status !== filterStatus) {
      return false;
    }
    // Lọc theo từ khóa tìm kiếm
    const query = searchQuery.toLowerCase();
    return (
      inc.title.toLowerCase().includes(query) ||
      inc.description.toLowerCase().includes(query) ||
      inc.tour_name.toLowerCase().includes(query) ||
      inc.guide_name.toLowerCase().includes(query) ||
      (inc.location && inc.location.toLowerCase().includes(query))
    );
  });

  const openCount = incidents.filter(i => i.status === 'Open').length;
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;

  if (loading && incidents.length === 0) {
    return <div style={{ padding: 20 }}>Đang tải danh sách sự cố từ các đoàn đi...</div>;
  }

  return (
    <div className="management-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="management-header">
        <div>
          <h2>Xử lý Sự cố Vận hành Tour</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Xem và cập nhật phản hồi giải quyết đối với các sự cố do Hướng dẫn viên báo cáo từ các đoàn đi thực tế.
          </p>
        </div>
      </div>

      {/* THẺ TỔNG QUAN THỐNG KÊ NHANH */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Tổng số sự cố ghi nhận</div>
          <strong style={{ fontSize: '24px', color: '#0f172a' }}>{incidents.length} sự cố</strong>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Sự cố đang chờ xử lý</div>
          <strong style={{ fontSize: '24px', color: '#ef4444' }}>{openCount} sự cố</strong>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Sự cố đã khắc phục</div>
          <strong style={{ fontSize: '24px', color: '#10b981' }}>{resolvedCount} sự cố</strong>
        </div>
      </div>

      {/* THANH BỘ LỌC TÌM KIẾM */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#fff', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div>
          <label style={{ fontSize: '13px', color: '#64748b', marginRight: '8px', fontWeight: '600' }}>Bộ lọc:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
          >
            <option value="All">Tất cả sự cố</option>
            <option value="Open">🔴 Đang chờ xử lý</option>
            <option value="Resolved">🟢 Đã giải quyết</option>
          </select>
        </div>

        <input 
          type="text" 
          placeholder="Tìm theo sự cố, vị trí, tour, hướng dẫn viên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            flex: 1,
            fontSize: '13px'
          }}
        />
      </div>

      {/* BẢNG DANH SÁCH SỰ CỐ */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã sự cố</th>
              <th>Đoàn & Tour</th>
              <th>Hướng dẫn viên</th>
              <th>Thông tin Sự cố (Vị trí & Ảnh)</th>
              <th>Mô tả chi tiết</th>
              <th>Giải quyết (Phản hồi)</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  Không tìm thấy sự cố nào.
                </td>
              </tr>
            ) : (
              filteredIncidents.map(inc => (
                <tr key={inc.incident_id} style={{ backgroundColor: inc.status === 'Open' ? '#fff5f5' : '#fff' }}>
                  <td>#{inc.incident_id}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{inc.tour_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Đoàn: #{inc.departure_id} - Khởi hành: {new Date(inc.departure_date).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td>
                    <div>{inc.guide_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>SĐT: {inc.guide_phone} (Mã thẻ: {inc.license_number})</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#b91c1c', marginBottom: '4px' }}>{inc.title}</div>
                    
                    {inc.location && (
                      <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '6px' }}>
                        📍 Vị trí: <strong>{inc.location}</strong>
                      </div>
                    )}
                    
                    {inc.image_url ? (
                      <div style={{ marginTop: '4px' }}>
                        <a 
                          href={`http://localhost:5000${inc.image_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#1d4ed8',
                            textDecoration: 'none',
                            fontWeight: '600'
                          }}
                        >
                          📷 Xem ảnh hiện trường
                        </a>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Không có ảnh đính kèm</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '240px', fontSize: '13px', whiteSpace: 'pre-line' }}>
                    {inc.description}
                  </td>
                  <td style={{ maxWidth: '240px', fontSize: '13px', whiteSpace: 'pre-line' }}>
                    {inc.resolution_notes ? (
                      <div style={{ padding: '6px 10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#334155' }}>
                        {inc.resolution_notes}
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có phản hồi</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${inc.status === 'Resolved' ? 'success' : 'danger'}`}>
                      {inc.status === 'Resolved' ? 'Đã giải quyết' : 'Đang chờ xử lý'}
                    </span>
                  </td>
                  <td>
                    {inc.status === 'Open' ? (
                      <button 
                        onClick={() => handleOpenResolveModal(inc)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✔️ Giải quyết & Phản hồi
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleReopenIncident(inc.incident_id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Mở lại sự cố
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 MODAL ĐIỀU HÀNH / PHẢN HỒI GIẢI QUYẾT SỰ CỐ */}
      {showResolveModal && selectedIncident && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: '24px', borderRadius: '12px',
            width: '480px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#15803d' }}>
              ✔️ Phản hồi giải quyết sự cố
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Nhập phương án chỉ đạo, khắc phục sự cố cho đoàn của HDV <strong>{selectedIncident.guide_name}</strong>.
            </p>

            <form onSubmit={handleResolveSubmit}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                <div><strong>Sự cố:</strong> <span style={{ color: '#b91c1c', fontWeight: '600' }}>{selectedIncident.title}</span></div>
                {selectedIncident.location && <div style={{ marginTop: '4px' }}><strong>📍 Vị trí:</strong> {selectedIncident.location}</div>}
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Nội dung chỉ đạo / Phương án khắc phục *</label>
                <textarea 
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ví dụ: Đã liên hệ điều xe cứu hộ của đối tác tại Đà Lạt đến hỗ trợ. Dự kiến 30 phút có mặt để trung chuyển khách..."
                  rows="4"
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-cancel-lg"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => { setShowResolveModal(false); setSelectedIncident(null); }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-save-lg" 
                  style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#15803d', border: '1px solid #15803d' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận giải quyết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default IncidentManagement;
