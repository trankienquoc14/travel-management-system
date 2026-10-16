import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import SepayPaymentModal from './SepayPaymentModal';

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

const calculatePolicyDetails = (booking, reqType) => {
    if (!booking) return null;
    const isPaid = booking.payment_status === 'Paid';
    const totalAmount = Number(booking.total_amount || 0);

    let daysLeft = null;
    if (booking.departure_date) {
        const depDate = new Date(booking.departure_date);
        const today = new Date();
        depDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diff = depDate.getTime() - today.getTime();
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    if (!isPaid) {
        return {
            daysLeft,
            isPaid: false,
            feePercentage: 0,
            feeAmount: 0,
            refundAmount: 0,
            tierLabel: 'Chưa thanh toán (Hủy miễn phí)',
            color: '#16a34a',
            bgColor: '#f0fdf4',
            borderColor: '#bbf7d0',
            description: 'Đơn hàng này chưa thanh toán. Bạn có thể hủy ngay lập tức mà không mất bất kỳ khoản phí nào.'
        };
    }

    const days = daysLeft !== null ? daysLeft : 0;
    let feePercentage = 0;
    let tierLabel = '';
    let color = '#16a34a';
    let bgColor = '#f0fdf4';
    let borderColor = '#bbf7d0';

    if (reqType === 'Cancel') {
        if (days >= 30) {
            feePercentage = 10;
            tierLabel = 'Trước ngày đi ≥ 30 ngày (Khấu trừ 10%)';
            color = '#15803d';
            bgColor = '#f0fdf4';
            borderColor = '#bbf7d0';
        } else if (days >= 15) {
            feePercentage = 30;
            tierLabel = 'Trước ngày đi 15 - 29 ngày (Khấu trừ 30%)';
            color = '#ca8a04';
            bgColor = '#fefce8';
            borderColor = '#fef08a';
        } else if (days >= 7) {
            feePercentage = 50;
            tierLabel = 'Trước ngày đi 7 - 14 ngày (Khấu trừ 50%)';
            color = '#d97706';
            bgColor = '#fffbeb';
            borderColor = '#fde68a';
        } else if (days >= 3) {
            feePercentage = 75;
            tierLabel = 'Trước ngày đi 3 - 6 ngày (Khấu trừ 75%)';
            color = '#ea580c';
            bgColor = '#fff7ed';
            borderColor = '#ffedd5';
        } else {
            feePercentage = 100;
            tierLabel = 'Dưới 3 ngày trước khởi hành (Không hoàn tiền)';
            color = '#dc2626';
            bgColor = '#fef2f2';
            borderColor = '#fecaca';
        }

        const feeAmount = Math.round(totalAmount * (feePercentage / 100));
        const refundAmount = Math.max(0, totalAmount - feeAmount);

        return {
            daysLeft,
            isPaid: true,
            feePercentage,
            feeAmount,
            refundAmount,
            tierLabel,
            color,
            bgColor,
            borderColor
        };
    } else {
        // Reschedule
        let canReschedule = true;
        if (days >= 30) {
            feePercentage = 0;
            tierLabel = 'Trước ngày đi ≥ 30 ngày (Miễn phí 1 lần)';
            color = '#15803d';
            bgColor = '#f0fdf4';
            borderColor = '#bbf7d0';
        } else if (days >= 15) {
            feePercentage = 10;
            tierLabel = 'Trước ngày đi 15 - 29 ngày (Phí đổi 10%)';
            color = '#ca8a04';
            bgColor = '#fefce8';
            borderColor = '#fef08a';
        } else if (days >= 7) {
            feePercentage = 20;
            tierLabel = 'Trước ngày đi 7 - 14 ngày (Phí đổi 20%)';
            color = '#d97706';
            bgColor = '#fffbeb';
            borderColor = '#fde68a';
        } else if (days >= 3) {
            feePercentage = 40;
            tierLabel = 'Trước ngày đi 3 - 6 ngày (Phí đổi 40%)';
            color = '#ea580c';
            bgColor = '#fff7ed';
            borderColor = '#ffedd5';
        } else {
            feePercentage = 100;
            canReschedule = false;
            tierLabel = 'Dưới 3 ngày (Không hỗ trợ đổi ngày)';
            color = '#dc2626';
            bgColor = '#fef2f2';
            borderColor = '#fecaca';
        }

        const feeAmount = Math.round(totalAmount * (feePercentage / 100));

        return {
            daysLeft,
            isPaid: true,
            feePercentage,
            feeAmount,
            refundAmount: 0,
            tierLabel,
            color,
            bgColor,
            borderColor,
            canReschedule
        };
    }
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
                    if (parsed.itineraryDays) {
                        localDays = parsed.itineraryDays;
                    } else if (parsed.days) {
                        localDays = parsed.days.map(d => ({
                            day: d.dayIndex,
                            title: d.route_title || `Ngày ${d.dayIndex}`,
                            description: d.activities ? d.activities.map(a => `• ${a.name}`).join('\n') : ''
                        }));
                    }
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

    const location = useLocation();
    const navigate = useNavigate();
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [requestType, setRequestType] = useState('Cancel');
    const [reason, setReason] = useState('');
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [showPolicyTable, setShowPolicyTable] = useState(false);
    const [refundBankInfo, setRefundBankInfo] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
    const [submitting, setSubmitting] = useState(false);
    const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
    const [sepayModalData, setSepayModalData] = useState(null);

    useEffect(() => {
        fetchMyBookings();
        fetchMyServices();

        const params = new URLSearchParams(location.search);
        const payId = params.get('pay');
        const payType = params.get('type') === 'service' ? 'service' : 'tour';
        if (payId) {
            if (payType === 'service') setViewMode('Service');
            setSepayModalData({ bookingId: Number(payId), type: payType });
            // Xóa query param trên URL để khi F5 không tự bật lại nếu đã đóng
            navigate('/my-bookings', { replace: true });
        }
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
        if (selectedBooking.payment_status === 'Paid' && !agreePolicy) {
            setAlertMsg({ type: 'error', text: 'Vui lòng tích chọn đồng ý với điều kiện tính phí trước khi gửi yêu cầu!' });
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            let fullReason = reason.trim();
            if (requestType === 'Cancel' && selectedBooking.payment_status === 'Paid' && refundBankInfo.accountNumber) {
                fullReason += `\n[Tài khoản nhận hoàn tiền: ${refundBankInfo.bankName || 'Ngân hàng'} - STK: ${refundBankInfo.accountNumber} - Chủ TK: ${refundBankInfo.accountHolder || 'N/A'}]`;
            }
            const payload = {
                booking_id: selectedBooking.booking_id,
                request_type: requestType,
                reason: fullReason
            };
            const res = await axios.post(`${GATEWAY_URL}/api/bookings/change-requests`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.success) {
                setAlertMsg({ type: 'success', text: res.data.message || '🎉 Thao tác xử lý yêu cầu thành công!' });
                setSelectedBooking(null);
                setReason('');
                setAgreePolicy(false);
                setRefundBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
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
                                                        booking.change_request_status === 'Pending' ? (
                                                            <span style={{ 
                                                                padding: '8px 14px', 
                                                                background: '#fef3c7', 
                                                                color: '#b45309', 
                                                                border: '1px solid #fde68a', 
                                                                borderRadius: '12px', 
                                                                fontWeight: '700', 
                                                                fontSize: '12.5px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}>
                                                                ⏳ Chờ duyệt {booking.change_request_type === 'Cancel' ? 'Hủy tour' : 'Đổi lịch'}
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBooking(booking);
                                                                    setRequestType('Cancel');
                                                                    setReason('');
                                                                    setAgreePolicy(false);
                                                                    setRefundBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
                                                                }}
                                                                style={{ padding: '10px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13.5px', transition: 'all 0.2s' }}
                                                            >
                                                                🔄 Hủy / Đổi Lịch
                                                            </button>
                                                        )
                                                    )}

                                                    {booking.payment_status === 'Unpaid' && booking.booking_status !== 'Cancelled' && (
                                                        <button 
                                                            onClick={() => setSepayModalData({ bookingId: booking.booking_id, type: 'tour' })}
                                                            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '13.5px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                        >
                                                            <span>📱 Thanh Toán Qua QR</span>
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
                                                {sb.payment_status === 'Unpaid' && sb.status !== 'Cancelled' && sb.status !== 'Rejected' && (
                                                    <button 
                                                        onClick={() => setSepayModalData({ bookingId: sb.booking_id, type: 'service' })}
                                                        style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '13.5px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        <span>📱 Thanh Toán Qua QR</span>
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
                                <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 24px', background: detailBooking.booking_status === 'Cancelled' ? '#ef4444' : '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-print"></i> {detailBooking.booking_status === 'Cancelled' ? 'Xem Vé (Đã Hủy)' : 'In Vé Điện Tử'}
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
                <div className="printable-modal-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div className="printable-modal-content" style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '800px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div className="no-print" style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>🗺️ Lịch trình</h3>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                    <i className="fas fa-print"></i> In
                                </button>
                                <button onClick={() => {
                                    const element = document.querySelector('.itinerary-print-area');
                                    if (!element) return;
                                    const opt = {
                                        margin: [10, 10, 10, 10],
                                        filename: `Lich-Trinh-${(itineraryModalBooking?.tour_name || 'Tour').replace(/[^a-zA-Z0-9_À-ỹ]/g, '-')}.pdf`,
                                        image: { type: 'jpeg', quality: 0.98 },
                                        html2canvas: { scale: 2, useCORS: true },
                                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                                        pagebreak: { mode: 'css', avoid: '.print-modal-day' }
                                    };
                                    html2pdf().set(opt).from(element).save();
                                }} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                    <i className="fas fa-file-pdf"></i> Tải PDF
                                </button>
                                <button onClick={() => setItineraryModalBooking(null)} style={{ background: 'transparent', border: 'none', fontSize: '28px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                            </div>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
                            {(() => {
                                if (loadingRemote || remoteDays === null) return <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải dữ liệu lịch trình...</div>;
                                const days = remoteDays;
                                if (!days || days.length === 0) return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình.</div>;
                                
                                let depLoc = 'Hồ Chí Minh';
                                let depTime = '06:00 AM';
                                try {
                                    if (itineraryModalBooking.design_data) {
                                        const d = typeof itineraryModalBooking.design_data === 'string' ? JSON.parse(itineraryModalBooking.design_data) : itineraryModalBooking.design_data;
                                        if (d.departureCity) depLoc = d.departureCity;
                                        if (d.startTime) depTime = d.startTime;
                                    } else if (itineraryModalBooking.requirements) {
                                        const r = typeof itineraryModalBooking.requirements === 'string' ? JSON.parse(itineraryModalBooking.requirements) : itineraryModalBooking.requirements;
                                        if (r.departureCity) depLoc = r.departureCity;
                                        if (r.startTime) depTime = r.startTime;
                                    }
                                } catch(e) {}

                                return (
                                    <div className="itinerary-print-area" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                        {/* Brand Header (Prints beautifully) */}
                                        <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px dashed #e2e8f0' }}>
                                            <h1 style={{ margin: '0', fontSize: '32px', fontWeight: '900', color: '#3b82f6', letterSpacing: '-1px' }}>Travel<span style={{ color: '#0f172a' }}>VN</span></h1>
                                            <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>Hành Trình Chi Tiết</p>
                                            <h2 style={{ margin: '16px 0 0 0', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{itineraryModalBooking.tour_name}</h2>
                                        </div>
                                        {/* Overview Card */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                                                    <i className="far fa-calendar-alt"></i>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Khởi hành</div>
                                                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{depTime} <br/> <span style={{ color: '#3b82f6' }}>{formatDate(itineraryModalBooking.departure_date)}</span></div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                                                    <i className="fas fa-map-marker-alt"></i>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Xuất phát</div>
                                                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{depLoc}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                                                    <i className="far fa-clock"></i>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Thời lượng</div>
                                                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{itineraryModalBooking.duration_days} ngày</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fdf4ff', color: '#d946ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                                                    <i className="fas fa-route"></i>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Điểm đến</div>
                                                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{itineraryModalBooking.destination || 'Nhiều điểm'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Itinerary Cards (No vertical connecting lines for seamless printing) */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '16px' }}>
                                            {days.map((day, idx) => {
                                                const cleanTitle = (day.title || `Ngày ${day.day}`).replace(new RegExp(`^Ngày ${day.day}:\\s*`), '').replace(new RegExp(`^Ngày ${day.day}\\s*`), '');
                                                return (
                                                    <div key={idx} className="print-modal-day" style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
                                                        
                                                        {/* Header of the Card */}
                                                        <div style={{ background: 'linear-gradient(to right, #eff6ff, #ffffff)', padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                                            {/* Day Badge */}
                                                            <div style={{ background: '#3b82f6', color: '#fff', padding: '10px 24px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                                                                NGÀY {day.day}
                                                            </div>
                                                            
                                                            {/* Title */}
                                                            <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800', flex: 1, minWidth: '200px' }}>
                                                                {cleanTitle}
                                                            </h4>

                                                            {/* Watermark */}
                                                            <div style={{ fontSize: '50px', fontWeight: '900', color: '#e2e8f0', lineHeight: 1, userSelect: 'none' }}>
                                                                {String(day.day).padStart(2, '0')}
                                                            </div>
                                                        </div>

                                                        {/* Content of the Card */}
                                                        <div style={{ padding: '32px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                                {day.description.split('\n').filter(line => line.trim() !== '').map((line, lIdx) => (
                                                                    <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                                                        <div style={{ marginTop: '4px', minWidth: '28px', height: '28px', borderRadius: '50%', background: '#f8fafc', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                                                        </div>
                                                                        <div style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', paddingTop: '3px' }}>
                                                                            {line.replace(/^•\s*/, '').replace(/^-\s*/, '')}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: E-TICKET DOWNLOAD MODAL */}
            {ticketBooking && (
                <div className="printable-modal-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div className="printable-modal-content" style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '100vh', overflowY: 'auto', padding: '20px' }}>
                        
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

                                const isCancelled = ticketBooking.booking_status === 'Cancelled';

                                return (
                                    <React.Fragment key={idx}>
                                        {idx > 0 && idx % 2 === 0 && <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', height: '0', margin: '0' }}></div>}
                                        <div className="print-modal" style={{ display: 'flex', background: '#fff', borderRadius: '20px', overflow: 'hidden', width: '100%', maxWidth: '800px', margin: '0 auto 32px auto', border: isCancelled ? '2px solid #f87171' : '2px solid #cbd5e1', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', position: 'relative' }}>
                                        
                                        {/* CON DẤU THỦY ẤN VÉ ĐÃ HỦY */}
                                        {isCancelled && (
                                            <div style={{
                                                position: 'absolute', top: '50%', left: '40%',
                                                transform: 'translate(-50%, -50%) rotate(-20deg)',
                                                border: '4px solid #ef4444', color: '#b91c1c',
                                                padding: '12px 30px', borderRadius: '14px',
                                                fontSize: '28px', fontWeight: '900', letterSpacing: '3px',
                                                textTransform: 'uppercase', opacity: 0.9, pointerEvents: 'none',
                                                background: 'rgba(254, 242, 242, 0.95)', zIndex: 10,
                                                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.25)'
                                            }}>
                                                🚫 VÉ ĐÃ HỦY / VOID
                                            </div>
                                        )}

                                        {/* Left Side */}
                                        <div style={{ width: '560px', padding: '32px 36px', display: 'flex', flexDirection: 'column', background: isCancelled ? '#fafafa' : '#ffffff', opacity: isCancelled ? 0.75 : 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                                <div>
                                                    <div style={{ fontSize: '30px', fontWeight: '900', color: isCancelled ? '#64748b' : '#3b82f6', letterSpacing: '-0.5px', lineHeight: 1 }}>TravelVN</div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', letterSpacing: '1.2px', marginTop: '6px' }}>E-TICKET PASS</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>HẠNG VÉ / CLASS</div>
                                                    <div style={{ fontSize: '18px', color: isCancelled ? '#dc2626' : '#0f172a', fontWeight: '900' }}>
                                                        {isCancelled ? 'VOID (ĐÃ HỦY)' : 'STANDARD'}
                                                    </div>
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
                                        <div style={{ width: '240px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isCancelled ? '#fef2f2' : '#f8fafc', boxSizing: 'border-box' }}>
                                            <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '16px', position: 'relative' }}>
                                                {isCancelled ? (
                                                    <div style={{
                                                        width: '130px', height: '130px', display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', justifyContent: 'center', background: '#fee2e2',
                                                        borderRadius: '8px', border: '2px dashed #f87171', padding: '10px', boxSizing: 'border-box'
                                                    }}>
                                                        <div style={{ fontSize: '32px', marginBottom: '4px' }}>🚫</div>
                                                        <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '900', textAlign: 'center', lineHeight: 1.2 }}>
                                                            QR VÔ HIỆU HÓA
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', marginTop: '4px', fontWeight: '600' }}>
                                                            Vé đã bị hủy
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BKG-${ticketBooking.booking_id}-PAX-${idx}`} alt="QR Code" style={{ width: '130px', height: '130px', display: 'block' }} />
                                                )}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>MÃ ĐẶT CHỖ / PNR</div>
                                            <div style={{ fontSize: '28px', color: isCancelled ? '#94a3b8' : '#0f172a', textDecoration: isCancelled ? 'line-through' : 'none', fontWeight: '900', marginBottom: '16px' }}>#{ticketBooking.booking_id}-{idx + 1}</div>
                                            {isCancelled ? (
                                                <div style={{ padding: '6px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '24px', fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid #fca5a5' }}>
                                                    🚫 VÉ ĐÃ HỦY
                                                </div>
                                            ) : (
                                                <div style={{ padding: '6px 16px', background: '#dcfce7', color: '#166534', borderRadius: '24px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    ĐÃ THANH TOÁN
                                                </div>
                                            )}
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

            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH & BẢNG TÍNH TIỀN CẢNH BÁO */}
            {selectedBooking && (() => {
                const policy = calculatePolicyDetails(selectedBooking, requestType);
                return (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', width: '640px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
                            
                            {/* Close Button */}
                            <button
                                onClick={() => { setSelectedBooking(null); setAgreePolicy(false); }}
                                style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', color: '#64748b', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                ✕
                            </button>

                            {/* Header */}
                            <div style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
                                    🛡️ CHÍNH SÁCH BẢO VỆ KHÁCH HÀNG & MINH BẠCH TÀI CHÍNH
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>
                                    {requestType === 'Cancel' ? '❌ Yêu Cầu Hủy Tour & Hoàn Tiền' : '🔄 Yêu Cầu Thay Đổi Lịch Khởi Hành'}
                                </h3>
                                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                    Đơn hàng <strong>#BKG-{selectedBooking.booking_id.toString().padStart(4, '0')}</strong> • {selectedBooking.tour_name}
                                </p>
                            </div>

                            {/* Tab chuyển Loại Yêu Cầu */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setRequestType('Cancel'); setAgreePolicy(false); }}
                                    style={{
                                        flex: 1, padding: '12px', border: `2px solid ${requestType === 'Cancel' ? '#ef4444' : '#e2e8f0'}`,
                                        borderRadius: '14px', cursor: 'pointer', textAlign: 'center', fontWeight: '800', fontSize: '14px',
                                        color: requestType === 'Cancel' ? '#dc2626' : '#64748b',
                                        backgroundColor: requestType === 'Cancel' ? '#fef2f2' : '#ffffff',
                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <span>❌ Xin Hủy Tour</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setRequestType('Reschedule'); setAgreePolicy(false); }}
                                    style={{
                                        flex: 1, padding: '12px', border: `2px solid ${requestType === 'Reschedule' ? '#2563eb' : '#e2e8f0'}`,
                                        borderRadius: '14px', cursor: 'pointer', textAlign: 'center', fontWeight: '800', fontSize: '14px',
                                        color: requestType === 'Reschedule' ? '#2563eb' : '#64748b',
                                        backgroundColor: requestType === 'Reschedule' ? '#eff6ff' : '#ffffff',
                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <span>🔄 Xin Đổi Ngày Đi</span>
                                </button>
                            </div>

                            {/* FORM TÍNH TIỀN & CẢNH BÁO TÀI CHÍNH TỰ ĐỘNG */}
                            <div style={{
                                backgroundColor: policy.bgColor,
                                border: `1.5px solid ${policy.borderColor}`,
                                borderRadius: '16px',
                                padding: '20px',
                                marginBottom: '20px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            THỜI GIAN ĐẾN NGÀY KHỞI HÀNH
                                        </span>
                                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>📅 {formatDate(selectedBooking.departure_date)}</span>
                                            {policy.daysLeft !== null && (
                                                <span style={{
                                                    fontSize: '12.5px', padding: '3px 10px', borderRadius: '20px',
                                                    backgroundColor: policy.daysLeft >= 15 ? '#dcfce7' : (policy.daysLeft >= 7 ? '#fef3c7' : '#fee2e2'),
                                                    color: policy.daysLeft >= 15 ? '#15803d' : (policy.daysLeft >= 7 ? '#b45309' : '#b91c1c'),
                                                    fontWeight: '800'
                                                }}>
                                                    ⏱️ Còn {policy.daysLeft} ngày
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '6px 12px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '800',
                                        backgroundColor: '#ffffff', color: policy.color, border: `1px solid ${policy.borderColor}`
                                    }}>
                                        {policy.tierLabel}
                                    </div>
                                </div>

                                {/* BẢNG TÍNH TIỀN QUYẾT TOÁN */}
                                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '14px' }}>
                                        <span style={{ color: '#64748b' }}>Tổng giá trị đơn hàng:</span>
                                        <strong style={{ color: '#0f172a', fontSize: '15px' }}>{formatCurrency(selectedBooking.total_amount)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                                        <span style={{ color: '#64748b' }}>
                                            Phí khấu trừ quy định ({policy.feePercentage}%):
                                        </span>
                                        <strong style={{ color: policy.feePercentage > 0 ? '#dc2626' : '#16a34a', fontSize: '15px' }}>
                                            {policy.feePercentage > 0 ? `-${formatCurrency(policy.feeAmount)}` : 'Miễn phí (0 ₫)'}
                                        </strong>
                                    </div>

                                    {/* KẾT QUẢ CUỐI CÙNG NỔI BẬT */}
                                    {requestType === 'Cancel' ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                                            <div>
                                                <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '800', textTransform: 'uppercase', display: 'block' }}>
                                                    💵 SỐ TIỀN DỰ KIẾN HOÀN LẠI:
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                    {selectedBooking.payment_status === 'Paid' ? '(Kế toán hoàn trả vào STK của bạn)' : '(Đơn chưa thanh toán - Miễn phí)'}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '24px', fontWeight: '900', color: '#16a34a', letterSpacing: '-0.5px' }}>
                                                {formatCurrency(policy.refundAmount)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                                            <div>
                                                <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase', display: 'block' }}>
                                                    🔄 PHÍ PHỤ THU ĐỔI LỊCH:
                                                </span>
                                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                    (Áp dụng khi chuyển sang ngày mới)
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '22px', fontWeight: '900', color: policy.feeAmount > 0 ? '#2563eb' : '#16a34a' }}>
                                                {policy.feeAmount > 0 ? formatCurrency(policy.feeAmount) : 'MIỄN PHÍ (0 ₫)'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* LƯU Ý QUAN TRỌNG VỀ MÃ QR VÀ VÉ */}
                                {requestType === 'Cancel' && (
                                    <div style={{ fontSize: '12px', color: '#991b1b', lineHeight: 1.5, background: '#fee2e2', padding: '10px 12px', borderRadius: '8px' }}>
                                        ⚠️ <strong>Cảnh báo hủy vé:</strong> Sau khi đơn hủy được phê duyệt, vé điện tử và <strong>toàn bộ mã QR Check-in sẽ bị vô hiệu hóa hoàn toàn</strong>, không thể sử dụng để lên xe/máy bay.
                                    </div>
                                )}
                            </div>

                            {/* ACCORDION XEM TOÀN BỘ CHÍNH SÁCH */}
                            <div style={{ marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPolicyTable(!showPolicyTable)}
                                    style={{
                                        width: '100%', padding: '10px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                                        borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#334155'
                                    }}
                                >
                                    <span>📖 Bảng chi tiết mốc quy định tính phí Hủy & Đổi Lịch Tour</span>
                                    <span>{showPolicyTable ? '▲ Thu gọn' : '▼ Xem chi tiết'}</span>
                                </button>

                                {showPolicyTable && (
                                    <div style={{ marginTop: '10px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', fontSize: '12.5px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: '700' }}>
                                                    <th style={{ padding: '10px 12px' }}>Thời Điểm Gửi Yêu Cầu</th>
                                                    <th style={{ padding: '10px 12px', color: '#dc2626' }}>Phí Hủy Tour</th>
                                                    <th style={{ padding: '10px 12px', color: '#16a34a' }}>Tiền Hoàn Lại</th>
                                                    <th style={{ padding: '10px 12px', color: '#2563eb' }}>Phí Đổi Lịch</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: policy.daysLeft >= 30 ? '#f0fdf4' : '#fff' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>Trước ≥ 30 ngày</td>
                                                    <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: '700' }}>10%</td>
                                                    <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '700' }}>Hoàn 90%</td>
                                                    <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '700' }}>Miễn phí 0%</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: (policy.daysLeft >= 15 && policy.daysLeft < 30) ? '#fefce8' : '#fafafa' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>Từ 15 – 29 ngày</td>
                                                    <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: '700' }}>30%</td>
                                                    <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '700' }}>Hoàn 70%</td>
                                                    <td style={{ padding: '10px 12px', color: '#2563eb', fontWeight: '700' }}>10%</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: (policy.daysLeft >= 7 && policy.daysLeft < 15) ? '#fffbeb' : '#fff' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>Từ 7 – 14 ngày</td>
                                                    <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: '700' }}>50%</td>
                                                    <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '700' }}>Hoàn 50%</td>
                                                    <td style={{ padding: '10px 12px', color: '#2563eb', fontWeight: '700' }}>20%</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: (policy.daysLeft >= 3 && policy.daysLeft < 7) ? '#fff7ed' : '#fafafa' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>Từ 3 – 6 ngày</td>
                                                    <td style={{ padding: '10px 12px', color: '#dc2626', fontWeight: '700' }}>75%</td>
                                                    <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: '700' }}>Hoàn 25%</td>
                                                    <td style={{ padding: '10px 12px', color: '#2563eb', fontWeight: '700' }}>40%</td>
                                                </tr>
                                                <tr style={{ backgroundColor: (policy.daysLeft !== null && policy.daysLeft < 3) ? '#fef2f2' : '#fff' }}>
                                                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>Dưới 3 ngày (&lt; 72h)</td>
                                                    <td style={{ padding: '10px 12px', color: '#b91c1c', fontWeight: '800' }}>100%</td>
                                                    <td style={{ padding: '10px 12px', color: '#b91c1c', fontWeight: '800' }}>Không hoàn tiền</td>
                                                    <td style={{ padding: '10px 12px', color: '#64748b' }}>Không hỗ trợ đổi</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendChangeRequest}>
                                {/* THÔNG TIN TÀI KHOẢN NHẬN TIỀN HOÀN (CHỈ HIỆN KHI HỦY & ĐÃ THANH TOÁN & CÓ TIỀN HOÀN) */}
                                {requestType === 'Cancel' && selectedBooking.payment_status === 'Paid' && policy.refundAmount > 0 && (
                                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            🏦 Thông Tin Tài Khoản Nhận Tiền Hoàn Lại
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Tên Ngân Hàng (VD: Vietcombank, MB...):</label>
                                                <input
                                                    type="text"
                                                    placeholder="VD: Vietcombank"
                                                    value={refundBankInfo.bankName}
                                                    onChange={(e) => setRefundBankInfo({ ...refundBankInfo, bankName: e.target.value })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Số Tài Khoản Nhận Tiền:</label>
                                                <input
                                                    type="text"
                                                    placeholder="VD: 1012345678"
                                                    value={refundBankInfo.accountNumber}
                                                    onChange={(e) => setRefundBankInfo({ ...refundBankInfo, accountNumber: e.target.value })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Tên Chủ Tài Khoản (In hoa không dấu):</label>
                                            <input
                                                type="text"
                                                placeholder="VD: NGUYEN VAN A"
                                                value={refundBankInfo.accountHolder}
                                                onChange={(e) => setRefundBankInfo({ ...refundBankInfo, accountHolder: e.target.value.toUpperCase() })}
                                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* LÝ DO CHI TIẾT */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                                        {requestType === 'Cancel' ? 'Lý do hủy tour chi tiết:' : 'Ngày khởi hành mong muốn mới & Lý do đổi:'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder={requestType === 'Cancel' ? 'Nhập lý do bạn muốn hủy chuyến đi...' : 'Ví dụ: Tôi muốn dời lịch sang ngày 25/11 do có việc bận đột xuất...'}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* CHECKBOX CAM KẾT & ĐỒNG Ý CHÍNH SÁCH */}
                                {selectedBooking.payment_status === 'Paid' && (
                                    <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#1e293b', lineHeight: 1.5 }}>
                                            <input
                                                type="checkbox"
                                                checked={agreePolicy}
                                                onChange={(e) => setAgreePolicy(e.target.checked)}
                                                style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#0f172a', cursor: 'pointer' }}
                                            />
                                            <span>
                                                <strong>Tôi xác nhận đã đọc, hiểu rõ mức phí khấu trừ {policy.feePercentage}% ({formatCurrency(policy.feeAmount)})</strong> và đồng ý với chính sách xử lý của công ty du lịch.
                                            </span>
                                        </label>
                                    </div>
                                )}

                                {/* ACTION BUTTONS */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedBooking(null); setAgreePolicy(false); }}
                                        style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                                    >
                                        Đóng lại
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || (selectedBooking.payment_status === 'Paid' && !agreePolicy)}
                                        style={{
                                            padding: '12px 26px',
                                            backgroundColor: (selectedBooking.payment_status === 'Paid' && !agreePolicy) ? '#94a3b8' : (requestType === 'Cancel' ? '#dc2626' : '#2563eb'),
                                            color: '#fff', border: 'none', borderRadius: '12px',
                                            cursor: (selectedBooking.payment_status === 'Paid' && !agreePolicy) ? 'not-allowed' : 'pointer',
                                            fontWeight: '800', fontSize: '14px',
                                            boxShadow: (selectedBooking.payment_status === 'Paid' && !agreePolicy) ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        {submitting ? 'Đang gửi...' : (
                                            requestType === 'Cancel'
                                                ? `Xác Nhận Hủy Tour ${policy.refundAmount > 0 ? `(Hoàn ${formatCurrency(policy.refundAmount)})` : ''}`
                                                : 'Xác Nhận Gửi Yêu Cầu Đổi Lịch'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {/* MODAL 5: CỔNG THANH TOÁN REALTIME SEPAY */}
            {sepayModalData && (
                <SepayPaymentModal
                    bookingId={sepayModalData.bookingId}
                    type={sepayModalData.type}
                    onClose={() => {
                        setSepayModalData(null);
                        fetchMyBookings();
                        fetchMyServices();
                    }}
                    onSuccess={() => {
                        setAlertMsg({
                            type: 'success',
                            text: `🎉 Thanh toán thành công qua SePay Realtime! Đơn hàng #${sepayModalData.bookingId} đã được tự động xác nhận.`
                        });
                        fetchMyBookings();
                        fetchMyServices();
                    }}
                    onViewTicket={async (bId) => {
                        setSepayModalData(null);
                        try {
                            const token = localStorage.getItem('token');
                            const res = await axios.get(`${GATEWAY_URL}/api/bookings/my-bookings`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const list = res.data?.data || [];
                            setBookings(list);
                            const found = list.find(b => Number(b.booking_id) === Number(bId));
                            if (found) setTicketBooking(found);
                        } catch (e) {
                            console.error('Lỗi mở vé điện tử:', e);
                        }
                    }}
                    onViewDetail={async (bId) => {
                        setSepayModalData(null);
                        try {
                            const token = localStorage.getItem('token');
                            if (sepayModalData.type === 'service') {
                                const res = await axios.get(`${GATEWAY_URL}/api/bookings/my-services`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                const list = res.data?.data || [];
                                setServiceBookings(list);
                                const found = list.find(s => Number(s.booking_id) === Number(bId));
                                if (found) setDetailBooking({ ...found, isService: true });
                            } else {
                                const res = await axios.get(`${GATEWAY_URL}/api/bookings/my-bookings`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                const list = res.data?.data || [];
                                setBookings(list);
                                const found = list.find(b => Number(b.booking_id) === Number(bId));
                                if (found) setDetailBooking(found);
                            }
                        } catch (e) {
                            console.error('Lỗi mở chi tiết đơn hàng:', e);
                        }
                    }}
                />
            )}

            <CustomerFooter />
        </div>
    );
};

export default MyBookings;