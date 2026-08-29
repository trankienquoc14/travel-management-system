
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimelineBuilder from './TourBuilder/TimelineBuilder';
// Nếu utils không tồn tại hàm formatMoney, ta định nghĩa lại:
export const formatMoneyLocal = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    return Number(amount).toLocaleString('vi-VN');
};

const StaffFixedTourDesigner = ({ editTourData }) => {
    const [tours, setTours] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Core states
    const [formData, setFormData] = useState({
        tour_id: null,
        tour_name: '',
        description: '',
        image: null,
        image_url: '', categories: [], highlights: '' });

    // Multi-destination Routing State
    const [dayImages, setDayImages] = useState({});
    const [dayImagePreviews, setDayImagePreviews] = useState({});
    const [filterProv, setFilterProv] = useState('All'); // Lọc theo tỉnh
    const [days, setDays] = useState([
        { dayIndex: 1, start_destination_id: '', end_destination_id: '', route_title: '', activities: [] }
    ]);

    // Costing State
    const [costConfig, setCostConfig] = useState({
        minimumPax: 15,
        margin: 20,
        fixed: { transport: 0, guidePerDay: 500000, otherFixed: 0 },
        variable: { accommPerNight: 0, singleSupplement: 0, breakfast: 0, lunch: 0, dinner: 0, tickets: 0, insurance: 0 },
        ageMultiplier: { 
            child: { percent: 75, fixed_surcharge: 0 }, 
            toddler: { percent: 50, fixed_surcharge: 0 },
            infant: { percent: 0, fixed_surcharge: 500000 },
            preset: 'custom'
        },
        selectedTransport: null,
        transportTimes: { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' }
    });

    // Resources
    const [destinations, setDestinations] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [transportServices, setTransportServices] = useState([]);


    const fetchTours = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/tours/staff/tours', { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setTours(res.data.data || []);
        } catch (error) { console.error(error); }
    };

    const fetchDestinations = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/destinations", { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setDestinations(res.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchTransportServices = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/services", { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                setAllServices(res.data.data);
                const transports = res.data.data.filter(s => 
                    s.service_type === 'Vé máy bay' || 
                    s.service_type === 'Xe vận chuyển' ||
                    s.service_type === 'Phương tiện'
                );
                setTransportServices(transports);
            }
        } catch (error) { console.error('Lỗi tải danh sách phương tiện', error); }
    };

    // Auto-calculators
    const totalDays = days.length;
    const totalNights = Math.max(0, totalDays - 1);
    
    // Auto compute tickets and accommodations
    let autoTicketsCost = 0;
    let autoAccommodationCost = 0;
    let includedBreakfast = 0;
    let includedLunch = 0;
    let includedDinner = 0;

    days.forEach(day => {
        if (day.meals?.breakfast === true || day.meals?.breakfast === 'external') includedBreakfast++;
        if (day.meals?.lunch === true || day.meals?.lunch === 'external') includedLunch++;
        if (day.meals?.dinner === true || day.meals?.dinner === 'external') includedDinner++;
        
        if (day.accommodation && day.accommodation.price) {
            autoAccommodationCost += Number(day.accommodation.price);
        }

        if (day.activities) {
            day.activities.forEach(act => {
                if (act.type === 'Tham quan') autoTicketsCost += Number(act.price || 0);
            });
        }
    });

    const defaultBreakfast = includedBreakfast;
    const defaultLunch = includedLunch;
    const defaultDinner = includedDinner;

    const countBreakfast = costConfig.variable.countBreakfast !== undefined && costConfig.variable.countBreakfast !== '' ? Number(costConfig.variable.countBreakfast) : defaultBreakfast;
    const countLunch = costConfig.variable.countLunch !== undefined && costConfig.variable.countLunch !== '' ? Number(costConfig.variable.countLunch) : defaultLunch;
    const countDinner = costConfig.variable.countDinner !== undefined && costConfig.variable.countDinner !== '' ? Number(costConfig.variable.countDinner) : defaultDinner;

    // Pricing Math
    const totalFixed = Number(costConfig.fixed.transport) + (Number(costConfig.fixed.guidePerDay) * totalDays) + Number(costConfig.fixed.otherFixed);
    const fixedPerPax = costConfig.minimumPax > 0 ? totalFixed / costConfig.minimumPax : 0;
    
    
    const finalTicketsCost = autoTicketsCost;

    const totalVariable = (autoAccommodationCost / 2) 
        + Number(costConfig.variable.transportTicket || 0)
        + (Number(costConfig.variable.breakfast) * countBreakfast)
        + (Number(costConfig.variable.lunch) * countLunch)
        + (Number(costConfig.variable.dinner) * countDinner)
        + finalTicketsCost 
        + Number(costConfig.variable.insurance);
        
    const netCost = fixedPerPax + totalVariable;
    const sellingPrice = netCost * (1 + Number(costConfig.margin) / 100);

    useEffect(() => {
        if (costConfig.selectedTransport) {
            const s = costConfig.selectedTransport;
            const isTicket = s.unit && (s.unit.toLowerCase().includes('vé') || s.unit.toLowerCase().includes('người'));
            if (!isTicket) {
                setCostConfig(prev => ({
                    ...prev,
                    fixed: { ...prev.fixed, transport: Number(s.base_cost) * days.length }
                }));
            }
        }
    }, [days.length, costConfig.selectedTransport]);

    const handleTransportChange = (e) => {
        const sid = e.target.value;
        if (!sid) {
            setCostConfig({...costConfig, 
                selectedTransport: null,
                fixed: { ...costConfig.fixed, transport: 0 },
                variable: { ...costConfig.variable, transportTicket: 0 },
                transportTimes: { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' }
            });
            return;
        }
        const s = transportServices.find(x => String(x.service_id) === String(sid));
        const isTicket = s && s.unit && (s.unit.toLowerCase().includes('vé') || s.unit.toLowerCase().includes('người'));
        
        setCostConfig({...costConfig, 
            selectedTransport: s || null,
            fixed: { ...costConfig.fixed, transport: (!isTicket && s) ? Number(s.base_cost) * days.length : 0 },
            variable: { ...costConfig.variable, transportTicket: (isTicket && s) ? Number(s.base_cost) : 0 },
            transportTimes: { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' }
        });
    };

    const handleSave = async () => {
        if (!formData.tour_name) return alert("Vui lòng nhập tên Tour!");
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const design_data = JSON.stringify({ days, costConfig, computed: { netCost, sellingPrice, totalDays, totalNights, totalMeals: { breakfast: countBreakfast, lunch: countLunch, dinner: countDinner }, autoTicketsCost }, categories: formData.categories, highlights: formData.highlights });
            
            const data = new FormData();
            data.append('tour_name', formData.tour_name);
            data.append('description', formData.description);
            // Default destination to first day's end destination or generic
            data.append('destination', days[0]?.end_destination_id || 'Multi-Destination');
            data.append('duration_days', totalDays);
            data.append('base_cost', netCost);
            data.append('base_price', sellingPrice);
            data.append('markup_percent', costConfig.margin);
            data.append('design_data', design_data);
            data.append('is_custom', 0); // Fixed Tour
            
            if (formData.image) {
                data.append('image', formData.image);
            }
            if (formData.image_url) {
                data.append('existing_image_url', formData.image_url);
            }

            Object.keys(dayImages).forEach(dIndex => {
                data.append(`dayImage_${dIndex}`, dayImages[dIndex]);
            });

            const existingDayImages = {};
            Object.keys(dayImagePreviews || {}).forEach(k => {
                if (dayImagePreviews[k] && dayImagePreviews[k].startsWith('/')) {
                    existingDayImages[k] = dayImagePreviews[k];
                }
            });
            data.append('existing_day_images', JSON.stringify(existingDayImages));

            if (formData.tour_id) data.append('tour_id', formData.tour_id);

            const url = formData.tour_id 
                ? `http://localhost:5000/api/tours/staff/tours/${formData.tour_id}`
                : 'http://localhost:5000/api/tours/staff/tours';
            const method = formData.tour_id ? 'put' : 'post';

            const res = await axios[method](url, data, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                alert(formData.tour_id ? 'Cập nhật thành công!' : 'Tạo Tour thành công!');
                setIsEditing(false);
                fetchTours();
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi khi lưu!");
        } finally {
            setLoading(false);
        }
    };

    const handleEditTour = async (tour) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/tours/staff/tours/${tour.tour_id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                const tourData = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
                setFormData({
                    tour_id: tourData.tour_id,
                    tour_name: tourData.tour_name,
                    description: tourData.description,
                    image: null,
                    image_url: tourData.image_url, categories: [], highlights: '' });
                try {
                    const parsed = typeof tourData.design_data === 'string' ? JSON.parse(tourData.design_data) : tourData.design_data;
                    if (parsed && parsed.dayImages) setDayImagePreviews(parsed.dayImages);
                } catch(e) {}
                
                if (tourData.design_data) {
                    try {
                        const parsed = typeof tourData.design_data === 'string' ? JSON.parse(tourData.design_data) : tourData.design_data;
                        if (parsed.categories) setFormData(prev => ({...prev, categories: parsed.categories}));
                        if (parsed.highlights) setFormData(prev => ({...prev, highlights: parsed.highlights}));
                        if (parsed.days) {
                            setDays(parsed.days.map((d, i) => ({
                                dayIndex: i + 1,
                                start_destination_id: d.start_destination_id || '',
                                end_destination_id: d.end_destination_id || '',
                                route_title: d.route_title || '',
                                activities: d.activities || [],
                                accommodation: d.accommodation || null,
                                meals: d.meals || { breakfast: false, lunch: false, dinner: false }
                            })));
                        }
                        if (parsed.costConfig) {
                            let parsedAgeMult = parsed.costConfig.ageMultiplier || {};
                            // Backward compatibility migration
                            if (typeof parsedAgeMult.child === 'number') {
                                parsedAgeMult = {
                                    child: { percent: parsedAgeMult.child, fixed_surcharge: 0 },
                                    toddler: { percent: 50, fixed_surcharge: 0 },
                                    infant: { percent: parsedAgeMult.infant || 0, fixed_surcharge: (parsedAgeMult.infant === 0 ? 500000 : 0) },
                                    preset: 'custom'
                                };
                            } else if (!parsedAgeMult.child) {
                                parsedAgeMult = {
                                    child: { percent: 75, fixed_surcharge: 0 },
                                    toddler: { percent: 50, fixed_surcharge: 0 },
                                    infant: { percent: 0, fixed_surcharge: 500000 },
                                    preset: 'custom'
                                };
                            }
                            
                            setCostConfig(prev => ({
                                ...prev,
                                ...parsed.costConfig,
                                fixed: { ...(prev.fixed || {}), ...(parsed.costConfig.fixed || {}) },
                                variable: { ...(prev.variable || {}), ...(parsed.costConfig.variable || {}) },
                                ageMultiplier: { ...(prev.ageMultiplier || {}), ...parsedAgeMult },
                                transportTimes: { ...(prev.transportTimes || {}), ...(parsed.costConfig.transportTimes || {}) }
                            }));
                        }
                    } catch (e) { console.error("JSON parse error:", e); }
                }
                setIsEditing(true);
            }
        } catch (error) { console.error(error); }
    };

        useEffect(() => {
        fetchTours();
        fetchDestinations();
        fetchTransportServices();
    }, []);

    useEffect(() => {
        if (editTourData && editTourData.tour_id) {
            handleEditTour(editTourData);
        }
    }, [editTourData]);

    if (!isEditing) {
        const getDestName = (tour) => {
            let destName = 'Chưa phân loại';
            if (tour.destination) {
                const destObj = destinations.find(x => String(x.destination_id) === String(tour.destination));
                if (destObj) {
                    destName = destObj.destination_name;
                } else {
                    destName = String(tour.destination);
                    if (destName === 'Multi-Destination') destName = 'Nhiều điểm đến';
                }
            }
            if (destName === 'Chưa phân loại' || destName === 'Multi-Destination' || destName === 'Nhiều điểm đến') {
                try {
                    const d = typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : (tour.design_data || {});
                    if (d.days && d.days.length > 0) {
                        const firstId = d.days[0].end_destination_id || d.days[0].start_destination_id;
                        const destObj = destinations.find(x => String(x.destination_id) === String(firstId));
                        if (destObj) destName = destObj.destination_name;
                    }
                } catch(e){}
            }
            return destName;
        };

        const groupedTours = tours.reduce((acc, tour) => {
            const destName = getDestName(tour);
            if (!acc[destName]) acc[destName] = [];
            acc[destName].push(tour);
            return acc;
        }, {});

        const provOptions = Object.keys(groupedTours).sort();
        const visibleProvs = filterProv === 'All' ? provOptions : [filterProv];

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Danh sách Tour Cố định</h2>
                        {provOptions.length > 0 && (
                            <select 
                                value={filterProv} 
                                onChange={(e) => setFilterProv(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: '14px', minWidth: '200px' }}
                            >
                                <option value="All">-- Tất cả khu vực --</option>
                                {provOptions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        )}
                    </div>
                    <button onClick={() => { 
                        setFormData({ tour_id: null, tour_name: '', description: '', image: null, image_url: '', categories: [], highlights: '' });
                        setDays([{ dayIndex: 1, start_destination_id: '', end_destination_id: '', route_title: '', activities: [], accommodation: null, transportTimes: { departureTime: '', returnTime: '' } }]);
                        setDayImages({});
                        setDayImagePreviews({});
                        setCostConfig({ minimumPax: 15, margin: 20, selectedTransport: null, transportTimes: { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' }, fixed: { transport: 0, guidePerDay: 500000, otherFixed: 0 }, variable: { transportTicket: 0, accommPerNight: 0, singleSupplement: 0, breakfast: 200000, lunch: 200000, dinner: 200000, tickets: 0, insurance: 0 }, ageMultiplier: { child: 75, infant: 25 } });
                        setIsEditing(true);
                    }} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Tạo Tour Mới</button>
                </div>
                
                {visibleProvs.length === 0 && Object.keys(groupedTours).length > 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Không có tour nào ở khu vực này.</div>
                )}
                {Object.keys(groupedTours).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chưa có tour nào.</div>
                )}
                
                {visibleProvs.map(prov => (
                    <div key={prov} style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0' }}>
                            <span style={{ marginRight: '8px' }}>📍</span> 
                            Điểm đến: <span style={{ color: '#047857' }}>{prov}</span>
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {groupedTours[prov].map(t => (
                                <div key={t.tour_id} style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    {t.image_url && (
                                        <div style={{ height: '120px', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                                            <img src={t.image_url.startsWith('/') ? `http://localhost:5002${t.image_url}` : t.image_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.tour_name}</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <span style={{ color: '#64748b', fontSize: '13px', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: '500' }}>⏱️ {t.duration_days} ngày</span>
                                        <span style={{ color: '#ea580c', fontSize: '15px', fontWeight: 'bold' }}>{formatMoneyLocal(t.base_price)} đ</span>
                                    </div>
                                    <button onClick={() => handleEditTour(t)} style={{ padding: '10px 16px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#94a3b8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}>✏️ Chỉnh sửa</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Quay lại</button>
                    <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{formData.tour_id ? 'Chỉnh sửa Tour' : 'Tạo Tour Mới'}</h2>
                </div>
            </div>

            {/* General Info */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>Thông tin cơ bản</h3>
                    <div style={{ padding: '6px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>THÔNG SỐ HÀNH TRÌNH:</span>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>{totalDays} Ngày {totalNights} Đêm</strong>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {/* Cột trái: Văn bản (70%) */}
                    <div style={{ flex: '7', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tên Tour</label>
                            <input value={formData.tour_name} onChange={e => setFormData({...formData, tour_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Phân loại / Chủ đề Tour</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['Nghỉ dưỡng', 'Khám phá', 'Văn hóa', 'Lễ Tết', 'Mạo hiểm', 'Biển đảo', 'Gia đình'].map(cat => {
                                    const isSelected = formData.categories?.includes(cat);
                                    return (
                                        <div 
                                            key={cat} 
                                            onClick={() => {
                                                const current = formData.categories || [];
                                                if (current.includes(cat)) {
                                                    setFormData({...formData, categories: current.filter(c => c !== cat)});
                                                } else {
                                                    setFormData({...formData, categories: [...current, cat]});
                                                }
                                            }}
                                            style={{ 
                                                padding: '6px 12px', 
                                                borderRadius: '20px', 
                                                border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1', 
                                                background: isSelected ? '#eff6ff' : '#f8fafc', 
                                                color: isSelected ? '#2563eb' : '#64748b',
                                                fontSize: '13px', 
                                                cursor: 'pointer',
                                                fontWeight: isSelected ? 'bold' : 'normal',
                                                userSelect: 'none',
                                                transition: 'all 0.2s'
                                            }}>
                                            {cat}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Điểm nhấn Tour (Mỗi dòng 1 điểm nhấn)</label>
                            <textarea 
                                rows="3" 
                                value={formData.highlights || ''} 
                                onChange={e => setFormData({...formData, highlights: e.target.value})} 
                                placeholder="Tặng vé cáp treo Fansipan&#10;Lưu trú khách sạn 4 sao trung tâm&#10;Thưởng thức lẩu cá hồi đặc sản..."
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }} 
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Mô tả tổng quan</label>
                            <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, resize: 'vertical' }} />
                        </div>
                    </div>
                    
                    {/* Cột phải: Hình ảnh (30%) */}
                    <div style={{ flex: '3', display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Ảnh đại diện</label>
                        <div style={{ flex: 1, border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                            {(formData.image || formData.image_url) ? (
                                <>
                                    <img 
                                        src={formData.image instanceof File ? URL.createObjectURL(formData.image) : (formData.image_url.startsWith('http') ? formData.image_url : `http://localhost:5000${formData.image_url}`)} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                                        alt="Preview"
                                    />
                                    <button 
                                        onClick={() => setFormData({...formData, image: null, image_url: ''})} 
                                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                    <span style={{ fontSize: '28px', marginBottom: '8px' }}>📷</span>
                                    <span>Chọn ảnh Tour</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => { if(e.target.files[0]) setFormData({...formData, image: e.target.files[0] }) }} 
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Flex Container for Itinerary and Costing side by side or stacked */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                
                {/* Lịch trình */}
                <TimelineBuilder 
                            days={days} 
                            setDays={setDays} 
                            destinations={destinations} 
                            allServices={allServices} 
                            dayImages={dayImages}
                            setDayImages={setDayImages}
                            dayImagePreviews={dayImagePreviews}
                            setDayImagePreviews={setDayImagePreviews}
                            costConfig={costConfig}
                            setCostConfig={setCostConfig}
                        />

                {/* Costing */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#d97706' }}>Định phí</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chọn phương tiện di chuyển chính</label>
                                <select 
                                    value={costConfig.selectedTransport?.service_id || ''} 
                                    onChange={handleTransportChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Tự túc / Không chọn --</option>
                                    {transportServices.map(t => (
                                        <option key={t.service_id} value={t.service_id}>{t.service_name} (Từ {Number(t.base_cost).toLocaleString('vi-VN')}đ)</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Điểm hòa vốn</label>
                                <input type="number" value={costConfig.minimumPax} onChange={e => setCostConfig({...costConfig, minimumPax: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chi phí Xe / Phương tiện</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.transport || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, transport: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Đơn giá HDV / Ngày</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.guidePerDay || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, guidePerDay: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tổng Định Phí:</span>
                            <span style={{ color: '#d97706' }}>{Number(totalFixed).toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#2563eb' }}>Biến phí</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Vé Xe / Máy bay / Khách</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(costConfig.variable.transportTicket || 0).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chi phí khách sạn (2 khách / phòng)</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{(autoAccommodationCost / 2).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa sáng (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultBreakfast}`} value={costConfig.variable.countBreakfast !== undefined ? costConfig.variable.countBreakfast : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countBreakfast: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa sáng" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.breakfast || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, breakfast: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa trưa (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultLunch}`} value={costConfig.variable.countLunch !== undefined ? costConfig.variable.countLunch : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countLunch: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa trưa" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.lunch || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, lunch: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa tối (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultDinner}`} value={costConfig.variable.countDinner !== undefined ? costConfig.variable.countDinner : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countDinner: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa tối" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.dinner || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, dinner: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Tổng chi phí các điểm tham quan</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(autoTicketsCost).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bảo hiểm & Khác</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.insurance || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, insurance: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tổng Biến Phí / Khách:</span>
                            <span style={{ color: '#2563eb' }}>{Number(totalVariable).toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>
                    
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#7c3aed' }}>Lợi nhuận & Phụ thu</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Biên độ lợi nhuận (%)</label>
                                <input type="number" value={costConfig.margin} onChange={e => setCostConfig({...costConfig, margin: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Phụ thu phòng đơn / Khách</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.singleSupplement || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, singleSupplement: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#0ea5e9' }}>Chính sách giá trẻ em</h3>
                            <select 
                                value={costConfig.ageMultiplier.preset || 'custom'}
                                onChange={e => {
                                    const preset = e.target.value;
                                    let newMulti = { ...costConfig.ageMultiplier, preset };
                                    if (preset === 'road') {
                                        newMulti = { preset, child: { percent: 50, fixed_surcharge: 0 }, toddler: { percent: 0, fixed_surcharge: 0 }, infant: { percent: 0, fixed_surcharge: 0 } };
                                    } else if (preset === 'air') {
                                        newMulti = { preset, child: { percent: 85, fixed_surcharge: 0 }, toddler: { percent: 50, fixed_surcharge: 0 }, infant: { percent: 0, fixed_surcharge: 500000 } };
                                    }
                                    setCostConfig({ ...costConfig, ageMultiplier: newMulti });
                                }}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            >
                                <option value="custom">Tuỳ chỉnh (Custom)</option>
                                <option value="road">Mẫu 1 (Đường bộ): 50% - 0% - 0%</option>
                                <option value="air">Mẫu 2 (Hàng không): 85% - 50% - (0% + Phụ thu)</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            {[
                                { key: 'child', label: 'Trẻ em (5 - 11 tuổi)' },
                                { key: 'toddler', label: 'Trẻ nhỏ (2 - 4 tuổi)' },
                                { key: 'infant', label: 'Em bé (< 2 tuổi)' }
                            ].map(group => {
                                const currentSetting = costConfig.ageMultiplier[group.key] || { percent: 0, fixed_surcharge: 0 };
                                const isCustom = costConfig.ageMultiplier.preset === 'custom';
                                const calPrice = (sellingPrice * (currentSetting.percent || 0) / 100) + Number(currentSetting.fixed_surcharge || 0);

                                return (
                                    <div key={group.key} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ display: 'block', marginBottom: '10px', color: '#1e293b', fontSize: '14px' }}>{group.label}</strong>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input 
                                                        type="number" 
                                                        value={currentSetting.percent}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...costConfig.ageMultiplier,
                                                                    [group.key]: { ...currentSetting, percent: Number(e.target.value) }
                                                                }
                                                            })
                                                        }}
                                                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: isCustom ? '#fff' : '#f1f5f9' }}
                                                    />
                                                    <span style={{ color: '#64748b', fontSize: '13px' }}>%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type="text" 
                                                        value={Number(currentSetting.fixed_surcharge || 0).toLocaleString('vi-VN')}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...costConfig.ageMultiplier,
                                                                    [group.key]: { ...currentSetting, fixed_surcharge: Number(e.target.value.replace(/\D/g, '')) }
                                                                }
                                                            })
                                                        }}
                                                        style={{ width: '100%', padding: '6px', paddingRight: '20px', borderRadius: '4px', border: '1px solid #cbd5e1', background: isCustom ? '#fff' : '#f1f5f9' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '12px' }}>đ</span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '5px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>Giá bán:</span>
                                                <strong style={{ fontSize: '14px', color: '#0ea5e9' }}>{formatMoneyLocal(calPrice)} đ</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
            {/* Pricing Footer */}
            <div style={{ marginTop: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', gap: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Giá vốn</span>
                        <strong style={{ fontSize: '20px', color: '#d97706' }}>{formatMoneyLocal(netCost)} đ</strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Định phí: {formatMoneyLocal(fixedPerPax)} | Biến phí: {formatMoneyLocal(totalVariable)}</span>
                    </div>
                    <div style={{ height: '40px', width: '2px', background: '#e2e8f0' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#059669', textTransform: 'uppercase', fontWeight: 'bold' }}>Giá bán</span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <input 
                                type="text" 
                                value={Number(sellingPrice || 0).toLocaleString('vi-VN')}
                                onChange={(e) => {
                                    const input = e.target;
                                    const oldCursor = input.selectionStart;
                                    const oldLen = input.value.length;
                                    
                                    const newSellingPrice = Number(input.value.replace(/\D/g, ''));
                                    if (netCost > 0) {
                                        const newMargin = ((newSellingPrice / netCost) - 1) * 100;
                                        setCostConfig({...costConfig, margin: newMargin});
                                    }
                                    
                                    requestAnimationFrame(() => {
                                        const newLen = input.value.length;
                                        const newCursor = Math.max(0, oldCursor + (newLen - oldLen));
                                        input.setSelectionRange(newCursor, newCursor);
                                    });
                                }}
                                style={{ 
                                    fontSize: '26px', 
                                    color: '#10b981', 
                                    fontWeight: '900',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    width: '180px',
                                    textAlign: 'right',
                                    padding: 0
                                }} 
                            />
                            <strong style={{ fontSize: '26px', color: '#10b981', fontWeight: '900' }}>đ</strong>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '20px', borderLeft: '2px dashed #e2e8f0' }}>
                        <span style={{ fontSize: '12px', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 'bold' }}>Phụ thu phòng đơn</span>
                        <strong style={{ fontSize: '18px', color: '#7c3aed' }}>+ {formatMoneyLocal(costConfig.variable.singleSupplement)} đ</strong>
                    </div>
                </div>
                
                {(!editTourData || editTourData.approval_status !== 'Approved') && (
                    <button onClick={handleSave} disabled={loading} style={{ padding: '12px 28px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
                        {loading ? 'Đang xử lý...' : 'Gửi duyệt'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default StaffFixedTourDesigner;
