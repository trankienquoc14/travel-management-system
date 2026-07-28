import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CustomerNavbar from './CustomerNavbar';

const GATEWAY_URL = 'http://localhost:5000';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    
    // Modal states
    const [detailBooking, setDetailBooking] = useState(null); // Modal Xem chi tiết
    const [selectedBooking, setSelectedBooking] = useState(null); // Modal Yêu cầu Hủy/Đổi lịch
    const [requestType, setRequestType] = useState('Cancel');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const fetchMyBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${GATEWAY_URL}/api/bookings/my-bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.success) {
                setBookings(response.data.data || []);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách đơn hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendChangeRequest = async (e) => {
        e.preventDefault();
        if (!selectedBooking) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                booking_id: selectedBooking.booking_id,
                request_type: requestType,
                reason: reason
            };
            const res = await axios.post(`${GATEWAY_URL}/api/bookings/change-request`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.success) {
                setAlertMsg({ type: 'success', text: '🎉 Đã gửi yêu cầu xử lý thành công! Bộ phận CSKH sẽ liên hệ với bạn.' });
                setSelectedBooking(null);
                fetchMyBookings();
            }
        } catch (error) {
            console.error("Lỗi gửi yêu cầu hủy/đổi lịch:", error);
            setAlertMsg({ type: 'error', text: error.response?.data?.message || 'Không thể gửi yêu cầu! Vui lòng thử lại.' });
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString('vi-VN') + ' ₫';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000';
        if (url.startsWith('http')) return url;
        let imagePath = url.startsWith('/') ? url.substring(1) : url;
        if (!imagePath.startsWith('uploads/')) imagePath = `uploads/${imagePath}`;
        return `${GATEWAY_URL}/${imagePath}`;
    };

    // Calculated KPI Summary
    const totalSpent = bookings
        .filter(b => b.payment_status === 'Paid')
        .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const upcomingBooking = bookings
        .filter(b => b.booking_status !== 'Cancelled' && new Date(b.departure_date) >= new Date())
        .sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date))[0];

    // Filtered bookings list
    const filteredBookings = bookings.filter(b => {
        if (filterStatus === 'All') return true;
        if (filterStatus === 'Confirmed') return b.booking_status === 'Confirmed';
        if (filterStatus === 'Pending') return b.booking_status === 'Pending';
        if (filterStatus === 'Paid') return b.payment_status === 'Paid';
        if (filterStatus === 'Cancelled') return b.booking_status === 'Cancelled';
        return true;
    });

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'Confirmed':
                return <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '13px', fontWeight: '700' }}>✅ Đã xác nhận</span>;
            case 'Pending':
                return <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontSize: '13px', fontWeight: '700' }}>⏳ Chờ xử lý</span>;
            case 'Completed':
                return <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', fontSize: '13px', fontWeight: '700' }}>🎉 Đã hoàn thành</span>;
            case 'Cancelled':
                return <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '13px', fontWeight: '700' }}>❌ Đã hủy</span>;
            default:
                return <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>{status}</span>;
        }
    };

    const renderPaymentBadge = (status) => {
        switch (status) {
            case 'Paid':
                return <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '13px', fontWeight: '700' }}>💵 Đã thanh toán</span>;
            case 'Unpaid':
                return <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', fontSize: '13px', fontWeight: '700' }}>⏳ Chưa thanh toán</span>;
            default:
                return <span style={{ padding: '6px 14px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>{status}</span>;
        }
    };

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: '"Outfit", "Inter", sans-serif' }}>
            <CustomerNavbar activeTab="my-bookings" />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 20px' }}>
                
                {/* 1. Header Banner & KPI Summary */}
                <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '24px', padding: '32px', color: '#fff', boxShadow: '0 10px 30px rgba(15,23,42,0.15)', marginBottom: '32px' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        📦 Đơn Hàng Tour Du Lịch Của Tôi
                    </h2>
                    <p style={{ margin: '0 0 24px 0', opacity: 0.8, fontSize: '15px' }}>
                        Quản lý toàn bộ vé điện tử, lịch trình di chuyển và trạng thái thanh toán chuyến đi.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <div style={{ fontSize: '13px', opacity: 0.8, textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>TỔNG SỐ ĐƠN HÀNG</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8' }}>{bookings.length} Chuyến đi</div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <div style={{ fontSize: '13px', opacity: 0.8, textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>TỔNG TIỀN ĐÃ THANH TOÁN</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#4ade80' }}>{formatCurrency(totalSpent)}</div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)' }}>
                            <div style={{ fontSize: '13px', opacity: 0.8, textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>CHUYẾN ĐI SẮP TỚI</div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fba518' }}>
                                {upcomingBooking ? formatDate(upcomingBooking.departure_date) : 'Chưa có lịch'}
                            </div>
                        </div>
                    </div>
                </div>

                {alertMsg.text && (
                    <div style={{
                        padding: '14px 20px', borderRadius: '14px', marginBottom: '24px', fontSize: '15px', fontWeight: '600',
                        backgroundColor: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
                        border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                        {alertMsg.text}
                    </div>
                )}

                {/* 2. Filter Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                        { id: 'All', label: '📋 Tất cả đơn hàng' },
                        { id: 'Confirmed', label: '✅ Đã xác nhận' },
                        { id: 'Pending', label: '⏳ Chờ xử lý' },
                        { id: 'Paid', label: '💵 Đã thanh toán' },
                        { id: 'Cancelled', label: '❌ Đã hủy' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '30px',
                                border: filterStatus === tab.id ? 'none' : '1px solid #cbd5e1',
                                background: filterStatus === tab.id ? '#0194f3' : '#ffffff',
                                color: filterStatus === tab.id ? '#ffffff' : '#475569',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: filterStatus === tab.id ? '0 4px 12px rgba(1, 148, 243, 0.3)' : 'none'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3. Bookings List Cards */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '20px', fontSize: '16px', color: '#0194f3', fontWeight: '700' }}>
                        ⏳ Đang tải thông tin đơn hàng...
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏝️</div>
                        <h3 style={{ fontSize: '20px', color: '#0f172a', fontWeight: '800', margin: '0 0 8px 0' }}>Chưa tìm thấy đơn hàng nào</h3>
                        <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>Bạn chưa có đơn đặt tour trong danh mục này.</p>
                        <button onClick={() => window.location.href = '/home'} style={{ padding: '12px 24px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            ✨ Khám phá các Tour hấp dẫn
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredBookings.map((booking) => {
                            const isCustom = Boolean(booking.quote_id);

                            return (
                                <div key={booking.booking_id} style={{ display: 'flex', flexWrap: 'wrap', backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'all 0.3s ease' }}>
                                    
                                    {/* Left Cover Image */}
                                    <div style={{ width: '280px', minHeight: '200px', backgroundImage: `url(${getImageUrl(booking.image_url)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '14px', left: '14px', background: isCustom ? '#7e22ce' : '#0284c7', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                            {isCustom ? '🛎️ Tour Thiết Kế Riêng' : '🗺️ Tour Trọn Gói'}
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: '300px' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                                                <div>
                                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
                                                        MÃ ĐƠN: #BKG-{booking.booking_id.toString().padStart(4, '0')}
                                                    </span>
                                                    <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4' }}>
                                                        {booking.tour_name}
                                                    </h3>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    {renderStatusBadge(booking.booking_status)}
                                                    {renderPaymentBadge(booking.payment_status)}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#f8fafc', padding: '14px 18px', borderRadius: '16px', margin: '16px 0', border: '1px solid #f1f5f9', fontSize: '14px' }}>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px', fontWeight: '600' }}>📅 NGÀY KHỞI HÀNH</span>
                                                    <strong style={{ color: '#0f172a' }}>{formatDate(booking.departure_date)}</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px', fontWeight: '600' }}>⏱️ THỜI GIAN</span>
                                                    <strong style={{ color: '#0f172a' }}>{booking.duration_days || 3} Ngày</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px', fontWeight: '600' }}>👥 SỐ HÀNH KHÁCH</span>
                                                    <strong style={{ color: '#0f172a' }}>{booking.num_people} Người</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px', fontWeight: '600' }}>📍 ĐIỂM ĐẾN</span>
                                                    <strong style={{ color: '#0f172a' }}>{booking.destination || 'Việt Nam'}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Action Footer */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                            <div>
                                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Tổng thanh toán: </span>
                                                <span style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginLeft: '6px' }}>
                                                    {formatCurrency(booking.total_amount)}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {/* Button Nút Xem Chi Tiết */}
                                                <button
                                                    onClick={() => setDetailBooking(booking)}
                                                    style={{ padding: '10px 18px', backgroundColor: '#0194f3', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', boxShadow: '0 4px 12px rgba(1, 148, 243, 0.25)', transition: 'all 0.2s' }}
                                                >
                                                    👁️ Xem Chi Tiết Đơn
                                                </button>

                                                {booking.booking_status !== 'Cancelled' && (
                                                    <button
                                                        onClick={() => { setSelectedBooking(booking); setReason(''); }}
                                                        style={{ padding: '10px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', transition: 'all 0.2s' }}
                                                    >
                                                        🔄 Hủy / Đổi Lịch
                                                    </button>
                                                )}

                                                {booking.payment_status === 'Unpaid' && booking.booking_status !== 'Cancelled' && (
                                                    <button 
                                                        onClick={() => alert("Chuyển hướng đến cổng thanh toán trực tuyến VNPAY...")}
                                                        style={{ padding: '10px 18px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                                                    >
                                                        💳 Thanh Toán Ngay
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL 1: XEM CHI TIẾT ĐƠN HÀNG TOÀN DIỆN */}
            {detailBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '28px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative' }}>
                        
                        {/* Detail Header Banner */}
                        <div style={{ position: 'relative', height: '180px', backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.3), rgba(15,23,42,0.9)), url(${getImageUrl(detailBooking.image_url)})`, backgroundSize: 'cover', backgroundPosition: 'center', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', color: '#fff', borderTopLeftRadius: '28px', borderTopRightRadius: '28px' }}>
                            <button 
                                onClick={() => setDetailBooking(null)}
                                style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'rgba(255,255,255,0.25)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                ✕
                            </button>

                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>
                                MÃ ĐƠN HÀNG: #BKG-{detailBooking.booking_id.toString().padStart(4, '0')}
                            </div>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '800' }}>
                                {detailBooking.tour_name}
                            </h3>
                        </div>

                        {/* Detail Modal Body */}
                        <div style={{ padding: '32px' }}>
                            
                            {/* Status Bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#475569' }}>TRẠNG THÁI:</span>
                                    {renderStatusBadge(detailBooking.booking_status)}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#475569' }}>THANH TOÁN:</span>
                                    {renderPaymentBadge(detailBooking.payment_status)}
                                </div>
                            </div>

                            {/* 2-Column Info Sections */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                                
                                {/* Column 1: Chuyến đi */}
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        🗺️ Thông Tin Lịch Trình
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐIỂM ĐẾN</span>
                                            <strong style={{ color: '#0f172a' }}>{detailBooking.destination || 'Việt Nam'}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>NGÀY KHỞI HÀNH</span>
                                            <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.departure_date)}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>NGÀY KẾT THÚC DỰ KIẾN</span>
                                            <strong style={{ color: '#0f172a' }}>{formatDate(detailBooking.return_date)}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>SỐ HÀNH KHÁCH</span>
                                            <strong style={{ color: '#0f172a' }}>{detailBooking.num_people} Người lớn / Trẻ em</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Thanh toán & Khách hàng */}
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        💳 Chi Tiết Bảng Tính Tiền
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Đơn giá 1 hành khách:</span>
                                            <strong style={{ color: '#0f172a' }}>{formatCurrency(detailBooking.price_per_person)}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Số lượng khách:</span>
                                            <strong style={{ color: '#0f172a' }}>x {detailBooking.num_people}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748b' }}>Bảo hiểm du lịch:</span>
                                            <strong style={{ color: '#10b981' }}>Đã bao gồm (Free)</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px' }}>
                                            <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>TỔNG TIỀN THANH TOÁN:</span>
                                            <strong style={{ fontSize: '20px', color: '#059669', fontWeight: '800' }}>{formatCurrency(detailBooking.total_amount)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Pass Container Design */}
                            <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '20px', padding: '20px', border: '1px dashed #94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>VÉ ĐIỆN TỬ E-TICKET PASS</div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>Hành khách: {detailBooking.customer_name || 'Khách hàng'}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>SĐT liên hệ: {detailBooking.customer_phone || 'N/A'}</div>
                                </div>
                                <button onClick={() => window.print()} style={{ padding: '10px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                                    🖨️ In Vé Điện Tử
                                </button>
                            </div>

                        </div>

                        {/* Detail Modal Footer */}
                        <div style={{ padding: '20px 32px', background: '#f8fafc', borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setDetailBooking(null)} style={{ padding: '10px 24px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                Đóng cửa sổ
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH */}
            {selectedBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', width: '520px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            🔄 Yêu Cầu Hủy Tour / Thay Đổi Lịch Khởi Hành
                        </h3>

                        <form onSubmit={handleSendChangeRequest}>
                            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#475569' }}>
                                Đơn hàng: <strong>#BKG-{selectedBooking.booking_id.toString().padStart(4, '0')} - {selectedBooking.tour_name}</strong>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                                    Loại yêu cầu:
                                </label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <label style={{ flex: 1, padding: '12px', border: `2px solid ${requestType === 'Cancel' ? '#ef4444' : '#e2e8f0'}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'center', fontWeight: '700', color: requestType === 'Cancel' ? '#dc2626' : '#64748b', backgroundColor: requestType === 'Cancel' ? '#fef2f2' : '#fff' }}>
                                        <input type="radio" name="reqType" value="Cancel" checked={requestType === 'Cancel'} onChange={() => setRequestType('Cancel')} style={{ display: 'none' }} />
                                        ❌ Xin Hủy Tour
                                    </label>
                                    <label style={{ flex: 1, padding: '12px', border: `2px solid ${requestType === 'Reschedule' ? '#2563eb' : '#e2e8f0'}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'center', fontWeight: '700', color: requestType === 'Reschedule' ? '#2563eb' : '#64748b', backgroundColor: requestType === 'Reschedule' ? '#eff6ff' : '#fff' }}>
                                        <input type="radio" name="reqType" value="Reschedule" checked={requestType === 'Reschedule'} onChange={() => setRequestType('Reschedule')} style={{ display: 'none' }} />
                                        🔄 Xin Đổi Lịch
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                                    Lý do chi tiết:
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder={requestType === 'Cancel' ? 'Nhập lý do bạn muốn hủy tour...' : 'Nhập ngày khởi hành mong muốn mới hoặc ghi chú đổi lịch...'}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => setSelectedBooking(null)} style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>
                                    Hủy bỏ
                                </button>
                                <button type="submit" disabled={submitting} style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>
                                    {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MyBookings;