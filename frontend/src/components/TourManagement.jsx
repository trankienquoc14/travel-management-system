import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../index.css';

const TourManagement = () => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // States for Price Editing Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTour, setEditingTour] = useState(null);
    const [newPrice, setNewPrice] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTours();
    }, []);

    const fetchTours = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); 
            const res = await axios.get('http://localhost:5000/api/tours/staff/tours', { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if (res.data.success) setTours(res.data.data);
        } catch (error) {
            console.error('Lỗi tải danh sách tour:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
        if (url.startsWith('http')) return url;
        let imagePath = url.startsWith('/') ? url.substring(1) : url;
        if (!imagePath.startsWith('uploads/')) imagePath = `uploads/${imagePath}`;
        return `http://localhost:5000/${imagePath}`;
    };

    const handleDelete = async (id) => {
        if (window.confirm('Thao tác này không thể hoàn tác. Bạn có chắc chắn muốn xóa Tour này?')) {
            const token = localStorage.getItem('token');
            try {
                await axios.delete(`http://localhost:5000/api/tours/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('🗑️ Đã xóa Tour thành công!');
                fetchTours();
            } catch (error) {
                alert('Không thể xóa! Tour này có thể đang liên kết với dữ liệu đặt chỗ.');
            }
        }
    };

    const handleToggleStatus = async (tour) => {
        const newStatus = tour.status === 'Active' ? 'Pending' : 'Active';
        const actionStr = newStatus === 'Active' ? 'MỞ BÁN' : 'TẠM NGƯNG';
        
        if (window.confirm(`Bạn có muốn ${actionStr} tour "${tour.tour_name}"?`)) {
            const token = localStorage.getItem('token');
            try {
                await axios.put(`http://localhost:5000/api/tours/admin/status/${tour.tour_id}`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } });
                
                fetchTours();
            } catch (error) {
                alert('Lỗi cập nhật trạng thái tour!');
            }
        }
    };

    const openEditPriceModal = (tour) => {
        setEditingTour(tour);
        setNewPrice(tour.base_price || 0);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingTour(null);
    };

    const handleSavePrice = async () => {
        if (!editingTour) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/tours/admin/price/${editingTour.tour_id}`, {
                base_price: Number(newPrice),
                markup_percent: editingTour.markup_percent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('💰 Cập nhật giá thành công!');
            closeEditModal();
            fetchTours();
        } catch (error) {
            console.error(error);
            alert('Lỗi khi cập nhật giá tour!');
        } finally {
            setIsSaving(false);
        }
    };

    // Filter Logic
    const filteredTours = useMemo(() => {
        return tours.filter(tour => {
            const matchStatus = statusFilter === 'All' || tour.status === statusFilter;
            const term = searchTerm.toLowerCase();
            const matchSearch = tour.tour_name?.toLowerCase().includes(term) || 
                                tour.destination?.toLowerCase().includes(term) ||
                                String(tour.tour_id) === term;
            return matchStatus && matchSearch;
        });
    }, [tours, searchTerm, statusFilter]);

    // Badge styling helper
    const getStatusStyle = (status) => {
        switch(status) {
            case 'Active': return { bg: '#ecfdf5', text: '#059669', label: 'Đang mở bán' };
            case 'Approved': return { bg: '#eff6ff', text: '#2563eb', label: 'Đã duyệt' };
            case 'Pending': return { bg: '#fffbeb', text: '#d97706', label: 'Chờ duyệt' };
            case 'Rejected': return { bg: '#fef2f2', text: '#dc2626', label: 'Từ chối' };
            default: return { bg: '#f3f4f6', text: '#4b5563', label: status };
        }
    };

    return (
        <div style={{ padding: '24px', fontFamily: '"Outfit", "Inter", sans-serif', background: '#f5f7fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '32px', color: '#111827', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Quản Lý Tour</h2>
                    <p style={{ color: '#4b5563', fontSize: '15px', margin: 0, fontWeight: '500' }}>Danh sách toàn bộ các Tour du lịch đang lưu trữ trên hệ thống.</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                {/* Search Input */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo Tên Tour, Điểm đến hoặc Mã ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', color: '#111827', transition: 'border-color 0.2s' }}
                    />
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', gap: '8px', background: '#f3f4f6', padding: '6px', borderRadius: '12px' }}>
                    {['All', 'Active', 'Approved', 'Pending'].map(status => {
                        const label = status === 'All' ? 'Tất cả' : getStatusStyle(status).label;
                        const isActive = statusFilter === status;
                        return (
                            <button 
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                style={{ 
                                    padding: '8px 16px', 
                                    background: isActive ? '#fff' : 'transparent', 
                                    color: isActive ? '#111827' : '#6b7280', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s',
                                    boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Đang tải dữ liệu tour...</div>
            ) : filteredTours.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '24px', border: '1px dashed #d1d5db' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>Không tìm thấy Tour nào</h4>
                    <p style={{ color: '#6b7280', fontSize: '15px' }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredTours.map(tour => {
                        const statusStyle = getStatusStyle(tour.status);
                        return (
                        <div key={tour.tour_id} style={{ display: 'flex', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)'; }}>
                            {/* Image Section */}
                            <div style={{ width: '240px', height: '100%', minHeight: '180px', overflow: 'hidden', position: 'relative' }}>
                                <img src={getImageUrl(tour.image_url)} alt="tour" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#111827', backdropFilter: 'blur(4px)' }}>
                                    #{tour.tour_id}
                                </div>
                            </div>
                            
                            {/* Content Section */}
                            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ 
                                                fontSize: '12px', padding: '4px 10px', borderRadius: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                                                background: statusStyle.bg,
                                                color: statusStyle.text
                                            }}>
                                                {statusStyle.label}
                                            </span>
                                        </div>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '22px', color: '#111827', fontWeight: '800', letterSpacing: '-0.3px' }}>{tour.tour_name}</h3>
                                        <div style={{ color: '#4b5563', fontSize: '14px', display: 'flex', gap: '20px', fontWeight: '500' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>{tour.destination}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>{tour.duration_days} ngày</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', background: '#f8fafc', padding: '12px 20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá Niêm Yết</div>
                                        <div style={{ fontSize: '24px', color: '#059669', fontWeight: '800' }}>{formatPrice(tour.base_price)}</div>
                                    </div>
                                </div>
                                
                                {/* Actions Area */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                                    <button onClick={() => openEditPriceModal(tour)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#fff', color: '#0284c7', border: '1px solid #e0f2fe', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(2,132,199,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                        Sửa Giá
                                    </button>
                                    
                                    {tour.status === 'Active' ? (
                                        <button onClick={() => handleToggleStatus(tour)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#fff', color: '#d97706', border: '1px solid #fef3c7', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(217,119,6,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#fffbeb'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                            Tạm Ngưng
                                        </button>
                                    ) : tour.status === 'Approved' || tour.status === 'Pending' ? (
                                        <button onClick={() => handleToggleStatus(tour)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#fff', color: '#059669', border: '1px solid #d1fae5', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(5,150,105,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                            Mở Bán
                                        </button>
                                    ) : null}

                                    <button onClick={() => handleDelete(tour.tour_id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}

            {/* Edit Price Modal */}
            {isEditModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 24, 39, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', width: '440px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '12px', borderRadius: '12px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '24px', color: '#111827', fontWeight: '800' }}>Điều Chỉnh Giá</h3>
                        </div>
                        
                        <p style={{ color: '#4b5563', fontSize: '15px', marginBottom: '28px', lineHeight: '1.6' }}>
                            Giá bán của tour <strong>{editingTour?.tour_name}</strong> sẽ thay đổi ngay lập tức trên website sau khi lưu.
                        </p>
                        
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá Bán Mới (VNĐ)</label>
                            <input 
                                type="number" 
                                value={newPrice} 
                                onChange={(e) => setNewPrice(e.target.value)}
                                style={{ width: '100%', padding: '16px', border: '2px solid #e5e7eb', borderRadius: '14px', fontSize: '18px', outline: 'none', fontWeight: '800', fontFamily: 'inherit', color: '#111827', transition: 'border-color 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#0284c7'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={closeEditModal} style={{ flex: 1, padding: '14px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}>
                                Hủy Bỏ
                            </button>
                            <button onClick={handleSavePrice} disabled={isSaving} style={{ flex: 1, padding: '14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }} onMouseEnter={e => e.currentTarget.style.background = '#0369a1'} onMouseLeave={e => e.currentTarget.style.background = '#0284c7'}>
                                {isSaving ? 'Đang lưu...' : 'Lưu Giá Mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TourManagement;
