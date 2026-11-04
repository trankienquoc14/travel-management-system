import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Bus, 
  Wrench, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  User, 
  RotateCcw, 
  Check, 
  MapPin,
  Search,
  Filter,
  ArrowLeft,
  AlertCircle,
  FileText,
  ChevronDown
} from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';
const PAGE_SIZE = 15;

const StaffVehicleHistory = ({ onBack }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(() => {
    return sessionStorage.getItem('staff_selected_history_vehicle_id') || '';
  });
  
  // Dữ liệu lịch sử của phương tiện đang chọn
  const [vehicleData, setVehicleData] = useState({
    vehicle: null,
    history: [],
    maintenances: [],
    incidents: []
  });

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [vehiclesError, setVehiclesError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL | MAINTENANCE | INCIDENT | STATUS_CHANGE
  const [searchKeyword, setSearchKeyword] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Tránh race-condition khi đổi xe liên tục
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedVehicleId, filterType, searchKeyword]);

  useEffect(() => {
    if (selectedVehicleId) {
      sessionStorage.setItem('staff_selected_history_vehicle_id', String(selectedVehicleId));
      // Xóa ngay dữ liệu cũ của xe trước khi tải xe mới để không hiển thị nhầm dữ liệu cũ
      setVehicleData({
        vehicle: null,
        history: [],
        maintenances: [],
        incidents: []
      });
      setHistoryError('');
      fetchVehicleDetails(selectedVehicleId);
    } else {
      setVehicleData({
        vehicle: null,
        history: [],
        maintenances: [],
        incidents: []
      });
      setHistoryError('');
    }
  }, [selectedVehicleId]);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    setVehiclesError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/tours/fleet/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        const list = res.data.data || [];
        setVehicles(list);
        const savedId = sessionStorage.getItem('staff_selected_history_vehicle_id');
        if (savedId && list.some(v => String(v.vehicle_id) === String(savedId))) {
          setSelectedVehicleId(String(savedId));
        } else if (list.length > 0 && !selectedVehicleId) {
          const foundDefault = list.find(v => v.license_plate?.includes('43B-888.11')) || list[0];
          setSelectedVehicleId(String(foundDefault.vehicle_id));
        }
      } else {
        setVehiclesError('Không thể tải danh sách phương tiện.');
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách đội xe:", err);
      setVehiclesError('Không thể tải dữ liệu đội xe. Vui lòng thử lại.');
      setAlertMsg({ type: 'error', text: 'Không thể tải dữ liệu đội xe.' });
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchVehicleDetails = async (vid) => {
    const reqId = ++latestRequestIdRef.current;
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/tours/fleet/staff/vehicles/${vid}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reqId !== latestRequestIdRef.current) return;

      if (res.data && res.data.success) {
        setVehicleData({
          vehicle: res.data.vehicle || null,
          history: Array.isArray(res.data.history) ? res.data.history : (Array.isArray(res.data.data) ? res.data.data : []),
          maintenances: Array.isArray(res.data.maintenances) ? res.data.maintenances : [],
          incidents: Array.isArray(res.data.incidents) ? res.data.incidents : []
        });
      } else {
        setHistoryError(res.data?.message || 'Không thể tải lịch sử hoạt động của phương tiện.');
      }
    } catch (err) {
      if (reqId !== latestRequestIdRef.current) return;
      console.error("Lỗi khi tải lịch sử:", err);
      const errText = err.response?.data?.message || 'Không thể tải chi tiết lịch sử xe. Vui lòng kiểm tra kết nối và thử lại.';
      setHistoryError(errText);
    } finally {
      if (reqId === latestRequestIdRef.current) {
        setLoadingHistory(false);
      }
    }
  };

  const handleReload = () => {
    setAlertMsg({ type: '', text: '' });
    fetchVehicles();
    if (selectedVehicleId) {
      fetchVehicleDetails(selectedVehicleId);
    }
  };

  // Chuẩn hóa tên tình trạng tiếng Việt đồng nhất với màn hình Quản lý xe
  const formatStatus = (s) => {
    if (s === 'AVAILABLE') return 'Sẵn sàng';
    if (s === 'IN_TOUR') return 'Đang vận hành';
    if (s === 'MAINTENANCE') return 'Bảo dưỡng';
    if (s === 'REPAIR') return 'Đang sửa chữa';
    if (s === 'INACTIVE') return 'Tạm ngưng';
    return s || 'Chưa xác định';
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', text: 'Sẵn sàng', dot: '#22c55e' };
      case 'REPAIR':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', text: 'Đang sửa chữa', dot: '#ef4444' };
      case 'MAINTENANCE':
        return { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa', text: 'Bảo dưỡng', dot: '#f97316' };
      case 'IN_TOUR':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', text: 'Đang vận hành', dot: '#0284c7' };
      case 'INACTIVE':
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', text: 'Tạm ngưng', dot: '#64748b' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', text: status || 'Chưa xác định', dot: '#94a3b8' };
    }
  };

  // Xử lý an toàn ngày giờ: không tự sinh ngày giờ giả nếu dữ liệu thiếu hoặc không hợp lệ
  const parseSafeDate = (rawValue) => {
    if (!rawValue) return { timestamp: 0, dateStr: null, monthKey: 'Không rõ thời gian' };
    const d = new Date(rawValue);
    if (isNaN(d.getTime())) {
      return { timestamp: 0, dateStr: String(rawValue), monthKey: 'Không rõ thời gian' };
    }
    return {
      timestamp: d.getTime(),
      dateStr: d.toLocaleString('vi-VN'),
      monthKey: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
    };
  };

  const formatSafeDateOnly = (rawValue) => {
    if (!rawValue) return null;
    const d = new Date(rawValue);
    if (isNaN(d.getTime())) return String(rawValue);
    return d.toLocaleDateString('vi-VN');
  };

  // Tạo danh sách sự kiện lịch sử hoạt động từ 3 nguồn thực tế (maintenances, incidents, history)
  const generateTimelineEvents = () => {
    const events = [];

    // 1. Sự cố xe (driver_incidents)
    (vehicleData.incidents || []).forEach(inc => {
      const timeMeta = parseSafeDate(inc.created_at);
      const isResolved = inc.status === 'Resolved';
      const isProcessing = inc.status === 'Processing';

      events.push({
        id: `inc-${inc.incident_id}`,
        type: 'INCIDENT',
        categoryLabel: 'Sự cố xe',
        eventCode: inc.incident_id ? `SC-${String(inc.incident_id).padStart(4, '0')}` : null,
        title: inc.title || 'Báo cáo sự cố phương tiện',
        detail: inc.description || null,
        location: inc.location || null,
        driverName: inc.driver_name || null,
        driverPhone: inc.driver_phone || null,
        userName: null,
        timestamp: timeMeta.timestamp,
        dateStr: timeMeta.dateStr,
        monthKey: timeMeta.monthKey,
        statusText: isResolved ? 'Đã giải quyết' : isProcessing ? 'Đang xử lý' : 'Chưa xử lý',
        statusBg: isResolved ? '#dcfce7' : isProcessing ? '#fef9c3' : '#fee2e2',
        statusColor: isResolved ? '#15803d' : isProcessing ? '#854d0e' : '#b91c1c',
        statusBorder: isResolved ? '#bbf7d0' : isProcessing ? '#fde68a' : '#fecaca',
        accentColor: '#d97706',
        iconBg: '#fef3c7',
        iconColor: '#d97706',
        iconType: 'incident'
      });
    });

    // 2. Bảo dưỡng, sửa chữa (vehicle_maintenances)
    (vehicleData.maintenances || []).forEach(m => {
      const timeMeta = parseSafeDate(m.created_at || m.start_date);
      const startStr = formatSafeDateOnly(m.start_date);
      const endStr = formatSafeDateOnly(m.end_date);
      const isCompleted = m.status === 'COMPLETED';
      const periodText = startStr && endStr
        ? `Thời gian thực hiện: ${startStr} – ${endStr}`
        : startStr
          ? `Ngày bắt đầu: ${startStr}`
          : null;

      events.push({
        id: `maint-${m.maintenance_id}`,
        type: 'MAINTENANCE',
        categoryLabel: 'Bảo dưỡng, sửa chữa',
        eventCode: m.maintenance_id ? `BD-${String(m.maintenance_id).padStart(4, '0')}` : null,
        title: m.reason || 'Phiếu bảo dưỡng / sửa chữa phương tiện',
        detail: periodText,
        location: null,
        driverName: null,
        driverPhone: null,
        userName: null,
        timestamp: timeMeta.timestamp,
        dateStr: timeMeta.dateStr,
        monthKey: timeMeta.monthKey,
        statusText: isCompleted ? 'Đã hoàn thành' : 'Đang thực hiện',
        statusBg: isCompleted ? '#dcfce7' : '#ffedd5',
        statusColor: isCompleted ? '#15803d' : '#c2410c',
        statusBorder: isCompleted ? '#bbf7d0' : '#fed7aa',
        accentColor: '#0284c7',
        iconBg: '#e0f2fe',
        iconColor: '#0284c7',
        iconType: 'maintenance'
      });
    });

    // 3. Thay đổi tình trạng & nhật ký xử lý (vehicle_status_history)
    (vehicleData.history || []).forEach(h => {
      const timeMeta = parseSafeDate(h.created_at);
      const isSameStatus = h.old_status === h.new_status;
      const isResolved = !isSameStatus && h.new_status === 'AVAILABLE' && (h.old_status === 'REPAIR' || h.old_status === 'MAINTENANCE');
      const isIntoRepair = !isSameStatus && (h.new_status === 'REPAIR' || h.new_status === 'MAINTENANCE');

      let eventTitle = `Chuyển tình trạng: ${formatStatus(h.old_status)} ➔ ${formatStatus(h.new_status)}`;
      if (isSameStatus) {
        eventTitle = `Ghi nhận bước xử lý (Giữ tình trạng: ${formatStatus(h.new_status)})`;
      } else if (isResolved) {
        eventTitle = `Hoàn tất bảo dưỡng / sửa chữa (${formatStatus(h.old_status)} ➔ Sẵn sàng)`;
      } else if (isIntoRepair) {
        eventTitle = `Chuyển tình trạng: ${formatStatus(h.old_status)} ➔ ${formatStatus(h.new_status)}`;
      }

      const newBadge = getStatusBadgeStyle(h.new_status);

      events.push({
        id: `hist-${h.history_id}`,
        type: 'STATUS_CHANGE',
        categoryLabel: 'Thay đổi tình trạng',
        eventCode: h.history_id ? `NK-${String(h.history_id).padStart(4, '0')}` : null,
        title: eventTitle,
        detail: h.reason || null,
        location: null,
        driverName: null,
        driverPhone: null,
        userName: h.user_name || null,
        timestamp: timeMeta.timestamp,
        dateStr: timeMeta.dateStr,
        monthKey: timeMeta.monthKey,
        statusText: newBadge.text,
        statusBg: newBadge.bg,
        statusColor: newBadge.color,
        statusBorder: newBadge.border,
        accentColor: isResolved ? '#15803d' : isIntoRepair ? '#c2410c' : '#059669',
        iconBg: isResolved ? '#dcfce7' : isIntoRepair ? '#ffedd5' : '#ecfdf5',
        iconColor: isResolved ? '#15803d' : isIntoRepair ? '#c2410c' : '#059669',
        iconType: isResolved ? 'completed' : 'status'
      });
    });

    return events.sort((a, b) => b.timestamp - a.timestamp);
  };

  const allTimelineEvents = generateTimelineEvents();

  // Thống nhất cách tính số lượng thống kê với danh sách sự kiện thực tế
  const totalMaintenances = allTimelineEvents.filter(ev => ev.type === 'MAINTENANCE').length;
  const totalIncidents = allTimelineEvents.filter(ev => ev.type === 'INCIDENT').length;
  const totalStatusChanges = allTimelineEvents.filter(ev => ev.type === 'STATUS_CHANGE').length;
  const totalAll = allTimelineEvents.length;

  // Lọc sự kiện theo Danh mục và Từ khóa tìm kiếm
  const filteredTimelineEvents = allTimelineEvents.filter(ev => {
    if (filterType === 'MAINTENANCE' && ev.type !== 'MAINTENANCE') return false;
    if (filterType === 'INCIDENT' && ev.type !== 'INCIDENT') return false;
    if (filterType === 'STATUS_CHANGE' && ev.type !== 'STATUS_CHANGE') return false;

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchCode = ev.eventCode?.toLowerCase().includes(q);
      const matchCategory = ev.categoryLabel?.toLowerCase().includes(q);
      const matchTitle = ev.title?.toLowerCase().includes(q);
      const matchDetail = ev.detail?.toLowerCase().includes(q);
      const matchUser = ev.userName?.toLowerCase().includes(q);
      const matchDriver = ev.driverName?.toLowerCase().includes(q);
      const matchLoc = ev.location?.toLowerCase().includes(q);
      const matchStatus = ev.statusText?.toLowerCase().includes(q);
      if (!matchCode && !matchCategory && !matchTitle && !matchDetail && !matchUser && !matchDriver && !matchLoc && !matchStatus) {
        return false;
      }
    }
    return true;
  });

  // Phân trang hiển thị (hiển thị tối đa visibleCount sự kiện để mượt mà khi lịch sử lớn)
  const visibleEvents = filteredTimelineEvents.slice(0, visibleCount);
  const hasMoreEvents = filteredTimelineEvents.length > visibleCount;

  // Gom nhóm sự kiện đang hiển thị theo Tháng / Năm
  const groupEventsByMonth = (events) => {
    const groups = [];
    const map = new Map();

    events.forEach(ev => {
      const key = ev.monthKey || 'Không rõ thời gian';
      if (!map.has(key)) {
        const arr = [];
        map.set(key, arr);
        groups.push({ monthKey: key, events: arr });
      }
      map.get(key).push(ev);
    });

    return groups;
  };

  const groupedTimeline = groupEventsByMonth(visibleEvents);

  // Chỉ lấy thông tin xe từ danh sách vehicles hoặc dữ liệu đã tải đúng của selectedVehicleId
  const selectedFromList = vehicles.find(v => String(v.vehicle_id) === String(selectedVehicleId)) || null;
  const currentVehicle = (vehicleData.vehicle && String(vehicleData.vehicle.vehicle_id) === String(selectedVehicleId))
    ? { ...selectedFromList, ...vehicleData.vehicle }
    : selectedFromList;

  const isCurrentInTour = currentVehicle?.status === 'IN_TOUR' || Boolean(currentVehicle?.current_tour);
  const effectiveStatus = isCurrentInTour ? 'IN_TOUR' : currentVehicle?.status;
  const currentStatusStyle = getStatusBadgeStyle(effectiveStatus);

  return (
    <div style={styles.container}>
      {/* YÊU CẦU 1: TIÊU ĐỀ TRANG */}
      <div style={styles.headerArea}>
        <div>
          <h1 style={styles.pageTitle}>Lịch sử hoạt động xe</h1>
          <p style={styles.pageSubtitle}>
            Tra cứu lịch sử bảo dưỡng, sửa chữa, sự cố và thay đổi tình trạng phương tiện.
          </p>
        </div>
        <div style={styles.headerActions}>
          {typeof onBack === 'function' && (
            <button type="button" style={styles.btnSecondary} onClick={onBack}>
              <ArrowLeft size={15} style={{ marginRight: '6px' }} />
              Quay lại Quản lý xe
            </button>
          )}
          <button type="button" style={styles.btnSecondary} onClick={handleReload}>
            <RotateCcw size={15} style={{ marginRight: '6px' }} />
            Tải lại dữ liệu
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

      {/* YÊU CẦU 2: KHU VỰC THÔNG TIN PHƯƠNG TIỆN & BỘ CHỌN XE THU GỌN */}
      <div style={styles.vehicleSummaryCard}>
        <div style={styles.vehicleSummaryGrid}>
          {/* Bên trái: Nhận diện phương tiện đang chọn */}
          <div style={styles.vehicleIdentityCol}>
            <div style={styles.vehicleIconBox}>
              <Bus size={22} color="#0284c7" />
            </div>

            {currentVehicle ? (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={styles.vehicleTitleRow}>
                  <span style={styles.plateHighlight}>{currentVehicle.license_plate}</span>
                  {(currentVehicle.vehicle_code || currentVehicle.vehicle_id) && (
                    <span style={styles.codeChip}>
                      Mã: {currentVehicle.vehicle_code || `XE-${currentVehicle.vehicle_id}`}
                    </span>
                  )}
                  <span style={styles.statusPill(currentStatusStyle)}>
                    <span style={styles.statusDot(currentStatusStyle.dot)} />
                    {currentStatusStyle.text}
                  </span>
                </div>

                <div style={styles.vehicleMetaRow}>
                  <span>
                    <strong style={{ color: '#334155' }}>Dòng xe:</strong>{' '}
                    {currentVehicle.brand_model || currentVehicle.vehicle_name || 'Chưa cập nhật'}
                  </span>
                  <span style={styles.metaDivider}>•</span>
                  <span>
                    <strong style={{ color: '#334155' }}>Phân loại:</strong>{' '}
                    {currentVehicle.vehicle_type || `Xe ${currentVehicle.seat_capacity || ''} chỗ`}
                    {currentVehicle.seat_capacity ? ` (${currentVehicle.seat_capacity} chỗ)` : ''}
                  </span>
                  {currentVehicle.color && (
                    <>
                      <span style={styles.metaDivider}>•</span>
                      <span>
                        <strong style={{ color: '#334155' }}>Màu:</strong> {currentVehicle.color}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '13.5px' }}>
                {loadingVehicles
                  ? 'Đang tải danh sách phương tiện...'
                  : 'Chọn một phương tiện ở khung bên phải để tra cứu lịch sử hoạt động.'}
              </div>
            )}
          </div>

          {/* Bên phải: Bộ chọn phương tiện tra cứu */}
          <div style={styles.selectorCol}>
            <label style={styles.selectorLabel}>Phương tiện tra cứu</label>
            {loadingVehicles ? (
              <div style={styles.selectorLoading}>Đang tải danh sách xe...</div>
            ) : vehiclesError ? (
              <div style={{ fontSize: '12.5px', color: '#b91c1c' }}>{vehiclesError}</div>
            ) : (
              <select 
                style={styles.select} 
                value={selectedVehicleId} 
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              >
                <option value="">-- Chọn phương tiện --</option>
                {vehicles.map(v => {
                  const vInTour = v.status === 'IN_TOUR' || Boolean(v.current_tour);
                  const stLabel = formatStatus(vInTour ? 'IN_TOUR' : v.status);
                  return (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.license_plate} — {v.brand_model || v.vehicle_name || `Xe ${v.seat_capacity} chỗ`} ({stLabel})
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* XỬ LÝ TRẠNG THÁI CHƯA CHỌN XE / ĐANG TẢI / LỖI API */}
      {!selectedVehicleId ? (
        <div style={styles.stateCard}>
          <div style={styles.stateIconCircle('#e0f2fe')}>
            <Bus size={24} color="#0284c7" />
          </div>
          <h3 style={styles.stateTitle}>Chưa chọn phương tiện</h3>
          <p style={styles.stateDesc}>
            Vui lòng chọn một phương tiện trong danh sách phía trên để xem lịch sử hoạt động.
          </p>
        </div>
      ) : loadingHistory ? (
        <div style={styles.stateCard}>
          <div style={styles.stateIconCircle('#e0f2fe')}>
            <Clock size={24} color="#0284c7" />
          </div>
          <h3 style={styles.stateTitle}>Đang tải lịch sử hoạt động...</h3>
          <p style={styles.stateDesc}>
            Hệ thống đang đồng bộ dữ liệu bảo dưỡng, sửa chữa, sự cố và thay đổi tình trạng của xe {currentVehicle?.license_plate || ''}.
          </p>
        </div>
      ) : historyError ? (
        <div style={{ ...styles.stateCard, borderColor: '#fecaca', backgroundColor: '#fff' }}>
          <div style={styles.stateIconCircle('#fee2e2')}>
            <AlertCircle size={24} color="#dc2626" />
          </div>
          <h3 style={{ ...styles.stateTitle, color: '#991b1b' }}>Không thể tải dữ liệu lịch sử</h3>
          <p style={styles.stateDesc}>{historyError}</p>
          <button
            type="button"
            onClick={() => fetchVehicleDetails(selectedVehicleId)}
            style={styles.btnPrimaryOutline}
          >
            Thử tải lại
          </button>
        </div>
      ) : (
        <>
          {/* YÊU CẦU 3: KHU VỰC 3 THẺ THỐNG KÊ ĐỒNG NHẤT */}
          <div style={styles.statsGrid}>
            <div 
              style={styles.statCard(filterType === 'MAINTENANCE', '#0284c7')}
              onClick={() => setFilterType(filterType === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
              title="Nhấn để lọc sự kiện Bảo dưỡng, sửa chữa"
            >
              <div style={styles.statCardLeft}>
                <div style={styles.statNumber}>{totalMaintenances}</div>
                <div style={styles.statName}>Bảo dưỡng, sửa chữa</div>
              </div>
              <div style={styles.statIconWrap('#e0f2fe')}>
                <Wrench size={18} color="#0284c7" />
              </div>
            </div>

            <div 
              style={styles.statCard(filterType === 'INCIDENT', '#d97706')}
              onClick={() => setFilterType(filterType === 'INCIDENT' ? 'ALL' : 'INCIDENT')}
              title="Nhấn để lọc sự kiện Sự cố xe"
            >
              <div style={styles.statCardLeft}>
                <div style={styles.statNumber}>{totalIncidents}</div>
                <div style={styles.statName}>Sự cố xe</div>
              </div>
              <div style={styles.statIconWrap('#fef3c7')}>
                <AlertTriangle size={18} color="#d97706" />
              </div>
            </div>

            <div 
              style={styles.statCard(filterType === 'STATUS_CHANGE', '#059669')}
              onClick={() => setFilterType(filterType === 'STATUS_CHANGE' ? 'ALL' : 'STATUS_CHANGE')}
              title="Nhấn để lọc sự kiện Thay đổi tình trạng"
            >
              <div style={styles.statCardLeft}>
                <div style={styles.statNumber}>{totalStatusChanges}</div>
                <div style={styles.statName}>Thay đổi tình trạng</div>
              </div>
              <div style={styles.statIconWrap('#dcfce7')}>
                <Clock size={18} color="#059669" />
              </div>
            </div>
          </div>

          {/* YÊU CẦU 4 & 5: KHUNG TIMELINE KẾT HỢP THANH CÔNG CỤ LỌC & TÌM KIẾM */}
          <div style={styles.timelineCard}>
            {/* 4.1. Thanh công cụ tìm kiếm & bộ lọc thống nhất */}
            <div style={styles.toolbarContainer}>
              <div style={styles.filterTabsRow}>
                <span style={styles.toolbarLabel}>
                  <Filter size={14} color="#64748b" />
                  <span>Bộ lọc:</span>
                </span>
                {[
                  { id: 'ALL', label: 'Tất cả sự kiện', count: totalAll },
                  { id: 'MAINTENANCE', label: 'Bảo dưỡng, sửa chữa', count: totalMaintenances },
                  { id: 'INCIDENT', label: 'Sự cố xe', count: totalIncidents },
                  { id: 'STATUS_CHANGE', label: 'Thay đổi tình trạng', count: totalStatusChanges }
                ].map(tab => {
                  const active = filterType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilterType(tab.id)}
                      style={styles.filterTabBtn(active)}
                    >
                      <span>{tab.label}</span>
                      <span style={styles.filterTabCount(active)}>{tab.count}</span>
                    </button>
                  );
                })}
              </div>

              <div style={styles.searchBoxWrap}>
                <Search size={14} color="#94a3b8" style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Tìm theo mã sự kiện, nội dung, người thực hiện..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={styles.searchInput}
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    style={styles.clearSearchBtn}
                    title="Xóa từ khóa tìm kiếm"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* 5.1. Tiêu đề Timeline Lịch sử hoạt động */}
            <div style={styles.timelineHeaderRow}>
              <div>
                <h2 style={styles.timelineSectionTitle}>Lịch sử hoạt động</h2>
                <p style={styles.timelineSectionDesc}>
                  Các sự kiện được ghi nhận theo thời gian của phương tiện đang chọn.
                </p>
              </div>
              <div style={styles.eventCounterBadge}>
                Hiển thị {filteredTimelineEvents.length} / {totalAll} sự kiện
              </div>
            </div>

            {/* YÊU CẦU 6: XỬ LÝ TRẠNG THÁI KHÔNG CÓ DỮ LIỆU (PHÂN BIỆT CHƯA CÓ LỊCH SỬ VS KHÔNG KHỚP BỘ LỌC) */}
            {totalAll === 0 ? (
              <div style={styles.emptyStateBox}>
                <div style={styles.stateIconCircle('#f1f5f9')}>
                  <FileText size={22} color="#64748b" />
                </div>
                <h4 style={styles.emptyStateTitle}>Chưa có lịch sử hoạt động</h4>
                <p style={styles.emptyStateText}>
                  Phương tiện này chưa có sự kiện nào được ghi nhận.
                </p>
              </div>
            ) : filteredTimelineEvents.length === 0 ? (
              <div style={styles.emptyStateBox}>
                <div style={styles.stateIconCircle('#f1f5f9')}>
                  <Search size={22} color="#64748b" />
                </div>
                <h4 style={styles.emptyStateTitle}>Không tìm thấy sự kiện phù hợp</h4>
                <p style={styles.emptyStateText}>
                  Hãy thay đổi từ khóa hoặc điều kiện lọc để xem kết quả khác.
                </p>
                <button
                  type="button"
                  onClick={() => { setFilterType('ALL'); setSearchKeyword(''); }}
                  style={styles.btnPrimaryOutline}
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div style={styles.timelineList}>
                  {groupedTimeline.map((group, gIdx) => (
                    <div key={group.monthKey} style={styles.monthGroup}>
                      <div style={styles.monthDividerRow}>
                        <div style={styles.monthBadge}>
                          <Calendar size={12} color="#0284c7" />
                          <span>{group.monthKey}</span>
                          <span style={{ color: '#64748b', fontWeight: '500' }}>
                            ({group.events.length})
                          </span>
                        </div>
                        <div style={styles.monthLine} />
                      </div>

                      {group.events.map((ev, idx) => {
                        const isLastEvent = gIdx === groupedTimeline.length - 1 && idx === group.events.length - 1;
                        return (
                          <div key={ev.id} style={styles.timelineItem}>
                            {/* Cột biểu tượng & trục thời gian */}
                            <div style={styles.timelineAxisCol}>
                              <div style={styles.timelineDot(ev.iconBg, ev.iconColor)}>
                                {ev.iconType === 'completed' && <Check size={13} color={ev.iconColor} strokeWidth={2.5} />}
                                {ev.iconType === 'maintenance' && <Wrench size={13} color={ev.iconColor} />}
                                {ev.iconType === 'incident' && <AlertTriangle size={13} color={ev.iconColor} />}
                                {ev.iconType === 'status' && <Clock size={13} color={ev.iconColor} />}
                              </div>
                              {!isLastEvent && <div style={styles.timelineConnector} />}
                            </div>

                            {/* Thẻ nội dung sự kiện */}
                            <div style={styles.eventCard(ev.accentColor)}>
                              {/* Hàng 1: Loại sự kiện + Mã sự kiện + Trạng thái xử lý + Thời gian */}
                              <div style={styles.eventHeaderRow}>
                                <div style={styles.eventBadgesGroup}>
                                  <span style={styles.categoryTag(ev.iconBg, ev.iconColor)}>
                                    {ev.categoryLabel}
                                  </span>
                                  {ev.eventCode && (
                                    <span style={styles.eventCodeTag}>
                                      #{ev.eventCode}
                                    </span>
                                  )}
                                  {ev.statusText && (
                                    <span style={styles.eventStatusTag(ev.statusBg, ev.statusColor, ev.statusBorder)}>
                                      {ev.statusText}
                                    </span>
                                  )}
                                </div>

                                {ev.dateStr && (
                                  <span style={styles.eventTimeText}>
                                    {ev.dateStr}
                                  </span>
                                )}
                              </div>

                              {/* Hàng 2: Tiêu đề / mô tả ngắn */}
                              <div style={styles.eventTitle}>
                                {ev.title}
                              </div>

                              {/* Hàng 3: Nội dung chi tiết / kết quả xử lý / ghi chú (chỉ hiển thị khi thực sự có dữ liệu) */}
                              {ev.detail && (
                                <div style={styles.eventDetailBox}>
                                  {ev.detail}
                                </div>
                              )}

                              {/* Hàng 4: Metadata thực tế (Người thực hiện / Tài xế báo / Vị trí) */}
                              {(ev.userName || ev.driverName || ev.location) && (
                                <div style={styles.eventMetaRow}>
                                  {ev.userName && (
                                    <span style={styles.metaChip}>
                                      <User size={12} color="#64748b" />
                                      <span>Người thực hiện: <strong style={{ color: '#1e293b' }}>{ev.userName}</strong></span>
                                    </span>
                                  )}
                                  {ev.driverName && (
                                    <span style={styles.metaChip}>
                                      <User size={12} color="#64748b" />
                                      <span>
                                        Tài xế báo cáo: <strong style={{ color: '#1e293b' }}>{ev.driverName}</strong>
                                        {ev.driverPhone ? ` (${ev.driverPhone})` : ''}
                                      </span>
                                    </span>
                                  )}
                                  {ev.location && (
                                    <span style={styles.metaChip}>
                                      <MapPin size={12} color="#64748b" />
                                      <span>Vị trí: <strong style={{ color: '#1e293b' }}>{ev.location}</strong></span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Nút tải thêm sự kiện khi danh sách lịch sử lớn */}
                {hasMoreEvents && (
                  <div style={styles.loadMoreRow}>
                    <button
                      type="button"
                      onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                      style={styles.btnLoadMore}
                    >
                      <ChevronDown size={15} />
                      <span>
                        Xem thêm sự kiện ({filteredTimelineEvents.length - visibleCount} sự kiện còn lại)
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px 24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
  },
  headerArea: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  pageSubtitle: {
    fontSize: '13.5px',
    color: '#64748b',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  btnSecondary: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    border: '1px solid #cbd5e1', 
    padding: '8px 14px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '13px', 
    color: '#334155',
    height: '38px',
    boxSizing: 'border-box'
  },
  btnPrimaryOutline: {
    marginTop: '12px',
    padding: '7px 14px',
    borderRadius: '7px',
    border: '1px solid #0284c7',
    backgroundColor: '#f0f9ff',
    color: '#0284c7',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Khu vực thông tin phương tiện & bộ chọn xe thu gọn
  vehicleSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '14px 18px',
    marginBottom: '16px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
  },
  vehicleSummaryGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  vehicleIdentityCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: '1 1 380px',
    minWidth: 0
  },
  vehicleIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '9px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  vehicleTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '4px'
  },
  plateHighlight: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '0.3px'
  },
  codeChip: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    padding: '2px 8px',
    borderRadius: '5px'
  },
  statusPill: (st) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: st.bg,
    color: st.color,
    border: `1px solid ${st.border}`,
    padding: '2px 9px',
    borderRadius: '999px',
    fontSize: '11.5px',
    fontWeight: '600'
  }),
  statusDot: (dotColor) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: dotColor
  }),
  vehicleMetaRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
    fontSize: '12.5px',
    color: '#64748b'
  },
  metaDivider: {
    color: '#cbd5e1'
  },
  selectorCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '0 1 320px',
    minWidth: '250px'
  },
  selectorLabel: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: '#64748b'
  },
  selectorLoading: {
    fontSize: '13px',
    color: '#64748b',
    padding: '8px 0'
  },
  select: { 
    padding: '8px 12px', 
    border: '1px solid #cbd5e1', 
    borderRadius: '7px', 
    fontSize: '13px', 
    backgroundColor: '#ffffff', 
    width: '100%',
    color: '#0f172a',
    fontWeight: '600',
    height: '38px',
    boxSizing: 'border-box',
    outline: 'none'
  },

  // 3 Thẻ thống kê
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    marginBottom: '16px'
  },
  statCard: (active, accentColor) => ({
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: active ? `1.5px solid ${accentColor}` : '1px solid #e2e8f0',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: active ? '0 2px 8px rgba(15, 23, 42, 0.06)' : '0 1px 2px rgba(15, 23, 42, 0.02)',
    transition: 'all 0.15s ease',
    minHeight: '74px',
    boxSizing: 'border-box'
  }),
  statCardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  statNumber: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 1.1
  },
  statName: {
    fontSize: '12.5px',
    color: '#64748b',
    fontWeight: '500'
  },
  statIconWrap: (bg) => ({
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }),

  // Khung Timeline & Thanh công cụ lọc
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '16px 20px 20px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
  },
  toolbarContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    paddingBottom: '14px',
    marginBottom: '16px',
    borderBottom: '1px solid #f1f5f9'
  },
  filterTabsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  toolbarLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#475569',
    marginRight: '4px'
  },
  filterTabBtn: (active) => ({
    padding: '6px 11px',
    borderRadius: '7px',
    border: active ? '1px solid #0284c7' : '1px solid #e2e8f0',
    backgroundColor: active ? '#0284c7' : '#f8fafc',
    color: active ? '#ffffff' : '#334155',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease'
  }),
  filterTabCount: (active) => ({
    fontSize: '11px',
    padding: '1px 6px',
    borderRadius: '999px',
    backgroundColor: active ? 'rgba(255, 255, 255, 0.22)' : '#e2e8f0',
    color: active ? '#ffffff' : '#475569',
    fontWeight: '600'
  }),
  searchBoxWrap: {
    position: 'relative',
    flex: '1 1 250px',
    maxWidth: '320px',
    minWidth: '220px'
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    height: '34px',
    padding: '6px 28px 6px 30px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    fontSize: '12.5px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '15px',
    fontWeight: '700',
    padding: '0 4px'
  },

  // Header của danh sách sự kiện
  timelineHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '16px'
  },
  timelineSectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a'
  },
  timelineSectionDesc: {
    margin: '2px 0 0 0',
    fontSize: '12.5px',
    color: '#64748b'
  },
  eventCounterBadge: {
    fontSize: '12px',
    color: '#475569',
    fontWeight: '600',
    backgroundColor: '#f8fafc',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },

  // Danh sách sự kiện theo tháng
  timelineList: {
    position: 'relative'
  },
  monthGroup: {
    marginBottom: '20px'
  },
  monthDividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px'
  },
  monthBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  monthLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#f1f5f9'
  },
  timelineItem: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    position: 'relative'
  },
  timelineAxisCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '28px',
    flexShrink: 0
  },
  timelineDot: (bg, borderColor) => ({
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: bg,
    border: `1px solid ${borderColor}33`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    flexShrink: 0
  }),
  timelineConnector: {
    width: '1.5px',
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: '4px',
    marginBottom: '2px'
  },
  eventCard: (accentColor) => ({
    flex: 1,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderLeft: `3px solid ${accentColor}`,
    borderRadius: '8px',
    padding: '12px 14px',
    minWidth: 0
  }),
  eventHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '6px'
  },
  eventBadgesGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap'
  },
  categoryTag: (bg, color) => ({
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: bg,
    color: color,
    padding: '2px 8px',
    borderRadius: '4px'
  }),
  eventCodeTag: {
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '2px 7px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0'
  },
  eventStatusTag: (bg, color, border) => ({
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: bg,
    color: color,
    border: `1px solid ${border}`,
    padding: '1.5px 8px',
    borderRadius: '999px'
  }),
  eventTimeText: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  eventTitle: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: '1.4',
    wordBreak: 'break-word'
  },
  eventDetailBox: {
    fontSize: '12.5px',
    color: '#334155',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
    borderRadius: '6px',
    padding: '7px 10px',
    marginTop: '6px',
    lineHeight: '1.45',
    wordBreak: 'break-word'
  },
  eventMetaRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '8px',
    fontSize: '11.5px',
    color: '#64748b'
  },
  metaChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '2px 8px',
    borderRadius: '4px'
  },

  // Phân trang / Xem thêm
  loadMoreRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  },
  btnLoadMore: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '7px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#334155',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  // Trạng thái trống / đang tải / lỗi gọn gàng
  stateCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    padding: '32px 20px'
  },
  stateIconCircle: (bg) => ({
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: bg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px'
  }),
  stateTitle: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a'
  },
  stateDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b'
  },
  emptyStateBox: {
    textAlign: 'center',
    padding: '28px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1'
  },
  emptyStateTitle: {
    margin: '0 0 4px 0',
    fontSize: '14.5px',
    fontWeight: '700',
    color: '#1e293b'
  },
  emptyStateText: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b'
  },
  alert: {
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid transparent'
  },
  closeAlert: {
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '18px'
  }
};

export default StaffVehicleHistory;
