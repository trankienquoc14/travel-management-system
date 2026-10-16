import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const SepayPaymentModal = ({ 
    bookingId, 
    type = 'tour', 
    onClose, 
    onSuccess, 
    onViewTicket, 
    onViewDetail 
}) => {
    const [loading, setLoading] = useState(true);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [isPaid, setIsPaid] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [matchedTx, setMatchedTx] = useState(null);
    const [copiedField, setCopiedField] = useState('');
    const [countdown, setCountdown] = useState(600); // 10 phút = 600 giây
    const [qrImgError, setQrImgError] = useState(false);

    const pollIntervalRef = useRef(null);
    const timerIntervalRef = useRef(null);

    const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN') + ' ₫';

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(String(text));
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(''), 2000);
    };

    // 1. Tải thông tin thanh toán từ Backend
    useEffect(() => {
        if (!bookingId) return;
        const fetchQrData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await axios.get(`${GATEWAY_URL}/api/bookings/${bookingId}/sepay-qr?type=${type}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.success) {
                    const data = res.data.data;
                    setPaymentInfo(data);

                    if (data.payment_status === 'Paid') {
                        setIsPaid(true);
                        return;
                    }

                    if (data.booking_status === 'Cancelled') {
                        setIsExpired(true);
                        return;
                    }

                    // Tính thời gian đếm ngược chính xác dựa trên thời điểm tạo đơn (tối đa 10 phút = 600s)
                    let initialCountdown = 600;
                    if (data.created_at) {
                        const createdAtTime = new Date(data.created_at).getTime();
                        if (!isNaN(createdAtTime)) {
                            const elapsed = Math.floor((Date.now() - createdAtTime) / 1000);
                            if (elapsed >= 0 && elapsed < 600) {
                                initialCountdown = 600 - elapsed;
                            } else if (elapsed >= 600) {
                                setCountdown(0);
                                handleAutoCancel();
                                return;
                            }
                        }
                    }
                    setCountdown(initialCountdown);
                }
            } catch (err) {
                console.error('Lỗi tải thông tin thanh toán SePay:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQrData();
    }, [bookingId, type]);

    // 2. Tự động hủy đơn hàng khi hết 10 phút
    const handleAutoCancel = async () => {
        setIsExpired(true);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${GATEWAY_URL}/api/bookings/${bookingId}/cancel-expired?type=${type}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`⏱️ Đã tự động hủy đơn #${bookingId} do hết hạn 10 phút.`);
        } catch (err) {
            console.warn('Lỗi auto cancel đơn:', err.message);
        }
    };

    // 3. Đếm ngược 10 phút (mỗi giây)
    useEffect(() => {
        if (isPaid || isExpired || loading) return;

        timerIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerIntervalRef.current);
                    handleAutoCancel();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isPaid, isExpired, loading]);

    // 4. Polling kiểm tra trạng thái thanh toán Realtime mỗi 3 giây
    const checkTransactionStatus = async () => {
        if (!bookingId || isPaid || isExpired) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${GATEWAY_URL}/api/bookings/${bookingId}/check-sepay?type=${type}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.paid) {
                setIsPaid(true);
                if (res.data.transaction) {
                    setMatchedTx(res.data.transaction);
                }
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                if (onSuccess) {
                    onSuccess(res.data);
                }
            }
        } catch (err) {
            console.error('Lỗi kiểm tra trạng thái SePay:', err);
        }
    };

    useEffect(() => {
        if (!bookingId || isPaid || isExpired || loading) return;

        const initTimer = setTimeout(() => {
            checkTransactionStatus();
        }, 1500);

        pollIntervalRef.current = setInterval(() => {
            checkTransactionStatus();
        }, 3000);

        return () => {
            clearTimeout(initTimer);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [bookingId, type, isPaid, isExpired, loading]);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!bookingId) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100000, padding: '16px', fontFamily: '"Inter", "Outfit", system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '840px',
                maxHeight: '94vh', overflowY: 'auto',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                display: 'flex', flexDirection: 'column', position: 'relative'
            }}>
                {/* NÚT ĐÓNG GÓC TRÊN BÊN PHẢI (THANH LỊCH) */}
                <button
                    onClick={onClose}
                    title="Đóng cửa sổ"
                    style={{
                        position: 'absolute', top: '18px', right: '18px',
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: '1px solid #e2e8f0', background: '#f8fafc',
                        color: '#64748b', fontSize: '16px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10, transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                >
                    ✕
                </button>

                {/* NỘI DUNG MODAL */}
                {loading ? (
                    <div style={{ padding: '70px 30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '14px' }}>⏳</div>
                        <div style={{ color: '#0284c7', fontWeight: '800', fontSize: '18px', marginBottom: '6px' }}>
                            Đang tạo mã QR thanh toán ngân hàng...
                        </div>
                        <div style={{ color: '#64748b', fontSize: '14px' }}>
                            Kết nối cổng SePay Realtime cho đơn hàng của bạn
                        </div>
                    </div>
                ) : !paymentInfo ? (
                    <div style={{ padding: '60px 30px', textAlign: 'center', color: '#dc2626' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                        <div style={{ fontSize: '17px', fontWeight: '700' }}>Không tìm thấy thông tin đơn hàng!</div>
                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Vui lòng kiểm tra lại danh sách đơn hàng của bạn.</p>
                        <button onClick={onClose} style={{ marginTop: '16px', padding: '10px 24px', background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                            Quay lại
                        </button>
                    </div>
                ) : isExpired ? (
                    /* MÀN HÌNH ĐƠN HÀNG HẾT HẠN 10 PHÚT */
                    <div style={{ padding: '52px 32px', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: '#fee2e2', color: '#dc2626', fontSize: '38px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 18px auto', boxShadow: '0 8px 24px rgba(220, 38, 38, 0.15)'
                        }}>
                            ⏱️
                        </div>
                        <span style={{
                            background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
                            padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800',
                            letterSpacing: '0.5px', textTransform: 'uppercase'
                        }}>
                            Hết Hạn Giữ Chỗ (Quá 10 Phút)
                        </span>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '16px 0 10px 0' }}>
                            Đơn Hàng Đã Tự Động Hủy
                        </h2>
                        <p style={{ color: '#475569', fontSize: '14.5px', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                            Thời gian thanh toán 10 phút cho đơn <strong>{paymentInfo.order_code}</strong> ({paymentInfo.order_title}) đã kết thúc. Để đảm bảo chỗ trống cho khách hàng khác, hệ thống đã tự động hủy đơn và giải phóng vé.
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '12px 28px', borderRadius: '12px', border: 'none',
                                background: '#0f172a', color: '#fff', fontSize: '15px',
                                fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)'
                            }}
                        >
                            Quay Lại Danh Sách Đơn Hàng
                        </button>
                    </div>
                ) : isPaid ? (
                    /* MÀN HÌNH THANH TOÁN THÀNH CÔNG VỚI LỜI CẢM ƠN */
                    <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                        <div style={{
                            width: '84px', height: '84px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff', fontSize: '42px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto',
                            boxShadow: '0 12px 28px rgba(16, 185, 129, 0.3)'
                        }}>
                            ✓
                        </div>
                        <span style={{
                            background: '#dcfce7', color: '#166534', padding: '5px 16px',
                            borderRadius: '20px', fontSize: '12px', fontWeight: '800',
                            letterSpacing: '0.5px', textTransform: 'uppercase'
                        }}>
                            ⚡ Xác nhận tự động bởi SePay Realtime
                        </span>
                        
                        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '14px 0 10px 0' }}>
                            Thanh Toán Đơn Hàng Thành Công!
                        </h2>

                        {/* Lời cảm ơn trang trọng */}
                        <div style={{
                            maxWidth: '600px', margin: '0 auto 24px auto', background: '#f0fdf4',
                            border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px 20px',
                            color: '#166534', fontSize: '14.5px', lineHeight: 1.6
                        }}>
                            ❤️ <strong>Cảm ơn Quý khách {paymentInfo.customer_name}</strong> đã tin tưởng và đồng hành cùng <strong>TravelERP</strong>! Khoản thanh toán cho đơn hàng <strong>{paymentInfo.order_code}</strong> ({paymentInfo.order_title}) đã được ghi nhận thành công.
                        </div>

                        {/* Thẻ tóm tắt biên lai giao dịch */}
                        <div style={{
                            maxWidth: '540px', margin: '0 auto 28px auto', background: '#f8fafc',
                            borderRadius: '18px', padding: '18px 22px', border: '1px solid #e2e8f0',
                            textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Mã đơn hàng:</span>
                                <strong style={{ color: '#0f172a' }}>{paymentInfo.order_code}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Dịch vụ / Tour:</span>
                                <strong style={{ color: '#0f172a', maxWidth: '300px', textAlign: 'right' }}>{paymentInfo.order_title}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Số tiền đã thanh toán:</span>
                                <strong style={{ color: '#059669', fontSize: '16px' }}>{formatCurrency(paymentInfo.amount)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Tài khoản nhận:</span>
                                <strong style={{ color: '#0f172a' }}>{paymentInfo.bank.accountName} - {paymentInfo.bank.accountNumber} ({paymentInfo.bank.bankName})</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Mã đối soát:</span>
                                <strong style={{ color: '#2563eb' }}>{matchedTx?.content || paymentInfo.transfer_content}</strong>
                            </div>
                            {matchedTx?.reference_number && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Mã tham chiếu ngân hàng:</span>
                                    <strong style={{ color: '#0f172a' }}>{matchedTx.reference_number}</strong>
                                </div>
                            )}
                        </div>

                        {/* Nút hành động xem vé điện tử và chi tiết đơn hàng */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => {
                                    if (onViewTicket) onViewTicket(paymentInfo.booking_id);
                                    else onClose();
                                }}
                                style={{
                                    padding: '13px 26px', borderRadius: '14px', border: 'none',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                                    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <span>🎫 Xem Vé Điện Tử & In Vé</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (onViewDetail) onViewDetail(paymentInfo.booking_id);
                                    else onClose();
                                }}
                                style={{
                                    padding: '13px 24px', borderRadius: '14px', border: '1px solid #cbd5e1',
                                    background: '#ffffff', color: '#1e293b', fontSize: '15px', fontWeight: '800',
                                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <span>📋 Xem Chi Tiết Đơn Hàng</span>
                            </button>

                            <button
                                onClick={onClose}
                                style={{
                                    padding: '13px 20px', borderRadius: '14px', border: 'none',
                                    background: '#f1f5f9', color: '#64748b', fontSize: '14.5px', fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                ) : (
                    /* GIAO DIỆN CHỜ THANH TOÁN QR HIỆN ĐẠI, TINH TẾ, VUÔNG VẮN */
                    <div style={{ padding: '28px 32px 30px 32px' }}>
                        {/* 1. KHỐI TÓM TẮT ĐƠN HÀNG & THỜI GIAN GIỮ CHỖ LIỀN KHỐI */}
                        <div style={{
                            background: '#f8fafc', borderRadius: '18px', padding: '16px 20px',
                            border: '1px solid #e2e8f0', marginBottom: '22px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            flexWrap: 'wrap', gap: '14px'
                        }}>
                            <div style={{ flex: '1', minWidth: '280px', paddingRight: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                                        {paymentInfo.order_code}
                                    </span>
                                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                                        Khách hàng: <strong style={{ color: '#0f172a' }}>{paymentInfo.customer_name}</strong>
                                    </span>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', lineHeight: 1.4 }}>
                                    {paymentInfo.order_title}
                                </div>
                            </div>

                            {/* Đồng hồ đếm ngược 10 phút */}
                            <div style={{
                                background: countdown <= 120 ? '#fef2f2' : '#ffffff',
                                border: countdown <= 120 ? '1.5px solid #f87171' : '1.5px solid #fde68a',
                                borderRadius: '14px', padding: '8px 18px', textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: countdown <= 120 ? '#b91c1c' : '#b45309', textTransform: 'uppercase' }}>
                                    ⏱️ THỜI GIAN GIỮ CHỖ
                                </div>
                                <div style={{
                                    fontSize: '22px', fontWeight: '900',
                                    color: countdown <= 120 ? '#dc2626' : '#d97706',
                                    letterSpacing: '1px', fontFamily: 'monospace', lineHeight: 1.2, marginTop: '2px'
                                }}>
                                    {formatTime(countdown)}
                                </div>
                                <div style={{ fontSize: '10.5px', color: countdown <= 120 ? '#dc2626' : '#94a3b8', marginTop: '2px' }}>
                                    Tự hủy nếu quá 10 phút
                                </div>
                            </div>
                        </div>

                        {/* 2. GRID 2 CỘT CÂN ĐỐI (TRÁI: QR CODE - PHẢI: THÔNG TIN CHUYỂN KHOẢN) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px', alignItems: 'stretch' }}>
                            {/* CỘT TRÁI: KHUNG MÃ QR */}
                            <div style={{
                                background: '#ffffff', borderRadius: '20px', padding: '20px',
                                border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between'
                            }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: '12px' }}>
                                    📱 Quét mã bằng App Ngân Hàng / MoMo / ZaloPay
                                </div>

                                {/* Khung chứa ảnh QR */}
                                <div style={{
                                    background: '#ffffff', padding: '14px', borderRadius: '18px',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: '2px solid #e2e8f0',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                                }}>
                                    <img
                                        src={qrImgError ? paymentInfo.vietqr_url : paymentInfo.qr_url}
                                        onError={() => setQrImgError(true)}
                                        alt="VietQR Code"
                                        style={{ width: '230px', height: '230px', objectFit: 'contain', display: 'block' }}
                                    />
                                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>✓</span> Đã tích hợp sẵn số tiền & nội dung đơn
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '14px' }}>
                                    <a
                                        href={paymentInfo.qr_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            flex: 1, padding: '10px 14px', borderRadius: '12px',
                                            background: '#f8fafc', color: '#2563eb', border: '1px solid #cbd5e1',
                                            fontWeight: '700', fontSize: '12.5px', textAlign: 'center',
                                            textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}
                                    >
                                        🔍 Tải ảnh QR
                                    </a>
                                    <a
                                        href={paymentInfo.deeplink_base}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            flex: 1, padding: '10px 14px', borderRadius: '12px',
                                            background: '#0f172a', color: '#ffffff', border: 'none',
                                            fontWeight: '700', fontSize: '12.5px', textDecoration: 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                        }}
                                    >
                                        🏦 Mở App NH ➔
                                    </a>
                                </div>
                            </div>

                            {/* CỘT PHẢI: 3 KHỐI THÔNG TIN CHUYỂN KHOẢN VUÔNG VẮN */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'space-between' }}>
                                {/* 1. Số tiền thanh toán */}
                                <div style={{
                                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                                    borderRadius: '16px', padding: '14px 18px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#166534', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                            SỐ TIỀN THANH TOÁN (CHÍNH XÁC)
                                        </div>
                                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669', letterSpacing: '0.3px', marginTop: '2px' }}>
                                            {formatCurrency(paymentInfo.amount)}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(paymentInfo.amount, 'amount')}
                                        style={{
                                            padding: '8px 14px', borderRadius: '10px', border: '1px solid #86efac',
                                            background: copiedField === 'amount' ? '#10b981' : '#ffffff',
                                            color: copiedField === 'amount' ? '#ffffff' : '#166534',
                                            fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', transition: 'all 0.15s'
                                        }}
                                    >
                                        {copiedField === 'amount' ? '✓ Đã chép' : '📋 Sao chép'}
                                    </button>
                                </div>

                                {/* 2. Nội dung chuyển khoản */}
                                <div style={{
                                    background: '#fffbeb', border: '2px dashed #f59e0b',
                                    borderRadius: '16px', padding: '14px 18px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#b45309', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                            NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC ĐÚNG)
                                        </div>
                                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#d97706', letterSpacing: '0.5px', fontFamily: 'monospace', marginTop: '2px' }}>
                                            {paymentInfo.transfer_content}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                                            * Giữ nguyên để hệ thống tự động xác nhận sau 3s
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(paymentInfo.transfer_content, 'content')}
                                        style={{
                                            padding: '8px 14px', borderRadius: '10px', border: '1px solid #fcd34d',
                                            background: copiedField === 'content' ? '#10b981' : '#ffffff',
                                            color: copiedField === 'content' ? '#ffffff' : '#b45309',
                                            fontWeight: '800', fontSize: '12.5px', cursor: 'pointer', transition: 'all 0.15s'
                                        }}
                                    >
                                        {copiedField === 'content' ? '✓ Đã chép' : '📋 Sao chép'}
                                    </button>
                                </div>

                                {/* 3. Ngân hàng thụ hưởng & STK */}
                                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '14px 18px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <img src="https://api.vietqr.io/img/TPB.png" alt="TPBank" style={{ height: '22px', objectFit: 'contain' }} />
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>TPBank (Tiên Phong Bank)</span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                                            ✓ Chính chủ
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                        <div>
                                            <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>CHỦ TÀI KHOẢN</div>
                                            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{paymentInfo.bank.accountName}</strong>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>SỐ TÀI KHOẢN</div>
                                            <strong style={{ fontSize: '16px', color: '#1e3a8a', fontFamily: 'monospace' }}>{paymentInfo.bank.accountNumber}</strong>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(paymentInfo.bank.accountNumber, 'acc')}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                                background: copiedField === 'acc' ? '#10b981' : '#ffffff',
                                                color: copiedField === 'acc' ? '#ffffff' : '#334155',
                                                fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                                            }}
                                        >
                                            {copiedField === 'acc' ? '✓ Đã chép' : '📋 Chép STK'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DÒNG TRẠNG THÁI TỰ ĐỘNG LẮNG NGHE REALTIME TINH TẾ (FOOTER) */}
                        <div style={{
                            marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#64748b' }}>
                                <span style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    backgroundColor: '#10b981', display: 'inline-block',
                                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                                }} />
                                <span>Hệ thống tự động xác nhận ngay sau khi nhận tiền (Không cần tải lại trang)</span>
                            </div>

                            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                🔒 Giao dịch bảo mật qua SePay & Napas247
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SepayPaymentModal;
