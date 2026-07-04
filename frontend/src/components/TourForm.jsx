import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TourForm = ({ tourId, onBack }) => {
    const [formData, setFormData] = useState({
        tour_name: '', description: '', destination: '',
        duration_days: 1, base_price: 0, image_url: '', status: 'Active'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State quản lý việc upload ảnh
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState('');

    useEffect(() => {
        if (tourId) {
            fetchTourData();
        }
    }, [tourId]);

    const fetchTourData = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/tours/${tourId}`);
            if (res.data.success) {
                const t = res.data.data;
                setFormData({
                    tour_name: t.tour_name, description: t.description, destination: t.destination,
                    duration_days: t.duration_days, base_price: t.base_price,
                    image_url: t.image_url || '', status: t.status
                });

                // Set ảnh preview nếu tour đã có ảnh sẵn
                if (t.image_url) {
                    let imgPath = t.image_url.startsWith('/') ? t.image_url.substring(1) : t.image_url;
                    if (!imgPath.startsWith('uploads/') && !imgPath.startsWith('http')) imgPath = `uploads/${imgPath}`;
                    setPreviewImage(t.image_url.startsWith('http') ? t.image_url : `http://localhost:5000/${imgPath}`);
                }
            }
        } catch (error) {
            console.error('Lỗi lấy thông tin tour', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Hàm bắt sự kiện khi người dùng chọn file ảnh
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file)); // Hiển thị ảnh xem trước
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        // ĐÓNG GÓI DỮ LIỆU THÀNH FORM DATA (Bắt buộc khi có upload file)
        const submitData = new FormData();
        submitData.append('tour_name', formData.tour_name);
        submitData.append('description', formData.description);
        submitData.append('destination', formData.destination);
        submitData.append('duration_days', formData.duration_days);
        submitData.append('base_price', formData.base_price);
        submitData.append('status', formData.status);
        submitData.append('existing_image_url', formData.image_url); // Gửi kèm link cũ

        if (selectedFile) {
            submitData.append('image', selectedFile); // Gửi tệp vật lý đính kèm
        }

        try {
            if (tourId) {
                await axios.put(`http://localhost:5000/api/tours/${tourId}`, submitData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data' // Bắt buộc cho việc gửi file
                    }
                });
                alert('Cập nhật Tour thành công!');
            } else {
                await axios.post('http://localhost:5000/api/tours', submitData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                alert('Thêm Tour mới thành công!');
            }
            onBack();
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message;
            alert('Lỗi từ hệ thống: ' + errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-page-container">
            <div className="form-page-header">
                <button type="button" className="btn-back" onClick={onBack}>⬅ Quay lại</button>
                <h2>{tourId ? 'Cập nhật thông tin Tour' : 'Thêm Tour mới'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="full-page-form">
                <div className="form-grid">
                    <div className="form-group full-width">
                        <label>Tên Tour *</label>
                        <input type="text" name="tour_name" value={formData.tour_name} onChange={handleInputChange} required placeholder="VD: Khám phá Sapa mùa lúa chín" />
                    </div>
                    <div className="form-group">
                        <label>Điểm đến *</label>
                        <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} required placeholder="VD: Sapa, Lào Cai" />
                    </div>
                    <div className="form-group">
                        <label>Thời gian (Ngày) *</label>
                        <input type="number" min="1" name="duration_days" value={formData.duration_days} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Giá cơ bản (VNĐ) *</label>
                        <input type="number" min="0" name="base_price" value={formData.base_price} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Trạng thái</label>
                        <select name="status" value={formData.status} onChange={handleInputChange}>
                            <option value="Active">Đang mở (Sẵn sàng nhận khách)</option>
                            <option value="Inactive">Đã đóng (Tạm dừng)</option>
                        </select>
                    </div>

                    {/* KHU VỰC UPLOAD ẢNH MỚI */}
                    <div className="form-group full-width">
                        <label>Hình ảnh Tour</label>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            {previewImage && (
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ padding: '10px', background: '#fff', border: '1px dashed #cbd5e1', cursor: 'pointer', flex: 1 }}
                            />
                        </div>
                        <small style={{ color: '#64748b', marginTop: '5px' }}>Chỉ hỗ trợ định dạng JPG, PNG, JPEG.</small>
                    </div>

                    <div className="form-group full-width">
                        <label>Mô tả chi tiết chuyến đi</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="6" placeholder="Nhập mô tả hấp dẫn về tour..."></textarea>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel-lg" onClick={onBack}>Hủy bỏ</button>
                    <button type="submit" className="btn-save-lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : (tourId ? 'Lưu thay đổi' : 'Tạo Tour ngay')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TourForm;