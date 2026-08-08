import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/partner.css';

const PartnerInventory = () => {
    const [myServices, setMyServices] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editId, setEditId] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [formData, setFormData] = useState({
        service_name: '', service_type: 'Khách sạn', description: '', destination_id: '', unit: '', capacity: '', price: '', available_quantity: ''
    });

    useEffect(() => { 
        fetchMyInventory(); 
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/destinations');
            if (res.data.success) setDestinations(res.data.data);
        } catch (error) { console.error('Lỗi tải điểm đến:', error); }
    };

    const fetchMyInventory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/partner-services/my-inventory', { headers: { Authorization: 'Bearer ' + token } });
            if (res.data.success) setMyServices(res.data.data);
        } catch (error) { console.error('Lỗi tải kho dịch vụ:', error); } finally { setLoading(false); }
    };

    const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleFileChange = (e) => { setImageFile(e.target.files[0]); };

    const handleAddNewClick = () => {
        setEditId(null);
        setFormData({ service_name: '', service_type: 'Khách sạn', description: '', destination_id: '', unit: '', capacity: '', price: '', available_quantity: '' });
        setImageFile(null); setShowForm(true);
    };

    const handleEditClick = (item) => {
        setFormData({ price: item.price, available_quantity: item.available_quantity });
        setEditId(item.partner_service_id); setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (editId) {
                await axios.put('http://localhost:5000/api/partner-services/' + editId, formData, { headers: { Authorization: 'Bearer ' + token } });
                alert('Đã cập nhật dịch vụ!');
            } else {
                const payload = new FormData();
                for (const key in formData) { payload.append(key, formData[key]); }
                if (imageFile) { payload.append('image', imageFile); }
                await axios.post('http://localhost:5000/api/partner-services', payload, { headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' } });
                alert('Đã gửi yêu cầu tạo dịch vụ thành công! Vui lòng chờ quản lý duyệt.');
            }
            setShowForm(false);
            fetchMyInventory();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (partner_service_id) => {
        if (window.confirm('Bạn có chắc muốn xóa dịch vụ này khỏi kệ?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete('http://localhost:5000/api/partner-services/' + partner_service_id, { headers: { Authorization: 'Bearer ' + token } });
                alert('Đã gỡ dịch vụ!'); fetchMyInventory();
            } catch (error) { alert('Lỗi khi xóa dịch vụ'); }
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Đang tải...</div>;

    return (
        <div className="management-container">
            <div className="management-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Cửa hàng của tôi (Kho Dịch vụ)</h2>
                {!showForm && (
                    <button className="btn-add-new" onClick={handleAddNewClick} style={{ backgroundColor: '#3b82f6' }}>
                        + Thêm Dịch vụ mới
                    </button>
                )}
            </div>

            {showForm ? (
                <form onSubmit={handleSubmit} className="form-grid" style={{ padding: '20px', background: '#f8fafc', borderRadius: '10px' }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <h3>{editId ? '✏️ Cập nhật Giá & Số lượng' : '📝 Tạo Yêu Cầu Dịch Vụ Mới'}</h3>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-action">⬅ Hủy</button>
                    </div>

                    {!editId && (
                        <>
                            <div className="form-group full-width"><label>Tên Dịch vụ *</label><input type="text" name="service_name" value={formData.service_name} onChange={handleInputChange} required /></div>
                            <div className="form-group">
                                <label>Loại Dịch vụ *</label>
                                <select name="service_type" value={formData.service_type} onChange={handleInputChange} required>
                                    <option value="Khách sạn">Khách sạn / Lưu trú</option>
                                    <option value="Di chuyển">Xe / Di chuyển</option>
                                    <option value="Nhà hàng">Nhà hàng / Ăn uống</option>
                                    <option value="Vé tham quan">Vé tham quan / Giải trí</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Địa Điểm / Tỉnh Thành {formData.service_type !== 'Di chuyển' && '*'}</label>
                                <select 
                                    name="destination_id" 
                                    value={formData.destination_id || ''} 
                                    onChange={handleInputChange} 
                                    required={formData.service_type !== 'Di chuyển'}
                                >
                                    <option value="">-- Toàn cục / Không yêu cầu --</option>
                                    {destinations.map(d => (
                                        <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group"><label>Hình ảnh (Tùy chọn)</label><input type="file" accept="image/*" onChange={handleFileChange} /></div>
                            <div className="form-group full-width"><label>Mô tả dịch vụ</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea></div>
                            <div className="form-group"><label>Đơn vị tính (VD: Phòng/Đêm)</label><input type="text" name="unit" value={formData.unit} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>Sức chứa (VD: 2 người)</label><input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} /></div>
                        </>
                    )}

                    <div className="form-group"><label>Đơn giá đề xuất (VNĐ) *</label><input type="number" name="price" value={formData.price} onChange={handleInputChange} required /></div>
                    <div className="form-group"><label>Số lượng cung cấp tối đa *</label><input type="number" name="available_quantity" value={formData.available_quantity} onChange={handleInputChange} required /></div>
                    <div className="form-actions full-width" style={{ marginTop: '15px' }}><button type="submit" className="btn-add-new" disabled={isSubmitting}>{isSubmitting ? '⏳ Đang xử lý...' : (editId ? '💾 Lưu Thay Đổi' : '📤 Gửi Yêu Cầu Duyệt')}</button></div>
                </form>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead><tr><th>Tên Dịch vụ</th><th>Đơn giá</th><th>Quỹ Số lượng</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                        <tbody>
                            {myServices.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Kho hàng trống.</td></tr>
                            ) : (
                                myServices.map(item => (
                                    <tr key={item.partner_service_id}>
                                        <td className="partner-name">
                                            {item.image_url && (
                                                <img 
                                                    src={`http://localhost:5000${item.image_url}`} 
                                                    alt="thumb" 
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px', verticalAlign: 'middle', display: 'inline-block' }} 
                                                />
                                            )}
                                            {item.service_name}
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{Number(item.price).toLocaleString('vi-VN')} đ</td>
                                        <td>{item.available_quantity}</td>
                                        <td>
                                            {item.status === 'Pending' ? (
                                                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: '#fef3c7', color: '#d97706', fontWeight: 'bold' }}>⏳ Chờ duyệt</span>
                                            ) : (
                                                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', background: '#dcfce7', color: '#15803d', fontWeight: 'bold' }}>✅ Đang bán</span>
                                            )}
                                        </td>
                                        <td className="action-cell">
                                            {item.status === 'Active' && <button className="btn-action edit" title="Sửa Giá / Số lượng" onClick={() => handleEditClick(item)}>✏️</button>}
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