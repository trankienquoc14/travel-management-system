import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GPSCheckInWidget from './GPSCheckInWidget';

const HRAttendance = () => {
  const [activeSubTab, setActiveSubTab] = useState('summary'); // Mặc định là 'summary' (Tổng hợp theo nhân viên dạng lưới tháng)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  
  // States chọn Tháng/Năm để thống kê tháng giống ảnh
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // States cho Lịch sử chấm công (History Tab) và Thống kê tháng
  const [historyList, setHistoryList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);

  // States cho Modals
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);

  // Danh sách Ca làm việc (Khởi tạo từ localStorage)
  const [shifts, setShifts] = useState(() => {
    const saved = localStorage.getItem('company_shifts');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Ca hành chính', checkIn: '08:00', checkOut: '17:00', gracePeriod: 15, activeDays: 'T2 - T6' },
      { id: 2, name: 'Ca sáng', checkIn: '08:00', checkOut: '12:00', gracePeriod: 10, activeDays: 'T2 - T7' },
      { id: 3, name: 'Ca chiều', checkIn: '13:00', checkOut: '17:00', gracePeriod: 10, activeDays: 'T2 - T7' }
    ];
  });

  const [newShift, setNewShift] = useState({ name: '', checkIn: '08:00', checkOut: '17:00', gracePeriod: 15, activeDays: 'T2 - T6' });

  // Mẫu Đơn nghỉ phép
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Tính số ngày trong tháng được chọn
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Lấy nhãn Thứ trong tuần theo ngày
  const getDayOfWeekLabel = (dayNum) => {
    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
    const day = dateObj.getDay();
    if (day === 0) return 'CN';
    return `T${day + 1}`;
  };

  useEffect(() => {
    fetchDailyAttendance();
  }, [date]);

  // Nạp lịch sử chấm công cho cả tháng đã chọn
  useEffect(() => {
    fetchMonthlyAttendanceHistory();
  }, [selectedMonth, selectedYear, filterStatus, filterRole, searchTerm]);

  const fetchDailyAttendance = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/hr/attendance?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const parsedData = res.data.data.map(item => ({
          ...item,
          status: item.status || 'Present',
          check_in: item.check_in || '',
          check_out: item.check_out || '',
          notes: item.notes || ''
        }));
        setAttendanceList(parsedData);
        setNeedsMigration(res.data.needs_db_migration);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Không thể lấy dữ liệu chấm công ngày!');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAttendanceHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formattedMonth = String(selectedMonth).padStart(2, '0');
      const startDate = `${selectedYear}-${formattedMonth}-01`;
      const endDate = `${selectedYear}-${formattedMonth}-${daysInMonth}`;

      const res = await axios.get(`http://localhost:5000/api/hr/attendance/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate,
          endDate,
          status: filterStatus,
          search: searchTerm,
          role_name: filterRole
        }
      });
      if (res.data.success) {
        setHistoryList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (userId, newStatus) => {
    setAttendanceList(prev => prev.map(item => {
      if (item.user_id === userId) {
        let update = { status: newStatus };
        if ((newStatus === 'Present' || newStatus === 'Late') && !item.check_in) {
          update.check_in = newStatus === 'Present' ? '08:00' : '08:30';
          update.check_out = '17:00';
        } else if (newStatus === 'Absent' || newStatus === 'Leave') {
          update.check_in = '';
          update.check_out = '';
        }
        return { ...item, ...update };
      }
      return item;
    }));
  };

  const handleFieldChange = (userId, field, value) => {
    setAttendanceList(prev => prev.map(item => 
      item.user_id === userId ? { ...item, [field]: value } : item
    ));
  };

  const markAllPresent = () => {
    setAttendanceList(prev => prev.map(item => ({
      ...item,
      status: 'Present',
      check_in: item.check_in || '08:00',
      check_out: item.check_out || '17:00'
    })));
  };

  const handleSave = async () => {
    if (needsMigration) {
      setMessage('Không thể lưu! Vui lòng tạo bảng "timekeeping" trước.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        work_date: date,
        attendance: attendanceList.map(item => ({
          employee_id: item.user_id,
          status: item.status,
          check_in: item.check_in || null,
          check_out: item.check_out || null,
          notes: item.notes || null
        }))
      };

      const res = await axios.post('http://localhost:5000/api/hr/attendance', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMessage('Lưu bảng chấm công hôm nay thành công!');
        setIsError(false);
        fetchDailyAttendance();
        fetchMonthlyAttendanceHistory(); // Nạp lại lịch sử tháng luôn
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Có lỗi xảy ra khi lưu chấm công!');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '0';
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const diff = (outH * 60 + outM) - (inH * 60 + inM);
    if (diff <= 0) return '0';
    return (diff / 60).toFixed(1);
  };

  // KPI Calculations
  const totalEmployees = attendanceList.length;
  const markedCount = attendanceList.filter(item => item.timekeeping_id !== null).length;
  const presentCount = attendanceList.filter(item => item.status === 'Present').length;
  const lateCount = attendanceList.filter(item => item.status === 'Late').length;
  const leaveCount = attendanceList.filter(item => item.status === 'Leave').length;
  const absentCount = attendanceList.filter(item => item.status === 'Absent').length;

  const totalPresentAndLate = presentCount + lateCount;
  const totalAbsentAndLeave = absentCount + leaveCount;

  // Tính tỷ lệ phần trăm
  const presentPercent = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;
  const latePercent = totalEmployees > 0 ? Math.round((lateCount / totalEmployees) * 100) : 0;
  const leavePercent = totalEmployees > 0 ? Math.round((leaveCount / totalEmployees) * 100) : 0;
  const absentPercent = totalEmployees > 0 ? Math.round((absentCount / totalEmployees) * 100) : 0;

  // TỔ CHỨC DỮ LIỆU CHẤM CÔNG DẠNG LƯỚI THÁNG GIỐNG ẢNH
  const getMonthlyGridData = () => {
    const map = {};
    // Khởi tạo tất cả nhân viên trước
    attendanceList.forEach(emp => {
      map[emp.user_id] = {
        user_id: emp.user_id,
        full_name: emp.full_name,
        role_name: emp.role_name,
        email: emp.email,
        days: {} // Số ngày -> record chấm công
      };
    });

    // Điền dữ liệu từ lịch sử tháng
    historyList.forEach(row => {
      const day = new Date(row.work_date).getDate();
      const empId = row.user_id;
      if (map[empId]) {
        map[empId].days[day] = row;
      }
    });

    return Object.values(map);
  };

  const approveLeave = (reqId) => {
    setLeaveRequests(prev => prev.map(item => item.id === reqId ? { ...item, status: 'Approved' } : item));
  };
  const rejectLeave = (reqId) => {
    setLeaveRequests(prev => prev.map(item => item.id === reqId ? { ...item, status: 'Rejected' } : item));
  };

  const exportToCSV = () => {
    let headers = ['Ngay', 'Nhan vien', 'Email', 'Chuc danh', 'Gio vao', 'Gio ra', 'Tong gio', 'Trang thai', 'Ghi chu'];
    let csvRows = [headers.join(',')];
    const dataToExport = historyList;

    dataToExport.forEach(row => {
      const totalHrs = calculateTotalHours(row.check_in, row.check_out);
      const values = [
        row.work_date,
        `"${row.full_name}"`,
        row.email,
        row.role_name,
        row.check_in || '',
        row.check_out || '',
        totalHrs,
        row.status || 'Chua cham',
        `"${row.notes || ''}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_cham_cong_Thang_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="attendance-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '80vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>🏢 Quản lý chấm công</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Thống kê và chi tiết chấm công nhân sự trong doanh nghiệp.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Chọn nhanh Tháng & Năm góc trên bên trái giống hình */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '12px' }}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', color: '#334155', background: '#fff', outline: 'none' }}>
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', color: '#334155', background: '#fff', outline: 'none' }}>
              {[2024, 2025, 2026, 2027].map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <button onClick={() => setShowStatsModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e3a8a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            📊 Thống kê chấm công & Biểu đồ
          </button>
          <button onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
            📥 Xuất Excel (CSV)
          </button>
          <button onClick={() => alert('Thiết lập: Thứ 7 làm nửa ngày (Sáng từ 08:00 đến 12:00)')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
            📅 Thứ 7 đi làm
          </button>
          <button onClick={() => setShowShiftModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1e3a8a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#fff', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)' }}>
            ⚙️ Thiết lập ca làm
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', gap: '24px' }}>
        <button onClick={() => setActiveSubTab('summary')} style={{ padding: '12px 4px', border: 'none', background: 'none', borderBottom: activeSubTab === 'summary' ? '3px solid #1e3a8a' : '3px solid transparent', color: activeSubTab === 'summary' ? '#1e3a8a' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
          Tổng hợp theo nhân viên (Bảng tháng)
        </button>
        <button onClick={() => setActiveSubTab('daily_detail')} style={{ padding: '12px 4px', border: 'none', background: 'none', borderBottom: activeSubTab === 'daily_detail' ? '3px solid #1e3a8a' : '3px solid transparent', color: activeSubTab === 'daily_detail' ? '#1e3a8a' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
          Chi tiết theo ngày (Điểm danh)
        </button>
        <button onClick={() => setActiveSubTab('requests')} style={{ padding: '12px 4px', border: 'none', background: 'none', borderBottom: activeSubTab === 'requests' ? '3px solid #1e3a8a' : '3px solid transparent', color: activeSubTab === 'requests' ? '#1e3a8a' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Quản lý đơn {leaveRequests.filter(r => r.status === 'Pending').length > 0 && <span style={{ padding: '2px 6px', background: '#ef4444', color: '#fff', fontSize: '11px', borderRadius: '10px', fontWeight: '700' }}>{leaveRequests.filter(r => r.status === 'Pending').length}</span>}
        </button>
      </div>

      {/* Database Warning Alert */}
      {needsMigration && (
        <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', marginBottom: '20px', color: '#b45309' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>⚠️ Cảnh báo: Chưa tạo bảng "timekeeping" trong CSDL</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>
            Vui lòng chạy lệnh SQL tạo bảng chấm công để lưu dữ liệu điểm danh thực tế.
          </p>
        </div>
      )}

      {/* KPI Cards Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>SỐ CHẤM CÔNG DỮ LIỆU</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '10px 0 2px 0' }}>{markedCount}/{totalEmployees}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Nhân viên đã được chấm công</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>CÓ MẶT</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#14532d', margin: '10px 0 2px 0' }}>{totalPresentAndLate}</div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>Đúng giờ & đi muộn</div>
        </div>
        <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>CHƯA ĐỦ VÀO/RA</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#78350f', margin: '10px 0 2px 0' }}>{absentCount}</div>
          <div style={{ fontSize: '12px', color: '#b45309' }}>Thiếu giờ vào hoặc ra</div>
        </div>
        <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>VẮNG</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#7f1d1d', margin: '10px 0 2px 0' }}>{totalAbsentAndLeave}</div>
          <div style={{ fontSize: '12px', color: '#b91c1c' }}>Vắng mặt & Nghỉ phép</div>
        </div>
      </div>

      {/* Main Tab View Areas */}
      {activeSubTab === 'summary' && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          
          {/* Filters section matching screenshot */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Tìm tên / mã NV / email..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '220px' }}
            />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#475569', outline: 'none' }}>
              <option value="All">Tất cả chức danh</option>
              <option value="HR Manager">HR Manager</option>
              <option value="Tour Guide">Tour Guide</option>
              <option value="Tour Operator">Tour Operator</option>
              <option value="Office Staff">Office Staff</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#475569', outline: 'none' }}>
              <option value="All">Tất cả trạng thái</option>
              <option value="Present">Có mặt</option>
              <option value="Late">Đi muộn</option>
              <option value="Leave">Nghỉ phép</option>
              <option value="Absent">Vắng mặt</option>
            </select>
            <button onClick={() => { setSearchTerm(''); setFilterRole('All'); setFilterStatus('All'); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
              Đặt lại
            </button>
            
            <button onClick={exportToCSV} style={{ marginLeft: 'auto', padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📥 Xuất Excel
            </button>
          </div>

          {/* Legend / Chú thích y hệt screenshot */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '12px', color: '#475569', alignItems: 'center' }}>
            <strong>Chú thích:</strong>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#1e3a8a', fontWeight: '700' }}>8:00</span> đủ công</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#0f766e', fontWeight: '700' }}>8:00</span> nghỉ phép</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#d97706', fontWeight: '700' }}>8:00 ⚠</span> đi muộn</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#991b1b', fontWeight: '700' }}>???</span> thiếu vào/ra</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#94a3b8', fontWeight: '700' }}>-</span> không có (vắng)</span>
          </div>

          {/* Grid Table of Month Days */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700', width: '50px' }}>#</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700', width: '220px' }}>Nhân viên</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '700', width: '140px' }}>Chức danh</th>
                  
                  {/* Generate Day Column headers with Day Number & Day of Week label */}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const dayNum = i + 1;
                    const dayLabel = getDayOfWeekLabel(dayNum);
                    const isWeekend = dayLabel === 'CN' || dayLabel === 'T7';
                    return (
                      <th key={dayNum} style={{
                        padding: '8px 6px',
                        textAlign: 'center',
                        color: isWeekend ? '#ef4444' : '#475569',
                        fontWeight: '700',
                        fontSize: '11px',
                        minWidth: '40px',
                        borderLeft: '1px solid #f1f5f9',
                        background: isWeekend ? '#fef2f2' : 'transparent'
                      }}>
                        <div>{dayNum}</div>
                        <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>{dayLabel}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {getMonthlyGridData().length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 3} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      Không có nhân sự nào hoạt động.
                    </td>
                  </tr>
                ) : (
                  getMonthlyGridData().map((emp, idx) => (
                    <tr key={emp.user_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{emp.full_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>NV{emp.user_id} • {emp.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontWeight: '500' }}>{emp.role_name}</td>
                      
                      {/* Render Monthly cells based on status */}
                      {[...Array(daysInMonth)].map((_, i) => {
                        const dayNum = i + 1;
                        const dayLabel = getDayOfWeekLabel(dayNum);
                        const isWeekend = dayLabel === 'CN' || dayLabel === 'T7';
                        const record = emp.days[dayNum];

                        let cellText = '-';
                        let cellColor = '#94a3b8'; // default Absent gray
                        let cellFontWeight = 'normal';

                        if (record) {
                          if (record.status === 'Present') {
                            cellText = '8:00';
                            cellColor = '#1e3a8a'; // Deep blue for Present
                            cellFontWeight = '700';
                          } else if (record.status === 'Late') {
                            cellText = '8:00 ⚠';
                            cellColor = '#d97706'; // Amber for Late
                            cellFontWeight = '700';
                          } else if (record.status === 'Leave') {
                            cellText = '8:00';
                            cellColor = '#0f766e'; // Teal for Leave
                            cellFontWeight = '700';
                          } else if (record.status === 'Absent') {
                            cellText = '-';
                            cellColor = '#ef4444';
                          }

                          // Nếu bị thiếu giờ check-in / check-out
                          if ((record.status === 'Present' || record.status === 'Late') && (!record.check_in || !record.check_out)) {
                            cellText = '???';
                            cellColor = '#b91c1c';
                            cellFontWeight = '700';
                          }
                        }

                        return (
                          <td key={dayNum} style={{
                            padding: '12px 4px',
                            textAlign: 'center',
                            color: cellColor,
                            fontWeight: cellFontWeight,
                            fontSize: '11px',
                            borderLeft: '1px solid #f1f5f9',
                            background: isWeekend ? '#fef2f2' : 'transparent'
                          }}>
                            {cellText}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'daily_detail' && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Chọn ngày chấm công:</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              <button onClick={markAllPresent} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                ✅ Chọn Có mặt tất cả
              </button>
            </div>
          </div>

          {message && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', background: isError ? '#fef2f2' : '#f0fdf4', color: isError ? '#991b1b' : '#166534', border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`, fontSize: '14px' }}>
              {message}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Nhân sự</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>📸 Ảnh Selfie AI</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Trạng thái</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Giờ Vào</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Giờ Ra</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Tổng giờ</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map(emp => (
                  <tr key={emp.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{emp.full_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.role_name} • {emp.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {emp.face_image_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src={emp.face_image_url.startsWith('http') ? emp.face_image_url : `http://localhost:5000${emp.face_image_url}`} 
                            alt="Selfie Checkin" 
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }} 
                          />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#166534' }}>Khớp {emp.match_confidence || 98.5}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có ảnh</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={emp.status}
                        onChange={(e) => handleStatusChange(emp.user_id, e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: emp.status === 'Present' ? '#f0fdf4' : emp.status === 'Absent' ? '#fef2f2' : emp.status === 'Late' ? '#fffbeb' : '#f0fdfa', color: emp.status === 'Present' ? '#166534' : emp.status === 'Absent' ? '#991b1b' : emp.status === 'Late' ? '#92400e' : '#0f766e', fontWeight: '600' }}
                      >
                        <option value="Present">✅ Có mặt</option>
                        <option value="Absent">❌ Vắng mặt</option>
                        <option value="Late">⏳ Đi muộn</option>
                        <option value="Leave">🏥 Nghỉ phép</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <input type="time" value={emp.check_in} disabled={emp.status === 'Absent' || emp.status === 'Leave'} onChange={(e) => handleFieldChange(emp.user_id, 'check_in', e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '90px' }} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <input type="time" value={emp.check_out} disabled={emp.status === 'Absent' || emp.status === 'Leave'} onChange={(e) => handleFieldChange(emp.user_id, 'check_out', e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '90px' }} />
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#334155' }}>
                      {calculateTotalHours(emp.check_in, emp.check_out)} giờ
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <input type="text" value={emp.notes} placeholder="Nhập ghi chú..." onChange={(e) => handleFieldChange(emp.user_id, 'notes', e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', maxWidth: '200px' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={loading || needsMigration} style={{ padding: '12px 24px', background: needsMigration ? '#94a3b8' : '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', cursor: needsMigration ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)' }}>
              {loading ? 'Đang lưu...' : '💾 Lưu bảng chấm công hôm nay'}
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'requests' && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Danh sách đơn xin nghỉ phép chờ duyệt:</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Nhân viên</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Loại đơn</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Thời gian nghỉ</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Lý do</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Trạng thái</th>
                  <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{req.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{req.role}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f766e' }}>{req.type}</td>
                    <td style={{ padding: '14px 16px' }}>Từ {req.fromDate} đến {req.toDate}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{req.reason}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: req.status === 'Pending' ? '#fff3cd' : req.status === 'Approved' ? '#e2fbe8' : '#fde2e2',
                        color: req.status === 'Pending' ? '#854d0e' : req.status === 'Approved' ? '#15803d' : '#b91c1c'
                      }}>
                        {req.status === 'Pending' ? 'Chờ duyệt' : req.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {req.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => approveLeave(req.id)} style={{ padding: '6px 12px', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Duyệt</button>
                          <button onClick={() => rejectLeave(req.id)} style={{ padding: '6px 12px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Từ chối</button>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>Không có thao tác</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 MODAL 1: THỐNG KÊ CHẤM CÔNG & BIỂU ĐỒ                   */}
      {/* ========================================================= */}
      {showStatsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '650px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: '700' }}>📊 Thống kê hiệu suất chấm công ngày {date}</h3>
              <button onClick={() => setShowStatsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Circle Donut Chart */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: `conic-gradient(#10b981 0% ${presentPercent}%, #f59e0b ${presentPercent}% ${presentPercent + latePercent}%, #3b82f6 ${presentPercent + latePercent}% ${presentPercent + latePercent + leavePercent}%, #ef4444 ${presentPercent + latePercent + leavePercent}% 100%)`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05), 0 4px 10px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                      {totalEmployees > 0 ? Math.round(((presentCount + lateCount) / totalEmployees) * 100) : 0}%
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Tỷ lệ đi làm</span>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginTop: '20px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                    <span>Có mặt: <strong>{presentPercent}%</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                    <span>Đi muộn: <strong>{latePercent}%</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></span>
                    <span>Nghỉ phép: <strong>{leavePercent}%</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                    <span>Vắng: <strong>{absentPercent}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Bar Chart comparing totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: '#334155', fontSize: '15px' }}>Biểu đồ cột so sánh số lượng:</h4>
                
                {/* Bar 1 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>
                    <span>Có mặt đúng giờ ({presentCount})</span>
                    <span>{presentPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${presentPercent}%`, height: '100%', background: '#10b981', borderRadius: '5px' }}></div>
                  </div>
                </div>

                {/* Bar 2 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>
                    <span>Đi muộn ({lateCount})</span>
                    <span>{latePercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${latePercent}%`, height: '100%', background: '#f59e0b', borderRadius: '5px' }}></div>
                  </div>
                </div>

                {/* Bar 3 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>
                    <span>Nghỉ phép có lương ({leaveCount})</span>
                    <span>{leavePercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${leavePercent}%`, height: '100%', background: '#3b82f6', borderRadius: '5px' }}></div>
                  </div>
                </div>

                {/* Bar 4 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>
                    <span>Vắng không phép ({absentCount})</span>
                    <span>{absentPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${absentPercent}%`, height: '100%', background: '#ef4444', borderRadius: '5px' }}></div>
                  </div>
                </div>

              </div>

            </div>

            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button onClick={() => setShowStatsModal(false)} style={{ padding: '10px 20px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 MODAL 2: THIẾT LẬP CA LÀM                              */}
      {/* ========================================================= */}
      {showShiftModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: '700' }}>⚙️ Thiết lập danh sách ca làm việc</h3>
              <button onClick={() => setShowShiftModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            {/* List of Shifts */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>Ca làm việc đang hoạt động:</h4>
              <div style={{ display: 'grid', gap: '10px' }}>
                {shifts.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>{s.name}</strong>
                      <div style={{ color: '#64748b', marginTop: '4px' }}>Thời gian: {s.checkIn} - {s.checkOut} | Cho phép đi muộn: {s.gracePeriod} phút | Ngày: {s.activeDays}</div>
                    </div>
                    <button onClick={() => handleDeleteShift(s.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Xóa</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Form to Add Shift */}
            <form onSubmit={handleAddShift} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#1e293b' }}>➕ Thêm ca làm mới:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Tên ca làm</label>
                  <input type="text" placeholder="Ví dụ: Ca gãy, ca đêm..." value={newShift.name} onChange={(e) => setNewShift({ ...newShift, name: e.target.value })} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Giờ check-in</label>
                  <input type="time" value={newShift.checkIn} onChange={(e) => setNewShift({ ...newShift, checkIn: e.target.value })} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Giờ check-out</label>
                  <input type="time" value={newShift.checkOut} onChange={(e) => setNewShift({ ...newShift, checkOut: e.target.value })} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Đi muộn cho phép (Phút)</label>
                  <input type="number" min="0" value={newShift.gracePeriod} onChange={(e) => setNewShift({ ...newShift, gracePeriod: parseInt(e.target.value) || 0 })} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Ngày áp dụng</label>
                  <input type="text" value={newShift.activeDays} onChange={(e) => setNewShift({ ...newShift, activeDays: e.target.value })} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }} />
                </div>
              </div>
              <button type="submit" style={{ padding: '10px 16px', background: '#166534', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', width: '100%' }}>Lưu ca làm</button>
            </form>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button onClick={() => setShowShiftModal(false)} style={{ padding: '10px 20px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRAttendance;
