import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bus, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  RotateCcw, 
  ArrowRight, 
  Check, 
  FileText,
  MapPin,
  Phone,
  Search,
  Filter
} from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const StaffVehicleHistory = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  // Data for selected vehicle
  const [vehicleData, setVehicleData] = useState({
    vehicle: null,
    history: [],
    maintenances: [],
    incidents: []
  });

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // ALL | MAINTENANCE | INCIDENT | STATUS_CHANGE
  const [searchKeyword, setSearchKeyword] = useState('');
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Quick Action Modal to set vehicle back to AVAILABLE
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchVehicleDetails(selectedVehicleId);
    } else {
      setVehicleData({
        vehicle: null,
        history: [],
        maintenances: [],
        incidents: []
      });
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
        const list = res.data.data || [];
        setVehicles(list);
        // Tự động chọn xe đầu tiên nếu có hoặc giữ nguyên
        if (list.length > 0 && !selectedVehicleId) {
          // Tìm xe 43B-888.11 hoặc chọn xe đầu
          const foundDefault = list.find(v => v.license_plate?.includes('43B-888.11')) || list[0];
          setSelectedVehicleId(foundDefault.vehicle_id);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách đội xe:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải dữ liệu đội xe.' });
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchVehicleDetails = async (vid) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/tours/fleet/staff/vehicles/${vid}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setVehicleData({
          vehicle: res.data.vehicle || null,
          history: res.data.history || res.data.data || [],
          maintenances: res.data.maintenances || [],
          incidents: res.data.incidents || []
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch sử:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải chi tiết lịch sử xe.' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleQuickResolve = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) return;
    setIsSubmittingStatus(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${GATEWAY_URL}/api/tours/fleet/staff/vehicles/${selectedVehicleId}/status`, {
        new_status: 'AVAILABLE',
        reason: statusReason || 'Đã hoàn tất sửa chữa / bảo dưỡng - Đưa xe về Sẵn sàng hoạt động'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertMsg({ type: 'success', text: 'Đã hoàn tất sửa chữa và đưa xe về trạng thái Sẵn sàng thành công!' });
      setShowStatusModal(false);
      setStatusReason('');
      fetchVehicleDetails(selectedVehicleId);
      fetchVehicles();
    } catch (err) {
      console.error("Lỗi đổi trạng thái:", err);
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật trạng thái');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const formatStatus = (s) => {
    if (s === 'AVAILABLE') return 'Sẵn sàng hoạt động';
    if (s === 'IN_TOUR') return 'Đang chạy Tour';
    if (s === 'MAINTENANCE') return 'Đang bảo dưỡng';
    if (s === 'REPAIR') return 'Đang sửa chữa';
    if (s === 'INACTIVE') return 'Tạm ngưng';
    return s || 'N/A';
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', text: 'Sẵn sàng hoạt động', dot: '#22c55e' };
      case 'REPAIR':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', text: 'Đang sửa chữa', dot: '#ef4444' };
      case 'MAINTENANCE':
        return { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa', text: 'Đang bảo dưỡng', dot: '#f97316' };
      case 'IN_TOUR':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', text: 'Đang chạy Tour', dot: '#0284c7' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', text: status, dot: '#94a3b8' };
    }
  };

  // Tạo dòng thời gian sự kiện tổng hợp (Timeline)
  const generateTimelineEvents = () => {
    const events = [];

    // 1. Sự cố báo cáo từ tài xế
    (vehicleData.incidents || []).forEach(inc => {
      events.push({
        id: `inc-${inc.incident_id}`,
        type: 'INCIDENT',
        title: `Tài xế báo cáo sự cố (Mã: SC-${String(inc.incident_id).padStart(4, '0')})`,
        subtitle: inc.title,
        description: inc.description,
        location: inc.location,
        driverName: inc.driver_name,
        driverPhone: inc.driver_phone,
        status: inc.status,
        timestamp: new Date(inc.created_at).getTime(),
        dateStr: new Date(inc.created_at).toLocaleString('vi-VN'),
        badgeColor: inc.status === 'Resolved' ? '#166534' : inc.status === 'Processing' ? '#854d0e' : '#991b1b',
        badgeBg: inc.status === 'Resolved' ? '#dcfce7' : inc.status === 'Processing' ? '#fef9c3' : '#fee2e2',
        statusText: inc.status === 'Resolved' ? 'Sự cố đã giải quyết' : inc.status === 'Processing' ? 'Đang xử lý sự cố' : 'Chưa xử lý',
        icon: 'incident'
      });
    });

    // 2. Phiếu bảo dưỡng / sửa chữa
    (vehicleData.maintenances || []).forEach(m => {
      events.push({
        id: `maint-${m.maintenance_id}`,
        type: 'MAINTENANCE',
        title: `Phiếu sửa chữa / bảo dưỡng (Mã: #BD-${String(m.maintenance_id).padStart(4, '0')})`,
        subtitle: m.reason || 'Sửa chữa hỏng hóc / bảo dưỡng phương tiện',
        description: `Thời gian ghi nhận: ${new Date(m.start_date).toLocaleDateString('vi-VN')} đến ${new Date(m.end_date).toLocaleDateString('vi-VN')}`,
        status: m.status,
        timestamp: new Date(m.created_at).getTime(),
        dateStr: new Date(m.created_at).toLocaleString('vi-VN'),
        badgeColor: m.status === 'COMPLETED' ? '#166534' : '#c2410c',
        badgeBg: m.status === 'COMPLETED' ? '#dcfce7' : '#ffedd5',
        statusText: m.status === 'COMPLETED' ? 'Đã hoàn thành sửa chữa' : 'Đang trong quá trình sửa chữa',
        icon: 'maintenance'
      });
    });

    // 3. Log thay đổi trạng thái
    (vehicleData.history || []).forEach(h => {
      const isResolved = h.new_status === 'AVAILABLE' && (h.old_status === 'REPAIR' || h.old_status === 'MAINTENANCE');
      const isIntoRepair = h.new_status === 'REPAIR' || h.new_status === 'MAINTENANCE';

      events.push({
        id: `hist-${h.history_id}`,
        type: 'STATUS_CHANGE',
        title: isResolved 
          ? 'Hoàn thành sửa chữa - Đưa xe về Sẵn sàng hoạt động'
          : isIntoRepair
          ? `Chuyển xe sang trạng thái ${formatStatus(h.new_status)}`
          : `Cập nhật trạng thái: ${formatStatus(h.old_status)} ➔ ${formatStatus(h.new_status)}`,
        subtitle: h.reason || 'Cập nhật trạng thái phương tiện',
        oldStatus: h.old_status,
        newStatus: h.new_status,
        userName: h.user_name || 'Office Staff',
        timestamp: new Date(h.created_at).getTime(),
        dateStr: new Date(h.created_at).toLocaleString('vi-VN'),
        badgeColor: isResolved ? '#166534' : isIntoRepair ? '#b91c1c' : '#0369a1',
        badgeBg: isResolved ? '#dcfce7' : isIntoRepair ? '#fee2e2' : '#e0f2fe',
        statusText: formatStatus(h.new_status),
        icon: isResolved ? 'completed' : isIntoRepair ? 'repair' : 'status'
      });
    });

    return events.sort((a, b) => b.timestamp - a.timestamp);
  };

  const allTimelineEvents = generateTimelineEvents();

  // Lọc sự kiện theo Danh mục và Từ khóa tìm kiếm
  const filteredTimelineEvents = allTimelineEvents.filter(ev => {
    // 1. Lọc theo tab danh mục
    if (filterType === 'MAINTENANCE' && ev.type !== 'MAINTENANCE') return false;
    if (filterType === 'INCIDENT' && ev.type !== 'INCIDENT') return false;
    if (filterType === 'STATUS_CHANGE' && ev.type !== 'STATUS_CHANGE') return false;

    // 2. Lọc theo từ khóa tìm kiếm
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchTitle = ev.title?.toLowerCase().includes(q);
      const matchSubtitle = ev.subtitle?.toLowerCase().includes(q);
      const matchDesc = ev.description?.toLowerCase().includes(q);
      const matchUser = ev.userName?.toLowerCase().includes(q);
      const matchDriver = ev.driverName?.toLowerCase().includes(q);
      const matchLoc = ev.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchSubtitle && !matchDesc && !matchUser && !matchDriver && !matchLoc) {
        return false;
      }
    }
    return true;
  });

  // Gom nhóm sự kiện theo Tháng / Năm để dòng thời gian gọn gàng khi xe sửa chữa nhiều lần
  const groupEventsByMonth = (events) => {
    const groups = [];
    const map = new Map();

    events.forEach(ev => {
      const d = new Date(ev.timestamp);
      const key = !isNaN(d.getTime()) 
        ? `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
        : 'Khác';
      
      if (!map.has(key)) {
        const arr = [];
        map.set(key, arr);
        groups.push({ monthKey: key, events: arr });
      }
      map.get(key).push(ev);
    });

    return groups;
  };

  const groupedTimeline = groupEventsByMonth(filteredTimelineEvents);

  const totalMaintenances = (vehicleData.maintenances || []).length;
  const totalIncidents = (vehicleData.incidents || []).length;
  const totalStatusChanges = (vehicleData.history || []).length;
  const totalAll = allTimelineEvents.length;

  const currentVehicle = vehicleData.vehicle || vehicles.find(v => String(v.vehicle_id) === String(selectedVehicleId));
  const currentStatusStyle = getStatusBadgeStyle(currentVehicle?.status);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerArea}>
        <div>
          <h1 style={styles.pageTitle}>Lịch sử trạng thái & Timeline sửa chữa xe</h1>
          <p style={styles.pageSubtitle}>Theo dõi trực quan dòng thời gian sửa chữa, bảo dưỡng và thay đổi trạng thái phương tiện</p>
        </div>
        <div>
          <button style={styles.btnSecondary} onClick={() => { fetchVehicles(); if (selectedVehicleId) fetchVehicleDetails(selectedVehicleId); }}>
            <RotateCcw size={15} style={{ marginRight: '6px' }} /> Tải lại dữ liệu
          </button>
        </div>
      </div>

      {alertMsg.text && (
        <div style={{
          ...styles.alert, 
          backgroundColor: alertMsg.type === 'error' ? '#fee2e2' : '#dcfce7', 
          color: alertMsg.type === 'error' ? '#991b1b' : '#166534',
          borderColor: alertMsg.type === 'error' ? '#fecaca' : '#bbf7d0'
        }}>
          <span>{alertMsg.text}</span>
          <span style={styles.closeAlert} onClick={() => setAlertMsg({type: '', text: ''})}>&times;</span>
        </div>
      )}

      {/* Selector Phương Tiện */}
      <div style={styles.selectorCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Bus size={22} color="#0284c7" />
          <label style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Chọn phương tiện kiểm tra:</label>
          {loadingVehicles ? (
            <span style={{ color: '#64748b' }}>Đang tải danh sách xe...</span>
          ) : (
            <select 
              style={styles.select} 
              value={selectedVehicleId} 
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              <option value="">-- Chọn một xe để xem lịch sử --</option>
              {vehicles.map(v => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.license_plate} - {v.brand_model || v.vehicle_name} ({formatStatus(v.status)})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!selectedVehicleId ? (
        <div style={styles.emptyPrompt}>
          <Bus size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#475569' }}>Vui lòng chọn một phương tiện</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Chọn biển số xe ở menu phía trên để xem dòng thời gian sửa chữa và lịch sử trạng thái.</p>
        </div>
      ) : loadingHistory ? (
        <div style={styles.loadingBox}>
          <Clock size={32} color="#0284c7" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>Đang tải dòng thời gian và lịch sử xe...</div>
        </div>
      ) : (
        <>
          {/* Vehicle Info Card */}
          {currentVehicle && (
            <div style={styles.vehicleOverviewCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={styles.vehicleIconBadge}>
                    <Bus size={28} color="#0284c7" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                        {currentVehicle.license_plate}
                      </h2>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: currentStatusStyle.bg,
                        color: currentStatusStyle.color,
                        border: `1px solid ${currentStatusStyle.border}`,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12.5px',
                        fontWeight: '700'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentStatusStyle.dot }}></span>
                        {currentStatusStyle.text}
                      </span>
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
                      {currentVehicle.brand_model} • {currentVehicle.vehicle_type} ({currentVehicle.seat_capacity} chỗ ngồi)
                    </div>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {(currentVehicle.status === 'REPAIR' || currentVehicle.status === 'MAINTENANCE') ? (
                    <button 
                      style={styles.btnSuccess}
                      onClick={() => setShowStatusModal(true)}
                    >
                      <CheckCircle2 size={16} /> Hoàn tất sửa chữa (Đưa về Sẵn sàng)
                    </button>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                      <CheckCircle2 size={18} color="#22c55e" /> Phương tiện đang sẵn sàng phục vụ
                    </span>
                  )}
                </div>
              </div>

              {/* Stat counters (Interactive quick filters) */}
              <div style={styles.statRow}>
                <div 
                  style={{
                    ...styles.statBox,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: filterType === 'MAINTENANCE' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    backgroundColor: filterType === 'MAINTENANCE' ? '#f0f9ff' : '#f8fafc',
                    boxShadow: filterType === 'MAINTENANCE' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                  onClick={() => setFilterType(filterType === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
                  title="Bấm để lọc phiếu sửa chữa / bảo dưỡng"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ ...styles.statNum, color: '#0284c7' }}>{totalMaintenances}</div>
                    <div style={{ backgroundColor: '#e0f2fe', padding: '6px', borderRadius: '8px' }}>
                      <Wrench size={16} color="#0284c7" />
                    </div>
                  </div>
                  <div style={styles.statLabel}>Đợt sửa chữa / Bảo dưỡng</div>
                  <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', fontWeight: '700' }}>
                    {filterType === 'MAINTENANCE' ? '● Đang lọc danh mục này' : 'Bấm để lọc'}
                  </div>
                </div>

                <div 
                  style={{
                    ...styles.statBox,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: filterType === 'INCIDENT' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    backgroundColor: filterType === 'INCIDENT' ? '#fffbeb' : '#f8fafc',
                    boxShadow: filterType === 'INCIDENT' ? '0 4px 12px rgba(245, 158, 11, 0.15)' : 'none'
                  }}
                  onClick={() => setFilterType(filterType === 'INCIDENT' ? 'ALL' : 'INCIDENT')}
                  title="Bấm để lọc sự cố từ tài xế"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ ...styles.statNum, color: '#d97706' }}>{totalIncidents}</div>
                    <div style={{ backgroundColor: '#fef3c7', padding: '6px', borderRadius: '8px' }}>
                      <AlertTriangle size={16} color="#f59e0b" />
                    </div>
                  </div>
                  <div style={styles.statLabel}>Sự cố được ghi nhận</div>
                  <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: '700' }}>
                    {filterType === 'INCIDENT' ? '● Đang lọc danh mục này' : 'Bấm để lọc'}
                  </div>
                </div>

                <div 
                  style={{
                    ...styles.statBox,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: filterType === 'STATUS_CHANGE' ? '2px solid #10b981' : '1px solid #e2e8f0',
                    backgroundColor: filterType === 'STATUS_CHANGE' ? '#ecfdf5' : '#f8fafc',
                    boxShadow: filterType === 'STATUS_CHANGE' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                  }}
                  onClick={() => setFilterType(filterType === 'STATUS_CHANGE' ? 'ALL' : 'STATUS_CHANGE')}
                  title="Bấm để lọc lịch sử thay đổi trạng thái"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ ...styles.statNum, color: '#059669' }}>{totalStatusChanges}</div>
                    <div style={{ backgroundColor: '#dcfce7', padding: '6px', borderRadius: '8px' }}>
                      <Clock size={16} color="#10b981" />
                    </div>
                  </div>
                  <div style={styles.statLabel}>Lần thay đổi trạng thái</div>
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '700' }}>
                    {filterType === 'STATUS_CHANGE' ? '● Đang lọc danh mục này' : 'Bấm để lọc'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 THANH ĐIỀU HƯỚNG & LỌC TIMELINE GỌN GÀNG (Thay thế hoàn toàn 4 tab cũ) */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                <Filter size={15} color="#0284c7" /> Lọc dòng thời gian:
              </span>
              {[
                { id: 'ALL', label: 'Tất cả sự kiện', count: totalAll },
                { id: 'MAINTENANCE', label: '🛠️ Sửa chữa & Bảo dưỡng', count: totalMaintenances },
                { id: 'INCIDENT', label: '⚠️ Sự cố tài xế', count: totalIncidents },
                { id: 'STATUS_CHANGE', label: '🔄 Đổi trạng thái', count: totalStatusChanges }
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setFilterType(pill.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: filterType === pill.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    backgroundColor: filterType === pill.id ? '#0284c7' : '#f8fafc',
                    color: filterType === pill.id ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{pill.label}</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: filterType === pill.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: filterType === pill.id ? '#ffffff' : '#64748b'
                  }}>
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm từ khóa nhanh trong Timeline */}
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm nội dung, mã #BD, SC..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 32px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchKeyword && (
                <span
                  onClick={() => setSearchKeyword('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  title="Xóa tìm kiếm"
                >
                  &times;
                </span>
              )}
            </div>
          </div>

          {/* 🕒 TIMELINE LỊCH SỬ SỬA CHỮA & SỰ KIỆN TOÀN TRÌNH */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🕒 Timeline lịch sửa & sự kiện của xe {currentVehicle?.license_plate}</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Toàn bộ hành trình sửa chữa, bảo dưỡng và xử lý sự cố được ghi nhận tuần tự theo thời gian
                </p>
              </div>
              <span style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: '700', backgroundColor: '#f0f9ff', padding: '4px 10px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                Hiển thị {filteredTimelineEvents.length} / {totalAll} sự kiện
              </span>
            </div>

            {filteredTimelineEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
                <Clock size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>
                  {searchKeyword || filterType !== 'ALL' 
                    ? 'Không tìm thấy sự kiện phù hợp với bộ lọc hiện tại'
                    : 'Chưa có sự kiện nào được ghi nhận cho xe này.'}
                </div>
                {(searchKeyword || filterType !== 'ALL') && (
                  <button
                    onClick={() => { setFilterType('ALL'); setSearchKeyword(''); }}
                    style={{
                      marginTop: '12px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid #0284c7',
                      backgroundColor: '#f0f9ff',
                      color: '#0284c7',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Hiển thị toàn bộ sự kiện
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.timelineList}>
                {groupedTimeline.map((group, gIdx) => (
                  <div key={group.monthKey} style={{ marginBottom: '28px' }}>
                    {/* Header phân nhóm theo Tháng / Năm (Gọn gàng cho tương lai nhiều đợt sửa) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px',
                      position: 'relative'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#f8fafc',
                        color: '#1e293b',
                        border: '1px solid #cbd5e1',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '800'
                      }}>
                        <Calendar size={13} color="#0284c7" />
                        <span>{group.monthKey}</span>
                        <span style={{ color: '#64748b', fontWeight: '600' }}>({group.events.length} sự kiện)</span>
                      </div>
                      <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                    </div>

                    {/* Danh sách các sự kiện trong tháng */}
                    {group.events.map((ev, idx) => {
                      const isLastEvent = gIdx === groupedTimeline.length - 1 && idx === group.events.length - 1;
                      return (
                        <div key={ev.id} style={styles.timelineItem}>
                          {/* Cột icon & đường nối Timeline */}
                          <div style={styles.timelineIconCol}>
                            <div style={{
                              ...styles.timelineDot,
                              backgroundColor: ev.icon === 'completed' ? '#16a34a' : ev.icon === 'repair' ? '#dc2626' : ev.icon === 'incident' ? '#f59e0b' : '#0284c7'
                            }}>
                              {ev.icon === 'completed' && <Check size={14} color="#fff" strokeWidth={3} />}
                              {ev.icon === 'repair' && <Wrench size={14} color="#fff" />}
                              {ev.icon === 'incident' && <AlertTriangle size={14} color="#fff" />}
                              {(ev.icon === 'maintenance' || ev.icon === 'status') && <Clock size={14} color="#fff" />}
                            </div>
                            {!isLastEvent && <div style={styles.timelineLine}></div>}
                          </div>

                          {/* Thẻ nội dung sự kiện (Thiết kế gọn gàng, viền trái nổi bật) */}
                          <div style={{
                            ...styles.timelineContent,
                            borderLeft: `4px solid ${
                              ev.icon === 'completed' ? '#16a34a' : ev.icon === 'repair' ? '#dc2626' : ev.icon === 'incident' ? '#f59e0b' : '#0284c7'
                            }`
                          }}>
                            {/* Dòng 1: Badge trạng thái + Tiêu đề + Thời gian */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: ev.badgeBg,
                                  color: ev.badgeColor
                                }}>
                                  {ev.statusText}
                                </span>
                                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>
                                  {ev.title}
                                </h4>
                              </div>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                🕒 {ev.dateStr}
                              </span>
                            </div>

                            {/* Dòng 2: Nội dung / Lý do tóm tắt */}
                            {ev.subtitle && (
                              <div style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', marginBottom: '4px' }}>
                                {ev.subtitle}
                              </div>
                            )}

                            {/* Dòng 3: Chi tiết mô tả bổ sung (nếu có) */}
                            {ev.description && (
                              <div style={{
                                fontSize: '12.5px',
                                color: '#475569',
                                backgroundColor: '#f8fafc',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid #f1f5f9',
                                marginTop: '4px',
                                marginBottom: '6px'
                              }}>
                                {ev.description}
                              </div>
                            )}

                            {/* Dòng 4: Metadata chips gọn gàng */}
                            <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: '#64748b', marginTop: '6px', flexWrap: 'wrap' }}>
                              {ev.userName && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                  <User size={12} color="#64748b" /> Người cập nhật: <strong style={{ color: '#0f172a' }}>{ev.userName}</strong>
                                </span>
                              )}
                              {ev.driverName && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px' }}>
                                  <User size={12} color="#b45309" /> Tài xế báo: <strong>{ev.driverName}</strong> {ev.driverPhone ? `(${ev.driverPhone})` : ''}
                                </span>
                              )}
                              {ev.location && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                  <MapPin size={12} color="#64748b" /> Vị trí: <strong style={{ color: '#0f172a' }}>{ev.location}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Hoàn Tất Sửa Chữa Nhanh */}
      {showStatusModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <CheckCircle2 size={22} color="#16a34a" />
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                Xác nhận hoàn tất sửa chữa / bảo dưỡng
              </h3>
            </div>

            <form onSubmit={handleQuickResolve}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#475569' }}>
                  Bạn đang chuẩn bị chuyển xe <strong>{currentVehicle?.license_plate}</strong> ({currentVehicle?.brand_model}) từ trạng thái <strong style={{ color: '#dc2626' }}>{formatStatus(currentVehicle?.status)}</strong> sang <strong style={{ color: '#16a34a' }}>Sẵn sàng hoạt động</strong>.
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Hệ thống sẽ tự động cập nhật phiếu sửa chữa đang tiến hành sang ĐÃ HOÀN THÀNH và ghi nhật ký vào Timeline của xe.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={styles.label}>Ghi chú xử lý / Nội dung nghiệm thu sửa chữa:</label>
                <textarea 
                  rows="3"
                  style={styles.input}
                  placeholder="Ví dụ: Đã thay bánh mới, kiểm tra an toàn hệ thống phanh, xe đủ điều kiện vận hành..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  style={styles.btnSecondary}
                  onClick={() => setShowStatusModal(false)}
                  disabled={isSubmittingStatus}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  style={styles.btnPrimary}
                  disabled={isSubmittingStatus}
                >
                  {isSubmittingStatus ? 'Đang cập nhật...' : 'Xác nhận đưa xe về Sẵn sàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  headerArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' },
  pageSubtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  btnSecondary: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    border: '1px solid #cbd5e1', 
    padding: '8px 16px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '13px', 
    color: '#334155' 
  },
  btnPrimary: { 
    backgroundColor: '#0284c7', 
    color: '#fff', 
    border: 'none', 
    padding: '9px 18px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '700', 
    fontSize: '13px' 
  },
  btnSuccess: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    padding: '9px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
  },
  selectorCard: { 
    backgroundColor: '#fff', 
    padding: '16px 20px', 
    borderRadius: '10px', 
    border: '1px solid #e2e8f0', 
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
  },
  select: { 
    padding: '9px 14px', 
    border: '1px solid #cbd5e1', 
    borderRadius: '6px', 
    fontSize: '14px', 
    backgroundColor: '#fff', 
    minWidth: '340px',
    color: '#1e293b',
    fontWeight: '600'
  },
  vehicleOverviewCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  vehicleIconBadge: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    backgroundColor: '#e0f2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9'
  },
  statBox: {
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #f1f5f9'
  },
  statNum: { fontSize: '20px', fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: '500' },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
  },

  // Timeline Styling
  timelineList: {
    position: 'relative',
    paddingLeft: '4px'
  },
  timelineItem: {
    display: 'flex',
    gap: '14px',
    marginBottom: '20px',
    position: 'relative'
  },
  timelineIconCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '32px'
  },
  timelineDot: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
  },
  timelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: '4px',
    marginBottom: '4px'
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    transition: 'all 0.15s ease'
  },

  badge: (status) => {
    let bg = '#f1f5f9'; let c = '#475569';
    if (status === 'AVAILABLE') { bg = '#dcfce7'; c = '#166534'; }
    if (status === 'IN_TOUR') { bg = '#e0f2fe'; c = '#0369a1'; }
    if (status === 'MAINTENANCE') { bg = '#ffedd5'; c = '#c2410c'; }
    if (status === 'REPAIR') { bg = '#fee2e2'; c = '#b91c1c'; }
    return {
      backgroundColor: bg,
      color: c,
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '700',
      display: 'inline-block'
    };
  },

  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid transparent'
  },
  closeAlert: { cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' },
  emptyPrompt: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    padding: '60px 20px'
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    padding: '50px 20px'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalCard: {
    backgroundColor: '#fff',
    width: '520px',
    maxWidth: '92%',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#334155' },
  input: {
    padding: '10px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13.5px',
    width: '100%',
    boxSizing: 'border-box'
  }
};

export default StaffVehicleHistory;
