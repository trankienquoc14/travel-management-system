import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, AlertTriangle, Calendar as CalendarIcon, Trash2, Edit3, X, Flag, Truck, MapPin, Users, Phone } from 'lucide-react';
import '../index.css';

const PersonalSchedule = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : {};
  const roleId = Number(user?.role || user?.role_id);
  const roleName = String(user?.role || '');

  const isGuide = roleId === 5 || roleName === 'Tour Guide' || roleName === 'HDV';
  const isDriver = roleId === 8 || roleName === 'Driver' || roleName === 'Tài xế';

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [tasks, setTasks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [assignedWork, setAssignedWork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkDetail, setSelectedWorkDetail] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    work_date: '',
    start_time: '08:00',
    end_time: '12:00',
    priority: 'Trung bình',
    status: 'Chưa làm'
  });

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const formatDateToYYYYMMDD = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const sunday = new Date(currentWeekStart);
      sunday.setDate(sunday.getDate() + 6);
      
      const startStr = formatDateToYYYYMMDD(currentWeekStart);
      const endStr = formatDateToYYYYMMDD(sunday);

      const workEndpoint = isGuide 
        ? 'http://localhost:5000/api/guide/work' 
        : isDriver 
        ? 'http://localhost:5000/api/driver/work' 
        : null;

      const [taskRes, holRes, workRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/staff/schedule/tasks?start_date=${startStr}&end_date=${endStr}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } })),
        axios.get(`http://localhost:5000/api/staff/schedule/holidays`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } })),
        workEndpoint 
          ? axios.get(workEndpoint, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false, data: [] } }))
          : Promise.resolve({ data: { success: true, data: [] } })
      ]);

      if (taskRes.data?.success) setTasks(taskRes.data.data);
      if (holRes.data?.success) setHolidays(holRes.data.data);
      if (workRes.data?.success) setAssignedWork(workRes.data.data || []);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const handleCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const handleDateSelect = (selectedDateStr) => {
    if (!selectedDateStr) return;
    const selectedDate = new Date(selectedDateStr);
    if (isNaN(selectedDate.getTime())) return;

    const day = selectedDate.getDay();
    const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(selectedDate.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatDisplayDate = (d) => {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const formatDisplayDateWithYear = (d) => {
    if (!d) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isHoliday = (date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    return holidays.find(h => h.holiday_date && h.holiday_date.startsWith(dateStr));
  };

  const getAssignedWorkForDate = (date) => {
    const targetStr = formatDateToYYYYMMDD(date);
    if (!targetStr || !assignedWork.length) return [];

    return assignedWork.filter(item => {
      if (!item.departure_date) return false;
      const depStr = String(item.departure_date).split('T')[0];
      const retStr = item.return_date ? String(item.return_date).split('T')[0] : depStr;
      return targetStr >= depStr && targetStr <= retStr;
    });
  };

  const handleOpenModal = (task = null, defaultDate = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        work_date: task.work_date.split('T')[0],
        start_time: task.start_time.substring(0, 5),
        end_time: task.end_time.substring(0, 5),
        priority: task.priority,
        status: task.status
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        work_date: defaultDate ? formatDateToYYYYMMDD(defaultDate) : formatDateToYYYYMMDD(currentWeekStart),
        start_time: '08:00',
        end_time: '12:00',
        priority: 'Trung bình',
        status: 'Chưa làm'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingTask) {
        await axios.put(`http://localhost:5000/api/staff/schedule/tasks/${editingTask.task_id}`, taskForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`http://localhost:5000/api/staff/schedule/tasks`, taskForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      alert("Lỗi khi lưu công việc");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa công việc này?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/staff/schedule/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert("Lỗi xóa công việc");
    }
  };

  const renderTaskSlot = (date, isMorning) => {
    const holiday = isHoliday(date);
    if (holiday) {
      return (
        <div style={{ height: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>
          🎉 {holiday.holiday_name}
        </div>
      );
    }
    if (date.getDay() === 0) { // Sunday
      return (
        <div style={{ height: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontWeight: 'bold', fontSize: '13px' }}>
          ☕ Nghỉ
        </div>
      );
    }

    const dateStr = formatDateToYYYYMMDD(date);
    const slotTasks = tasks.filter(t => {
      if (!t.work_date.startsWith(dateStr)) return false;
      const hour = parseInt(t.start_time.split(':')[0], 10);
      return isMorning ? (hour < 13) : (hour >= 13);
    });

    const matchingWorks = getAssignedWorkForDate(date);

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', boxSizing: 'border-box' }}>
        {/* LỊCH PHÂN CÔNG TOUR HOẶC TÀI XẾ */}
        {matchingWorks.map((work, idx) => (
          <div 
            key={`work-${work.departure_id}-${idx}`}
            onClick={() => setSelectedWorkDetail(work)}
            style={{
              padding: '8px 10px',
              background: isGuide 
                ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' 
                : 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
              color: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
            title="Nhấp để xem chi tiết lịch tour/chuyến đi"
          >
            <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.95, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{isGuide ? '🚩 HDV TOUR' : '🚌 CHUYẾN XE'}</span>
              <span style={{ fontSize: '9px', backgroundColor: 'rgba(255,255,255,0.25)', padding: '1px 5px', borderRadius: '4px' }}>
                {isMorning ? 'Sáng' : 'Chiều'}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '3px', lineHeight: '1.3' }}>
              {work.tour_name}
            </div>
            {isDriver && work.vehicle_number && (
              <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.95 }}>
                🚘 Xe: <strong>{work.vehicle_number}</strong>
              </div>
            )}
            {isGuide && work.destination && (
              <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.9 }}>
                📍 {work.destination}
              </div>
            )}
          </div>
        ))}

        {/* CÔNG VIỆC CÁ NHÂN */}
        {slotTasks.map(task => (
          <div key={task.task_id} style={{
            padding: '8px 10px', backgroundColor: task.status === 'Hoàn thành' ? '#f0fdf4' : task.status === 'Đang thực hiện' ? '#eff6ff' : task.status === 'Quá hạn' ? '#fef2f2' : '#fff',
            border: `1px solid ${task.status === 'Hoàn thành' ? '#bbf7d0' : task.status === 'Đang thực hiện' ? '#bfdbfe' : task.status === 'Quá hạn' ? '#fecaca' : '#e2e8f0'}`,
            borderRadius: '6px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }} onClick={() => handleOpenModal(task)}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px', textDecoration: task.status === 'Hoàn thành' ? 'line-through' : 'none' }}>
              {task.title}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} /> {task.start_time.substring(0,5)} - {task.end_time.substring(0,5)}
            </div>
          </div>
        ))}

        <button onClick={() => handleOpenModal(null, date)} style={{ marginTop: 'auto', padding: '5px', background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#64748b', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Plus size={13} /> Thêm
        </button>
      </div>
    );
  };

  const weekDays = getWeekDays();
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // Calculate stats
  const todayStr = formatDateToYYYYMMDD(new Date());
  const todayTasks = tasks.filter(t => t.work_date && t.work_date.startsWith(todayStr));
  const inProgress = tasks.filter(t => t.status === 'Đang thực hiện').length;
  const completed = tasks.filter(t => t.status === 'Hoàn thành').length;
  const overdue = tasks.filter(t => t.status === 'Quá hạn').length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={24} color="#3b82f6" /> Lịch làm việc cá nhân & Đoàn tour
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            {isGuide ? 'Theo dõi lịch dẫn đoàn được phân công và công việc cá nhân.' : isDriver ? 'Theo dõi lịch lái xe đưa đón đoàn tour và công việc cá nhân.' : 'Quản lý công việc và thời khóa biểu trong tuần.'}
          </p>
        </div>
        <button onClick={() => handleOpenModal()} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}>
          <Plus size={18} /> Thêm công việc
        </button>
      </div>

      {/* SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {(isGuide || isDriver) && (
          <div style={{ backgroundColor: isGuide ? '#eff6ff' : '#f0fdf4', padding: '16px', borderRadius: '12px', border: `1px solid ${isGuide ? '#bfdbfe' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: isGuide ? '#1e40af' : '#166534', fontWeight: '600' }}>
                {isGuide ? '🚩 Tour được gán' : '🚌 Chuyến xe được gán'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: isGuide ? '#1d4ed8' : '#15803d' }}>
                {assignedWork.length} <span style={{fontSize:'13px', fontWeight:'normal'}}>chuyến</span>
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: isGuide ? '#dbeafe' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isGuide ? '#2563eb' : '#16a34a' }}>
              {isGuide ? <Flag size={22} /> : <Truck size={22} />}
            </div>
          </div>
        )}
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Hôm nay</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{todayTasks.length} <span style={{fontSize:'13px', fontWeight:'normal'}}>việc</span></div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><CalendarIcon size={22} /></div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Đang thực hiện</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>{inProgress}</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Clock size={22} /></div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Đã hoàn thành</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{completed}</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><CheckCircle size={22} /></div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Quá hạn</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>{overdue}</div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><AlertTriangle size={22} /></div>
        </div>
      </div>

      {/* CALENDAR CONTROLS */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#fff',
        padding: '12px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handlePrevWeek} 
            title="Tuần trước"
            style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: '600', fontSize: '13px' }}
          >
            <ChevronLeft size={18} /> Tuần trước
          </button>
          <button 
            onClick={handleCurrentWeek} 
            title="Về tuần hiện tại"
            style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#fff', fontSize: '13px', boxShadow: '0 2px 4px rgba(59,130,246,0.2)' }}
          >
            Tuần này
          </button>
          <button 
            onClick={handleNextWeek} 
            title="Tuần sau"
            style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: '600', fontSize: '13px' }}
          >
            Tuần sau <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <label htmlFor="week-date-picker" style={{ fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarIcon size={16} color="#3b82f6" /> Chọn ngày/tháng/năm:
            </label>
            <input
              id="week-date-picker"
              type="date"
              value={formatDateToYYYYMMDD(currentWeekStart)}
              onChange={(e) => handleDateSelect(e.target.value)}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#fff',
                color: '#0f172a',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af', backgroundColor: '#eff6ff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            📅 {formatDisplayDateWithYear(weekDays[0])} ➔ {formatDisplayDateWithYear(weekDays[6])}
          </div>
        </div>
      </div>

      {/* WEEKLY GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải lịch làm việc...</div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '100px', padding: '16px', borderBottom: '2px solid #e2e8f0', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>THỜI GIAN</th>
                {weekDays.map((d, i) => (
                  <th key={i} style={{ padding: '16px', borderBottom: '2px solid #e2e8f0', borderRight: i<6 ? '1px solid #e2e8f0' : 'none', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: d.getDay() === 0 ? '#ef4444' : '#0f172a' }}>{dayNames[i]}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{formatDisplayDate(d)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'center', verticalAlign: 'middle', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                  08:00<br/>|<br/>12:00
                </td>
                {weekDays.map((d, i) => (
                  <td key={i} style={{ borderBottom: '1px solid #e2e8f0', borderRight: i<6 ? '1px solid #e2e8f0' : 'none', verticalAlign: 'top', minHeight: '180px' }}>
                    {renderTaskSlot(d, true)}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '16px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'center', verticalAlign: 'middle', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                  13:30<br/>|<br/>17:30
                </td>
                {weekDays.map((d, i) => (
                  <td key={i} style={{ borderRight: i<6 ? '1px solid #e2e8f0' : 'none', verticalAlign: 'top', minHeight: '180px' }}>
                    {renderTaskSlot(d, false)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CHI TIẾT TOUR / CHUYẾN XE */}
      {selectedWorkDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '520px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ 
              background: isGuide ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)', 
              color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isGuide ? <Flag size={24} /> : <Truck size={24} />}
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>
                    {isGuide ? 'Chi tiết Tour được phân công' : 'Chi tiết Chuyến xe được gán'}
                  </h2>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                    Mã chuyến: #{selectedWorkDetail.departure_id}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedWorkDetail(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Tên chương trình / Tour</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                  {selectedWorkDetail.tour_name}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={14} color="#3b82f6" /> Ngày khởi hành
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                    {selectedWorkDetail.departure_date?.split('T')[0]}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarIcon size={14} color="#ef4444" /> Ngày kết thúc
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                    {selectedWorkDetail.return_date?.split('T')[0]}
                  </div>
                </div>
              </div>

              {selectedWorkDetail.destination && (
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#10b981" /> Điểm đến / Hành trình
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                    {selectedWorkDetail.destination} ({selectedWorkDetail.duration_days || 1} ngày)
                  </div>
                </div>
              )}

              {isDriver && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={14} color="#16a34a" /> Biển số xe
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>
                      {selectedWorkDetail.vehicle_number || 'Chưa gán xe'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#2563eb" /> HDV cùng đoàn
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', marginTop: '4px' }}>
                      {selectedWorkDetail.guide_name || 'Chưa gán HDV'}
                    </div>
                    {selectedWorkDetail.guide_phone && (
                      <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {selectedWorkDetail.guide_phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isGuide && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#2563eb" /> Khách hàng đã đặt
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
                      {selectedWorkDetail.actual_booked || 0} / {selectedWorkDetail.max_slots || 0} khách
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Trạng thái đoàn</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                      {selectedWorkDetail.status || 'Đang vận hành'}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setSelectedWorkDetail(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO/SỬA CÔNG VIỆC CÁ NHÂN */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '500px', maxWidth: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>{editingTask ? 'Chi tiết công việc' : 'Thêm công việc mới'}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmitTask} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Tên công việc *</label>
                <input required type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="Nhập tên công việc..." />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Mô tả chi tiết</label>
                <textarea rows="3" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} placeholder="Ghi chú thêm..."></textarea>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Ngày *</label>
                  <input required type="date" value={taskForm.work_date} onChange={e => setTaskForm({...taskForm, work_date: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Mức độ ưu tiên</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                    <option value="Thấp">Thấp</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Cao">Cao</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Giờ bắt đầu *</label>
                  <input required type="time" value={taskForm.start_time} onChange={e => setTaskForm({...taskForm, start_time: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Giờ kết thúc *</label>
                  <input required type="time" value={taskForm.end_time} onChange={e => setTaskForm({...taskForm, end_time: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Trạng thái</label>
                <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: taskForm.status === 'Hoàn thành' ? '#f0fdf4' : taskForm.status === 'Đang thực hiện' ? '#eff6ff' : '#fff' }}>
                  <option value="Chưa làm">Chưa làm</option>
                  <option value="Đang thực hiện">Đang thực hiện</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Quá hạn">Quá hạn</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                {editingTask ? (
                  <button type="button" onClick={() => handleDeleteTask(editingTask.task_id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <Trash2 size={16} /> Xóa công việc
                  </button>
                ) : <div></div>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} /> Lưu công việc
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PersonalSchedule;

