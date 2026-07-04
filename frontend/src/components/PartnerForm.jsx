import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/partner.css";

const PartnerForm = ({ editData, onBack }) => {

    const [formData, setFormData] = useState({
        partner_name: "",
        partner_type: "Hotel",
        contact_name: "",
        phone: "",
        email: "",
        address: "",
        status: "Active"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {

        if (editData) {

            setFormData({

                partner_name: editData.partner_name || "",
                partner_type: editData.partner_type || "Hotel",
                contact_name: editData.contact_name || "",
                phone: editData.phone || "",
                email: editData.email || "",
                address: editData.address || "",
                status: editData.status || "Active"

            });

        }

    }, [editData]);

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.partner_name.trim()) {
            return alert("Vui lòng nhập tên đối tác.");
        }

        if (!formData.contact_name.trim()) {
            return alert("Vui lòng nhập người liên hệ.");
        }

        if (!formData.phone.trim()) {
            return alert("Vui lòng nhập số điện thoại.");
        }

        setIsSubmitting(true);

        try {

            const token = localStorage.getItem("token");

            if (editData) {

                await axios.put(

                    `http://localhost:5000/api/partners/${editData.partner_id}`,

                    formData,

                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }

                );

                alert("Cập nhật đối tác thành công!");

            } else {

                await axios.post(

                    "http://localhost:5000/api/partners",

                    formData,

                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }

                );

                alert("Thêm đối tác thành công!");

            }

            onBack();

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.message ||
                "Có lỗi xảy ra."
            );

        } finally {

            setIsSubmitting(false);

        }

    };

    return (

        <div className="form-page-container">

            <div className="form-page-header">

                <button
                    className="btn-back"
                    type="button"
                    onClick={onBack}
                >
                    ⬅ Quay lại
                </button>

                <h2>
                    {editData ? "Cập nhật Đối tác" : "Thêm Đối tác"}
                </h2>

            </div>

            <form
                className="full-page-form"
                onSubmit={handleSubmit}
            >

                <div className="form-grid">

                    <div className="form-group full-width">

                        <label>Tên đối tác *</label>

                        <input
                            type="text"
                            name="partner_name"
                            value={formData.partner_name}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Loại đối tác</label>

                        <select
                            name="partner_type"
                            value={formData.partner_type}
                            onChange={handleChange}
                        >

                            <option value="Hotel">
                                Hotel
                            </option>

                            <option value="Transport">
                                Transport
                            </option>

                            <option value="Restaurant">
                                Restaurant
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>

                    <div className="form-group">

                        <label>Người liên hệ</label>

                        <input
                            type="text"
                            name="contact_name"
                            value={formData.contact_name}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-group">

                        <label>Số điện thoại</label>

                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-group">

                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-group full-width">

                        <label>Địa chỉ</label>

                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="form-group">

                        <label>Trạng thái</label>

                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >

                            <option value="Active">
                                Hoạt động
                            </option>

                            <option value="Inactive">
                                Tạm ngưng
                            </option>

                        </select>

                    </div>

                </div>

                <div className="form-actions">

                    <button
                        type="button"
                        className="btn-cancel-lg"
                        onClick={onBack}
                    >
                        Hủy bỏ
                    </button>

                    <button
                        type="submit"
                        className="btn-save-lg"
                        disabled={isSubmitting}
                    >
                        {
                            isSubmitting
                                ? "Đang xử lý..."
                                : editData
                                    ? "Lưu thay đổi"
                                    : "Thêm đối tác"
                        }
                    </button>

                </div>

            </form>

        </div>

    );

};

export default PartnerForm;