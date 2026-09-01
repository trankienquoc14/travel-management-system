import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const GuideTimelineCalendar = ({ guides, guideSchedules, selectedMonth }) => {
    let year, month;
    if (selectedMonth === 'all' || !selectedMonth) {
        const d = new Date();
        year = d.getFullYear();
        month = d.getMonth() + 1;
    } else {
        [year, month] = selectedMonth.split('-').map(Number);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthStart = new Date(year, month - 1, 1).getTime();
    const monthEnd = new Date(year, month, 0, 23, 59, 59).getTime();

    const getGuideTasks = (guideId) => {
        return guideSchedules.filter(sch => {
            if (sch.guide_id !== guideId) return false;
            const dStart = new Date(sch.departure_date).getTime();
            const dEnd = new Date(sch.return_date).getTime();
            return (dStart <= monthEnd && dEnd >= monthStart);
        });
    };

    return (
        <div style={{ marginTop: '32px', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: '800' }}>Biểu Đồ Lịch Phân Công Hướng Dẫn Viên (Tháng {month}/{year})</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Trực quan hóa lịch trình thực tế để tránh xếp trùng lặp</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '3px' }}></div> Tour Cố định</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></div> Thiết kế riêng</div>
                </div>
            </div>
            <div style={{ overflowX: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '200px', flexShrink: 0, fontWeight: '700', color: '#475569', fontSize: '14px' }}>Hướng dẫn viên</div>
                    <div style={{ display: 'flex', flex: 1, minWidth: `${daysInMonth * 24}px` }}>
                        {daysArray.map(d => (
                            <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{d}</div>
                        ))}
                    </div>
                </div>
                {guides.map(guide => {
                    const tasks = getGuideTasks(guide.user_id);
                    return (
                        <div key={guide.user_id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: '200px', flexShrink: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '8px' }} title={guide.full_name}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#64748b' }}>
                                    {guide.full_name.charAt(0)}
                                </div>
                                {guide.full_name}
                            </div>
                            <div style={{ display: 'flex', flex: 1, minWidth: `${daysInMonth * 24}px`, position: 'relative', height: '32px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                {tasks.map(task => {
                                    const tStart = new Date(task.departure_date);
                                    const tEnd = new Date(task.return_date);
                                    
                                    let startDay = 1;
                                    if (tStart.getFullYear() === year && tStart.getMonth() + 1 === month) {
                                        startDay = tStart.getDate();
                                    }
                                    
                                    let endDay = daysInMonth;
                                    if (tEnd.getFullYear() === year && tEnd.getMonth() + 1 === month) {
                                        endDay = tEnd.getDate();
                                    }

                                    const leftPercent = ((startDay - 1) / daysInMonth) * 100;
                                    const widthPercent = ((endDay - startDay + 1) / daysInMonth) * 100;

                                    return (
                                        <div key={task.departure_id} title={`${task.tour_name} (${task.departure_date} -> ${task.return_date})`} style={{
                                            position: 'absolute',
                                            left: `${leftPercent}%`,
                                            width: `${widthPercent}%`,
                                            height: '100%',
                                            background: task.is_custom ? '#10b981' : '#3b82f6',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            color: '#fff',
                                            fontWeight: '700',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            cursor: 'help',
                                            padding: '0 4px',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {task.tour_name.substring(0, 15)}{task.tour_name.length > 15 ? '...' : ''}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MasterOperationalTimeline = ({ guideSchedules, selectedMonth, setSelectedMonth, currentYear }) => {
    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);

    // Tính số tour/lịch trình thực tế cho từng tháng từ CSDL
    const getMonthCount = (m) => {
        if (!guideSchedules) return 0;
        return guideSchedules.filter(sch => {
            if (!sch.departure_date) return false;
            const d = new Date(sch.departure_date);
            return d.getFullYear() === currentYear && (d.getMonth() + 1) === m;
        }).length;
    };

    const totalToursInYear = guideSchedules ? guideSchedules.filter(sch => {
        if (!sch.departure_date) return false;
        return new Date(sch.departure_date).getFullYear() === currentYear;
    }).length : 0;

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📅 QUẢN LÝ LỊCH VẬN HÀNH 12 THÁNG NĂM {currentYear}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Chọn Tháng để xem danh sách tour di chuyển được gắn trực tiếp vào khu vực từng tháng.
                    </p>
                </div>

                <div style={{ background: '#f0f9ff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#0284c7', border: '1px solid #bae6fd' }}>
                    🚀 Tổng số đợt khởi hành: {totalToursInYear} tour
                </div>
            </div>

            {/* THANH 12 THÁNG TRONG NĂM VỚI THỐNG KÊ TOUR THỰC TẾ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '8px', overflowX: 'auto' }}>
                
                {/* TAB TẤT CẢ */}
                <button
                    onClick={() => setSelectedMonth('all')}
                    style={{
                        padding: '10px 6px',
                        border: selectedMonth === 'all' ? 'none' : '1px solid #cbd5e1',
                        borderRadius: '12px',
                        background: selectedMonth === 'all' ? 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' : '#ffffff',
                        color: selectedMonth === 'all' ? '#ffffff' : '#475569',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: selectedMonth === 'all' ? '0 4px 12px rgba(15, 23, 42, 0.25)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span>📅 Tất cả</span>
                    <span style={{
                        background: selectedMonth === 'all' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                        color: selectedMonth === 'all' ? '#ffffff' : '#0284c7',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800'
                    }}>
                        {totalToursInYear} tour
                    </span>
                </button>

                {/* TAB THÁNG 1 ĐẾN THÁNG 12 */}
                {monthsArray.map(m => {
                    const count = getMonthCount(m);
                    const monthKey = `${currentYear}-${String(m).padStart(2, '0')}`;
                    const isSelected = selectedMonth === monthKey;
                    const hasTours = count > 0;

                    return (
                        <button
                            key={m}
                            onClick={() => setSelectedMonth(monthKey)}
                            style={{
                                padding: '10px 6px',
                                border: isSelected ? 'none' : (hasTours ? '1px solid #93c5fd' : '1px solid #e2e8f0'),
                                borderRadius: '12px',
                                background: isSelected 
                                    ? 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)' 
                                    : (hasTours ? '#f0f9ff' : '#ffffff'),
                                color: isSelected ? '#ffffff' : (hasTours ? '#0369a1' : '#64748b'),
                                fontWeight: isSelected || hasTours ? '800' : '600',
                                fontSize: '12px',
                                cursor: 'pointer',
                                boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease',
                                opacity: !hasTours && !isSelected ? 0.75 : 1
                            }}
                        >
                            <span>Tháng {m}</span>
                            <span style={{
                                background: isSelected 
                                    ? 'rgba(255,255,255,0.25)' 
                                    : (hasTours ? '#0284c7' : '#e2e8f0'),
                                color: isSelected 
                                    ? '#ffffff' 
                                    : (hasTours ? '#ffffff' : '#64748b'),
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: '800'
                            }}>
                                {count} tour
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const TourOperationalManager = () => {
    const [tours, setTours] = useState([]);
    const [selectedTour, setSelectedTour] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Core states needed for Departures
    const [departures, setDepartures] = useState([]);
    const [guides, setGuides] = useState([]);

    // Hidden states needed to preserve Tour Designer data when saving
    const [itineraryDays, setItineraryDays] = useState([]);
    const [markupPercent, setMarkupPercent] = useState(20);
    const [baseCost, setBaseCost] = useState(0);
    const [basePrice, setBasePrice] = useState(0);
    const [activeTourTab, setActiveTourTab] = useState('fixed'); // 'fixed' | 'custom'
    const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' or 'YYYY-MM'

    const currentYear = new Date().getFullYear();
    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Fetch Approved/Active Tours
            const resTours = await axios.get('http://localhost:5000/api/tours/staff/tours', { headers });
            if (resTours.data.success) {
                const opsTours = (resTours.data.data || []).filter(t => t.status === 'Approved' || t.status === 'Active');
                setTours(opsTours);
            }

            // 2. Fetch Guides
            const resEmployees = await axios.get('http://localhost:5000/api/hr/employees', { headers });
            if (resEmployees.data.success) {
                const guideList = (resEmployees.data.data || []).filter(e => 
                    (e.role_id === 5 || e.role_name === 'Tour Guide' || e.role_name?.toLowerCase().includes('guide')) && 
                    e.status === 'Active'
                );
                setGuides(guideList);
            }
        } catch (error) { 
            console.error('Error fetching initial data', error); 
        }
    };

    const handleSelectTour = async (tour) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/tours/admin/${tour.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const d = res.data.data;
                setSelectedTour(d);
                setDepartures(d.departures || []);
                
                // Preserve existing design configuration
                setItineraryDays(d.itineraryDays || []);
                setMarkupPercent(d.markup_percent || 20);
                setBaseCost(d.base_cost || 0);
                setBasePrice(d.base_price || 0);
            }
        } catch (e) { 
            alert("Lỗi tải thông tin tour!"); 
        } finally { 
            setLoading(false); 
        }
    };

    const [guideSchedules, setGuideSchedules] = useState([]);
    const fetchGuideSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/tours/admin/guide-schedule', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setGuideSchedules(res.data.data || []);
            }
        } catch (error) {
            console.error('Lỗi lấy lịch chạy HDV', error);
        }
    };

    useEffect(() => {
        fetchGuideSchedules();
    }, []);

    const formatMoney = (val) => Number(val || 0).toLocaleString('vi-VN') + ' ₫';

    const handleSaveDepartures = async () => {
        if (!selectedTour) return;

        for (let i = 0; i < departures.length; i++) {
            const dep = departures[i];
            if (!dep.departure_date) {
                alert(`⚠️ Đợt #${i + 1}: Vui lòng chọn Ngày khởi hành!`);
                return;
            }
            if (dep.departure_date < todayStr) {
                alert(`⚠️ Đợt #${i + 1}: Ngày khởi hành (${formatDateStr(dep.departure_date)}) không được ở quá khứ! Vui lòng chọn từ ngày hôm nay (${formatDateStr(todayStr)}) trở đi.`);
                return;
            }
            if (dep.return_date && dep.return_date < dep.departure_date) {
                alert(`⚠️ Đợt #${i + 1}: Ngày về (${formatDateStr(dep.return_date)}) không được trước Ngày khởi hành!`);
                return;
            }
            if (!dep.max_slots || dep.max_slots <= 0) {
                alert(`⚠️ Đợt #${i + 1}: Số lượng khách tối đa phải lớn hơn 0!`);
                return;
            }
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/tours/admin/save`, {
                tour_id: selectedTour.tour_id,
                tour_name: selectedTour.tour_name,
                destination: selectedTour.destination,
                duration_days: selectedTour.duration_days,
                description: selectedTour.description,
                status: selectedTour.status,
                existing_image_url: selectedTour.image_url,
                base_cost: baseCost,
                markup_percent: markupPercent,
                base_price: basePrice,
                itineraryDays: JSON.stringify(itineraryDays),
                departures: JSON.stringify(departures)
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                alert(`🎉 Đã lưu cấu hình lịch trình & phân công Hướng dẫn viên thành công cho Tour: ${selectedTour.tour_name}`);
                fetchGuideSchedules();
                handleSelectTour(selectedTour);
            }
        } catch (e) { 
            alert("Lỗi khi lưu lịch trình khởi hành!"); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleActivateTour = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn mở bán Tour này ra website không?')) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`http://localhost:5000/api/tours/admin/status/${selectedTour.tour_id}`, { status: 'Active' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert('🚀 Đã mở bán Tour thành công!');
                setSelectedTour({ ...selectedTour, status: 'Active' });
                setTours(tours.map(t => t.tour_id === selectedTour.tour_id ? { ...t, status: 'Active' } : t));
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi mở bán tour!');
        } finally {
            setLoading(false);
        }
    };

    const handleDepartureDateChange = (idx, value) => {
        const up = [...departures];
        up[idx].departure_date = value;
        
        if (value && selectedTour?.duration_days) {
            const depDate = new Date(value);
            depDate.setDate(depDate.getDate() + (Number(selectedTour.duration_days) - 1));
            up[idx].return_date = depDate.toISOString().split('T')[0];
        }
        
        setDepartures(up);
    };

    const formatDateStr = (dateStr) => {
        if (!dateStr) return 'Chưa chọn';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Hàm lấy danh sách tour có đợt di chuyển thuộc Tháng m
    const getToursForMonth = (m) => {
        return tours
            .filter(t => activeTourTab === 'custom' ? t.is_custom === 1 : (t.is_custom === 0 || !t.is_custom))
            .filter(t => {
                return guideSchedules.some(sch => {
                    if (sch.tour_id !== t.tour_id && sch.tour_name !== t.tour_name) return false;
                    if (!sch.departure_date) return false;
                    const d = new Date(sch.departure_date);
                    return d.getFullYear() === currentYear && (d.getMonth() + 1) === m;
                });
            });
    };

    // Xác định các tháng cần hiển thị
    const monthsToRender = selectedMonth === 'all' 
        ? Array.from({ length: 12 }, (_, i) => i + 1)
        : [Number(selectedMonth.split('-')[1])];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Outfit", "Inter", sans-serif', background: '#f5f7fa', overflowY: 'auto' }}>
            <div className="page-header" style={{ marginBottom: '25px', padding: '0 24px', paddingTop: '24px' }}>
                <h2 style={{ fontSize: '28px', color: '#111827', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>🚀 Quản Lý Điều Hành</h2>
                <p style={{ color: '#4b5563', fontSize: '15px', margin: 0, fontWeight: '500' }}>Phân bổ lịch chạy, thiết lập thời gian và phân công Hướng dẫn viên.</p>
            </div>

            <div style={{ flex: 1, padding: '0 24px 40px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                
                {/* 1. THANH LOẠI TOUR (TOUR CỐ ĐỊNH & THIẾT KẾ RIÊNG) */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#e2e8f0', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
                    <button 
                        onClick={() => { setActiveTourTab('fixed'); setSelectedTour(null); }}
                        style={{ padding: '10px 24px', background: activeTourTab === 'fixed' ? '#fff' : 'transparent', color: activeTourTab === 'fixed' ? '#0194f3' : '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: activeTourTab === 'fixed' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                    >
                        Tour Cố Định
                    </button>
                    <button 
                        onClick={() => { setActiveTourTab('custom'); setSelectedTour(null); }}
                        style={{ padding: '10px 24px', background: activeTourTab === 'custom' ? '#fff' : 'transparent', color: activeTourTab === 'custom' ? '#0194f3' : '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: activeTourTab === 'custom' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                    >
                        Thiết Kế Riêng
                    </button>
                </div>

                {/* 2. THANH THỜI GIAN VẬN HÀNH 12 THÁNG TRONG NĂM */}
                <MasterOperationalTimeline 
                    guideSchedules={guideSchedules} 
                    selectedMonth={selectedMonth} 
                    setSelectedMonth={setSelectedMonth} 
                    currentYear={currentYear}
                />

                {/* 3. KHU VỰC DANH SÁCH TOUR ĐƯỢC GẮN TRỰC TIẾP THEO TỪNG THÁNG */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {monthsToRender.map(m => {
                        const toursInMonth = getToursForMonth(m);
                        const monthSchedulesCount = guideSchedules ? guideSchedules.filter(sch => {
                            if (!sch.departure_date) return false;
                            const d = new Date(sch.departure_date);
                            return d.getFullYear() === currentYear && (d.getMonth() + 1) === m;
                        }).length : 0;
                        
                        // Nếu đang chọn "Tất cả" và tháng này không có tour thì bỏ qua cho gọn giao diện
                        if (selectedMonth === 'all' && toursInMonth.length === 0) return null;

                        return (
                            <div key={m} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                                
                                {/* HEADER KHU VỰC THÁNG M */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px' }}>
                                    <h3 style={{ margin: 0, fontSize: '19px', color: '#1e3a8a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>📅</span> THÁNG {m} / {currentYear}
                                    </h3>
                                    <span style={{ background: monthSchedulesCount > 0 ? '#0284c7' : '#94a3b8', color: '#ffffff', padding: '4px 14px', borderRadius: '14px', fontSize: '12px', fontWeight: '800' }}>
                                        🚀 {monthSchedulesCount} lịch trình ({toursInMonth.length} tour)
                                    </span>
                                </div>

                                {/* NẾU KHÔNG CÓ TOUR TRONG THÁNG NÀY */}
                                {toursInMonth.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '36px', background: '#f8fafc', borderRadius: '14px', border: '2px dashed #cbd5e1', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                                        🗓️ Chưa có tour trong tháng này
                                    </div>
                                ) : (
                                    /* DANH SÁCH TOUR VÀ LỊCH CHẠY GẮN TRỰC TIẾP TRONG THÁNG NÀY */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {toursInMonth.map(t => {
                                            const isExpanded = selectedTour?.tour_id === t.tour_id;

                                            return (
                                                <div key={t.tour_id} style={{ background: '#fff', borderRadius: '18px', border: isExpanded ? '2px solid #0194f3' : '1px solid #e2e8f0', overflow: 'hidden', boxShadow: isExpanded ? '0 12px 30px rgba(1, 148, 243, 0.15)' : '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.3s ease' }}>
                                                    
                                                    {/* TOUR HEADER (CLICK ĐỂ MỞ RỘNG / THU GỌN) */}
                                                    <div 
                                                        onClick={() => isExpanded ? setSelectedTour(null) : handleSelectTour(t)}
                                                        style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? '#f8fafc' : '#fff', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                                                    >
                                                        <div>
                                                            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', color: isExpanded ? '#0369a1' : '#111827' }}>
                                                                🚩 {t.tour_name}
                                                            </h4>
                                                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                <span>🕒 {t.duration_days} Ngày</span>
                                                                <span>📍 {t.destination}</span>
                                                                <span style={{ color: '#0ea5e9' }}>💵 Tỷ suất LN: {t.markup_percent}%</span>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                            <span style={{ 
                                                                fontSize: '12px', 
                                                                padding: '6px 12px', 
                                                                borderRadius: '20px', 
                                                                fontWeight: '700',
                                                                background: t.status === 'Active' ? '#ecfdf5' : '#fffbeb',
                                                                color: t.status === 'Active' ? '#059669' : '#d97706'
                                                            }}>
                                                                {t.status === 'Active' ? 'Đang mở bán' : 'Chờ mở bán'}
                                                            </span>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isExpanded ? '#e0f2fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? '#0ea5e9' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* NỘI DUNG MỞ RỘNG (ĐỢT KHỞI HÀNH & ĐIỀU HÀNH) */}
                                                    {isExpanded && (
                                                        <div style={{ padding: '24px', background: '#fff' }}>
                                                            
                                                            {/* TOOLBAR NÚT THÊM ĐỢT MỚI */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e3a8a' }}>
                                                                    📋 Thiết Lập Ngày Khởi Hành & Phân Công Hướng Dẫn Viên:
                                                                </div>
                                                                {activeTourTab !== 'custom' && (
                                                                    <button onClick={() => setDepartures([...departures, { departure_date: '', return_date: '', max_slots: 30, guide_id: null, status: 'Open' }])} disabled={loading} style={{ padding: '8px 16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                        Thêm Đợt Mới
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* DANH SÁCH ĐỢT KHỞI HÀNH CỦA THÁNG M */}
                                                            {(() => {
                                                                const monthDepartures = departures
                                                                    .map((dep, realIdx) => ({ ...dep, realIdx }))
                                                                    .filter(dep => {
                                                                        if (!dep.departure_date) return true;
                                                                        const d = new Date(dep.departure_date);
                                                                        return d.getFullYear() === currentYear && (d.getMonth() + 1) === m;
                                                                    });

                                                                if (monthDepartures.length === 0) {
                                                                    return (
                                                                        <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '14px', border: '2px dashed #cbd5e1', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                                                                            🗓️ Tour này chưa có đợt khởi hành nào trong Tháng {m}/{currentYear}
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                                        {monthDepartures.map((dep) => {
                                                                            const idx = dep.realIdx;
                                                                            const parsedDesign = selectedTour?.design_data ? (typeof selectedTour.design_data === 'string' ? JSON.parse(selectedTour.design_data) : selectedTour.design_data) : null;
                                                                            const minPax = parsedDesign?.costConfig?.minimumPax || 15;
                                                                            
                                                                            const status = dep.status || 'Open';
                                                                            const statusBg = status === 'Open' ? '#dcfce7' : (status === 'Closed' ? '#f3f4f6' : '#111827');
                                                                            const statusColor = status === 'Open' ? '#166534' : (status === 'Closed' ? '#4b5563' : '#f9fafb');

                                                                            return (
                                                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '14px 18px', gap: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', flexWrap: 'wrap' }}>
                                                                                    
                                                                                    {/* NGÀY ĐI & NGÀY VỀ */}
                                                                                    <div style={{ flex: '0 0 170px' }}>
                                                                                        <input 
                                                                                            type="date" 
                                                                                            min={todayStr}
                                                                                            value={dep.departure_date} 
                                                                                            onChange={e => handleDepartureDateChange(idx, e.target.value)} 
                                                                                            disabled={activeTourTab === 'custom'}
                                                                                            style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f9fafb', width: '100%', fontFamily: 'inherit', color: activeTourTab === 'custom' ? '#9ca3af' : '#111827', fontSize: '14px', fontWeight: '600', outline: 'none', cursor: activeTourTab === 'custom' ? 'not-allowed' : 'pointer', marginBottom: '4px' }} 
                                                                                        />
                                                                                        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                                                                            Ngày về: <span style={{ color: dep.return_date ? '#374151' : '#9ca3af', fontWeight: '600' }}>{dep.return_date ? formatDateStr(dep.return_date) : '...'}</span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* KHÁCH HÀNG & SLOT */}
                                                                                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                            <div style={{ fontSize: '13px', color: '#374151', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                                Khách: <span style={{ color: '#0ea5e9', fontWeight: '700' }}>0</span> / 
                                                                                                <input 
                                                                                                    type="number" 
                                                                                                    min="1" 
                                                                                                    value={dep.max_slots || ''} 
                                                                                                    onChange={e => { const up = [...departures]; up[idx].max_slots = e.target.value ? Number(e.target.value) : ''; setDepartures(up); }} 
                                                                                                    onBlur={e => { if(!e.target.value) { const up = [...departures]; up[idx].max_slots = 1; setDepartures(up); } }}
                                                                                                    disabled={activeTourTab === 'custom'} 
                                                                                                    style={{ width: '56px', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'center', background: activeTourTab === 'custom' ? '#f1f5f9' : '#fff', outline: 'none' }} 
                                                                                                />
                                                                                                <span style={{ color: '#64748b', fontSize: '12px' }}>(Hòa vốn: {minPax})</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                                                                                            <div style={{ width: '0%', height: '100%', background: '#0ea5e9', borderRadius: '3px' }}></div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* PHÂN CÔNG HDV & TRẠNG THÁI */}
                                                                                    <div style={{ flex: '0 0 320px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                                        <select 
                                                                                            value={dep.guide_id || ''} 
                                                                                            onChange={e => { const up = [...departures]; up[idx].guide_id = e.target.value ? Number(e.target.value) : null; setDepartures(up); }} 
                                                                                            style={{ flex: '1', padding: '8px 10px', border: dep.guide_id ? '1px solid #bae6fd' : '1px solid #cbd5e1', background: dep.guide_id ? '#e0f2fe' : '#fff', borderRadius: '8px', color: dep.guide_id ? '#0369a1' : '#4b5563', fontSize: '13px', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                                                                                        >
                                                                                            <option value="" style={{ background: '#fff', color: '#111827' }}>Chưa phân công HDV</option>
                                                                                            {guides.map(g => (
                                                                                                <option key={g.user_id} value={g.user_id} style={{ background: '#fff', color: '#111827' }}>{g.full_name}</option>
                                                                                            ))}
                                                                                        </select>

                                                                                        <select 
                                                                                            value={status} 
                                                                                            onChange={e => { const up = [...departures]; up[idx].status = e.target.value; setDepartures(up); }} 
                                                                                            style={{ flex: '0 0 95px', padding: '8px 10px', border: 'none', background: statusBg, borderRadius: '8px', color: statusColor, fontSize: '13px', fontWeight: '700', outline: 'none', cursor: 'pointer', textAlign: 'center' }}
                                                                                        >
                                                                                            <option value="Open" style={{ background: '#fff', color: '#111827' }}>Mở Bán</option>
                                                                                            <option value="Closed" style={{ background: '#fff', color: '#111827' }}>Khóa</option>
                                                                                            <option value="Completed" style={{ background: '#fff', color: '#111827' }}>Hoàn Tất</option>
                                                                                        </select>

                                                                                        {activeTourTab !== 'custom' && (
                                                                                            <button 
                                                                                                onClick={() => setDepartures(departures.filter((_, i) => i !== idx))} 
                                                                                                style={{ width: '34px', height: '34px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                                title="Xóa Đợt Chạy"
                                                                                            >
                                                                                                ✕
                                                                                            </button>
                                                                                        )}
                                                                                    </div>

                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* ACTION BUTTONS LƯU LỊCH & MỞ BÁN */}
                                                            {departures.length > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                                                                    <button onClick={handleSaveDepartures} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#111827', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(17, 24, 39, 0.2)' }}>
                                                                        💾 Lưu Lịch Trình
                                                                    </button>
                                                                    {selectedTour.status === 'Approved' && (
                                                                        <button onClick={handleActivateTour} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(1, 148, 243, 0.3)' }}>
                                                                            🚀 Mở Bán Tour
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {/* BIỂU ĐỒ NGHẼN LỊCH HDV */}
                                                            <div style={{ marginTop: '30px' }}>
                                                                <GuideTimelineCalendar 
                                                                    guides={guides}
                                                                    guideSchedules={guideSchedules}
                                                                    selectedMonth={selectedMonth}
                                                                />
                                                            </div>

                                                        </div>
                                                    )}

                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default TourOperationalManager;
