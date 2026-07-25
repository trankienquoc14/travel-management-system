import React, { useState, useEffect } from "react";
import axios from "axios";

const ServiceForm = ({ editData, onBack }) => {
    const [formData, setFormData] = useState({
        service_name: "",
        service_type: "Hotel",
        description: "",
        partner_id: "",
        destination_id: "",
        unit: "",
        base_cost: 0,
        selling_price: 0,
        capacity: 0,
        status: "Active"
    });
    
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [partners, setPartners] = useState([]);
    const [destinations, setDestinations] = useState([]);

    useEffect(() => {
        fetchPartners();
        fetchDestinations();
        if (editData) {
            setFormData({
                service_name: editData.service_name || "",
                service_type: editData.service_type || "Hotel",
                description: editData.description || "",
                partner_id: editData.partner_id || "",
                destination_id: editData.destination_id || "",
                unit: editData.unit || "",
                base_cost: editData.base_cost || 0,
                selling_price: editData.selling_price || 0,
                capacity: editData.capacity || 0,
                status: editData.status || "Active",
                existing_image_url: editData.image_url || ""
            });
            if (editData.image_url) {
                setImagePreview(`http://localhost:5000${editData.image_url}`);
            }
        }
    }, [editData]);

    const fetchPartners = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/services/partners");
            if (res.data.success) setPartners(res.data.data);
        } catch (error) {
            console.error("Lỗi tải danh sách đối tác", error);
        }
    };

    const fetchDestinations = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/destinations");
            if (res.data.success) setDestinations(res.data.data);
        } catch (error) {
            console.error("Lỗi tải danh sách điểm đến", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== "") {
                    data.append(key, formData[key]);
                }
            });
            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editData) {
                await axios.put(`http://localhost:5000/api/services/${editData.service_id}`, data, config);
                alert("Cập nhật dịch vụ thành công!");
            } else {
                await axios.post("http://localhost:5000/api/services", data, config);
                alert("Đã thêm dịch vụ mới vào hệ thống!");
            }
            onBack();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || "Không thể lưu dữ liệu"));
        }
    };

    // Transport and Flight do not need destination_id
    const isGlobalService = formData.service_type === 'Transport' || formData.service_type === 'Flight';

    return (
        <div className="form-container" style={{ padding: '20px', background: '#fff', borderRadius: '10px' }}>
            <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>{editData ? "✏️ Sửa Dịch Vụ" : "➕ Thêm Dịch Vụ Mới"}</h2>
                <button onClick={onBack} className="btn-action">⬅ Quay lại</button>
            </div>

            <form onSubmit={handleSubmit} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label>Tên dịch vụ *</label>
                    <input
                        type="text"
                        name="service_name"
                        value={formData.service_name}
                        onChange={handleChange}
                        required
                        placeholder="VD: Phòng Standard, Xe 45 chỗ..."
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div className="form-group">
                    <label>Phân loại dịch vụ *</label>
                    <select name="service_type" value={formData.service_type} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="Hotel">Lưu trú (Hotel/Resort)</option>
                        <option value="Transport">Vận chuyển (Xe/Tàu)</option>
                        <option value="Flight">Vé máy bay (Flight)</option>
                        <option value="Restaurant">Nhà hàng / Ăn uống</option>
                        <option value="Ticket">Vé tham quan / Giải trí</option>
                        <option value="Other">Khác</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label>Đối tác cung cấp</label>
                    <select name="partner_id" value={formData.partner_id} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="">-- Xe công ty / Nội bộ --</option>
                        {partners.map(p => (
                            <option key={p.partner_id} value={p.partner_id}>{p.partner_name}</option>
                        ))}
                    </select>
                </div>
                
                {!isGlobalService && (
                    <div className="form-group">
                        <label>Điểm đến (Tỉnh/Thành) *</label>
                        <select name="destination_id" value={formData.destination_id} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                            <option value="">-- Chọn điểm đến --</option>
                            {destinations.map(d => (
                                <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label>Đơn vị tính</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="Phòng/Đêm, Khách/Suất..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                
                <div className="form-group">
                    <label>Giá gốc (Net price)</label>
                    <input type="number" name="base_cost" value={formData.base_cost} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                
                <div className="form-group">
                    <label>Giá bán dự kiến</label>
                    <input type="number" name="selling_price" value={formData.selling_price} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>
                
                <div className="form-group">
                    <label>Sức chứa / Số lượng</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                </div>

                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label>Mô tả dịch vụ</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Mô tả tiêu chuẩn, tiện ích..."
                        rows="3"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    ></textarea>
                </div>
                
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                    <label>Hình Ảnh</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'block', marginBottom: '10px' }} />
                    {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxHeight: '150px', borderRadius: '8px' }} />}
                </div>

                <div className="form-actions full-width" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                    <button type="submit" className="btn-add-new" style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {editData ? "💾 Lưu Thay Đổi" : "✅ Tạo Dịch Vụ"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceForm;
