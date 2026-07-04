import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/partner.css";

const PartnerManagement = ({ onAddNew, onEdit }) => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/partners");

            if (res.data.success) {
                setPartners(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi tải đối tác:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {

        if (!window.confirm("Bạn có chắc chắn muốn xóa đối tác này?"))
            return;

        try {

            const token = localStorage.getItem("token");

            await axios.delete(
                `http://localhost:5000/api/partners/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Đã xóa đối tác thành công!");

            fetchPartners();

        } catch (error) {

            const message =
                error.response?.data?.message ||
                "Có lỗi xảy ra.";

            alert(message);

        }

    };

    if (loading) {
        return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
    }

    return (
        <div className="management-container">

            <div className="management-header">

                <h2>Quản lý Đối tác</h2>

                <button
                    className="btn-add-new"
                    onClick={onAddNew}
                >
                    + Thêm Đối tác
                </button>

            </div>

            <div className="table-responsive">

                <table className="data-table">

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Tên đối tác</th>

                            <th>Loại</th>

                            <th>Người liên hệ</th>

                            <th>SĐT</th>


                            <th>Địa chỉ</th>

                            <th>Trạng thái</th>

                            <th>Hành động</th>

                        </tr>

                    </thead>

                    <tbody>

                        {
                            partners.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="9"
                                        style={{ textAlign: "center" }}
                                    >
                                        Chưa có dữ liệu.
                                    </td>

                                </tr>

                            ) : (

                                partners.map(partner => (

                                    <tr key={partner.partner_id}>

                                        <td>#{partner.partner_id}</td>

                                        <td className="partner-name">
                                            {partner.partner_name}
                                        </td>

                                        <td>
                                            <span className="partner-type">
                                                {partner.partner_type}
                                            </span>
                                        </td>

                                        <td>
                                            {partner.contact_name}
                                        </td>

                                        <td>
                                            {partner.phone}
                                        </td>

                                        

                                        <td
                                            style={{
                                                maxWidth: "180px",
                                                overflow: "hidden",
                                                whiteSpace: "nowrap",
                                                textOverflow: "ellipsis"
                                            }}
                                        >
                                            {partner.address}
                                        </td>

                                        <td
                                            style={{
                                                width: "100px",
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            <span
                                                className={`status-badge ${partner.status === "Active"
                                                    ? "success"
                                                    : "danger"
                                                    }`}
                                            >
                                                {partner.status === "Active"
                                                    ? "Hoạt động"
                                                    : "Tạm ngưng"}
                                            </span>
                                        </td>

                                        <td>

                                            <button
                                                className="btn-action edit"
                                                onClick={() => onEdit(partner)}
                                            >
                                                ✏️
                                            </button>

                                            <button
                                                className="btn-action delete"
                                                onClick={() =>
                                                    handleDelete(
                                                        partner.partner_id
                                                    )
                                                }
                                            >
                                                🗑️
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )
                        }

                    </tbody>

                </table>

            </div>

        </div>
    );
};

export default PartnerManagement;