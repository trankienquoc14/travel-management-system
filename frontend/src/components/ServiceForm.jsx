import React, { useState, useEffect } from "react";
import axios from "axios";

const ServiceForm = ({ editData, onBack }) => {
    // Chỉ giữ lại các trường thông tin chung (Master Data)
    const [formData, setFormData] = useState({
        service_name: "",
        service_type: "Hotel", // Giá trị mặc định
        description: ""
    });

    useEffect(() => {
        if (editData) {
            setFormData({
                service_name: editData.service_name,
                service_type: editData.service_type,
                description: editData.description || ""
            });
        }
    }, [editData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editData) {
                // Cập nhật danh mục
                await axios.put(`http://localhost:5000/api/services/${editData.service_id}`, formData, config);
                alert("Cập nhật danh mục dịch vụ thành công!");
            } else {
                // Tạo mới danh mục
                await axios.post("http://localhost:5000/api/services", formData, config);
                alert("Đã thêm danh mục dịch vụ mới vào hệ thống!");
            }
            onBack(); // Quay lại bảng danh sách
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || "Không thể lưu dữ liệu"));
        }
    };

    return (
        <div className="form-container" style={{ padding: '20px', background: '#fff', borderRadius: '10px' }}>
            <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>{editData ? "✏️ Sửa Danh Mục Dịch Vụ" : "➕ Thêm Danh Mục Mới (Từ Điển)"}</h2>
                <button onClick={onBack} className="btn-action">⬅ Quay lại</button>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group full-width">
                    <label>Tên danh mục dịch vụ (VD: Phòng Standard, Xe 45 chỗ) *</label>
                    <input
                        type="text"
                        name="service_name"
                        value={formData.service_name}
                        onChange={handleChange}
                        required
                        placeholder="Nhập tên gọi chung cho dịch vụ..."
                    />
                </div>

                <div className="form-group full-width">
                    <label>Phân loại dịch vụ *</label>
                    <select name="service_type" value={formData.service_type} onChange={handleChange} required>
                        <option value="Hotel">Lưu trú (Hotel/Resort)</option>
                        <option value="Transport">Vận chuyển (Xe/Tàu)</option>
                        <option value="Flight">Vé máy bay (Flight)</option>
                        <option value="Restaurant">Nhà hàng / Ăn uống</option>
                        <option value="Ticket">Vé tham quan / Giải trí</option>
                        <option value="Other">Khác</option>
                    </select>
                </div>

                <div className="form-group full-width">
                    <label>Mô tả tiêu chuẩn (Tùy chọn)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Mô tả tiêu chuẩn chung mà công ty yêu cầu cho dịch vụ này..."
                        rows="4"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    ></textarea>
                </div>

                <div className="form-actions full-width" style={{ marginTop: '20px' }}>
                    <button type="submit" className="btn-add-new">
                        {editData ? "💾 Lưu Thay Đổi" : "✅ Tạo Danh Mục"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceForm;