import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatVehicleDisplayName } from '../utils/vehicleDisplayHelper';
import { 
    Search, 
    Filter, 
    RotateCcw, 
    LayoutGrid, 
    List, 
    ChevronLeft, 
    ChevronRight, 
    X, 
    Send, 
    Edit3, 
    Eye, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    User, 
    Users, 
    Calendar, 
    DollarSign, 
    MapPin,
    AlertTriangle,
    Layers,
    FileText,
    Check,
    Image as ImageIcon
} from 'lucide-react';


const resolveTourImage = (url) => {
    if (!url || url === 'undefined' || url === 'null') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    let clean = url.trim();
    if (!clean.startsWith('/')) clean = '/' + clean;
    if (!clean.startsWith('/uploads/')) clean = '/uploads' + clean;
    return 'http://localhost:5000' + clean;
};

const formatMoney = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    return Number(amount).toLocaleString('vi-VN');
};

const getGrandTotal = (tour) => {
    if (!['Pending_Approval', 'Approved', 'Rejected', 'Quote_Sent', 'Customer_Revision', 'Customer_Accepted', 'Sent_To_Customer'].includes(tour.approval_status)) {
        return Number(tour.quoted_price || 0);
    }
    
    try {
        if (tour.proposed_itinerary) {
            const parsed = typeof tour.proposed_itinerary === 'string' ? JSON.parse(tour.proposed_itinerary) : tour.proposed_itinerary;
            if (parsed && parsed.costConfig) {
                const config = parsed.costConfig;
                let prefs = {};
                if (typeof tour.preferences === 'string') {
                    try { prefs = JSON.parse(tour.preferences); } catch(e){}
                } else if (typeof tour.preferences === 'object') {
                    prefs = tour.preferences || {};
                }
                const numAdults = prefs.participantBreakdown?.adults || tour.people_count || 1;
                const numChildren = prefs.participantBreakdown?.children || 0;
                const numToddlers = prefs.participantBreakdown?.toddlers || 0;
                const numInfants = prefs.participantBreakdown?.infants || 0;
                
                const adultPrice = Number(tour.quoted_price || 0);
                
                const c_pct = (config.ageMultiplier?.child?.percent ?? 75) / 100;
                const c_sur = Number(config.ageMultiplier?.child?.fixed_surcharge || 0);
                const childPrice = (adultPrice * c_pct) + c_sur;
                
                const t_pct = (config.ageMultiplier?.toddler?.percent ?? 50) / 100;
                const t_sur = Number(config.ageMultiplier?.toddler?.fixed_surcharge || 0);
                const toddlerPrice = (adultPrice * t_pct) + t_sur;
                
                const i_pct = (config.ageMultiplier?.infant?.percent ?? 0) / 100;
                const i_sur = Number(config.ageMultiplier?.infant?.fixed_surcharge || 0);
                const infantPrice = (adultPrice * i_pct) + i_sur;
                
                return (numAdults * adultPrice) + (numChildren * childPrice) + (numToddlers * toddlerPrice) + (numInfants * infantPrice);
            }
        }
    } catch(e) {
        console.error(e);
    }
    return Number(tour.quoted_price || 0) * (Number(tour.people_count) || 1);
};

const StaffPendingTours = ({ onEditDesign, onEditFixedDesign }) => {
    // 1. Quản lý Tab & View mode
    const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'fixed'
    const [viewMode, setViewMode] = useState('table'); // Mặc định: Bảng ERP ('table' | 'grid')

    // 2. Dữ liệu danh sách
    const [pendingTours, setPendingTours] = useState([]); // Tour thiết kế riêng
    const [fixedTours, setFixedTours] = useState([]); // Tour cố định
    const [loading, setLoading] = useState(true);
    const [sentStatus, setSentStatus] = useState({});

    // 3. Search, Filter, Sort, Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Tất cả');
    const [filterDestination, setFilterDestination] = useState('Tất cả'); // Dành cho Tour Cố Định
    const [sortBy, setSortBy] = useState('latest');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // 4. State cho Modal xem chi tiết Tour Cố Định
    const [viewingFixedTour, setViewingFixedTour] = useState(null);
    const [destinations, setDestinations] = useState([]);

    const getDestName = (id, dayObj, isEnd = false, mainTour = null) => {
        if (id !== undefined && id !== null && id !== '') {
            const dest = destinations.find(x => String(x.destination_id) === String(id));
            if (dest) return dest.destination_name;
            if (typeof id === 'string' && isNaN(Number(id))) return id;
        }
        if (dayObj) {
            const targetVal = isEnd 
                ? (dayObj.end_destination_id || dayObj.end_destination || dayObj.end_location)
                : (dayObj.start_destination_id || dayObj.start_destination || dayObj.start_location);
            if (targetVal !== undefined && targetVal !== null && targetVal !== '') {
                const dest = destinations.find(x => String(x.destination_id) === String(targetVal));
                if (dest) return dest.destination_name;
                if (typeof targetVal === 'string' && isNaN(Number(targetVal))) return targetVal;
            }
            if (dayObj.route_title && typeof dayObj.route_title === 'string') {
                const cleanTitle = dayObj.route_title.replace(/^NGÀY\s*\d+\s*[-:]?\s*/i, '').trim();
                if (cleanTitle.includes('-')) {
                    const parts = cleanTitle.split('-').map(s => s.trim());
                    if (!isEnd && parts[0]) return parts[0];
                    if (isEnd && parts[parts.length - 1]) return parts[parts.length - 1];
                }
            }
        }
        if (mainTour) {
            if (!isEnd && (mainTour.start_destination || mainTour.start_location || mainTour.departure_location)) {
                return mainTour.start_destination || mainTour.start_location || mainTour.departure_location;
            }
            if (isEnd && (mainTour.destination || mainTour.destination_name || mainTour.end_destination)) {
                return mainTour.destination || mainTour.destination_name || mainTour.end_destination;
            }
        }
        return isEnd ? 'Điểm đến' : 'Điểm xuất phát';
    };

    const getTransportName = (costCfg, parsedDsg, tourObj) => {
        const st = costCfg?.selectedTransport;
        if (st) {
            return formatVehicleDisplayName(st);
        }
        if (parsedDsg?.fixedServices?.transport && Array.isArray(parsedDsg.fixedServices.transport)) {
            const ft = parsedDsg.fixedServices.transport[0];
            if (ft) {
                return formatVehicleDisplayName(ft);
            }
        }
        if (parsedDsg?.days && Array.isArray(parsedDsg.days)) {
            for (const day of parsedDsg.days) {
                if (day.activities && Array.isArray(day.activities)) {
                    const tAct = day.activities.find(a => a.type === 'Transport' || a.activity_type === 'Transport' || (a.name && (a.name.includes('Di chuyển') || a.name.includes('Xe'))));
                    if (tAct && tAct.name) return formatVehicleDisplayName(tAct.name);
                }
            }
        }
        if (tourObj) {
            const tName = tourObj.transport_name || tourObj.transport || tourObj.vehicle_name || tourObj.vehicle_type;
            if (tName) return formatVehicleDisplayName(tName);
        }
        return 'Xe du lịch chất lượng cao';
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Gọi song song 3 API lấy dữ liệu
            const [resCustom, resFixed, resDest] = await Promise.all([
                axios.get('http://localhost:5000/api/custom-tours/requests', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/tours/staff/tours', { headers: { Authorization: `Bearer ${token}` } }).catch(() => axios.get('http://localhost:5000/api/staff/tours', { headers: { Authorization: `Bearer ${token}` } })),
                axios.get('http://localhost:5000/api/destinations').catch(() => ({ data: { data: [] } }))
            ]);

            if (resDest?.data?.data) {
                setDestinations(resDest.data.data);
            }

            // Xử lý Tour Thiết kế riêng
            if (resCustom.data.success) {
                const filteredCustom = resCustom.data.data.filter((req) => {
                    if (req.status === 'Pending') return false; 
                    return req.approval_status || req.quoted_price > 0 || ['Quote_Sent', 'Customer_Revision', 'Customer_Accepted'].includes(req.status);
                });
                setPendingTours(filteredCustom);

                const statusMap = {};
                filteredCustom.forEach(tour => {
                    if (tour.status === 'Quote_Sent' || tour.status === 'Customer_Revision' || tour.status === 'Customer_Accepted') {
                        statusMap[tour.request_id] = true;
                    }
                });
                setSentStatus(statusMap);
            }

            // Xử lý Tour Cố định
            if (resFixed.data.success) {
                setFixedTours(resFixed.data.data);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách:', error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm gọi API lấy chi tiết Tour Cố Định để bung Modal
    const handleViewFixedDetail = async (tourInfo) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/staff/tours/${tourInfo.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                let tourData = res.data.data;
                while (Array.isArray(tourData)) {
                    tourData = tourData[0];
                }
                if (tourData) {
                    setViewingFixedTour(tourData);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi tải chi tiết tour cố định!');
        }
    };

    // Hàm gửi báo giá cho khách (Tour thiết kế riêng)
    const handleSendQuote = async (tour) => {
        if (!window.confirm(`Bạn muốn gửi bản thiết kế và giá chính thức ${formatMoney(getGrandTotal(tour))}đ cho khách hàng ${tour.customer_name || 'Khách vãng lai'}?`)) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/custom-tours/quotes/${tour.quote_id}/send-to-customer`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert('Đã gửi bản thiết kế và giá chính thức cho khách hàng thành công!');
                setSentStatus(prev => ({ ...prev, [tour.request_id]: true }));
                fetchData(); 
            }
        } catch (error) {
            alert('Có lỗi xảy ra khi gửi báo giá.');
        }
    };

    // Helper chuẩn hóa trạng thái bằng tiếng Việt cho tour thiết kế riêng
    const getCustomStatusInfo = (tour) => {
        const isCustomerAccepted = tour.status === 'Customer_Accepted' || tour.approval_status === 'Customer_Accepted';
        const isCustomerRevision = tour.status === 'Customer_Revision' || tour.approval_status === 'Customer_Revision';
        const isManagerRejected = tour.approval_status === 'Rejected';
        const isManagerApproved = tour.approval_status === 'Approved';
        const isPendingApproval = tour.approval_status === 'Pending_Approval';
        const isQuoteSent = sentStatus[tour.request_id] || tour.status === 'Quote_Sent' || tour.approval_status === 'Quote_Sent';

        if (isCustomerAccepted) {
            return {
                label: 'Khách đã xác nhận',
                code: 'Customer_Accepted',
                bg: '#ecfdf5',
                color: '#047857',
                border: '#a7f3d0',
                dotColor: '#10b981'
            };
        }
        if (isCustomerRevision) {
            return {
                label: 'Khách yêu cầu sửa',
                code: 'Customer_Revision',
                bg: '#fff7ed',
                color: '#c2410c',
                border: '#fed7aa',
                dotColor: '#ea580c'
            };
        }
        if (isManagerRejected) {
            return {
                label: 'Sếp yêu cầu sửa',
                code: 'Rejected',
                bg: '#fef2f2',
                color: '#b91c1c',
                border: '#fecaca',
                dotColor: '#ef4444'
            };
        }
        if (isQuoteSent) {
            return {
                label: 'Đã gửi báo giá khách',
                code: 'Quote_Sent',
                bg: '#f0fdf4',
                color: '#15803d',
                border: '#bbf7d0',
                dotColor: '#22c55e'
            };
        }
        if (isManagerApproved) {
            return {
                label: 'Đã duyệt - Chờ gửi',
                code: 'Approved_Ready',
                bg: '#eff6ff',
                color: '#1d4ed8',
                border: '#bfdbfe',
                dotColor: '#3b82f6'
            };
        }
        if (isPendingApproval) {
            return {
                label: 'Đang chờ sếp duyệt',
                code: 'Pending_Approval',
                bg: '#fffbeb',
                color: '#b45309',
                border: '#fde68a',
                dotColor: '#f59e0b'
            };
        }
        return {
            label: 'Đang thiết kế',
            code: 'Draft',
            bg: '#f8fafc',
            color: '#475569',
            border: '#cbd5e1',
            dotColor: '#94a3b8'
        };
    };

    // Helper chuẩn hóa trạng thái bằng tiếng Việt cho tour cố định
    const getFixedStatusInfo = (tour) => {
        const isRejected = tour.status === 'Rejected';
        const isPending = tour.status === 'Pending';
        const isActive = tour.status === 'Active';

        if (isRejected) {
            return {
                label: 'Bị từ chối',
                code: 'Rejected',
                bg: '#fef2f2',
                color: '#b91c1c',
                border: '#fecaca',
                dotColor: '#ef4444'
            };
        }
        if (isPending) {
            return {
                label: 'Đang chờ duyệt',
                code: 'Pending',
                bg: '#fffbeb',
                color: '#b45309',
                border: '#fde68a',
                dotColor: '#f59e0b'
            };
        }
        if (isActive) {
            return {
                label: 'Đang mở bán',
                code: 'Active',
                bg: '#ecfdf5',
                color: '#047857',
                border: '#a7f3d0',
                dotColor: '#10b981'
            };
        }
        return {
            label: 'Tạm ngưng',
            code: 'Inactive',
            bg: '#f8fafc',
            color: '#475569',
            border: '#cbd5e1',
            dotColor: '#94a3b8'
        };
    };

    // Tính toán số liệu thống kê thực tế
    const customStats = {
        total: pendingTours.length,
        rejected: pendingTours.filter(t => t.approval_status === 'Rejected' || t.status === 'Customer_Revision').length,
        pending: pendingTours.filter(t => t.approval_status === 'Pending_Approval').length,
        approved: pendingTours.filter(t => t.approval_status === 'Approved' && !(sentStatus[t.request_id] || ['Quote_Sent', 'Customer_Revision', 'Customer_Accepted'].includes(t.status))).length,
        sent: pendingTours.filter(t => sentStatus[t.request_id] || t.status === 'Quote_Sent' || t.status === 'Customer_Accepted').length
    };

    const fixedStats = {
        total: fixedTours.length,
        active: fixedTours.filter(t => t.status === 'Active').length,
        pending: fixedTours.filter(t => t.status === 'Pending').length,
        rejected: fixedTours.filter(t => t.status === 'Rejected' || t.status === 'Inactive').length
    };

    // Danh sách điểm đến unique cho tab Tour Cố Định
    const fixedDestinations = Array.from(new Set(fixedTours.map(t => t.destination).filter(Boolean))).sort();

    // Filter logic
    const currentList = activeTab === 'custom' ? pendingTours : fixedTours;
    const filteredList = currentList.filter(item => {
        // Status filter
        if (filterStatus !== 'Tất cả') {
            if (activeTab === 'custom') {
                const isCustomerAccepted = item.status === 'Customer_Accepted' || item.approval_status === 'Customer_Accepted';
                const isCustomerRevision = item.status === 'Customer_Revision' || item.approval_status === 'Customer_Revision';
                const isManagerRejected = item.approval_status === 'Rejected';
                const isManagerApproved = item.approval_status === 'Approved';
                const isPendingApproval = item.approval_status === 'Pending_Approval';
                const isQuoteSent = sentStatus[item.request_id] || item.status === 'Quote_Sent';

                if (filterStatus === 'Cần sửa' && !isManagerRejected && !isCustomerRevision) return false;
                if (filterStatus === 'Chờ duyệt' && !isPendingApproval) return false;
                if (filterStatus === 'Đã duyệt' && !(isManagerApproved && !isQuoteSent && !isCustomerAccepted && !isCustomerRevision)) return false;
                if (filterStatus === 'Đã gửi khách' && !isQuoteSent && !isCustomerAccepted) return false;
                if (filterStatus === 'Đã xác nhận' && !isCustomerAccepted) return false;
            } else {
                const isPending = item.status === 'Pending';
                const isActive = item.status === 'Active';
                const isRejected = item.status === 'Rejected' || item.status === 'Inactive';

                if (filterStatus === 'Từ chối' && !isRejected) return false;
                if (filterStatus === 'Chờ duyệt' && !isPending) return false;
                if (filterStatus === 'Đang mở bán' && !isActive) return false;
            }
        }

        // Destination filter for Fixed Tours
        if (activeTab === 'fixed' && filterDestination !== 'Tất cả') {
            if (item.destination !== filterDestination) return false;
        }

        // Search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            if (activeTab === 'custom') {
                const reqId = String(item.request_id || '');
                const reqCode = `#req-${reqId}`.toLowerCase();
                const reqSimple = `#${reqId}`.toLowerCase();
                const dest = (item.destination || '').toLowerCase();
                const cust = (item.customer_name || '').toLowerCase();
                const phone = (item.phone || item.customer_phone || '').toLowerCase();

                const match = reqId.includes(term) || reqCode.includes(term) || reqSimple.includes(term) || dest.includes(term) || cust.includes(term) || phone.includes(term);
                if (!match) return false;
            } else {
                const tourId = String(item.tour_id || '');
                const tourCode = `#tour-${tourId}`.toLowerCase();
                const tourSimple = `#${tourId}`.toLowerCase();
                const name = (item.tour_name || '').toLowerCase();
                const dest = (item.destination || '').toLowerCase();

                const match = tourId.includes(term) || tourCode.includes(term) || tourSimple.includes(term) || name.includes(term) || dest.includes(term);
                if (!match) return false;
            }
        }

        return true;
    });

    // Sort logic
    const sortedList = [...filteredList].sort((a, b) => {
        if (sortBy === 'price_asc') {
            const pA = activeTab === 'custom' ? getGrandTotal(a) : Number(a.base_price || 0);
            const pB = activeTab === 'custom' ? getGrandTotal(b) : Number(b.base_price || 0);
            return pA - pB;
        }
        if (sortBy === 'price_desc') {
            const pA = activeTab === 'custom' ? getGrandTotal(a) : Number(a.base_price || 0);
            const pB = activeTab === 'custom' ? getGrandTotal(b) : Number(b.base_price || 0);
            return pB - pA;
        }
        if (sortBy === 'date_asc') {
            const dA = new Date(a.departure_date || a.created_at || 0).getTime();
            const dB = new Date(b.departure_date || b.created_at || 0).getTime();
            return dA - dB;
        }
        if (sortBy === 'duration_desc' && activeTab === 'fixed') {
            return Number(b.duration_days || 0) - Number(a.duration_days || 0);
        }
        // Default latest: ID descending
        const idA = Number(activeTab === 'custom' ? a.request_id : a.tour_id) || 0;
        const idB = Number(activeTab === 'custom' ? b.request_id : b.tour_id) || 0;
        return idB - idA;
    });

    // Pagination
    const totalPages = Math.ceil(sortedList.length / pageSize) || 1;
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const paginatedList = sortedList.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

    const getPaginationGroup = () => {
        let start = Math.max(1, safeCurrentPage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const hasActiveFilters = Boolean(
        searchTerm.trim() || 
        filterStatus !== 'Tất cả' || 
        (activeTab === 'fixed' && filterDestination !== 'Tất cả') || 
        sortBy !== 'latest'
    );

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterStatus('Tất cả');
        setFilterDestination('Tất cả');
        setSortBy('latest');
        setCurrentPage(1);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setFilterStatus('Tất cả');
        setFilterDestination('Tất cả');
        setSearchTerm('');
        setCurrentPage(1);
    };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", boxSizing: 'border-box' }}>
            
            {/* INLINE RESPONSIVE CSS CHO GRID THỐNG KÊ VÀ BẢNG ERP */}
            <style>{`
                .erp-stat-grid-custom {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .erp-stat-grid-fixed {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 12px;
                    margin-bottom: 16px;
                }
                @media (max-width: 1024px) {
                    .erp-stat-grid-custom {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }
                    .erp-stat-grid-fixed {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }
                @media (max-width: 640px) {
                    .erp-stat-grid-custom, .erp-stat-grid-fixed {
                        grid-template-columns: repeat(1, minmax(0, 1fr));
                    }
                }
                .erp-table-nowrap {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>

            {/* 1. KHU VỰC TIÊU ĐỀ TRANG VÀ TAB CHUYỂN ĐỔI */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '14px'
            }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: '800',
                        color: '#0f172a',
                        letterSpacing: '-0.3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        Tour đã thiết kế
                    </h1>
                    <p style={{
                        margin: '3px 0 0 0',
                        fontSize: '13px',
                        color: '#64748b'
                    }}>
                        Quản lý hồ sơ thiết kế tour theo yêu cầu và danh mục sản phẩm tour cố định
                    </p>
                </div>

                {/* Tab switcher: Thiết kế riêng vs Tour Cố định */}
                <div style={{
                    display: 'inline-flex',
                    backgroundColor: '#ffffff',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                    <button
                        onClick={() => handleTabChange('custom')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '7px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: activeTab === 'custom' ? '#0194f3' : 'transparent',
                            color: activeTab === 'custom' ? '#ffffff' : '#64748b',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <FileText size={15} />
                        <span>Hồ sơ Thiết Kế Riêng</span>
                        <span style={{
                            backgroundColor: activeTab === 'custom' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                            color: activeTab === 'custom' ? '#ffffff' : '#475569',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '800'
                        }}>
                            {pendingTours.length}
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange('fixed')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '7px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: activeTab === 'fixed' ? '#0194f3' : 'transparent',
                            color: activeTab === 'fixed' ? '#ffffff' : '#64748b',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <Layers size={15} />
                        <span>Sản phẩm Tour Cố Định</span>
                        <span style={{
                            backgroundColor: activeTab === 'fixed' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                            color: activeTab === 'fixed' ? '#ffffff' : '#475569',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '800'
                        }}>
                            {fixedTours.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* 2. CÁC THẺ THỐNG KÊ TRẠNG THÁI (STAT CARDS) */}
            {activeTab === 'custom' ? (
                /* Tab 1: 5 THẺ THỐNG KÊ HỒ SƠ THIẾT KẾ RIÊNG (1 HÀNG TRÊN DESKTOP) */
                <div className="erp-stat-grid-custom">
                    {/* Thẻ 1: Tất cả hồ sơ */}
                    <div
                        onClick={() => { setFilterStatus('Tất cả'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Tất cả' ? '2px solid #0194f3' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Tất cả' ? '0 2px 8px rgba(1, 148, 243, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Tổng số hồ sơ
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                                {customStats.total}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0, marginLeft: '8px' }}>
                            <FileText size={18} />
                        </div>
                    </div>

                    {/* Thẻ 2: Cần chỉnh sửa */}
                    <div
                        onClick={() => { setFilterStatus(filterStatus === 'Cần sửa' ? 'Tất cả' : 'Cần sửa'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Cần sửa' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Cần sửa' ? '0 2px 8px rgba(239, 68, 68, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Cần chỉnh sửa
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626', lineHeight: '1.2' }}>
                                {customStats.rejected}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0, marginLeft: '8px' }}>
                            <AlertTriangle size={18} />
                        </div>
                    </div>

                    {/* Thẻ 3: Đang chờ duyệt */}
                    <div
                        onClick={() => { setFilterStatus(filterStatus === 'Chờ duyệt' ? 'Tất cả' : 'Chờ duyệt'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Chờ duyệt' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Chờ duyệt' ? '0 2px 8px rgba(245, 158, 11, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Đang chờ duyệt
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#d97706', lineHeight: '1.2' }}>
                                {customStats.pending}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0, marginLeft: '8px' }}>
                            <Clock size={18} />
                        </div>
                    </div>

                    {/* Thẻ 4: Đã duyệt / Chờ gửi khách */}
                    <div
                        onClick={() => { setFilterStatus(filterStatus === 'Đã duyệt' ? 'Tất cả' : 'Đã duyệt'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Đã duyệt' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Đã duyệt' ? '0 2px 8px rgba(59, 130, 246, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Đã duyệt (Chờ gửi)
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb', lineHeight: '1.2' }}>
                                {customStats.approved}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0, marginLeft: '8px' }}>
                            <Send size={18} />
                        </div>
                    </div>

                    {/* Thẻ 5: Đã báo giá khách */}
                    <div
                        onClick={() => { setFilterStatus(filterStatus === 'Đã gửi khách' ? 'Tất cả' : 'Đã gửi khách'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Đã gửi khách' ? '2px solid #10b981' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Đã gửi khách' ? '0 2px 8px rgba(16, 185, 129, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#047857', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Đã báo giá / Chốt
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', lineHeight: '1.2' }}>
                                {customStats.sent}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0, marginLeft: '8px' }}>
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                </div>
            ) : (
                /* Tab 2: 4 THẺ THỐNG KÊ SẢN PHẨM TOUR CỐ ĐỊNH (1 HÀNG TRÊN DESKTOP) */
                <div className="erp-stat-grid-fixed">
                    {/* Thẻ 1: Tổng số tour */}
                    <div
                        onClick={() => { setFilterStatus('Tất cả'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Tất cả' ? '2px solid #0194f3' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Tất cả' ? '0 2px 8px rgba(1, 148, 243, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Tổng số tour
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                                {fixedStats.total}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0, marginLeft: '8px' }}>
                            <Layers size={18} />
                        </div>
                    </div>

                    {/* Thẻ 2: Đang mở bán */}
                    <div
                        onClick={() => { setFilterStatus(filterStatus === 'Đang mở bán' ? 'Tất cả' : 'Đang mở bán'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Đang mở bán' ? '2px solid #10b981' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Đang mở bán' ? '0 2px 8px rgba(16, 185, 129, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#047857', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Đang mở bán
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', lineHeight: '1.2' }}>
                                {fixedStats.active}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0, marginLeft: '8px' }}>
                            <CheckCircle2 size={18} />
                        </div>
                    </div>

                    {/* Thẻ 3: Đang chờ duyệt */}
                    <div
                        onClick={() => { setFilterStatus(filterStatus === 'Chờ duyệt' ? 'Tất cả' : 'Chờ duyệt'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Chờ duyệt' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Chờ duyệt' ? '0 2px 8px rgba(245, 158, 11, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Đang chờ duyệt
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#d97706', lineHeight: '1.2' }}>
                                {fixedStats.pending}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0, marginLeft: '8px' }}>
                            <Clock size={18} />
                        </div>
                    </div>

                    {/* Thẻ 4: Bị từ chối / Tạm dừng */}
                    <div
                        onClick={() => { setFilterStatus(filterStatus === 'Từ chối' ? 'Tất cả' : 'Từ chối'); setCurrentPage(1); }}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '8px',
                            border: filterStatus === 'Từ chối' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            boxShadow: filterStatus === 'Từ chối' ? '0 2px 8px rgba(239, 68, 68, 0.12)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '74px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Bị từ chối / Tạm ngưng
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: '#dc2626', lineHeight: '1.2' }}>
                                {fixedStats.rejected}
                            </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '7px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0, marginLeft: '8px' }}>
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                </div>
            )}

            {/* 3. THANH CÔNG CỤ TÌM KIẾM, BỘ LỌC VÀ CHUYỂN ĐỔI CHẾ ĐỘ XEM */}
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '12px 16px',
                marginBottom: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                }}>
                    {/* Ô tìm kiếm */}
                    <div style={{
                        position: 'relative',
                        flex: '1 1 240px',
                        minWidth: '220px',
                        height: '36px'
                    }}>
                        <Search size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder={activeTab === 'custom' ? "Tìm theo mã hồ sơ (#3), tên tour, khách hàng, SĐT..." : "Tìm theo mã tour (#1), tên tour, tuyến điểm..."}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%',
                                height: '36px',
                                padding: '0 32px 0 34px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                                color: '#0f172a',
                                backgroundColor: '#fff'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#0194f3'}
                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="Xóa từ khóa"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Lọc Điểm đến (Chỉ áp dụng cho Tour Cố Định) */}
                    {activeTab === 'fixed' && (
                        <div style={{ minWidth: '170px', height: '36px' }}>
                            <select
                                value={filterDestination}
                                onChange={(e) => { setFilterDestination(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    height: '36px',
                                    padding: '0 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="Tất cả">-- Tất cả điểm đến --</option>
                                {fixedDestinations.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Bộ lọc trạng thái */}
                    <div style={{ minWidth: '180px', height: '36px' }}>
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%',
                                height: '36px',
                                padding: '0 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                backgroundColor: '#ffffff',
                                color: '#0f172a',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="Tất cả">-- Tất cả trạng thái --</option>
                            {activeTab === 'custom' ? (
                                <>
                                    <option value="Cần sửa">Cần chỉnh sửa (Sếp/Khách)</option>
                                    <option value="Chờ duyệt">Đang chờ sếp duyệt</option>
                                    <option value="Đã duyệt">Đã duyệt - Chờ gửi khách</option>
                                    <option value="Đã gửi khách">Đã gửi báo giá khách</option>
                                    <option value="Đã xác nhận">Khách đã xác nhận</option>
                                </>
                            ) : (
                                <>
                                    <option value="Đang mở bán">Đang mở bán</option>
                                    <option value="Chờ duyệt">Đang chờ duyệt</option>
                                    <option value="Từ chối">Bị từ chối / Tạm ngưng</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Sắp xếp */}
                    <div style={{ minWidth: '170px', height: '36px' }}>
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%',
                                height: '36px',
                                padding: '0 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                backgroundColor: '#ffffff',
                                color: '#0f172a',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="latest">Mới nhất (Mặc định)</option>
                            <option value="price_desc">Tổng giá: Cao đến Thấp</option>
                            <option value="price_asc">Tổng giá: Thấp đến Cao</option>
                            {activeTab === 'custom' ? (
                                <option value="date_asc">Ngày khởi hành gần nhất</option>
                            ) : (
                                <option value="duration_desc">Thời lượng: Dài đến Ngắn</option>
                            )}
                        </select>
                    </div>

                    {/* Nút Xóa bộ lọc */}
                    {hasActiveFilters && (
                        <button
                            onClick={handleResetFilters}
                            style={{
                                height: '36px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '0 12px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#f8fafc',
                                color: '#64748b',
                                fontSize: '12.5px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <RotateCcw size={13} />
                            <span>Xóa lọc</span>
                        </button>
                    )}
                </div>

                {/* Hàng 2: Summary + View Mode Toggle */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '8px',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Hiển thị <strong style={{ color: '#0f172a' }}>{filteredList.length}</strong> bản ghi
                        {hasActiveFilters && <span> (lọc từ tổng số {currentList.length} {activeTab === 'custom' ? 'hồ sơ' : 'tour'})</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>Chế độ xem:</span>
                        <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden', height: '30px' }}>
                            <button
                                onClick={() => setViewMode('table')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '0 10px',
                                    border: 'none',
                                    borderRight: '1px solid #cbd5e1',
                                    backgroundColor: viewMode === 'table' ? '#e0f2fe' : '#ffffff',
                                    color: viewMode === 'table' ? '#0369a1' : '#64748b',
                                    fontWeight: viewMode === 'table' ? '700' : '500',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                <List size={14} />
                                <span>Bảng ERP</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '0 10px',
                                    border: 'none',
                                    backgroundColor: viewMode === 'grid' ? '#e0f2fe' : '#ffffff',
                                    color: viewMode === 'grid' ? '#0369a1' : '#64748b',
                                    fontWeight: viewMode === 'grid' ? '700' : '500',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                <LayoutGrid size={14} />
                                <span>Lưới thẻ</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. KHU VỰC DANH SÁCH HỒ SƠ */}
            {loading ? (
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    padding: '48px 20px',
                    textAlign: 'center',
                    color: '#64748b',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ fontSize: '13.5px', fontWeight: '600' }}>Đang tải danh sách dữ liệu...</div>
                </div>
            ) : filteredList.length === 0 ? (
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1.5px dashed #cbd5e1',
                    padding: '40px 20px',
                    textAlign: 'center',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#f1f5f9',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        color: '#64748b'
                    }}>
                        <Search size={22} />
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                        {currentList.length === 0 ? 'Chưa có bản ghi nào' : 'Không tìm thấy kết quả phù hợp'}
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', maxWidth: '400px', marginInline: 'auto' }}>
                        {currentList.length === 0 
                            ? 'Hiện chưa có dữ liệu nào trong nhóm này.' 
                            : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm nút xóa lọc để hiển thị toàn bộ danh sách.'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={handleResetFilters}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '7px 14px',
                                backgroundColor: '#f8fafc',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '12.5px',
                                cursor: 'pointer'
                            }}
                        >
                            <RotateCcw size={13} />
                            <span>Xóa bộ lọc</span>
                        </button>
                    )}
                </div>
            ) : viewMode === 'table' ? (
                /* ======================================================== */
                /* CHẾ ĐỘ MẶC ĐỊNH: BẢNG QUẢN LÝ ERP KHÔNG CUỘN NGANG */
                /* ======================================================== */
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    marginBottom: '16px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        {activeTab === 'custom' ? (
                            /* TAB 1: BẢNG HỒ SƠ THIẾT KẾ RIÊNG (8 CỘT CHUẨN TỶ LỆ 100%) */
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                textAlign: 'left',
                                fontSize: '13px',
                                tableLayout: 'fixed'
                            }}>
                                <colgroup>
                                    <col style={{ width: '8.5%' }} />
                                    <col style={{ width: '24.5%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '10%' }} />
                                </colgroup>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                            Mã hồ sơ
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                            Điểm đến / Tên tour
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                            Khách hàng
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            Ngày khởi hành
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            Số khách
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                            Tổng giá tour
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            Trạng thái
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedList.map((item, idx) => {
                                        const statusInfo = getCustomStatusInfo(item);
                                        const isManagerRejected = item.approval_status === 'Rejected';
                                        const isCustomerRevision = item.status === 'Customer_Revision' || item.approval_status === 'Customer_Revision';
                                        const isCustomerAccepted = item.status === 'Customer_Accepted' || item.approval_status === 'Customer_Accepted';
                                        const isManagerApproved = item.approval_status === 'Approved';
                                        const isAlreadySentToCustomer = sentStatus[item.request_id] || ['Quote_Sent', 'Customer_Revision', 'Customer_Accepted'].includes(item.status);
                                        const isApprovedReadyToSend = isManagerApproved && !isAlreadySentToCustomer;

                                        const noteText = isManagerRejected ? item.manager_note : isCustomerRevision ? item.customer_note : null;
                                        const notePrefix = isManagerRejected ? 'Sếp nhắn:' : 'Khách nhắn:';

                                        return (
                                            <tr
                                                key={item.request_id}
                                                style={{
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background-color 0.15s ease',
                                                    backgroundColor: (isManagerRejected || isCustomerRevision) 
                                                        ? 'rgba(254, 242, 242, 0.45)' 
                                                        : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                                                    borderLeft: isManagerRejected ? '3px solid #ef4444' : isCustomerRevision ? '3px solid #ea580c' : '3px solid transparent'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = (isManagerRejected || isCustomerRevision) ? '#fee2e2' : '#f1f5f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = (isManagerRejected || isCustomerRevision) ? 'rgba(254, 242, 242, 0.45)' : idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                                            >
                                                {/* 1. Mã hồ sơ */}
                                                <td style={{ padding: '9px 10px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '12.5px', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                                                        #{item.request_id}
                                                    </span>
                                                </td>

                                                {/* 2. Điểm đến / Tên tour */}
                                                <td style={{ padding: '9px 10px' }}>
                                                    <div className="erp-table-nowrap" style={{ fontWeight: '700', color: '#0f172a', fontSize: '13.5px', lineHeight: '1.3' }} title={item.destination}>
                                                        {item.destination}
                                                    </div>
                                                    {noteText && (
                                                        <div className="erp-table-nowrap" style={{
                                                            marginTop: '2px',
                                                            fontSize: '11.5px',
                                                            color: isManagerRejected ? '#b91c1c' : '#c2410c',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }} title={`${notePrefix} ${noteText}`}>
                                                            <span style={{
                                                                backgroundColor: isManagerRejected ? '#fee2e2' : '#ffedd5',
                                                                color: isManagerRejected ? '#b91c1c' : '#c2410c',
                                                                padding: '0 4px',
                                                                borderRadius: '3px',
                                                                fontWeight: '700',
                                                                fontSize: '10.5px',
                                                                flexShrink: 0
                                                            }}>
                                                                {notePrefix}
                                                            </span>
                                                            <span className="erp-table-nowrap">
                                                                {noteText}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 3. Khách hàng */}
                                                <td style={{ padding: '9px 10px' }}>
                                                    <div className="erp-table-nowrap" style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        color: '#1e293b',
                                                        fontWeight: '600',
                                                        fontSize: '13px'
                                                    }} title={item.customer_name || 'Khách vãng lai'}>
                                                        <User size={13} color="#64748b" style={{ flexShrink: 0 }} />
                                                        <span className="erp-table-nowrap">
                                                            {item.customer_name || 'Khách vãng lai'}
                                                        </span>
                                                    </div>
                                                    {(item.phone || item.customer_phone) && (
                                                        <div style={{ fontSize: '11px', color: '#64748b', paddingLeft: '18px' }}>
                                                            {item.phone || item.customer_phone}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 4. Ngày khởi hành */}
                                                <td style={{ padding: '9px 10px', color: '#475569', fontWeight: '500', textAlign: 'center', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                                    {item.departure_date ? new Date(item.departure_date).toLocaleDateString('vi-VN') : 'Linh hoạt'}
                                                </td>

                                                {/* 5. Số khách */}
                                                <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 7px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                                        <Users size={12} color="#64748b" />
                                                        <span>{item.people_count || 1} người</span>
                                                    </span>
                                                </td>

                                                {/* 6. Tổng giá tour */}
                                                <td style={{ padding: '9px 10px', fontWeight: '800', color: '#059669', textAlign: 'right', fontSize: '13.5px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                                    {formatMoney(getGrandTotal(item))} đ
                                                </td>

                                                {/* 7. Trạng thái */}
                                                <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        backgroundColor: statusInfo.bg,
                                                        color: statusInfo.color,
                                                        border: `1px solid ${statusInfo.border}`,
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        padding: '2px 6px',
                                                        borderRadius: '5px',
                                                        whiteSpace: 'nowrap',
                                                        maxWidth: '100%',
                                                        boxSizing: 'border-box'
                                                    }} title={statusInfo.label}>
                                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusInfo.dotColor, flexShrink: 0 }} />
                                                        <span className="erp-table-nowrap">{statusInfo.label}</span>
                                                    </span>
                                                </td>

                                                {/* 8. Thao tác */}
                                                <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                                                        {(isManagerRejected || isCustomerRevision) ? (
                                                            <button
                                                                onClick={() => onEditDesign && onEditDesign(item)}
                                                                style={{
                                                                    height: '32px',
                                                                    padding: '0 10px',
                                                                    backgroundColor: '#fee2e2',
                                                                    border: '1px solid #fca5a5',
                                                                    borderRadius: '6px',
                                                                    color: '#b91c1c',
                                                                    fontSize: '12px',
                                                                    fontWeight: '700',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fecaca'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                                                                title="Sửa lại thiết kế theo yêu cầu"
                                                            >
                                                                <Edit3 size={12} />
                                                                <span>Sửa lại</span>
                                                            </button>
                                                        ) : isApprovedReadyToSend ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleSendQuote(item)}
                                                                    style={{
                                                                        height: '32px',
                                                                        padding: '0 8px',
                                                                        backgroundColor: '#059669',
                                                                        border: '1px solid #047857',
                                                                        borderRadius: '6px',
                                                                        color: '#ffffff',
                                                                        fontSize: '12px',
                                                                        fontWeight: '700',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        transition: 'all 0.15s ease'
                                                                    }}
                                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#047857'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#059669'; }}
                                                                    title="Gửi báo giá chính thức cho khách"
                                                                >
                                                                    <Send size={12} />
                                                                    <span>Gửi</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => onEditDesign && onEditDesign(item)}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        padding: 0,
                                                                        backgroundColor: '#ffffff',
                                                                        border: '1px solid #cbd5e1',
                                                                        borderRadius: '6px',
                                                                        color: '#334155',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'all 0.15s ease'
                                                                    }}
                                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                                                    title="Xem chi tiết thiết kế"
                                                                >
                                                                    <Eye size={13} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => onEditDesign && onEditDesign(item)}
                                                                style={{
                                                                    height: '32px',
                                                                    padding: '0 10px',
                                                                    backgroundColor: '#ffffff',
                                                                    border: '1px solid #cbd5e1',
                                                                    borderRadius: '6px',
                                                                    color: '#334155',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                                                title="Xem chi tiết thiết kế"
                                                            >
                                                                <Eye size={12} />
                                                                <span>Chi tiết</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            /* TAB 2: BẢNG SẢN PHẨM TOUR CỐ ĐỊNH (7 CỘT CHUẨN TỶ LỆ 100%) */
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                textAlign: 'left',
                                fontSize: '13px',
                                tableLayout: 'fixed'
                            }}>
                                <colgroup>
                                    <col style={{ width: '8.5%' }} />
                                    <col style={{ width: '28.5%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '13%' }} />
                                </colgroup>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                            Mã tour
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                            Tên sản phẩm tour
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                            Điểm đến
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            Thời lượng
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                            Giá công bố
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            Trạng thái
                                        </th>
                                        <th style={{ padding: '10px 10px', fontWeight: '700', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedList.map((item, idx) => {
                                        const statusInfo = getFixedStatusInfo(item);
                                        const isRejected = item.status === 'Rejected';

                                        return (
                                            <tr
                                                key={item.tour_id}
                                                style={{
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background-color 0.15s ease',
                                                    backgroundColor: isRejected ? 'rgba(254, 242, 242, 0.45)' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                                                    borderLeft: isRejected ? '3px solid #ef4444' : '3px solid transparent'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isRejected ? '#fee2e2' : '#f1f5f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isRejected ? 'rgba(254, 242, 242, 0.45)' : idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                                            >
                                                {/* 1. Mã tour */}
                                                <td style={{ padding: '9px 10px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap' }}>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '12.5px', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                                                        #{item.tour_id}
                                                    </span>
                                                </td>

                                                {/* 2. Tên tour */}
                                                <td style={{ padding: '9px 10px' }}>
                                                    <div className="erp-table-nowrap" style={{ fontWeight: '700', color: '#0f172a', fontSize: '13.5px', lineHeight: '1.3' }} title={item.tour_name}>
                                                        {item.tour_name}
                                                    </div>
                                                    {isRejected && item.rejection_reason && (
                                                        <div className="erp-table-nowrap" style={{
                                                            marginTop: '2px',
                                                            fontSize: '11.5px',
                                                            color: '#b91c1c',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }} title={`Lý do từ chối: ${item.rejection_reason}`}>
                                                            <span style={{
                                                                backgroundColor: '#fee2e2',
                                                                color: '#b91c1c',
                                                                padding: '0 4px',
                                                                borderRadius: '3px',
                                                                fontWeight: '700',
                                                                fontSize: '10.5px',
                                                                flexShrink: 0
                                                            }}>
                                                                Lý do:
                                                            </span>
                                                            <span className="erp-table-nowrap">
                                                                {item.rejection_reason}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 3. Điểm đến */}
                                                <td style={{ padding: '9px 10px' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: '#0369a1',
                                                        backgroundColor: '#e0f2fe',
                                                        padding: '2px 7px',
                                                        borderRadius: '4px',
                                                        maxWidth: '100%',
                                                        boxSizing: 'border-box'
                                                    }} title={item.destination}>
                                                        <MapPin size={11} style={{ flexShrink: 0 }} />
                                                        <span className="erp-table-nowrap">
                                                            {item.destination}
                                                        </span>
                                                    </span>
                                                </td>

                                                {/* 4. Thời lượng */}
                                                <td style={{ padding: '9px 10px', color: '#475569', fontWeight: '500', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: '#f8fafc', color: '#334155', padding: '2px 7px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                                        <Clock size={11} color="#64748b" />
                                                        <span>{item.duration_days} ngày</span>
                                                    </span>
                                                </td>

                                                {/* 5. Giá công bố */}
                                                <td style={{ padding: '9px 10px', fontWeight: '800', color: '#ea580c', textAlign: 'right', fontSize: '13.5px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                                    {formatMoney(item.base_price)} đ
                                                </td>

                                                {/* 6. Trạng thái */}
                                                <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        backgroundColor: statusInfo.bg,
                                                        color: statusInfo.color,
                                                        border: `1px solid ${statusInfo.border}`,
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        padding: '2px 6px',
                                                        borderRadius: '5px',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusInfo.dotColor, flexShrink: 0 }} />
                                                        <span>{statusInfo.label}</span>
                                                    </span>
                                                </td>

                                                {/* 7. Thao tác */}
                                                <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                                                        <button
                                                            onClick={() => handleViewFixedDetail(item)}
                                                            style={{
                                                                height: '32px',
                                                                padding: '0 10px',
                                                                backgroundColor: isRejected ? '#fee2e2' : '#ffffff',
                                                                border: isRejected ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                                                                borderRadius: '6px',
                                                                color: isRejected ? '#b91c1c' : '#334155',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = isRejected ? '#fecaca' : '#f1f5f9'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = isRejected ? '#fee2e2' : '#ffffff'; }}
                                                        >
                                                            {isRejected ? <Edit3 size={12} /> : <Eye size={12} />}
                                                            <span>{isRejected ? 'Xem lỗi & Sửa' : 'Xem chi tiết'}</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                /* ======================================================== */
                /* CHẾ ĐỘ LƯỚI THẺ (GRID VIEW) */
                /* ======================================================== */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                }}>
                    {paginatedList.map((item) => {
                        if (activeTab === 'custom') {
                            const statusInfo = getCustomStatusInfo(item);
                            const isManagerRejected = item.approval_status === 'Rejected';
                            const isCustomerRevision = item.status === 'Customer_Revision' || item.approval_status === 'Customer_Revision';
                            const isManagerApproved = item.approval_status === 'Approved';
                            const isAlreadySentToCustomer = sentStatus[item.request_id] || ['Quote_Sent', 'Customer_Revision', 'Customer_Accepted'].includes(item.status);
                            const isApprovedReadyToSend = isManagerApproved && !isAlreadySentToCustomer;

                            const noteText = isManagerRejected ? item.manager_note : isCustomerRevision ? item.customer_note : null;
                            const notePrefix = isManagerRejected ? 'Sếp nhắn:' : 'Khách nhắn:';

                            return (
                                <div
                                    key={item.request_id}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '10px',
                                        padding: '16px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                        border: (isManagerRejected || isCustomerRevision) ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s ease',
                                        height: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                backgroundColor: statusInfo.bg,
                                                color: statusInfo.color,
                                                border: `1px solid ${statusInfo.border}`,
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '2px 8px',
                                                borderRadius: '20px'
                                            }}>
                                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusInfo.dotColor }} />
                                                <span>{statusInfo.label}</span>
                                            </span>
                                            <span style={{ color: '#0369a1', backgroundColor: '#e0f2fe', fontSize: '11.5px', fontWeight: '700', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '4px' }}>
                                                #{item.request_id}
                                            </span>
                                        </div>

                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4' }}>
                                            {item.destination}
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#475569', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={13} color="#64748b" />
                                                <span>Khách: <strong style={{ color: '#1e293b' }}>{item.customer_name || 'Khách vãng lai'}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Users size={13} color="#64748b" />
                                                <span>Số lượng: <strong style={{ color: '#1e293b' }}>{item.people_count || 1} người</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={13} color="#64748b" />
                                                <span>Lịch trình: <strong style={{ color: '#1e293b' }}>{item.departure_date ? new Date(item.departure_date).toLocaleDateString('vi-VN') : 'Linh hoạt'}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <DollarSign size={14} color="#059669" />
                                                <span>Tổng giá tour: <strong style={{ color: '#059669', fontSize: '14px' }}>{formatMoney(getGrandTotal(item))} đ</strong></span>
                                            </div>
                                        </div>

                                        {noteText && (
                                            <div style={{ marginBottom: '12px', padding: '8px 10px', backgroundColor: isManagerRejected ? '#fef2f2' : '#ffedd5', borderLeft: isManagerRejected ? '3px solid #ef4444' : '3px solid #ea580c', borderRadius: '4px', fontSize: '12px', color: isManagerRejected ? '#991b1b' : '#9a3412' }}>
                                                <strong>{notePrefix} </strong> {noteText}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: 'auto', display: 'flex', gap: '6px' }}>
                                        {(isManagerRejected || isCustomerRevision) ? (
                                            <button
                                                onClick={() => onEditDesign && onEditDesign(item)}
                                                style={{ width: '100%', height: '32px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                            >
                                                <Edit3 size={13} />
                                                <span>Sửa lại thiết kế</span>
                                            </button>
                                        ) : isApprovedReadyToSend ? (
                                            <>
                                                <button
                                                    onClick={() => onEditDesign && onEditDesign(item)}
                                                    style={{ flex: 1, height: '32px', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                                                >
                                                    Xem chi tiết
                                                </button>
                                                <button
                                                    onClick={() => handleSendQuote(item)}
                                                    style={{ flex: 1.4, height: '32px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                >
                                                    <Send size={13} />
                                                    <span>Gửi khách</span>
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => onEditDesign && onEditDesign(item)}
                                                style={{ width: '100%', height: '32px', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                            >
                                                <Eye size={13} />
                                                <span>Xem chi tiết</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            // Fixed tour card
                            const statusInfo = getFixedStatusInfo(item);
                            const isRejected = item.status === 'Rejected';
                            const imageUrl = resolveTourImage(item.image_url);

                            return (
                                <div
                                    key={item.tour_id}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                        border: isRejected ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s ease',
                                        height: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; }}
                                >
                                    {/* Tour Image Banner */}
                                    <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                                        {imageUrl ? (
                                            <img 
                                                src={imageUrl} 
                                                alt={item.tour_name} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                                                onError={(e) => {
                                                    if (e.currentTarget.src.includes(':5000/')) {
                                                        e.currentTarget.src = e.currentTarget.src.replace(':5000/', ':5002/');
                                                    } else {
                                                        e.currentTarget.style.display = 'none';
                                                        if (e.currentTarget.nextElementSibling) {
                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                        }
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="img-fallback-placeholder"
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
                                                display: imageUrl ? 'none' : 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                color: '#ffffff' 
                                            }}
                                        >
                                            <ImageIcon size={32} opacity={0.7} />
                                        </div>
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
                                            <span style={{ color: '#0369a1', backgroundColor: 'rgba(255,255,255,0.95)', fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', padding: '2px 7px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                                #{item.tour_id}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                backgroundColor: statusInfo.bg,
                                                color: statusInfo.color,
                                                border: `1px solid ${statusInfo.border}`,
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '2px 7px',
                                                borderRadius: '12px'
                                            }}>
                                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusInfo.dotColor }} />
                                                <span>{statusInfo.label}</span>
                                            </span>
                                        </div>

                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4' }}>
                                            {item.tour_name}
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#475569', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={13} color="#64748b" />
                                                <span>Tuyến: <strong style={{ color: '#1e293b' }}>{item.destination}</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={13} color="#64748b" />
                                                <span>Thời gian: <strong style={{ color: '#1e293b' }}>{item.duration_days} Ngày</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <DollarSign size={14} color="#ea580c" />
                                                <span>Giá công bố: <strong style={{ color: '#ea580c', fontSize: '14px' }}>{formatMoney(item.base_price)} đ</strong></span>
                                            </div>
                                        </div>

                                        {isRejected && item.rejection_reason && (
                                            <div style={{ marginBottom: '12px', padding: '8px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px', fontSize: '12px', color: '#991b1b' }}>
                                                <strong>Lý do từ chối:</strong> {item.rejection_reason}
                                            </div>
                                        )}

                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: 'auto' }}>
                                            <button
                                                onClick={() => handleViewFixedDetail(item)}
                                                style={{
                                                    width: '100%',
                                                    height: '32px',
                                                    backgroundColor: isRejected ? '#fee2e2' : '#f8fafc',
                                                    color: isRejected ? '#b91c1c' : '#334155',
                                                    border: isRejected ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                                                    borderRadius: '6px',
                                                    fontWeight: '600',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                {isRejected ? <Edit3 size={12} /> : <Eye size={12} />}
                                                <span>{isRejected ? 'Xem lỗi & Sửa' : 'Xem chi tiết'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    })}
                </div>
            )}

            {/* 5. THANH PHÂN TRANG CHUẨN ERP */}
            {sortedList.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    flexWrap: 'wrap',
                    gap: '10px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                    {/* Range và chọn số dòng mỗi trang */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#64748b' }}>
                        <span>
                            Hiển thị <strong style={{ color: '#0f172a' }}>{(safeCurrentPage - 1) * pageSize + 1}</strong> - <strong style={{ color: '#0f172a' }}>{Math.min(safeCurrentPage * pageSize, sortedList.length)}</strong> / <strong style={{ color: '#0f172a' }}>{sortedList.length}</strong> {activeTab === 'custom' ? 'hồ sơ' : 'tour'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '12px' }}>{viewMode === 'grid' ? 'Tour/trang:' : 'Dòng/trang:'}</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                style={{
                                    padding: '3px 6px',
                                    borderRadius: '5px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '12.5px',
                                    backgroundColor: '#fff',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={48}>48</option>
                            </select>
                        </div>
                    </div>

                    {/* Cụm nút phân trang */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: safeCurrentPage <= 1 ? '#f8fafc' : '#ffffff',
                                color: safeCurrentPage <= 1 ? '#94a3b8' : '#334155',
                                cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                                fontSize: '12.5px',
                                fontWeight: '600'
                            }}
                        >
                            <ChevronLeft size={14} />
                            <span>Trước</span>
                        </button>

                        {getPaginationGroup().map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                style={{
                                    minWidth: '30px',
                                    height: '30px',
                                    padding: '0 5px',
                                    borderRadius: '5px',
                                    border: pageNum === safeCurrentPage ? '1px solid #0194f3' : '1px solid #cbd5e1',
                                    backgroundColor: pageNum === safeCurrentPage ? '#0194f3' : '#ffffff',
                                    color: pageNum === safeCurrentPage ? '#ffffff' : '#334155',
                                    fontWeight: pageNum === safeCurrentPage ? '700' : '500',
                                    fontSize: '12.5px',
                                    cursor: 'pointer'
                                }}
                            >
                                {pageNum}
                            </button>
                        ))}

                        <button
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: safeCurrentPage >= totalPages ? '#f8fafc' : '#ffffff',
                                color: safeCurrentPage >= totalPages ? '#94a3b8' : '#334155',
                                cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '12.5px',
                                fontWeight: '600'
                            }}
                        >
                            <span>Sau</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* 6. MODAL XEM CHI TIẾT SẢN PHẨM TOUR CỐ ĐỊNH (GIỮ NGUYÊN VẸN 100%) */}
            {viewingFixedTour && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#047857' }}>
                            Chi tiết Sản phẩm: {viewingFixedTour.tour_name}
                        </h3>
                        
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
                            {viewingFixedTour.image_url && (
                                <div style={{ marginBottom: '16px' }}>
                                    <img src={resolveTourImage(viewingFixedTour.image_url)} onError={(e) => { if (e.currentTarget.src.includes(':5000/')) e.currentTarget.src = e.currentTarget.src.replace(':5000/', ':5002/'); }} alt="Cover" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Tuyến đường</p><p style={{ margin: 0, fontWeight: '600' }}>{viewingFixedTour.destination_name || viewingFixedTour.destination || 'Chưa rõ'}</p></div>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Thời gian</p><p style={{ margin: 0, fontWeight: '600' }}>{viewingFixedTour.duration_days || 1} Ngày {Math.max(0, (viewingFixedTour.duration_days || 1) - 1)} Đêm</p></div>
                            </div>

                            {(() => {
                                if (!viewingFixedTour.design_data) return <span style={{ color: '#64748b' }}>Chưa có chi tiết lịch trình.</span>;
                                try {
                                    let parsedDesign = typeof viewingFixedTour.design_data === 'string' ? JSON.parse(viewingFixedTour.design_data) : viewingFixedTour.design_data;
                                    
                                    let rawDays = parsedDesign.days || parsedDesign.itineraryDays || parsedDesign.itinerary || viewingFixedTour.itineraries || [];
                                    let days = Array.isArray(rawDays) ? rawDays.map((d, idx) => {
                                        const dayIndex = d.dayIndex || d.day_number || d.day || (idx + 1);
                                        const route_title = d.route_title || d.title || d.dateString || `Ngày ${dayIndex}`;
                                        
                                        let activities = d.activities;
                                        if (!activities || !Array.isArray(activities)) {
                                            activities = [];
                                            if (d.slots) {
                                                ['morning', 'noon', 'evening'].forEach(slotKey => {
                                                    if (Array.isArray(d.slots[slotKey])) {
                                                        d.slots[slotKey].forEach(act => {
                                                            activities.push({
                                                                type: act.type || 'Tham quan',
                                                                name: act.name || act.title || 'Hoạt động',
                                                                price: Number(act.price || 0)
                                                            });
                                                        });
                                                    }
                                                });
                                            } else if (d.places && Array.isArray(d.places)) {
                                                d.places.forEach(p => {
                                                    activities.push({
                                                        type: 'Tham quan',
                                                        name: p.place_name || p.name || 'Điểm tham quan',
                                                        price: Number(p.price || 0)
                                                    });
                                                });
                                            } else if (d.description && typeof d.description === 'string') {
                                                activities.push({
                                                    type: 'Lịch trình',
                                                    name: d.description,
                                                    price: 0
                                                });
                                            }
                                        }

                                        let accommodation = d.accommodation;
                                        if (!accommodation && (d.hotel || d.hotel_name || d.lodging)) {
                                            const rawHotel = d.hotel || d.hotel_name || d.lodging;
                                            accommodation = {
                                                name: typeof rawHotel === 'object' ? (rawHotel.name || rawHotel.service_name || rawHotel.title) : rawHotel,
                                                price: Number(d.hotel_price || (typeof rawHotel === 'object' ? rawHotel.price : 0) || 0)
                                            };
                                        }

                                        return {
                                            ...d,
                                            dayIndex,
                                            route_title,
                                            activities,
                                            accommodation
                                        };
                                    }) : [];

                                    const costConfig = parsedDesign.costConfig || {
                                        minimumPax: 15, margin: 18,
                                        selectedTransport: parsedDesign.fixedServices?.transport?.[0] ? { name: parsedDesign.fixedServices.transport[0].name, price: parsedDesign.fixedServices.transport[0].price } : null,
                                        transportTimes: { startD: '07:00', endD: '11:30', startR: '13:00', endR: '18:00' },
                                        fixed: { guidePerDay: 500000 },
                                        variable: { breakfast: 100000, lunch: 150000, dinner: 200000 }
                                    };

                                    const computed = parsedDesign.computed || {
                                        netCost: Number(viewingFixedTour.base_cost || viewingFixedTour.net_cost || 3500000),
                                        sellingPrice: Number(viewingFixedTour.base_price || viewingFixedTour.price || 4200000),
                                        totalDays: days.length || viewingFixedTour.duration_days || 1,
                                        totalNights: Math.max(0, (days.length || viewingFixedTour.duration_days || 1) - 1)
                                    };

                                    const dayImages = parsedDesign.dayImages || {};

                                    if (!days || days.length === 0) return <span style={{ color: '#64748b' }}>Dữ liệu thiết kế không đầy đủ.</span>;
                                    
                                    const formatMoneyLocal = (val) => new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));

                                    const firstDay = days[0] || {};
                                    const lastDay = days[days.length - 1] || {};
                                    const startDay1 = getDestName(firstDay.start_destination_id, firstDay, false, viewingFixedTour);
                                    const endDay1 = getDestName(firstDay.end_destination_id, firstDay, true, viewingFixedTour);
                                    let startLastDay = getDestName(lastDay.start_destination_id, lastDay, false, viewingFixedTour);
                                    let endLastDay = getDestName(lastDay.end_destination_id, lastDay, true, viewingFixedTour);
                                    if (startLastDay === 'Điểm xuất phát' && endDay1 && endDay1 !== 'Điểm đến') startLastDay = endDay1;
                                    if (endLastDay === 'Điểm đến' && startDay1 && startDay1 !== 'Điểm xuất phát') endLastDay = startDay1;

                                    const transLocs = costConfig.transportLocations || {};
                                    const dispStartD = transLocs.startD || startDay1;
                                    const dispEndD = transLocs.endD || endDay1;
                                    const dispStartR = transLocs.startR || ((startLastDay && startLastDay !== startDay1) ? startLastDay : endDay1);
                                    const dispEndR = transLocs.endR || endLastDay;

                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
                                            {/* CỘT TRÁI: LỊCH TRÌNH CHI TIẾT */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>🗺️ Lịch trình chi tiết</h4>
                                                {days.map((day) => (
                                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '700', color: '#047857', fontSize: '15px' }}>NGÀY {day.dayIndex} {day.route_title ? " - " + day.route_title : ''}</span>
                                                        </div>
                                                        
                                                        <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
                                                            {dayImages && dayImages[day.dayIndex] && (
                                                                <div style={{ flexShrink: 0 }}>
                                                                    <img src={dayImages[day.dayIndex].startsWith('/') ? 'http://localhost:5002' + dayImages[day.dayIndex] : dayImages[day.dayIndex]} alt="Ngày" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {/* Bảng hoạt động */}
                                                                <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                                                    {day.activities && day.activities.length > 0 ? day.activities.map((act, idx) => (
                                                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 100px', gap: '12px', padding: '10px 12px', borderBottom: idx !== day.activities.length - 1 ? '1px solid #e2e8f0' : 'none', alignItems: 'center' }}>
                                                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{act.type}</span>
                                                                            <strong style={{ fontSize: '13px', color: '#334155' }}>{act.name}</strong>
                                                                            <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600', textAlign: 'right' }}>{act.price ? formatMoneyLocal(act.price) + ' đ' : '-'}</span>
                                                                        </div>
                                                                    )) : <div style={{ padding: '10px', fontSize: '13px', color: '#94a3b8' }}>Chưa có hoạt động</div>}
                                                                </div>

                                                                {/* Khách sạn đặc biệt của ngày */}
                                                                {day.accommodation && day.accommodation.name && (
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 100px', gap: '12px', background: '#eff6ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bfdbfe', alignItems: 'center', marginTop: '4px' }}>
                                                                        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>Lưu trú</span>
                                                                        <strong style={{ fontSize: '13px', color: '#1e3a8a' }}>{day.accommodation.name}</strong>
                                                                        <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600', textAlign: 'right' }}>{day.accommodation.price ? formatMoneyLocal(day.accommodation.price) + ' đ' : '-'}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* CỘT PHẢI: BẢNG KÊ TÀI CHÍNH */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>📊 Bảng kê Tài chính</h4>
                                                

                                                {/* Block Phương tiện CHI TIẾT */}
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '12px' }}>🚗 Phương tiện di chuyển chính: {getTransportName(costConfig, parsedDesign, viewingFixedTour)}</strong>

                                                    
                                                    {costConfig.transportTimes && (
                                                        <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến đi (Ngày đầu)</div>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                    <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                                    <span>{startDay1}</span>
                                                                    <span>{endDay1}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ width: '1px', background: '#e2e8f0' }}></div>

                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến về (Ngày {computed.totalDays})</div>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startR || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                    <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endR || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                                    <span>{startLastDay}</span>
                                                                    <span>{endLastDay}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Block Định phí */}
                                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>🔒 Định phí (Cố định toàn tour)</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền xe nguyên chuyến:</span> <strong>{formatMoneyLocal(computed.autoFixedTransport)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền Hướng dẫn viên:</span> <strong>{formatMoneyLocal(costConfig.fixed?.guidePerDay * computed.totalDays)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Phí cố định khác:</span> <strong>{formatMoneyLocal(costConfig.fixed?.otherFixed)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Chia đều cho {costConfig.minimumPax} khách</span>
                                                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatMoneyLocal((computed.autoFixedTransport + (costConfig.fixed?.guidePerDay * computed.totalDays) + costConfig.fixed?.otherFixed) / costConfig.minimumPax)} đ / khách</strong>
                                                    </div>
                                                </div>

                                                {/* Block Biến phí */}
                                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>👤 Biến phí (Chi phí / 1 khách)</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền Lưu trú:</span> <strong>{formatMoneyLocal(computed.autoAccommodationCost)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Ăn Sáng ({computed.totalMeals?.breakfast} bữa):</span> <strong>{formatMoneyLocal(computed.totalMeals?.breakfast * costConfig.variable?.breakfast)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Ăn Trưa ({computed.totalMeals?.lunch} bữa):</span> <strong>{formatMoneyLocal(computed.totalMeals?.lunch * costConfig.variable?.lunch)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Ăn Tối ({computed.totalMeals?.dinner} bữa):</span> <strong>{formatMoneyLocal(computed.totalMeals?.dinner * costConfig.variable?.dinner)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Vé tham quan:</span> <strong>{formatMoneyLocal(computed.autoTicketsCost)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Vé xe cá nhân:</span> <strong>{formatMoneyLocal(computed.autoVariableTransport)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>Tổng Biến Phí:</strong>
                                                        <strong style={{ fontSize: '14px', color: '#ef4444' }}>{formatMoneyLocal(computed.autoAccommodationCost + (computed.totalMeals?.breakfast * costConfig.variable?.breakfast) + (computed.totalMeals?.lunch * costConfig.variable?.lunch) + (computed.totalMeals?.dinner * costConfig.variable?.dinner) + computed.autoTicketsCost + computed.autoVariableTransport)} đ</strong>
                                                    </div>
                                                </div>

                                                {/* Block Lợi nhuận & Chốt giá */}
                                                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #86efac', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#166534', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>💰 Tổng kết Giá Tour</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#166534' }}>
                                                        <span>Giá vốn (Net Cost):</span> <strong>{formatMoneyLocal(computed.netCost)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#166534' }}>
                                                        <span>Lợi nhuận mong muốn:</span> <strong>{costConfig.margin}%</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#166534' }}>
                                                        <span>Phụ thu phòng đơn:</span> <strong>{formatMoneyLocal(costConfig.variable?.singleSupplement)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '2px solid #bbf7d0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong style={{ fontSize: '16px', color: '#15803d' }}>GIÁ BÁN CÔNG BỐ:</strong>
                                                        <strong style={{ fontSize: '20px', color: '#15803d', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>{formatMoneyLocal(computed.sellingPrice)} đ</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } catch (e) { return <span>Lỗi hiển thị lịch trình.</span>; }
                            })()}
                        </div>

                        {viewingFixedTour.status === 'Rejected' && viewingFixedTour.rejection_reason && (
                            <div style={{ margin: '12px 0', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', color: '#991b1b' }}>
                                <strong>⚠️ Quản lý yêu cầu chỉnh sửa:</strong><br/>
                                <span style={{ whiteSpace: 'pre-line' }}>{viewingFixedTour.rejection_reason}</span>
                            </div>
                        )}

                        {/* BUTTONS XỬ LÝ TRONG MODAL */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                            <button 
                                onClick={() => setViewingFixedTour(null)} 
                                style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Đóng
                            </button>
                            
                            {/* CHỈ CHO PHÉP SỬA KHI TOUR ĐANG PENDING HOẶC BỊ TỪ CHỐI */}
                            {(viewingFixedTour.status === 'Pending' || viewingFixedTour.status === 'Rejected') && (
                                <button 
                                    onClick={() => {
                                        setViewingFixedTour(null); // Đóng modal trước
                                        if (onEditFixedDesign) {
                                            onEditFixedDesign(viewingFixedTour);
                                        } else {
                                            alert('Vui lòng thêm hàm onEditFixedDesign ở component cha (Dashboard) để chuyển trang!');
                                        }
                                    }} 
                                    style={{ padding: '8px 18px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(1, 148, 243, 0.25)' }}
                                >
                                    ✏️ Chỉnh sửa bản thiết kế
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StaffPendingTours;
