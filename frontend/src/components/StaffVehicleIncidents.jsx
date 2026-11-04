import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  RotateCcw,
  Search,
  MapPin,
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  History,
  FileText,
  User
} from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const StaffVehicleIncidents = ({ onViewHistory }) => {
  const [incidents, setIncidents] = useState([]);
  const [vehiclesMap, setVehiclesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Modal Xử lý sự cố
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Modal Chi tiết nội dung báo cáo (dành cho nội dung dài)
  const [detailIncident, setDetailIncident] = useState(null);

  // Thông báo
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Bộ lọc & Tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterTime, setFilterTime] = useState('ALL'); // ALL | TODAY | 7DAYS | 30DAYS

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form xử lý sự cố
  const [resolveData, setResolveData] = useState({
    action: 'PROCESSING',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Đặt lại trang về 1 khi thay đổi điều kiện tìm kiếm hoặc lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, filterStatus, filterTime, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [incRes, vehRes] = await Promise.allSettled([
        axios.get(`${GATEWAY_URL}/api/tours/fleet/staff/incidents`, { headers }),
        axios.get(`${GATEWAY_URL}/api/tours/fleet/vehicles`, { headers })
      ]);

      if (vehRes.status === 'fulfilled' && vehRes.value?.data?.success) {
        const list = vehRes.value.data.data || [];
        const map = {};
        list.forEach((v) => {
          if (v.license_plate) {
            map[String(v.license_plate).trim().toUpperCase()] = v;
          }
          if (v.vehicle_id) {
            map[`ID_${v.vehicle_id}`] = v;
          }
        });
        setVehiclesMap(map);
      }

      if (incRes.status === 'fulfilled' && incRes.value?.data?.success) {
        setIncidents(incRes.value.data.data || []);
      } else {
        const errMsg =
          incRes.status === 'rejected'
            ? incRes.reason?.response?.data?.message || 'Không thể tải dữ liệu sự cố xe.'
            : 'Không thể tải dữ liệu sự cố xe.';
        setLoadError(errMsg);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách sự cố:', err);
      setLoadError(err.response?.data?.message || 'Không thể tải dữ liệu sự cố xe.');
    } finally {
      setLoading(false);
    }
  };

  // Tra cứu phương tiện liên kết từ dữ liệu JOIN hoặc bảng phương tiện
  const resolveVehicleInfo = (inc) => {
    if (!inc) {
      return {
        vehicleId: null,
        licensePlate: '—',
        brandModel: 'Chưa xác định',
        vehicleStatus: null
      };
    }

    const rawPlate = inc.license_plate || inc.vehicle_number || '';
    const normPlate = String(rawPlate).trim().toUpperCase();
    const matchedVeh =
      (inc.vehicle_id && vehiclesMap[`ID_${inc.vehicle_id}`]) ||
      (normPlate && vehiclesMap[normPlate]) ||
      null;

    const vehicleId = inc.vehicle_id || matchedVeh?.vehicle_id || null;
    const licensePlate = rawPlate ? String(rawPlate).trim() : matchedVeh?.license_plate || '—';

    const rawBrandModel =
      inc.brand_model ||
      inc.vehicle_name ||
      matchedVeh?.brand_model ||
      matchedVeh?.vehicle_name ||
      '';
    const brandModel = String(rawBrandModel).trim() || 'Chưa xác định';

    const vehicleStatus = inc.vehicle_status || matchedVeh?.status || null;

    return {
      vehicleId,
      licensePlate,
      brandModel,
      vehicleStatus
    };
  };

  const isIncidentVehicleInTour = (inc) => {
    if (!inc) return false;
    const { vehicleStatus } = resolveVehicleInfo(inc);
    return vehicleStatus === 'IN_TOUR' || Boolean(inc.current_tour);
  };

  // Ánh xạ Tình trạng xe sang tiếng Việt chuẩn ERP (không hiển thị enum kỹ thuật)
  const getVehicleStatusMeta = (inc) => {
    const { vehicleStatus } = resolveVehicleInfo(inc);
    const inTour = isIncidentVehicleInTour(inc);
    const effectiveStatus = inTour ? 'IN_TOUR' : vehicleStatus;

    switch (effectiveStatus) {
      case 'AVAILABLE':
        return {
          label: 'Sẵn sàng hoạt động',
          bg: '#dcfce7',
          color: '#166534',
          border: '#86efac',
          dot: '#16a34a'
        };
      case 'IN_TOUR':
        return {
          label: 'Đang trong tour',
          bg: '#e0f2fe',
          color: '#075985',
          border: '#7dd3fc',
          dot: '#0284c7'
        };
      case 'MAINTENANCE':
        return {
          label: 'Đang bảo dưỡng',
          bg: '#ffedd5',
          color: '#9a3412',
          border: '#fdba74',
          dot: '#ea580c'
        };
      case 'REPAIR':
        return {
          label: 'Đang sửa chữa',
          bg: '#fee2e2',
          color: '#991b1b',
          border: '#fca5a5',
          dot: '#dc2626'
        };
      case 'INACTIVE':
        return {
          label: 'Tạm ngưng',
          bg: '#f1f5f9',
          color: '#334155',
          border: '#cbd5e1',
          dot: '#64748b'
        };
      default:
        return {
          label: 'Chưa xác định',
          bg: '#f1f5f9',
          color: '#334155',
          border: '#cbd5e1',
          dot: '#64748b'
        };
    }
  };

  // Ánh xạ Trạng thái xử lý sự cố (tách biệt hoàn toàn với tình trạng xe)
  const getIncidentStatusMeta = (status) => {
    switch (status) {
      case 'Reported':
        return {
          label: 'Chưa xử lý',
          bg: '#fee2e2',
          color: '#991b1b',
          border: '#fca5a5',
          dot: '#dc2626'
        };
      case 'Processing':
        return {
          label: 'Đang xử lý',
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fcd34d',
          dot: '#d97706'
        };
      case 'Resolved':
        return {
          label: 'Đã xử lý',
          bg: '#dcfce7',
          color: '#166534',
          border: '#86efac',
          dot: '#16a34a'
        };
      default:
        return {
          label: 'Chưa xác định',
          bg: '#f1f5f9',
          color: '#334155',
          border: '#cbd5e1',
          dot: '#64748b'
        };
    }
  };

  // Định dạng mã sự cố SC-0001
  const formatIncidentCode = (id) => {
    if (id === null || id === undefined) return '—';
    return `SC-${String(id).padStart(4, '0')}`;
  };

  // Định dạng thời gian báo cáo an toàn (không tự tạo ngày giờ giả nếu thiếu)
  const formatReportTime = (rawDate) => {
    if (!rawDate) return { dateStr: '—', timeStr: '', fullStr: '—' };
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return { dateStr: '—', timeStr: '', fullStr: '—' };

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    const dateStr = `${day}/${month}/${year}`;
    const timeStr = `${hours}:${minutes}`;
    return {
      dateStr,
      timeStr,
      fullStr: `${dateStr} ${timeStr}`
    };
  };

  // Làm sạch phần tiền tố kỹ thuật trong ghi chú xử lý để hiển thị dễ đọc nhưng vẫn giữ nguyên ý nghĩa
  const formatStaffNote = (note) => {
    if (!note) return '';
    return String(note).replace(/^\[Sự cố #\d+[^\]]*\]\s*/, '').trim();
  };

  // Thống kê tổng quan từ dữ liệu thực tế
  const stats = useMemo(() => {
    const total = incidents.length;
    const reported = incidents.filter((i) => i.status === 'Reported').length;
    const processing = incidents.filter((i) => i.status === 'Processing').length;
    const resolved = incidents.filter((i) => i.status === 'Resolved').length;
    return { total, reported, processing, resolved };
  }, [incidents]);

  // Lọc và tìm kiếm danh sách sự cố
  const filteredIncidents = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    const now = new Date();

    return incidents.filter((inc) => {
      // 1. Lọc theo trạng thái sự cố
      if (filterStatus !== 'ALL' && inc.status !== filterStatus) {
        return false;
      }

      // 2. Lọc theo khoảng thời gian báo cáo
      if (filterTime !== 'ALL') {
        if (!inc.created_at) return false;
        const createdDate = new Date(inc.created_at);
        if (Number.isNaN(createdDate.getTime())) return false;

        if (filterTime === 'TODAY') {
          const isSameDay =
            createdDate.getDate() === now.getDate() &&
            createdDate.getMonth() === now.getMonth() &&
            createdDate.getFullYear() === now.getFullYear();
          if (!isSameDay) return false;
        } else if (filterTime === '7DAYS') {
          const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (filterTime === '30DAYS') {
          const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      // 3. Tìm kiếm theo Mã sự cố, Biển số xe, Dòng xe, Nội dung báo cáo, Vị trí
      if (kw) {
        const code = formatIncidentCode(inc.incident_id).toLowerCase();
        const rawId = String(inc.incident_id || '').toLowerCase();
        const { licensePlate, brandModel } = resolveVehicleInfo(inc);
        const title = String(inc.title || '').toLowerCase();
        const desc = String(inc.description || '').toLowerCase();
        const location = String(inc.location || '').toLowerCase();
        const staffNote = String(inc.latest_staff_note || '').toLowerCase();

        const matched =
          code.includes(kw) ||
          rawId === kw ||
          licensePlate.toLowerCase().includes(kw) ||
          brandModel.toLowerCase().includes(kw) ||
          title.includes(kw) ||
          desc.includes(kw) ||
          location.includes(kw) ||
          staffNote.includes(kw);

        if (!matched) return false;
      }

      return true;
    });
  }, [incidents, filterStatus, filterTime, searchKeyword, vehiclesMap]);

  // Tính toán phân trang thực tế
  const totalFiltered = filteredIncidents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedIncidents = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return filteredIncidents.slice(startIdx, startIdx + pageSize);
  }, [filteredIncidents, safeCurrentPage, pageSize]);

  const startRecord = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalFiltered);

  const hasActiveFilters =
    filterStatus !== 'ALL' || filterTime !== 'ALL' || searchKeyword.trim() !== '';

  const resetFilters = () => {
    setSearchKeyword('');
    setFilterStatus('ALL');
    setFilterTime('ALL');
    setCurrentPage(1);
  };

  // Mở modal xử lý sự cố (giữ nguyên quy tắc nghiệp vụ hiện có)
  const openResolveModal = (inc) => {
    setSelectedIncident(inc);
    const inTour = isIncidentVehicleInTour(inc);
    // Khi mở hộp thoại: Mặc định chọn PROCESSING nếu xe đang tour hoặc sự cố chưa xử lý,
    // hoặc RESOLVED nếu sự cố đang ở trạng thái Processing
    setResolveData({
      action: inTour ? 'PROCESSING' : inc.status === 'Processing' ? 'RESOLVED' : 'PROCESSING',
      reason: ''
    });
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    const trimmedReason = resolveData.reason ? resolveData.reason.trim() : '';
    if (!trimmedReason) {
      alert('Vui lòng nhập đầy đủ nội dung theo phương án đã chọn!');
      return;
    }

    if (resolveData.action === 'RESOLVED') {
      const genericPhrases = ['đã xử lý', 'da xu ly', 'xong', 'ok', 'đã xong', 'da xong', 'hoàn tất', 'hoan tat', 'đã sửa', 'da sua', 'sửa xong', 'sua xong'];
      const normalized = trimmedReason.toLowerCase().replace(/[.,!?;:]/g, '').trim();
      if (trimmedReason.length < 8 || genericPhrases.includes(normalized)) {
        alert('Vui lòng cung cấp kết quả khắc phục cụ thể (hạng mục đã sửa, linh kiện thay thế hoặc kết quả kiểm tra), không nhập chung chung như "Đã xử lý" hay "Xong"!');
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        status: resolveData.action === 'RESOLVED' ? 'Resolved' : 'Processing',
        action: resolveData.action,
        reason: trimmedReason
      };
      await axios.put(
        `${GATEWAY_URL}/api/tours/fleet/staff/incidents/${selectedIncident.incident_id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlertMsg({
        type: 'success',
        text: `Đã cập nhật xử lý sự cố ${formatIncidentCode(selectedIncident.incident_id)} thành công!`
      });
      setShowResolveModal(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật sự cố');
    } finally {
      setSubmitting(false);
    }
  };

  // Mở trang Lịch sử hoạt động của xe liên quan
  const handleOpenHistory = (inc) => {
    const { vehicleId } = resolveVehicleInfo(inc);
    if (!vehicleId) return;
    sessionStorage.setItem('staff_selected_history_vehicle_id', String(vehicleId));
    if (typeof onViewHistory === 'function') {
      onViewHistory(vehicleId);
    }
  };

  return (
    <div className="staff-incidents-page" style={styles.pageWrapper}>
      <style>{`
        .staff-incidents-page,
        .staff-incidents-page * {
          box-sizing: border-box;
        }
        .staff-incidents-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          margin: 0;
        }
        .staff-incidents-table-wrap {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          margin: 0;
          padding: 0;
        }
        .staff-incidents-table {
          width: 100%;
          max-width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin: 0;
        }
        .staff-incidents-row {
          background-color: #ffffff;
          transition: background-color 0.12s ease;
        }
        .staff-incidents-row:hover {
          background-color: #f1f5f9;
        }
        .staff-incidents-time {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          white-space: nowrap;
        }
        .staff-incidents-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          gap: 5px;
          width: 100%;
          min-width: 0;
        }
        .staff-incidents-actions button {
          width: 100%;
          max-width: 112px;
          justify-content: center;
        }
        .staff-incidents-action-btn:hover:not(:disabled) {
          filter: brightness(0.95);
        }
        @media (max-width: 1320px) {
          .staff-incidents-time {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
        }
        @media (max-width: 900px) {
          .staff-incidents-table-wrap {
            overflow-x: auto;
          }
          .staff-incidents-table {
            min-width: 860px;
          }
        }
      `}</style>

      {/* 1. KHU VỰC TIÊU ĐỀ & NÚT TẢI LẠI DỮ LIỆU */}
      <div style={styles.headerBar}>
        <div style={styles.headerLeft}>
          <div style={styles.titleRow}>
            <h1 style={styles.pageTitle}>Xử lý sự cố xe</h1>
            <span style={styles.SubtleBadge}>Vận hành đội xe</span>
          </div>
          <p style={styles.pageSubtitle}>
            Tiếp nhận báo cáo từ tài xế, theo dõi tiến độ xử lý và cập nhật tình trạng phương tiện.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.reloadBtn}
            onClick={fetchData}
            disabled={loading}
          >
            <RotateCcw size={15} />
            <span>{loading ? 'Đang tải...' : 'Tải lại dữ liệu'}</span>
          </button>
        </div>
      </div>

      {/* Thông báo kết quả thao tác */}
      {alertMsg.text && (
        <div
          style={{
            ...styles.alertBanner,
            backgroundColor: alertMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: alertMsg.type === 'error' ? '#991b1b' : '#166534',
            borderColor: alertMsg.type === 'error' ? '#fecaca' : '#bbf7d0'
          }}
        >
          <span>{alertMsg.text}</span>
          <button
            type="button"
            style={styles.alertCloseBtn}
            onClick={() => setAlertMsg({ type: '', text: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. KHU VỰC THỐNG KÊ TỔNG QUAN NHỎ GỌN (4 CHỈ SỐ THỰC TẾ) */}
      <div style={styles.statsStrip}>
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          style={{
            ...styles.statItem,
            ...(filterStatus === 'ALL' ? styles.statItemActiveBlue : {})
          }}
        >
          <div style={styles.statTopRow}>
            <span style={styles.statLabel}>Tổng sự cố</span>
            <span style={{ ...styles.statDot, backgroundColor: '#0284c7' }} />
          </div>
          <div style={styles.statValue}>{stats.total}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Reported')}
          style={{
            ...styles.statItem,
            ...(filterStatus === 'Reported' ? styles.statItemActiveRed : {})
          }}
        >
          <div style={styles.statTopRow}>
            <span style={styles.statLabel}>Chưa xử lý</span>
            <span style={{ ...styles.statDot, backgroundColor: '#dc2626' }} />
          </div>
          <div style={{ ...styles.statValue, color: '#b91c1c' }}>{stats.reported}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Processing')}
          style={{
            ...styles.statItem,
            ...(filterStatus === 'Processing' ? styles.statItemActiveAmber : {})
          }}
        >
          <div style={styles.statTopRow}>
            <span style={styles.statLabel}>Đang xử lý</span>
            <span style={{ ...styles.statDot, backgroundColor: '#d97706' }} />
          </div>
          <div style={{ ...styles.statValue, color: '#b45309' }}>{stats.processing}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Resolved')}
          style={{
            ...styles.statItem,
            ...(filterStatus === 'Resolved' ? styles.statItemActiveGreen : {})
          }}
        >
          <div style={styles.statTopRow}>
            <span style={styles.statLabel}>Đã xử lý</span>
            <span style={{ ...styles.statDot, backgroundColor: '#16a34a' }} />
          </div>
          <div style={{ ...styles.statValue, color: '#15803d' }}>{stats.resolved}</div>
        </button>
      </div>

      {/* KHUNG CHÍNH: THANH TÌM KIẾM & BỘ LỌC + BẢNG DỮ LIỆU + PHÂN TRANG */}
      <div style={styles.mainCard}>
        {/* 3. THANH TÌM KIẾM VÀ BỘ LỌC GỌN TRÊN CÙNG MỘT HÀNG */}
        <div style={styles.toolbar}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo mã sự cố (SC-0001), biển số, dòng xe, nội dung báo cáo..."
              style={styles.searchInput}
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                style={styles.clearSearchBtn}
                title="Xóa từ khóa"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={styles.filtersGroup}>
            <div style={styles.selectBox}>
              <SlidersHorizontal size={14} style={{ color: '#475569', flexShrink: 0 }} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.filterSelect}
                aria-label="Lọc trạng thái xử lý"
              >
                <option value="ALL">Tất cả trạng thái ({stats.total})</option>
                <option value="Reported">Chưa xử lý ({stats.reported})</option>
                <option value="Processing">Đang xử lý ({stats.processing})</option>
                <option value="Resolved">Đã xử lý ({stats.resolved})</option>
              </select>
            </div>

            <div style={styles.selectBox}>
              <Clock size={14} style={{ color: '#475569', flexShrink: 0 }} />
              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                style={styles.filterSelect}
                aria-label="Lọc thời gian báo cáo"
              >
                <option value="ALL">Mọi thời gian</option>
                <option value="TODAY">Trong hôm nay</option>
                <option value="7DAYS">7 ngày gần đây</option>
                <option value="30DAYS">30 ngày gần đây</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} style={styles.resetFilterBtn}>
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* 4. BẢNG DANH SÁCH SỰ CỐ */}
        {loading ? (
          <div style={styles.stateBox}>
            <div style={styles.stateTitle}>Đang tải danh sách sự cố xe...</div>
            <div style={styles.stateSub}>Vui lòng chờ trong giây lát.</div>
          </div>
        ) : loadError ? (
          <div style={styles.stateBox}>
            <AlertCircle size={28} style={{ color: '#dc2626', marginBottom: '8px' }} />
            <div style={{ ...styles.stateTitle, color: '#991b1b' }}>
              Không thể tải danh sách sự cố
            </div>
            <div style={styles.stateSub}>{loadError}</div>
            <button type="button" onClick={fetchData} style={styles.retryBtn}>
              <RotateCcw size={13} />
              <span>Thử tải lại</span>
            </button>
          </div>
        ) : incidents.length === 0 ? (
          <div style={styles.stateBox}>
            <CheckCircle2 size={28} style={{ color: '#94a3b8', marginBottom: '8px' }} />
            <div style={styles.stateTitle}>Chưa có báo cáo sự cố xe</div>
            <div style={styles.stateSub}>
              Hiện tại chưa có sự cố phương tiện nào được ghi nhận trong hệ thống.
            </div>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div style={styles.stateBox}>
            <Search size={26} style={{ color: '#94a3b8', marginBottom: '8px' }} />
            <div style={styles.stateTitle}>Không tìm thấy sự cố phù hợp</div>
            <div style={styles.stateSub}>
              Không có bản ghi nào khớp với từ khóa hoặc bộ lọc đang chọn.
            </div>
            <button type="button" onClick={resetFilters} style={styles.retryBtn}>
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="staff-incidents-table-wrap">
            <table className="staff-incidents-table">
              {/* Phân bổ tỷ lệ 7 cột chuẩn xác tổng = 100%, hiển thị trọn vẹn mọi tiêu đề và nút thao tác */}
              <colgroup>
                <col style={{ width: '9%' }} />
                <col style={{ width: '16.5%' }} />
                <col style={{ width: '22.5%' }} />
                <col style={{ width: '13.5%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '11.5%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...styles.th, paddingLeft: '12px' }}>MÃ SỰ CỐ</th>
                  <th style={styles.th}>PHƯƠNG TIỆN</th>
                  <th style={styles.th}>NỘI DUNG BÁO CÁO</th>
                  <th style={styles.th}>THỜI GIAN BÁO CÁO</th>
                  <th style={styles.th}>TÌNH TRẠNG XE</th>
                  <th style={styles.th}>TRẠNG THÁI XỬ LÝ</th>
                  <th style={{ ...styles.th, textAlign: 'right', paddingRight: '12px' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIncidents.map((inc) => {
                  const code = formatIncidentCode(inc.incident_id);
                  const { vehicleId, licensePlate, brandModel } = resolveVehicleInfo(inc);
                  const vehStatusMeta = getVehicleStatusMeta(inc);
                  const incStatusMeta = getIncidentStatusMeta(inc.status);
                  const { dateStr, timeStr, fullStr } = formatReportTime(inc.created_at);
                  const cleanNote = formatStaffNote(inc.latest_staff_note);

                  const isLongContent =
                    (inc.description && inc.description.length > 80) ||
                    (cleanNote && cleanNote.length > 75);

                  return (
                    <tr key={inc.incident_id} className="staff-incidents-row" style={styles.tr}>
                      {/* 1. Cột Mã sự cố */}
                      <td style={{ ...styles.td, paddingLeft: '12px' }}>
                        <span style={styles.incidentCodeBadge}>{code}</span>
                      </td>

                      {/* 2. Cột Phương tiện (Dòng 1: Biển số đậm nổi bật | Dòng 2: Tên dòng xe trung tính) */}
                      <td style={styles.td}>
                        <div style={styles.plateText} title={licensePlate}>
                          {licensePlate}
                        </div>
                        <div style={styles.modelText} title={brandModel}>
                          {brandModel}
                        </div>
                      </td>

                      {/* 3. Cột Nội dung báo cáo */}
                      <td style={styles.td}>
                        <div style={styles.reportTitle} title={inc.title || 'Báo cáo sự cố phương tiện'}>
                          {inc.title || 'Báo cáo sự cố phương tiện'}
                        </div>

                        {inc.description ? (
                          <div style={styles.reportDesc} title={inc.description}>
                            {inc.description}
                          </div>
                        ) : (
                          <div style={styles.reportDescMuted}>Chưa xác định mô tả</div>
                        )}

                        {(inc.location || inc.driver_name || isLongContent) && (
                          <div style={styles.reportMetaRow}>
                            {inc.location && (
                              <span style={styles.locationChip} title={`Vị trí: ${inc.location}`}>
                                <MapPin size={12} style={{ color: '#475569', flexShrink: 0 }} />
                                <span style={styles.ellipsisText}>{inc.location}</span>
                              </span>
                            )}
                            {inc.driver_name && (
                              <span style={styles.driverChip} title={`Tài xế: ${inc.driver_name}`}>
                                <User size={12} style={{ color: '#475569', flexShrink: 0 }} />
                                <span style={styles.ellipsisText}>{inc.driver_name}</span>
                              </span>
                            )}
                            {isLongContent && (
                              <button
                                type="button"
                                onClick={() => setDetailIncident(inc)}
                                style={styles.viewDetailLink}
                              >
                                Xem đầy đủ
                              </button>
                            )}
                          </div>
                        )}

                        {cleanNote && (
                          <div style={styles.staffNoteBox} title={cleanNote}>
                            <span style={styles.staffNoteLabel}>Xử lý:</span> {cleanNote}
                          </div>
                        )}
                      </td>

                      {/* 4. Cột Thời gian báo cáo */}
                      <td style={styles.td} title={fullStr}>
                        <div className="staff-incidents-time">
                          <span style={styles.dateMain}>{dateStr}</span>
                          {timeStr && <span style={styles.timeSub}>{timeStr}</span>}
                        </div>
                      </td>

                      {/* 5. Cột Tình trạng xe */}
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusPill,
                            backgroundColor: vehStatusMeta.bg,
                            color: vehStatusMeta.color,
                            borderColor: vehStatusMeta.border
                          }}
                          title={vehStatusMeta.label}
                        >
                          <span
                            style={{
                              ...styles.statusDot,
                              backgroundColor: vehStatusMeta.dot
                            }}
                          />
                          <span>{vehStatusMeta.label}</span>
                        </span>

                        {inc.current_tour?.tour_name && (
                          <div style={styles.tourSubText} title={inc.current_tour.tour_name}>
                            Tour: {inc.current_tour.tour_name}
                          </div>
                        )}
                      </td>

                      {/* 6. Cột Trạng thái xử lý */}
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusPill,
                            backgroundColor: incStatusMeta.bg,
                            color: incStatusMeta.color,
                            borderColor: incStatusMeta.border
                          }}
                          title={incStatusMeta.label}
                        >
                          <span
                            style={{
                              ...styles.statusDot,
                              backgroundColor: incStatusMeta.dot
                            }}
                          />
                          <span>{incStatusMeta.label}</span>
                        </span>
                      </td>

                      {/* 7. Cột Thao tác: Giữ cả 2 nút Xử lý và Lịch sử xe */}
                      <td style={{ ...styles.td, textAlign: 'right', paddingRight: '12px' }}>
                        <div className="staff-incidents-actions">
                          <button
                            type="button"
                            className="staff-incidents-action-btn"
                            onClick={() =>
                              inc.status === 'Resolved'
                                ? setDetailIncident(inc)
                                : openResolveModal(inc)
                            }
                            style={
                              inc.status === 'Resolved'
                                ? styles.processBtnResolved
                                : styles.processBtn
                            }
                            title={
                              inc.status === 'Resolved'
                                ? 'Sự cố đã xử lý hoàn tất - Xem chi tiết hoặc cập nhật bổ sung'
                                : 'Mở quy trình xử lý sự cố'
                            }
                          >
                            <Wrench size={13} style={{ flexShrink: 0 }} />
                            <span>Xử lý</span>
                          </button>

                          <button
                            type="button"
                            className="staff-incidents-action-btn"
                            onClick={() => handleOpenHistory(inc)}
                            disabled={!vehicleId}
                            style={{
                              ...styles.historyBtn,
                              ...(vehicleId ? {} : styles.historyBtnDisabled)
                            }}
                            title={
                              vehicleId
                                ? 'Xem lịch sử hoạt động của xe này'
                                : 'Không tìm thấy hồ sơ phương tiện tương ứng'
                            }
                          >
                            <History size={13} style={{ flexShrink: 0 }} />
                            <span>Lịch sử xe</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. KHU VỰC PHÂN TRANG */}
        {!loading && !loadError && totalFiltered > 0 && (
          <div style={styles.paginationBar}>
            <div style={styles.paginationInfo}>
              <span>
                Hiển thị <strong>{startRecord}–{endRecord}</strong> trong tổng số{' '}
                <strong>{totalFiltered}</strong> sự cố
              </span>
              <div style={styles.pageSizeSelector}>
                <span>Số dòng:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={styles.pageSizeSelect}
                >
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
              </div>
            </div>

            <div style={styles.paginationControls}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                style={{
                  ...styles.pageBtn,
                  ...(safeCurrentPage <= 1 ? styles.pageBtnDisabled : {})
                }}
              >
                <ChevronLeft size={14} />
                <span>Trước</span>
              </button>

              <div style={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - safeCurrentPage) <= 1
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} style={styles.pageEllipsis}>
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        style={{
                          ...styles.pageNumberBtn,
                          ...(safeCurrentPage === item ? styles.pageNumberBtnActive : {})
                        }}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                style={{
                  ...styles.pageBtn,
                  ...(safeCurrentPage >= totalPages ? styles.pageBtnDisabled : {})
                }}
              >
                <span>Sau</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT NỘI DUNG BÁO CÁO (Hỗ trợ đọc nội dung dài hoặc sự cố đã hoàn tất) */}
      {detailIncident && (
        <div style={styles.modalBackdrop} onClick={() => setDetailIncident(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalHeaderTag}>
                  Chi tiết sự cố {formatIncidentCode(detailIncident.incident_id)}
                </div>
                <h2 style={styles.modalTitle}>
                  {detailIncident.title || 'Báo cáo sự cố phương tiện'}
                </h2>
              </div>
              <button
                type="button"
                style={styles.modalCloseBtn}
                onClick={() => setDetailIncident(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.detailGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Phương tiện</span>
                <span style={styles.detailValueStrong}>
                  {resolveVehicleInfo(detailIncident).licensePlate} —{' '}
                  {resolveVehicleInfo(detailIncident).brandModel}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Thời gian báo cáo</span>
                <span style={styles.detailValue}>
                  {formatReportTime(detailIncident.created_at).dateStr}{' '}
                  {formatReportTime(detailIncident.created_at).timeStr}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Tình trạng xe</span>
                <span style={styles.detailValue}>
                  {getVehicleStatusMeta(detailIncident).label}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Trạng thái xử lý</span>
                <span style={styles.detailValue}>
                  {getIncidentStatusMeta(detailIncident.status).label}
                </span>
              </div>
            </div>

            <div style={styles.detailBlock}>
              <div style={styles.detailBlockHeader}>
                <FileText size={14} />
                <span>Nội dung báo cáo của tài xế</span>
              </div>
              <div style={styles.detailBlockBody}>
                {detailIncident.description || 'Không có mô tả chi tiết.'}
              </div>
              {detailIncident.location && (
                <div style={styles.detailLocationRow}>
                  <MapPin size={13} />
                  <span>Vị trí ghi nhận: {detailIncident.location}</span>
                </div>
              )}
            </div>

            {detailIncident.latest_staff_note && (
              <div style={styles.detailNoteBlock}>
                <div style={styles.detailNoteHeader}>Ghi chú xử lý gần nhất</div>
                <div style={styles.detailNoteBody}>
                  {formatStaffNote(detailIncident.latest_staff_note)}
                </div>
              </div>
            )}

            <div style={styles.modalFooter}>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={() => setDetailIncident(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                style={styles.btnPrimary}
                onClick={() => {
                  const target = detailIncident;
                  setDetailIncident(null);
                  openResolveModal(target);
                }}
              >
                <Wrench size={14} />
                <span>Cập nhật xử lý</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XỬ LÝ SỰ CỐ (Bảo toàn 100% quy trình nghiệp vụ hiện tại) */}
      {showResolveModal && selectedIncident && (
        <div style={styles.modalBackdrop} onClick={() => setShowResolveModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalHeaderTag}>Quy trình xử lý sự cố</div>
                <h2 style={styles.modalTitle}>
                  Xử lý sự cố {formatIncidentCode(selectedIncident.incident_id)}
                </h2>
              </div>
              <button
                type="button"
                style={styles.modalCloseBtn}
                onClick={() => setShowResolveModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit}>
              {/* Tóm tắt phương tiện & báo cáo gốc */}
              <div style={styles.incidentSummaryBox}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryKey}>Phương tiện:</span>
                  <span style={styles.summaryVal}>
                    <strong style={{ color: '#0284c7' }}>
                      {resolveVehicleInfo(selectedIncident).licensePlate}
                    </strong>{' '}
                    — {resolveVehicleInfo(selectedIncident).brandModel} (
                    {getVehicleStatusMeta(selectedIncident).label})
                  </span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryKey}>Sự cố:</span>
                  <span style={styles.summaryVal}>
                    <strong>{selectedIncident.title}</strong>
                  </span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryKey}>Báo cáo tài xế:</span>
                  <span style={{ ...styles.summaryVal, fontStyle: 'italic' }}>
                    "{selectedIncident.description}"
                  </span>
                </div>
              </div>

              {/* Cảnh báo nghiệp vụ Phương án A khi xe đang đi Tour */}
              {isIncidentVehicleInTour(selectedIncident) && (
                <div style={styles.inTourWarningBox}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                    ⚠️ Lưu ý nghiệp vụ (Phương tiện đang trong tour):
                  </div>
                  <div>
                    Xe đang phục vụ chuyến đi
                    {selectedIncident.current_tour?.tour_name
                      ? ` "${selectedIncident.current_tour.tour_name}"`
                      : ''}
                    . Nhân viên văn phòng <strong>không được trực tiếp chuyển tình trạng xe sang Đang sửa chữa</strong>.
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    Bạn có thể chọn <strong>Phương án 1 (Tiếp nhận và ghi nhận phương án xử lý)</strong> hoặc{' '}
                    <strong>Phương án 3 (Xác nhận đã khắc phục sự cố)</strong>. Nếu xe không thể tiếp tục hành trình, vui lòng báo{' '}
                    <strong>Quản lý tour</strong> điều phối xe thay thế trước.
                  </div>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Hướng xử lý sự cố *</label>
                <select
                  style={styles.formSelect}
                  value={resolveData.action}
                  onChange={(e) =>
                    setResolveData({ ...resolveData, action: e.target.value })
                  }
                  required
                >
                  <option value="PROCESSING">
                    Ghi nhận tiến độ xử lý
                  </option>
                  <option
                    value="REPAIR"
                    disabled={isIncidentVehicleInTour(selectedIncident)}
                  >
                    Chuyển xe sang sửa chữa{isIncidentVehicleInTour(selectedIncident) ? ' (Không khả dụng khi xe đang trong tour)' : ''}
                  </option>
                  <option value="RESOLVED">
                    Hoàn tất xử lý sự cố
                  </option>
                </select>
                <div style={styles.actionDescBox}>
                  {resolveData.action === 'PROCESSING' && (
                    <span>
                      📋 <strong>Mô tả:</strong> Dùng khi nhân viên tiếp nhận báo cáo, xác minh nguyên nhân, liên hệ cứu hộ, làm việc với đơn vị sửa chữa hoặc cập nhật tiến độ giải quyết sự cố. Trạng thái báo cáo chuyển sang <em>"Đang xử lý"</em>, giữ nguyên tình trạng phương tiện.
                    </span>
                  )}
                  {resolveData.action === 'REPAIR' && (
                    <span>
                      🔧 <strong>Mô tả:</strong> Dùng khi xác định phương tiện cần sửa chữa và không nên tiếp tục được điều động phục vụ hoạt động vận hành. Cập nhật tình trạng xe sang <em>"Đang sửa chữa"</em> và trạng thái báo cáo sang <em>"Đang xử lý"</em>.
                    </span>
                  )}
                  {resolveData.action === 'RESOLVED' && (
                    <span>
                      ✅ <strong>Mô tả:</strong> Dùng khi sự cố đã được giải quyết thực tế và nhân viên ghi nhận kết quả khắc phục cụ thể. Trạng thái báo cáo chuyển sang <em>"Đã xử lý"</em>; hệ thống <strong>không</strong> tự động chuyển xe sang <em>"Sẵn sàng"</em> (xe đang sửa chữa vẫn giữ nguyên trạng thái sửa chữa).
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  {resolveData.action === 'PROCESSING' && 'Nội dung ghi nhận tiến độ *'}
                  {resolveData.action === 'REPAIR' && 'Nguyên nhân và phương án sửa chữa *'}
                  {resolveData.action === 'RESOLVED' && 'Kết quả khắc phục sự cố *'}
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder={
                    resolveData.action === 'PROCESSING'
                      ? 'Ví dụ: Đã liên hệ đơn vị cứu hộ, đang xác minh nguyên nhân và chờ phản hồi...'
                      : resolveData.action === 'REPAIR'
                      ? 'Ví dụ: Xe bị hỏng bánh, đã bố trí đưa xe đến gara để kiểm tra và sửa chữa...'
                      : 'Mô tả hạng mục đã khắc phục, kết quả kiểm tra và tình trạng xử lý thực tế...'
                  }
                  value={resolveData.reason}
                  onChange={(e) =>
                    setResolveData({ ...resolveData, reason: e.target.value })
                  }
                  style={styles.formTextarea}
                />
                <div style={styles.helperText}>
                  * Báo cáo ban đầu của tài xế được giữ nguyên 100%. Ghi chú của nhân viên được lưu riêng vào lịch sử hoạt động phương tiện.
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  style={styles.btnSecondary}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={styles.btnPrimary}
                  disabled={submitting}
                >
                  {submitting
                    ? 'Đang lưu...'
                    : resolveData.action === 'PROCESSING'
                    ? 'Lưu tiến độ xử lý'
                    : resolveData.action === 'REPAIR'
                    ? 'Xác nhận chuyển sửa chữa'
                    : 'Xác nhận hoàn tất sự cố'}
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
  pageWrapper: {
    width: '100%',
    maxWidth: '100%',
    padding: '0 0 24px 0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#0f172a'
  },

  /* 1. Header */
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  pageTitle: {
    margin: 0,
    fontSize: '25px',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '-0.02em',
    lineHeight: 1.25
  },
  SubtleBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    border: '1px solid #7dd3fc',
    padding: '3px 10px',
    borderRadius: '999px',
    whiteSpace: 'nowrap'
  },
  pageSubtitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '400',
    color: '#475569'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0
  },
  reloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    border: '1px solid #94a3b8',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)'
  },

  /* Alert Banner */
  alertBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '11px 16px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '14px',
    fontSize: '13.5px',
    fontWeight: '600'
  },
  alertCloseBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    display: 'flex',
    alignItems: 'center',
    padding: '2px'
  },

  /* 2. Compact Overview Stats Strip */
  statsStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '12px',
    marginBottom: '16px',
    width: '100%'
  },
  statItem: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '12px 16px',
    minHeight: '76px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '4px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minWidth: 0,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
  },
  statItemActiveBlue: {
    borderColor: '#38bdf8',
    backgroundColor: '#f0f9ff',
    boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)'
  },
  statItemActiveRed: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    boxShadow: '0 1px 3px rgba(220, 38, 38, 0.08)'
  },
  statItemActiveAmber: {
    borderColor: '#fcd34d',
    backgroundColor: '#fffbeb',
    boxShadow: '0 1px 3px rgba(217, 119, 6, 0.08)'
  },
  statItemActiveGreen: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
    boxShadow: '0 1px 3px rgba(22, 163, 74, 0.08)'
  },
  statTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '6px'
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  statDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0
  },
  statValue: {
    fontSize: '23px',
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 1.2
  },

  /* Main Container Card */
  mainCard: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
    overflow: 'hidden'
  },

  /* 3. Search & Filter Toolbar */
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    padding: '12px 14px',
    borderBottom: '1px solid #cbd5e1',
    backgroundColor: '#ffffff'
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 280px',
    minWidth: '220px',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '11px',
    color: '#475569',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    height: '38px',
    padding: '0 30px 0 35px',
    fontSize: '13.5px',
    fontWeight: '500',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    border: '1px solid #94a3b8',
    borderRadius: '7px',
    outline: 'none'
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '8px',
    background: 'transparent',
    border: 'none',
    color: '#475569',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center'
  },
  filtersGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  selectBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #94a3b8',
    borderRadius: '7px',
    padding: '0 10px',
    height: '38px'
  },
  filterSelect: {
    border: 'none',
    background: 'transparent',
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#1e293b',
    outline: 'none',
    cursor: 'pointer',
    paddingRight: '2px'
  },
  resetFilterBtn: {
    height: '38px',
    padding: '0 12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0369a1',
    backgroundColor: '#f0f9ff',
    border: '1px solid #7dd3fc',
    borderRadius: '7px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },

  /* 4. Table Header & Cells */
  th: {
    padding: '12px 8px',
    textAlign: 'left',
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    fontSize: '12.5px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0',
    borderBottom: '1.5px solid #cbd5e1',
    whiteSpace: 'nowrap',
    lineHeight: 1.3
  },
  tr: {
    borderBottom: '1px solid #cbd5e1'
  },
  td: {
    padding: '12px 8px',
    fontSize: '14px',
    color: '#1e293b',
    verticalAlign: 'middle',
    minWidth: 0
  },

  /* Column 1: Incident Code */
  incidentCodeBadge: {
    display: 'inline-block',
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    padding: '3px 7px',
    borderRadius: '6px',
    whiteSpace: 'nowrap'
  },

  /* Column 2: Vehicle (2-line layout: License Plate + Brand/Model) */
  plateText: {
    fontSize: '14.5px',
    fontWeight: '700',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.3
  },
  modelText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#334155',
    marginTop: '3px',
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word'
  },

  /* Column 3: Report Content */
  reportTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 1.35,
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  reportDesc: {
    fontSize: '13.5px',
    fontWeight: '400',
    color: '#334155',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word'
  },
  reportDescMuted: {
    fontSize: '13px',
    color: '#475569',
    fontStyle: 'italic'
  },
  reportMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '5px'
  },
  locationChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12.5px',
    fontWeight: '500',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    padding: '2px 7px',
    borderRadius: '5px',
    maxWidth: '165px',
    minWidth: 0
  },
  driverChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12.5px',
    fontWeight: '500',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    padding: '2px 7px',
    borderRadius: '5px',
    maxWidth: '140px',
    minWidth: 0
  },
  ellipsisText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  viewDetailLink: {
    background: 'transparent',
    border: 'none',
    padding: 0,
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#0284c7',
    cursor: 'pointer',
    textDecoration: 'underline',
    whiteSpace: 'nowrap'
  },
  staffNoteBox: {
    marginTop: '5px',
    padding: '3px 8px',
    backgroundColor: '#f0f9ff',
    borderLeft: '3px solid #0284c7',
    borderRadius: '4px',
    fontSize: '12.5px',
    color: '#0c4a6e',
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word'
  },
  staffNoteLabel: {
    fontWeight: '700'
  },

  /* Column 4: Reported Time */
  timeSingleLine: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  dateMain: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#1e293b',
    whiteSpace: 'nowrap'
  },
  timeSub: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#334155',
    whiteSpace: 'nowrap'
  },

  /* Columns 5 & 6: Status Pills */
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '12.5px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    maxWidth: '100%'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0
  },
  tourSubText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0369a1',
    marginTop: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  /* Column 7: Actions (2 harmonized stacked ERP buttons) */
  processBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    height: '28px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: '1px solid #0284c7',
    borderRadius: '6px',
    padding: '0 8px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    flexShrink: 0,
    boxShadow: '0 1px 2px rgba(2, 132, 199, 0.16)'
  },
  processBtnResolved: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    height: '28px',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    border: '1px solid #7dd3fc',
    borderRadius: '6px',
    padding: '0 8px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    flexShrink: 0
  },
  historyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    height: '28px',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    border: '1px solid #94a3b8',
    borderRadius: '6px',
    padding: '0 8px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    flexShrink: 0
  },
  historyBtnDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderColor: '#cbd5e1',
    cursor: 'not-allowed'
  },

  /* 5. Pagination Bar */
  paginationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #cbd5e1'
  },
  paginationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    fontSize: '13.5px',
    fontWeight: '500',
    color: '#1e293b'
  },
  pageSizeSelector: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13.5px',
    fontWeight: '500',
    color: '#334155'
  },
  pageSizeSelect: {
    padding: '4px 8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    border: '1px solid #94a3b8',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  pageBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    height: '30px',
    padding: '0 10px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    border: '1px solid #94a3b8',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  pageBtnDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderColor: '#cbd5e1',
    cursor: 'not-allowed'
  },
  pageNumbers: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  pageNumberBtn: {
    minWidth: '30px',
    height: '30px',
    padding: '0 8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    border: '1px solid #94a3b8',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  pageNumberBtnActive: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    borderColor: '#0284c7'
  },
  pageEllipsis: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    padding: '0 4px'
  },

  /* Empty / Loading / Error States */
  stateBox: {
    padding: '44px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stateTitle: {
    fontSize: '15.5px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '5px'
  },
  stateSub: {
    fontSize: '13.5px',
    color: '#334155',
    maxWidth: '440px'
  },
  retryBtn: {
    marginTop: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0369a1',
    backgroundColor: '#f0f9ff',
    border: '1px solid #7dd3fc',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  /* Modals */
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px'
  },
  modalCard: {
    backgroundColor: '#ffffff',
    width: '560px',
    maxWidth: '100%',
    borderRadius: '12px',
    padding: '20px 22px',
    boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
    border: '1px solid #e2e8f0'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    paddingBottom: '12px',
    marginBottom: '14px',
    borderBottom: '1px solid #e2e8f0'
  },
  modalHeaderTag: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#0284c7',
    letterSpacing: '0.04em',
    marginBottom: '2px'
  },
  modalTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '700',
    color: '#0f172a'
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  incidentSummaryBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  summaryRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '12.5px',
    lineHeight: 1.45
  },
  summaryKey: {
    color: '#64748b',
    fontWeight: '600',
    minWidth: '105px',
    flexShrink: 0
  },
  summaryVal: {
    color: '#1e293b'
  },
  inTourWarningBox: {
    marginBottom: '14px',
    padding: '11px 12px',
    borderRadius: '8px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    fontSize: '12px',
    lineHeight: 1.5
  },
  formGroup: {
    marginBottom: '14px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#334155'
  },
  formSelect: {
    width: '100%',
    padding: '9px 10px',
    fontSize: '13px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    outline: 'none'
  },
  actionDescBox: {
    marginTop: '6px',
    padding: '8px 10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#334155',
    lineHeight: 1.45
  },
  formTextarea: {
    width: '100%',
    padding: '9px 10px',
    fontSize: '13px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  helperText: {
    fontSize: '11.5px',
    color: '#64748b',
    marginTop: '4px'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  /* Detail Modal Specifics */
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '14px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  detailLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b'
  },
  detailValueStrong: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0284c7'
  },
  detailBlock: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px'
  },
  detailBlockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px'
  },
  detailBlockBody: {
    fontSize: '13px',
    color: '#1e293b',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap'
  },
  detailLocationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #e2e8f0',
    fontSize: '12px',
    color: '#475569'
  },
  detailNoteBlock: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderLeft: '3px solid #0284c7',
    borderRadius: '6px',
    padding: '10px 12px'
  },
  detailNoteHeader: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: '4px'
  },
  detailNoteBody: {
    fontSize: '12.5px',
    color: '#0c4a6e',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap'
  }
};

export default StaffVehicleIncidents;
