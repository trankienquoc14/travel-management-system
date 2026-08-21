import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, CheckCircle, ChevronRight, User, Phone, Mail, MapPin, Tag, MessageSquare, ShieldCheck, ChevronDown, Check } from 'lucide-react';

const BookingForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const bookingData = location.state;

    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Contact info
    const [contactInfo, setContactInfo] = useState({
        fullName: '', phone: '', email: '', address: '', notes: ''
    });

    // Payment method
    const [paymentMethod, setPaymentMethod] = useState('VNPAY_QR');
    
    // Privacy consent
    const [privacyConsent, setPrivacyConsent] = useState(false);

    // Passenger quantities
    const [pax, setPax] = useState({
        adults: bookingData?.numPeople || 1,
        children: 0,
        toddlers: 0,
        infants: 0
    });
    
    // Expanded sections
    const [expandedSections, setExpandedSections] = useState({
        transport: true,
        price: true
    });

    useEffect(() => {
        if (!bookingData) {
            navigate('/home');
            return;
        }
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setContactInfo(prev => ({
                ...prev,
                fullName: parsedUser.fullName || '',
                email: parsedUser.email || '',
                phone: parsedUser.phone || ''
            }));
        }
    }, [navigate, bookingData]);

    if (!bookingData) return null;

    const isCustom = bookingData.isCustomTour;
    const quote = bookingData.quoteData;
    const tour = bookingData.tour;
    const selDep = bookingData.selectedDeparture; // Might be passed from TourDetail? Actually let's just use what's available.

    const title = isCustom ? \`✨ Tour thiết kế riêng: \${quote.destination}\` : tour?.tour_name;
    const basePrice = isCustom ? (quote.quoted_price || quote.quote_price) : tour?.base_price;
    const bgImage = isCustom
        ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600'
        : (tour?.image_url || 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=500');

    // Calculate Prices
    const adultPrice = basePrice || 0;
    const childPrice = isCustom ? adultPrice : adultPrice * 0.75;
    const toddlerPrice = isCustom ? adultPrice : adultPrice * 0.5;
    const infantPrice = 0;

    const totalPax = pax.adults + pax.children + pax.toddlers + pax.infants;
    const totalAmount = (pax.adults * adultPrice) + (pax.children * childPrice) + (pax.toddlers * toddlerPrice) + (pax.infants * infantPrice);

    const handleInputChange = (e) => {
        setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
    };

    const updatePax = (type, delta) => {
        setPax(prev => {
            const newVal = prev[type] + delta;
            // Prevent going below 0, and ensure at least 1 adult
            if (newVal < 0) return prev;
            if (type === 'adults' && newVal < 1) return prev;
            return { ...prev, [type]: newVal };
        });
    };

    const toggleSection = (sec) => {
        setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';

    const submitBooking = async (e) => {
        e.preventDefault();
        if (!privacyConsent) {
            alert('Vui lòng đồng ý với chính sách bảo vệ dữ liệu cá nhân!');
            return;
        }
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        try {
            if (isCustom) {
                const response = await axios.post(
                    \`http://localhost:5000/api/custom-tours/quotes/\${quote.quote_id}/book\`,
                    { payment_method: paymentMethod, notes: contactInfo.notes },
                    { headers: { Authorization: \`Bearer \${token}\` } }
                );
                if (response.data.success) {
                    alert(paymentMethod === 'Cash' 
                        ? '💵 Đặt tour thành công! Vui lòng đến văn phòng TravelERP để thanh toán tiền mặt.' 
                        : '📸 Đặt tour thành công! Hệ thống chuyển sang trang Đơn Hàng để bạn quét mã QR thanh toán.');
                    navigate('/my-bookings');
                }
            } else {
                const response = await axios.post('http://localhost:5000/api/bookings', {
                    departure_id: bookingData.departureId,
                    num_people: totalPax, // Gửi tổng số người xuống backend
                    total_amount: totalAmount,
                    payment_method: paymentMethod,
                    notes: contactInfo.notes
                }, { headers: { Authorization: \`Bearer \${token}\` } });

                if (response.data.success) {
                    alert(paymentMethod === 'Cash' 
                        ? '💵 Đặt tour thành công! Vui lòng đến văn phòng TravelERP để thanh toán tiền mặt.' 
                        : '📸 Đặt tour thành công! Chuyển sang trang Đơn Hàng để quét mã QR.');
                    navigate('/my-bookings');
                }
            }
        } catch (error) {
            alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', paddingBottom: '60px', fontFamily: '"Inter", sans-serif' }}>
            {/* Navbar / Header */}
            <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
                <div onClick={() => navigate('/home')} style={{ cursor: 'pointer', fontSize: '24px', fontWeight: 'bold' }}>
                    <span style={{ color: '#0f172a' }}>Travel</span><span style={{ color: '#dc2626' }}>ERP</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1d4ed8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</div>
                        <span>Nhập thông tin</span>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</div>
                        <span>Thanh toán</span>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</div>
                        <span>Hoàn tất</span>
                    </div>
                </div>

                {!user && (
                    <button onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                        <User size={16} /> Đăng nhập
                    </button>
                )}
                {user && <div style={{ width: '100px' }}></div>} {/* Spacer */}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                
                {/* Cột trái: Form nhập liệu */}
                <div style={{ flex: '1' }}>
                    <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '8px' }}>Đặt tour của bạn</h1>
                    <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px' }}>Hãy đảm bảo tất cả thông tin chi tiết trên trang này đã chính xác trước khi tiến hành thanh toán.</p>

                    {/* Khối Thông tin liên lạc */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '20px' }}>Thông tin liên lạc</h2>
                        
                        {!user && (
                            <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <User size={18} color="#1d4ed8" />
                                <span style={{ fontSize: '14px', color: '#1e40af' }}>
                                    <strong style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Đăng nhập</strong> để nhận ưu đãi, tích điểm và quản lý đơn hàng dễ dàng hơn!
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Họ tên <span style={{color: '#dc2626'}}>*</span></label>
                                <input type="text" name="fullName" value={contactInfo.fullName} onChange={handleInputChange} required style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none' }} placeholder="VD: Nguyễn Văn A" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Số điện thoại <span style={{color: '#dc2626'}}>*</span></label>
                                <input type="tel" name="phone" value={contactInfo.phone} onChange={handleInputChange} required style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none' }} placeholder="VD: 0901234567" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Email <span style={{color: '#dc2626'}}>*</span></label>
                                <input type="email" name="email" value={contactInfo.email} onChange={handleInputChange} required style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none' }} placeholder="VD: example@mail.com" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Địa chỉ</label>
                                <input type="text" name="address" value={contactInfo.address} onChange={handleInputChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none' }} placeholder="Số nhà, đường, quận/huyện..." />
                            </div>
                        </div>
                    </div>

                    {/* Khối Hành khách (Số lượng) */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '20px' }}>Hành khách</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Người lớn */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Người lớn</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Từ 12 tuổi trở lên</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => updatePax('adults', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontSize: '16px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{pax.adults}</span>
                                    <button onClick={() => updatePax('adults', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>
                            
                            {/* Trẻ em */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Trẻ em</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Từ 5 - 11 tuổi</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => updatePax('children', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontSize: '16px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{pax.children}</span>
                                    <button onClick={() => updatePax('children', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>
                            
                            {/* Trẻ nhỏ */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Trẻ nhỏ</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Từ 2 - 4 tuổi</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => updatePax('toddlers', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontSize: '16px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{pax.toddlers}</span>
                                    <button onClick={() => updatePax('toddlers', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>

                            {/* Em bé */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Em bé</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Dưới 2 tuổi</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => updatePax('infants', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontSize: '16px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{pax.infants}</span>
                                    <button onClick={() => updatePax('infants', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Khối Thông tin hành khách (Dynamic Forms) */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Thông tin hành khách</h2>
                        
                        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input type="radio" checked readOnly style={{ accentColor: '#dc2626' }} />
                            <span style={{ fontSize: '14px', color: '#b91c1c' }}>Tôi cần nhân viên tư vấn trợ giúp nhập thông tin đăng ký dịch vụ</span>
                        </div>

                        {['adults', 'children', 'toddlers'].map(type => {
                            if (pax[type] === 0) return null;
                            const typeName = type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : 'Trẻ nhỏ';
                            const typeDesc = type === 'adults' ? 'Từ 12 tuổi trở lên' : type === 'children' ? 'Từ 5 - 11 tuổi' : 'Từ 2 - 4 tuổi';
                            
                            return (
                                <div key={type} style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <User size={18} color="#2563eb" />
                                        <strong style={{ fontSize: '16px', color: '#1e40af' }}>{typeName} <span style={{fontSize: '13px', fontWeight: 'normal', color: '#64748b'}}>({typeDesc})</span></strong>
                                    </div>
                                    
                                    {Array.from({ length: pax[type] }).map((_, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500', width: '20px' }}>#{idx + 1}</span>
                                            <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '24px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                                <span style={{ fontSize: '14px', color: '#64748b' }}>{typeName} <span style={{color: '#dc2626'}}>*</span></span>
                                                <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>Nhập thông tin ➔</span>
                                            </div>
                                            {type === 'adults' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Phòng đơn:</span>
                                                    <div style={{ width: '40px', height: '20px', background: '#e2e8f0', borderRadius: '10px', position: 'relative' }}>
                                                        <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px' }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* Khối Mã ưu đãi */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Mã ưu đãi</h2>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <input type="text" placeholder="Ví dụ: TRAVELERP100" style={{ flex: 1, padding: '14px 20px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none' }} />
                            <button style={{ padding: '0 32px', borderRadius: '24px', background: '#e2e8f0', color: '#94a3b8', border: 'none', fontWeight: 'bold', fontSize: '15px' }}>Áp dụng</button>
                        </div>
                    </div>

                    {/* Khối Phương thức thanh toán (Custom addition to keep flow) */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Phương thức thanh toán</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: paymentMethod === 'VNPAY_QR' ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '12px', background: paymentMethod === 'VNPAY_QR' ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <input type="radio" name="payment" checked={paymentMethod === 'VNPAY_QR'} onChange={() => setPaymentMethod('VNPAY_QR')} style={{ width: '20px', height: '20px', accentColor: '#2563eb' }} />
                                <div>
                                    <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>Chuyển khoản / Quét mã VietQR</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Hệ thống tự động duyệt đơn 24/7 ngay sau khi nhận được tiền.</span>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: paymentMethod === 'Cash' ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '12px', background: paymentMethod === 'Cash' ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <input type="radio" name="payment" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} style={{ width: '20px', height: '20px', accentColor: '#2563eb' }} />
                                <div>
                                    <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>Thanh toán Tiền mặt tại văn phòng</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Bạn đến trực tiếp văn phòng TravelERP để đóng tiền. Đơn hàng sẽ chờ xác nhận.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Khối Ghi chú */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px' }}>Ghi chú</h2>
                        <p style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500', marginBottom: '16px' }}>Vui lòng cho chúng tôi biết nếu Quý khách có ghi chú hoặc yêu cầu đặc biệt.</p>
                        <textarea name="notes" value={contactInfo.notes} onChange={handleInputChange} rows="4" placeholder="Ví dụ: Bữa ăn chay, đến muộn..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#f8fafc', fontSize: '15px', outline: 'none', resize: 'vertical' }}></textarea>
                    </div>
                </div>

                {/* Cột phải: Sidebar Tóm tắt đơn hàng */}
                <div style={{ width: '380px', position: 'sticky', top: '100px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '20px' }}>Tóm tắt đơn hàng</h2>
                        
                        {/* Header của Tour */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <img src={bgImage} alt="Tour" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#0f172a', margin: '0 0 8px 0', lineHeight: '1.4' }}>{title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                                    <Tag size={14} /> {tour?.tour_code || \`\${tour?.tour_id || quote?.quote_id}-DEP\`}
                                </div>
                            </div>
                        </div>

                        {/* Accordion 1: Thông tin chuyến xe */}
                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '16px', marginBottom: '16px' }}>
                            <div onClick={() => toggleSection('transport')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: '600', fontSize: '15px' }}>
                                    <span>🚌</span> Thông tin chuyến xe
                                </div>
                                <ChevronDown size={18} color="#64748b" style={{ transform: expandedSections.transport ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>
                            
                            {expandedSections.transport && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Ngày đi: <strong style={{color: '#0f172a'}}>10/09/2026</strong></span>
                                        <span style={{ color: '#ea580c', fontWeight: '600' }}>🚌 Xe khách</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '16px' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>05:00</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>TP. Hồ Chí Minh</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block' }}>07:00</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>Điểm đến</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px dotted #e2e8f0', margin: '12px 0' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Ngày về: <strong style={{color: '#0f172a'}}>13/09/2026</strong></span>
                                        <span style={{ color: '#ea580c', fontWeight: '600' }}>🚌 Xe khách</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>07:00</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>Điểm đến</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block' }}>05:00</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>TP. Hồ Chí Minh</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Accordion 2: Chi tiết chi phí */}
                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '16px', marginBottom: '16px' }}>
                            <div onClick={() => toggleSection('price')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: '600', fontSize: '15px' }}>
                                    <span>💵</span> Chi tiết chi phí
                                </div>
                                <ChevronDown size={18} color="#64748b" style={{ transform: expandedSections.price ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>
                            
                            {expandedSections.price && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#475569' }}>
                                    {pax.adults > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Người lớn</span>
                                            <span>{pax.adults} x {formatCurrency(adultPrice)}</span>
                                        </div>
                                    )}
                                    {pax.children > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Trẻ em</span>
                                            <span>{pax.children} x {formatCurrency(childPrice)}</span>
                                        </div>
                                    )}
                                    {pax.toddlers > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Trẻ nhỏ</span>
                                            <span>{pax.toddlers} x {formatCurrency(toddlerPrice)}</span>
                                        </div>
                                    )}
                                    {pax.infants > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Em bé</span>
                                            <span>{pax.infants} x {formatCurrency(infantPrice)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Phụ thu phòng đơn</span>
                                        <span>0đ</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Tổng tiền và Submit */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginTop: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <strong style={{ fontSize: '18px', color: '#0f172a' }}>Tổng tiền</strong>
                            <strong style={{ fontSize: '24px', color: '#dc2626' }}>{formatCurrency(totalAmount)}</strong>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '20px' }}>
                            <div style={{ width: '20px', height: '20px', minWidth: '20px', border: privacyConsent ? 'none' : '1px solid #cbd5e1', borderRadius: '4px', background: privacyConsent ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                                {privacyConsent && <Check size={14} color="#fff" />}
                            </div>
                            <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} style={{ display: 'none' }} />
                            <span style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                Tôi đồng ý với <strong style={{ color: '#2563eb' }}>Chính sách bảo vệ dữ liệu cá nhân</strong> và <strong style={{ color: '#2563eb' }}>Các điều khoản</strong>
                            </span>
                        </label>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#1d4ed8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                <Phone size={20} />
                            </button>
                            <button onClick={submitBooking} disabled={!privacyConsent || isSubmitting} style={{ flex: 1, height: '48px', borderRadius: '24px', background: privacyConsent ? '#dc2626' : '#f1f5f9', color: privacyConsent ? '#fff' : '#94a3b8', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: privacyConsent ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                                {isSubmitting ? 'Đang xử lý...' : (privacyConsent ? 'Xác Nhận Đặt Tour' : 'Chưa nhập đủ thông tin')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingForm;
