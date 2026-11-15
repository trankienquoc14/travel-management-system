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
  const [timeFilterType, setTimeFilterType] = useState('all'); // 'all' | 'upcoming' | 'single_date' | 'this_month' | 'month_YYYY-MM' | 'custom'
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [singleDateFilter, setSingleDateFilter] = useState('');

  // Form states - Chi phí
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', expense_date: getTodayDateStr(), description: '' });
  const [expenseFile, setExpenseFile] = useState(null);
  const [expensePreviewUrl, setExpensePreviewUrl] = useState(null);
  const [expenseErrors, setExpenseErrors] = useState({});
  const [expenseSuccessBanner, setExpenseSuccessBanner] = useState(null);
  const [previewReceiptModalUrl, setPreviewReceiptModalUrl] = useState(null);
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

  const resetExpenseForm = () => {
    setExpenseForm({ category: '', amount: '', expense_date: getTodayDateStr(), description: '' });
    if (expensePreviewUrl) URL.revokeObjectURL(expensePreviewUrl);
    setExpenseFile(null);
    setExpensePreviewUrl(null);
    setExpenseErrors({});
  };

  const handleOpenExpenseModal = () => {
    resetExpenseForm();
    setShowExpenseModal(true);
  };

  const handleExpenseFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setExpenseFile(null);
      if (expensePreviewUrl) URL.revokeObjectURL(expensePreviewUrl);
      setExpensePreviewUrl(null);
      e.target.value = '';
      setExpenseErrors(prev => ({
        ...prev,
        receipt_image: `Kích thước ảnh hóa đơn tối đa 5MB (file bạn chọn nặng ${sizeMb}MB)`
      }));
      return;
    }

    if (expensePreviewUrl) URL.revokeObjectURL(expensePreviewUrl);
    setExpenseFile(file);
    setExpensePreviewUrl(URL.createObjectURL(file));
    setExpenseErrors(prev => {
      const next = { ...prev };
      delete next.receipt_image;
      delete next.general;
      return next;
    });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!selectedDeparture) {
      errors.general = 'Vui lòng chọn chuyến xe cần kê khai chi phí!';
    }
    if (!expenseForm.category) {
      errors.category = 'Vui lòng chọn loại chi phí phát sinh';
    }

    const rawAmount = String(expenseForm.amount ?? '').trim();
    if (rawAmount === '') {
      errors.amount = 'Vui lòng nhập số tiền chi phí';
    } else {
      const numAmount = Number(rawAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        errors.amount = 'Số tiền chi phí phải lớn hơn 0 VNĐ';
      }
    }

    if (!expenseForm.expense_date) {
      errors.expense_date = 'Vui lòng chọn ngày chi phát sinh';
    }

    if (!expenseFile) {
      errors.receipt_image = 'Vui lòng chụp ảnh hóa đơn/chứng từ để được kế toán phê duyệt hoàn tiền';
    } else if (expenseFile.size > 5 * 1024 * 1024) {
      errors.receipt_image = 'Kích thước ảnh hóa đơn tối đa 5MB';
    }

    if (Object.keys(errors).length > 0) {
      setExpenseErrors(errors);
      return;
    }

    setIsSubmittingExpense(true);
    setExpenseErrors({});
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('departure_id', selectedDeparture.departure_id);
      formData.append('category', expenseForm.category);
      formData.append('amount', expenseForm.amount);
      formData.append('expense_date', expenseForm.expense_date);
      formData.append('description', expenseForm.description || '');
      if (expenseFile) formData.append('receipt_image', expenseFile);

      const res = await axios.post('http://localhost:5000/api/driver/expenses', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const submittedAmount = Number(expenseForm.amount);
        setShowExpenseModal(false);
        resetExpenseForm();
        await fetchExpenses(selectedDeparture.departure_id);
        setExpenseSuccessBanner({
          title: 'Kê khai chi phí thành công!',
          detail: `Đã ghi nhận khoản chi ${new Intl.NumberFormat('vi-VN').format(submittedAmount)} VNĐ ở trạng thái "Chờ duyệt" và tự động cộng dồn vào tổng chi phí chuyến xe.`
        });
        setTimeout(() => setExpenseSuccessBanner(null), 6000);
      }
    } catch (err) {
      const errData = err.response?.data || {};
      const errMsg = errData.message || err.message || 'Không thể gửi kê khai chi phí';
      if (errData.field) {
        setExpenseErrors({ [errData.field]: errMsg });
      } else if (errData.error_code === 'FILE_TOO_LARGE' || errMsg.includes('5MB')) {
        setExpenseErrors({ receipt_image: 'Kích thước ảnh hóa đơn tối đa 5MB' });
      } else {
        setExpenseErrors({ general: errMsg });
      }
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

  const getStatusBadge = (status, returnDateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const isPast = returnDateStr && String(returnDateStr).substring(0, 10) < today;
    if (isPast || status === 'Closed') {
      if (isPast) return { text: '🔒 Đã khóa (CLOSED)', bg: '#fee2e2', color: '#991b1b' };
      return { text: 'Đã khóa / Đang đi', bg: '#fef3c7', color: '#d97706' };
    }
    switch (status) {
      case 'Open': return { text: 'Chuẩn bị đi', bg: '#e0f2fe', color: '#0369a1' };
      case 'Completed': return { text: 'Hoàn thành', bg: '#dcfce7', color: '#15803d' };
      default: return { text: status, bg: '#f1f5f9', color: '#475569' };
    }
  };

  const uniqueMonths = Array.from(new Set(
    trips.map(t => {
      if (!t.departure_date) return null;
      const d = new Date(t.departure_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).filter(Boolean)
  )).sort().reverse().map(ym => {
    const [y, m] = ym.split('-');
    return { val: ym, label: `${m}/${y}` };
  });

  const sortedTrips = [...trips]
    .filter(t => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        t.tour_name?.toLowerCase().includes(term) ||
        t.destination?.toLowerCase().includes(term) ||
        t.departure_id?.toString().includes(term) ||
        (t.vehicle_number && t.vehicle_number.toLowerCase().includes(term));
        
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      let matchesTime = true;
      if (timeFilterType === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        matchesTime = t.departure_date >= today;
      } else if (timeFilterType === 'single_date') {
        if (singleDateFilter) {
          const sDate = singleDateFilter;
          const dStart = t.departure_date ? t.departure_date.split('T')[0] : '';
          const dEnd = t.return_date ? t.return_date.split('T')[0] : dStart;
          matchesTime = (sDate >= dStart && sDate <= dEnd);
        }
      } else if (timeFilterType === 'this_month') {
        const now = new Date();
        const currYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        matchesTime = t.departure_date && t.departure_date.startsWith(currYearMonth);
      } else if (timeFilterType.startsWith('month_')) {
        const targetMonth = timeFilterType.replace('month_', '');
        matchesTime = t.departure_date && t.departure_date.startsWith(targetMonth);
      } else if (timeFilterType === 'custom') {
        if (startDateFilter && t.departure_date < startDateFilter) matchesTime = false;
        if (endDateFilter && t.departure_date > endDateFilter) matchesTime = false;
      }

      return matchesSearch && matchesStatus && matchesTime;
    })
    .sort((a, b) => {
      // 1. Đưa các chuyến "Chuẩn bị đi" (Open) lên đầu bảng!
      const statusPriority = { 'Open': 1, 'Closed': 2, 'Completed': 3 };
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;

      if (pA !== pB) {
        return pA - pB;
      }

      // 2. Cùng trạng thái: Sắp xếp theo Ngày khởi hành gần nhất trước
      const dA = a.departure_date ? new Date(a.departure_date).getTime() : 0;
      const dB = b.departure_date ? new Date(b.departure_date).getTime() : 0;
      return dA - dB;
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
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
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

          {/* SEARCH & FILTER BAR WITH TIME & STATUS */}
          <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* ROW 1: SEARCH & TIME FILTER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              
              {/* SEARCH INPUT */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px' }}>
                <span style={{ fontSize: '16px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Tìm theo tên tour, điểm đến, loại xe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#fff' }}
                />
              </div>

              {/* TIME FILTER DROPDOWN & DATE RANGE */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📅 Thời gian:
                </span>
                <select
                  value={timeFilterType}
                  onChange={(e) => {
                    setTimeFilterType(e.target.value);
                    if (e.target.value !== 'custom') {
                      setStartDateFilter('');
                      setEndDateFilter('');
                    }
                    if (e.target.value !== 'single_date') {
                      setSingleDateFilter('');
                    }
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '13px', fontWeight: '700', color: '#1e3a8a', background: '#fff', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="all">📅 Tất cả thời gian</option>
                  <option value="upcoming">🚀 Sắp tới / Tương lai</option>
                  <option value="single_date">📆 Chọn Ngày/Tháng/Năm cụ thể</option>
                  <option value="this_month">🗓️ Tháng này</option>
                  <option value="custom">📆 Khoảng ngày (Từ ngày - Đến ngày)</option>
                  {uniqueMonths.map(m => (
                    <option key={m.val} value={`month_${m.val}`}>🗓️ Tháng {m.label}</option>
                  ))}
                </select>

                {/* SINGLE DATE INPUT */}
                {timeFilterType === 'single_date' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="date"
                      value={singleDateFilter}
                      onChange={(e) => setSingleDateFilter(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '2px solid #0284c7', fontSize: '13px', fontWeight: '700', outline: 'none', background: '#f0f9ff', color: '#0369a1', cursor: 'pointer' }}
                    />
                  </div>
                )}

                {/* CUSTOM DATE RANGE INPUTS */}
                {timeFilterType === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                    />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>→</span>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* ROW 2: STATUS FILTER BUTTONS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>⚡ Trạng thái:</span>
                {[
                  { id: 'all', label: 'Tất cả', count: trips.length },
                  { id: 'Open', label: 'Chuẩn bị đi', count: trips.filter(t => t.status === 'Open').length },
                  { id: 'Closed', label: 'Đang đi tour', count: trips.filter(t => t.status === 'Closed').length },
                  { id: 'Completed', label: 'Hoàn thành', count: trips.filter(t => t.status === 'Completed').length }
                ].map((st) => {
                  const isActive = statusFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id)}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                        border: isActive ? 'none' : '1px solid #cbd5e1',
                        background: isActive ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                        color: isActive ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                        display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                      }}
                    >
                      <span>{st.label}</span>
                      <span style={{
                        background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                        color: isActive ? '#fff' : '#0369a1',
                        padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '800'
                      }}>
                        {st.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {(searchTerm || statusFilter !== 'all' || timeFilterType !== 'all' || singleDateFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTimeFilterType('all');
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setSingleDateFilter('');
                  }}
                  style={{
                    background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5',
                    padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  ✕ Xóa bộ lọc
                </button>
              )}
            </div>

          </div>

          {/* BẢNG CHUYẾN XE */}
          {sortedTrips.length === 0 ? (
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
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Loại xe</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Tên Tour & Điểm đến</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Thời gian di chuyển</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Hướng dẫn viên</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Trạng thái</th>
                    <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTrips.map(t => {
                    const badge = getStatusBadge(t.status, t.return_date);
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
            {activeTab === 'driver_expenses' && (() => {
              const totalExpenseAmount = expenses.reduce((sum, item) => sum + (item.status !== 'Rejected' ? Number(item.amount || 0) : 0), 0);
              const pendingExpenses = expenses.filter(item => item.status === 'Pending' || !item.status);
              const approvedExpenses = expenses.filter(item => item.status === 'Approved');
              const pendingAmount = pendingExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
              const approvedAmount = approvedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

              const getCategoryLabel = (cat) => {
                switch (cat) {
                  case 'Fuel': return '⛽ Tiền xăng dầu';
                  case 'Toll': return '🛣️ Vé cầu đường / BOT';
                  case 'Parking': return '🅿️ Phí đỗ xe';
                  case 'CarWash': return '🧼 Phụ phí rửa xe';
                  case 'Repair': return '🔧 Sửa chữa nhỏ dọc đường';
                  default: return '📦 Chi phí khác';
                }
              };

              return (
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      QUYẾT TOÁN CÔNG TÁC PHÍ • CHUYẾN XE #{selectedDeparture.departure_id}
                    </div>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                      ⛽ Kê khai Chi phí Chuyến đi
                    </h4>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                      Ghi nhận các khoản chi thực tế (xăng dầu, BOT, đỗ xe, rửa xe, sửa chữa nhỏ...) kèm hóa đơn để quyết toán.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenExpenseModal}
                    style={{
                      padding: '11px 20px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '13px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>➕</span>
                    <span>Kê khai chi phí chuyến đi (Thêm chi phí)</span>
                  </button>
                </div>

                {/* THÔNG BÁO THÀNH CÔNG ĐẸP MẮT (LUỒNG CHÍNH BƯỚC 7) */}
                {expenseSuccessBanner && (
                  <div style={{
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    border: '1px solid #6ee7b7',
                    borderLeft: '5px solid #10b981',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                        ✓
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', color: '#065f46', fontSize: '14px' }}>{expenseSuccessBanner.title}</div>
                        <div style={{ fontSize: '13px', color: '#047857', marginTop: '2px' }}>{expenseSuccessBanner.detail}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpenseSuccessBanner(null)}
                      style={{ background: 'transparent', border: 'none', color: '#047857', fontWeight: '800', fontSize: '16px', cursor: 'pointer', padding: '4px 8px' }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* TỔNG HỢP CỘNG DỒN CHI PHÍ CHUYẾN XE */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase' }}>💰 Tổng chi phí chuyến xe</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '6px' }}>
                      {new Intl.NumberFormat('vi-VN').format(totalExpenseAmount)} VNĐ
                    </div>
                    <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px', fontWeight: '600' }}>
                      {expenses.length} khoản chi đã kê khai
                    </div>
                  </div>

                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase' }}>⏳ Đang chờ duyệt</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#d97706', marginTop: '6px' }}>
                      {new Intl.NumberFormat('vi-VN').format(pendingAmount)} VNĐ
                    </div>
                    <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: '600' }}>
                      {pendingExpenses.length} khoản chờ kế toán duyệt
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#166534', textTransform: 'uppercase' }}>✅ Đã phê duyệt hoàn tiền</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d', marginTop: '6px' }}>
                      {new Intl.NumberFormat('vi-VN').format(approvedAmount)} VNĐ
                    </div>
                    <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px', fontWeight: '600' }}>
                      {approvedExpenses.length} khoản đã duyệt
                    </div>
                  </div>
                </div>

                {/* BẢNG DANH SÁCH CÁC KHOẢN CHI */}
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Loại chi phí</th>
                        <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Số tiền (VNĐ)</th>
                        <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Ngày chi</th>
                        <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Diễn giải nội dung</th>
                        <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Hóa đơn / Chứng từ</th>
                        <th style={{ padding: '12px 14px', color: '#334155', fontWeight: '800' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                            <div style={{ fontSize: '28px', marginBottom: '6px' }}>🧾</div>
                            <div style={{ fontWeight: '700', color: '#334155' }}>Chưa có khoản chi phí nào được kê khai cho chuyến xe này.</div>
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>Nhấn nút <strong>"Kê khai chi phí chuyến đi"</strong> ở góc trên để thêm khoản chi mới.</div>
                          </td>
                        </tr>
                      ) : (
                        expenses.map(e => {
                          const displayDate = e.expense_date || e.created_at;
                          return (
                            <tr key={e.expense_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>
                                {getCategoryLabel(e.category)}
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: '800', color: '#b91c1c' }}>
                                {new Intl.NumberFormat('vi-VN').format(e.amount)} VNĐ
                              </td>
                              <td style={{ padding: '12px 14px', color: '#334155', fontWeight: '600' }}>
                                📅 {displayDate ? new Date(displayDate).toLocaleDateString('vi-VN') : '—'}
                              </td>
                              <td style={{ padding: '12px 14px', color: '#475569', maxWidth: '260px' }}>{e.description || '—'}</td>
                              <td style={{ padding: '12px 14px' }}>
                                {e.receipt_image ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewReceiptModalUrl(`http://localhost:5000${e.receipt_image}`)}
                                    style={{
                                      background: '#eff6ff',
                                      color: '#0284c7',
                                      border: '1px solid #bfdbfe',
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      fontWeight: '700',
                                      fontSize: '12px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🖼️ Xem hóa đơn
                                  </button>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Chưa đính kèm</span>
                                )}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{
                                  background: e.status === 'Approved' ? '#dcfce7' : e.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                  color: e.status === 'Approved' ? '#15803d' : e.status === 'Rejected' ? '#b91c1c' : '#d97706',
                                  border: `1px solid ${e.status === 'Approved' ? '#bbf7d0' : e.status === 'Rejected' ? '#fecaca' : '#fde68a'}`,
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontWeight: '700',
                                  fontSize: '11px',
                                  display: 'inline-block'
                                }}>
                                  {e.status === 'Approved' ? '✅ Đã phê duyệt' : e.status === 'Rejected' ? '❌ Từ chối' : '⏳ Chờ duyệt'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })()}

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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '540px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', border: '1px solid #e2e8f0' }}>
            {/* MODAL HEADER */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Chuyến xe #{selectedDeparture?.departure_id} • {selectedDeparture?.vehicle_number || 'Xe đoàn'}
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: '800' }}>
                  ⛽ Kê Khai Chi Phí Chuyến Đi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', fontWeight: '700' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} noValidate style={{ padding: '22px 24px' }}>
              {/* BANNER CẢNH BÁO TỔNG HỢP ĐẸP MẮT KHI CÓ LỖI */}
              {Object.keys(expenseErrors).length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
                  border: '1px solid #fecaca',
                  borderLeft: '5px solid #ef4444',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
                }}>
                  <span style={{ fontSize: '18px', lineHeight: 1.2 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#991b1b' }}>
                      Vui lòng kiểm tra lại thông tin kê khai:
                    </div>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12.5px', color: '#b91c1c', lineHeight: 1.5 }}>
                      {Object.values(expenseErrors).map((msg, idx) => (
                        <li key={idx} style={{ fontWeight: '600' }}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 1. LOẠI CHI PHÍ */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Loại chi phí <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => {
                    setExpenseForm({ ...expenseForm, category: e.target.value });
                    if (expenseErrors.category) {
                      setExpenseErrors(prev => { const n = { ...prev }; delete n.category; return n; });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: expenseErrors.category ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    background: expenseErrors.category ? '#fef2f2' : '#fff',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: expenseForm.category ? '#0f172a' : '#64748b',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Chọn loại chi phí phát sinh --</option>
                  <option value="Fuel">⛽ Tiền xăng dầu</option>
                  <option value="Toll">🛣️ Vé cầu đường / BOT</option>
                  <option value="Parking">🅿️ Phí đỗ xe</option>
                  <option value="CarWash">🧼 Phụ phí rửa xe</option>
                  <option value="Repair">🔧 Sửa chữa nhỏ dọc đường</option>
                  <option value="Other">📦 Chi phí khác</option>
                </select>
                {expenseErrors.category && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>
                    <span>⛔</span>
                    <span>{expenseErrors.category}</span>
                  </div>
                )}
              </div>

              {/* 2. SỐ TIỀN & NGÀY CHI */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Số tiền (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 500000"
                    value={expenseForm.amount}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, amount: e.target.value });
                      if (expenseErrors.amount) {
                        setExpenseErrors(prev => { const n = { ...prev }; delete n.amount; return n; });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: expenseErrors.amount ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      background: expenseErrors.amount ? '#fef2f2' : '#fff',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {expenseErrors.amount && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>
                      <span>⛔</span>
                      <span>{expenseErrors.amount}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Ngày chi (Ngày phát sinh) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => {
                      setExpenseForm({ ...expenseForm, expense_date: e.target.value });
                      if (expenseErrors.expense_date) {
                        setExpenseErrors(prev => { const n = { ...prev }; delete n.expense_date; return n; });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: expenseErrors.expense_date ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      background: expenseErrors.expense_date ? '#fef2f2' : '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {expenseErrors.expense_date && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', color: '#dc2626', fontSize: '12px', fontWeight: '700' }}>
                      <span>⛔</span>
                      <span>{expenseErrors.expense_date}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. DIỄN GIẢI NỘI DUNG */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Diễn giải nội dung
                </label>
                <textarea
                  rows="3"
                  placeholder="Nhập chi tiết: tên cây xăng, trạm thu phí BOT, bãi đỗ xe hoặc nội dung sửa chữa..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* 4. TẢI ẢNH HÓA ĐƠN / CHỨNG TỪ (TỐI ĐA 5MB) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Ảnh hóa đơn / Chứng từ <span style={{ color: '#ef4444' }}>*</span> <span style={{ fontWeight: '500', color: '#64748b' }}>(Tối đa 5MB)</span>
                </label>

                <label
                  htmlFor="driver-expense-receipt-input"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    border: expenseErrors.receipt_image
                      ? '2px dashed #f59e0b'
                      : expenseFile
                        ? '2px solid #10b981'
                        : '2px dashed #cbd5e1',
                    background: expenseErrors.receipt_image
                      ? '#fffbeb'
                      : expenseFile
                        ? '#f0fdf4'
                        : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    id="driver-expense-receipt-input"
                    type="file"
                    accept="image/*"
                    onChange={handleExpenseFileChange}
                    style={{ display: 'none' }}
                  />
                  {expensePreviewUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                      <img src={expensePreviewUrl} alt="Preview hóa đơn" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#065f46' }}>✅ {expenseFile?.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px' }}>
                          Dung lượng: {((expenseFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Nhấn để chọn ảnh khác
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '26px', marginBottom: '4px' }}>📸</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                        Chụp hoặc chọn ảnh hóa đơn / biên lai
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        Hỗ trợ JPG, PNG, WEBP • Dung lượng tối đa 5MB
                      </div>
                    </>
                  )}
                </label>

                {expenseErrors.receipt_image && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: expenseErrors.receipt_image.includes('5MB') ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${expenseErrors.receipt_image.includes('5MB') ? '#fca5a5' : '#fcd34d'}`,
                    color: expenseErrors.receipt_image.includes('5MB') ? '#b91c1c' : '#92400e',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{expenseErrors.receipt_image.includes('5MB') ? '🚫' : '📸'}</span>
                    <span>{expenseErrors.receipt_image}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  style={{
                    padding: '10px 22px',
                    background: isSubmittingExpense ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: isSubmittingExpense ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  {isSubmittingExpense ? '⏳ Đang gửi...' : '📤 Gửi kê khai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX XEM ẢNH HÓA ĐƠN */}
      {previewReceiptModalUrl && (
        <div
          onClick={() => setPreviewReceiptModalUrl(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '16px', maxWidth: '720px', width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>🧾 Ảnh Hóa Đơn / Chứng Từ Chi Phí</strong>
              <button
                onClick={() => setPreviewReceiptModalUrl(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: '700', cursor: 'pointer', color: '#334155' }}
              >
                ✕ Đóng
              </button>
            </div>
            <img src={previewReceiptModalUrl} alt="Hóa đơn chi phí" style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: '10px', objectFit: 'contain' }} />
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
