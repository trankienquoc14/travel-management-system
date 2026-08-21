import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomerFooter from './CustomerFooter';
import '../index.css';


const DayItem = ({ day, isOldFormat, index, getDestString, tour, parsedDesign, destinations, bgImage }) => {
    const [isExpanded, setIsExpanded] = React.useState(index === 0);
    
    // Bữa ăn
    let meals = [];
    if (isOldFormat) {
        meals = ['Ăn sáng', 'trưa', 'chiều'];
    } else {
        if (day.meals?.breakfast) meals.push('Ăn sáng');
        if (day.meals?.lunch) meals.push('trưa');
        if (day.meals?.dinner) meals.push('chiều');
        if (meals.length === 0) meals = ['Ăn tự túc'];
    }
    const mealStr = `🍴 ${meals.join(', ')}`;
    
    // Tiêu đề tuyến
    let title = '';
    if (isOldFormat) {
        title = day.title || '';
    } else {
        title = day.route_title || '';
        if (!title) {
            const getD = (id) => destinations.find(x => String(x.destination_id) === String(id))?.destination_name;
            title = [getD(day.start_destination_id), getD(day.end_destination_id)].filter(Boolean).join(' - ');
        }
    }
    
    // Hoạt động
    let activities = [];
    if (isOldFormat) {
        ['morning', 'noon', 'evening'].forEach(slot => {
            if(day.slots && day.slots[slot]) {
                day.slots[slot].forEach(item => {
                   activities.push(item);
                });
            }
        });
    } else {
        activities = day.activities || [];
    }

    
    let img = parsedDesign?.dayImages?.[day.dayIndex];
    if (img && !img.startsWith('http')) {
        let path = img;
        if (path.startsWith('/uploads/')) path = path.replace('/uploads/', '');
        if (!path.startsWith('uploads/')) path = 'uploads/' + path;
        img = 'http://localhost:5000/' + path;
    }
    img = img || bgImage;


    return (
        <div style={{ position: 'relative', marginBottom: isExpanded ? '40px' : '20px' }}>
            {/* The dot marker */}
            <div style={{ position: 'absolute', left: '-36px', top: isExpanded ? '60px' : '36px', width: '18px', height: '18px', borderRadius: '50%', background: '#0f172a', border: '4px solid #fff', zIndex: 2, transform: 'translateY(-50%)', transition: 'all 0.3s', boxShadow: '0 0 0 1px #cbd5e1' }}></div>
            
            {isExpanded ? (
                <div style={{ transition: 'all 0.3s' }}>
                    {/* Header Card (Blue) */}
                    <div onClick={() => setIsExpanded(false)} style={{ display: 'flex', background: '#eff6ff', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', minHeight: '160px' }}>
                        <div style={{ flex: 1, padding: '32px' }}>
                            <h3 style={{ color: '#3b82f6', fontSize: '24px', marginBottom: '12px', fontWeight: 'bold' }}>Ngày {day.dayIndex}</h3>
                            <strong style={{ fontSize: '18px', color: '#0f172a', display: 'block', marginBottom: '12px', lineHeight: '1.5' }}>{title || `Khám phá ngày ${day.dayIndex}`}</strong>
                            <span style={{ color: '#64748b', fontSize: '15px' }}>{mealStr}</span>
                        </div>
                        <div style={{ width: '45%', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    </div>
                    
                    {/* Content Card (White) */}
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', marginTop: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <strong style={{ fontSize: '17px', color: '#0f172a', marginBottom: '20px', display: 'block' }}>Hoạt động chính trong ngày:</strong>
                        <ul style={{ paddingLeft: '24px', color: '#1e293b', fontSize: '15.5px', lineHeight: '2' }}>
                            {activities.map((act, idx) => (
                                <li key={idx} style={{ marginBottom: '12px' }}>
                                    <strong style={{color: '#0f172a'}}>{act.name}</strong> {act.type ? `- ${act.type}` : ''}
                                </li>
                            ))}
                            {activities.length === 0 && <li>Tự do tham quan và nghỉ ngơi theo lịch trình.</li>}
                        </ul>
                    </div>
                </div>
            ) : (
                <div onClick={() => setIsExpanded(true)} style={{ background: '#fff', borderRadius: '20px', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                     onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'}
                     onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)'}>
                    <div>
                        <strong style={{ fontSize: '17px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>Ngày {day.dayIndex}: {title || `Khám phá ngày ${day.dayIndex}`}</strong>
                        <span style={{ color: '#64748b', fontSize: '15px' }}>{mealStr}</span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#94a3b8' }}>›</span>
                </div>
            )}
        </div>
    );
};

const TourDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tour, setTour] = useState(null);
    const [destinations, setDestinations] = useState([]);
    const [selectedDeparture, setSelectedDeparture] = useState('');
    const [numPeople, setNumPeople] = useState(1);
    const [selectedMonthTab, setSelectedMonthTab] = useState('');

    const fetchTourDetail = async () => {
        try {
            const [tourRes, destRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/tours/${id}`),
                axios.get(`http://localhost:5000/api/destinations`)
            ]);
            
            if (destRes.data.success) {
                setDestinations(destRes.data.data);
            }

            if (tourRes.data.success) {
                let data = tourRes.data.data;
                while (Array.isArray(data)) data = data[0];
                setTour(data);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tải thông tin tour!');
        }
    };

    useEffect(() => {
        fetchTourDetail();
    }, [id]);

    const getDestString = (tourObj, design) => {
        try {
            if (!design || !design.days) return tourObj.destination;
            const startOriginId = design.days[0]?.start_destination_id;
            const rawIds = [...new Set(design.days.map(d => d.end_destination_id).filter(Boolean))];
            const ids = rawIds.filter(id => String(id) !== String(startOriginId));
            const names = ids.map(idx => {
                const dest = destinations.find(x => String(x.destination_id) === String(idx));
                return dest ? dest.destination_name : '';
            }).filter(Boolean);
            return names.length > 0 ? names.join(' - ') : tourObj.destination;
        } catch(e) {
            return tourObj.destination;
        }
    };

    // Hàm chuyển hướng sang trang điền form Checkout
    const handleGoToBooking = () => {
        if (!selectedDeparture) {
            return alert('Vui lòng chọn ngày khởi hành!');
        }
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Bạn cần đăng nhập để đặt tour!');
            return navigate('/login');
        }

        const totalAmount = tour.base_price * numPeople;

        navigate('/booking-form', {
            state: {
                tour: tour,
                departureId: selectedDeparture,
                numPeople: numPeople,
                totalAmount: totalAmount
            }
        });
    };

    if (!tour) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải dữ liệu...</div>;

    // ==========================================
    // LOGIC XỬ LÝ ẢNH THÔNG MINH
    // ==========================================
    let finalImageUrl = 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
    if (tour.image_url) {
        if (tour.image_url.startsWith('http')) {
            finalImageUrl = tour.image_url;
        } else {
            let imagePath = tour.image_url.startsWith('/') ? tour.image_url.substring(1) : tour.image_url;
            if (!imagePath.startsWith('uploads/')) {
                imagePath = `uploads/${imagePath}`;
            }
            finalImageUrl = `http://localhost:5000/${imagePath}`;
        }
    }
    const bgImage = finalImageUrl;

    // ==========================================
    // GIẢI MÃ DỮ LIỆU THIẾT KẾ (KÉO THẢ)
    // ==========================================
    let parsedDesign = null;
    if (tour.design_data) {
        try {
            parsedDesign = typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : tour.design_data;
        } catch (e) {
            console.error("Lỗi parse design_data", e);
        }
    }

    const durationCount = parsedDesign?.days?.length || parsedDesign?.itineraryDays?.length || tour.itineraries?.length || 0;
    const totalAmount = tour.base_price * numPeople;

    return (
        <div className="tour-detail-page">
            <nav className="home-navbar">
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>
                <button onClick={() => navigate('/home')} className="btn-outline">Quay lại</button>
            </nav>

            <div className="detail-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${bgImage})` }}>
                <div className="detail-hero-content">
                    <span className="badge-location">📍 {getDestString(tour, parsedDesign)}</span>
                    <h1>{tour.tour_name}</h1>
                    <p>{tour.duration_days} Ngày {Math.max(0, tour.duration_days - 1)} Đêm | Trải nghiệm đẳng cấp</p>
                </div>
            </div>

            <div className="detail-container">
                <div className="detail-main">
                    {(parsedDesign?.categories?.length > 0 || parsedDesign?.highlights) && (
                        <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            {Array.isArray(parsedDesign.categories) && parsedDesign.categories.length > 0 && (
                                <div style={{ marginBottom: parsedDesign.highlights ? '16px' : '0' }}>
                                    <strong style={{ fontSize: '15px', color: '#047857', display: 'block', marginBottom: '10px' }}>🏷️ Phân loại Tour:</strong>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {parsedDesign.categories.map(c => <span key={c} style={{ background: '#ecfdf5', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid #a7f3d0' }}>{c}</span>)}
                                    </div>
                                </div>
                            )}
                            {parsedDesign.highlights && (
                                <div style={{ borderTop: (Array.isArray(parsedDesign.categories) && parsedDesign.categories.length > 0) ? '1px dashed #cbd5e1' : 'none', paddingTop: (Array.isArray(parsedDesign.categories) && parsedDesign.categories.length > 0) ? '16px' : '0' }}>
                                    <strong style={{ fontSize: '15px', color: '#ea580c', display: 'block', marginBottom: '8px' }}>✨ Điểm nhấn hành trình:</strong>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{parsedDesign.highlights}</p>
                                </div>
                            )}
                        </div>
                    )}
                    

                    {/* KHỐI LỊCH TRÌNH KHỞI HÀNH (MỚI) */}
                    <div id="lich-trinh-khoi-hanh" style={{ marginBottom: '40px' }}>
                        <h2 style={{ marginBottom: '20px', color: '#0f172a' }}>Lịch trình khởi hành</h2>
                        
                        {(() => {
                            // 1. Tạo 6 tháng tới
                            const monthKeys = [];
                            const now = new Date();
                            for (let i = 0; i < 6; i++) {
                                const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                                monthKeys.push({
                                    key: `Tháng ${d.getMonth() + 1}_${d.getFullYear()}`,
                                    labelMonth: `Tháng ${d.getMonth() + 1}`,
                                    labelYear: `${d.getFullYear()}`
                                });
                            }
                            
                            const grouped = {};
                            const deps = tour.departures || [];
                            deps.forEach(dep => {
                                const d = new Date(dep.departure_date);
                                const k = `Tháng ${d.getMonth() + 1}_${d.getFullYear()}`;
                                if (!grouped[k]) grouped[k] = [];
                                grouped[k].push(dep);
                            });
                            
                            // Nếu chưa có tab nào thì set default
                            if (!selectedMonthTab) {
                                setTimeout(() => setSelectedMonthTab(monthKeys[0].key), 0);
                            }

                            const activeDeps = grouped[selectedMonthTab] || [];
                            
                            // Tính toán giá
                            const adultPrice = tour.base_price || 0;
                            const ageMult = parsedDesign?.costConfig?.ageMultiplier || {};
                            
                            const getPrice = (type) => {
                                const s = ageMult[type] || { percent: 100, fixed_surcharge: 0 };
                                return (adultPrice * (s.percent / 100)) + Number(s.fixed_surcharge);
                            };
                            
                            const childPrice = getPrice('child');
                            const toddlerPrice = getPrice('toddler');
                            const infantPrice = getPrice('infant');
                            const singleSupp = parsedDesign?.costConfig?.variable?.singleSupplement || 0;
                            
                            const formatM = (v) => new Intl.NumberFormat('vi-VN').format(Math.round(v)) + 'đ';

                            return (
                                <div>
                                    {/* Tabs Tháng */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {monthKeys.map(mObj => {
                                            const isActive = mObj.key === selectedMonthTab;
                                            return (
                                                <button
                                                    key={mObj.key}
                                                    onClick={() => setSelectedMonthTab(mObj.key)}
                                                    style={{
                                                        padding: '12px 24px',
                                                        borderRadius: '16px',
                                                        border: isActive ? 'none' : '1px solid #cbd5e1',
                                                        background: isActive ? '#1d4ed8' : '#fff',
                                                        color: isActive ? '#fff' : '#64748b',
                                                        fontWeight: '600',
                                                        fontSize: '15px',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        minWidth: '100px'
                                                    }}
                                                >
                                                    <span>{mObj.labelMonth}</span>
                                                    <span style={{ fontSize: '14px', fontWeight: isActive ? '600' : '500' }}>{mObj.labelYear}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Danh sách ngày */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {activeDeps.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                                                Hiện chưa có lịch khởi hành nào trong {selectedMonthTab ? selectedMonthTab.replace('_', ' năm ') : 'tháng này'}.
                                            </div>
                                        ) : activeDeps.map(dep => {
                                            const isSelected = selectedDeparture === dep.departure_id;
                                            const d = new Date(dep.departure_date);
                                            const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
                                            const dateStr = d.toLocaleDateString('vi-VN');
                                            
                                            return (
                                                <div key={dep.departure_id} onClick={() => setSelectedDeparture(dep.departure_id)} style={{ padding: '20px', borderRadius: '16px', border: isSelected ? '2px solid #1d4ed8' : '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', boxShadow: isSelected ? '0 4px 12px rgba(29, 78, 216, 0.15)' : 'none', transition: 'all 0.2s' }}>
                                                    {/* Header Card */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <span style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', color: '#1e40af', fontSize: '15px' }}>{dayOfWeek}, {dateStr}</span>
                                                            <span style={{ color: '#475569', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>🎟️ {tour.tour_code || `${tour.tour_id}-DEP`}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                            <strong style={{ fontSize: '20px', color: '#0f172a' }}>{formatM(adultPrice)}</strong>
                                                            <button style={{ background: isSelected ? '#1d4ed8' : '#f1f5f9', color: isSelected ? '#fff' : '#475569', padding: '10px 24px', borderRadius: '24px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
                                                                {isSelected ? 'Đang chọn' : 'Chọn'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Chi tiết mở rộng khi Selected */}
                                                    {isSelected && (
                                                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #cbd5e1' }}>
                                                            {/* Phương tiện */}
                                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                                <strong style={{ fontSize: '15px', color: '#1e293b' }}>Phương tiện di chuyển</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                                                                <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '40px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày đi: <strong style={{color: '#0f172a'}}>{dateStr}</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {parsedDesign?.costConfig?.selectedTransport?.service_type === 'Vé máy bay' 
                                                                                ? `✈️ ${parsedDesign?.costConfig?.selectedTransport?.provider_name || 'Máy bay'}`
                                                                                : '🚌 Xe khách'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.startD || '05:30'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.start_destination_id))?.destination_name || 'Điểm đi'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
                                                                            <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}>
                                                                                <div style={{position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #0f172a', background: '#fff'}}></div>
                                                                                <div style={{position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a'}}></div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.endD || '12:00'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.end_destination_id))?.destination_name || 'Điểm đến'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày về: <strong style={{color: '#0f172a'}}>{new Date(dep.return_date || new Date(d.getTime() + (tour.duration_days - 1) * 86400000)).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {parsedDesign?.costConfig?.selectedTransport?.service_type === 'Vé máy bay' 
                                                                                ? `✈️ ${parsedDesign?.costConfig?.selectedTransport?.provider_name || 'Máy bay'}`
                                                                                : '🚌 Xe khách'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.startR || '12:00'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[parsedDesign.days.length - 1]?.start_destination_id))?.destination_name || 'Điểm đi'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
                                                                            <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}>
                                                                                <div style={{position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #0f172a', background: '#fff'}}></div>
                                                                                <div style={{position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a'}}></div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.endR || '17:30'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[parsedDesign.days.length - 1]?.end_destination_id))?.destination_name || 'Điểm đến'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ borderTop: '1px dashed #cbd5e1', marginBottom: '24px' }}></div>
                                                            
                                                            {/* Giá chuyến đi */}
                                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                                <strong style={{ fontSize: '15px', color: '#1e293b' }}>Giá chuyến đi</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '40px' }}>
                                                                <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Người lớn</strong><span style={{ fontSize: '13px', color: '#64748b' }}>(Từ 12 tuổi trở lên)</span></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(adultPrice)}</strong>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Trẻ em</strong><span style={{ fontSize: '13px', color: '#64748b' }}>(Từ 5 đến 11 tuổi)</span></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(childPrice)}</strong>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Trẻ nhỏ</strong><span style={{ fontSize: '13px', color: '#64748b' }}>(Từ 2 - 4 tuổi)</span></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(toddlerPrice)}</strong>
                                                                    </div>
                                                                </div>
                                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Em bé</strong><span style={{ fontSize: '13px', color: '#64748b' }}>(Dưới 2 tuổi)</span></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(infantPrice)}</strong>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Phụ thu phòng đơn</strong></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(singleSupp)}</strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ marginTop: '32px', background: '#fff1f2', color: '#e11d48', padding: '16px', borderRadius: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '500' }}>
                                                                Cần thêm thông tin vui lòng liên hệ Tổng đài 1800-646-888 HOÀN TOÀN MIỄN PHÍ cho khách hàng
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <h2>Tổng quan chuyến đi</h2>
                    <p className="tour-desc" style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#475569' }}>
                        {tour.description || "Hãy cùng chúng tôi khám phá những trải nghiệm tuyệt vời nhất trong chuyến đi này!"}
                    </p>

                    <h2 className="mt-4" style={{ marginBottom: '20px' }}>Lịch trình chi tiết ({durationCount} ngày)</h2>

                    {/* HIỂN THỊ LỊCH TRÌNH */}
                    {parsedDesign ? (
                        <div className="modern-itinerary">
                            {/* Lịch trình từng ngày theo timeline */}
                            <div style={{ paddingLeft: '24px', marginLeft: '12px', borderLeft: '2px solid #cbd5e1', marginTop: '30px' }}>
                                {parsedDesign.itineraryDays ? 
                                    parsedDesign.itineraryDays.map((day, idx) => (
                                        <DayItem key={day.dayIndex} day={day} isOldFormat={true} index={idx} getDestString={getDestString} tour={tour} parsedDesign={parsedDesign} destinations={destinations} bgImage={bgImage} />
                                    ))
                                : parsedDesign.days ? 
                                    parsedDesign.days.map((day, idx) => (
                                        <DayItem key={day.dayIndex} day={day} isOldFormat={false} index={idx} getDestString={getDestString} tour={tour} parsedDesign={parsedDesign} destinations={destinations} bgImage={bgImage} />
                                    ))
                                : null}
                            </div>
                        </div>
                    ) : (
                        /* FALLBACK CHO CÁC TOUR CŨ NHẬP BẰNG TAY (VD: Tour Phú Quốc) */
                        <div className="itinerary-list">
                            {tour.itineraries?.length > 0 ? tour.itineraries.map((it) => (
                                <div className="itinerary-item" key={it.itinerary_id}>
                                    <div className="day-badge">Ngày {it.day_number}</div>
                                    <div className="day-content">
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{it.title}</h3>
                                        <p style={{ color: '#475569', lineHeight: '1.6' }}>{it.description}</p>
                                    </div>
                                </div>
                            )) : <p style={{ color: '#64748b' }}>Lịch trình đang được cập nhật...</p>}
                        </div>
                    )}

                    {/* THÔNG TIN CHUYẾN ĐI & CHÍNH SÁCH */}
                    <div className="tour-policies" style={{ marginTop: '40px', background: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <h2 style={{ marginBottom: '24px', fontSize: '22px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>Thông tin cần biết</h2>
                        
                        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '30px' }}>
                            <div style={{ flex: 1, minWidth: '280px' }}>
                                <h3 style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', marginBottom: '16px' }}>
                                    <span style={{ background: '#d1fae5', padding: '6px', borderRadius: '8px', fontSize: '12px' }}>✅</span> Giá tour bao gồm
                                </h3>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#475569', lineHeight: '1.8', fontSize: '15px' }}>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#10b981' }}>✓</span> Khách sạn tiêu chuẩn 3-4 sao (2 khách/phòng)</li>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#10b981' }}>✓</span> Xe du lịch máy lạnh đời mới đưa đón theo lịch trình</li>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#10b981' }}>✓</span> Các bữa ăn theo tiêu chuẩn chương trình</li>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#10b981' }}>✓</span> Vé tham quan các điểm du lịch theo lịch trình</li>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#10b981' }}>✓</span> Bảo hiểm du lịch với mức bồi thường 50.000.000đ</li>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#10b981' }}>✓</span> Hướng dẫn viên chuyên nghiệp, nhiệt tình</li>
                                </ul>
                            </div>
                            
                            <div style={{ flex: 1, minWidth: '280px' }}>
                                <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', marginBottom: '16px' }}>
                                    <span style={{ background: '#fee2e2', padding: '6px', borderRadius: '8px', fontSize: '12px' }}>❌</span> Giá tour không bao gồm
                                </h3>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#475569', lineHeight: '1.8', fontSize: '15px' }}>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#ef4444' }}>✕</span> Phụ thu phòng đơn (nếu khách ở 1 mình)</li>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#ef4444' }}>✕</span> Chi phí cá nhân: giặt ủi, điện thoại, ăn ngoài</li>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#ef4444' }}>✕</span> Tiền bồi dưỡng (Tip) cho HDV và Tài xế</li>
                                    <li style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}><span style={{ color: '#ef4444' }}>✕</span> Thuế VAT (nếu quý khách yêu cầu xuất hóa đơn)</li>
                                </ul>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                            <h3 style={{ color: '#0f172a', fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>⚠️</span> Chính sách hủy tour (Tham khảo)
                            </h3>
                            <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', lineHeight: '1.8', fontSize: '14.5px' }}>
                                <li>Hủy trước 15 ngày khởi hành: Miễn phí hủy tour (Hoàn 100% tiền).</li>
                                <li>Hủy từ 07 - 14 ngày trước khởi hành: Phí hủy là 50% tổng giá trị.</li>
                                <li>Hủy từ 03 - 06 ngày trước khởi hành: Phí hủy là 70% tổng giá trị.</li>
                                <li>Hủy trong vòng 48 giờ trước khởi hành: Phí hủy là 100% tổng giá trị.</li>
                                <li><strong style={{ color: '#0f172a' }}>Lưu ý:</strong> Thời gian hủy tính theo ngày làm việc (trừ T7, CN & Lễ Tết).</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <div className="detail-sidebar">
                    {!selectedDeparture ? (
                        <div className="booking-card" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', background: '#fff', border: 'none', position: 'sticky', top: '100px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569' }}>
                                    <span>🏷️ Mã chương trình:</span>
                                    <strong style={{ color: '#0f172a', marginLeft: 'auto' }}>{tour.tour_code || `${tour.tour_id}-DEP`}</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569' }}>
                                    <span>⏱️ Thời gian:</span>
                                    <strong style={{ color: '#0f172a', marginLeft: 'auto' }}>{tour.duration_days} ngày {Math.max(0, tour.duration_days - 1)} đêm</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', marginTop: '8px' }}>
                                    <span>Giá từ:</span>
                                    <strong style={{ color: '#1d4ed8', fontSize: '22px' }}>{new Intl.NumberFormat('vi-VN').format(tour.base_price)}đ</strong>
                                </div>
                                <button onClick={() => {
                                    const el = document.getElementById('lich-trinh-khoi-hanh');
                                    if(el) {
                                        window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
                                    } else {
                                        alert('Vui lòng chọn lịch trình khởi hành ở phần bên trái!');
                                    }
                                }} style={{ width: '100%', background: '#dc2626', color: '#fff', padding: '14px', borderRadius: '24px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
                                    Chọn ngày
                                </button>
                            </div>
                        </div>
                    ) : (
                        (() => {
                            const selDep = tour.departures?.find(d => String(d.departure_id) === String(selectedDeparture));
                            if(!selDep) return null;
                            const d = new Date(selDep.departure_date);
                            const dateStr = d.toLocaleDateString('vi-VN');
                            const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
                            
                            return (
                                <div className="booking-card" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', background: '#fff', border: 'none', position: 'sticky', top: '100px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Giá:</span>
                                            <strong style={{ color: '#1d4ed8', fontSize: '24px' }}>{new Intl.NumberFormat('vi-VN').format(tour.base_price)}đ</strong>
                                        </div>
                                        <button onClick={() => setSelectedDeparture('')} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {dayOfWeek}, {dateStr} ✏️
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>🏷️ Mã tour:</span>
                                            <strong style={{ color: '#1e40af' }}>{tour.tour_code || `${tour.tour_id}-DEP`}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>📍 Khởi hành:</span>
                                            <strong style={{ color: '#0f172a', textAlign: 'right' }}>{destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.start_destination_id))?.destination_name || 'Đang cập nhật'}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>⏱️ Thời gian:</span>
                                            <strong style={{ color: '#0f172a' }}>{tour.duration_days} ngày {Math.max(0, tour.duration_days - 1)} đêm</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>💺 Số chỗ còn:</span>
                                            <strong style={{ color: '#0f172a' }}>Còn {selDep.available_slots} chỗ</strong>
                                        </div>
                                        
                                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '16px', marginTop: '16px' }}></div>
                                        
                                        <button onClick={handleGoToBooking} style={{ width: '100%', background: '#dc2626', color: '#fff', padding: '14px', borderRadius: '24px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '16px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
                                            Đặt ngay
                                        </button>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
            <CustomerFooter />
        </div>
    );
};

export default TourDetail;