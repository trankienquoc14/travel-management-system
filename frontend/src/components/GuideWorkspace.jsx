import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/partner.css';

const GuideWorkspace = ({ activeTab, selectedDeparture, setSelectedDeparture, setActiveTab }) => {
  const [works, setWorks] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passengersLoading, setPassengersLoading] = useState(false);
  const [searchPassenger, setSearchPassenger] = useState('');

  // Trạng thái hồ sơ Hướng dẫn viên
  const [profile, setProfile] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [groupLocation, setGroupLocation] = useState('Khách sạn nghỉ ngơi');

  // Trạng thái báo cáo sự cố
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: '', description: '', location: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isReporting, setIsReporting] = useState(false);

  // Trạng thái cập nhật hành trình liên tục (Live Trip Updates)
  const [tripUpdates, setTripUpdates] = useState([]);
  const [updatesMigrationNeeded, setUpdatesMigrationNeeded] = useState(false);
  const [updatesSql, setUpdatesSql] = useState('');
  const [updateForm, setUpdateForm] = useState({ location: '', activity: '🚌 Di chuyển', description: '' });
  const [selectedUpdateFile, setSelectedUpdateFile] = useState(null);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);

  // Trạng thái giám sát dành cho Admin/Manager
  const [guidesList, setGuidesList] = useState([]);
  const [selectedGuideId, setSelectedGuideId] = useState('all');

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isAdminOrManager = currentUser && [1, 2, 3, '1', '2', '3'].includes(currentUser.role);

  useEffect(() => {
    if (isAdminOrManager) {
      fetchGuidesList();
    }
    fetchWork('all');
    fetchProfile('all');
  }, []);

  // Tự động tải dữ liệu đoàn khi đoàn được chọn thay đổi
  useEffect(() => {
    if (selectedDeparture) {
      fetchPassengersAndIncidents(selectedDeparture.departure_id);
      fetchItinerary(selectedDeparture.tour_id);
      fetchTripUpdates(selectedDeparture.departure_id);
    }
  }, [selectedDeparture]);

  const fetchGuidesList = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/guide/all-guides', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setGuidesList(res.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách Hướng dẫn viên:', error);
    }
  };

  const fetchProfile = async (guideId = selectedGuideId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/guide/profile?guide_id=${guideId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải thông tin thẻ HDV:', error);
    }
  };

  const fetchWork = async (guideId = selectedGuideId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/guide/work?guide_id=${guideId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWorks(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedDeparture(res.data.data[0]);
        } else {
          setSelectedDeparture(null);
        }
      }
    } catch (error) {
      console.error('Lỗi tải danh sách chuyến đi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuideChange = (newGuideId) => {
    setSelectedGuideId(newGuideId);
    fetchWork(newGuideId);
    fetchProfile(newGuideId);
  };

  const fetchTripUpdates = async (departureId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/guide/departures/${departureId}/updates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTripUpdates(res.data.data);
        setUpdatesMigrationNeeded(res.data.needs_db_migration);
        if (res.data.needs_db_migration) {
          setUpdatesSql(res.data.sql);
          // Nạp dữ liệu giả lập từ LocalStorage nếu chưa di trú CSDL
          const localData = localStorage.getItem(`trip_updates_${departureId}`);
          if (localData) {
            setTripUpdates(JSON.parse(localData));
          } else {
            setTripUpdates([]);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải nhật ký hành trình:', err);
    }
  };

  const handleSelectDeparture = (dept) => {
    setSelectedDeparture(dept);
    setSearchPassenger('');
    setGroupLocation('Khách sạn nghỉ ngơi');
    setActiveTab('guide_passengers');
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
        setPassengers(prev => 
          prev.map(p => p.passenger_id === passengerId ? { ...p, is_checked_in: newStatus } : p)
        );
      }
    } catch (error) {
      alert('Không thể cập nhật trạng thái điểm danh: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusChange = async (departureId, newStatus) => {
    const statusMsg = newStatus === 'Completed' ? 'Hoàn thành chuyến đi' : newStatus === 'Closed' ? 'Đóng nhận khách & Bắt đầu đi' : 'Mở lại đoàn';
    if (!window.confirm(`Xác nhận chuyển trạng thái chuyến đi thành "${statusMsg}"?`)) {
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
        fetchPassengersAndIncidents(selectedDeparture.departure_id);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsReporting(false);
    }
  };

  const handlePostTripUpdate = async (e) => {
    e.preventDefault();
    if (!updateForm.location.trim()) return alert('Vui lòng nhập vị trí hiện tại của đoàn!');
    if (!updateForm.description.trim()) return alert('Vui lòng viết mô tả hoạt động hành trình!');

    setIsPostingUpdate(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('location', updateForm.location);
      formData.append('activity', updateForm.activity);
      formData.append('description', updateForm.description);
      if (selectedUpdateFile) {
        formData.append('image', selectedUpdateFile);
      }

      const res = await axios.post(
        `http://localhost:5000/api/guide/departures/${selectedDeparture.departure_id}/updates`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (res.data.success) {
        if (res.data.needs_db_migration) {
          // Lưu vào LocalStorage ở chế độ mô phỏng
          const simulatedLog = {
            update_id: Date.now(),
            departure_id: selectedDeparture.departure_id,
            location: updateForm.location,
            activity: updateForm.activity,
            description: updateForm.description,
            image_url: selectedUpdateFile ? URL.createObjectURL(selectedUpdateFile) : null,
            created_at: new Date().toISOString()
          };

          const existing = [...tripUpdates];
          existing.unshift(simulatedLog);
          localStorage.setItem(`trip_updates_${selectedDeparture.departure_id}`, JSON.stringify(existing));
          setTripUpdates(existing);
          alert('Đăng nhật ký thành công! (Chế độ mô phỏng Local)');
        } else {
          alert('Cập nhật nhật ký hành trình chuyến đi thành công!');
          fetchTripUpdates(selectedDeparture.departure_id);
        }

        // Reset Form
        setUpdateForm({ location: '', activity: '🚌 Di chuyển', description: '' });
        setSelectedUpdateFile(null);
        // Reset input file
        const fileInput = document.getElementById('update-image-input');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể đăng nhật ký cập nhật!');
    } finally {
      setIsPostingUpdate(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Open': return 'Mở đăng ký (Open)';
      case 'Closed': return 'Đang di chuyển (Closed)';
      case 'Completed': return 'Hoàn thành (Completed)';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return { bg: '#e0f2fe', text: '#0369a1', dot: '#0284c7' };
      case 'Closed': return { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' };
      case 'Completed': return { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' };
      default: return { bg: '#f1f5f9', text: '#475569', dot: '#64748b' };
    }
  };

  const getActivityBadgeColor = (activity) => {
    switch (activity) {
      case '🚌 Di chuyển': return { bg: '#eff6ff', text: '#1e40af' };
      case '📋 Check-in': return { bg: '#ecfdf5', text: '#065f46' };
      case '🏞️ Tham quan': return { bg: '#f0fdf4', text: '#166534' };
      case '🍽️ Ăn uống': return { bg: '#fff7ed', text: '#9a3412' };
      case '🏨 Nghỉ ngơi': return { bg: '#f5f3ff', text: '#5b21b6' };
      default: return { bg: '#f1f5f9', text: '#334155' };
    }
  };

  const filteredPassengers = passengers.filter(p => 
    p.full_name?.toLowerCase().includes(searchPassenger.toLowerCase()) ||
    p.identity_number?.toLowerCase().includes(searchPassenger.toLowerCase())
  );

  const checkedInCount = passengers.filter(p => p.is_checked_in === 1).length;
  const activeToursCount = works.filter(w => w.status === 'Closed').length;
  const totalPassengersCount = works.reduce((sum, w) => sum + (w.max_slots - w.available_slots), 0);
  const activeIncidentsCount = incidents.filter(i => i.status !== 'Resolved').length;

  // Render dropdown chọn đoàn dành riêng cho các tab chi tiết (ERP Professional Selector)
  const renderDepartureSelector = () => (
    <div style={{
      background: '#fff',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>🔄 Đang xem dữ liệu của đoàn:</span>
        <select
          value={selectedDeparture ? selectedDeparture.departure_id : ''}
          onChange={(e) => {
            const deptId = parseInt(e.target.value);
            const matched = works.find(w => w.departure_id === deptId);
            if (matched) {
              setSelectedDeparture(matched);
            }
          }}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            fontWeight: '700',
            color: '#1e3a8a',
            background: '#f8fafc',
            outline: 'none',
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
        >
          {works.map(w => (
            <option key={w.departure_id} value={w.departure_id}>
              {w.tour_name} (Đoàn #{w.departure_id} - Ngày đi: {new Date(w.departure_date).toLocaleDateString('vi-VN')})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {selectedDeparture && selectedDeparture.status === 'Open' && (
          <button
            onClick={() => handleStatusChange(selectedDeparture.departure_id, 'Closed')}
            style={{ padding: '8px 14px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
          >
            🚀 Đóng đoàn & Đi Tour
          </button>
        )}
        {selectedDeparture && selectedDeparture.status === 'Closed' && (
          <button
            onClick={() => handleStatusChange(selectedDeparture.departure_id, 'Completed')}
            style={{ padding: '8px 14px', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
          >
            ✅ Hoàn thành Tour
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #1e3a8a', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>Đang tải lịch trình dẫn đoàn...</p>
        </div>
      </div>
    );
  }

  // LOGIC ERP KHÔNG CÓ ĐOÀN NÀO ĐƯỢC GÁN
  if (works.length === 0) {
    return (
      <div style={{ padding: '0px', background: '#f8fafc', minHeight: '80vh', fontFamily: "'Inter', sans-serif" }}>
        {isAdminOrManager && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '18px 24px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🛡️ CHẾ ĐỘ GIÁM SÁT DÀNH CHO ADMIN & MANAGER
              </div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800' }}>
                👁️ Theo Dõi Công Việc & Lịch Trình Của Hướng Dẫn Viên
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>Xem Công Việc Của HDV:</span>
              <select
                value={selectedGuideId}
                onChange={(e) => handleGuideChange(e.target.value)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1px solid #475569',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <option value="all">🌐 Tất cả Hướng dẫn viên (Toàn hệ thống)</option>
                {guidesList.map(g => (
                  <option key={g.guide_id} value={g.guide_id}>
                    🚩 HDV #{g.guide_id}: {g.full_name} ({g.phone || g.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ padding: '40px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Không tìm thấy chuyến đi được gán</h3>
          <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            Hướng dẫn viên này hiện chưa được phân công dẫn đoàn nào hoặc chưa có chuyến đi phù hợp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0px', background: '#f8fafc', minHeight: '80vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🚀 BANNER DÀNH RIÊNG CHO ADMIN & QUẢN LÝ: CHỌN HDV ĐỂ GIÁM SÁT CÔNG VIỆC */}
      {isAdminOrManager && (
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '18px 24px',
          borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🛡️ CHẾ ĐỘ GIÁM SÁT DÀNH CHO ADMIN & MANAGER
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800' }}>
              👁️ Theo Dõi Công Việc & Lịch Trình Của Hướng Dẫn Viên
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1' }}>Xem Công Việc Của HDV:</span>
            <select
              value={selectedGuideId}
              onChange={(e) => handleGuideChange(e.target.value)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid #475569',
                background: '#1e293b',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <option value="all">🌐 Tất cả Hướng dẫn viên (Toàn hệ thống)</option>
              {guidesList.map(g => (
                <option key={g.guide_id} value={g.guide_id}>
                  🚩 HDV #{g.guide_id}: {g.full_name} ({g.phone || g.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 🚀 TAB 1: DANH SÁCH CHUYẾN ĐI ĐƯỢC PHÂN CÔNG */}
      {activeTab === 'guide_work' && (
        <>
          {/* Thông báo chuyến đi đang chọn (nếu có) */}
          {selectedDeparture && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '12px 20px',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              color: '#1e3a8a'
            }}>
              <span>
                ℹ️ Bạn đang chọn đoàn: <strong>{selectedDeparture.tour_name} (#{selectedDeparture.departure_id})</strong>.
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setActiveTab('guide_passengers')}
                  style={{ background: '#1e3a8a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Vào Quản lý đoàn ➡️
                </button>
                <button 
                  onClick={() => setSelectedDeparture(null)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Hủy chọn
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>📋 Danh sách chuyến đi được phân công</h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Nhấp "Bắt đầu Quản lý đoàn" để xem thông tin hành khách, điểm danh và báo cáo sự cố hành trình.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {works.map(w => {
              const colors = getStatusColor(w.status);
              const bookedCount = w.max_slots - w.available_slots;
              const fillPercent = Math.min(100, Math.round((bookedCount / w.max_slots) * 100));
              const isCurrentActive = selectedDeparture?.departure_id === w.departure_id;
              
              return (
                <div key={w.departure_id} style={{
                  background: '#fff',
                  borderRadius: '16px',
                  border: isCurrentActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: isCurrentActive ? '0 10px 15px -3px rgba(59,130,246,0.15)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }} onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 20px -3px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }} onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = isCurrentActive ? '0 10px 15px -3px rgba(59,130,246,0.15)' : '0 4px 6px -1px rgba(0,0,0,0.02)';
                  e.currentTarget.style.transform = 'none';
                }}>
                  {/* Header Card */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>Mã đoàn: #{w.departure_id}</span>
                      <span style={{
                        background: colors.bg,
                        color: colors.text,
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.dot }}></span>
                        {getStatusText(w.status)}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4' }}>{w.tour_name}</h4>
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📍 Điểm đến:</span> <strong>{w.destination}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '2px' }}>Khởi hành:</div>
                        <strong style={{ color: '#334155' }}>{new Date(w.departure_date).toLocaleDateString('vi-VN')}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '2px' }}>Trở về:</div>
                        <strong style={{ color: '#334155' }}>{new Date(w.return_date).toLocaleDateString('vi-VN')}</strong>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#64748b' }}>Thời gian đi:</span> <strong style={{ color: '#334155' }}>{w.duration_days} ngày</strong>
                      </div>
                    </div>

                    {/* Slots Progress bar */}
                    <div style={{ fontSize: '12px', color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: '600' }}>
                      <span>Số lượng hành khách:</span>
                      <span>{bookedCount} / {w.max_slots} khách</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${fillPercent}%`, height: '100%', background: '#0284c7', borderRadius: '3px' }}></div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleSelectDeparture(w)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: isCurrentActive ? '#059669' : '#1e3a8a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(30,58,138,0.15)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isCurrentActive ? '✅ Đang quản lý đoàn' : '💼 Quản lý đoàn này'}
                    </button>

                    {w.status === 'Open' && (
                      <button
                        onClick={() => handleStatusChange(w.departure_id, 'Closed')}
                        style={{
                          padding: '10px 14px',
                          background: '#fff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#d97706',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                        title="Đóng nhận khách để xuất phát đi tour"
                      >
                        Đi Tour
                      </button>
                    )}

                    {w.status === 'Closed' && (
                      <button
                        onClick={() => handleStatusChange(w.departure_id, 'Completed')}
                        style={{
                          padding: '10px 14px',
                          background: '#dcfce7',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          color: '#15803d',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                        title="Hoàn thành & kết thúc chuyến đi"
                      >
                        Xong
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 🚀 CHI TIẾT CÁC TAB KHÁC (DÙNG DROPDOWN LỰA CHỌN CHUYÊN NGHIỆP) */}
      {activeTab !== 'guide_work' && selectedDeparture && (
        <div>
          {/* Render Bộ Chọn Đoàn ERP ở trên cùng của mọi trang chi tiết */}
          {renderDepartureSelector()}

          {/* Cấu trúc Grid 2 cột */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
            
            {/* CỘT TRÁI - NỘI DUNG TỪNG TRANG CHI TIẾT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* CHI TIẾT: Điểm danh hành khách */}
              {activeTab === 'guide_passengers' && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>📋 Danh sách Điểm danh đoàn</h4>
                    <input 
                      type="text" 
                      placeholder="Tìm theo tên hành khách, CMND..." 
                      value={searchPassenger}
                      onChange={(e) => setSearchPassenger(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '240px' }}
                    />
                  </div>

                  {passengersLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách khách...</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: '600' }}>Hành khách</th>
                            <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: '600' }}>Giới tính</th>
                            <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: '600' }}>Ngày sinh</th>
                            <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: '600' }}>CMND/CCCD</th>
                            <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: '600' }}>Người liên hệ</th>
                            <th style={{ padding: '12px 14px', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>Điểm danh</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPassengers.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy khách hàng nào.</td>
                            </tr>
                          ) : (
                            filteredPassengers.map(p => (
                              <tr key={p.passenger_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#334155' }}>{p.full_name}</td>
                                <td style={{ padding: '12px 14px' }}>{p.gender === 'Male' ? 'Nam' : p.gender === 'Female' ? 'Nữ' : 'Khác'}</td>
                                <td style={{ padding: '12px 14px' }}>{p.birth_date ? new Date(p.birth_date).toLocaleDateString('vi-VN') : '—'}</td>
                                <td style={{ padding: '12px 14px' }}>{p.identity_number || '—'}</td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: '500' }}>{p.booker_name}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>SĐT: {p.booker_phone}</div>
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={p.is_checked_in === 1}
                                      onChange={() => handleCheckinToggle(p.passenger_id, p.is_checked_in)}
                                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: p.is_checked_in === 1 ? '#166534' : '#ef4444' }}>
                                      {p.is_checked_in === 1 ? 'Đã có mặt' : 'Vắng'}
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

              {/* CHI TIẾT: Lịch trình chi tiết của Tour */}
              {activeTab === 'guide_itinerary' && (
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  
                  {/* HEADER LỊCH TRÌNH */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        📋 SỔ TAY HƯỚNG DẪN VIÊN • LỊCH TRÌNH VẬN HÀNH CHI TIẾT
                      </div>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>🗺️</span> {selectedDeparture?.tour_name || 'Lịch trình tour'}
                      </h4>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                        📍 Điểm đến: <strong>{selectedDeparture?.destination}</strong> • ⏱️ Thời gian: <strong>{selectedDeparture?.duration_days} Ngày</strong> • 📅 Khởi hành: <strong>{new Date(selectedDeparture?.departure_date).toLocaleDateString('vi-VN')}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => window.print()}
                        style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        🖨️ In Lịch Trình Chi Tiết
                      </button>
                    </div>
                  </div>

                  {/* DANH SÁCH CÁC NGÀY LỊCH TRÌNH */}
                  {itineraries.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                      Tour này chưa được nhập lịch trình chi tiết.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {itineraries.map((it) => {
                        const blocks = (it.description || '').split('\n\n').filter(Boolean);

                        return (
                          <div key={it.itinerary_id} style={{ border: '1px solid #cbd5e1', borderRadius: '14px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            
                            {/* BANNER HEADER NGÀY */}
                            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ background: '#0284c7', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontWeight: '800', fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                                  NGÀY {it.day_number}
                                </span>
                                <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                                  {it.title}
                                </h5>
                              </div>
                              <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' }}>
                                📌 Ngày {it.day_number} / {selectedDeparture?.duration_days}
                              </span>
                            </div>

                            {/* NỘI DUNG LỊCH TRÌNH CHI TIẾT THEO MỐC THỜI GIAN */}
                            <div style={{ padding: '20px' }}>
                              
                              {/* THỦ THUẬT VẬN HÀNH HDV (GUIDE CHECKLIST CARD) */}
                              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: '700' }}>
                                  <span>🚌</span> Xe & Tài xế: <span style={{ color: '#0f172a', fontWeight: '600' }}>Xe 45 chỗ đời mới</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: '700' }}>
                                  <span>🏨</span> Khách sạn: <span style={{ color: '#0f172a', fontWeight: '600' }}>Tiêu chuẩn 4★ (Nhận/Trả phòng)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: '700' }}>
                                  <span>🍽️</span> Suất ăn: <span style={{ color: '#0f172a', fontWeight: '600' }}>Sáng Buffet • Trưa & Tối Đặc sản</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: '700' }}>
                                  <span>💡</span> Nhắc nhở HDV: <span style={{ color: '#0f172a', fontWeight: '600' }}>Kiểm tra sĩ số & Thẻ đoàn</span>
                                </div>
                              </div>

                              {/* DÒNG THỜI GIAN TIMELINE HOẠT ĐỘNG */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {blocks.length === 0 ? (
                                  <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                    {it.description}
                                  </p>
                                ) : (
                                  blocks.map((blk, idx) => {
                                    const isSang = blk.includes('🌅') || blk.toLowerCase().includes('sáng');
                                    const isTrua = blk.includes('☀️') || blk.toLowerCase().includes('trưa');
                                    const isChieu = blk.includes('🌇') || blk.toLowerCase().includes('chiều');

                                    const badgeText = isSang ? '#92400e' : isTrua ? '#0369a1' : isChieu ? '#c2410c' : '#6b21a8';
                                    const borderColor = isSang ? '#fde68a' : isTrua ? '#bae6fd' : isChieu ? '#fed7aa' : '#e9d5ff';

                                    return (
                                      <div key={idx} style={{ background: '#f8fafc', border: `1px solid ${borderColor}`, borderRadius: '10px', padding: '14px 18px', borderLeft: `5px solid ${badgeText}` }}>
                                        <p style={{ margin: 0, color: '#1e293b', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-line', fontWeight: '500' }}>
                                          {blk}
                                        </p>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CHI TIẾT: Bản đồ & Định vị */}
              {activeTab === 'guide_map' && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>📍 Bản đồ số định vị đoàn</h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Đang theo dõi vùng địa bàn: <strong>{selectedDeparture.destination}</strong></p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px' }}>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', height: '320px' }}>
                      <iframe 
                        title="LiveMap"
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        src={
                          selectedDeparture.destination?.includes('Phú Quốc') 
                            ? "https://www.openstreetmap.org/export/embed.html?bbox=103.85%2C10.10%2C104.05%2C10.35&layer=mapnik&marker=10.2198%2C103.9568"
                            : selectedDeparture.destination?.includes('Sapa')
                            ? "https://www.openstreetmap.org/export/embed.html?bbox=103.78%2C22.28%2C103.90%2C22.38&layer=mapnik&marker=22.3364%2C103.8438"
                            : "https://www.openstreetmap.org/export/embed.html?bbox=108.4287%2C11.9164%2C108.4878%2C11.9602&layer=mapnik&marker=11.9404%2C108.4583"
                        }
                        style={{ border: 'none' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>TRẠNG THÁI ĐOÀN:</label>
                        <select 
                          value={groupLocation} 
                          onChange={(e) => setGroupLocation(e.target.value)}
                          style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="Điểm đón khách">🚌 Điểm đón khách</option>
                          <option value="Đang trên xe di chuyển">🚌 Đang di chuyển trên xe</option>
                          <option value="Đang tham quan địa danh">🏞️ Đang tham quan</option>
                          <option value="Nhà hàng ăn uống">🍽️ Đang ăn uống</option>
                          <option value="Khách sạn nghỉ ngơi">🏨 Khách sạn nghỉ ngơi</option>
                        </select>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, overflowY: 'auto' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>VỊ TRÍ CHI TIẾT KHÁCH:</span>
                        {passengers.map(p => (
                          <div key={p.passenger_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px dashed #e2e8f0', padding: '4px 0' }}>
                            <span>{p.full_name}</span>
                            <span style={{ fontWeight: '700', color: p.is_checked_in === 1 ? '#166534' : '#ef4444' }}>{p.is_checked_in === 1 ? 'Đi đoàn' : 'Chưa họp'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CHI TIẾT: Cập nhật nhật ký hành trình liên tục (LIVE TRIP LOGS) */}
              {activeTab === 'guide_updates' && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  
                  {/* Cảnh báo chưa chạy migration SQL */}
                  {updatesMigrationNeeded && (
                    <div style={{ padding: '14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', marginBottom: '20px', color: '#b45309', fontSize: '13px' }}>
                      <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>💡 Chế độ mô phỏng (Preview Mode) đang bật</strong>
                      Để lưu nhật ký hành trình thực tế vào CSDL MySQL của TravelERP, vui lòng nhờ Quản trị viên chạy script SQL sau:
                      <pre style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #fcd34d', overflowX: 'auto', marginTop: '8px', fontSize: '11px', color: '#1e293b' }}>
                        {updatesSql}
                      </pre>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>📝 Nhật ký hành trình liên tục (Live Trip Logs)</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Đã đăng {tripUpdates.length} bản tin</span>
                  </div>

                  {/* Form viết Nhật ký cập nhật chuyến đi */}
                  <form onSubmit={handlePostTripUpdate} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#334155' }}>➕ Tạo cập nhật hành trình mới:</h5>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>📍 Vị trí hiện tại của đoàn *</label>
                        <input 
                          type="text" 
                          value={updateForm.location}
                          onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                          placeholder="Ví dụ: Đồi chè Cầu Đất, Cáp treo, Nhà hàng..."
                          required
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>📋 Trạng thái hoạt động *</label>
                        <select 
                          value={updateForm.activity}
                          onChange={(e) => setUpdateForm({ ...updateForm, activity: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                        >
                          <option value="🚌 Di chuyển">🚌 Di chuyển dọc đường</option>
                          <option value="📋 Check-in">📋 Check-in tập trung đoàn</option>
                          <option value="🏞️ Tham quan">🏞️ Tham quan địa danh</option>
                          <option value="🍽️ Ăn uống">🍽️ Ăn trưa/Ăn tối</option>
                          <option value="🏨 Nghỉ ngơi">🏨 Nhận phòng/Nghỉ ngơi</option>
                          <option value="☕ Tự do">☕ Tự do/Giải trí</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Mô tả nội dung chi tiết & Hình ảnh *</label>
                      <textarea 
                        value={updateForm.description}
                        onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                        placeholder="Ví dụ: Đoàn đã tham quan xong, tất cả hành khách đều phấn khởi. Chuẩn bị lên xe di chuyển về nhà hàng ăn tối..."
                        rows="3"
                        required
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', lineHeight: '1.4' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>📷 Đính kèm ảnh thực tế</label>
                        <input 
                          id="update-image-input"
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setSelectedUpdateFile(e.target.files[0])}
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={isPostingUpdate}
                        style={{ padding: '8px 16px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(30,58,138,0.1)' }}
                      >
                        {isPostingUpdate ? 'Đang gửi...' : 'Đăng bản tin hành trình'}
                      </button>
                    </div>
                  </form>

                  {/* Dòng thời gian Timeline Nhật ký hành trình */}
                  <div style={{ borderLeft: '3px solid #e2e8f0', marginLeft: '12px', paddingLeft: '24px', display: 'grid', gap: '20px' }}>
                    {tripUpdates.length === 0 ? (
                      <div style={{ fontSize: '13px', color: '#64748b', padding: '10px 0', borderLeft: 'none' }}>Chưa ghi nhận bản tin nhật ký nào. Hãy đăng bản tin đầu tiên ở trên!</div>
                    ) : (
                      tripUpdates.map((up) => {
                        const badge = getActivityBadgeColor(up.activity);
                        return (
                          <div key={up.update_id} style={{ position: 'relative' }}>
                            
                            {/* Nút tròn định vị mốc thời gian */}
                            <span style={{
                              position: 'absolute',
                              left: '-34px',
                              top: '2px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#3b82f6',
                              border: '4px solid #fff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }} />

                            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ background: badge.bg, color: badge.text, fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                                    {up.activity}
                                  </span>
                                  <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '700' }}>
                                    📍 {up.location}
                                  </span>
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                  ⏱️ {new Date(up.created_at).toLocaleTimeString('vi-VN')} ngày {new Date(up.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              
                              <p style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                                {up.description}
                              </p>

                              {up.image_url && (
                                <div style={{ marginTop: '8px' }}>
                                  <img 
                                    src={up.image_url.startsWith('blob:') ? up.image_url : `http://localhost:5000${up.image_url}`} 
                                    alt="Live Trip" 
                                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                                  />
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}

              {/* CHI TIẾT: Báo cáo sự cố */}
              {activeTab === 'guide_incidents' && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#991b1b', fontWeight: '700' }}>🚨 Danh sách sự cố báo cáo</h4>
                    <button 
                      onClick={() => setShowIncidentModal(true)}
                      style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                    >
                      ⚠️ Báo cáo sự cố khẩn cấp
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    {incidents.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Chưa có báo cáo sự cố nào được tạo cho chuyến đi này.</div>
                    ) : (
                      incidents.map(inc => (
                        <div key={inc.incident_id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: inc.status === 'Resolved' ? '#f0fdf4' : '#fff8f8', borderLeft: `5px solid ${inc.status === 'Resolved' ? '#10b981' : '#dc2626'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '14px' }}>{inc.title}</strong>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: inc.status === 'Resolved' ? '#dcfce7' : '#fee2e2',
                              color: inc.status === 'Resolved' ? '#15803d' : '#991b1b'
                            }}>
                              {inc.status === 'Resolved' ? 'Đã giải quyết' : 'Đang xử lý'}
                            </span>
                          </div>
                          {inc.location && <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700', marginBottom: '4px' }}>📍 Vị trí xảy ra: {inc.location}</div>}
                          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#475569' }}>{inc.description}</p>
                          
                          {inc.image_url && (
                            <div style={{ marginBottom: '8px' }}>
                              <a href={`http://localhost:5000${inc.image_url}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#1e3a8a', textDecoration: 'underline', fontWeight: '600' }}>🖼️ Xem hình ảnh hiện trường sự cố</a>
                            </div>
                          )}

                          {inc.resolution_notes && (
                            <div style={{ background: '#fff', border: '1px dashed #bbf7d0', borderRadius: '6px', padding: '10px', marginTop: '8px', fontSize: '12px' }}>
                              <strong style={{ color: '#166534' }}>💡 Ghi chú phản hồi điều hành:</strong>
                              <p style={{ margin: '4px 0 0 0', color: '#14532d' }}>{inc.resolution_notes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* CỘT PHẢI (THÔNG TIN ĐOÀN ĐI NHANH) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Thống kê nhanh điểm danh */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', fontWeight: '700' }}>📊 Thống kê nhanh</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Hành khách:</span>
                    <strong>{passengers.length} người</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Đã có mặt:</span>
                    <strong style={{ color: '#166534' }}>{checkedInCount} người</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Chưa có mặt:</span>
                    <strong style={{ color: '#ef4444' }}>{passengers.length - checkedInCount} người</strong>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' }}>
                    <div style={{
                      width: `${passengers.length > 0 ? (checkedInCount / passengers.length) * 100 : 0}%`,
                      height: '100%',
                      background: '#10b981',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Tình trạng chuyến đi & Phím nóng */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', fontWeight: '700' }}>⚙️ Quản trị chuyến đi</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      setActiveTab('guide_incidents');
                      setShowIncidentModal(true);
                    }}
                    style={{ padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🚨 Báo cáo khẩn cấp
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Bạn có muốn in danh sách đoàn để chuẩn bị đón khách không?')) {
                        window.print();
                      }
                    }}
                    style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🖨️ In danh sách khách
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 🌟 MODAL TẠO BÁO CÁO SỰ CỐ KHẨN CẤP */}
      {showIncidentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', padding: '30px', borderRadius: '16px',
            width: '90%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700' }}>
              🚨 Báo cáo sự cố khẩn cấp của đoàn
            </h3>

            <form onSubmit={handleReportIncident}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Tiêu đề sự cố *</label>
                <input 
                  type="text" 
                  value={incidentForm.title}
                  onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  placeholder="Ví dụ: Xe hỏng lốp, Khách hàng bị lạc, Thời tiết xấu..." 
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Vị trí xảy ra sự cố *</label>
                <input 
                  type="text" 
                  value={incidentForm.location}
                  onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                  placeholder="Ví dụ: Đèo Prenn Đà Lạt, Khách sạn Novotel..." 
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Ảnh chụp hiện trường sự cố (Không bắt buộc)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Chi tiết sự việc & Đề xuất phương án *</label>
                <textarea 
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  placeholder="Mô tả cụ thể sự việc đang diễn ra và phương án khắc phục ban đầu..."
                  rows="4"
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowIncidentModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={isReporting}
                  style={{ padding: '8px 20px', background: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}
                >
                  {isReporting ? 'Đang gửi...' : '🚨 Gửi báo cáo khẩn'}
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
