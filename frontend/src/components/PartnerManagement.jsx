import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, Plus, Edit2, Trash2, Building2, Phone, MapPin, User, Briefcase } from 'lucide-react';
import '../styles/PlaceManagement.css'; 

const PartnerManagement = ({ onAddNew, onEdit }) => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('All');

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
        if (!window.confirm("Bạn có chắc chắn muốn xóa đối tác này?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/partners/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Đã xóa đối tác thành công!");
            fetchPartners();
        } catch (error) {
            alert(error.response?.data?.message || "Có lỗi xảy ra.");
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
                <p style={{ fontSize: '18px', color: '#64748b' }}>Đang tải dữ liệu...</p>
            </div>
        );
    }

    const partnerTypes = ['All', ...new Set(partners.map(p => p.partner_type).filter(Boolean))];

    const filteredPartners = partners.filter(p => {
        const matchSearch = p.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = selectedType === 'All' || p.partner_type === selectedType;
        return matchSearch && matchType;
    });

    const getTypeColor = (type) => {
        switch(type) {
            case 'Khách sạn': return '#3b82f6';
            case 'Nhà hàng': return '#ef4444';
            case 'Nhà xe': return '#f59e0b';
            case 'Hãng hàng không': return '#0ea5e9';
            case 'Khu du lịch': return '#8b5cf6';
            default: return '#64748b';
        }
    };

    return (
        <div className="pm-container">
            {/* Header Section */}
            <div className="pm-header">
                <div>
                    <h2>Quản Lý Đối Tác</h2>
                    <p>Quản lý mạng lưới đối tác cung cấp dịch vụ và thông tin liên hệ.</p>
                </div>
                <button onClick={onAddNew} className="pm-btn-primary">
                    <Plus size={20} />
                    Thêm Đối Tác Mới
                </button>
            </div>

            {/* Toolbar Section */}
            <div className="pm-toolbar">
                <div className="pm-search-box" style={{ width: '400px', flex: 'none' }}>
                    <Search size={20} />
                    <input 
                        type="text"
                        placeholder="Tìm kiếm đối tác hoặc liên hệ..."
                        className="pm-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Type Filters */}
                <div className="pm-filters" style={{ flex: 1, overflowX: 'auto' }}>
                    {partnerTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`pm-filter-btn ${selectedType === type ? 'active' : ''}`}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {type === 'All' ? 'Tất cả' : type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Partners Grid */}
            {filteredPartners.length === 0 ? (
                <div className="pm-empty">
                    <div className="pm-empty-icon">
                        <Building2 size={32} />
                    </div>
                    <h3>Không tìm thấy đối tác</h3>
                    <p>Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                </div>
            ) : (
                <div className="pm-grid">
                    {filteredPartners.map(partner => (
                        <div key={partner.partner_id} className="pm-card" onClick={() => onEdit(partner)} style={{ cursor: 'pointer' }} title="Nhấn để xem thông tin chi tiết">
                            
                            {/* Card Header */}
                            <div 
                                className="pm-card-header" 
                                style={{ backgroundColor: `${getTypeColor(partner.partner_type)}15` }}
                            >
                                <div className="pm-badge" style={{ color: getTypeColor(partner.partner_type) }}>
                                    <Briefcase size={14} style={{ marginRight: '4px' }} />
                                    {partner.partner_type || 'Chưa phân loại'}
                                </div>
                                <div className="pm-card-icon">
                                    <Building2 size={40} color={getTypeColor(partner.partner_type)} style={{ opacity: 0.2 }} />
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="pm-card-body">
                                <h3 className="pm-card-title">{partner.partner_name}</h3>
                                
                                <div className="pm-card-location">
                                    <MapPin size={16} /> {partner.address || 'Chưa cập nhật địa chỉ'}
                                </div>

                                <div className="pm-partner-info">
                                    <div className="pm-partner-label">Liên hệ đối tác</div>
                                    <div className="pm-partner-name">
                                        <User size={16} color="#64748b" /> {partner.contact_name || 'Đang cập nhật'}
                                    </div>
                                    <div className="pm-partner-name" style={{ marginTop: '8px' }}>
                                        <Phone size={16} color="#64748b" /> {partner.phone || 'Đang cập nhật'}
                                    </div>
                                </div>

                                {/* Footer & Actions */}
                                <div className="pm-card-footer">
                                    <div>
                                        <div className="pm-price-label">Trạng thái</div>
                                        <div className="pm-price-value" style={{ marginTop: '6px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                                                background: partner.status === 'Active' ? '#dcfce3' : '#fee2e2',
                                                color: partner.status === 'Active' ? '#16a34a' : '#dc2626'
                                            }}>
                                                {partner.status === 'Active' ? 'Hoạt động' : 'Tạm ngưng'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="pm-actions">
                                        <button onClick={(e) => { e.stopPropagation(); onEdit(partner); }} className="pm-btn-icon edit" title="Chỉnh sửa">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(partner.partner_id); }} className="pm-btn-icon delete" title="Xóa">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PartnerManagement;