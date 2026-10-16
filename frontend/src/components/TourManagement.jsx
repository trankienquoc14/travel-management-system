import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Calculator, DollarSign, Users, Bus, UserCheck, Utensils, Hotel, 
    Ticket, ShieldCheck, TrendingUp, RotateCcw, Check, X, AlertCircle, Sparkles 
} from 'lucide-react';
import { formatVehicleDisplayName } from '../utils/vehicleDisplayHelper';
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
    
    // States for Edit Price & Cost Structure Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTour, setEditingTour] = useState(null);
    const [loadingCostDetail, setLoadingCostDetail] = useState(false);
    const [costForm, setCostForm] = useState(null);
    const [initialCostForm, setInitialCostForm] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [destinations, setDestinations] = useState([]);

    useEffect(() => {
        fetchTours();
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/destinations');
            if (res.data.success) {
                setDestinations(res.data.data);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách địa điểm:', error);
        }
    };

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

    const initCostFormFromTour = (tourData) => {
        let parsedDesign = null;
        try {
            if (typeof tourData.design_data === 'string') {
                parsedDesign = JSON.parse(tourData.design_data);
            } else if (tourData.design_data && typeof tourData.design_data === 'object') {
                parsedDesign = tourData.design_data;
            }
        } catch (e) {}

        const totalDays = Number(tourData.duration_days || 1);
        const totalNights = Math.max(0, totalDays - 1);
        const cfg = parsedDesign?.costConfig || {};
        const fixed = cfg.fixed || {};
        const variable = cfg.variable || {};
        const computed = parsedDesign?.computed || {};

        const minimumPax = Number(cfg.minimumPax || 15);
        const margin = Number(cfg.margin !== undefined ? cfg.margin : (tourData.markup_percent || 20));

        const transportFixed = Number(fixed.transport || 0);
        const guidePerDay = Number(fixed.guidePerDay || 500000);
        const otherFixed = Number(fixed.otherFixed || 0);

        const transportTicket = Number(variable.transportTicket || 0);

        const countBreakfast = Number(variable.countBreakfast !== undefined ? variable.countBreakfast : (computed?.totalMeals?.breakfast ?? totalNights));
        const breakfast = Number(variable.breakfast || 0);

        const countLunch = Number(variable.countLunch !== undefined ? variable.countLunch : (computed?.totalMeals?.lunch ?? totalDays));
        const lunch = Number(variable.lunch || 0);

        const countDinner = Number(variable.countDinner !== undefined ? variable.countDinner : (computed?.totalMeals?.dinner ?? totalNights));
        const dinner = Number(variable.dinner || 0);

        const tickets = Number(variable.tickets !== undefined ? variable.tickets : (computed?.autoTicketsCost || 0));
        const insurance = Number(variable.insurance || 50000);
        const otherVariable = Number(variable.otherVariable || 0);
        const singleSupplement = Number(variable.singleSupplement || 0);

        let accommTotal = 0;
        if (variable.accommTotal !== undefined) {
            accommTotal = Number(variable.accommTotal);
        } else if (variable.accommPerNight && Number(variable.accommPerNight) > 0) {
            accommTotal = Number(variable.accommPerNight) * totalNights;
        } else if (computed?.totalVariable) {
            const bFast = breakfast * countBreakfast;
            const lch = lunch * countLunch;
            const dnr = dinner * countDinner;
            const rem = Number(computed.totalVariable) - transportTicket - bFast - lch - dnr - tickets - insurance - otherVariable;
            if (rem > 0) accommTotal = rem;
        }

        return {
            minimumPax,
            margin,
            transportFixed,
            guidePerDay,
            otherFixed,
            transportTicket,
            accommTotal,
            breakfast,
            countBreakfast,
            lunch,
            countLunch,
            dinner,
            countDinner,
            tickets,
            insurance,
            otherVariable,
            singleSupplement,
            rawDesignData: parsedDesign
        };
    };

    const openEditPriceModal = async (tour) => {
        setEditingTour(tour);
        setIsEditModalOpen(true);
        setLoadingCostDetail(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/tours/staff/tours/${tour.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fullTour = (res.data.success && res.data.data) ? res.data.data : tour;
            setEditingTour(fullTour);
            const initialForm = initCostFormFromTour(fullTour);
            setCostForm(initialForm);
            setInitialCostForm(initialForm);
        } catch (error) {
            console.error('Lỗi tải chi tiết tour:', error);
            const initialForm = initCostFormFromTour(tour);
            setCostForm(initialForm);
            setInitialCostForm(initialForm);
        } finally {
            setLoadingCostDetail(false);
        }
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingTour(null);
        setCostForm(null);
        setInitialCostForm(null);
    };

    const computedValues = useMemo(() => {
        if (!costForm || !editingTour) return null;

        const totalDays = Number(editingTour.duration_days || 1);
        const totalNights = Math.max(0, totalDays - 1);

        // 1. Cố định
        const guideTotal = Number(costForm.guidePerDay || 0) * totalDays;
        const totalFixed = Number(costForm.transportFixed || 0) + guideTotal + Number(costForm.otherFixed || 0);
        const targetMinPax = Math.max(1, Number(costForm.minimumPax || 1));
        const fixedPerPax = Math.round(totalFixed / targetMinPax);

        // 2. Biến phí
        const breakfastTotal = Number(costForm.breakfast || 0) * Number(costForm.countBreakfast || 0);
        const lunchTotal = Number(costForm.lunch || 0) * Number(costForm.countLunch || 0);
        const dinnerTotal = Number(costForm.dinner || 0) * Number(costForm.countDinner || 0);
        const mealsTotal = breakfastTotal + lunchTotal + dinnerTotal;

        const totalVariable = Number(costForm.transportTicket || 0)
            + Number(costForm.accommTotal || 0)
            + mealsTotal
            + Number(costForm.tickets || 0)
            + Number(costForm.insurance || 0)
            + Number(costForm.otherVariable || 0);

        // 3. Giá vốn mỗi khách (Net Cost / Base Cost)
        const netCost = fixedPerPax + totalVariable;

        // 4. Giá bán niêm yết (Selling Price / Base Price)
        const margin = Number(costForm.margin !== undefined ? costForm.margin : 20);
        const autoSellingPrice = Math.round(netCost * (1 + margin / 100));
        const profitPerPax = autoSellingPrice - netCost;

        return {
            totalDays,
            totalNights,
            guideTotal,
            totalFixed,
            targetMinPax,
            fixedPerPax,
            breakfastTotal,
            lunchTotal,
            dinnerTotal,
            mealsTotal,
            totalVariable,
            netCost,
            margin,
            autoSellingPrice,
            profitPerPax
        };
    }, [costForm, editingTour]);

    const handleResetToInitial = () => {
        if (initialCostForm) {
            setCostForm({ ...initialCostForm });
        }
    };

    const handleDirectSellingPriceChange = (valStr) => {
        const rawVal = Number(String(valStr).replace(/\D/g, ''));
        if (!computedValues) return;
        const netCost = computedValues.netCost;
        if (netCost > 0) {
            const newMargin = Number((((rawVal / netCost) - 1) * 100).toFixed(2));
            setCostForm(prev => ({ ...prev, margin: newMargin }));
        }
    };

    const handleMarginChange = (val) => {
        setCostForm(prev => ({ ...prev, margin: Number(val) }));
    };

    const handleSavePrice = async () => {
        if (!editingTour || !computedValues || !costForm) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const totalDays = computedValues.totalDays;
            const totalNights = computedValues.totalNights;

            const existingDesign = costForm.rawDesignData || {};
            const existingCostConfig = existingDesign.costConfig || {};
            const existingVariable = existingCostConfig.variable || {};

            const updatedCostConfig = {
                ...existingCostConfig,
                minimumPax: costForm.minimumPax,
                margin: costForm.margin,
                fixed: {
                    ...(existingCostConfig.fixed || {}),
                    transport: costForm.transportFixed,
                    guidePerDay: costForm.guidePerDay,
                    otherFixed: costForm.otherFixed
                },
                variable: {
                    ...existingVariable,
                    transportTicket: costForm.transportTicket,
                    accommTotal: costForm.accommTotal,
                    accommPerNight: totalNights > 0 ? Math.round(costForm.accommTotal / totalNights) : 0,
                    breakfast: costForm.breakfast,
                    countBreakfast: costForm.countBreakfast,
                    lunch: costForm.lunch,
                    countLunch: costForm.countLunch,
                    dinner: costForm.dinner,
                    countDinner: costForm.countDinner,
                    tickets: costForm.tickets,
                    insurance: costForm.insurance,
                    otherVariable: costForm.otherVariable,
                    singleSupplement: costForm.singleSupplement
                }
            };

            const updatedComputed = {
                ...(existingDesign.computed || {}),
                netCost: computedValues.netCost,
                sellingPrice: computedValues.autoSellingPrice,
                totalDays: totalDays,
                totalNights: totalNights,
                totalMeals: {
                    breakfast: costForm.countBreakfast,
                    lunch: costForm.countLunch,
                    dinner: costForm.countDinner
                },
                autoTicketsCost: costForm.tickets,
                totalFixed: computedValues.totalFixed,
                totalVariable: computedValues.totalVariable
            };

            const updatedDesignData = {
                ...existingDesign,
                costConfig: updatedCostConfig,
                computed: updatedComputed
            };

            await axios.put(`http://localhost:5000/api/tours/admin/price/${editingTour.tour_id}`, {
                base_price: computedValues.autoSellingPrice,
                base_cost: Math.round(computedValues.netCost),
                markup_percent: Math.round(costForm.margin),
                design_data: updatedDesignData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Đã cập nhật chi phí thiết kế và giá bán tour thành công!');
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
        
        const getDestName = (tour) => {
            let destName = 'Chưa xác định';
            if (tour.destination) {
                const destObj = destinations.find(x => String(x.destination_id) === String(tour.destination));
                if (destObj) {
                    destName = destObj.destination_name;
                } else {
                    destName = String(tour.destination);
                    if (destName === 'Multi-Destination') destName = 'Nhiều điểm đến';
                }
            }
            if (destName === 'Chưa xác định' || destName === 'Multi-Destination' || destName === 'Nhiều điểm đến') {
                try {
                    const d = typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : (tour.design_data || {});
                    if (d.days && d.days.length > 0) {
                        const firstId = d.days[0].end_destination_id || d.days[0].start_destination_id;
                        const destObj = destinations.find(x => String(x.destination_id) === String(firstId));
                        if (destObj) destName = destObj.destination_name;
                    }
                } catch(e){}
            }
            return destName;
        };

        filteredTours.forEach(tour => {
            const dest = getDestName(tour);
            if (!groups[dest]) groups[dest] = [];
            groups[dest].push(tour);
        });
        return groups;
    }, [filteredTours, destinations]);

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

            {/* Edit Price & Cost Structure Modal */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    backdropFilter: 'blur(6px)',
                    padding: '16px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '24px',
                        width: '940px',
                        maxWidth: '96vw',
                        height: '90vh',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '18px 24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)'
                                }}>
                                    <Calculator size={22} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '19px', color: '#0f172a', fontWeight: '800' }}>
                                        Điều Chỉnh Giá & Chi Phí Thiết Kế Tour
                                    </h3>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '700', color: '#0284c7' }}>{editingTour?.tour_name}</span>
                                        <span>•</span>
                                        <span>📍 {editingTour?.destination || 'Việt Nam'}</span>
                                        <span>•</span>
                                        <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                            ⏱️ {computedValues?.totalDays || editingTour?.duration_days} Ngày {computedValues?.totalNights ?? (Math.max(0, (editingTour?.duration_days || 1) - 1))} Đêm
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={closeEditModal}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body (Scrollable) */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f8fafc' }}>
                            {loadingCostDetail ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700' }}>Đang tải cấu trúc chi phí thiết kế tour...</div>
                                </div>
                            ) : !costForm || !computedValues ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                                    Không thể tải chi phí tour. Vui lòng thử lại!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                                    {/* 1. TOP DASHBOARD: TỔNG HỢP KINH TẾ & GIÁ BÁN TỰ ĐỘNG */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                                        border: '2px solid #86efac',
                                        borderRadius: '16px',
                                        padding: '16px 20px',
                                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.08)'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                    1. Định phí / Khách
                                                </div>
                                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0369a1', marginTop: '2px' }}>
                                                    {formatPrice(computedValues.fixedPerPax)}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                                                    Tổng đoàn: {formatPrice(computedValues.totalFixed)} ÷ {costForm.minimumPax} pax
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                    2. Biến phí / Khách
                                                </div>
                                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#7c3aed', marginTop: '2px' }}>
                                                    {formatPrice(computedValues.totalVariable)}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                                                    Vé, phòng KS, ăn uống, vé điểm, BH
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                                    3. Giá vốn mỗi khách
                                                </div>
                                                <div style={{ fontSize: '19px', fontWeight: '900', color: '#d97706', marginTop: '2px' }}>
                                                    {formatPrice(computedValues.netCost)}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                                                    = Định phí + Biến phí
                                                </div>
                                            </div>

                                            <div style={{
                                                background: '#ffffff',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: '2px solid #22c55e',
                                                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.15)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', color: '#15803d', fontWeight: '800', textTransform: 'uppercase' }}>
                                                        GIÁ BÁN NIÊM YẾT MỚI
                                                    </span>
                                                    <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#16a34a', background: '#dcfce7', padding: '1px 6px', borderRadius: '6px' }}>
                                                        +{costForm.margin}% LN
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '22px', fontWeight: '900', color: '#15803d', marginTop: '2px' }}>
                                                    {formatPrice(computedValues.autoSellingPrice)}
                                                </div>
                                                <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: '700', marginTop: '2px' }}>
                                                    Lãi dự kiến: +{formatPrice(computedValues.profitPerPax)}/khách
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. KHỐI CHI PHÍ CỐ ĐỊNH CHO ĐOÀN */}
                                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
                                                <Bus size={18} />
                                            </div>
                                            <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: '#0f172a' }}>
                                                1. Chi Phí Cố Định Cho Đoàn (Định Phí Phân Bổ Theo Khách)
                                            </h4>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 1.5fr', gap: '14px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Điểm hòa vốn (Số khách)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="200"
                                                    value={costForm.minimumPax}
                                                    onChange={e => setCostForm({ ...costForm, minimumPax: Math.max(1, Number(e.target.value)) })}
                                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                />
                                                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Dùng chia đều định phí</span>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Xe du lịch / Phương tiện đoàn
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(costForm.transportFixed || 0).toLocaleString('vi-VN')}
                                                        onChange={e => setCostForm({ ...costForm, transportFixed: Number(e.target.value.replace(/\D/g, '')) })}
                                                        style={{ width: '100%', padding: '9px 28px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>đ</span>
                                                </div>
                                                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Trọn gói chuyến đi</span>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Công tác phí Hướng dẫn viên (HDV)
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ position: 'relative', flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            value={Number(costForm.guidePerDay || 0).toLocaleString('vi-VN')}
                                                            onChange={e => setCostForm({ ...costForm, guidePerDay: Number(e.target.value.replace(/\D/g, '')) })}
                                                            style={{ width: '100%', padding: '9px 24px 9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                        />
                                                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '11px' }}>đ/ng</span>
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>× {computedValues.totalDays} ngày =</span>
                                                    <strong style={{ fontSize: '13px', color: '#0284c7', minWidth: '95px' }}>
                                                        {formatPrice(computedValues.guideTotal)}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Chi phí cố định khác
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(costForm.otherFixed || 0).toLocaleString('vi-VN')}
                                                        onChange={e => setCostForm({ ...costForm, otherFixed: Number(e.target.value.replace(/\D/g, '')) })}
                                                        style={{ width: '100%', padding: '9px 28px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>đ</span>
                                                </div>
                                                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Banner, nước uống đoàn...</span>
                                            </div>
                                        </div>

                                        <div style={{
                                            marginTop: '12px',
                                            paddingTop: '10px',
                                            borderTop: '1px dashed #e2e8f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '13px'
                                        }}>
                                            <span style={{ color: '#64748b' }}>
                                                Tổng chi phí cố định cho cả đoàn: <strong>{formatPrice(computedValues.totalFixed)}</strong>
                                            </span>
                                            <span style={{ fontWeight: '800', color: '#0369a1' }}>
                                                ➔ Phân bổ định phí: {formatPrice(computedValues.fixedPerPax)} / khách
                                            </span>
                                        </div>
                                    </div>

                                    {/* 3. KHỐI CHI PHÍ BIẾN ĐỔI THEO KHÁCH */}
                                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                            <div style={{ background: '#f3e8ff', color: '#7c3aed', padding: '6px', borderRadius: '8px' }}>
                                                <Users size={18} />
                                            </div>
                                            <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: '#0f172a' }}>
                                                2. Chi Phí Biến Đổi Theo Khách (Tính Trực Tiếp Cho Mỗi Người)
                                            </h4>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                                            {/* Vé di chuyển riêng */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Vé di chuyển / Vé máy bay (khách)
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(costForm.transportTicket || 0).toLocaleString('vi-VN')}
                                                        onChange={e => setCostForm({ ...costForm, transportTicket: Number(e.target.value.replace(/\D/g, '')) })}
                                                        style={{ width: '100%', padding: '9px 28px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>đ</span>
                                                </div>
                                                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Vé tàu, máy bay khứ hồi / người</span>
                                            </div>

                                            {/* Khách sạn lưu trú */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Phòng Khách sạn / Lưu trú ({computedValues.totalNights} đêm)
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(costForm.accommTotal || 0).toLocaleString('vi-VN')}
                                                        onChange={e => setCostForm({ ...costForm, accommTotal: Number(e.target.value.replace(/\D/g, '')) })}
                                                        style={{ width: '100%', padding: '9px 28px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>đ</span>
                                                </div>
                                                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                                    ~{formatPrice(Math.round(costForm.accommTotal / Math.max(1, computedValues.totalNights)))}/đêm/khách
                                                </span>
                                            </div>

                                            {/* Vé tham quan */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Tổng vé tham quan / Thắng cảnh
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(costForm.tickets || 0).toLocaleString('vi-VN')}
                                                        onChange={e => setCostForm({ ...costForm, tickets: Number(e.target.value.replace(/\D/g, '')) })}
                                                        style={{ width: '100%', padding: '9px 28px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>đ</span>
                                                </div>
                                                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Vé các điểm trong lịch trình</span>
                                            </div>
                                        </div>

                                        {/* Chi tiết ăn uống */}
                                        <div style={{ marginTop: '14px', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Utensils size={14} color="#ea580c" />
                                                    Chi Phí Ăn Uống Theo Lịch Trình (Sáng, Trưa, Tối)
                                                </span>
                                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#ea580c' }}>
                                                    Tổng ăn uống: {formatPrice(computedValues.mealsTotal)} / khách
                                                </span>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                                {/* Ăn sáng */}
                                                <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Bữa Sáng</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <input
                                                            type="text"
                                                            value={Number(costForm.breakfast || 0).toLocaleString('vi-VN')}
                                                            onChange={e => setCostForm({ ...costForm, breakfast: Number(e.target.value.replace(/\D/g, '')) })}
                                                            style={{ width: '80px', padding: '4px 6px', fontSize: '12.5px', fontWeight: '700', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right' }}
                                                        />
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>đ ×</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={costForm.countBreakfast}
                                                            onChange={e => setCostForm({ ...costForm, countBreakfast: Math.max(0, Number(e.target.value)) })}
                                                            style={{ width: '42px', padding: '4px 6px', fontSize: '12.5px', fontWeight: '700', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                                                        />
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>bữa =</span>
                                                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{formatPrice(computedValues.breakfastTotal)}</strong>
                                                    </div>
                                                </div>

                                                {/* Ăn trưa */}
                                                <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Bữa Trưa</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <input
                                                            type="text"
                                                            value={Number(costForm.lunch || 0).toLocaleString('vi-VN')}
                                                            onChange={e => setCostForm({ ...costForm, lunch: Number(e.target.value.replace(/\D/g, '')) })}
                                                            style={{ width: '80px', padding: '4px 6px', fontSize: '12.5px', fontWeight: '700', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right' }}
                                                        />
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>đ ×</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={costForm.countLunch}
                                                            onChange={e => setCostForm({ ...costForm, countLunch: Math.max(0, Number(e.target.value)) })}
                                                            style={{ width: '42px', padding: '4px 6px', fontSize: '12.5px', fontWeight: '700', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                                                        />
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>bữa =</span>
                                                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{formatPrice(computedValues.lunchTotal)}</strong>
                                                    </div>
                                                </div>

                                                {/* Ăn tối */}
                                                <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Bữa Tối</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <input
                                                            type="text"
                                                            value={Number(costForm.dinner || 0).toLocaleString('vi-VN')}
                                                            onChange={e => setCostForm({ ...costForm, dinner: Number(e.target.value.replace(/\D/g, '')) })}
                                                            style={{ width: '80px', padding: '4px 6px', fontSize: '12.5px', fontWeight: '700', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right' }}
                                                        />
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>đ ×</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={costForm.countDinner}
                                                            onChange={e => setCostForm({ ...costForm, countDinner: Math.max(0, Number(e.target.value)) })}
                                                            style={{ width: '42px', padding: '4px 6px', fontSize: '12.5px', fontWeight: '700', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}
                                                        />
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>bữa =</span>
                                                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{formatPrice(computedValues.dinnerTotal)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hàng bảo hiểm & biến phí khác */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '14px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Bảo hiểm du lịch (khách)
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(costForm.insurance || 0).toLocaleString('vi-VN')}
                                                        onChange={e => setCostForm({ ...costForm, insurance: Number(e.target.value.replace(/\D/g, '')) })}
                                                        style={{ width: '100%', padding: '9px 28px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>đ</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Biến phí khác (khách)
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(costForm.otherVariable || 0).toLocaleString('vi-VN')}
                                                        onChange={e => setCostForm({ ...costForm, otherVariable: Number(e.target.value.replace(/\D/g, '')) })}
                                                        style={{ width: '100%', padding: '9px 28px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>đ</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '700', marginBottom: '4px' }}>
                                                    Phụ thu phòng đơn (khách lẻ)
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(costForm.singleSupplement || 0).toLocaleString('vi-VN')}
                                                        onChange={e => setCostForm({ ...costForm, singleSupplement: Number(e.target.value.replace(/\D/g, '')) })}
                                                        style={{ width: '100%', padding: '9px 28px 9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}>đ</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            marginTop: '12px',
                                            paddingTop: '10px',
                                            borderTop: '1px dashed #e2e8f0',
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            fontSize: '13px'
                                        }}>
                                            <span style={{ fontWeight: '800', color: '#7c3aed' }}>
                                                ➔ Tổng chi phí biến đổi / khách: {formatPrice(computedValues.totalVariable)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 4. KHỐI TINH CHỈNH TỶ SUẤT LỢI NHUẬN & GIÁ BÁN NIÊM YẾT */}
                                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1.5px solid #0284c7' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
                                                <TrendingUp size={18} />
                                            </div>
                                            <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: '800', color: '#0f172a' }}>
                                                3. Tỷ Suất Lợi Nhuận & Điều Chỉnh Giá Niêm Yết
                                            </h4>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px', alignItems: 'center' }}>
                                            {/* Chỉnh % Lợi nhuận */}
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12.5px', color: '#475569', fontWeight: '700', marginBottom: '6px' }}>
                                                    Tỷ suất lợi nhuận định mức (Markup / Margin %)
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ position: 'relative', width: '120px' }}>
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            value={costForm.margin}
                                                            onChange={e => handleMarginChange(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px 24px 10px 12px',
                                                                borderRadius: '10px',
                                                                border: '2px solid #0284c7',
                                                                fontSize: '16px',
                                                                fontWeight: '800',
                                                                color: '#0284c7',
                                                                outline: 'none',
                                                                textAlign: 'right'
                                                            }}
                                                        />
                                                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#0284c7' }}>%</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        {[10, 15, 20, 25, 30].map(p => (
                                                            <button
                                                                key={p}
                                                                type="button"
                                                                onClick={() => handleMarginChange(p)}
                                                                style={{
                                                                    padding: '7px 10px',
                                                                    borderRadius: '8px',
                                                                    border: costForm.margin === p ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                                                                    background: costForm.margin === p ? '#e0f2fe' : '#ffffff',
                                                                    color: costForm.margin === p ? '#0284c7' : '#475569',
                                                                    fontSize: '12px',
                                                                    fontWeight: '700',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {p}%
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                                                    💡 Thay đổi % lợi nhuận thì giá bán tự động cập nhật ngay.
                                                </div>
                                            </div>

                                            {/* Gõ trực tiếp giá bán niêm yết */}
                                            <div style={{ background: '#f0fdf4', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #86efac' }}>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#166534', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>
                                                    Hoặc nhập trực tiếp Giá Niêm Yết Mới (VNĐ)
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={Number(computedValues.autoSellingPrice || 0).toLocaleString('vi-VN')}
                                                        onChange={e => handleDirectSellingPriceChange(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px 32px 10px 12px',
                                                            borderRadius: '10px',
                                                            border: '2px solid #22c55e',
                                                            fontSize: '20px',
                                                            fontWeight: '900',
                                                            color: '#15803d',
                                                            outline: 'none',
                                                            background: '#ffffff',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#15803d', fontSize: '15px' }}>
                                                        đ
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px' }}>
                                                    ✨ Tự động tính ngược lại tỷ suất lợi nhuận Margin % khi sửa giá bán trực tiếp!
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#ffffff'
                        }}>
                            <button
                                type="button"
                                onClick={handleResetToInitial}
                                disabled={isSaving || loadingCostDetail}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 18px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '13.5px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                            >
                                <RotateCcw size={16} />
                                Khôi phục ban đầu
                            </button>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    disabled={isSaving}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSavePrice}
                                    disabled={isSaving || loadingCostDetail}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 24px',
                                        background: isSaving ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        fontWeight: '800',
                                        cursor: isSaving ? 'default' : 'pointer',
                                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isSaving ? (
                                        <span>Đang lưu...</span>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            <span>Lưu Thay Đổi & Cập Nhật Giá</span>
                                        </>
                                    )}
                                </button>
                            </div>
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
                                                Điểm đến: {(() => {
                                                    let dName = viewingTourDetail.destination || 'Chưa xác định';
                                                    if (destinations && destinations.length > 0) {
                                                        const found = destinations.find(x => String(x.destination_id) === String(viewingTourDetail.destination));
                                                        if (found) dName = found.destination_name;
                                                    }
                                                    return dName;
                                                })()}
                                            </span>
                                        </div>
                                    </div>                                    
                                    {(() => {
                                         // 1. Lấy tên địa điểm điểm đến chuẩn
                                         let destName = viewingTourDetail.destination || 'Chưa xác định';
                                         if (destinations && destinations.length > 0) {
                                             const destObj = destinations.find(x => String(x.destination_id) === String(viewingTourDetail.destination));
                                             if (destObj) destName = destObj.destination_name;
                                         }

                                         // 2. Parse thông tin lịch trình
                                         const itineraryData = viewingTourDetail.design_data || viewingTourDetail.proposed_itinerary;
                                         let parsedDays = null;
                                         let fixedServices = null;

                                         if (itineraryData) {
                                             try {
                                                 const parsed = typeof itineraryData === 'string' ? JSON.parse(itineraryData) : itineraryData;
                                                 
                                                 // Dạng A: Multi-day drag-drop format (itineraryDays & fixedServices)
                                                 if (parsed.itineraryDays) {
                                                     parsedDays = parsed.itineraryDays;
                                                     fixedServices = parsed.fixedServices || (parsed.dragDropState && parsed.dragDropState.fixedServices);
                                                 } 
                                                 // Dạng B: DDD Custom Tour format (days & costConfig)
                                                 else if (parsed.days && Array.isArray(parsed.days)) {
                                                     // Trích xuất thông tin khách sạn
                                                     const hotelList = [];
                                                     parsed.days.forEach(d => {
                                                         if (d.accommodation && d.accommodation.name && !hotelList.some(h => h.name === d.accommodation.name)) {
                                                             hotelList.push({ name: d.accommodation.name });
                                                         }
                                                     });

                                                     // Trích xuất thông tin xe/phương tiện
                                                     const transportList = [];
                                                     const transportName = formatVehicleDisplayName(parsed.costConfig?.selectedTransport || parsed.selectedTransport);
                                                     if (transportName) {
                                                         transportList.push({ name: transportName });
                                                     }

                                                     if (hotelList.length > 0 || transportList.length > 0) {
                                                         fixedServices = {
                                                             accommodation: hotelList,
                                                             transport: transportList
                                                         };
                                                     }

                                                     // Chuyển đổi mảng `days` thành `parsedDays` chuẩn hóa
                                                     parsedDays = parsed.days.map((d, idx) => {
                                                         const acts = d.activities || [];
                                                         const morning = [];
                                                         const noon = [];
                                                         const evening = [];

                                                         acts.forEach((act, aIdx) => {
                                                             const actName = act.name || act.title || 'Hoạt động tham quan';
                                                             const actObj = { name: actName };
                                                             if (aIdx === 0 || aIdx < Math.ceil(acts.length / 3)) {
                                                                 morning.push(actObj);
                                                             } else if (aIdx < Math.ceil((acts.length * 2) / 3)) {
                                                                 noon.push(actObj);
                                                             } else {
                                                                 evening.push(actObj);
                                                             }
                                                         });

                                                         return {
                                                             dayIndex: d.dayIndex || idx + 1,
                                                             title: d.route_title ? `NGÀY ${d.dayIndex || idx + 1}: ${d.route_title}` : `NGÀY ${d.dayIndex || idx + 1}`,
                                                             description: d.description || '',
                                                             slots: { morning, noon, evening },
                                                             rawActivities: acts
                                                         };
                                                     });
                                                 }
                                                 else if (parsed.dragDropState && parsed.dragDropState.itineraryDays) {
                                                     parsedDays = parsed.dragDropState.itineraryDays;
                                                     fixedServices = parsed.dragDropState.fixedServices;
                                                 }
                                             } catch (e) {}
                                         }

                                         // Nếu không có design_data nhưng có itineraries / itineraryDays từ DB
                                         if ((!parsedDays || parsedDays.length === 0) && (viewingTourDetail.itineraryDays || viewingTourDetail.itineraries)) {
                                             const rawDays = viewingTourDetail.itineraryDays || viewingTourDetail.itineraries || [];
                                             if (rawDays.length > 0) {
                                                 parsedDays = rawDays.map((d, idx) => ({
                                                     dayIndex: d.day_number || idx + 1,
                                                     title: d.title || `NGÀY ${d.day_number || idx + 1}`,
                                                     description: d.description || '',
                                                     slots: {
                                                         morning: (d.places || []).filter(p => !p.visit_time || Number(String(p.visit_time).split(':')[0]) < 12).map(p => ({ name: p.place_name || p.name || 'Điểm tham quan' })),
                                                         noon: (d.places || []).filter(p => p.visit_time && Number(String(p.visit_time).split(':')[0]) >= 12 && Number(String(p.visit_time).split(':')[0]) < 17).map(p => ({ name: p.place_name || p.name || 'Địa điểm' })),
                                                         evening: (d.places || []).filter(p => p.visit_time && Number(String(p.visit_time).split(':')[0]) >= 17).map(p => ({ name: p.place_name || p.name || 'Địa điểm' }))
                                                     },
                                                     rawPlaces: d.places || []
                                                 }));
                                                 
                                                 parsedDays.forEach(day => {
                                                     if (day.slots.morning.length === 0 && day.slots.noon.length === 0 && day.slots.evening.length === 0 && day.rawPlaces.length > 0) {
                                                         day.slots.morning = day.rawPlaces.map(p => ({ name: p.place_name || p.name || 'Điểm tham quan' }));
                                                     }
                                                 });
                                             }
                                         }

                                         if (!parsedDays || parsedDays.length === 0) {
                                             if (viewingTourDetail.description) {
                                                 return (
                                                     <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: '1.6' }}>
                                                         <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b', fontWeight: '800' }}>📄 Mô tả chi tiết Tour:</h5>
                                                         <div style={{ whiteSpace: 'pre-line', fontSize: '15px' }}>{viewingTourDetail.description}</div>
                                                     </div>
                                                 );
                                             }
                                             return <div style={{ padding: '24px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>🗓️ Chưa có thông tin lịch trình chi tiết.</div>;
                                         }

                                         return (
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                 {/* Thông tin Dịch vụ cố định */}
                                                 {fixedServices && (
                                                     <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                                         <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                             <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                             {fixedServices.accommodation?.length > 0 ?
                                                                 fixedServices.accommodation.map((a, i) => <div key={a.id || i} style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#0ea5e9' }}>•</span> {a.name}</div>)
                                                                 : <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật thông tin khách sạn</span>
                                                             }
                                                         </div>
                                                         <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                             <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✈️ Phương tiện Di chuyển</strong>
                                                             {fixedServices.transport?.length > 0 ?
                                                                 fixedServices.transport.map((t, i) => <div key={t.id || i} style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#0ea5e9' }}>•</span> {formatVehicleDisplayName(t.name || t)}</div>)
                                                                 : <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật phương tiện</span>
                                                             }
                                                         </div>
                                                     </div>
                                                 )}

                                                 {/* Chi tiết từng ngày */}
                                                 {parsedDays.map((day, idx) => (
                                                     <div key={day.dayIndex || idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                         <div style={{ background: '#eff6ff', padding: '12px 20px', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                             <span style={{ fontWeight: '800', color: '#1d4ed8', fontSize: '15px' }}>{day.title || `NGÀY ${day.dayIndex}`}</span>
                                                             {day.dateString && <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>🗓️ {day.dateString}</span>}
                                                         </div>
                                                         <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                             {day.description && (
                                                                 <div style={{ fontSize: '14px', color: '#475569', fontStyle: 'italic', marginBottom: '4px' }}>
                                                                     {day.description}
                                                                 </div>
                                                             )}
                                                             {['morning', 'noon', 'evening'].map(slot => {
                                                                 if (!day.slots || !day.slots[slot] || day.slots[slot].length === 0) return null;
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
                                                                             {day.slots[slot].map((item, iIdx) => (
                                                                                 <div key={iIdx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9', fontWeight: '500' }}>
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
