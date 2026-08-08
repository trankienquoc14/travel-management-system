import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../index.css';

const TourManagement = () => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter & Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('fixed');
    const [expandedDest, setExpandedDest] = useState({});

    // States for Itinerary Viewing Modal
    const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
    const [viewingTourDetail, setViewingTourDetail] = useState(null);
    const [loadingItinerary, setLoadingItinerary] = useState(false);
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

    const openItineraryModal = async (tour) => {
        setIsItineraryModalOpen(true);
        setLoadingItinerary(true);
        setViewingTourDetail(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/tours/staff/tours/${tour.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setViewingTourDetail(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi lấy chi tiết lịch trình:", error);
            alert("Không thể tải lịch trình!");
            setIsItineraryModalOpen(false);
        } finally {
            setLoadingItinerary(false);
        }
    };

    const closeItineraryModal = () => {
        setIsItineraryModalOpen(false);
        setViewingTourDetail(null);
    };

    // Filter Logic
    const filteredTours = useMemo(() => {
        return tours.filter(tour => {
            const matchStatus = statusFilter === 'All' || tour.status === statusFilter;
            const matchType = typeFilter === 'custom' ? tour.is_custom === 1 : (tour.is_custom === 0 || !tour.is_custom);
            const term = searchTerm.toLowerCase();
            const matchSearch = tour.tour_name?.toLowerCase().includes(term) || 
                                tour.destination?.toLowerCase().includes(term) ||
                                String(tour.tour_id) === term;
            return matchStatus && matchType && matchSearch;
        });
    }, [tours, searchTerm, statusFilter, typeFilter]);

    // Group Logic
    const groupedTours = useMemo(() => {
        const groups = {};
        filteredTours.forEach(tour => {
            const dest = tour.destination || 'Chưa xác định';
            if (!groups[dest]) groups[dest] = [];
            groups[dest].push(tour);
        });
        return groups;
    }, [filteredTours]);

    const toggleDestination = (dest) => {
        setExpandedDest(prev => ({ ...prev, [dest]: !prev[dest] }));
    };

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

            {/* Tour Type Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#e5e7eb', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                <button 
                    onClick={() => setTypeFilter('fixed')}
                    style={{ padding: '10px 20px', background: typeFilter === 'fixed' ? '#fff' : 'transparent', color: typeFilter === 'fixed' ? '#0194f3' : '#4b5563', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: typeFilter === 'fixed' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >
                    Tour Cố Định
                </button>
                <button 
                    onClick={() => setTypeFilter('custom')}
                    style={{ padding: '10px 20px', background: typeFilter === 'custom' ? '#fff' : 'transparent', color: typeFilter === 'custom' ? '#0194f3' : '#4b5563', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: typeFilter === 'custom' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                >
                    Tour Thiết Kế Riêng
                </button>
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
                    {Object.entries(groupedTours).map(([dest, destTours]) => {
                        const isExpanded = expandedDest[dest];
                        return (
                            <div key={dest} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                {/* Accordion Header */}
                                <div 
                                    onClick={() => toggleDestination(dest)}
                                    style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#fff', borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none', transition: 'background 0.2s' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '12px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: '800' }}>{dest}</h3>
                                            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginTop: '4px' }}>{destTours.length} Tour du lịch</div>
                                        </div>
                                    </div>
                                    <div style={{ color: '#9ca3af', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>

                                {/* Accordion Body (Grid of Tours) */}
                                {isExpanded && (
                                    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px', background: '#f9fafb' }}>
                                        {destTours.map(tour => {
                                            const statusStyle = getStatusStyle(tour.status);
                                            return (
                                                <div key={tour.tour_id} style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)'; }}>
                                                    {/* Image Section - now on top */}
                                                    <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative' }}>
                                                        <img src={getImageUrl(tour.image_url)} alt="tour" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#111827', backdropFilter: 'blur(4px)' }}>
                                                            #{tour.tour_id}
                                                        </div>
                                                        <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', background: statusStyle.bg, color: statusStyle.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            {statusStyle.label}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Content Section - now below */}
                                                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#111827', fontWeight: '800', letterSpacing: '-0.3px', lineHeight: '1.4' }}>{tour.tour_name}</h3>
                                                        <div style={{ color: '#4b5563', fontSize: '14px', display: 'flex', gap: '16px', fontWeight: '500', marginBottom: '16px', flexWrap: 'wrap' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                                {tour.duration_days} ngày {Math.max(1, tour.duration_days - 1)} đêm
                                                            </span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                                Khởi hành: {tour.departure_dates ? tour.departure_dates.split(',').map(d => new Date(d).toLocaleDateString('vi-VN')).join(', ') : 'Chưa có lịch'}
                                                            </span>
                                                        </div>
                                                        
                                                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá Niêm Yết</div>
                                                            <div style={{ fontSize: '20px', color: '#059669', fontWeight: '800' }}>{formatPrice(tour.base_price)}</div>
                                                        </div>
                                                        
                                                        {/* Actions Area */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button onClick={() => openItineraryModal(tour)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fff', color: '#4f46e5', border: '1px solid #e0e7ff', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(79,70,229,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#e0e7ff'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                                    Xem
                                                                </button>
                                                                <button onClick={() => openEditPriceModal(tour)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fff', color: '#0284c7', border: '1px solid #e0f2fe', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(2,132,199,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                                                    Sửa Giá
                                                                </button>
                                                                
                                                                {tour.status === 'Active' ? (
                                                                    <button onClick={() => handleToggleStatus(tour)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fff', color: '#d97706', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(217,119,6,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#fffbeb'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                                                        Tạm Ngưng
                                                                    </button>
                                                                ) : tour.status === 'Approved' || tour.status === 'Pending' ? (
                                                                    <button onClick={() => handleToggleStatus(tour)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fff', color: '#059669', border: '1px solid #d1fae5', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(5,150,105,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                                        Mở Bán
                                                                    </button>
                                                                ) : null}
                                                            </div>

                                                            <button onClick={() => handleDelete(tour.tour_id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GIÁ NIÊM YẾT MỚI (VNĐ)</label>
                            <input 
                                type="number" 
                                value={newPrice} 
                                onChange={(e) => setNewPrice(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '20px', fontWeight: '800', color: '#111827', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#0284c7'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={closeEditModal} disabled={isSaving} style={{ padding: '12px 24px', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }}>Hủy</button>
                            <button onClick={handleSavePrice} disabled={isSaving} style={{ padding: '12px 24px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)' }}>
                                {isSaving ? 'Đang lưu...' : '💾 Lưu Thay Đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Itinerary Modal */}
            {isItineraryModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', width: '700px', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '10px', borderRadius: '10px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>Chi tiết Lịch trình</h3>
                            </div>
                            <button onClick={closeItineraryModal} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#f9fafb' }}>
                            {loadingItinerary ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải lịch trình...</div>
                            ) : viewingTourDetail ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>{viewingTourDetail.tour_name}</h4>
                                        <div style={{ display: 'flex', gap: '24px', color: '#4b5563', fontSize: '15px', fontWeight: '600' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                Thời gian: {viewingTourDetail.duration_days} ngày {Math.max(1, viewingTourDetail.duration_days - 1)} đêm
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                Điểm đến: {viewingTourDetail.destination}
                                            </span>
                                        </div>
                                    </div>                                    
                                    {(() => {
                                        const itineraryData = viewingTourDetail.design_data || viewingTourDetail.proposed_itinerary;
                                        if (!itineraryData) return <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>Chưa có thông tin lịch trình chi tiết.</div>;
                                        try {
                                            const parsedItinerary = JSON.parse(itineraryData);
                                            const itineraryDays = parsedItinerary.itineraryDays || (parsedItinerary.dragDropState && parsedItinerary.dragDropState.itineraryDays);
                                            const fixedServices = parsedItinerary.fixedServices || (parsedItinerary.dragDropState && parsedItinerary.dragDropState.fixedServices);
                                            
                                            if (itineraryDays) {
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {/* Thông tin Dịch vụ cố định */}
                                                        {fixedServices && (
                                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                                                <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                                    {fixedServices.accommodation?.length > 0 ?
                                                                        fixedServices.accommodation.map(a => <div key={a.id} style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#0ea5e9' }}>•</span> {a.name}</div>)
                                                                        : <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật thông tin khách sạn</span>
                                                                    }
                                                                </div>
                                                                <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✈️ Phương tiện Di chuyển</strong>
                                                                    {fixedServices.transport?.length > 0 ?
                                                                        fixedServices.transport.map(t => <div key={t.id} style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#0ea5e9' }}>•</span> {t.name}</div>)
                                                                        : <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật phương tiện</span>
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Chi tiết từng ngày */}
                                                        {itineraryDays.map((day) => (
                                                            <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                        <div style={{ background: '#eff6ff', padding: '12px 20px', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '800', color: '#1d4ed8', fontSize: '15px' }}>NGÀY {day.dayIndex}</span>
                                                            {day.dateString && <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>🗓️ {day.dateString}</span>}
                                                        </div>
                                                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {['morning', 'noon', 'evening'].map(slot => {
                                                                if (!day.slots[slot] || day.slots[slot].length === 0) return null;
                                                                const slotConfig = {
                                                                    morning: { icon: '🌅', name: 'BUỔI SÁNG', color: '#d97706', border: '#fde68a' },
                                                                    noon: { icon: '☀️', name: 'BUỔI TRƯA', color: '#ea580c', border: '#fdba74' },
                                                                    evening: { icon: '🌙', name: 'BUỔI TỐI', color: '#4f46e5', border: '#a5b4fc' }
                                                                }[slot];
                                                                return (
                                                                    <div key={slot} style={{ display: 'flex', gap: '16px' }}>
                                                                        <div style={{ width: '110px', flexShrink: 0, color: slotConfig.color, fontSize: '13px', fontWeight: '800', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{ fontSize: '18px' }}>{slotConfig.icon}</span> <span>{slotConfig.name}</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: `3px solid ${slotConfig.border}`, paddingLeft: '20px' }}>
                                                                            {day.slots[slot].map((item, idx) => (
                                                                                <div key={idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9', fontWeight: '500' }}>
                                                                                    {item.name}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                                </div>
                                            );
                                            }
                                            if (parsedItinerary.textVersion) return <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>{parsedItinerary.textVersion}</div>;
                                        } catch (e) {
                                            return <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>{itineraryData}</div>;
                                        }
                                    })()}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>Không tìm thấy dữ liệu.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TourManagement;
