import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, AlertTriangle, Calendar as CalendarIcon, Trash2, Edit3, X } from 'lucide-react';
import '../index.css';

const PersonalSchedule = () => {
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
  const [loading, setLoading] = useState(true);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const sunday = new Date(currentWeekStart);
      sunday.setDate(sunday.getDate() + 6);
      
      const startStr = currentWeekStart.toISOString().split('T')[0];
      const endStr = sunday.toISOString().split('T')[0];

      const [taskRes, holRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/staff/schedule/tasks?start_date=${startStr}&end_date=${endStr}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`http://localhost:5000/api/staff/schedule/holidays`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({data: {data: []}}))
      ]);

      if (taskRes.data.success) setTasks(taskRes.data.data);
      if (holRes.data?.success) setHolidays(holRes.data.data);
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

  const formatDisplayDate = (d) => {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find(h => h.holiday_date.startsWith(dateStr));
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
        work_date: defaultDate ? defaultDate.toISOString().split('T')[0] : currentWeekStart.toISOString().split('T')[0],
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

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/staff/schedule/tasks/${taskId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert("Lỗi cập nhật trạng thái");
    }
  };

  const renderTaskSlot = (date, isMorning) => {
    const holiday = isHoliday(date);
    if (holiday) {
      return (
        <div style={{ height: '100%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#ef4444', fontWeight: 'bold' }}>
          🎉 {holiday.holiday_name}
        </div>
      );
    }
    if (date.getDay() === 0) { // Sunday
      return (
        <div style={{ height: '100%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontWeight: 'bold' }}>
          ☕ Nghỉ
        </div>
      );
    }

    const dateStr = date.toISOString().split('T')[0];
    const slotTasks = tasks.filter(t => {
      if (!t.work_date.startsWith(dateStr)) return false;
      const hour = parseInt(t.start_time.split(':')[0], 10);
      return isMorning ? (hour < 13) : (hour >= 13);
    });

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
        {slotTasks.map(task => (
          <div key={task.task_id} style={{
            padding: '10px', backgroundColor: task.status === 'Hoàn thành' ? '#f0fdf4' : task.status === 'Đang thực hiện' ? '#eff6ff' : task.status === 'Quá hạn' ? '#fef2f2' : '#fff',
            border: `1px solid ${task.status === 'Hoàn thành' ? '#bbf7d0' : task.status === 'Đang thực hiện' ? '#bfdbfe' : task.status === 'Quá hạn' ? '#fecaca' : '#e2e8f0'}`,
            borderRadius: '6px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }} onClick={() => handleOpenModal(task)}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px', textDecoration: task.status === 'Hoàn thành' ? 'line-through' : 'none' }}>
              {task.title}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {task.start_time.substring(0,5)} - {task.end_time.substring(0,5)}
            </div>
          </div>
        ))}
        <button onClick={() => handleOpenModal(null, date)} style={{ marginTop: 'auto', padding: '6px', background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#64748b', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Plus size={14} /> Thêm
        </button>
      </div>
    );
  };

  const weekDays = getWeekDays();
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // Calculate stats
  const todayTasks = tasks.filter(t => t.work_date.startsWith(new Date().toISOString().split('T')[0]));
  const inProgress = tasks.filter(t => t.status === 'Đang thực hiện').length;
  const completed = tasks.filter(t => t.status === 'Hoàn thành').length;
  const overdue = tasks.filter(t => t.status === 'Quá hạn').length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={24} color="#3b82f6" /> Lịch làm việc cá nhân
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Quản lý công việc và thời khóa biểu trong tuần.</p>
        </div>
        <button onClick={() => handleOpenModal()} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}>
          <Plus size={18} /> Thêm công việc
        </button>
      </div>

      {/* SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Hôm nay</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{todayTasks.length} <span style={{fontSize:'14px', fontWeight:'normal'}}>công việc</span></div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><CalendarIcon size={24} /></div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Đang thực hiện</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>{inProgress}</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Clock size={24} /></div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Đã hoàn thành</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{completed}</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><CheckCircle size={24} /></div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Quá hạn</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>{overdue}</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><AlertTriangle size={24} /></div>
        </div>
      </div>

      {/* CALENDAR CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <button onClick={handlePrevWeek} style={{ padding: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={20} /></button>
        <button onClick={handleCurrentWeek} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>Tuần này</button>
        <button onClick={handleNextWeek} style={{ padding: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={20} /></button>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginLeft: '16px' }}>
          {formatDisplayDate(weekDays[0])} - {formatDisplayDate(weekDays[6])}
        </div>
      </div>

      {/* WEEKLY GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải lịch...</div>
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
                  <td key={i} style={{ borderBottom: '1px solid #e2e8f0', borderRight: i<6 ? '1px solid #e2e8f0' : 'none', verticalAlign: 'top', height: '180px' }}>
                    {renderTaskSlot(d, true)}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '16px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'center', verticalAlign: 'middle', fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                  13:30<br/>|<br/>17:30
                </td>
                {weekDays.map((d, i) => (
                  <td key={i} style={{ borderRight: i<6 ? '1px solid #e2e8f0' : 'none', verticalAlign: 'top', height: '180px' }}>
                    {renderTaskSlot(d, false)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
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
