import React, { useEffect, useState } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import CustomerNavbar from './CustomerNavbar';

const GATEWAY_URL = 'http://localhost:5000';


const renderPaxSummary = (b) => {
    let p = null;
    try {
        if (b.breakdown) p = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
        else if (b.requirements) {
            const r = typeof b.requirements === 'string' ? JSON.parse(b.requirements) : b.requirements;
            if (r.participantBreakdown) p = r.participantBreakdown;
        }
    } catch(e) {}
    if (p) {
        const parts = [];
        if (p.adults > 0) parts.push(`${p.adults} NL`);
        if (p.children > 0) parts.push(`${p.children} TE`);
        if (p.toddlers > 0) parts.push(`${p.toddlers} TN`);
        if (p.infants > 0) parts.push(`${p.infants} EB`);
        return parts.join(', ');
    }
    return `${b.num_people || 1} Khách`;
};
const getPassengerName = (b, idx) => {
    try {
        if (b.passengers_list) {
            if (typeof b.passengers_list === 'string') {
                if (b.passengers_list.includes('||')) {
                    const list = b.passengers_list.split('||');
                    if (list[idx]) return list[idx];
                } else if (b.passengers_list.startsWith('[')) {
                    const list = JSON.parse(b.passengers_list);
                    if (list && list[idx]) {
                        if (list[idx].name) return list[idx].name;
                        if (list[idx].full_name) return list[idx].full_name;
                    }
                }
            } else if (Array.isArray(b.passengers_list)) {
                if (b.passengers_list[idx]) {
                    if (b.passengers_list[idx].name) return b.passengers_list[idx].name;
                    if (b.passengers_list[idx].full_name) return b.passengers_list[idx].full_name;
                }
            }
        }
        if (b.breakdown) {
            const parsed = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
            if (parsed && parsed.passengers && parsed.passengers[idx]) {
                if (parsed.passengers[idx].full_name) return parsed.passengers[idx].full_name;
                if (parsed.passengers[idx].name) return parsed.passengers[idx].name;
            }
        }
        if (b.requirements) {
            const req = typeof b.requirements === 'string' ? JSON.parse(b.requirements) : b.requirements;
            if (req && req.passengers && req.passengers[idx]) {
                if (req.passengers[idx].full_name) return req.passengers[idx].full_name;
                if (req.passengers[idx].name) return req.passengers[idx].name;
            }
        }
        if (b.design_data) {
            const d = typeof b.design_data === 'string' ? JSON.parse(b.design_data) : b.design_data;
            if (d && d.passengers && d.passengers[idx]) {
                if (d.passengers[idx].full_name) return d.passengers[idx].full_name;
                if (d.passengers[idx].name) return d.passengers[idx].name;
            }
        }
    } catch(e) {}
    
    // If no specific names found, use customer name + index
    if (b.num_people > 1) {
        return idx === 0 ? `${b.customer_name || 'Khách hàng'} (Đại diện)` : `${b.customer_name || 'Khách hàng'} (Khách ${idx + 1})`;
    }
    return b.customer_name || 'Khách hàng';
};

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [serviceBookings, setServiceBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [viewMode, setViewMode] = useState('Tour'); // 'Tour' hoặc 'Service'
    
    // Modal states
    const [detailBooking, setDetailBooking] = useState(null); // Modal Xem chi tiết
    const [ticketBooking, setTicketBooking] = useState(null);
    const [itineraryModalBooking, setItineraryModalBooking] = useState(null);
    const [remoteDays, setRemoteDays] = useState(null);
    const [loadingRemote, setLoadingRemote] = useState(false);
    
    useEffect(() => {
        const fetchRemote = async () => {
            if (!itineraryModalBooking) return;
            let localDays = [];
            try {
                if (itineraryModalBooking.design_data) {
                    const parsed = typeof itineraryModalBooking.design_data === 'string' ? JSON.parse(itineraryModalBooking.design_data) : itineraryModalBooking.design_data;
                    if (parsed.itineraryDays) localDays = parsed.itineraryDays;
                } else if (itineraryModalBooking.requirements) {
                    const reqs = typeof itineraryModalBooking.requirements === 'string' ? JSON.parse(itineraryModalBooking.requirements) : itineraryModalBooking.requirements;
                    if (reqs.itinerary) localDays = reqs.itinerary;
                }
            } catch(e) {}
            if (localDays && localDays.length > 0) {
                setRemoteDays(localDays);
                setLoadingRemote(false);
                return;
            }
            setLoadingRemote(true);
            setRemoteDays(null);
            try {
                let tId = itineraryModalBooking.tour_id;
                if (!tId) {
                    const res1 = await axios.get(`${GATEWAY_URL}/api/tours`);
                    const matched = res1.data.data.find(t => t.tour_name === itineraryModalBooking.tour_name);
                    if (matched) tId = matched.tour_id;
                }
                if (tId) {
                    const res2 = await axios.get(`${GATEWAY_URL}/api/tours/${tId}`);
                    if (res2.data.success && res2.data.data.itineraries) {
                        const fetched = res2.data.data.itineraries.map(it => ({
                            day: it.day_number, title: it.title, description: it.description,
                            activities: it.activities ? (typeof it.activities === 'string' ? JSON.parse(it.activities) : it.activities) : [],
                            meals: it.meals ? (typeof it.meals === 'string' ? JSON.parse(it.meals) : it.meals) : [],
                            accommodation: it.accommodation
                        }));
                        setRemoteDays(fetched);
                    } else { setRemoteDays([]); }
                } else { setRemoteDays([]); }
            } catch(e) { setRemoteDays([]); } finally { setLoadingRemote(false); }
        };
        fetchRemote();
    }, [itineraryModalBooking]);

    const handleDownloadPDF = () => {
        const element = document.getElementById('ticket-content-to-pdf');
        if (!element) return;
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5], pagebreak: { mode: ['css', 'legacy'] },
          filename: `Ve_Dien_Tu_${ticketBooking.booking_id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0, y: 0, windowWidth: 900 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [requestType, setRequestType] = useState('Cancel');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchMyBookings();
        fetchMyServices();
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

    const fetchMyServices = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${GATEWAY_URL}/api/bookings/my-services`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.success) {
                setServiceBookings(response.data.data || []);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách dịch vụ:", error);
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

    const filteredServiceBookings = serviceBookings.filter(b => {
        if (filterStatus === 'All') return true;
        if (filterStatus === 'Confirmed') return b.status === 'Confirmed' || b.status === 'Accepted';
        if (filterStatus === 'Pending') return b.status === 'Pending';
        if (filterStatus === 'Paid') return b.payment_status === 'Paid';
        if (filterStatus === 'Cancelled') return b.status === 'Cancelled' || b.status === 'Rejected';
        return true;
    });

    
const renderTimeline = (bookingStatus, paymentStatus) => {
    let currentStep = 2; // Mặc định là đã xác nhận
    let isCancelled = bookingStatus === 'Cancelled';

    if (isCancelled) {
        // Special render for cancelled
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 0 6px #fee2e2' }}>
                        <i className="fas fa-times"></i>
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>Đã hủy</span>
                </div>
            </div>
        );
    }
    if (paymentStatus === 'Paid') currentStep = 3;
    if (bookingStatus === 'Completed') currentStep = 4;

    // Steps definition
    const steps = [
        { label: 'Đã đặt' },
        { label: 'Đã xác nhận' },
        { label: 'Đã thanh toán' },
        { label: 'Hoàn thành' }
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 40px', width: '100%', boxSizing: 'border-box' }}>
            {steps.map((step, index) => {
                const stepNum = index + 1;
                const isCompleted = currentStep >= stepNum;
                const isPastCompleted = currentStep > stepNum;
                
                return (
                    <React.Fragment key={index}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 2, width: '80px' }}>
                            {isCompleted ? (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#588b6b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: '0 0 0 6px #eefdf4' }}>
                                    ✓
                                </div>
                            ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                                    {stepNum}
                                </div>
                            )}
                            <span style={{ color: isCompleted ? '#588b6b' : '#94a3b8', fontWeight: '700', fontSize: '13px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div style={{ flex: 1, height: '2px', backgroundColor: isPastCompleted ? '#588b6b' : '#e2e8f0', margin: '0 8px', transform: 'translateY(-16px)' }}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

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
            <div className="no-print"><CustomerNavbar activeTab="my-bookings" /></div>

            <div className="no-print" style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 20px' }}>
                
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

                {/* 2. Filter Tabs & ViewMode Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
                    
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
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

                    <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '12px', padding: '4px' }}>
                        <button onClick={() => setViewMode('Tour')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'Tour' ? '#fff' : 'transparent', color: viewMode === 'Tour' ? '#0f172a' : '#64748b', fontWeight: '700', cursor: 'pointer', boxShadow: viewMode === 'Tour' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>📦 Đơn Tour</button>
                        <button onClick={() => setViewMode('Service')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'Service' ? '#fff' : 'transparent', color: viewMode === 'Service' ? '#0f172a' : '#64748b', fontWeight: '700', cursor: 'pointer', boxShadow: viewMode === 'Service' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>🛎️ Dịch vụ riêng</button>
                    </div>
                </div>

                {/* 3. Bookings List Cards */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '20px', fontSize: '16px', color: '#0194f3', fontWeight: '700' }}>
                        ⏳ Đang tải thông tin đơn hàng...
                    </div>
                ) : (viewMode === 'Tour' ? filteredBookings : filteredServiceBookings).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏝️</div>
                        <h3 style={{ fontSize: '20px', color: '#0f172a', fontWeight: '800', margin: '0 0 8px 0' }}>Chưa tìm thấy đơn hàng nào</h3>
                        <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>Bạn chưa có đơn đặt {viewMode === 'Tour' ? 'tour' : 'dịch vụ'} trong danh mục này.</p>
                        <button onClick={() => window.location.href = '/home'} style={{ padding: '12px 24px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            ✨ Khám phá các dịch vụ hấp dẫn
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {viewMode === 'Tour' ? (
                            filteredBookings.map((booking) => {
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
                            })
                        ) : (
                            filteredServiceBookings.map((sb) => (
                                <div key={sb.booking_id} style={{ display: 'flex', flexWrap: 'wrap', backgroundColor: '#ffffff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', transition: 'all 0.3s ease' }}>
                                    
                                    <div style={{ width: '280px', minHeight: '200px', backgroundImage: `url(${getImageUrl(sb.image_url)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '14px', left: '14px', background: '#f59e0b', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                            🛎️ Dịch Vụ
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: '300px' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                                                <div>
                                                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
                                                        MÃ ĐƠN: #SRV-{sb.booking_id.toString().padStart(4, '0')}
                                                    </span>
                                                    <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4' }}>
                                                        {sb.service_name}
                                                    </h3>
                                                    <span style={{ fontSize: '13px', color: '#0194f3', fontWeight: '600' }}>{sb.service_type}</span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    {renderStatusBadge(sb.status)}
                                                    {renderPaymentBadge(sb.payment_status)}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#f8fafc', padding: '14px 18px', borderRadius: '16px', margin: '16px 0', border: '1px solid #f1f5f9', fontSize: '14px' }}>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px', fontWeight: '600' }}>📅 NGÀY SỬ DỤNG</span>
                                                    <strong style={{ color: '#0f172a' }}>{formatDate(sb.usage_date)}</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px', fontWeight: '600' }}>📦 SỐ LƯỢNG YÊU CẦU</span>
                                                    <strong style={{ color: '#0f172a' }}>{sb.quantity} {sb.unit}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                            <div>
                                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Tổng thanh toán: </span>
                                                <span style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginLeft: '6px' }}>
                                                    {formatCurrency(sb.total_amount)}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setDetailBooking({...sb, isService: true})}
                                                    style={{ padding: '10px 18px', backgroundColor: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)', transition: 'all 0.2s' }}
                                                >
                                                    👁️ Xem Chi Tiết Dịch Vụ
                                                </button>
                                                {sb.payment_status === 'Unpaid' && sb.status !== 'Cancelled' && (
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
                            ))
                        )}
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

                            <div style={{ fontSize: '13px', fontWeight: '700', color: detailBooking.isService ? '#fde68a' : '#38bdf8', textTransform: 'uppercase' }}>
                                MÃ ĐƠN HÀNG: #{detailBooking.isService ? 'SRV' : 'BKG'}-{detailBooking.booking_id.toString().padStart(4, '0')}
                            </div>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '800' }}>
                                {detailBooking.isService ? detailBooking.service_name : detailBooking.tour_name}
                            </h3>
                        </div>

                        {/* Detail Modal Body */}
                        <div style={{ padding: '32px' }}>
                            
                            {/* Status Bar Timeline */}
                            <div style={{ background: '#ffffff', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                {renderTimeline(detailBooking.isService ? detailBooking.status : detailBooking.booking_status, detailBooking.payment_status)}
                            </div>

                            {/* 2-Column Info Sections */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                                
                                {/* Column 1: Chuyến đi / Dịch vụ */}
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        {detailBooking.isService ? '🛎️ Thông Tin Dịch Vụ' : '🗺️ Thông Tin Lịch Trình'}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        {(() => {
                                            if (detailBooking.isService) {
                                                return (
                                                    <>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Loại dịch vụ</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.service_type}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày sử dụng</span>
                                                            <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.usage_date)}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Số lượng yêu cầu</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.quantity} {detailBooking.unit}</strong>
                                                        </div>
                                                    </>
                                                );
                                            }

                                            let departureLocation = null;
                                            let departureTime = null;
                                            try {
                                                if (detailBooking.design_data) {
                                                    const d = typeof detailBooking.design_data === 'string' ? JSON.parse(detailBooking.design_data) : detailBooking.design_data;
                                                    if (d.departureCity) departureLocation = d.departureCity;
                                                    if (d.startTime) departureTime = d.startTime;
                                                } else if (detailBooking.requirements) {
                                                    const r = typeof detailBooking.requirements === 'string' ? JSON.parse(detailBooking.requirements) : detailBooking.requirements;
                                                    if (r.departureCity) departureLocation = r.departureCity;
                                                    if (r.startTime) departureTime = r.startTime;
                                                }
                                            } catch(e) {}
                                            
                                            // Fallbacks if backend doesn't have it, hardcode as requested
                                            if (!departureLocation) departureLocation = 'Hồ Chí Minh';
                                            if (!departureTime) departureTime = '06:00 AM';

                                            return (
                                                <>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Địa điểm xuất phát</span>
                                                        <strong style={{ color: '#1e293b' }}>{departureLocation}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Giờ khởi hành</span>
                                                        <strong style={{ color: '#1e293b' }}>{departureTime}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Điểm đến</span>
                                                        <strong style={{ color: '#1e293b' }}>{detailBooking.destination || 'Việt Nam'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày khởi hành</span>
                                                        <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.departure_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày kết thúc dự kiến</span>
                                                        <strong style={{ color: '#1e293b' }}>{formatDate(detailBooking.return_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Số hành khách</span>
                                                        <strong style={{ color: '#1e293b' }}>{renderPaxSummary(detailBooking)}</strong>
                                                    </div>
                                                    
                                                    {detailBooking.departure_id && (
                                                        <div style={{ marginTop: '16px' }}>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setItineraryModalBooking(detailBooking);
                                                                }}
                                                                style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', border: '1px solid #cbd5e1', cursor: 'pointer' }} 
                                                            >
                                                                <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Column 2: Thanh toán & Khách hàng */}
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        💳 Chi Tiết Bảng Tính Tiền
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        {(() => {
                                            if (detailBooking.isService) {
                                                return (
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <span style={{ color: '#64748b' }}>Đơn giá ({detailBooking.unit}):</span>
                                                            <strong style={{ color: '#0f172a' }}>{formatCurrency(detailBooking.total_amount / (detailBooking.quantity || 1))}</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <span style={{ color: '#64748b' }}>Số lượng:</span>
                                                            <strong style={{ color: '#0f172a' }}>x {detailBooking.quantity}</strong>
                                                        </div>
                                                        <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0' }}></div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ textTransform: 'uppercase', fontWeight: '800', color: '#0f172a' }}>TỔNG THANH TOÁN</div>
                                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            let adults = 1, children = 0, toddlers = 0, infants = 0;
                                            let p = null;
                                            if (detailBooking.breakdown) {
                                                p = typeof detailBooking.breakdown === 'string' ? JSON.parse(detailBooking.breakdown) : detailBooking.breakdown;
                                            } else if (detailBooking.requirements) {
                                                const reqs = typeof detailBooking.requirements === 'string' ? JSON.parse(detailBooking.requirements) : detailBooking.requirements;
                                                if (reqs.participantBreakdown) p = reqs.participantBreakdown;
                                            }
                                            if (p) {
                                                adults = p.adults || 0; children = p.children || 0; toddlers = p.toddlers || 0; infants = p.infants || 0;
                                            } else { adults = detailBooking.num_people || 1; }

                                            let adultPrice = 0, childPrice = 0, toddlerPrice = 0, infantPrice = 0;
                                            const basePr = Number(detailBooking.base_price) || 0;
                                            let itConfig = {};
                                            try {
                                                if (detailBooking.design_data) {
                                                    const parsed = typeof detailBooking.design_data === 'string' ? JSON.parse(detailBooking.design_data) : detailBooking.design_data;
                                                    if (parsed.costConfig) itConfig = parsed.costConfig;
                                                }
                                            } catch(e) {}
                                            
                                            const sC = itConfig.ageMultiplier?.child || { percent: 75, fixed_surcharge: 0 };
                                            const sT = itConfig.ageMultiplier?.toddler || { percent: 50, fixed_surcharge: 0 };
                                            const sI = itConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                                            adultPrice = basePr;
                                            childPrice = (basePr * (sC.percent !== undefined ? sC.percent : 75) / 100) + Number(sC.fixed_surcharge || 0);
                                            toddlerPrice = (basePr * (sT.percent !== undefined ? sT.percent : 50) / 100) + Number(sT.fixed_surcharge || 0);
                                            infantPrice = (basePr * (sI.percent !== undefined ? sI.percent : 0) / 100) + Number(sI.fixed_surcharge || 0);

                                            const totalCalc = (adults * adultPrice) + (children * childPrice) + (toddlers * toddlerPrice) + (infants * infantPrice);
                                            let discount = detailBooking.discount_amount || 0;
                                            
                                            if (!detailBooking.discount_amount && totalCalc > detailBooking.total_amount) {
                                                discount = totalCalc - detailBooking.total_amount;
                                            }

                                            return (
                                                <div style={{ width: '100%' }}>
                                                    {adults > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Người lớn</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{adults} × {formatCurrency(adultPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(adults * adultPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {children > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ em</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{children} × {formatCurrency(childPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(children * childPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {toddlers > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ nhỏ</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{toddlers} × {formatCurrency(toddlerPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(toddlers * toddlerPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {infants > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Em bé</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{infants} × {formatCurrency(infantPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(infants * infantPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '20px 0 16px 0' }}></div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600' }}>
                                                        <span style={{ color: '#0f172a' }}>Tiền tour</span>
                                                        <span style={{ color: '#0f172a' }}>{formatCurrency(totalCalc)}</span>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600' }}>
                                                        <span style={{ color: '#0f172a' }}>Bảo hiểm</span>
                                                        <span style={{ color: '#0f172a' }}>Đã bao gồm</span>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600' }}>
                                                        <span style={{ color: '#0f172a' }}>Khuyến mãi</span>
                                                        <span style={{ color: '#0f172a' }}>{discount > 0 ? `-${formatCurrency(discount)}` : '0 ₫'}</span>
                                                    </div>
                                                    
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0' }}></div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ textTransform: 'uppercase', fontWeight: '800', color: '#0f172a' }}>TỔNG THANH TOÁN</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '16px' }}>
                                            <span style={{ color: '#64748b' }}>Phương thức thanh toán:</span>
                                            <strong style={{ color: '#0f172a' }}>
                                                {(() => {
                                                    const m = String(detailBooking.payment_method || '').toLowerCase();
                                                    if (m === 'bank_transfer') return 'Chuyển khoản';
                                                    if (m === 'momo') return 'Ví MoMo';
                                                    if (m === 'cash') return 'Tiền mặt';
                                                    if (m === 'vnpay') return 'VNPay';
                                                    return detailBooking.payment_method || (detailBooking.payment_status === 'Paid' ? 'Đã thanh toán (N/A)' : 'Chưa thanh toán');
                                                })()}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thông Tin Hành Khách Design */}
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h4 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                                    <span style={{ fontSize: '20px', color: '#312e81' }}>👤</span> Thông Tin Hành Khách
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>HỌ VÀ TÊN</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{detailBooking.customer_name || 'Khách hàng'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>SỐ ĐIỆN THOẠI</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{detailBooking.customer_phone || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>EMAIL LIÊN HỆ</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{detailBooking.customer_email || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Detail Modal Footer */}
                        <div style={{ padding: '20px 32px', background: '#f8fafc', borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            {!detailBooking.isService && detailBooking.payment_status === 'Paid' && (
                                <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-print"></i> In Vé Điện Tử
                                </button>
                            )}
                            <button onClick={() => setDetailBooking(null)} style={{ padding: '10px 24px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                Đóng cửa sổ
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* MODAL 3: XEM CHI TIẾT LỊCH TRÌNH */}
            {itineraryModalBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '800px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                🗺️ Lịch trình: {itineraryModalBooking.tour_name}
                            </h3>
                            <button onClick={() => setItineraryModalBooking(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
                            {(() => {
                                if (loadingRemote || remoteDays === null) return <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải dữ liệu lịch trình...</div>;
                                const days = remoteDays;
                                if (!days || days.length === 0) return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình.</div>;
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {days.map((day, idx) => (
                                            <div key={idx} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                                <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0284c7', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ background: '#e0f2fe', padding: '4px 12px', borderRadius: '20px', fontSize: '14px' }}>Ngày {day.day}</span>
                                                    {day.title}
                                                </h4>
                                                <div style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                                                    {day.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: E-TICKET DOWNLOAD MODAL */}
            {ticketBooking && (
                <div className="ticket-modal-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div className="ticket-modal-content" style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '100vh', overflowY: 'auto', padding: '20px' }}>
                        
                        <div id="ticket-content-to-pdf" style={{ display: 'block', width: '100%' }}>
                            {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => {
                                let depLoc = 'Hồ Chí Minh';
                                let depTime = '06:00 AM';
                                try {
                                    if (ticketBooking.design_data) {
                                        const d = typeof ticketBooking.design_data === 'string' ? JSON.parse(ticketBooking.design_data) : ticketBooking.design_data;
                                        if (d.departureCity) depLoc = d.departureCity;
                                        if (d.startTime) depTime = d.startTime;
                                    } else if (ticketBooking.requirements) {
                                        const r = typeof ticketBooking.requirements === 'string' ? JSON.parse(ticketBooking.requirements) : ticketBooking.requirements;
                                        if (r.departureCity) depLoc = r.departureCity;
                                        if (r.startTime) depTime = r.startTime;
                                    }
                                } catch(e) {}

                                return (
                                    <React.Fragment key={idx}>
                                        {idx > 0 && idx % 2 === 0 && <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', height: '0', margin: '0' }}></div>}
                                        <div className="print-modal" style={{ display: 'flex', background: '#fff', borderRadius: '20px', overflow: 'hidden', width: '100%', maxWidth: '800px', margin: '0 auto 32px auto', border: '2px solid #cbd5e1', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
                                        {/* Left Side */}
                                        <div style={{ width: '560px', padding: '32px 36px', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                                <div>
                                                    <div style={{ fontSize: '30px', fontWeight: '900', color: '#3b82f6', letterSpacing: '-0.5px', lineHeight: 1 }}>TravelVN</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', letterSpacing: '1.2px', marginTop: '6px' }}>E-TICKET PASS</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>HẠNG VÉ / CLASS</div>
                                                    <div style={{ fontSize: '18px', color: '#0f172a', fontWeight: '900' }}>STANDARD</div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '28px' }}>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>HÀNH TRÌNH / JOURNEY</div>
                                                <div style={{ fontSize: '22px', color: '#0f172a', fontWeight: '800' }}>{ticketBooking.tour_name}</div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '28px' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>KHỞI HÀNH / DEPARTURE</div>
                                                    <div style={{ fontSize: '16px', color: '#3b82f6', fontWeight: '700', whiteSpace: 'nowrap' }}>{depTime} | {formatDate(ticketBooking.departure_date)}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>XUẤT PHÁT TẠI / FROM</div>
                                                    <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{depLoc}</div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid #f1f5f9', margin: '0 0 20px 0' }}></div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>HÀNH KHÁCH / PASSENGER</div>
                                                    <div style={{ fontSize: '19px', color: '#0f172a', fontWeight: '800' }}>{getPassengerName(ticketBooking, idx)}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>MÃ ĐƠN / ORDER ID</div>
                                                    <div style={{ fontSize: '19px', color: '#0f172a', fontWeight: '800' }}>#{ticketBooking.booking_id}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dotted Divider */}
                                        <div style={{ width: '0', borderLeft: '3px dashed #cbd5e1' }}></div>

                                        {/* Right Side */}
                                        <div style={{ width: '240px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', boxSizing: 'border-box' }}>
                                            <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BKG-${ticketBooking.booking_id}-PAX-${idx}`} alt="QR Code" style={{ width: '130px', height: '130px', display: 'block' }} />
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>MÃ ĐẶT CHỖ / PNR</div>
                                            <div style={{ fontSize: '28px', color: '#0f172a', fontWeight: '900', marginBottom: '16px' }}>#{ticketBooking.booking_id}-{idx + 1}</div>
                                            <div style={{ padding: '6px 16px', background: '#dcfce7', color: '#166534', borderRadius: '24px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ĐÃ THANH TOÁN</div>
                                        </div>
                                    </div></React.Fragment>);})}
                        </div>

                        {/* Buttons Footer */}
                        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                            <button onClick={() => setTicketBooking(null)} style={{ padding: '12px 28px', background: '#ffffff', color: '#334155', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                Đóng cửa sổ
                            </button>
                            <button onClick={() => window.print()} style={{ padding: '12px 28px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}>
                                <i className="fas fa-print"></i> In vé
                            </button>
                            <button onClick={handleDownloadPDF} style={{ padding: '12px 28px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(15,23,42,0.3)' }}>
                                <i className="fas fa-download"></i> Tải PDF
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

            <footer className="home-footer no-print" style={{ marginTop: 'auto' }}>
                <div className="footer-container">
                    <div className="footer-col">
                        <h2 className="footer-logo">Travel<span className="text-primary">ERP</span></h2>
                        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginTop: '12px' }}>
                            Hệ thống quản trị & vận hành du lịch lữ hành toàn diện. Mang đến những chuyến đi tuyệt vời và kỷ niệm vô giá cho mọi khách hàng.
                        </p>
                    </div>
                    <div className="footer-col">
                        <h4>Về chúng tôi</h4>
                        <ul>
                            <li>Giới thiệu công ty</li>
                            <li>Đội ngũ Hướng dẫn viên</li>
                            <li>Chính sách bảo mật</li>
                            <li>Điều khoản sử dụng</li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Dịch vụ du lịch</h4>
                        <ul>
                            <li>Tour du lịch trong nước</li>
                            <li>Tour nghỉ dưỡng biển</li>
                            <li>Tự thiết kế Tour cá nhân</li>
                            <li>Đặt vé xe & Khách sạn</li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Hỗ trợ khách hàng</h4>
                        <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            <span>📞 Hotline: <strong>1900 1234</strong></span>
                            <span>✉️ Email: <strong>cskh@travelerp.vn</strong></span>
                            <span>🏢 Địa chỉ: Tòa nhà TravelERP, TP. Hồ Chí Minh</span>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 TravelERP System. Tự hào đồng hành cùng các hành trình của bạn.</p>
                </div>
            </footer>
        </div>
    );
};

export default MyBookings;