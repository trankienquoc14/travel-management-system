import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const TourForm = ({ tourId, onBack }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allPlaces, setAllPlaces] = useState([]);

    // Tab 1: Thông tin cơ bản
    const [formData, setFormData] = useState({
        tour_name: '', description: '', destination: 'Đà Lạt',
        duration_days: 3, base_price: 3500000, image_url: '', status: 'Active'
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState('');

    // Tab 2: Lịch trình từng ngày
    const [itineraryDays, setItineraryDays] = useState([
        { day_number: 1, title: 'Ngày 1: Đón khách & Khởi hành', description: '', places: [] },
        { day_number: 2, title: 'Ngày 2: Khám phá các điểm nổi tiếng', description: '', places: [] },
        { day_number: 3, title: 'Ngày 3: Mua sắm đặc sản & Tiễn đoàn', description: '', places: [] }
    ]);

    // Tab 3: Các đợt khởi hành
    const [departures, setDepartures] = useState([]);

    useEffect(() => {
        fetchPlaces();
        if (tourId) fetchTourData();
    }, [tourId]);

    const fetchPlaces = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/custom-tours/services/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setAllPlaces(res.data.data?.sightseeing || []);
        } catch (error) { console.error(error); }
    };

    const fetchTourData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/tours/admin/${tourId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const t = res.data.data;
                setFormData({
                    tour_name: t.tour_name, description: t.description || '', destination: t.destination,
                    duration_days: t.duration_days, base_price: t.base_price,
                    image_url: t.image_url || '', status: t.status
                });

                if (t.image_url) {
                    let imgPath = t.image_url.startsWith('/') ? t.image_url.substring(1) : t.image_url;
                    if (!imgPath.startsWith('uploads/') && !imgPath.startsWith('http')) imgPath = `uploads/${imgPath}`;
                    setPreviewImage(t.image_url.startsWith('http') ? t.image_url : `http://localhost:5000/${imgPath}`);
                }
                if (t.itineraryDays?.length > 0) setItineraryDays(t.itineraryDays);
                if (t.departures?.length > 0) setDepartures(t.departures);
            }
        } catch (error) { console.error('Lỗi tải thông tin tour', error); }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDurationChange = (e) => {
        const num = Number(e.target.value);
        setFormData({ ...formData, duration_days: num });
        const newDays = [];
        for (let i = 1; i <= num; i++) {
            const existing = itineraryDays.find(d => d.day_number === i);
            newDays.push(existing || { day_number: i, title: `Ngày ${i}: Khám phá ${formData.destination}`, description: '', places: [] });
        }
        setItineraryDays(newDays);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const addPlaceToDay = (dayIdx, place) => {
        const rawId = place.id.toString().replace('place_', '');
        const updated = [...itineraryDays];
        updated[dayIdx].places.push({
            place_id: Number(rawId),
            place_name: place.name,
            visit_time: '08:30',
            visit_order: updated[dayIdx].places.length + 1
        });
        setItineraryDays(updated);
    };

    const removePlaceFromDay = (dayIdx, placeIdx) => {
        const updated = [...itineraryDays];
        updated[dayIdx].places.splice(placeIdx, 1);
        setItineraryDays(updated);
    };

    const addDepartureSlot = () => {
        setDepartures([...departures, { departure_date: '', return_date: '', max_slots: 30 }]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        const submitData = new FormData();
        if (tourId) submitData.append('tour_id', tourId);
        submitData.append('tour_name', formData.tour_name);
        submitData.append('description', formData.description);
        submitData.append('destination', formData.destination);
        submitData.append('duration_days', formData.duration_days);
        submitData.append('base_price', formData.base_price);
        submitData.append('status', formData.status);
        submitData.append('existing_image_url', formData.image_url);

        submitData.append('itineraryDays', JSON.stringify(itineraryDays));
        submitData.append('departures', JSON.stringify(departures));

        if (selectedFile) submitData.append('image', selectedFile);

        try {
            const res = await axios.post('http://localhost:5000/api/tours/admin/save', submitData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                alert(res.data.message);
                onBack();
            }
        } catch (error) {
            alert('Lỗi lưu tour: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-page-container">
            <div className="form-page-header">
                <button type="button" className="btn-back" onClick={onBack}>⬅ Quay lại danh sách</button>
                <h2>{tourId ? `Cập nhật Tour: ${formData.tour_name}` : 'Thiết lập Tour mới & Lịch trình vận hành'}</h2>
            </div>

            {/* NAV TABS */}
            <div style={{ display: 'flex', gap: '15px', borderBottom: '2px solid #e2e8f0', marginBottom: '25px' }}>
                <button type="button" onClick={() => setActiveTab('basic')} style={{ padding: '12px 24px', border: 'none', background: activeTab === 'basic' ? '#2D6A4F' : 'transparent', color: activeTab === 'basic' ? '#fff' : '#64748b', fontWeight: 'bold', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '15px' }}>1. 📝 Thông tin chung</button>
                <button type="button" onClick={() => setActiveTab('itinerary')} style={{ padding: '12px 24px', border: 'none', background: activeTab === 'itinerary' ? '#2D6A4F' : 'transparent', color: activeTab === 'itinerary' ? '#fff' : '#64748b', fontWeight: 'bold', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '15px' }}>2. 🗺️ Lịch trình từng ngày ({formData.duration_days} ngày)</button>
                <button type="button" onClick={() => setActiveTab('departures')} style={{ padding: '12px 24px', border: 'none', background: activeTab === 'departures' ? '#2D6A4F' : 'transparent', color: activeTab === 'departures' ? '#fff' : '#64748b', fontWeight: 'bold', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: '15px' }}>3. 📅 Các đợt mở bán ({departures.length} đợt)</button>
            </div>

            <form onSubmit={handleSubmit} className="full-page-form">
                {/* TAB 1: THÔNG TIN CHUNG */}
                {activeTab === 'basic' && (
                    <div className="form-grid">
                        <div className="form-group full-width"><label>Tên Tour *</label><input type="text" name="tour_name" value={formData.tour_name} onChange={handleInputChange} required placeholder="VD: Khám phá Đà Lạt ngàn hoa 3N2Đ" /></div>
                        <div className="form-group"><label>Điểm đến *</label><input type="text" name="destination" value={formData.destination} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Thời gian (Ngày) *</label><input type="number" min="1" max="15" name="duration_days" value={formData.duration_days} onChange={handleDurationChange} required /></div>
                        <div className="form-group"><label>Giá cơ bản (VNĐ) *</label><input type="number" min="0" step="50000" name="base_price" value={formData.base_price} onChange={handleInputChange} required /></div>
                        <div className="form-group"><label>Trạng thái</label><select name="status" value={formData.status} onChange={handleInputChange}><option value="Active">Đang mở (Sẵn sàng nhận khách)</option><option value="Inactive">Đã đóng (Tạm dừng)</option></select></div>
                        <div className="form-group full-width">
                            <label>Hình ảnh Tour</label>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                {previewImage && <img src={previewImage} alt="Preview" style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />}
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: '10px', background: '#fff', border: '1px dashed #cbd5e1', cursor: 'pointer', flex: 1 }} />
                            </div>
                        </div>
                        <div className="form-group full-width"><label>Mô tả chi tiết chuyến đi</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows="5" placeholder="Nhập mô tả hấp dẫn..."></textarea></div>
                    </div>
                )}

                {/* TAB 2: LỊCH TRÌNH VẬN HÀNH */}
                {activeTab === 'itinerary' && (
                    <div style={{ display: 'flex', gap: '25px' }}>
                        <div style={{ flex: '0 0 320px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>📍 Kho Địa Điểm ({formData.destination})</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>Bấm nút +N bên dưới để thêm điểm tham quan vào ngày tương ứng.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto' }}>
                                {allPlaces.map(pl => (
                                    <div key={pl.id} style={{ padding: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 'bold' }}>{pl.type}</div>
                                        <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>{pl.name}</strong>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {itineraryDays.map((_, dIdx) => (
                                                <button key={dIdx} type="button" onClick={() => addPlaceToDay(dIdx, pl)} style={{ padding: '4px 8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>+Ngày {dIdx + 1}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {itineraryDays.map((day, dIdx) => (
                                <div key={day.day_number} style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                        <span style={{ padding: '10px 14px', background: '#2D6A4F', color: '#fff', fontWeight: 'bold', borderRadius: '8px' }}>Ngày {day.day_number}</span>
                                        <input type="text" value={day.title} onChange={e => { const up = [...itineraryDays]; up[dIdx].title = e.target.value; setItineraryDays(up); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
                                    </div>
                                    <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>🚩 Các điểm tham quan ghé thăm:</strong>
                                    {day.places.length === 0 ? <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có điểm đến. Chọn từ kho bên trái.</p> : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {day.places.map((pl, pIdx) => (
                                                <div key={pIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#64748b' }}>#{pIdx + 1}</span>
                                                    <input type="time" value={pl.visit_time || '08:30'} onChange={e => { const up = [...itineraryDays]; up[dIdx].places[pIdx].visit_time = e.target.value; setItineraryDays(up); }} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                                    <span style={{ flex: 1, fontWeight: '600' }}>{pl.place_name}</span>
                                                    <button type="button" onClick={() => removePlaceFromDay(dIdx, pIdx)} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 3: QUẢN LÝ ĐỢT KHỞI HÀNH */}
                {activeTab === 'departures' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>📅 Danh sách các đợt khởi hành mở bán</h3>
                            <button type="button" onClick={addDepartureSlot} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Thêm ngày khởi hành</button>
                        </div>
                        <table className="data-table">
                            <thead><tr><th>Thứ tự</th><th>Ngày Khởi Hành</th><th>Ngày Về Dự Kiến</th><th>Tổng Số Chỗ</th><th>Hành động</th></tr></thead>
                            <tbody>
                                {departures.map((dep, idx) => (
                                    <tr key={idx}>
                                        <td><strong>Đợt #{idx + 1}</strong></td>
                                        <td><input type="date" value={dep.departure_date} onChange={e => { const up = [...departures]; up[idx].departure_date = e.target.value; setDepartures(up); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></td>
                                        <td><input type="date" value={dep.return_date} onChange={e => { const up = [...departures]; up[idx].return_date = e.target.value; setDepartures(up); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></td>
                                        <td><input type="number" value={dep.max_slots} onChange={e => { const up = [...departures]; up[idx].max_slots = Number(e.target.value); setDepartures(up); }} style={{ padding: '8px', width: '100px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /></td>
                                        <td><button type="button" onClick={() => setDepartures(departures.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Xóa</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="form-actions" style={{ marginTop: '30px' }}>
                    <button type="button" className="btn-cancel-lg" onClick={onBack}>Hủy bỏ</button>
                    <button type="submit" className="btn-save-lg" disabled={isSubmitting}>
                        {isSubmitting ? '⏳ Đang lưu...' : '💾 LƯU TOÀN BỘ TOUR & LỊCH TRÌNH'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TourForm;