import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PartnerInventory = () => {
    const [myServices, setMyServices] = useState([]);
    const [masterServices, setMasterServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Đánh dấu xem đang ở chế độ Thêm mới hay Sửa
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        service_id: '',
        price: '',
        available_quantity: ''
    });

    useEffect(() => {
        fetchMyInventory();
        fetchMasterServices();
    }, []);

    const fetchMyInventory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/partner-services/my-inventory', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setMyServices(res.data.data);
        } catch (error) {
            console.error('Lỗi tải kho dịch vụ:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterServices = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/services');
            if (res.data.success) setMasterServices(res.data.data);
        } catch (error) {
            console.error('Lỗi tải danh mục:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // HÀM MỚI: Gọi khi bấm nút "Sửa" trên bảng
    const handleEditClick = (item) => {
        setFormData({
            service_id: item.service_id,
            price: item.price, // Lấy giá cũ đổ vào form
            available_quantity: item.available_quantity
        });
        setEditId(item.partner_service_id);
        setShowForm(true);
    };

    // Hàm gọi khi bấm "Thêm dịch vụ mới"
    const handleAddNewClick = () => {
        setFormData({ service_id: '', price: '', available_quantity: '' });
        setEditId(null);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editId) {
                // Đang có ID -> Gọi API PUT để SỬA
                await axios.put(`http://localhost:5000/api/partner-services/${editId}`, formData, config);
                alert('Đã cập nhật dịch vụ thành công!');
            } else {
                // Không có ID -> Gọi API POST để THÊM MỚI
                await axios.post('http://localhost:5000/api/partner-services', formData, config);
                alert('Đã đưa dịch vụ lên kệ thành công!');
            }

            setShowForm(false);
            fetchMyInventory(); // Tải lại danh sách
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const handleDelete = async (partner_service_id) => {
        if (window.confirm('Bạn có chắc muốn xóa dịch vụ này khỏi kệ?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/partner-services/${partner_service_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Đã gỡ dịch vụ!');
                fetchMyInventory();
            } catch (error) {
                alert('Lỗi khi xóa dịch vụ');
            }
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Đang tải...</div>;

    return (
        <div className="management-container">
            <div className="management-header">
                <h2>Cửa hàng của tôi (Kho Dịch vụ)</h2>
                {!showForm && (
                    <button className="btn-add-new" onClick={handleAddNewClick}>
                        + Đăng bán dịch vụ mới
                    </button>
                )}
            </div>

            {showForm ? (
                <form onSubmit={handleSubmit} className="form-grid" style={{ padding: '20px', background: '#f8fafc', borderRadius: '10px' }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3>{editId ? '✏️ Cập nhật Giá & Số lượng' : '➕ Thêm dịch vụ mới'}</h3>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-action">⬅ Hủy</button>
                    </div>

                    <div className="form-group full-width">
                        <label>Chọn dịch vụ từ hệ thống *</label>
                        <select
                            name="service_id"
                            value={formData.service_id}
                            onChange={handleInputChange}
                            required
                            disabled={!!editId} /* NẾU ĐANG SỬA THÌ KHÓA TÊN DỊCH VỤ LẠI */
                        >
                            <option value="">-- Chọn loại dịch vụ --</option>
                            {masterServices.map(srv => (
                                <option key={srv.service_id} value={srv.service_id}>{srv.service_name} ({srv.service_type})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Đơn giá (VNĐ) *</label>
                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} required />
                    </div>

                    <div className="form-group">
                        <label>Số lượng cung cấp (Quỹ trống) *</label>
                        <input type="number" name="available_quantity" value={formData.available_quantity} onChange={handleInputChange} required />
                    </div>

                    <div className="form-actions full-width" style={{ marginTop: '15px' }}>
                        <button type="submit" className="btn-add-new">
                            {editId ? '💾 Lưu Thay Đổi' : '🚀 Lưu lên kệ hàng'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tên Dịch vụ</th>
                                <th>Đơn giá</th>
                                <th>Quỹ Số lượng</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myServices.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Kho hàng trống.</td></tr>
                            ) : (
                                myServices.map(item => (
                                    <tr key={item.partner_service_id}>
                                        <td className="partner-name">{item.service_name}</td>
                                        <td style={{ fontWeight: 'bold', color: '#0f172a' }}>
                                            {Number(item.price).toLocaleString('vi-VN')} đ
                                        </td>
                                        <td>{item.available_quantity}</td>
                                        <td className="action-cell">
                                            {/* NÚT SỬA XUẤT HIỆN Ở ĐÂY */}
                                            <button className="btn-action edit" title="Sửa Giá / Số lượng" onClick={() => handleEditClick(item)}>✏️</button>
                                            <button className="btn-action delete" title="Ngừng bán" onClick={() => handleDelete(item.partner_service_id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PartnerInventory;