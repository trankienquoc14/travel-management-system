import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TourManagement = ({ onAddNew, onEdit }) => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTours();
    }, []);

    const fetchTours = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/tours');
            if (res.data.success) setTours(res.data.data);
        } catch (error) {
            console.error('Lỗi tải danh sách tour:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
        if (url.startsWith('http')) return url;
        let imagePath = url.startsWith('/') ? url.substring(1) : url;
        if (!imagePath.startsWith('uploads/')) imagePath = `uploads/${imagePath}`;
        return `http://localhost:5000/${imagePath}`;
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa Tour này không?')) {
            const token = localStorage.getItem('token');
            try {
                await axios.delete(`http://localhost:5000/api/tours/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Đã xóa Tour thành công!');
                fetchTours();
            } catch (error) {
                alert('Không thể xóa! Có thể Tour này đang có đơn đặt hàng liên kết.');
            }
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Đang tải dữ liệu...</div>;

    return (
        <div className="management-container">
            <div className="management-header">
                <h2>Quản lý Tour Du lịch</h2>
                <button className="btn-add-new" onClick={onAddNew}>
                    + Thêm Tour mới
                </button>
            </div>
            
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Hình ảnh</th>
                            <th>Tên Tour</th>
                            <th>Điểm đến</th>
                            <th>Thời gian</th>
                            <th>Giá cơ bản</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tours.map(tour => (
                            <tr key={tour.tour_id}>
                                <td>#{tour.tour_id}</td>
                                <td><img src={getImageUrl(tour.image_url)} alt="tour" className="table-img" /></td>
                                <td className="font-semibold">{tour.tour_name}</td>
                                <td>{tour.destination}</td>
                                <td>{tour.duration_days} ngày</td>
                                <td className="text-price">{formatPrice(tour.base_price)}</td>
                                <td>
                                    <span className={`status-badge ${tour.status === 'Active' ? 'success' : 'danger'}`}>
                                        {tour.status === 'Active' ? 'Đang mở' : 'Đã đóng'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn-action edit" title="Sửa" onClick={() => onEdit(tour.tour_id)}>✏️</button>
                                    <button className="btn-action delete" title="Xóa" onClick={() => handleDelete(tour.tour_id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TourManagement;