import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const GATEWAY_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

const ReschedulePaymentModal = ({ bookingId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [rescheduleData, setRescheduleData] = useState(null);
    const [isPaid, setIsPaid] = useState(false);
    const [copiedField, setCopiedField] = useState('');
    const [countdown, setCountdown] = useState(600); // 10 phút
    const [errorMsg, setErrorMsg] = useState('');

    const pollIntervalRef = useRef(null);
    const timerIntervalRef = useRef(null);

    const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN') + ' ₫';

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(String(text));
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(''), 2000);
    };

    // 1. Tải thông tin QR phụ thu đổi lịch từ backend
    useEffect(() => {
        if (!bookingId) return;
        const fetchQrData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await axios.get(`${GATEWAY_URL}/api/bookings/${bookingId}/reschedule-qr`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.success) {
                    const data = res.data.data;
                    setRescheduleData(data);
                    if (data.status === 'Approved') {
                        setIsPaid(true);
                    }
                }
            } catch (err) {
                console.error('Lỗi tải thông tin thanh toán đổi lịch:', err);
                setErrorMsg(err.response?.data?.message || 'Không thể tải thông tin thanh toán đổi lịch!');
            } finally {
                setLoading(false);
            }
        };
        fetchQrData();
    }, [bookingId]);

    // 2. Đếm ngược 10 phút
    useEffect(() => {
        if (isPaid || loading) return;
        timerIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isPaid, loading]);

    // 3. Polling kiểm tra trạng thái thanh toán từ SePay mỗi 2 giây
    const checkPaymentStatus = async () => {
        if (!bookingId || isPaid) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${GATEWAY_URL}/api/bookings/${bookingId}/check-reschedule-sepay`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.paid) {
                setIsPaid(true);
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                if (onSuccess) onSuccess(res.data);
            }
        } catch (err) {
            console.error('Lỗi check SePay reschedule:', err);
        }
    };

    useEffect(() => {
        if (!bookingId || isPaid || loading) return;

        const initTimer = setTimeout(() => {
            checkPaymentStatus();
        }, 1200);

        pollIntervalRef.current = setInterval(() => {
            checkPaymentStatus();
        }, 2000);

        return () => {
            clearTimeout(initTimer);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [bookingId, isPaid, loading]);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!bookingId) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100000, padding: '16px', fontFamily: '"Inter", "Outfit", system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '820px',
                maxHeight: '94vh', overflowY: 'auto',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
                display: 'flex', flexDirection: 'column', position: 'relative'
            }}>
                {/* NÚT ĐÓNG */}
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
                >
                    ✕
                </button>

                {loading ? (
                    <div style={{ padding: '70px 30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '14px' }}>⏳</div>
                        <div style={{ color: '#0284c7', fontWeight: '800', fontSize: '18px' }}>
                            Đang tạo mã VietQR phí đổi lịch...
                        </div>
                    </div>
                ) : errorMsg ? (
                    <div style={{ padding: '60px 30px', textAlign: 'center', color: '#dc2626' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                        <div style={{ fontSize: '17px', fontWeight: '700' }}>{errorMsg}</div>
                        <button onClick={onClose} style={{ marginTop: '16px', padding: '10px 24px', background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                            Đóng lại
                        </button>
                    </div>
                ) : isPaid ? (
                    /* MÀN HÌNH ĐỔI LỊCH THÀNH CÔNG */
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
                            ⚡ Hệ thống đã tự động đổi lịch thành công!
                        </span>

                        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '14px 0 10px 0' }}>
                            Đã Đổi Ngày Khởi Hành Thành Công!
                        </h2>

                        <div style={{
                            maxWidth: '600px', margin: '0 auto 24px auto', background: '#f0fdf4',
                            border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px 20px',
                            color: '#166534', fontSize: '14.5px', lineHeight: 1.6
                        }}>
                            🎉 Khoản phí đổi lịch <strong>{formatCurrency(rescheduleData.fee_amount)}</strong> cho đơn hàng <strong>#BKG-{String(bookingId).padStart(4, '0')}</strong> đã được xác nhận tự động qua VietQR/SePay. Lịch trình mới của bạn đã được cập nhật ngay lập tức mà không cần nhân viên duyệt!
                        </div>

                        {rescheduleData.requested_departure_date && (
                            <div style={{
                                maxWidth: '540px', margin: '0 auto 24px auto', background: '#eff6ff',
                                borderRadius: '16px', padding: '16px 20px', border: '1px solid #bfdbfe',
                                fontSize: '14.5px', color: '#1e40af', fontWeight: '700'
                            }}>
                                📅 Ngày khởi hành mới: {new Date(rescheduleData.requested_departure_date).toLocaleDateString('vi-VN')}
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            style={{
                                padding: '13px 32px', borderRadius: '14px', border: 'none',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                                boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)'
                            }}
                        >
                            Quay Lại Danh Sách Đơn Của Tôi
                        </button>
                    </div>
                ) : (
                    /* MÀN HÌNH QUÉT MÃ VIETQR ĐỔI LỊCH */
                    <div style={{ padding: '28px 32px' }}>
                        {/* HEADER */}
                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', marginBottom: '8px' }}>
                                <span>⚡ CỔNG THANH TOÁN SEPAY REALTIME</span>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }}></span>
                                <span>TỰ ĐỘNG ĐỔI LỊCH 24/7 KHÔNG CẦN DUYỆT</span>
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                                Thanh Toán Phụ Thu Đổi Lịch Tour #{bookingId}
                            </h2>
                            <div style={{ fontSize: '13.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <span>🏷️ Tour: <strong>{rescheduleData.tour_name}</strong></span>
                                {rescheduleData.requested_departure_date && (
                                    <span style={{ color: '#2563eb', fontWeight: '700' }}>
                                        ➡️ Đổi sang: {new Date(rescheduleData.requested_departure_date).toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* BANNER ĐẾM NGƯỢC & HƯỚNG DẪN */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#f8fafc', padding: '12px 18px', borderRadius: '14px',
                            border: '1px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    display: 'inline-block', width: '10px', height: '10px',
                                    borderRadius: '50%', backgroundColor: '#10b981',
                                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                                    animation: 'pulse 1.5s infinite'
                                }}></span>
                                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>
                                    Hệ thống đang chờ nhận tiền chuyển khoản để tự động cập nhật lịch...
                                </span>
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: '#fee2e2', color: '#dc2626', padding: '4px 12px',
                                borderRadius: '10px', fontSize: '13px', fontWeight: '800'
                            }}>
                                ⏱️ <span>{formatTime(countdown)}</span>
                            </div>
                        </div>

                        {/* GRID THÔNG TIN QR VÀ TÀI KHOẢN */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px', alignItems: 'center' }}>
                            {/* KHỐI QR CODE */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                padding: '20px', borderRadius: '20px', background: '#f8fafc',
                                border: '1.5px solid #e2e8f0', textAlign: 'center'
                            }}>
                                <div style={{
                                    padding: '12px', background: '#fff', borderRadius: '16px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
                                    marginBottom: '12px'
                                }}>
                                    <img
                                        src={rescheduleData.qr_url}
                                        alt="VietQR Đổi Lịch"
                                        style={{ width: '220px', height: '220px', objectFit: 'contain', display: 'block' }}
                                    />
                                </div>
                                <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600' }}>
                                    📱 Quét bằng app ngân hàng bất kỳ để tự động điền số tiền và nội dung
                                </div>
                            </div>

                            {/* KHỐI CHI TIẾT TÀI KHOẢN CHUYỂN KHOẢN */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* SỐ TIỀN */}
                                <div style={{
                                    padding: '14px 18px', borderRadius: '14px', background: '#eff6ff',
                                    border: '1.5px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '700', textTransform: 'uppercase' }}>
                                            Số tiền phụ thu ({rescheduleData.fee_percentage}%):
                                        </div>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2563eb' }}>
                                            {formatCurrency(rescheduleData.fee_amount)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(rescheduleData.fee_amount, 'amount')}
                                        style={{
                                            padding: '8px 14px', borderRadius: '10px', border: '1px solid #bfdbfe',
                                            background: '#fff', color: '#2563eb', fontWeight: '700', fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                                    </button>
                                </div>

                                {/* NỘI DUNG CHUYỂN KHOẢN BẮT BUỘC */}
                                <div style={{
                                    padding: '14px 18px', borderRadius: '14px', background: '#fef2f2',
                                    border: '1.5px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '800', textTransform: 'uppercase' }}>
                                            Nội dung chuyển khoản (Bắt buộc chính xác):
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#dc2626', letterSpacing: '0.5px' }}>
                                            {rescheduleData.transfer_content}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(rescheduleData.transfer_content, 'content')}
                                        style={{
                                            padding: '8px 14px', borderRadius: '10px', border: '1px solid #fecaca',
                                            background: '#fff', color: '#dc2626', fontWeight: '800', fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {copiedField === 'content' ? '✓ Đã chép' : 'Sao chép'}
                                    </button>
                                </div>

                                {/* THÔNG TIN NGÂN HÀNG */}
                                <div style={{
                                    padding: '14px 18px', borderRadius: '14px', background: '#f8fafc',
                                    border: '1px solid #e2e8f0', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                                        <strong>{rescheduleData.bank.bankName} (TPBank)</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <strong style={{ fontSize: '15px', color: '#0f172a' }}>{rescheduleData.bank.accountNumber}</strong>
                                            <button
                                                onClick={() => copyToClipboard(rescheduleData.bank.accountNumber, 'acc')}
                                                style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                {copiedField === 'acc' ? '✓' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Chủ tài khoản:</span>
                                        <strong>{rescheduleData.bank.accountName}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER TRẠNG THÁI REALTIME SEPAY */}
                        <div style={{
                            marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                                <span style={{
                                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981',
                                    display: 'inline-block', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                                }}></span>
                                <span>Cổng SePay đang lắng nghe giao dịch chuyển khoản thật 24/7...</span>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '10px 24px', borderRadius: '12px', border: '1px solid #cbd5e1',
                                    background: '#ffffff', color: '#475569', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            >
                                Đóng lại
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReschedulePaymentModal;
