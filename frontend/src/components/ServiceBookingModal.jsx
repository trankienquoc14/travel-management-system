import React, { useState } from 'react';
import axios from 'axios';

const ServiceBookingModal = ({ service, onClose, user }) => {
    const [usageDate, setUsageDate] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('Pay_at_Location'); // Default
    const [loading, setLoading] = useState(false);

    const totalAmount = service.selling_price * quantity;

    const handleBook = async () => {
        if (!usageDate) {
            alert('Vui lòng chọn ngày sử dụng!');
            return;
        }
        if (quantity < 1) {
            alert('Số lượng tối thiểu là 1!');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/bookings/service', {
                service_id: service.service_id,
                quantity,
                usage_date: usageDate,
                total_amount: totalAmount,
                payment_method: paymentMethod
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert('Gửi yêu cầu đặt dịch vụ thành công! Nhân viên sẽ liên hệ để xác nhận sớm nhất.');
                onClose();
            } else {
                alert(res.data.message || 'Lỗi khi đặt dịch vụ');
            }
        } catch (error) {
            console.error(error);
            alert('Đã xảy ra lỗi hệ thống!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3>Đặt Dịch vụ: {service.service_name}</h3>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>
                <div style={styles.body}>
                    <p style={styles.warningText}>
                        ⚠️ Đây là Yêu cầu Đặt trước. Nhân viên sẽ liên hệ Đối tác để kiểm tra chỗ trống và xác nhận lại với bạn. Bạn chưa phải thanh toán lúc này (nếu chọn Trả trước).
                    </p>

                    <div style={styles.formGroup}>
                        <label>Ngày sử dụng:</label>
                        <input 
                            type="date" 
                            value={usageDate} 
                            onChange={e => setUsageDate(e.target.value)} 
                            style={styles.input}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label>Số lượng ({service.unit}):</label>
                        <input 
                            type="number" 
                            value={quantity} 
                            onChange={e => setQuantity(Number(e.target.value))} 
                            style={styles.input}
                            min="1"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label>Chính sách thanh toán:</label>
                        <div style={styles.radioGroup}>
                            <label style={styles.radioLabel}>
                                <input 
                                    type="radio" 
                                    value="Pay_at_Location" 
                                    checked={paymentMethod === 'Pay_at_Location'} 
                                    onChange={() => setPaymentMethod('Pay_at_Location')}
                                />
                                <div>
                                    <strong>Thanh toán tại nơi (Khuyên dùng)</strong>
                                    <p style={styles.radioDesc}>Được giữ chỗ miễn phí. Thanh toán trực tiếp bằng tiền mặt khi tới sử dụng dịch vụ.</p>
                                </div>
                            </label>

                            <label style={styles.radioLabel}>
                                <input 
                                    type="radio" 
                                    value="Prepaid" 
                                    checked={paymentMethod === 'Prepaid'} 
                                    onChange={() => setPaymentMethod('Prepaid')}
                                />
                                <div>
                                    <strong>Thanh toán trực tuyến</strong>
                                    <p style={styles.radioDesc}>Thanh toán trước để nhận mã Voucher điện tử qua hệ thống. Nhân viên sẽ gửi link thanh toán sau khi xác nhận còn chỗ.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div style={styles.totalBox}>
                        <span>Tổng tạm tính:</span>
                        <strong style={{ color: '#ef4444', fontSize: '20px' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                        </strong>
                    </div>
                </div>
                
                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.cancelBtn}>Hủy</button>
                    <button onClick={handleBook} disabled={loading} style={styles.bookBtn}>
                        {loading ? 'Đang gửi...' : 'Gửi Yêu cầu Đặt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1100,
        padding: '20px'
    },
    modal: {
        backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'
    },
    closeBtn: {
        background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b'
    },
    body: {
        padding: '24px', overflowY: 'auto', maxHeight: '70vh'
    },
    warningText: {
        backgroundColor: '#fef2f2', color: '#b91c1c', padding: '12px',
        borderRadius: '8px', fontSize: '13px', marginBottom: '20px',
        border: '1px solid #fecaca'
    },
    formGroup: {
        marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px'
    },
    input: {
        padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px'
    },
    radioGroup: {
        display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px'
    },
    radioLabel: {
        display: 'flex', gap: '12px', alignItems: 'flex-start',
        border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px',
        cursor: 'pointer', transition: '0.2s'
    },
    radioDesc: {
        margin: '4px 0 0 0', fontSize: '13px', color: '#64748b'
    },
    totalBox: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f8fafc', padding: '16px', borderRadius: '12px',
        border: '1px solid #e2e8f0', marginTop: '10px'
    },
    footer: {
        padding: '16px 24px', borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc'
    },
    cancelBtn: {
        padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
        background: '#fff', cursor: 'pointer', fontWeight: '600'
    },
    bookBtn: {
        padding: '10px 24px', borderRadius: '8px', border: 'none',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
        color: '#fff', cursor: 'pointer', fontWeight: 'bold'
    }
};

export default ServiceBookingModal;
