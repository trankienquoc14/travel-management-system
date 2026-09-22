import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const GuideTimelineCalendar = ({ guides, guideSchedules, selectedMonth, currentYear }) => {
    let year, month;
    if (selectedMonth === 'all' || !selectedMonth) {
        year = currentYear || new Date().getFullYear();
        month = new Date().getMonth() + 1;
    } else {
        const parts = selectedMonth.split('-');
        year = Number(parts[0]) || currentYear || new Date().getFullYear();
        month = Number(parts[1]) || (new Date().getMonth() + 1);
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

const DriverTimelineCalendar = ({ drivers, driverSchedules, selectedMonth, currentYear }) => {
    let year, month;
    if (selectedMonth === 'all' || !selectedMonth) {
        year = currentYear || new Date().getFullYear();
        month = new Date().getMonth() + 1;
    } else {
        const parts = selectedMonth.split('-');
        year = Number(parts[0]) || currentYear || new Date().getFullYear();
        month = Number(parts[1]) || (new Date().getMonth() + 1);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthStart = new Date(year, month - 1, 1).getTime();
    const monthEnd = new Date(year, month, 0, 23, 59, 59).getTime();

    const getDriverTasks = (driverId) => {
        return (driverSchedules || []).filter(sch => {
            if (Number(sch.driver_id) !== Number(driverId)) return false;
            const dStart = new Date(sch.departure_date).getTime();
            const dEnd = new Date(sch.return_date).getTime();
            return (dStart <= monthEnd && dEnd >= monthStart);
        });
    };

    if (!drivers || drivers.length === 0) return null;

    return (
        <div style={{ marginTop: '24px', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#14532d', fontWeight: '800' }}>Biểu Đồ Lịch Phân Công Tài Xế (Tháng {month}/{year})</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#166534' }}>Theo dõi lịch chạy và đảm bảo tài xế rảnh trong vòng 5 ngày giữa các tour</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></div> Chuyến xe khởi hành</div>
                </div>
            </div>
            <div style={{ overflowX: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '200px', flexShrink: 0, fontWeight: '700', color: '#475569', fontSize: '14px' }}>Tài xế</div>
                    <div style={{ display: 'flex', flex: 1, minWidth: `${daysInMonth * 24}px` }}>
                        {daysArray.map(d => (
                            <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>{d}</div>
                        ))}
                    </div>
                </div>
                {drivers.map(driver => {
                    const tasks = getDriverTasks(driver.user_id);
                    return (
                        <div key={driver.user_id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: '200px', flexShrink: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '8px' }} title={driver.full_name}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>
                                    🚌
                                </div>
                                {driver.full_name}
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
                                        <div key={task.departure_id} title={`${task.tour_name} (Xe: ${task.vehicle_number || 'Chưa gán'}) (${task.departure_date} -> ${task.return_date})`} style={{
                                            position: 'absolute',
                                            left: `${leftPercent}%`,
                                            width: `${widthPercent}%`,
                                            height: '100%',
                                            background: '#10b981',
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
                                            {task.vehicle_number ? `${task.vehicle_number} - ` : ''}{task.tour_name.substring(0, 12)}
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

const MasterOperationalTimeline = ({ guideSchedules, selectedMonth, setSelectedMonth, currentYear, onYearChange, tours = [], activeTourTab = 'fixed', uniqueDestinations = [], selectedDestination = 'all', setSelectedDestination }) => {
    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);

    // Dynamic available years list
    const yearSet = new Set([new Date().getFullYear(), currentYear]);
    if (guideSchedules) {
        guideSchedules.forEach(sch => {
            if (sch.departure_date) {
                const y = new Date(sch.departure_date).getFullYear();
                if (y >= 2020 && y <= 2035) yearSet.add(y);
            }
        });
    }
    const thisYear = new Date().getFullYear();
    yearSet.add(thisYear - 1);
    yearSet.add(thisYear);
    yearSet.add(thisYear + 1);
    yearSet.add(thisYear + 2);
    const availableYears = Array.from(yearSet).sort((a, b) => a - b);

    const activeTourIds = new Set(
        tours
            .filter(t => activeTourTab === 'custom' ? t.is_custom === 1 : (!t.is_custom || t.is_custom === 0))
            .map(t => t.tour_id)
    );

    // Tính số tour/lịch trình thực tế cho từng tháng từ CSDL (chỉ đếm tour Active/Approved trong tab hiện tại)
    const getMonthCount = (m) => {
        if (!guideSchedules) return 0;
        return guideSchedules.filter(sch => {
            if (!sch.departure_date) return false;
            if (sch.tour_id && !activeTourIds.has(sch.tour_id)) return false;
            const d = new Date(sch.departure_date);
            return d.getFullYear() === currentYear && (d.getMonth() + 1) === m;
        }).length;
    };

    const totalToursInYear = guideSchedules ? guideSchedules.filter(sch => {
        if (!sch.departure_date) return false;
        if (sch.tour_id && !activeTourIds.has(sch.tour_id)) return false;
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📅 QUẢN LÝ LỊCH VẬN HÀNH 12 THÁNG
                        </h3>
                        <select
                            value={currentYear}
                            onChange={(e) => onYearChange && onYearChange(Number(e.target.value))}
                            style={{
                                padding: '6px 14px',
                                fontSize: '15px',
                                fontWeight: '800',
                                color: '#1e3a8a',
                                background: '#eff6ff',
                                border: '2px solid #3b82f6',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                outline: 'none',
                                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.15)'
                            }}
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>Năm {y}</option>
                            ))}
                        </select>
                        <select
                            value={selectedDestination}
                            onChange={(e) => setSelectedDestination && setSelectedDestination(e.target.value)}
                            style={{
                                padding: '6px 14px',
                                fontSize: '15px',
                                fontWeight: '800',
                                color: '#1e3a8a',
                                background: '#f8fafc',
                                border: '2px solid #cbd5e1',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="all">Tất cả tỉnh thành</option>
                            {uniqueDestinations.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Chọn Tháng để xem danh sách tour di chuyển được gắn trực tiếp vào khu vực từng tháng.
                    </p>
                </div>

                <div style={{ background: '#f0f9ff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#0284c7', border: '1px solid #bae6fd' }}>
                    🚀 Tổng số đợt khởi hành năm {currentYear}: {totalToursInYear} tour
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
    const [selectedDestination, setSelectedDestination] = useState('all');
    const [selectedTour, setSelectedTour] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Core states needed for Departures
    const [departures, setDepartures] = useState([]);
    const [guides, setGuides] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [driverSchedules, setDriverSchedules] = useState([]);

    // Hidden states needed to preserve Tour Designer data when saving
    const [itineraryDays, setItineraryDays] = useState([]);
    const [markupPercent, setMarkupPercent] = useState(20);
    const [baseCost, setBaseCost] = useState(0);
    const [basePrice, setBasePrice] = useState(0);
    const [activeTourTab, setActiveTourTab] = useState('fixed'); // 'fixed' | 'custom'
    const _currentDate = new Date();
    const _currentMonthStr = `${_currentDate.getFullYear()}-${String(_currentDate.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(_currentMonthStr); // default to current month instead of 'all'

    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const todayStr = new Date().toISOString().split('T')[0];

    const handleYearChange = (newYear) => {
        setCurrentYear(newYear);
        if (selectedMonth && selectedMonth !== 'all') {
            const monthNum = selectedMonth.split('-')[1] || '01';
            setSelectedMonth(`${newYear}-${monthNum}`);
        }
    };

    useEffect(() => {
        fetchInitialData();
        fetchGuideSchedules();
        fetchDriverSchedules();
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

            // 2. Fetch Guides & Drivers
            const resEmployees = await axios.get('http://localhost:5000/api/hr/employees', { headers });
            if (resEmployees.data.success) {
                const guideList = (resEmployees.data.data || []).filter(e => 
                    (e.role_id === 5 || e.role_name === 'Tour Guide' || e.role_name?.toLowerCase().includes('guide')) && 
                    e.status === 'Active'
                );
                setGuides(guideList);

                const driverList = (resEmployees.data.data || []).filter(e => 
                    (e.role_id === 8 || e.role_name === 'Driver' || e.role_name === 'Tài xế' || e.role_name?.toLowerCase().includes('driver')) && 
                    e.status === 'Active'
                );
                setDrivers(driverList);
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

                const loadedDepartures = (d.departures || []).map(dep => ({
                    ...dep,
                    guide_id: (dep.guide_id && guides.some(g => g.user_id === Number(dep.guide_id))) ? Number(dep.guide_id) : null,
                    driver_id: (dep.driver_id && drivers.some(drv => drv.user_id === Number(dep.driver_id))) ? Number(dep.driver_id) : null,
                    vehicle_number: dep.vehicle_number || '',
                    original_max_slots: dep.max_slots,
                    original_available_slots: dep.available_slots
                }));

                setDepartures(loadedDepartures);
                
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

    const fetchDriverSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/driver/work?driver_id=all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDriverSchedules(res.data.data || []);
            }
        } catch (error) {
            console.error('Lỗi lấy lịch chạy Tài xế', error);
        }
    };

    const formatMoney = (val) => Number(val || 0).toLocaleString('vi-VN') + ' ₫';

    const handleSaveDepartures = async () => {
        if (!selectedTour) return;

        // Lấy tất cả lịch trình của CÁC tour khác để kiểm tra trùng lịch / khoảng nghỉ
        const otherSchedules = guideSchedules ? guideSchedules.filter(sch => sch.tour_id !== selectedTour.tour_id) : [];

        // THIẾT LẬP: Số tour tối đa 1 HDV có thể nhận trong 1 tháng
        const MAX_TOURS_PER_MONTH = 4;

        for (let i = 0; i < departures.length; i++) {
            const dep = departures[i];
            if (!dep.departure_date) {
                alert(`⚠️ Đợt #${i + 1}: Vui lòng chọn Ngày khởi hành!`);
                return;
            }
            if (!dep.departure_id && dep.departure_date < todayStr) {
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
            if (dep.departure_id && dep.original_max_slots !== undefined && dep.original_available_slots !== undefined) {
                const bSlots = dep.original_max_slots - dep.original_available_slots;
                if (dep.max_slots < bSlots) {
                    alert(`⚠️ Đợt #${i + 1}: Không thể đặt tổng số chỗ nhỏ hơn số lượng khách đã đặt (${bSlots} khách)!`);
                    return;
                }
            }

            // KIỂM TRA RÀNG BUỘC HƯỚNG DẪN VIÊN
            if (dep.guide_id) {
                const assignedGuideId = Number(dep.guide_id);
                const guideName = guides.find(g => g.user_id === assignedGuideId)?.full_name || 'HDV';
                
                const depStart = new Date(dep.departure_date).getTime();
                const depEnd = new Date(dep.return_date).getTime();
                const depMonth = new Date(dep.departure_date).getMonth();
                const depYear = new Date(dep.departure_date).getFullYear();
                
                const guideOtherSchs = otherSchedules.filter(s => s.guide_id === assignedGuideId && s.departure_date && s.return_date);
                const guideSameTourSchs = departures.filter((d, idx) => idx !== i && Number(d.guide_id) === assignedGuideId && d.departure_date && d.return_date);
                
                const allToCheck = [
                    ...guideOtherSchs.map(s => ({
                        tour_name: s.tour_name || 'Tour khác',
                        start: new Date(s.departure_date).getTime(),
                        end: new Date(s.return_date).getTime()
                    })),
                    ...guideSameTourSchs.map(d => ({
                        tour_name: 'một đợt khởi hành khác của tour này',
                        start: new Date(d.departure_date).getTime(),
                        end: new Date(d.return_date).getTime()
                    }))
                ];
                
                const ONE_DAY = 24 * 60 * 60 * 1000;

                for (const sch of allToCheck) {
                    if (depStart <= sch.end && depEnd >= sch.start) {
                        alert(`⚠️ Đợt #${i + 1}: Hướng dẫn viên ${guideName} đã bị trùng lịch với "${sch.tour_name}".\nVui lòng chọn HDV khác hoặc đổi ngày!`);
                        return;
                    }
                    
                    if (depEnd < sch.start) {
                        const gapDays = (sch.start - depEnd) / ONE_DAY;
                        if (gapDays < 2) {
                            alert(`⚠️ Đợt #${i + 1}: Hướng dẫn viên ${guideName} không đủ thời gian nghỉ ngơi trước khi chạy "${sch.tour_name}". (Cần nghỉ ít nhất 2 ngày)\nVui lòng xếp lại!`);
                            return;
                        }
                    } else if (depStart > sch.end) {
                        const gapDays = (depStart - sch.end) / ONE_DAY;
                        if (gapDays < 2) {
                            alert(`⚠️ Đợt #${i + 1}: Hướng dẫn viên ${guideName} không đủ thời gian nghỉ ngơi sau khi chạy "${sch.tour_name}". (Cần nghỉ ít nhất 2 ngày)\nVui lòng xếp lại!`);
                            return;
                        }
                    }
                }

                let toursInThisMonth = 1;
                for (const sch of allToCheck) {
                    const schMonth = new Date(sch.start).getMonth();
                    const schYear = new Date(sch.start).getFullYear();
                    if (schMonth === depMonth && schYear === depYear) {
                        toursInThisMonth++;
                    }
                }

                if (toursInThisMonth > MAX_TOURS_PER_MONTH) {
                    alert(`⚠️ Đợt #${i + 1}: Hướng dẫn viên ${guideName} đã vượt quá giới hạn nhận tour trong Tháng ${depMonth + 1}/${depYear} (Tối đa ${MAX_TOURS_PER_MONTH} tour/tháng).\nVui lòng phân công cho HDV khác!`);
                    return;
                }
            }

            // KIỂM TRA RÀNG BUỘC TÀI XẾ (Rảnh trong vòng 5 ngày)
            if (dep.driver_id) {
                const assignedDriverId = Number(dep.driver_id);
                const driverName = drivers.find(d => d.user_id === assignedDriverId)?.full_name || 'Tài xế';
                
                const depStart = new Date(dep.departure_date).getTime();
                const depEnd = new Date(dep.return_date).getTime();
                const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
                
                const otherDriverSchedules = driverSchedules ? driverSchedules.filter(sch => sch.tour_id !== selectedTour.tour_id || sch.departure_id !== dep.departure_id) : [];
                const drvOtherSchs = otherDriverSchedules.filter(s => Number(s.driver_id) === assignedDriverId && s.departure_date && s.return_date);
                const drvSameTourSchs = departures.filter((d, idx) => idx !== i && Number(d.driver_id) === assignedDriverId && d.departure_date && d.return_date);
                
                const allToCheck = [
                    ...drvOtherSchs.map(s => ({
                        tour_name: s.tour_name || 'Chuyến xe khác',
                        start: new Date(s.departure_date).getTime(),
                        end: new Date(s.return_date).getTime()
                    })),
                    ...drvSameTourSchs.map(d => ({
                        tour_name: 'một đợt khởi hành khác của tour này',
                        start: new Date(d.departure_date).getTime(),
                        end: new Date(d.return_date).getTime()
                    }))
                ];
                
                for (const sch of allToCheck) {
                    if (depStart <= sch.end && depEnd >= sch.start) {
                        alert(`⚠️ Đợt #${i + 1}: Tài xế ${driverName} đã bị trùng lịch với "${sch.tour_name}".\nVui lòng chọn Tài xế rảnh!`);
                        return;
                    }
                    
                    if (depEnd < sch.start && (sch.start - depEnd) < FIVE_DAYS_MS) {
                        const gapDays = Math.ceil((sch.start - depEnd) / (24 * 60 * 60 * 1000));
                        alert(`⚠️ Đợt #${i + 1}: Tài xế ${driverName} chỉ rảnh ${gapDays} ngày trước "${sch.tour_name}" (Yêu cầu rảnh ít nhất 5 ngày).\nVui lòng chọn Tài xế rảnh trong vòng 5 ngày!`);
                        return;
                    }
                    if (depStart > sch.end && (depStart - sch.end) < FIVE_DAYS_MS) {
                        const gapDays = Math.ceil((depStart - sch.end) / (24 * 60 * 60 * 1000));
                        alert(`⚠️ Đợt #${i + 1}: Tài xế ${driverName} chỉ rảnh ${gapDays} ngày sau "${sch.tour_name}" (Yêu cầu rảnh ít nhất 5 ngày).\nVui lòng chọn Tài xế rảnh trong vòng 5 ngày!`);
                        return;
                    }
                }
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
                alert(`🎉 Đã lưu cấu hình lịch trình & phân công nhân sự thành công cho Tour: ${selectedTour.tour_name}`);
                await fetchGuideSchedules();
                await fetchDriverSchedules();
                await handleSelectTour(selectedTour);

                // Tự động chuyển selectedMonth sang tháng của đợt vừa lưu nếu đang lọc theo tháng cụ thể
                if (selectedMonth !== 'all' && departures.length > 0) {
                    const lastDep = departures[departures.length - 1];
                    if (lastDep && lastDep.departure_date) {
                        const d = new Date(lastDep.departure_date);
                        const savedMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                        if (savedMonthStr !== selectedMonth) {
                            setSelectedMonth(savedMonthStr);
                        }
                    }
                }
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
    const uniqueDestinations = Array.from(new Set(tours.map(t => t.destination).filter(Boolean))).sort();
    const filteredTours = tours.filter(t => selectedDestination === 'all' || t.destination === selectedDestination);

    const getToursForMonth = (m) => {
        return filteredTours
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
                    onYearChange={handleYearChange}
                    tours={filteredTours}
                    activeTourTab={activeTourTab}
                    uniqueDestinations={uniqueDestinations}
                    selectedDestination={selectedDestination}
                    setSelectedDestination={setSelectedDestination}
                />

                {/* 3. KHU VỰC DANH SÁCH TOUR ĐƯỢC GẮN TRỰC TIẾP THEO TỪNG THÁNG */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {monthsToRender.map(m => {
                        const toursInMonth = getToursForMonth(m);
                        const tourIdsInMonth = new Set(toursInMonth.map(t => t.tour_id));
                        const monthSchedulesCount = guideSchedules ? guideSchedules.filter(sch => {
                            if (!sch.departure_date) return false;
                            if (sch.tour_id && !tourIdsInMonth.has(sch.tour_id)) return false;
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
                                                                    📋 Thiết Lập Ngày Khởi Hành, Biển Số Xe & Phân Công Nhân Sự (HDV / Tài Xế):
                                                                </div>
                                                                {activeTourTab !== 'custom' && (
                                                                    <button onClick={() => setDepartures([...departures, { departure_date: '', return_date: '', max_slots: 30, guide_id: null, driver_id: null, vehicle_number: '', status: 'Open' }])} disabled={loading} style={{ padding: '8px 16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                                                                        if (!dep.departure_date) {
                                                                            const targetMonthNum = (selectedMonth && selectedMonth !== 'all') ? Number(selectedMonth.split('-')[1]) : (new Date().getMonth() + 1);
                                                                            return m === targetMonthNum;
                                                                        }
                                                                        const d = new Date(dep.departure_date);
                                                                        const depMonth = d.getMonth() + 1;
                                                                        const depYear = d.getFullYear();

                                                                        if (depYear === currentYear && depMonth === m) return true;

                                                                        // Nếu đợt mới chưa lưu (!dep.departure_id) và tháng đã chọn không nằm trong danh sách tháng đang hiển thị,
                                                                        // giữ lại đợt đó trong thẻ tháng hiện tại (m) để không bị ẩn biến mất khi đang chỉnh sửa
                                                                        if (!dep.departure_id && !monthsToRender.includes(depMonth)) {
                                                                            return true;
                                                                        }

                                                                        return false;
                                                                    });

                                                                if (monthDepartures.length === 0) {
                                                                    return (
                                                                        <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '14px', border: '2px dashed #cbd5e1', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                                                                            {selectedMonth === 'all' ? `🗓️ Tour này chưa có đợt khởi hành nào trong năm ${currentYear}` : `🗓️ Tour này chưa có đợt khởi hành nào trong Tháng ${m}/${currentYear}`}
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                                        {monthDepartures.map((dep) => {
                                                                            const idx = dep.realIdx;


                                                                            const bookedSlots = (dep.departure_id && dep.original_max_slots !== undefined && dep.original_available_slots !== undefined) ? Math.max(0, dep.original_max_slots - dep.original_available_slots) : 0;
                                                                            const hasBookings = bookedSlots > 0;
                                                                            const isPastTour = dep.departure_id && dep.departure_date && dep.departure_date < todayStr;
                                                                            const disableDate = activeTourTab === 'custom' || isPastTour || hasBookings;
                                                                            const disableSlot = activeTourTab === 'custom' || isPastTour;
                                                                            
                                                                            // LỌC HƯỚNG DẪN VIÊN RẢNH
                                                                            const availableGuides = guides.filter(g => {
                                                                                if (!dep.departure_date || !dep.return_date) return true;
                                                                                
                                                                                const depStart = new Date(dep.departure_date).getTime();
                                                                                const depEnd = new Date(dep.return_date).getTime();
                                                                                const depMonth = new Date(dep.departure_date).getMonth();
                                                                                const depYear = new Date(dep.departure_date).getFullYear();
                                                                                
                                                                                const otherSchedules = guideSchedules ? guideSchedules.filter(sch => sch.tour_id !== selectedTour.tour_id) : [];
                                                                                const guideOtherSchs = otherSchedules.filter(s => s.guide_id === g.user_id && s.departure_date && s.return_date);
                                                                                const guideSameTourSchs = departures.filter((d, i) => i !== idx && Number(d.guide_id) === g.user_id && d.departure_date && d.return_date);
                                                                                
                                                                                const allToCheck = [
                                                                                    ...guideOtherSchs.map(s => ({ start: new Date(s.departure_date).getTime(), end: new Date(s.return_date).getTime() })),
                                                                                    ...guideSameTourSchs.map(d => ({ start: new Date(d.departure_date).getTime(), end: new Date(d.return_date).getTime() }))
                                                                                ];
                                                                                
                                                                                const ONE_DAY = 24 * 60 * 60 * 1000;
                                                                                let toursInThisMonth = 1;
                                                                                
                                                                                for (const sch of allToCheck) {
                                                                                    if (depStart <= sch.end && depEnd >= sch.start) return false;
                                                                                    if (depEnd < sch.start && (sch.start - depEnd) / ONE_DAY < 2) return false;
                                                                                    if (depStart > sch.end && (depStart - sch.end) / ONE_DAY < 2) return false;
                                                                                    if (new Date(sch.start).getMonth() === depMonth && new Date(sch.start).getFullYear() === depYear) {
                                                                                        toursInThisMonth++;
                                                                                    }
                                                                                }
                                                                                
                                                                                if (toursInThisMonth > 4) return false;
                                                                                return true;
                                                                            });
                                                                            
                                                                            const currentGuide = guides.find(g => g.user_id === Number(dep.guide_id));
                                                                            if (currentGuide && !availableGuides.some(g => g.user_id === currentGuide.user_id)) {
                                                                                availableGuides.push({ ...currentGuide, full_name: currentGuide.full_name + ' (Không đủ điều kiện)' });
                                                                            }

                                                                            // LỌC TÀI XẾ RẢNH (YÊU CẦU: NGHỈ ÍT NHẤT 5 NGÀY TRƯỚC VÀ SAU TOUR)
                                                                            const availableDrivers = (drivers || []).filter(drv => {
                                                                                if (!dep.departure_date || !dep.return_date) return true;

                                                                                const depStart = new Date(dep.departure_date).getTime();
                                                                                const depEnd = new Date(dep.return_date).getTime();

                                                                                const otherSchs = driverSchedules ? driverSchedules.filter(sch => sch.tour_id !== selectedTour.tour_id) : [];
                                                                                const drvOtherSchs = otherSchs.filter(s => s.driver_id === drv.user_id && s.departure_date && s.return_date);
                                                                                const drvSameTourSchs = departures.filter((d, i) => i !== idx && Number(d.driver_id) === drv.user_id && d.departure_date && d.return_date);

                                                                                const allToCheck = [
                                                                                    ...drvOtherSchs.map(s => ({ start: new Date(s.departure_date).getTime(), end: new Date(s.return_date).getTime() })),
                                                                                    ...drvSameTourSchs.map(d => ({ start: new Date(d.departure_date).getTime(), end: new Date(d.return_date).getTime() }))
                                                                                ];

                                                                                const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;

                                                                                for (const sch of allToCheck) {
                                                                                    if (depStart <= sch.end && depEnd >= sch.start) return false;
                                                                                    if (depEnd < sch.start && (sch.start - depEnd) < FIVE_DAYS) return false;
                                                                                    if (depStart > sch.end && (depStart - sch.end) < FIVE_DAYS) return false;
                                                                                }

                                                                                return true;
                                                                            });

                                                                            const currentDriver = (drivers || []).find(drv => drv.user_id === Number(dep.driver_id));
                                                                            if (currentDriver && !availableDrivers.some(drv => drv.user_id === currentDriver.user_id)) {
                                                                                availableDrivers.push({ ...currentDriver, full_name: currentDriver.full_name + ' (Bận / Dưới 5 ngày rảnh)' });
                                                                            }

                                                                            const parsedDesign = selectedTour?.design_data ? (typeof selectedTour.design_data === 'string' ? JSON.parse(selectedTour.design_data) : selectedTour.design_data) : null;
                                                                            const minPax = parsedDesign?.costConfig?.minimumPax || 15;
                                                                            
                                                                            const status = dep.status || 'Open';
                                                                            const statusBg = status === 'Open' ? '#dcfce7' : (status === 'Closed' ? '#f3f4f6' : '#111827');
                                                                            const statusColor = status === 'Open' ? '#166534' : (status === 'Closed' ? '#4b5563' : '#f9fafb');

                                                                            return (
                                                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '14px 18px', gap: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', flexWrap: 'wrap' }}>
                                                                                    
                                                                                    {/* NGÀY ĐI & NGÀY VỀ */}
                                                                                    <div style={{ flex: '0 0 160px' }}>
                                                                                        <input 
                                                                                            type="date" 
                                                                                            min={todayStr}
                                                                                            value={dep.departure_date} 
                                                                                            onChange={e => handleDepartureDateChange(idx, e.target.value)} 
                                                                                            disabled={disableDate}
                                                                                            title={isPastTour ? "Tour trong quá khứ không thể đổi ngày" : (hasBookings ? "Tour đã có khách đặt không thể đổi ngày" : "")}
                                                                                            style={{ padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: disableDate ? '#f1f5f9' : '#f9fafb', width: '100%', fontFamily: 'inherit', color: disableDate ? '#9ca3af' : '#111827', fontSize: '14px', fontWeight: '600', outline: 'none', cursor: disableDate ? 'not-allowed' : 'pointer', marginBottom: '4px' }} 
                                                                                        />
                                                                                        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                                                                            Ngày về: <span style={{ color: dep.return_date ? '#374151' : '#9ca3af', fontWeight: '600' }}>{dep.return_date ? formatDateStr(dep.return_date) : '...'}</span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* KHÁCH HÀNG & SLOT */}
                                                                                    <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                            <div style={{ fontSize: '13px', color: '#374151', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                                Khách: <span style={{ color: '#0ea5e9', fontWeight: '700' }}>{bookedSlots}</span> / 
                                                                                                <input 
                                                                                                    type="number" 
                                                                                                    min={hasBookings ? Math.max(1, bookedSlots) : 1} 
                                                                                                    value={dep.max_slots || ''} 
                                                                                                    onChange={e => { 
                                                                                                        let val = e.target.value ? Number(e.target.value) : '';
                                                                                                        const up = [...departures]; 
                                                                                                        up[idx].max_slots = val; 
                                                                                                        setDepartures(up); 
                                                                                                    }} 
                                                                                                    onBlur={e => { 
                                                                                                        let val = e.target.value ? Number(e.target.value) : 1;
                                                                                                        if (hasBookings && val < bookedSlots) {
                                                                                                            alert('⚠️ Không thể giảm số chỗ xuống thấp hơn số lượng khách đã đặt (' + bookedSlots + ' khách)!');
                                                                                                            val = Math.max(val, bookedSlots);
                                                                                                        }
                                                                                                        const up = [...departures]; 
                                                                                                        up[idx].max_slots = val; 
                                                                                                        setDepartures(up); 
                                                                                                    }}
                                                                                                    disabled={disableSlot} 
                                                                                                    title={isPastTour ? "Tour trong quá khứ không thể đổi số chỗ" : ""}
                                                                                                    style={{ width: '56px', padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'center', background: disableSlot ? '#f1f5f9' : '#fff', outline: 'none' }} 
                                                                                                />
                                                                                                <span style={{ color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>(Hòa vốn: {minPax})</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                                                                                            <div style={{ width: `${Math.min(100, (bookedSlots / (dep.max_slots || 1)) * 100)}%`, height: '100%', background: '#0ea5e9', borderRadius: '3px' }}></div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* PHÂN CÔNG TÀI XẾ & BIỂN SỐ XE & HDV & TRẠNG THÁI */}
                                                                                    <div style={{ flex: '1', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                                                        {/* Select Tài xế */}
                                                                                        <select 
                                                                                            value={dep.driver_id || ''} 
                                                                                            onChange={e => { const up = [...departures]; up[idx].driver_id = e.target.value ? Number(e.target.value) : null; setDepartures(up); }} 
                                                                                            disabled={isPastTour}
                                                                                            title={isPastTour ? "Tour trong quá khứ không thể đổi tài xế" : "Chọn tài xế đang rảnh trong vòng 5 ngày"}
                                                                                            style={{ flex: '1 1 150px', minWidth: '130px', padding: '8px 10px', border: dep.driver_id ? '1px solid #fed7aa' : '1px solid #cbd5e1', background: isPastTour ? '#f1f5f9' : (dep.driver_id ? '#fff7ed' : '#fff'), borderRadius: '8px', color: isPastTour ? '#9ca3af' : (dep.driver_id ? '#c2410c' : '#4b5563'), fontSize: '13px', fontWeight: '600', outline: 'none', cursor: isPastTour ? 'not-allowed' : 'pointer' }}
                                                                                        >
                                                                                            <option value="" style={{ background: '#fff', color: '#111827' }}>🚗 Chưa chọn Tài xế</option>
                                                                                            {availableDrivers.map(drv => (
                                                                                                <option key={drv.user_id} value={drv.user_id} style={{ background: '#fff', color: '#111827' }}>🚗 {drv.full_name}</option>
                                                                                            ))}
                                                                                        </select>

                                                                                        {/* Biển số xe */}
                                                                                        <input 
                                                                                            type="text"
                                                                                            placeholder="Biển số (vd: 51B-123.45)"
                                                                                            value={dep.vehicle_number || ''}
                                                                                            onChange={e => { const up = [...departures]; up[idx].vehicle_number = e.target.value; setDepartures(up); }}
                                                                                            disabled={isPastTour}
                                                                                            title={isPastTour ? "Tour trong quá khứ không thể đổi biển số xe" : "Nhập biển số xe di chuyển"}
                                                                                            style={{ width: '130px', padding: '8px 10px', border: dep.vehicle_number ? '1px solid #fde68a' : '1px solid #cbd5e1', background: isPastTour ? '#f1f5f9' : (dep.vehicle_number ? '#fefce8' : '#fff'), borderRadius: '8px', color: isPastTour ? '#9ca3af' : '#1e293b', fontSize: '13px', fontWeight: '600', outline: 'none' }}
                                                                                        />

                                                                                        {/* Select HDV */}
                                                                                        <select 
                                                                                            value={dep.guide_id || ''} 
                                                                                            onChange={e => { const up = [...departures]; up[idx].guide_id = e.target.value ? Number(e.target.value) : null; setDepartures(up); }} 
                                                                                            disabled={isPastTour}
                                                                                            title={isPastTour ? "Tour trong quá khứ không thể đổi hướng dẫn viên" : ""}
                                                                                            style={{ flex: '1 1 150px', minWidth: '130px', padding: '8px 10px', border: dep.guide_id ? '1px solid #bae6fd' : '1px solid #cbd5e1', background: isPastTour ? '#f1f5f9' : (dep.guide_id ? '#e0f2fe' : '#fff'), borderRadius: '8px', color: isPastTour ? '#9ca3af' : (dep.guide_id ? '#0369a1' : '#4b5563'), fontSize: '13px', fontWeight: '600', outline: 'none', cursor: isPastTour ? 'not-allowed' : 'pointer' }}
                                                                                        >
                                                                                            <option value="" style={{ background: '#fff', color: '#111827' }}>🚩 Chưa chọn HDV</option>
                                                                                            {availableGuides.map(g => (
                                                                                                <option key={g.user_id} value={g.user_id} style={{ background: '#fff', color: '#111827' }}>🚩 {g.full_name}</option>
                                                                                            ))}
                                                                                        </select>

                                                                                        {/* Status */}
                                                                                        <select 
                                                                                            value={status} 
                                                                                            onChange={e => { const up = [...departures]; up[idx].status = e.target.value; setDepartures(up); }} 
                                                                                            disabled={isPastTour}
                                                                                            title={isPastTour ? "Tour trong quá khứ không thể đổi trạng thái" : ""}
                                                                                            style={{ width: '95px', padding: '8px 10px', border: 'none', background: isPastTour ? '#f1f5f9' : statusBg, borderRadius: '8px', color: isPastTour ? '#9ca3af' : statusColor, fontSize: '13px', fontWeight: '700', outline: 'none', cursor: isPastTour ? 'not-allowed' : 'pointer', textAlign: 'center' }}
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
                                                                    currentYear={currentYear}
                                                                />
                                                            </div>

                                                            {/* BIỂU ĐỒ NGHẼN LỊCH TÀI XẾ */}
                                                            <div style={{ marginTop: '20px' }}>
                                                                <DriverTimelineCalendar 
                                                                    drivers={drivers}
                                                                    driverSchedules={driverSchedules}
                                                                    selectedMonth={selectedMonth}
                                                                    currentYear={currentYear}
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
