import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import '../styles/PlaceManagement.css'; // MỚI: Dùng CSS tùy chỉnh thay vì Tailwind

const PlaceManagement = () => {
    const [places, setPlaces] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDestination, setSelectedDestination] = useState('');
    
    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        place_name: '',
        destination_id: '',
        partner_id: '',
        category: 'Tham quan',
        estimated_price: 0,
        description: '',
        status: 'Active'
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const categories = ['All', 'Tham quan', 'Vui chơi', 'Ăn uống', 'Mua sắm', 'Nghỉ dưỡng'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [resPlaces, resDest, resPartners] = await Promise.all([
                axios.get('http://localhost:5000/api/places/all', config),
                axios.get('http://localhost:5000/api/destinations', config),
                axios.get('http://localhost:5000/api/partners', config)
            ]);

            if (resPlaces.data.success) setPlaces(resPlaces.data.data);
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

    const handleAddNewClick = () => {
        setFormData({
            place_name: '',
            destination_id: '',
            partner_id: '',
            category: 'Tham quan',
            estimated_price: 0,
            description: '',
            status: 'Active'
        });
        setImageFile(null);
        setImagePreview(null);
        setEditId(null);
        setShowForm(true);
    };

    const handleEditClick = (place) => {
        setFormData({
            place_name: place.place_name,
            destination_id: place.destination_id || '',
            partner_id: place.partner_id || '',
            category: place.category || 'Tham quan',
            estimated_price: place.estimated_price || 0,
            description: place.description || '',
            status: place.status || 'Active',
            existing_image_url: place.image_url || ''
        });
        setImageFile(null);
        setImagePreview(place.image_url ? `http://localhost:5000${place.image_url}` : null);
        setEditId(place.place_id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } }; // multer sẽ tự xử lý headers khi dùng FormData, axios có thể nhận diện

            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });
            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editId) {
                await axios.put(`http://localhost:5000/api/places/${editId}`, data, config);
            } else {
                await axios.post('http://localhost:5000/api/places', data, config);
            }

            setShowForm(false);
            fetchData();
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc muốn xóa địa điểm này?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/places/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchData();
            } catch (error) {
                alert('Lỗi khi xóa địa điểm');
            }
        }
    };

    // Filter logic
    const filteredPlaces = places.filter(place => {
        const matchSearch = place.place_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (place.partner_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = selectedCategory === 'All' || place.category === selectedCategory;
        const matchDestination = selectedDestination === '' || String(place.destination_id) === String(selectedDestination);
        return matchSearch && matchCategory && matchDestination;
    });

    const getCategoryIcon = (cat) => {
        switch(cat) {
            case 'Tham quan': return '🏞️';
            case 'Vui chơi': return '🎢';
            case 'Ăn uống': return '🍽️';
            case 'Mua sắm': return '🛍️';
            case 'Nghỉ dưỡng': return '🏖️';
            default: return '📍';
        }
    };

    const getCategoryColor = (cat) => {
        switch(cat) {
            case 'Tham quan': return '#0ea5e9'; // Blue
            case 'Vui chơi': return '#f59e0b'; // Amber
            case 'Ăn uống': return '#ef4444'; // Red
            case 'Mua sắm': return '#8b5cf6'; // Purple
            case 'Nghỉ dưỡng': return '#10b981'; // Emerald
            default: return '#64748b';
        }
    };

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
                    <h2>Địa Điểm & Dịch Vụ</h2>
                    <p>Quản lý các điểm tham quan, vui chơi và liên kết với đối tác cung cấp.</p>
                </div>
                {!showForm && (
                    <button onClick={handleAddNewClick} className="pm-btn-primary">
                        <Plus size={20} />
                        Thêm Địa Điểm Mới
                    </button>
                )}
            </div>

            {showForm ? (
                /* FORM THÊM / SỬA (CHUYÊN NGHIỆP, KO DÙNG TAILWIND) */
                <div className="pm-form-card">
                    <div className="pm-form-header">
                        <h3>{editId ? '✏️ Sửa Thông Tin Địa Điểm' : '✨ Tạo Địa Điểm Mới'}</h3>
                        <button type="button" onClick={() => setShowForm(false)} className="pm-btn-secondary">
                            Hủy bỏ
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="pm-form-body">
                        <div className="pm-form-grid">
                            
                            <div className="pm-form-group full">
                                <label className="pm-form-label">Tên Địa Điểm / Dịch Vụ <span>*</span></label>
                                <input 
                                    type="text" name="place_name" value={formData.place_name} onChange={handleInputChange} required 
                                    className="pm-form-input"
                                    placeholder="Ví dụ: Vé cáp treo Sun World"
                                />
                            </div>
                            
                            <div className="pm-form-group">
                                <label className="pm-form-label">Điểm Đến <span>*</span></label>
                                <select 
                                    name="destination_id" value={formData.destination_id} onChange={handleInputChange} required
                                    className="pm-form-select"
                                >
                                    <option value="">-- Lựa chọn điểm đến --</option>
                                    {destinations.map(d => (
                                        <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pm-form-group">
                                <label className="pm-form-label">Phân Loại <span>*</span></label>
                                <select 
                                    name="category" value={formData.category} onChange={handleInputChange} required
                                    className="pm-form-select"
                                >
                                    {categories.filter(c => c !== 'All').map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pm-form-group">
                                <label className="pm-form-label">Đối Tác Cung Cấp</label>
                                <select 
                                    name="partner_id" value={formData.partner_id} onChange={handleInputChange}
                                    className="pm-form-select"
                                >
                                    <option value="">-- Tự do (Không thuộc đối tác) --</option>
                                    {partners.map(p => (
                                        <option key={p.partner_id} value={p.partner_id}>{p.partner_name} ({p.partner_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pm-form-group">
                                <label className="pm-form-label">Giá Tham Khảo (VNĐ)</label>
                                <input 
                                    type="number" name="estimated_price" value={formData.estimated_price} onChange={handleInputChange} 
                                    className="pm-form-input"
                                    placeholder="0"
                                />
                            </div>

                            <div className="pm-form-group full">
                                <label className="pm-form-label">Mô Tả Nhanh</label>
                                <textarea 
                                    name="description" value={formData.description} onChange={handleInputChange} rows="3"
                                    className="pm-form-textarea"
                                    placeholder="Thông tin thêm về địa điểm này..."
                                ></textarea>
                            </div>

                            <div className="pm-form-group full">
                                <label className="pm-form-label">Hình Ảnh Địa Điểm</label>
                                <input 
                                    type="file" accept="image/*" onChange={handleImageChange}
                                    className="pm-form-file"
                                />
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" className="pm-image-preview" />
                                )}
                            </div>
                        </div>

                        <div className="pm-form-footer">
                            <button type="submit" className="pm-form-submit">
                                {editId ? '💾 Lưu Thay Đổi' : 'Xác Nhận Tạo'}
                            </button>
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
                                    placeholder="Tìm kiếm địa điểm hoặc nhà cung cấp..."
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
                                    {cat === 'All' ? 'Tất cả' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Places Grid */}
                    {filteredPlaces.length === 0 ? (
                        <div className="pm-empty">
                            <div className="pm-empty-icon">
                                <MapPin size={32} />
                            </div>
                            <h3>Không tìm thấy địa điểm</h3>
                            <p>Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                        </div>
                    ) : (
                        <div className="pm-grid">
                            {filteredPlaces.map(place => (
                                <div key={place.place_id} className="pm-card">
                                    
                                    {/* Card Header with Background Image or Color */}
                                    <div 
                                        className="pm-card-header" 
                                        style={{ 
                                            backgroundColor: place.image_url ? 'transparent' : `${getCategoryColor(place.category)}15`,
                                            backgroundImage: place.image_url ? `url(http://localhost:5000${place.image_url})` : 'none'
                                        }}
                                    >
                                        <div className="pm-badge" style={{ color: getCategoryColor(place.category) }}>
                                            <span>{getCategoryIcon(place.category)}</span> {place.category}
                                        </div>
                                        {!place.image_url && (
                                            <div className="pm-card-icon">
                                                {getCategoryIcon(place.category)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="pm-card-body">
                                        <h3 className="pm-card-title">{place.place_name}</h3>
                                        
                                        <div className="pm-card-location">
                                            <MapPin size={16} /> {place.destination_name}
                                        </div>

                                        {/* Partner Badge */}
                                        <div className="pm-partner-info">
                                            <div className="pm-partner-label">Cung cấp bởi</div>
                                            <div className="pm-partner-name">
                                                {place.partner_id ? (
                                                    <><Building2 size={16} color="#10b981" /> {place.partner_name}</>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>Tự do (Không đối tác)</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price & Actions */}
                                        <div className="pm-card-footer">
                                            <div>
                                                <div className="pm-price-label">Giá tham khảo</div>
                                                <div className="pm-price-value">
                                                    {Number(place.estimated_price) === 0 
                                                        ? 'Miễn phí' 
                                                        : `${Number(place.estimated_price).toLocaleString('vi-VN')} đ`}
                                                </div>
                                            </div>
                                            
                                            <div className="pm-actions">
                                                <button onClick={() => handleEditClick(place)} className="pm-btn-icon edit" title="Chỉnh sửa">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(place.place_id)} className="pm-btn-icon delete" title="Xóa">
                                                    <Trash2 size={18} />
                                                </button>
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

export default PlaceManagement;
