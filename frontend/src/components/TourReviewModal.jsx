import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Upload, X, AlertCircle, CheckCircle2, Image as ImageIcon, Sparkles } from 'lucide-react';

const GATEWAY_URL = 'http://localhost:5000';

const STAR_LABELS = {
    1: 'Rất không hài lòng (1 sao)',
    2: 'Chưa hài lòng (2 sao)',
    3: 'Tạm ổn / Bình thường (3 sao)',
    4: 'Hài lòng (4 sao)',
    5: 'Rất tuyệt vời (5 sao)'
};

const TourReviewModal = ({ isOpen, onClose, tour, booking, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [guideRating, setGuideRating] = useState(5);
    const [vehicleRating, setVehicleRating] = useState(5);
    const [serviceRating, setServiceRating] = useState(5);
    const [comment, setComment] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [isExistingReview, setIsExistingReview] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingOld, setFetchingOld] = useState(false);

    const tourId = tour?.tour_id || booking?.tour_id;
    const tourName = tour?.tour_name || booking?.tour_name || 'Tour Du Lịch';

    // 1. Luồng 4.2: Tự động kiểm tra xem khách hàng đã đánh giá tour/booking này chưa
    useEffect(() => {
        if (!isOpen || !tourId) return;

        setErrorMsg('');
        setSuccessMsg('');

        const fetchExistingReview = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            setFetchingOld(true);
            try {
                const bookingParam = booking?.booking_id ? `?booking_id=${booking.booking_id}` : '';
                const res = await axios.get(`${GATEWAY_URL}/api/tours/${tourId}/my-review${bookingParam}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.success && res.data.hasReviewed && res.data.review) {
                    const r = res.data.review;
                    setIsExistingReview(true);
                    setRating(Number(r.rating) || 5);
                    setGuideRating(Number(r.rating_guide) || 5);
                    setVehicleRating(Number(r.rating_vehicle) || 5);
                    setServiceRating(Number(r.rating_service) || 5);
                    setComment(r.comment || '');
                    if (r.images && Array.isArray(r.images)) {
                        setExistingImages(r.images);
                    }
                } else {
                    // Reset trạng thái form mới
                    setIsExistingReview(false);
                    setRating(0);
                    setGuideRating(5);
                    setVehicleRating(5);
                    setServiceRating(5);
                    setComment('');
                    setExistingImages([]);
                }
            } catch (err) {
                console.error('Không thể tải đánh giá cũ:', err);
                setIsExistingReview(false);
            } finally {
                setFetchingOld(false);
            }
        };

        fetchExistingReview();
    }, [isOpen, tourId, booking?.booking_id]);

    // Dọn dẹp URL blob khi unmount
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [previewUrls]);

    if (!isOpen) return null;

    // 2. Luồng ngoại lệ 5.1: Kiểm tra dung lượng (> 5MB) và định dạng ảnh
    const handleFileChange = (e) => {
        setErrorMsg('');
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const maxAllowed = 5 - (existingImages.length + selectedFiles.length);
        if (maxAllowed <= 0) {
            setErrorMsg('Bạn chỉ có thể tải lên tối đa 5 hình ảnh trải nghiệm thực tế.');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        const validNewFiles = [];
        const newPreviews = [];

        for (const file of files.slice(0, maxAllowed)) {
            // Kiểm tra dung lượng > 5MB (5 * 1024 * 1024 bytes)
            if (file.size > 5 * 1024 * 1024) {
                setErrorMsg('Ảnh đính kèm có dung lượng quá lớn (> 5MB) hoặc không đúng định dạng ảnh.');
                return;
            }

            // Kiểm tra định dạng ảnh hợp lệ
            if (!validTypes.includes(file.type.toLowerCase())) {
                setErrorMsg('Ảnh đính kèm có dung lượng quá lớn (> 5MB) hoặc không đúng định dạng ảnh.');
                return;
            }

            validNewFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }

        setSelectedFiles(prev => [...prev, ...validNewFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviews]);
        e.target.value = '';
    };

    const removeNewFile = (idx) => {
        URL.revokeObjectURL(previewUrls[idx]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
        setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
    };

    const removeExistingImage = (idx) => {
        setExistingImages(prev => prev.filter((_, i) => i !== idx));
    };

    // 3. Gửi đánh giá
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        // Luồng thay thế 4.1: Khách hàng chưa chọn số sao đánh giá
        if (!rating || rating < 1 || rating > 5) {
            setErrorMsg('Vui lòng chọn số sao đánh giá từ 1 đến 5 sao trước khi gửi.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setErrorMsg('Vui lòng đăng nhập để gửi đánh giá.');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('rating_guide', guideRating);
            formData.append('rating_vehicle', vehicleRating);
            formData.append('rating_service', serviceRating);
            formData.append('comment', comment);

            if (booking?.booking_id) {
                formData.append('booking_id', booking.booking_id);
            }

            if (existingImages.length > 0) {
                formData.append('existing_images', JSON.stringify(existingImages));
            }

            selectedFiles.forEach(file => {
                formData.append('images', file);
            });

            const res = await axios.post(`${GATEWAY_URL}/api/tours/${tourId}/reviews`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                // Luồng chính 6: Thông báo chuẩn theo đặc tả
                setSuccessMsg(res.data.message || 'Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn giúp chúng tôi cải thiện chất lượng dịch vụ.');
                
                setTimeout(() => {
                    if (onReviewSubmitted) onReviewSubmitted(res.data.data);
                    onClose();
                }, 1600);
            }
        } catch (err) {
            console.error('Lỗi khi gửi đánh giá:', err);
            if (err.response && err.response.data && err.response.data.message) {
                setErrorMsg(err.response.data.message);
            } else {
                setErrorMsg('Không thể gửi đánh giá. Vui lòng kiểm tra lại kết nối!');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderCriteriaStars = (currentVal, setter) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    type="button"
                    key={star}
                    onClick={() => setter(star)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'transform 0.15s ease'
                    }}
                >
                    <Star
                        size={22}
                        fill={star <= currentVal ? '#f59e0b' : 'none'}
                        color={star <= currentVal ? '#f59e0b' : '#cbd5e1'}
                    />
                </button>
            ))}
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginLeft: '6px' }}>
                {currentVal}/5 sao
            </span>
        </div>
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 28px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    background: 'linear-gradient(to right, #f8fafc, #ffffff)'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '12px',
                                fontWeight: '800',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <Sparkles size={14} /> {isExistingReview ? 'CẬP NHẬT ĐÁNH GIÁ' : 'ĐÁNH GIÁ TOUR'}
                            </span>
                            {booking?.booking_id && (
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                    Mã đơn: #BKG-{booking.booking_id.toString().padStart(4, '0')}
                                </span>
                            )}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                            {tourName}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
                    {fetchingOld && (
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                            ⏳ Đang tải thông tin đánh giá cũ của bạn...
                        </div>
                    )}

                    {isExistingReview && !fetchingOld && (
                        <div style={{
                            padding: '12px 16px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '12px',
                            color: '#1d4ed8',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>ℹ️</span> Bạn đã từng đánh giá tour này trước đó. Bạn có thể chỉnh sửa và bấm <strong>"Cập nhật đánh giá"</strong> bên dưới.
                        </div>
                    )}

                    {/* Alert Message */}
                    {errorMsg && (
                        <div style={{
                            padding: '12px 16px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '12px',
                            color: '#dc2626',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div style={{
                            padding: '14px 18px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '12px',
                            color: '#15803d',
                            fontSize: '14.5px',
                            fontWeight: '700',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Mục 1: Thang điểm 1 đến 5 sao tổng thể */}
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        background: '#f8fafc',
                        borderRadius: '18px',
                        marginBottom: '24px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                            BẠN ĐÁNH GIÁ CHUYẾN ĐI NÀY THẾ NÀO? <span style={{ color: '#ef4444' }}>(*)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => {
                                        setRating(star);
                                        setErrorMsg('');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        transition: 'transform 0.15s ease',
                                        transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)'
                                    }}
                                >
                                    <Star
                                        size={36}
                                        fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                                        color={(hoverRating || rating) >= star ? '#f59e0b' : '#cbd5e1'}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            ))}
                        </div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: rating > 0 ? '#d97706' : '#94a3b8',
                            height: '20px'
                        }}>
                            {rating > 0 ? STAR_LABELS[rating] : 'Chạm vào sao để chấm điểm'}
                        </div>
                    </div>

                    {/* Mục 2: Tiêu chí chi tiết theo đặc tả */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '18px 20px',
                        marginBottom: '24px'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
                            📊 Chấm điểm các tiêu chí dịch vụ chi tiết:
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600' }}>
                                    👨‍💼 Chất lượng phục vụ của Hướng dẫn viên:
                                </span>
                                {renderCriteriaStars(guideRating, setGuideRating)}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600' }}>
                                    🚗 Phương tiện xe đưa đón & vận chuyển:
                                </span>
                                {renderCriteriaStars(vehicleRating, setVehicleRating)}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600' }}>
                                    🏨 Bữa ăn & Khách sạn nghỉ dưỡng:
                                </span>
                                {renderCriteriaStars(serviceRating, setServiceRating)}
                            </div>
                        </div>
                    </div>

                    {/* Mục 3: Ô nhập cảm nhận / bình luận */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                            💬 Cảm nhận thực tế của bạn về chuyến đi:
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Hãy chia sẻ những trải nghiệm đáng nhớ, sự nhiệt tình của hướng dẫn viên hay điểm đến thú vị để giúp du khách khác có góc nhìn chân thực nhất..."
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                border: '1.5px solid #e2e8f0',
                                fontSize: '14.5px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                            {comment.length} ký tự
                        </div>
                    </div>

                    {/* Mục 4: Đính kèm ảnh thực tế chuyến đi */}
                    <div style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                                📸 Chia sẻ hình ảnh trải nghiệm thực tế (Tối đa 5 ảnh):
                            </label>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {existingImages.length + selectedFiles.length}/5 ảnh
                            </span>
                        </div>

                        {/* Thư viện ảnh đang chọn / ảnh cũ */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                            {/* Ảnh đã có từ trước (khi Cập nhật) */}
                            {existingImages.map((imgUrl, idx) => {
                                const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${GATEWAY_URL}${imgUrl}`;
                                return (
                                    <div key={`exist-${idx}`} style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #cbd5e1' }}>
                                        <img src={fullUrl} alt="Old review preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(idx)}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'rgba(0,0,0,0.6)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                );
                            })}

                            {/* Ảnh mới vừa chọn */}
                            {previewUrls.map((url, idx) => (
                                <div key={`new-${idx}`} style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #38bdf8' }}>
                                    <img src={url} alt="Review preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeNewFile(idx)}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: 'rgba(0,0,0,0.6)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            {/* Nút thêm ảnh */}
                            {existingImages.length + selectedFiles.length < 5 && (
                                <label style={{
                                    width: '84px',
                                    height: '84px',
                                    borderRadius: '12px',
                                    border: '2px dashed #cbd5e1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    transition: 'all 0.2s',
                                    background: '#f8fafc'
                                }}>
                                    <Upload size={20} />
                                    <span style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>Thêm ảnh</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            )}
                        </div>

                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Định dạng hỗ trợ: JPG, PNG, WEBP. Dung lượng mỗi ảnh tối đa <strong>5MB</strong>.
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '12px 22px',
                                borderRadius: '12px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#475569',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            disabled={loading || Boolean(successMsg)}
                            style={{
                                padding: '12px 28px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: '#ffffff',
                                fontWeight: '800',
                                fontSize: '14.5px',
                                cursor: (loading || Boolean(successMsg)) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {loading ? 'Đang gửi đánh giá...' : (isExistingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TourReviewModal;
