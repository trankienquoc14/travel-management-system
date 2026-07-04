import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/CustomerTourBuilder.css';
import '../index.css';

const CustomerTourBuilder = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const roleId = Number(localStorage.getItem('roleId')) || JSON.parse(localStorage.getItem('user'))?.role_id;

    const [destinationList, setDestinationList] = useState([]);
    const [availablePlaces, setAvailablePlaces] = useState([]);

    const [hotels, setHotels] = useState([]);
    const [transports, setTransports] = useState([]);

    const [formData, setFormData] = useState({
        destination: '',
        departure_date: '',
        return_date: '',
        budget: ''
    });

    const [participants, setParticipants] = useState({
        adults: 1,
        children: 0
    });

    const [preferences, setPreferences] = useState({
        hotel: '',
        transport: '',
        activities: [],
        note: ''
    });

    const [toursRef, setToursRef] = useState([]);
    const [suggestedPrice, setSuggestedPrice] = useState({ min: 0, max: 0 });

    const totalPlaceCost = preferences.activities.reduce((sum, placeId) => {
        const place = availablePlaces.find(p => p.place_id === placeId);
        return sum + (place ? Number(place.estimated_price) : 0);
    }, 0);

    const selectedHotel = hotels.find(h => h.partner_service_id.toString() === preferences.hotel);
    const hotelCost = selectedHotel ? Number(selectedHotel.price) : 0;

    const selectedTransport = transports.find(t => t.partner_service_id.toString() === preferences.transport);
    const transportCost = selectedTransport ? Number(selectedTransport.price) : 0;

    const totalEstimatedCost = totalPlaceCost + hotelCost + transportCost;

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchReferenceTours = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/tours');
                if (response.data.success) setToursRef(response.data.data);
            } catch (error) { console.error(error); }
        };

        const fetchDestinations = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/destinations');
                if (response.data.success) setDestinationList(response.data.data);
            } catch (error) { console.error("Lỗi tải điểm đến:", error); }
        };

        fetchReferenceTours();
        fetchDestinations();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('roleId');
        navigate('/login');
    };

    const calculateSuggestedBudget = (destinationValue) => {
        if (!destinationValue || destinationValue.trim() === '') {
            setSuggestedPrice({ min: 0, max: 0 });
            return;
        }
        const matchingTours = toursRef.filter(t =>
            (t.destination || '').toLowerCase().includes(destinationValue.toLowerCase()) ||
            (t.tour_name || '').toLowerCase().includes(destinationValue.toLowerCase())
        );

        if (matchingTours.length > 0) {
            const prices = matchingTours.map(t => Number(t.base_price));
            setSuggestedPrice({ min: Math.min(...prices), max: Math.max(...prices) });
        } else {
            setSuggestedPrice({ min: 0, max: 0 });
        }
    };

    const handleDestinationChange = async (e) => {
        const destName = e.target.value;
        setFormData({ ...formData, destination: destName });
        calculateSuggestedBudget(destName);

        const selectedDest = destinationList.find(d => d.destination_name === destName);
        if (selectedDest) {
            try {
                const placeRes = await axios.get(`http://localhost:5000/api/places?destination_id=${selectedDest.destination_id}`);
                if (placeRes.data.success) {
                    setAvailablePlaces(placeRes.data.data);
                }

                const serviceRes = await axios.get(`http://localhost:5000/api/partner-services?destination_id=${selectedDest.destination_id}`);
                if (serviceRes.data.success) {
                    const allServices = serviceRes.data.data;
                    setHotels(allServices.filter(s => s.partner_type === 'Hotel'));
                    setTransports(allServices.filter(s => s.partner_type === 'Transport'));
                }

                setPreferences({ hotel: '', transport: '', activities: [], note: '' });
            } catch (err) { console.error("Lỗi tải dữ liệu theo tỉnh:", err); }
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleParticipantChange = (e) => setParticipants({ ...participants, [e.target.name]: parseInt(e.target.value) || 0 });
    const handlePreferenceChange = (e) => setPreferences({ ...preferences, [e.target.name]: e.target.value });

    const handlePlaceToggle = (placeId) => {
        const currentActivities = [...preferences.activities];
        if (currentActivities.includes(placeId)) {
            setPreferences({ ...preferences, activities: currentActivities.filter(id => id !== placeId) });
        } else {
            setPreferences({ ...preferences, activities: [...currentActivities, placeId] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');

            // Khách sạn được chọn
            const selectedHotelObj = hotels.find(
                h => h.partner_service_id.toString() === preferences.hotel
            );

            // Phương tiện được chọn
            const selectedTransportObj = transports.find(
                t => t.partner_service_id.toString() === preferences.transport
            );

            // Địa điểm tham quan được chọn
            const selectedPlaceObjs = availablePlaces.filter(p =>
                preferences.activities.includes(p.place_id)
            );

            const payload = {
                ...formData,
                people_count: participants.adults + participants.children,

                preferences: {
                    ...preferences,

                    // Thông tin số lượng khách
                    participantBreakdown: {
                        adults: participants.adults,
                        children: participants.children
                    },

                    // Khách sạn
                    hotelName: selectedHotelObj
                        ? `${selectedHotelObj.partner_name} - ${selectedHotelObj.service_name}`
                        : 'Không chọn',

                    hotelPrice: selectedHotelObj
                        ? Number(selectedHotelObj.price)
                        : 0,

                    // Phương tiện
                    transportName: selectedTransportObj
                        ? `${selectedTransportObj.partner_name} - ${selectedTransportObj.service_name}`
                        : 'Không chọn',

                    transportPrice: selectedTransportObj
                        ? Number(selectedTransportObj.price)
                        : 0,

                    // Danh sách địa điểm
                    selectedPlaces: selectedPlaceObjs.map(place => ({
                        name: place.place_name,
                        price: Number(place.estimated_price || 0)
                    })),

                    note: preferences.note
                }
            };

            console.log("Payload gửi lên:");
            console.log(payload);

            await axios.post(
                'http://localhost:5000/api/custom-tours/request',
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Đã gửi yêu cầu thành công!");
            navigate('/my-bookings');

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Không thể gửi yêu cầu");
        }
    };

    const formatMoney = (amount) => amount.toLocaleString('vi-VN');

    return (
        <div className="homepage-container" style={{ backgroundColor: '#f1f5f9' }}>
            {/* ================= HEADER ĐỒNG BỘ ================= */}
            <nav className="home-navbar">
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>
                <ul className="home-menu">
                    <li onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>Khám phá</li>
                    <li onClick={() => navigate('/my-bookings')} style={{ cursor: 'pointer' }}>Đơn hàng của tôi</li>
                    <li className="active">
                        <Link to="/build-tour" className="menu-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                            Tự thiết kế Tour
                        </Link>
                    </li>
                    <li>Khuyến mãi</li>
                </ul>
                <div className="home-user-actions">
                    {user ? (
                        <>
                            <div className="user-info">
                                <div className="user-avatar">{user.fullName.charAt(0)}</div>
                                <span>{user.fullName}</span>
                            </div>
                            <button onClick={handleLogout} className="btn-outline">Đăng xuất</button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} className="btn-primary">Đăng nhập</button>
                    )}
                </div>
            </nav>

            {/* ================= NỘI DUNG FORM ================= */}
            <div className="builder-page-wrapper">
                <div className="builder-container">
                    <div className="builder-header">
                        <h2>Tự Thiết Kế Tour Mang Đậm Chất Riêng</h2>
                        <p>Hãy kể cho chúng tôi nghe về chuyến đi trong mơ của bạn. TravelERP sẽ biến nó thành sự thật!</p>
                    </div>

                    <form onSubmit={handleSubmit} className="builder-form">

                        {/* PHẦN 1: THÔNG TIN CHUYẾN ĐI (Bố cục 12 cột) */}
                        <div className="builder-section section-info">
                            <h3>1. Thông tin chuyến đi</h3>
                            <div className="trip-info-grid">

                                <div className="form-group field-full">
                                    <label>Điểm đến mong muốn *</label>
                                    <select name="destination" required onChange={handleDestinationChange} value={formData.destination} style={{ cursor: 'pointer' }}>
                                        <option value="" disabled>-- Hãy chọn một điểm đến mong muốn của bạn --</option>
                                        {destinationList.map((dest) => (
                                            <option key={dest.destination_id} value={dest.destination_name}>
                                                {dest.destination_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group field-third">
                                    <label>Ngân sách (VNĐ/người) *</label>
                                    <input type="number" name="budget" required onChange={handleInputChange} placeholder="VD: 5000000" />
                                    {suggestedPrice.min > 0 && (
                                        <small className="price-hint">Gợi ý từ hệ thống: {formatMoney(suggestedPrice.min)}đ - {formatMoney(suggestedPrice.max)}đ</small>
                                    )}
                                </div>
                                <div className="form-group field-third">
                                    <label>Ngày đi *</label>
                                    <input type="date" name="departure_date" required onChange={handleInputChange} />
                                </div>
                                <div className="form-group field-third">
                                    <label>Ngày về *</label>
                                    <input type="date" name="return_date" required onChange={handleInputChange} />
                                </div>

                                <div className="form-group field-half">
                                    <label>Người lớn (≥ 12 tuổi) *</label>
                                    <input type="number" name="adults" min="1" value={participants.adults} required onChange={handleParticipantChange} />
                                </div>
                                <div className="form-group field-half">
                                    <label>Trẻ em (&lt; 12 tuổi)</label>
                                    <input type="number" name="children" min="0" value={participants.children} onChange={handleParticipantChange} />
                                </div>
                            </div>
                        </div>

                        {/* PHẦN 2: DỊCH VỤ LÕI */}
                        <div className="builder-section section-prefs">
                            <h3>2. Dịch vụ Lõi (Lưu trú & Di chuyển)</h3>
                            <div className="form-grid-multi" style={{ display: 'block' }}>

                                {/* KHU VỰC KHÁCH SẠN */}
                                <div className="form-group full-width">
                                    <label>Chọn Khách sạn / Lưu trú:</label>
                                    <div className="service-cards-container">
                                        <label className={`service-card ${preferences.hotel === '' ? 'selected' : ''}`}>
                                            <input type="radio" name="hotel" value="" onChange={handlePreferenceChange} hidden />
                                            <div className="card-image-wrapper" style={{ background: '#e2e8f0' }}>
                                                {/* Ảnh mặc định trống trơn, chuyên nghiệp */}
                                            </div>
                                            <div className="card-body">
                                                <div className="card-header">
                                                    <div className="card-info">
                                                        <strong>Để công ty tự sắp xếp</strong>
                                                        <span className="sub-text">Tối ưu theo ngân sách</span>
                                                    </div>
                                                </div>
                                                <div className="card-footer">
                                                    <div className="price-tag" style={{ background: '#f1f5f9', color: '#475569' }}>Linh hoạt</div>
                                                    <span className="status-text">{preferences.hotel === '' ? 'Đang chọn' : 'Tùy chọn'}</span>
                                                </div>
                                            </div>
                                        </label>

                                        {hotels.map(h => (
                                            <label key={h.partner_service_id} className={`service-card ${preferences.hotel === h.partner_service_id.toString() ? 'selected' : ''}`}>
                                                <input type="radio" name="hotel" value={h.partner_service_id} onChange={handlePreferenceChange} hidden />
                                                <div className="card-image-wrapper">
                                                    {h.image_url ? (
                                                        <img src={`http://localhost:5000${h.image_url}`} alt={h.partner_name} className="card-cover-img" />
                                                    ) : (
                                                        <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Chưa cập nhật ảnh</div>
                                                    )}
                                                </div>
                                                <div className="card-body">
                                                    <div className="card-header">
                                                        <div className="card-info">
                                                            <strong>{h.partner_name}</strong>
                                                            <span className="sub-text">{h.service_name}</span>
                                                        </div>
                                                    </div>
                                                    <div className="card-footer">
                                                        <div className="price-tag">+{formatMoney(Number(h.price))}đ</div>
                                                        <span className="status-text">{preferences.hotel === h.partner_service_id.toString() ? 'Đã chọn' : 'Tùy chọn'}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* KHU VỰC PHƯƠNG TIỆN DI CHUYỂN */}
                                <div className="form-group full-width" style={{ marginTop: '20px' }}>
                                    <label>Chọn Phương tiện di chuyển:</label>
                                    <div className="service-cards-container">
                                        <label className={`service-card ${preferences.transport === '' ? 'selected' : ''}`}>
                                            <input type="radio" name="transport" value="" onChange={handlePreferenceChange} hidden />
                                            <div className="card-image-wrapper" style={{ background: '#e2e8f0' }}></div>
                                            <div className="card-body">
                                                <div className="card-header">
                                                    <div className="card-info">
                                                        <strong>Để công ty tự sắp xếp</strong>
                                                        <span className="sub-text">Tối ưu lộ trình nhất</span>
                                                    </div>
                                                </div>
                                                <div className="card-footer">
                                                    <div className="price-tag" style={{ background: '#f1f5f9', color: '#475569' }}>Linh hoạt</div>
                                                    <span className="status-text">{preferences.transport === '' ? 'Đang chọn' : 'Tùy chọn'}</span>
                                                </div>
                                            </div>
                                        </label>

                                        {transports.map(t => (
                                            <label key={t.partner_service_id} className={`service-card ${preferences.transport === t.partner_service_id.toString() ? 'selected' : ''}`}>
                                                <input type="radio" name="transport" value={t.partner_service_id} onChange={handlePreferenceChange} hidden />
                                                <div className="card-image-wrapper">
                                                    {t.image_url ? (
                                                        <img src={`http://localhost:5000${t.image_url}`} alt={t.partner_name} className="card-cover-img" />
                                                    ) : (
                                                        <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Chưa cập nhật ảnh</div>
                                                    )}
                                                </div>
                                                <div className="card-body">
                                                    <div className="card-header">
                                                        <div className="card-info">
                                                            <strong>{t.partner_name}</strong>
                                                            <span className="sub-text">{t.service_name}</span>
                                                        </div>
                                                    </div>
                                                    <div className="card-footer">
                                                        <div className="price-tag">+{formatMoney(Number(t.price))}đ</div>
                                                        <span className="status-text">{preferences.transport === t.partner_service_id.toString() ? 'Đã chọn' : 'Tùy chọn'}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PHẦN 3: TÙY CHỌN ĐỊA ĐIỂM THAM QUAN */}
                        <div className="builder-section section-prefs" style={{ borderLeft: '5px solid #10b981' }}>
                            <h3>3. Tùy chọn Địa điểm Tham quan</h3>
                            <div className="form-group full-width">
                                {availablePlaces.length === 0 ? (
                                    <div style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b' }}>
                                        Vui lòng chọn Điểm đến ở phía trên để hệ thống gợi ý các địa điểm tham quan.
                                    </div>
                                ) : (
                                    <>
                                        <div className="checkbox-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                            {availablePlaces.map(place => {
                                                const isSelected = preferences.activities.includes(place.place_id);
                                                return (
                                                    <label key={place.place_id} className={`checkbox-card ${isSelected ? 'active' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: '80px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
                                                            {/* Đã thay đổi emoji bằng Checkbox chuẩn HTML để nhìn sang trọng hơn */}
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handlePlaceToggle(place.place_id)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                            <strong style={{ flex: 1 }}>{place.place_name}</strong>
                                                        </div>
                                                        {/* THAY BẰNG ĐOẠN CODE MỚI NÀY: */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px', marginTop: '6px' }}>
                                                            <span style={{ fontSize: '13px', color: isSelected ? '#5b21b6' : '#64748b' }}>
                                                                {place.category}
                                                            </span>
                                                            {Number(place.estimated_price) > 0 ? (
                                                                <span className="place-price-tag">+{formatMoney(Number(place.estimated_price))}đ</span>
                                                            ) : (
                                                                <span className="place-price-tag free">Miễn phí</span>
                                                            )}
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>

                                        {/* BÁO GIÁ NHÁP THÔNG MINH */}
                                        {totalEstimatedCost > 0 && (
                                            <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#1e293b', fontSize: '16px' }}>
                                                <strong>Tạm tính chi phí dịch vụ cơ bản:</strong> <span style={{ fontSize: '20px', color: '#dc2626', fontWeight: '700' }}>{formatMoney(totalEstimatedCost)} VNĐ</span> / người <br />
                                                <small style={{ color: '#64748b', fontWeight: 'normal', display: 'block', marginTop: '5px' }}>(*Chi phí này mang tính chất tham khảo, chưa bao gồm phí điều hành của công ty và hướng dẫn viên)</small>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="form-group" style={{ marginTop: '25px' }}>
                                <label>Ghi chú thêm (Yêu cầu đặc biệt, hỗ trợ xe lăn, suất ăn chay...):</label>
                                <textarea name="note" rows="3" onChange={handlePreferenceChange} placeholder="Nhập ghi chú của bạn tại đây..."></textarea>
                            </div>
                        </div>

                        <button type="submit" className="btn-submit-builder">Gửi Yêu Cầu & Nhận Báo Giá</button>
                    </form>
                </div>
            </div>

            {/* ================= FOOTER ĐỒNG BỘ ================= */}
            <footer className="home-footer">
                <div className="footer-bottom">
                    <p>© 2026 TravelERP System. Tự hào đồng hành cùng bạn.</p>
                </div>
            </footer>
        </div>
    );
};

export default CustomerTourBuilder;