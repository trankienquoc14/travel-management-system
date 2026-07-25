import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/CustomerTourBuilder.css';
import '../index.css';
import { 
    MapPin as FiMapPin, Calendar as FiCalendar, Users as FiUsers, DollarSign as FiDollarSign, 
    CheckCircle as FiCheckCircle, ChevronRight as FiChevronRight, ChevronLeft as FiChevronLeft,
    Home as FiHome, Truck as FiTruck, Coffee as FiCoffee, Camera as FiCamera, Edit as FiEdit3
} from 'lucide-react';

const CustomerTourBuilder = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const roleId = Number(localStorage.getItem('roleId')) || JSON.parse(localStorage.getItem('user'))?.role_id;

    // Data lists
    const [destinationList, setDestinationList] = useState([]);
    const [availablePlaces, setAvailablePlaces] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [transports, setTransports] = useState([]);
    const [toursRef, setToursRef] = useState([]);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    // Form Data
    const [formData, setFormData] = useState({
        destination: '',
        pickup_location: '',
        departure_date: '',
        duration_days: 3,
        budget_estimate: ''
    });

    const [participants, setParticipants] = useState({ adults: 1, children: 0 });

    const [preferences, setPreferences] = useState({
        hotel: '',
        transport: '',
        activities: [],
        note: ''
    });

    const [suggestedPrice, setSuggestedPrice] = useState({ min: 0, max: 0 });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);

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

    // Calculate Costs
    const totalPlaceCost = preferences.activities.reduce((sum, placeId) => {
        const place = availablePlaces.find(p => p.place_id === placeId);
        return sum + (place ? Number(place.estimated_price) : 0);
    }, 0);

    const selectedHotel = hotels.find(h => h.partner_service_id.toString() === preferences.hotel);
    const hotelCost = selectedHotel ? Number(selectedHotel.price) : 0;

    const selectedTransport = transports.find(t => t.partner_service_id.toString() === preferences.transport);
    const transportCost = selectedTransport ? Number(selectedTransport.price) : 0;

    const totalEstimatedCost = totalPlaceCost + hotelCost + transportCost;

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleDestinationChange = async (destName) => {
        setFormData({ ...formData, destination: destName });
        const selectedDest = destinationList.find(d => d.destination_name === destName);
        
        if (selectedDest) {
            // Update suggested price
            const matchingTours = toursRef.filter(t => 
                t.destination.toLowerCase().includes(destName.toLowerCase()) || 
                destName.toLowerCase().includes(t.destination.toLowerCase())
            );
            if (matchingTours.length > 0) {
                const prices = matchingTours.map(t => Number(t.base_price));
                setSuggestedPrice({ min: Math.min(...prices), max: Math.max(...prices) });
            } else {
                setSuggestedPrice({ min: 0, max: 0 });
            }

            // Fetch Places & Services
            try {
                const placeRes = await axios.get(`http://localhost:5000/api/places?destination_id=${selectedDest.destination_id}`);
                if (placeRes.data.success) setAvailablePlaces(placeRes.data.data);

                const serviceRes = await axios.get(`http://localhost:5000/api/services`);
                if (serviceRes.data.success) {
                    const allServices = serviceRes.data.data.map(s => ({ ...s, partner_service_id: s.service_id, price: s.base_cost }));
                    setHotels(allServices.filter(s => s.service_type === 'Khách sạn' && (s.destination_id === selectedDest.destination_id || s.destination_id === null)));
                    setTransports(allServices.filter(s => (s.service_type === 'Xe vận chuyển' || s.service_type === 'Vé máy bay') && (s.destination_id === selectedDest.destination_id || s.destination_id === null)));
                }

                // Reset selections when destination changes
                setPreferences({ hotel: '', transport: '', activities: [], note: '' });
            } catch (err) { console.error("Lỗi tải dữ liệu theo tỉnh:", err); }
        }
    };

    const handlePlaceToggle = (placeId) => {
        const currentActivities = preferences.activities;
        if (currentActivities.includes(placeId)) {
            setPreferences({ ...preferences, activities: currentActivities.filter(id => id !== placeId) });
        } else {
            setPreferences({ ...preferences, activities: [...currentActivities, placeId] });
        }
    };

    const formatMoney = (amount) => amount.toLocaleString('vi-VN');

    // Validation & Navigation
    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.destination) return alert("Vui lòng chọn Điểm đến mong muốn!");
            if (!formData.pickup_location) return alert("Vui lòng chọn hoặc nhập Điểm đón khách!");
            if (!formData.departure_date) return alert("Vui lòng chọn ngày khởi hành!");
            if (!formData.budget_estimate) return alert("Vui lòng nhập ngân sách ước tính!");
        }
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const selectedPlaceObjs = availablePlaces.filter(p => preferences.activities.includes(p.place_id));

            let retDate = '';
            if (formData.departure_date) {
                const depDateObj = new Date(formData.departure_date);
                depDateObj.setDate(depDateObj.getDate() + (formData.duration_days - 1));
                retDate = depDateObj.toISOString().split('T')[0];
            }

            const payload = {
                destination: formData.destination,
                departure_date: formData.departure_date,
                return_date: retDate,
                people_count: participants.adults + participants.children,
                budget: Number(formData.budget_estimate),
                
                preferences: {
                    ...preferences,
                    pickup_location: formData.pickup_location,
                    participantBreakdown: participants,
                    hotelName: selectedHotel ? `${selectedHotel.partner_name || 'Hệ thống'} - ${selectedHotel.service_name}` : 'Không chọn',
                    hotelPrice: hotelCost,
                    transportName: selectedTransport ? `${selectedTransport.partner_name || 'Hệ thống'} - ${selectedTransport.service_name}` : 'Không chọn',
                    transportPrice: transportCost,
                    selectedPlaces: selectedPlaceObjs.map(place => ({
                        name: place.place_name,
                        price: Number(place.estimated_price || 0)
                    })),
                    note: preferences.note
                }
            };

            await axios.post('http://localhost:5000/api/custom-tours/request', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("🎉 Đã gửi yêu cầu thành công! Chuyên viên của chúng tôi sẽ liên hệ sớm nhất.");
            navigate('/my-bookings');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Không thể gửi yêu cầu");
        }
    };

    // --- Render Helpers ---

    const renderStepper = () => (
        <div className="wizard-stepper">
            {['Khởi tạo', 'Dịch vụ', 'Trải nghiệm', 'Hoàn tất'].map((stepName, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;
                return (
                    <div key={stepNum} className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                        <div className="step-circle">{isCompleted ? <FiCheckCircle /> : stepNum}</div>
                        <div className="step-label">{stepName}</div>
                        {stepNum < totalSteps && <div className="step-line"></div>}
                    </div>
                );
            })}
        </div>
    );

    const renderStep1 = () => (
        <div className="wizard-step step-1 slide-in-right">
            <h3 className="step-title">Khởi tạo Hành trình</h3>
            <p className="step-desc">Lựa chọn những thông tin cơ bản nhất cho chuyến đi của bạn.</p>

            <div className="input-grid">
                <div className="form-group field-full">
                    <label><FiMapPin /> Điểm đến mong muốn *</label>
                    <div className="custom-select-wrapper">
                        <select required value={formData.destination} onChange={(e) => handleDestinationChange(e.target.value)}>
                            <option value="" disabled>-- Chọn tỉnh / thành phố --</option>
                            {destinationList.map(dest => (
                                <option key={dest.destination_id} value={dest.destination_name}>{dest.destination_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group field-full">
                    <label><FiMapPin /> Điểm đón khách *</label>
                    <input 
                        type="text" 
                        placeholder="Nhập địa chỉ hoặc sân bay đón khách (VD: Sân bay Tân Sơn Nhất, TPHCM)" 
                        value={formData.pickup_location} 
                        onChange={(e) => setFormData({...formData, pickup_location: e.target.value})} 
                    />
                </div>

                <div className="form-group field-half">
                    <label><FiCalendar /> Ngày khởi hành *</label>
                    <input type="date" value={formData.departure_date} onChange={(e) => setFormData({...formData, departure_date: e.target.value})} />
                </div>
                
                <div className="form-group field-half">
                    <label><FiCalendar /> Thời gian đi (Số ngày) *</label>
                    <div className="pax-counter-container" style={{ gap: 0 }}>
                        <div className="pax-item" style={{ padding: '10px 15px' }}>
                            <span className="pax-label">Số ngày</span>
                            <div className="counter-controls">
                                <button type="button" onClick={() => setFormData(f => ({...f, duration_days: Math.max(1, f.duration_days - 1)}))}>-</button>
                                <span style={{ width: '30px' }}>{formData.duration_days}</span>
                                <button type="button" onClick={() => setFormData(f => ({...f, duration_days: f.duration_days + 1}))}>+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group field-full">
                    <label><FiUsers /> Hành khách *</label>
                    <div className="pax-counter-container">
                        <div className="pax-item">
                            <span className="pax-label">Người lớn <span>(≥ 12 tuổi)</span></span>
                            <div className="counter-controls">
                                <button type="button" onClick={() => setParticipants(p => ({...p, adults: Math.max(1, p.adults - 1)}))}>-</button>
                                <span>{participants.adults}</span>
                                <button type="button" onClick={() => setParticipants(p => ({...p, adults: p.adults + 1}))}>+</button>
                            </div>
                        </div>
                        <div className="pax-item">
                            <span className="pax-label">Trẻ em <span>(&lt; 12 tuổi)</span></span>
                            <div className="counter-controls">
                                <button type="button" onClick={() => setParticipants(p => ({...p, children: Math.max(0, p.children - 1)}))}>-</button>
                                <span>{participants.children}</span>
                                <button type="button" onClick={() => setParticipants(p => ({...p, children: p.children + 1}))}>+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group field-full">
                    <label><FiDollarSign /> Ngân sách ước tính (trên 1 người) *</label>
                    {suggestedPrice.min > 0 && (
                        <div className="price-hint-badge">💡 Gợi ý hệ thống: {formatMoney(suggestedPrice.min)}đ - {formatMoney(suggestedPrice.max)}đ</div>
                    )}
                    <input 
                        type="number" 
                        placeholder="Nhập số tiền bạn dự kiến chi trả cho 1 người (VD: 5000000)" 
                        value={formData.budget_estimate} 
                        onChange={(e) => setFormData({...formData, budget_estimate: e.target.value})} 
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="wizard-step step-2 slide-in-right">
            <h3 className="step-title">Dịch vụ Lưu trú & Di chuyển</h3>
            <p className="step-desc">Bạn có thể chọn dịch vụ yêu thích hoặc bỏ qua để chuyên viên tự tư vấn.</p>

            <div className="service-section">
                <h4 className="section-subtitle"><FiHome /> Khách sạn & Lưu trú</h4>
                {hotels.length === 0 ? <p className="empty-text">Chưa có dữ liệu khách sạn cho điểm đến này.</p> : (
                    <div className="service-cards-horizontal">
                        {hotels.map(h => (
                            <div key={h.partner_service_id} className={`service-sel-card ${preferences.hotel === h.partner_service_id.toString() ? 'selected' : ''}`} onClick={() => setPreferences({...preferences, hotel: preferences.hotel === h.partner_service_id.toString() ? '' : h.partner_service_id.toString()})}>
                                <div className="img-wrapper">
                                    {h.image_url ? <img src={`http://localhost:5000${h.image_url}`} alt={h.service_name} /> : <div className="no-img">Không ảnh</div>}
                                    {preferences.hotel === h.partner_service_id.toString() && <div className="check-badge"><FiCheckCircle /></div>}
                                </div>
                                <div className="card-info">
                                    <strong>{h.service_name}</strong>
                                    <span className="vendor">{h.partner_name || 'Hệ thống'}</span>
                                    <span className="price">+{formatMoney(Number(h.price))}đ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="service-section mt-4">
                <h4 className="section-subtitle"><FiTruck /> Phương tiện Di chuyển</h4>
                {transports.length === 0 ? <p className="empty-text">Chưa có dữ liệu xe/máy bay cho điểm đến này.</p> : (
                    <div className="service-cards-horizontal">
                        {transports.map(t => (
                            <div key={t.partner_service_id} className={`service-sel-card ${preferences.transport === t.partner_service_id.toString() ? 'selected' : ''}`} onClick={() => setPreferences({...preferences, transport: preferences.transport === t.partner_service_id.toString() ? '' : t.partner_service_id.toString()})}>
                                <div className="img-wrapper">
                                    {t.image_url ? <img src={`http://localhost:5000${t.image_url}`} alt={t.service_name} /> : <div className="no-img">Không ảnh</div>}
                                    {preferences.transport === t.partner_service_id.toString() && <div className="check-badge"><FiCheckCircle /></div>}
                                </div>
                                <div className="card-info">
                                    <strong>{t.service_name}</strong>
                                    <span className="vendor">{t.partner_name || 'Hệ thống'}</span>
                                    <span className="price">+{formatMoney(Number(t.price))}đ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="wizard-step step-3 slide-in-right">
            <h3 className="step-title">Trải nghiệm & Hoạt động</h3>
            <p className="step-desc">Chọn các địa điểm tham quan mà bạn muốn ghé thăm.</p>

            {availablePlaces.length === 0 ? (
                <div className="empty-state-box">
                    Vui lòng chọn Điểm đến ở bước 1 để hiển thị danh sách địa điểm.
                </div>
            ) : (
                <div className="activities-grid">
                    {availablePlaces.map(place => {
                        const isSelected = preferences.activities.includes(place.place_id);
                        return (
                            <div key={place.place_id} className={`activity-chip-card ${isSelected ? 'selected' : ''}`} onClick={() => handlePlaceToggle(place.place_id)}>
                                <div className="chip-content">
                                    <div className="chip-icon">{isSelected ? <FiCheckCircle color="#10b981" /> : <FiCamera color="#64748b" />}</div>
                                    <div className="chip-text">
                                        <strong>{place.place_name}</strong>
                                        <div className="chip-meta">
                                            <span>{place.category}</span>
                                            <span className={`chip-price ${Number(place.estimated_price) > 0 ? '' : 'free'}`}>
                                                {Number(place.estimated_price) > 0 ? `+${formatMoney(Number(place.estimated_price))}đ` : 'Miễn phí'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );

    const renderStep4 = () => (
        <div className="wizard-step step-4 slide-in-right">
            <h3 className="step-title">Tổng kết & Gửi Yêu Cầu</h3>
            <p className="step-desc">Kiểm tra lại thông tin và để lại lời nhắn cho chuyên viên tư vấn.</p>

            <div className="summary-box">
                <div className="summary-row">
                    <span className="s-label">Hành trình:</span>
                    <span className="s-val">{formData.pickup_location} → <strong>{formData.destination}</strong></span>
                </div>
                <div className="summary-row">
                    <span className="s-label">Thời gian:</span>
                    <span className="s-val">{formData.departure_date} ({formData.duration_days} ngày)</span>
                </div>
                <div className="summary-row">
                    <span className="s-label">Hành khách:</span>
                    <span className="s-val">{participants.adults} Người lớn, {participants.children} Trẻ em</span>
                </div>
                <hr className="divider" />
                <div className="summary-row">
                    <span className="s-label">Lưu trú:</span>
                    <span className="s-val">{selectedHotel ? selectedHotel.service_name : <i>(Để trống - Nhờ tư vấn)</i>}</span>
                </div>
                <div className="summary-row">
                    <span className="s-label">Di chuyển:</span>
                    <span className="s-val">{selectedTransport ? selectedTransport.service_name : <i>(Để trống - Nhờ tư vấn)</i>}</span>
                </div>
                <div className="summary-row">
                    <span className="s-label">Hoạt động:</span>
                    <span className="s-val">{preferences.activities.length} địa điểm đã chọn</span>
                </div>
                <div className="summary-total">
                    <span>Tạm tính Dịch vụ cơ bản:</span>
                    <strong className="total-val">{formatMoney(totalEstimatedCost)} VNĐ / khách</strong>
                </div>
            </div>

            <div className="form-group mt-4">
                <label><FiEdit3 /> Ghi chú yêu cầu đặc biệt (Ăn chay, hỗ trợ xe lăn,...)</label>
                <textarea 
                    rows="4" 
                    placeholder="Hãy chia sẻ thêm về mong muốn của bạn..." 
                    value={preferences.note}
                    onChange={(e) => setPreferences({...preferences, note: e.target.value})}
                    className="premium-textarea"
                />
            </div>
        </div>
    );

    return (
        <div className="homepage-container">
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
                </ul>
                <div className="home-user-actions">
                    {user ? (
                        <>
                            <div className="user-info">
                                <div className="user-avatar">{user.fullName?.charAt(0) || 'U'}</div>
                                <span>{user.fullName}</span>
                            </div>
                            <button onClick={handleLogout} className="btn-outline">Đăng xuất</button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} className="btn-primary">Đăng nhập</button>
                    )}
                </div>
            </nav>

            <div className="wizard-page-wrapper">
                <div className="wizard-container">
                    <div className="wizard-header">
                        <h2>Thiết Kế Chuyến Đi Trong Mơ</h2>
                        <p>Cá nhân hóa trải nghiệm du lịch theo đúng gu của bạn</p>
                    </div>

                    {renderStepper()}

                    <div className="wizard-body">
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                        {currentStep === 4 && renderStep4()}
                    </div>

                    <div className="wizard-footer">
                        {currentStep > 1 ? (
                            <button className="btn-back" onClick={prevStep}><FiChevronLeft /> Quay lại</button>
                        ) : <div></div>}
                        
                        {currentStep < totalSteps ? (
                            <button className="btn-next" onClick={nextStep}>Tiếp tục <FiChevronRight /></button>
                        ) : (
                            <button className="btn-submit-glow" onClick={handleSubmit}>Hoàn Tất & Gửi Yêu Cầu</button>
                        )}
                    </div>
                </div>
            </div>
            
            <footer className="home-footer mt-auto">
                <div className="footer-bottom">
                    <p>© 2026 TravelERP System. Tự hào đồng hành cùng bạn.</p>
                </div>
            </footer>
        </div>
    );
};

export default CustomerTourBuilder;
