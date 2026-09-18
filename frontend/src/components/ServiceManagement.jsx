import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Building2, Plus, Edit2, Trash2, Tag, DollarSign, Package } from 'lucide-react';
import '../styles/PlaceManagement.css'; // Dùng chung CSS với PlaceManagement để đồng bộ thiết kế

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [selectedDestination, setSelectedDestination] = useState('');
    
    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        service_name: '',
        service_type: 'Xe vận chuyển',
        description: '',
        partner_id: '',
        destination_id: '',
        unit: '',
        base_cost: 0,
        selling_price: 0,
        capacity: 0,
        status: 'Active'
    });
    const [focusedField, setFocusedField] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [mainTab, setMainTab] = useState('Active'); // 'Active' or 'Pending'

    const categories = ['Tất cả', 'Xe 16 chỗ', 'Xe 29 chỗ', 'Xe 45 chỗ', 'Xe Giường Nằm', 'Xe Limousine', 'Khác'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [resServices, resDest, resPartners] = await Promise.all([
                axios.get('http://localhost:5000/api/services', config),
                axios.get('http://localhost:5000/api/destinations', config),
                axios.get('http://localhost:5000/api/services/partners', config)
            ]);

            if (resServices.data.success) setServices(resServices.data.data);
            if (resDest.data.success) setDestinations(resDest.data.data);
            if (resPartners.data.success) setPartners(resPartners.data.data);
            
        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddNewClick = () => {
        setFormData({
            service_name: '',
            service_type: 'Khách sạn',
            description: '',
            partner_id: '',
            destination_id: '',
            unit: '',
            base_cost: 0,
            selling_price: 0,
            capacity: 0,
            status: 'Active'
        });
        setImageFile(null);
        setImagePreview(null);
        setEditId(null);
        setShowForm(true);
    };

    const handleEditClick = (service) => {
        setFormData({
            service_name: service.service_name,
            service_type: service.service_type || 'Khách sạn',
            description: service.description || '',
            partner_id: service.partner_id || '',
            destination_id: service.destination_id || '',
            unit: service.unit || '',
            base_cost: service.base_cost ? parseInt(service.base_cost, 10) : 0,
            selling_price: service.selling_price ? parseInt(service.selling_price, 10) : 0,
            capacity: service.capacity || 0,
            status: service.status || 'Active',
            existing_image_url: service.image_url || '',
            proposed_cost: service.proposed_cost || null
        });
        setImageFile(null);
        setImagePreview(service.image_url ? `http://localhost:5000${service.image_url}` : null);
        setEditId(service.service_id);
        setShowForm(true);
    };

    
    const handleCurrencyChange = (e) => {
        const { name, value } = e.target;
        if (!/^\d*$/.test(value)) return;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } }; 

            const data = new FormData();
            if (formData.selling_price) formData.selling_price = parseInt(formData.selling_price, 10);
            if (formData.base_cost) formData.base_cost = parseInt(formData.base_cost, 10);
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== "") {
                    let value = formData[key];
                    if (typeof value === 'object' && !(value instanceof File)) {
                        value = JSON.stringify(value);
                    }
                    data.append(key, value);
                }
            });
            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editId) {
                await axios.put(`http://localhost:5000/api/services/${editId}`, data, config);
            } else {
                await axios.post('http://localhost:5000/api/services', data, config);
            }

            setShowForm(false);
            fetchData();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (service_id) => {
        if (window.confirm('Bạn có chắc chắn muốn gỡ đăng bán phương tiện này? Dịch vụ sẽ không còn hiển thị cho khách hàng.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/services/${service_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Đã gỡ đăng bán thành công!');
                fetchData();
            } catch (error) {
                alert('Lỗi khi gỡ đăng bán: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    // Filter logic
    const filteredServices = services.filter(service => {
        // Chỉ hiển thị phương tiện nội bộ (không có đối tác)
        if (service.partner_id || service.partner_name) return false;
        if (service.service_type !== 'Xe vận chuyển') return false;

        if (mainTab === 'Active' && service.status === 'Pending') return false;
        if (mainTab === 'Pending' && service.status !== 'Pending') return false;

        const matchSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (service.partner_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = selectedCategory === 'Tất cả' || service.service_type === selectedCategory;
        const matchDestination = selectedDestination === '' || String(service.destination_id) === String(selectedDestination);
        return matchSearch && matchCategory && matchDestination;
    });

    const getCategoryIcon = (cat) => {
        switch(cat) {
            case 'Khách sạn': return '🏨';
            case 'Nhà hàng': return '🍽️';
            case 'Xe vận chuyển': return '🚌';
            case 'Vé máy bay': return '✈️';
            case 'Vé tham quan': return '🎫';
            default: return '🔖';
        }
    };

    const getCategoryColor = (cat) => {
        switch(cat) {
            case 'Khách sạn': return '#3b82f6'; // Blue
            case 'Nhà hàng': return '#ef4444'; // Red
            case 'Xe vận chuyển': return '#f59e0b'; // Amber
            case 'Vé máy bay': return '#0ea5e9'; // Light Blue
            case 'Vé tham quan': return '#8b5cf6'; // Purple
            default: return '#64748b'; // Slate
        }
    };

    const isGlobalService = formData.service_type === 'Xe vận chuyển' || formData.service_type === 'Vé máy bay';

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
                <p style={{ fontSize: '18px', color: '#64748b' }}>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="pm-container">
            
            {/* Header Section */}
            <div className="pm-header">
                <div>
                    <h2>Quản Lý Đội Xe Nội Bộ</h2>
                    <p>Quản lý thông tin phương tiện vận chuyển và đội xe của công ty.</p>
                </div>
            </div>

            {/* Main Tabs */}
            {!showForm && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '0 20px' }}>
                    <button 
                        onClick={() => setMainTab('Active')} 
                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: mainTab === 'Active' ? '#3b82f6' : '#e2e8f0', color: mainTab === 'Active' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                    >
                        ✅ Xe Đang Hoạt Động
                    </button>
                    <button 
                        onClick={() => setMainTab('Pending')} 
                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: mainTab === 'Pending' ? '#f59e0b' : '#e2e8f0', color: mainTab === 'Pending' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                    >
                        ⏳ Xe Tạm Ngưng
                    </button>
                </div>
            )}

            {showForm ? (
                /* FORM THÊM / SỬA */
                <div className="pm-form-card">
                    <div className="pm-form-header">
                        <h3>{editId ? '✏️ Sửa Thông Tin Dịch Vụ' : '✨ Tạo Dịch Vụ Mới'}</h3>
                        <button type="button" onClick={() => setShowForm(false)} className="pm-btn-secondary">
                            Hủy bỏ
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="pm-form-body">
                        <div className="pm-form-grid">
                            
                            <div className="pm-form-group full">
                                <label className="pm-form-label">Tên Phương Tiện <span>*</span></label>
                                <input 
                                    type="text" name="service_name" value={formData.service_name} onChange={handleInputChange} required 
                                    className="pm-form-input"
                                />
                            </div>
                            
                            <div className="pm-form-group">
                                <label className="pm-form-label">Phân Loại</label>
                                <select 
                                    name="service_type" value={formData.service_type} onChange={handleInputChange} required
                                    className="pm-form-select"
                                >
                                    {categories.filter(c => c !== 'Tất cả').map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            

                            

                            <div className="pm-form-group">
                                <label className="pm-form-label">Đơn Vị Tính</label>
                                <input 
                                    type="text" name="unit" value={formData.unit} onChange={handleInputChange} 
                                    className="pm-form-input"
                                />
                            </div>

                            <div className="pm-form-group">
                                <label className="pm-form-label">Sức Chứa / Số Lượng</label>
                                <input 
                                    type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} 
                                    className="pm-form-input"
                                />
                            </div>

                            <div className="pm-form-group">
                                <label className="pm-form-label">Giá Vốn (Net) (VNĐ)</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                    type="text" name="base_cost" 
                                    value={formData.base_cost ? Number(formData.base_cost).toLocaleString('vi-VN') : ''} 
                                    className="pm-form-input" disabled style={{ backgroundColor: '#f1f5f9' }}
                                />
                                    <span style={{ position: 'absolute', right: '15px', color: '#64748b', fontWeight: 'bold' }}>đ</span>
                                </div>
                            </div>
                            
                            

                            <div className="pm-form-group full">
                                <label className="pm-form-label" style={{ color: '#10b981', fontSize: '15px' }}>💰 Giá Bán Chính Thức (Niêm Yết Cho Khách) <span>*</span></label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                    type="text" name="selling_price" 
                                    value={focusedField === 'selling_price' ? (formData.selling_price || '') : (formData.selling_price ? Number(formData.selling_price).toLocaleString('vi-VN') : '')} 
                                    onFocus={() => setFocusedField('selling_price')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={handleCurrencyChange} 
                                    className="pm-form-input" required
                                    style={{ border: '2px solid #10b981', fontSize: '16px', fontWeight: 'bold' }}
                                />
                                    <span style={{ position: 'absolute', right: '15px', color: '#64748b', fontWeight: 'bold' }}>đ</span>
                                </div>
                            </div>

                            <div className="pm-form-group full">
                                <label className="pm-form-label">Mô Tả Nhanh</label>
                                <textarea 
                                    name="description" value={formData.description} onChange={handleInputChange} rows="3"
                                    className="pm-form-textarea"
                                ></textarea>
                            </div>

                            <div className="pm-form-group full">
                                <label className="pm-form-label">Hình Ảnh Dịch Vụ (Cập nhật nếu cần)</label>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="pm-image-preview" style={{ opacity: 1, marginBottom: '10px' }} />
                                ) : (
                                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>Chưa có hình ảnh</p>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setImageFile(file);
                                            setImagePreview(URL.createObjectURL(file));
                                        }
                                    }} 
                                    className="pm-form-input" 
                                    style={{ padding: '5px' }}
                                />
                            </div>
                        </div>

                        <div className="pm-form-footer">
                            {formData.status === 'Pending' ? (
                                <button type="button" onClick={() => { setFormData({...formData, status: 'Active'}); handleSubmit({preventDefault: () => {}}); }} className="pm-form-submit" style={{ backgroundColor: '#10b981' }}>
                                    ✅ Duyệt & Đăng Bán
                                </button>
                            ) : (
                                <button type="submit" className="pm-form-submit">
                                    💾 Lưu Thay Đổi
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    {/* Toolbar Section */}
                    <div className="pm-toolbar">
                        
                        {/* Search Bar & Destination Filter */}
                        <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                            <div className="pm-search-box" style={{ flex: 1 }}>
                                <Search size={20} />
                                <input 
                                    type="text"
                                    placeholder="Tìm kiếm phương tiện hoặc đối tác..."
                                    className="pm-search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <select 
                                className="pm-form-select" 
                                style={{ width: '250px', backgroundColor: '#f1f5f9', border: 'none' }}
                                value={selectedDestination}
                                onChange={(e) => setSelectedDestination(e.target.value)}
                            >
                                <option value="">Tất cả điểm đến</option>
                                {destinations.map(d => (
                                    <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filters */}
                        <div className="pm-filters">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`pm-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Services Grid */}
                    {filteredServices.length === 0 ? (
                        <div className="pm-empty">
                            <div className="pm-empty-icon">
                                <Package size={32} />
                            </div>
                            <h3>Không tìm thấy phương tiện</h3>
                            <p>Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                        </div>
                    ) : (
                        <div className="pm-grid">
                            {filteredServices.map(service => (
                                <div key={service.service_id} className="pm-card">
                                    
                                    {/* Card Header */}
                                    <div 
                                        className="pm-card-header" 
                                        style={{ 
                                            backgroundColor: service.image_url ? 'transparent' : `${getCategoryColor(service.service_type)}15`,
                                            backgroundImage: service.image_url ? `url("http://localhost:5000${service.image_url}")` : 'none'
                                        }}
                                    >
                                        <div className="pm-badge" style={{ color: getCategoryColor(service.service_type) }}>
                                            <span>{getCategoryIcon(service.service_type)}</span> {service.service_type}
                                        </div>
                                        {service.status === 'Pending' && (
                                            <div className="pm-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', fontWeight: 'bold' }}>
                                                ⏳ Yêu Cầu Duyệt
                                            </div>
                                        )}
                                        {!service.image_url && (
                                            <div className="pm-card-icon">
                                                {getCategoryIcon(service.service_type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="pm-card-body">
                                        <h3 className="pm-card-title">{service.service_name}</h3>
                                        
                                        <div className="pm-card-location">
                                            <MapPin size={16} /> {service.destination_name || "Di động / Toàn cục"}
                                        </div>

                                        {/* Partner Badge */}
                                        
                                        
                                        {/* Cost Info */}
                                        <div className="pm-partner-info" style={{ marginTop: '8px', borderTop: 'none', paddingTop: '0' }}>
                                            <div className="pm-partner-label">Giá vốn (Net)</div>
                                            <div style={{ color: '#d97706', fontWeight: 'bold' }}>
                                                {service.proposed_cost ? Number(service.proposed_cost).toLocaleString('vi-VN') : Number(service.base_cost).toLocaleString('vi-VN')} đ 
                                                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>
                                                    {service.unit ? ` / ${service.unit}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price & Actions */}
                                        <div className="pm-card-footer">
                                            <div>
                                                <div className="pm-price-label">Giá Bán Lẻ</div>
                                                <div className="pm-price-value" style={{ color: '#10b981' }}>
                                                    {Number(service.selling_price) === 0 
                                                        ? 'Theo báo giá' 
                                                        : `${Number(service.selling_price).toLocaleString('vi-VN')} đ`}
                                                </div>
                                            </div>
                                            
                                            <div className="pm-actions">
                                                <button onClick={() => handleEditClick(service)} className="pm-btn-icon edit" title={service.status === 'Pending' ? "Xét duyệt" : "Xem chi tiết / Cập nhật giá"}>
                                                    <Edit2 size={18} />
                                                </button>
                                                {service.status !== 'Inactive' && (
                                                    <button onClick={() => handleDelete(service.service_id)} className="pm-btn-icon delete" title="Gỡ đăng bán (Tạm ẩn)">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                                {service.status === 'Inactive' && (
                                                    <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginLeft: '10px' }}>Đã gỡ</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ServiceManagement;
