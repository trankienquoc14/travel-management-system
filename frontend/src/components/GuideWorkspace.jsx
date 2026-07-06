import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/partner.css';

const GuideWorkspace = () => {
  const [works, setWorks] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passengersLoading, setPassengersLoading] = useState(false);
  const [searchPassenger, setSearchPassenger] = useState('');

  // Trạng thái bổ sung cho Hướng dẫn viên
  const [profile, setProfile] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [subTab, setSubTab] = useState('passengers'); // 'passengers', 'itinerary', hoặc 'map'
  const [groupLocation, setGroupLocation] = useState('Khách sạn trung tâm');

  // Trạng thái báo cáo sự cố
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '', location: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    fetchWork();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/guide/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải thông tin thẻ HDV:', error);
    }
  };

  const fetchWork = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/guide/work', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWorks(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách chuyến đi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDeparture = async (dept) => {
    setSelectedDeparture(dept);
    setSubTab('passengers');
    setItineraries([]);
    setGroupLocation('Khách sạn trung tâm');
    fetchPassengersAndIncidents(dept.departure_id);
    fetchItinerary(dept.tour_id);
  };

  const fetchItinerary = async (tourId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/guide/tours/${tourId}/itinerary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setItineraries(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải lịch trình chi tiết:', error);
    }
  };

  const fetchPassengersAndIncidents = async (departureId) => {
    setPassengersLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Lấy danh sách khách hàng
      const passRes = await axios.get(`http://localhost:5000/api/guide/departures/${departureId}/passengers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (passRes.data.success) {
        setPassengers(passRes.data.data);
      }

      // Lấy danh sách sự cố
      const incRes = await axios.get(`http://localhost:5000/api/guide/departures/${departureId}/incidents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (incRes.data.success) {
        setIncidents(incRes.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải thông tin đoàn:', error);
    } finally {
      setPassengersLoading(false);
    }
  };

  const handleCheckinToggle = async (passengerId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await axios.post(
        `http://localhost:5000/api/guide/passengers/${passengerId}/checkin`,
        { is_checked_in: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Cập nhật state cục bộ để giao diện phản hồi tức thì
        setPassengers(prev => 
          prev.map(p => p.passenger_id === passengerId ? { ...p, is_checked_in: newStatus } : p)
        );
      }
    } catch (error) {
      alert('Không thể cập nhật trạng thái điểm danh: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusChange = async (departureId, newStatus) => {
    if (!window.confirm(`Xác nhận chuyển trạng thái chuyến đi thành "${newStatus === 'Completed' ? 'Hoàn thành' : 'Đóng nhận khách'}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/guide/departures/${departureId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert('Cập nhật trạng thái chuyến đi thành công!');
        setWorks(prev => 
          prev.map(w => w.departure_id === departureId ? { ...w, status: newStatus } : w)
        );
        if (selectedDeparture && selectedDeparture.departure_id === departureId) {
          setSelectedDeparture(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      alert('Lỗi cập nhật trạng thái: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.title.trim()) return alert('Vui lòng nhập tiêu đề sự cố.');
    if (!incidentForm.description.trim()) return alert('Vui lòng mô tả chi tiết sự cố.');

    setIsReporting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('departure_id', selectedDeparture.departure_id);
      formData.append('title', incidentForm.title);
      formData.append('description', incidentForm.description);
      formData.append('location', incidentForm.location);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await axios.post(
        'http://localhost:5000/api/guide/incidents',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (res.data.success) {
        alert('Đã báo cáo sự cố lên Ban quản lý!');
        setShowIncidentModal(false);
        setIncidentForm({ title: '', description: '', location: '' });
        setSelectedFile(null);
        // Tải lại danh sách sự cố
        fetchPassengersAndIncidents(selectedDeparture.departure_id);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsReporting(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Open': return 'Đang mở (Nhận khách)';
      case 'Closed': return 'Đang đi (Đóng đoàn)';
      case 'Completed': return 'Đã kết thúc';
      default: return status;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return 'success';
      case 'Closed': return 'warning';
      case 'Completed': return 'secondary';
      default: return 'primary';
    }
  };

  // Lọc hành khách
  const filteredPassengers = passengers.filter(p => 
    p.full_name.toLowerCase().includes(searchPassenger.toLowerCase()) ||
    p.identity_number.toLowerCase().includes(searchPassenger.toLowerCase())
  );

  const checkedInCount = passengers.filter(p => p.is_checked_in === 1).length;

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải lịch trình làm việc của Hướng dẫn viên...</div>;
  }

  return (
    <div className="management-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 🚀 DANH SÁCH CHUYẾN ĐI ĐƯỢC PHÂN CÔNG */}
      {!selectedDeparture ? (
        <>
          <div className="management-header">
            <div>
              <h2>Lịch trình Chuyến đi được phân công</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Danh sách các tour bạn làm hướng dẫn viên dẫn đoàn. Hãy click "Quản lý đoàn" để điểm danh và cập nhật tình hình.
              </p>
            </div>
          </div>

          {/* 🌟 THÔNG TIN THẺ HƯỚNG DẪN VIÊN */}
          {profile && (
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#fff',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>🆔 Thẻ Hướng Dẫn Viên</h3>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px', opacity: 0.9 }}>
                  <div><strong>Họ và tên:</strong> {profile.full_name}</div>
                  <div><strong>Số thẻ (License):</strong> <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{profile.license_number || 'Chưa cập nhật'}</span></div>
                  <div><strong>Kinh nghiệm:</strong> {profile.experience_years || 0} năm</div>
                  <div><strong>Giới tính:</strong> {profile.gender === 'Male' ? 'Nam' : profile.gender === 'Female' ? 'Nữ' : 'Khác'}</div>
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 'bold',
                color: '#38bdf8'
              }}>
                Active Guide
              </div>
            </div>
          )}

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đoàn</th>
                  <th>Tên Tour</th>
                  <th>Điểm đến</th>
                  <th>Ngày khởi hành</th>
                  <th>Ngày về</th>
                  <th>Thời gian</th>
                  <th>Số khách</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {works.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                      Bạn chưa được phân công dẫn đoàn nào trong thời gian này.
                    </td>
                  </tr>
                ) : (
                  works.map(w => (
                    <tr key={w.departure_id}>
                      <td>#{w.departure_id}</td>
                      <td style={{ fontWeight: '600', color: '#0f172a' }}>{w.tour_name}</td>
                      <td>{w.destination}</td>
                      <td>{new Date(w.departure_date).toLocaleDateString('vi-VN')}</td>
                      <td>{new Date(w.return_date).toLocaleDateString('vi-VN')}</td>
                      <td>{w.duration_days} ngày</td>
                      <td>{w.max_slots - w.available_slots} / {w.max_slots} khách</td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(w.status)}`}>
                          {getStatusText(w.status)}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-action edit"
                          onClick={() => handleSelectDeparture(w)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px' }}
                        >
                          💼 Quản lý đoàn
                        </button>
                        
                        {w.status === 'Open' && (
                          <button 
                            className="btn-action delete"
                            onClick={() => handleStatusChange(w.departure_id, 'Closed')}
                            style={{ padding: '6px 10px', fontSize: '13px', backgroundColor: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1' }}
                            title="Đóng nhận khách để chuẩn bị đi"
                          >
                            Đóng đoàn
                          </button>
                        )}
                        {w.status === 'Closed' && (
                          <button 
                            className="btn-action edit"
                            onClick={() => handleStatusChange(w.departure_id, 'Completed')}
                            style={{ padding: '6px 10px', fontSize: '13px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                            title="Kết thúc tour"
                          >
                            Xong tour
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* 🚀 CHI TIẾT ĐOÀN KHÁCH & ĐIỂM DANH & LỊCH TRÌNH */
        <div>
          <div className="form-page-header" style={{ marginBottom: '15px' }}>
            <button className="btn-back" type="button" onClick={() => setSelectedDeparture(null)}>
              ⬅ Quay lại lịch trình
            </button>
            <h2>💼 Quản lý đoàn: {selectedDeparture.tour_name} (#{selectedDeparture.departure_id})</h2>
          </div>

          {/* 🌟 CHUYỂN TAB CON (Danh sách khách vs Lịch trình vs Bản đồ số) */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                background: subTab === 'passengers' ? '#0f172a' : '#f1f5f9',
                color: subTab === 'passengers' ? '#fff' : '#475569',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onClick={() => setSubTab('passengers')}
            >
              📋 Danh sách Điểm danh
            </button>
            <button 
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                background: subTab === 'itinerary' ? '#0f172a' : '#f1f5f9',
                color: subTab === 'itinerary' ? '#fff' : '#475569',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onClick={() => setSubTab('itinerary')}
            >
              🗺️ Lịch trình chi tiết ({itineraries.length} Ngày)
            </button>
            <button 
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                background: subTab === 'map' ? '#0f172a' : '#f1f5f9',
                color: subTab === 'map' ? '#fff' : '#475569',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onClick={() => setSubTab('map')}
            >
              📍 Định vị & Bản đồ số
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
            
            {/* CỘT TRÁI: Dữ liệu Tab Con */}
            {subTab === 'passengers' && (
              /* TAB 1: Điểm danh */
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Điểm danh hành khách trong đoàn</h3>
                  
                  <input 
                    type="text" 
                    placeholder="Tìm khách theo tên, CMND/CCCD..." 
                    value={searchPassenger}
                    onChange={(e) => setSearchPassenger(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      width: '260px',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {passengersLoading ? (
                  <div>Đang tải danh sách khách hàng...</div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Hành khách</th>
                          <th>Giới tính</th>
                          <th>Ngày sinh</th>
                          <th>CMND/CCCD</th>
                          <th>Người đặt (Liên hệ)</th>
                          <th>Trạng thái Điểm danh</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPassengers.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '15px' }}>
                              Không tìm thấy khách hàng nào.
                            </td>
                          </tr>
                        ) : (
                          filteredPassengers.map(p => (
                            <tr key={p.passenger_id}>
                              <td style={{ fontWeight: '600' }}>{p.full_name}</td>
                              <td>{p.gender === 'Male' ? 'Nam' : p.gender === 'Female' ? 'Nữ' : 'Khác'}</td>
                              <td>{p.birth_date ? new Date(p.birth_date).toLocaleDateString('vi-VN') : '—'}</td>
                              <td>{p.identity_number || '—'}</td>
                              <td>
                                <div style={{ fontSize: '13px' }}>{p.booker_name}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>SĐT: {p.booker_phone}</div>
                              </td>
                              <td>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={p.is_checked_in === 1}
                                    onChange={() => handleCheckinToggle(p.passenger_id, p.is_checked_in)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                  />
                                  <span 
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      color: p.is_checked_in === 1 ? '#15803d' : '#ef4444'
                                    }}
                                  >
                                    {p.is_checked_in === 1 ? '✅ Đã có mặt' : '❌ Vắng mặt'}
                                  </span>
                                </label>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {subTab === 'itinerary' && (
              /* TAB 2: Lịch trình Tour */
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px 0' }}>🗺️ Lịch trình chi tiết của Tour</h3>
                {itineraries.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    Tour này chưa được nhập lịch trình chi tiết từng ngày.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {itineraries.map((it) => (
                      <div 
                        key={it.itinerary_id} 
                        style={{ 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          padding: '16px',
                          background: '#f8fafc' 
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ 
                            background: '#3b82f6', 
                            color: '#fff', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontWeight: 'bold',
                            fontSize: '11px' 
                          }}>
                            NGÀY {it.day_number}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{it.title}</h4>
                        </div>
                        <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                          {it.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {subTab === 'map' && (
              /* TAB 3: Định vị & Bản đồ số */
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%' }}>
                <h3 style={{ margin: '0 0 4px 0' }}>📍 Bản đồ số định vị đoàn đi</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Bản đồ tương tác thời gian thực tại điểm đến: <strong>{selectedDeparture.destination}</strong>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '20px' }}>
                  {/* Bản đồ nhúng OpenStreetMap */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '350px' }}>
                    <iframe 
                      title="OpenStreetMap"
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight="0" 
                      marginWidth="0" 
                      src={
                        selectedDeparture.destination.includes('Phú Quốc') 
                          ? "https://www.openstreetmap.org/export/embed.html?bbox=103.85%2C10.10%2C104.05%2C10.35&layer=mapnik&marker=10.2198%2C103.9568"
                          : selectedDeparture.destination.includes('Sapa') || selectedDeparture.destination.includes('Lào Cai')
                          ? "https://www.openstreetmap.org/export/embed.html?bbox=103.78%2C22.28%2C103.90%2C22.38&layer=mapnik&marker=22.3364%2C103.8438"
                          : "https://www.openstreetmap.org/export/embed.html?bbox=108.4287%2C11.9164%2C108.4878%2C11.9602&layer=mapnik&marker=11.9404%2C108.4583"
                      }
                      style={{ border: 'none' }}
                    />
                  </div>

                  {/* Panel cập nhật vị trí */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>📍 Vị trí hiện tại của đoàn</h4>
                      <select 
                        value={groupLocation} 
                        onChange={(e) => setGroupLocation(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                      >
                        <option value="Điểm đón khách (Sân bay/Bến xe)">🚌 Điểm đón khách</option>
                        <option value="Đang di chuyển trên xe">🚌 Đang di chuyển trên xe</option>
                        <option value="Điểm tham quan / Vui chơi">🏞️ Điểm tham quan / Vui chơi</option>
                        <option value="Nhà hàng ăn trưa/tối">🍽️ Nhà hàng ăn trưa/tối</option>
                        <option value="Khách sạn nghỉ ngơi">🏨 Khách sạn nghỉ ngơi</option>
                      </select>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>👥 Trạng thái vị trí khách</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                        {passengers.map(p => (
                          <div key={p.passenger_id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px dashed #e2e8f0' }}>
                            <span style={{ fontWeight: '500' }}>{p.full_name}</span>
                            <span style={{ fontWeight: 'bold', color: p.is_checked_in === 1 ? '#166534' : '#991b1b' }}>
                              {p.is_checked_in === 1 ? `${groupLocation.split(' ')[1] || 'Đoàn'}` : 'Chưa tập trung'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CỘT PHẢI: Thống kê & Báo cáo sự cố */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Thẻ Thống kê Điểm danh */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>📊 Thống kê Điểm danh</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tổng số khách:</span>
                    <strong style={{ color: '#0f172a' }}>{passengers.length} người</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Đã có mặt:</span>
                    <strong style={{ color: '#166534' }}>{checkedInCount} người</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Chưa có mặt:</span>
                    <strong style={{ color: '#991b1b' }}>{passengers.length - checkedInCount} người</strong>
                  </div>
                  
                  {/* Thanh Tiến trình (Progress bar) */}
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' }}>
                    <div 
                      style={{ 
                        width: `${passengers.length > 0 ? (checkedInCount / passengers.length) * 100 : 0}%`, 
                        height: '100%', 
                        background: '#10b981', 
                        transition: 'width 0.3s ease' 
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Thẻ Sự cố chuyến đi */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>⚠️ Sự cố Đoàn đi</h4>
                  <button 
                    onClick={() => setShowIncidentModal(true)}
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '12px', 
                      backgroundColor: '#fee2e2', 
                      color: '#dc2626', 
                      border: '1px solid #fca5a5', 
                      borderRadius: '4px', 
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    + Báo cáo khẩn
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {incidents.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
                      Chưa ghi nhận sự cố nào trong đoàn.
                    </div>
                  ) : (
                    incidents.map(inc => (
                      <div 
                        key={inc.incident_id} 
                        style={{ 
                          padding: '10px', 
                          background: inc.status === 'Resolved' ? '#f0fdf4' : '#fef2f2', 
                          borderLeft: `4px solid ${inc.status === 'Resolved' ? '#10b981' : '#ef4444'}`, 
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ color: inc.status === 'Resolved' ? '#14532d' : '#991b1b' }}>{inc.title}</strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {inc.status === 'Resolved' ? '✅ Đã xử lý' : '⏳ Đang chờ'}
                          </span>
                        </div>
                        {inc.location && (
                          <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '4px', fontWeight: 'bold' }}>
                            📍 Vị trí: {inc.location}
                          </div>
                        )}
                        <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{inc.description}</p>
                        
                        {inc.image_url && (
                          <div style={{ marginTop: '6px' }}>
                            <a 
                              href={`http://localhost:5000${inc.image_url}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'underline', fontWeight: 'bold' }}
                            >
                              🖼️ Xem ảnh hiện trường
                            </a>
                          </div>
                        )}
                        
                        {inc.resolution_notes && (
                          <div style={{ marginTop: '8px', padding: '6px', background: '#fff', border: '1px dashed #bbf7d0', borderRadius: '4px', fontSize: '11px' }}>
                            <strong style={{ color: '#166534' }}>Phản hồi giải quyết:</strong>
                            <p style={{ margin: '2px 0 0 0', color: '#14532d', whiteSpace: 'pre-line' }}>{inc.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL BÁO CÁO SỰ CỐ KHẨN CẤP */}
      {showIncidentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: '24px', borderRadius: '12px',
            width: '480px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚨 Báo cáo sự cố khẩn cấp
            </h3>
            
            <form onSubmit={handleReportIncident}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Tiêu đề sự cố *</label>
                <input 
                  type="text" 
                  value={incidentForm.title}
                  onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  placeholder="Ví dụ: Xe hư dọc đường, Khách bị lạc..." 
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>📍 Vị trí hiện tại (Địa danh / Tọa độ) *</label>
                <input 
                  type="text" 
                  value={incidentForm.location}
                  onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                  placeholder="Ví dụ: Đèo Prenn Đà Lạt, Khách sạn TTC..." 
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>📷 Ảnh chụp hiện trường sự cố</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ width: '100%', padding: '6px 0', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Mô tả chi tiết sự cố & Đề xuất phương án *</label>
                <textarea 
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  placeholder="Mô tả cụ thể sự việc, tình trạng hiện tại của khách và phương án xử lý (nếu có)..."
                  rows="4"
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-cancel-lg"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => setShowIncidentModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-save-lg" 
                  style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: '#ef4444', border: '1px solid #ef4444' }}
                  disabled={isReporting}
                >
                  {isReporting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GuideWorkspace;
