import React, { useEffect, useState } from "react";
import axios from "axios";

const ServiceManagement = ({ onAddNew, onEdit }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            // Chỉ lấy danh mục gốc (Master Data) từ bảng services
            const res = await axios.get("http://localhost:5000/api/services");

            if (res.data.success) {
                setServices(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi tải danh mục dịch vụ:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này? (Lưu ý: Chỉ xóa được nếu chưa có Đối tác nào sử dụng)")) 
            return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `http://localhost:5000/api/services/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            alert("Đã xóa danh mục thành công!");
            fetchServices();
        } catch (error) {
            const message = error.response?.data?.message || "Không thể xóa. Có thể danh mục này đang có đối tác cung cấp.";
            alert(message);
        }
    };

    if (loading) {
        return <div style={{ padding: 20 }}>Đang tải danh mục...</div>;
    }

    return (
        <div className="management-container">
            <div className="management-header">
                <h2>Từ điển Danh mục Dịch vụ</h2>
                <button
                    className="btn-add-new"
                    onClick={onAddNew}
                >
                    + Tạo Danh mục mới
                </button>
            </div>

            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên danh mục</th>
                            <th>Phân loại</th>
                            <th>Mô tả tiêu chuẩn</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center" }}>
                                    Hệ thống chưa có danh mục dịch vụ nào.
                                </td>
                            </tr>
                        ) : (
                            services.map(service => (
                                <tr key={service.service_id}>
                                    <td>#{service.service_id}</td>
                                    <td className="partner-name">
                                        {service.service_name}
                                    </td>
                                    <td>
                                        <span className="partner-type">
                                            {service.service_type}
                                        </span>
                                    </td>
                                    <td 
                                        style={{ 
                                            maxWidth: "300px", 
                                            overflow: "hidden", 
                                            textOverflow: "ellipsis", 
                                            whiteSpace: "nowrap",
                                            color: "#64748b"
                                        }}
                                    >
                                        {service.description || "Không có mô tả"}
                                    </td>
                                    <td className="action-cell">
                                        <button
                                            className="btn-action edit"
                                            title="Sửa tên danh mục"
                                            onClick={() => onEdit(service)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn-action delete"
                                            title="Xóa danh mục"
                                            onClick={() => handleDelete(service.service_id)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ServiceManagement;