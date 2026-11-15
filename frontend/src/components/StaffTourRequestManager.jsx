import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { formatVehicleDisplayName } from '../utils/vehicleDisplayHelper';
import { 
    Search,
    Plus,
    Trash2,
    RefreshCw,
    Building2,
    Car,
    Utensils,
    UserCheck,
    Save,
    Sparkles, 
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
    Users, 
    Calendar, 
    DollarSign, 
    MapPin, 
    AlertTriangle, 
    Layers, 
    FileText, 
    Phone, 
    Info,
    ArrowRight
} from 'lucide-react';

const FormattedMoneyInput = ({ value, onChange, placeholder, style, disabled }) => {
    const inputRef = React.useRef(null);
    const [cursor, setCursor] = React.useState(null);
    const displayValue = (value !== null && value !== '') ? Number(value).toLocaleString('vi-VN') : '';

    React.useLayoutEffect(() => {
        if (inputRef.current && cursor !== null) {
            inputRef.current.setSelectionRange(cursor, cursor);
        }
    }, [displayValue, cursor]);

    const handleChange = (e) => {
        const input = e.target;
        const currentCursor = input.selectionStart;
        
        const raw = input.value.replace(/\D/g, '');
        const newVal = raw ? Number(raw) : '';
        const newFormatted = newVal ? Number(newVal).toLocaleString('vi-VN') : '';
        
        const rawBeforeCursor = input.value.substring(0, currentCursor).replace(/\D/g, '');
        let newCursor = 0;
        let digitsPassed = 0;
        for (let i = 0; i < newFormatted.length; i++) {
            if (digitsPassed === rawBeforeCursor.length) break;
            if (newFormatted[i] >= '0' && newFormatted[i] <= '9') digitsPassed++;
            newCursor++;
        }
        
        setCursor(newCursor);
        onChange(newVal);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            style={style}
            disabled={disabled}
        />
    );
};

// Hàm kiểm tra hồ sơ đã có bản thiết kế tour chi tiết hay chưa (phân định giữa Chỉnh sửa báo giá sơ bộ vs Chỉnh sửa thiết kế)
export const hasTourDesign = (req) => {
    if (!req) return false;
    // Bị quản lý từ chối thì chắc chắn là bản thiết kế tour đã gửi duyệt
    if (req.status === 'Manager_Rejected') return true;
    
    // Nếu status là các trạng thái thuộc quy trình thiết kế sau khi khách duyệt báo giá
    if (['Manager_Approved', 'Sent_To_Customer', 'Customer_Accepted', 'Completed'].includes(req.status)) {
        return true;
    }

    // Kiểm tra xem đã có lịch trình chi tiết (days) hoặc costConfig trong proposed_itinerary / itinerary chưa
    try {
        const raw = req.proposed_itinerary || req.itinerary;
        if (raw) {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (parsed && ((Array.isArray(parsed.days) && parsed.days.length > 0) || parsed.costConfig)) {
                return true;
            }
        }
    } catch (e) {}

    return false;
};

// Cấu hình nghiệp vụ và giao diện chuyên biệt cho 3 chức năng
const STAGE_CONFIGS = {
    tour_requests_pending: {
        title: 'Báo giá tour theo yêu cầu',
        subtitle: 'Tiếp nhận yêu cầu và lập báo giá tour phù hợp cho khách hàng',
        badgeSuffix: 'yêu cầu',
        defaultFilter: 'Tất cả',
        isApplicable: (req) => {
            // Hồ sơ khách hàng yêu cầu sửa báo giá (chưa vào giai đoạn thiết kế tour chi tiết)
            if (req.status === 'Customer_Revision' && !hasTourDesign(req)) return true;
            return ['Pending', 'Initial_Quoted', 'Initial_Accepted', 'Canceled', 'Customer_Rejected', 'Processing'].includes(req.status);
        },
        filterOptions: [
            { label: 'Tất cả trạng thái báo giá', value: 'Tất cả' },
            { label: 'Chờ báo giá (Mới tiếp nhận)', value: 'Pending' },
            { label: 'Khách yêu cầu sửa báo giá', value: 'Customer_Revision' },
            { label: 'Đã gửi báo giá', value: 'Initial_Quoted' },
            { label: 'Khách hàng đã xác nhận', value: 'Initial_Accepted' },
            { label: 'Khách từ chối / Đã hủy', value: 'Canceled' }
        ],
        // 5 thẻ thống kê đầy đủ theo quy trình báo giá
        statColumns: 5,
        statCards: (subRequests) => [
            { id: 'all', label: 'Tổng yêu cầu', value: subRequests.length, filterVal: 'Tất cả', color: '#0194f3', bg: '#eff6ff', icon: FileText },
            { id: 'pending', label: 'Chờ báo giá', value: subRequests.filter(r => r.status === 'Pending' || r.status === 'Processing').length, filterVal: 'Pending', color: '#059669', bg: '#ecfdf5', icon: Clock },
            { id: 'revision', label: 'Cần sửa báo giá', value: subRequests.filter(r => r.status === 'Customer_Revision').length, filterVal: 'Customer_Revision', color: '#ea580c', bg: '#fff7ed', icon: AlertCircle },
            { id: 'quoted', label: 'Đã gửi báo giá', value: subRequests.filter(r => r.status === 'Initial_Quoted').length, filterVal: 'Initial_Quoted', color: '#4f46e5', bg: '#e0e7ff', icon: Send },
            { id: 'accepted', label: 'Khách đã xác nhận', value: subRequests.filter(r => r.status === 'Initial_Accepted').length, filterVal: 'Initial_Accepted', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 }
        ],
        filterMatch: (req, filter) => {
            if (filter === 'Tất cả') return true;
            if (filter === 'Pending' || filter === 'Mới') return req.status === 'Pending' || req.status === 'Processing';
            if (filter === 'Customer_Revision') return req.status === 'Customer_Revision';
            if (filter === 'Initial_Quoted') return req.status === 'Initial_Quoted';
            if (filter === 'Initial_Accepted') return req.status === 'Initial_Accepted';
            if (filter === 'Canceled') return ['Canceled', 'Customer_Rejected'].includes(req.status);
            return req.status === filter;
        }
    },
    tour_requests_revision: {
        title: 'Chỉnh sửa thiết kế',
        subtitle: 'Kiểm tra, cập nhật và hoàn thiện các bản thiết kế tour cần chỉnh sửa theo yêu cầu',
        badgeSuffix: 'thiết kế cần sửa',
        defaultFilter: 'Tất cả thiết kế cần sửa',
        isApplicable: (req) => {
            // Chỉ hiển thị các thiết kế:
            // 1. Quản lý từ chối duyệt thiết kế để chỉnh sửa (Manager_Rejected)
            // 2. Thiết kế gửi cho khách hàng sau khi quản lý phê duyệt và khách yêu cầu chỉnh sửa (Customer_Revision và đã có thiết kế tour)
            // 3. Đang trong quá trình xử lý lại thiết kế có ghi chú yêu cầu sửa
            if (req.status === 'Manager_Rejected') return true;
            if (req.status === 'Customer_Revision' && hasTourDesign(req)) return true;
            if (req.status === 'Designing' && (req.manager_note || req.customer_note) && hasTourDesign(req)) return true;
            return false;
        },
        filterOptions: [
            { label: 'Tất cả thiết kế cần sửa', value: 'Tất cả thiết kế cần sửa' },
            { label: 'Quản lý yêu cầu sửa', value: 'Manager_Rejected' },
            { label: 'Khách hàng yêu cầu sửa', value: 'Customer_Revision' },
            { label: 'Đang xử lý lại thiết kế', value: 'Designing' }
        ],
        statColumns: 4,
        statCards: (subRequests) => [
            { id: 'all_rev', label: 'Tổng thiết kế cần sửa', value: subRequests.length, filterVal: 'Tất cả thiết kế cần sửa', color: '#dc2626', bg: '#fee2e2', icon: AlertTriangle },
            { id: 'mgr_rev', label: 'Quản lý yêu cầu sửa', value: subRequests.filter(r => r.status === 'Manager_Rejected').length, filterVal: 'Manager_Rejected', color: '#dc2626', bg: '#fee2e2', icon: AlertTriangle },
            { id: 'cust_rev', label: 'Khách yêu cầu sửa', value: subRequests.filter(r => r.status === 'Customer_Revision').length, filterVal: 'Customer_Revision', color: '#ea580c', bg: '#ffedd5', icon: AlertCircle },
            { id: 'designing', label: 'Đang xử lý lại', value: subRequests.filter(r => r.status === 'Designing').length, filterVal: 'Designing', color: '#d97706', bg: '#fef3c7', icon: Edit3 }
        ],
        filterMatch: (req, filter) => {
            if (filter === 'Tất cả thiết kế cần sửa' || filter === 'Tất cả') return true;
            if (filter === 'Customer_Revision') return req.status === 'Customer_Revision';
            if (filter === 'Manager_Rejected') return req.status === 'Manager_Rejected';
            if (filter === 'Designing') return req.status === 'Designing';
            return req.status === filter;
        }
    },
    tour_requests: {
        title: 'Thiết kế tour đã báo giá',
        subtitle: 'Hoàn thiện chương trình tour chi tiết và theo dõi tiến độ phê duyệt',
        badgeSuffix: 'hồ sơ thiết kế',
        defaultFilter: 'Tất cả',
        isApplicable: (req) => ['Initial_Accepted', 'Designing', 'Pending_Manager_Approval', 'Manager_Rejected', 'Manager_Approved', 'Sent_To_Customer', 'Customer_Accepted', 'Completed'].includes(req.status),
        filterOptions: [
            { label: 'Tất cả hồ sơ thiết kế', value: 'Tất cả' },
            { label: 'Chờ thiết kế (Khách đã chốt)', value: 'Initial_Accepted' },
            { label: 'Đang thiết kế', value: 'Designing' },
            { label: 'Chờ quản lý duyệt', value: 'Pending_Manager_Approval' },
            { label: 'Sếp yêu cầu sửa', value: 'Manager_Rejected' },
            { label: 'Đã duyệt – Chờ gửi khách', value: 'Manager_Approved' },
            { label: 'Đã gửi khách', value: 'Sent_To_Customer' },
            { label: 'Khách đã chốt / Hoàn tất', value: 'Customer_Accepted' }
        ],
        // 4 thẻ thống kê chuẩn ERP, vừa vặn 1 hàng trên màn hình 1366px & 1440px
        statColumns: 4,
        statCards: (subRequests) => [
            { id: 'all_dsg', label: 'Tổng hồ sơ', value: subRequests.length, filterVal: 'Tất cả', color: '#0194f3', bg: '#eff6ff', icon: Layers },
            { id: 'accepted', label: 'Chờ thiết kế', value: subRequests.filter(r => r.status === 'Initial_Accepted').length, filterVal: 'Initial_Accepted', color: '#059669', bg: '#ecfdf5', icon: Clock },
            { id: 'designing', label: 'Đang thiết kế', value: subRequests.filter(r => r.status === 'Designing').length, filterVal: 'Designing', color: '#d97706', bg: '#fef3c7', icon: Edit3 },
            { id: 'pending_mgr', label: 'Chờ sếp duyệt', value: subRequests.filter(r => r.status === 'Pending_Manager_Approval').length, filterVal: 'Pending_Manager_Approval', color: '#854d0e', bg: '#fef08a', icon: Clock }
        ],
        filterMatch: (req, filter) => {
            if (filter === 'Tất cả') return true;
            if (filter === 'Initial_Accepted') return req.status === 'Initial_Accepted';
            if (filter === 'Designing') return req.status === 'Designing';
            if (filter === 'Pending_Manager_Approval') return req.status === 'Pending_Manager_Approval';
            if (filter === 'Manager_Rejected') return req.status === 'Manager_Rejected';
            if (filter === 'Manager_Approved') return req.status === 'Manager_Approved';
            if (filter === 'Sent_To_Customer') return ['Manager_Approved', 'Sent_To_Customer'].includes(req.status);
            if (filter === 'Customer_Accepted') return ['Customer_Accepted', 'Completed'].includes(req.status);
            return req.status === filter;
        }
    }
};

const mapDefaultFilter = (val, cfg) => {
    if (!val) return cfg.defaultFilter;
    if (val === 'Mới') return 'Pending';
    if (cfg.filterOptions.some(o => o.value === val)) return val;
    return cfg.defaultFilter;
};

export const calculateTourTotalAmount = (req) => {
    if (!req) return { grandTotalRevenue: 0, totalPax: 1, prA: 0 };
    
    let prefs = {};
    try {
        prefs = typeof req.preferences === 'string'
            ? JSON.parse(req.preferences)
            : (req.preferences || (typeof req.requirements === 'string' ? JSON.parse(req.requirements || '{}') : req.requirements) || {});
    } catch(e) {
        prefs = {};
    }

    let parsedItinerary = {};
    try {
        const rawItin = req.proposed_itinerary || req.itinerary;
        parsedItinerary = typeof rawItin === 'string'
            ? JSON.parse(rawItin)
            : (rawItin || {});
    } catch(e){}

    const costConfig = parsedItinerary?.costConfig || {};

    const pA = prefs?.participantBreakdown?.adults || req.people_count || costConfig.minimumPax || 1;
    const pC = prefs?.participantBreakdown?.children || 0;
    const pT = prefs?.participantBreakdown?.toddlers || 0;
    const pI = prefs?.participantBreakdown?.infants || 0;

    const sC = costConfig.ageMultiplier?.child || { percent: 75, fixed_surcharge: 0 };
    const sT = costConfig.ageMultiplier?.toddler || { percent: 50, fixed_surcharge: 0 };
    const sI = costConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

    const prA = Number(req.quoted_price || req.quote_price || costConfig.manualSellingPrice || costConfig.calculatedSellingPrice || req.budget || 0);
    const prC = (prA * (sC.percent || 0) / 100) + Number(sC.fixed_surcharge || 0);
    const prT = (prA * (sT.percent || 0) / 100) + Number(sT.fixed_surcharge || 0);
    const prI = (prA * (sI.percent || 0) / 100) + Number(sI.fixed_surcharge || 0);

    const totalA = pA * prA;
    const totalC = pC * prC;
    const totalT = pT * prT;
    const totalI = pI * prI;
    const grandTotalRevenue = totalA + totalC + totalT + totalI;
    const totalPax = pA + pC + pT + pI;

    return { grandTotalRevenue, totalPax, prA };
};

const StaffTourRequestManager = ({ onStartDesign, defaultFilter, mode = 'tour_requests' }) => {
    const config = STAGE_CONFIGS[mode] || STAGE_CONFIGS.tour_requests;
    
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [tempMarkup, setTempMarkup] = useState(20);
    const [customPrice, setCustomPrice] = useState(null);
    const [manualGrandTotal, setManualGrandTotal] = useState(null);
    const [consultationNote, setConsultationNote] = useState('');
    const [mealPrices, setMealPrices] = useState({ breakfast: 200000, lunch: 200000, dinner: 200000 });
    const [guidePricePerDay, setGuidePricePerDay] = useState(500000);
    const [adjHotelCost, setAdjHotelCost] = useState(null);
    const [adjTransportCost, setAdjTransportCost] = useState(null);
    const [policyType, setPolicyType] = useState('Custom');
    const [childPolicy, setChildPolicy] = useState({
        child: { percent: 75, surcharge: 0 },
        toddler: { percent: 50, surcharge: 0 },
        infant: { percent: 0, surcharge: 0 }
    });

    // --- QUẢN LÝ PHƯƠNG ÁN BÁO GIÁ & ĐỐI SOÁT THAY ĐỔI SO VỚI YÊU CẦU GỐC ---
    const [originalPreferences, setOriginalPreferences] = useState(null);
    const [proposedPlan, setProposedPlan] = useState(null);
    const [catalog, setCatalog] = useState({ vehicles: [], accommodations: [], places: [] });
    const [isCatalogLoading, setIsCatalogLoading] = useState(false);
    
    // Modals
    const [activeModal, setActiveModal] = useState(null); // 'transport' | 'hotel' | 'places' | 'pickup' | 'reason' | null
    const [modalSearch, setModalSearch] = useState('');
    const [modalCategory, setModalCategory] = useState('All');
    const [reasonModalData, setReasonModalData] = useState(null);
    const [viewingDesignReq, setViewingDesignReq] = useState(null); // { title, targetKey, currentReason, onSave, suggestions: [] }
    const [pickupEditData, setPickupEditData] = useState({ location: '', time: '', reason: '' });

    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSubmittingManager, setIsSubmittingManager] = useState(false);
    
    // Search, Filter, Sort, View mode & Pagination states
    const [filterStatus, setFilterStatus] = useState(() => mapDefaultFilter(defaultFilter, config));
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Khi chuyển tab: đặt lại bộ lọc, tìm kiếm và phân trang riêng cho trang đó
    useEffect(() => {
        const targetDefault = mapDefaultFilter(defaultFilter, config);
        setFilterStatus(targetDefault);
        setSearchTerm('');
        setSortBy('latest');
        setCurrentPage(1);
        setSelectedReq(null);
    }, [mode, defaultFilter]);

    useEffect(() => {
        fetchRequests();
    }, [mode]);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/custom-tours/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setRequests(res.data.data);
        } catch (error) { 
            console.error('Lỗi tải dữ liệu', error); 
        }
    };

    const startDesignDirectly = async (req) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${req.request_id}/start-design`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (onStartDesign) {
                onStartDesign({
                    ...req,
                    markup_percent: req.markup_percent || 20,
                    staff_note: req.staff_note || '',
                    quote_price: req.quoted_price || 0,
                    base_cost: req.base_cost || 0
                });
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi vào phòng thiết kế!');
        }
    };

    const fetchDestinationCatalog = async (destName) => {
        if (!destName) return;
        setIsCatalogLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/custom-tours/services/${encodeURIComponent(destName)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let transports = [];
            let accommodations = [];
            let places = [];
            if (res.data && res.data.success && res.data.data) {
                transports = res.data.data.transport || res.data.data.transports || [];
                accommodations = res.data.data.accommodation || res.data.data.accommodations || [];
                places = res.data.data.sightseeing || res.data.data.places || [];
            }

            // Tải thêm danh sách đội xe từ fleet để đảm bảo nhân viên có đầy đủ dòng xe lựa chọn
            try {
                const fleetRes = await axios.get('http://localhost:5000/api/tours/fleet/public-vehicles');
                if (fleetRes.data?.success && Array.isArray(fleetRes.data.data)) {
                    const fleetList = fleetRes.data.data.map(fv => ({
                        service_id: `fleet_${fv.vehicle_id}`,
                        id: `fleet_${fv.vehicle_id}`,
                        service_name: `${fv.vehicle_name || fv.service_name || 'Xe du lịch'} (${fv.seat_capacity || 4} chỗ - ${fv.license_plate || 'Đội xe TravelVN'})`,
                        name: `${fv.vehicle_name || fv.service_name || 'Xe du lịch'} (${fv.seat_capacity || 4} chỗ)`,
                        capacity: fv.seat_capacity || 4,
                        base_cost: fv.base_cost || 0,
                        price: fv.price || fv.selling_price || fv.base_cost || 0,
                        selling_price: fv.selling_price || fv.price || 0,
                        description: `Biển số: ${fv.license_plate || 'Đang cập nhật'} • Đội xe TravelVN`,
                        isFleet: true
                    }));
                    const existingNames = new Set(transports.map(t => (t.service_name || t.name || '').toLowerCase()));
                    const newFleet = fleetList.filter(f => !existingNames.has((f.service_name || f.name).toLowerCase()));
                    transports = [...transports, ...newFleet];
                }
            } catch (fErr) {
                console.log('Lỗi khi tải đội xe TravelVN:', fErr);
            }

            setCatalog({
                vehicles: transports,
                accommodations,
                places
            });
        } catch (err) {
            console.error('Lỗi khi tải danh mục dịch vụ theo điểm đến:', err);
        } finally {
            setIsCatalogLoading(false);
        }
    };

    // Kiểm tra xem dòng xe được chọn có phù hợp với phân khúc / mong muốn của khách không
    const isVehicleMatchingCategory = (vehicle, origPrefs, pax = 1) => {
        if (!origPrefs) return true;
        const opt = origPrefs.transportOption;
        const cat = origPrefs.transportCategory;
        const origName = (origPrefs.transportName || origPrefs.transport || '').toLowerCase();

        if (origName.includes('tự túc')) return false;

        // Nếu khách chọn theo đề xuất công ty hoặc có yêu cầu riêng: bất kỳ xe công ty bố trí đều hợp lệ
        if (opt === 'company' || opt === 'custom' || origName.includes('đề xuất') || origName.includes('yêu cầu riêng')) {
            return true;
        }

        const vName = (vehicle.service_name || vehicle.name || '').toLowerCase();
        const vType = (vehicle.service_type || '').toLowerCase();

        const isLimo = vName.includes('limousine') || vName.includes('vip') || vName.includes('dcar') || vName.includes('skybus');
        const isFlight = vName.includes('máy bay') || vName.includes('flight') || vName.includes('hàng không') || vType.includes('máy bay') || vType.includes('flight');

        if (cat === 'limousine' || origName.includes('limousine')) {
            return isLimo;
        }
        if (cat === 'flight' || origName.includes('máy bay')) {
            return isFlight;
        }
        if (cat === 'standard' || origName.includes('tiêu chuẩn')) {
            return !isLimo && !isFlight;
        }

        return true;
    };

    // Chuẩn hóa tên khách sạn, loại bỏ lặp tên đối tác/khách sạn (ví dụ: "A - A - Phòng Standard" -> "A - Phòng Standard")
    const cleanHotelDisplayName = (name) => {
        if (!name || typeof name !== 'string') return '';
        let str = name.trim();
        const parts = str.split(' - ').map(p => p.trim());
        if (parts.length >= 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
            parts.shift();
            str = parts.join(' - ');
        }
        return str;
    };

    const handleSelect = (req) => {
        if (mode === 'tour_requests_revision') {
            startDesignDirectly(req);
            return;
        }
        if (mode === 'tour_requests') {
            if (['Initial_Accepted', 'Designing', 'Manager_Rejected'].includes(req.status)) {
                startDesignDirectly(req);
                return;
            }
            if (['Pending_Manager_Approval', 'Manager_Approved', 'Sent_To_Customer', 'Customer_Accepted', 'Completed'].includes(req.status)) {
                setViewingDesignReq(req);
                return;
            }
        }

        setSelectedReq(req);
        setTempMarkup(req.markup_percent || 20);
        setManualGrandTotal(null);
        setCustomPrice(null);
        setConsultationNote(req.staff_note || '');

        const orig = req.preferences || {};
        const cleanedOrig = {
            ...orig,
            hotelName: cleanHotelDisplayName(orig.hotelName || orig.hotel || '')
        };
        setOriginalPreferences(cleanedOrig);

        const durationDays = Math.round((new Date(req.return_date) - new Date(req.departure_date)) / (1000 * 60 * 60 * 24)) + 1;
        const nights = Math.max(0, durationDays - 1);
        const pax = req.people_count || 1;
        
        const defaultHotelCost = nights > 0 ? Math.round(((orig.hotelPrice || 0) * pax) / nights) : (orig.hotelPrice || 0);
        const defaultTransportCost = durationDays > 0 ? Math.round(((orig.transportPrice || 0) * pax) / durationDays) : (orig.transportPrice || 0);

        // Check if there is a previously saved proposal draft in itinerary
        let savedProposal = null;
        let savedChildPolicy = null;
        let savedPolicyType = 'Custom';

        try {
            const rawItin = req.proposed_itinerary || req.itinerary;
            if (rawItin) {
                const parsed = typeof rawItin === 'string' ? JSON.parse(rawItin) : rawItin;
                if (parsed) {
                    if (parsed.childPolicy) {
                        savedChildPolicy = parsed.childPolicy;
                    }
                    if (parsed.policyType) {
                        savedPolicyType = parsed.policyType;
                    }
                    if (parsed.proposedServices || parsed.transport) {
                        savedProposal = parsed.proposedServices || parsed;
                        if (!savedChildPolicy && savedProposal.childPolicy) {
                            savedChildPolicy = savedProposal.childPolicy;
                        }
                        if (savedProposal.policyType && savedPolicyType === 'Custom') {
                            savedPolicyType = savedProposal.policyType;
                        }
                    } else if (parsed.costConfig || parsed.days) {
                        // Tái tạo proposal từ costConfig và days của bản thiết kế tour đã gửi duyệt
                        const selectedT = parsed.costConfig?.selectedTransport;
                        const firstDayAcc = parsed.days?.find(d => d.accommodation)?.accommodation;
                        const tDisplayName = selectedT ? formatVehicleDisplayName(selectedT) : '';
                        const isTransportSelf = !selectedT || tDisplayName.toLowerCase().includes('tự túc');
                        const isAssigned = Boolean(selectedT && !isTransportSelf && !tDisplayName.includes('[Dự kiến'));
                        const tPrice = isTransportSelf ? 0 : (
                            selectedT?.base_cost 
                                ? Number(selectedT.base_cost) 
                                : (durationDays > 0 && parsed.costConfig?.fixed?.transport ? Math.round(Number(parsed.costConfig.fixed.transport) / durationDays) : defaultTransportCost)
                        );

                        savedProposal = {
                            transport: {
                                name: isTransportSelf ? 'Khách tự túc phương tiện di chuyển' : (isAssigned ? tDisplayName : (orig.transportName || orig.transport || 'Chưa chọn xe cụ thể')),
                                requestedSegment: orig.transportName || orig.transport || 'Theo đề xuất của công ty',
                                assignedVehicle: selectedT || null,
                                isAssigned: isAssigned || isTransportSelf,
                                pricePerDay: tPrice,
                                capacity: selectedT?.capacity || null,
                                isCustomized: isAssigned,
                                isSelfArranged: isTransportSelf,
                                reason: ''
                            },
                            hotel: {
                                name: firstDayAcc ? cleanHotelDisplayName(firstDayAcc.name) : cleanHotelDisplayName(orig.hotelName || ''),
                                pricePerNight: Number(firstDayAcc?.price || defaultHotelCost),
                                isAssigned: Boolean(firstDayAcc),
                                isCustomized: Boolean(firstDayAcc),
                                isSelfArranged: (orig.hotelName || '').toLowerCase().includes('tự túc'),
                                reason: ''
                            },
                            guide: {
                                pricePerDay: Number(parsed.costConfig?.fixed?.guidePerDay ?? 500000),
                                enabled: Number(parsed.costConfig?.fixed?.guidePerDay || 0) > 0
                            },
                            meal: {
                                enabled: true,
                                prices: {
                                    breakfast: Number(parsed.costConfig?.variable?.breakfast ?? 200000),
                                    lunch: Number(parsed.costConfig?.variable?.lunch ?? 200000),
                                    dinner: Number(parsed.costConfig?.variable?.dinner ?? 200000)
                                }
                            }
                        };
                    }
                }
            }
        } catch(e) {
            console.error('Error parsing saved proposal:', e);
        }

        if (savedProposal) {
            const savedTransport = savedProposal.transport || {};
            const isTransportSelf = (orig.transportName || orig.transport || '').toLowerCase().includes('tự túc') || Boolean(savedTransport.isSelfArranged);
            const isHotelSelf = (orig.hotelName || orig.hotel || '').toLowerCase().includes('tự túc') || Boolean(savedProposal.hotel?.isSelfArranged);
            const isAlreadyAssigned = Boolean(
                savedTransport.isAssigned || 
                savedTransport.assignedVehicle || 
                (savedTransport.name && savedTransport.name !== (orig.transportName || orig.transport) && !savedTransport.name.includes('[Dự kiến'))
            );

            const normalizedProposal = {
                ...savedProposal,
                transport: {
                    ...savedTransport,
                    name: savedTransport.name || (isTransportSelf ? 'Khách tự túc phương tiện di chuyển' : (orig.transportName || orig.transport || 'Chưa chọn phương tiện')),
                    requestedSegment: savedTransport.requestedSegment || orig.transportName || orig.transport || 'Theo đề xuất của công ty',
                    assignedVehicle: savedTransport.assignedVehicle || null,
                    isAssigned: isTransportSelf || isAlreadyAssigned,
                    pricePerDay: isTransportSelf ? 0 : (savedTransport.pricePerDay ?? defaultTransportCost),
                    isCustomized: savedTransport.isCustomized || false,
                    isSelfArranged: isTransportSelf,
                    reason: savedTransport.reason || ''
                },
                hotel: {
                    ...savedProposal.hotel,
                    name: cleanHotelDisplayName(savedProposal.hotel?.name || (isHotelSelf ? 'Khách tự túc chỗ ở' : (cleanedOrig.hotelName || 'Chưa chọn khách sạn'))),
                    pricePerNight: savedProposal.hotel?.pricePerNight ?? defaultHotelCost,
                    isCustomized: savedProposal.hotel?.isCustomized || false,
                    isSelfArranged: savedProposal.hotel?.isSelfArranged ?? isHotelSelf,
                    reason: savedProposal.hotel?.reason || ''
                }
            };

            setProposedPlan(normalizedProposal);
            setAdjHotelCost(normalizedProposal.hotel.pricePerNight);
            setAdjTransportCost(normalizedProposal.transport.pricePerDay);
            const isMealSelf = orig.meal ? (orig.meal.toLowerCase().includes('tự túc') || orig.meal.toLowerCase().includes('không')) : Boolean(savedProposal.meal?.enabled === false);
            const isGuideSelf = orig.guide ? (orig.guide.toLowerCase().includes('tự túc') || orig.guide.toLowerCase().includes('không')) : Boolean(savedProposal.guide?.enabled === false);

            if (isMealSelf) {
                setMealPrices({ breakfast: 0, lunch: 0, dinner: 0 });
            } else if (savedProposal.meal?.prices) {
                setMealPrices(savedProposal.meal.prices);
            } else {
                setMealPrices({ breakfast: 200000, lunch: 200000, dinner: 200000 });
            }

            if (isGuideSelf) {
                setGuidePricePerDay(0);
            } else {
                setGuidePricePerDay(savedProposal.guide?.pricePerDay ?? 500000);
            }
        } else {
            const isTransportSelf = (orig.transportName || orig.transport || '').toLowerCase().includes('tự túc');
            const isHotelSelf = (orig.hotelName || orig.hotel || '').toLowerCase().includes('tự túc');
            const isMealSelf = orig.meal ? (orig.meal.toLowerCase().includes('tự túc') || orig.meal.toLowerCase().includes('không')) : false;
            const isGuideSelf = orig.guide ? (orig.guide.toLowerCase().includes('tự túc') || orig.guide.toLowerCase().includes('không')) : false;

            const initialPlan = {
                pickup: {
                    location: orig.pickup_location || 'Tự túc điểm đón',
                    time: orig.departure_time || '',
                    isCustomized: false,
                    reason: ''
                },
                transport: {
                    name: isTransportSelf ? 'Khách tự túc phương tiện di chuyển' : (orig.transportName || orig.transport || 'Chưa chọn xe cụ thể'),
                    requestedSegment: orig.transportName || orig.transport || 'Theo đề xuất của công ty',
                    assignedVehicle: null,
                    isAssigned: isTransportSelf,
                    pricePerDay: isTransportSelf ? 0 : defaultTransportCost,
                    capacity: null,
                    isCustomized: false,
                    isSelfArranged: isTransportSelf,
                    reason: ''
                },
                hotel: {
                    name: isHotelSelf ? 'Khách tự túc chỗ ở' : (cleanedOrig.hotelName || 'Chưa chọn khách sạn'),
                    pricePerNight: defaultHotelCost,
                    isCustomized: false,
                    isSelfArranged: isHotelSelf,
                    reason: ''
                },
                meal: {
                    enabled: !isMealSelf,
                    name: orig.meal || (isMealSelf ? 'Khách tự túc ăn uống' : 'Trọn gói (Sáng, Trưa, Tối)'),
                    isCustomized: false,
                    prices: isMealSelf ? { breakfast: 0, lunch: 0, dinner: 0 } : { breakfast: 200000, lunch: 200000, dinner: 200000 },
                    reason: ''
                },
                guide: {
                    enabled: !isGuideSelf,
                    name: orig.guide || (isGuideSelf ? 'Khách tự túc' : 'Có hướng dẫn viên suốt tuyến'),
                    pricePerDay: isGuideSelf ? 0 : 500000,
                    isCustomized: false,
                    reason: ''
                },
                selectedPlaces: (orig.selectedPlaces || []).map((p, idx) => ({
                    place_id: p.place_id || idx + 1,
                    name: p.name,
                    price: Number(p.price) || 0,
                    category: p.category || 'Tham quan',
                    isAdded: false,
                    reason: ''
                })),
                removedPlaces: []
            };
            setProposedPlan(initialPlan);
            setAdjHotelCost(defaultHotelCost);
            setAdjTransportCost(defaultTransportCost);
            setMealPrices(isMealSelf ? { breakfast: 0, lunch: 0, dinner: 0 } : { breakfast: 200000, lunch: 200000, dinner: 200000 });
            setGuidePricePerDay(isGuideSelf ? 0 : 500000);
        }

        // Khôi phục chính sách giá trẻ em từ price_breakdown nếu itinerary chưa có
        if (!savedChildPolicy && req.price_breakdown) {
            try {
                const parsedBd = typeof req.price_breakdown === 'string' ? JSON.parse(req.price_breakdown) : req.price_breakdown;
                if (parsedBd?.childPolicy) {
                    savedChildPolicy = parsedBd.childPolicy;
                }
                if (parsedBd?.policyType) {
                    savedPolicyType = parsedBd.policyType;
                } else if (parsedBd?.adult && Number(parsedBd.adult) > 0) {
                    const adultP = Number(parsedBd.adult);
                    const childP = parsedBd.child !== undefined ? Math.round((Number(parsedBd.child) / adultP) * 100) : 75;
                    const toddlerP = parsedBd.toddler !== undefined ? Math.round((Number(parsedBd.toddler) / adultP) * 100) : 50;
                    const infantP = parsedBd.infant !== undefined ? Math.round((Number(parsedBd.infant) / adultP) * 100) : 0;
                    savedChildPolicy = {
                        child: { percent: childP, surcharge: 0 },
                        toddler: { percent: toddlerP, surcharge: 0 },
                        infant: { percent: infantP, surcharge: 0 }
                    };
                }
            } catch (e) {
                console.error('Error parsing price_breakdown:', e);
            }
        }

        // Cập nhật lại state childPolicy và policyType
        if (savedChildPolicy) {
            setChildPolicy({
                child: {
                    percent: savedChildPolicy.child?.percent !== undefined ? Number(savedChildPolicy.child.percent) : 75,
                    surcharge: savedChildPolicy.child?.surcharge !== undefined ? Number(savedChildPolicy.child.surcharge) : 0
                },
                toddler: {
                    percent: savedChildPolicy.toddler?.percent !== undefined ? Number(savedChildPolicy.toddler.percent) : 50,
                    surcharge: savedChildPolicy.toddler?.surcharge !== undefined ? Number(savedChildPolicy.toddler.surcharge) : 0
                },
                infant: {
                    percent: savedChildPolicy.infant?.percent !== undefined ? Number(savedChildPolicy.infant.percent) : 0,
                    surcharge: savedChildPolicy.infant?.surcharge !== undefined ? Number(savedChildPolicy.infant.surcharge) : 0
                }
            });
            setPolicyType(savedPolicyType || 'Custom');
        } else {
            setChildPolicy({
                child: { percent: 75, surcharge: 0 },
                toddler: { percent: 50, surcharge: 0 },
                infant: { percent: 0, surcharge: 0 }
            });
            setPolicyType('Custom');
        }

        // Tải danh mục dịch vụ theo điểm đến
        if (req.destination) {
            fetchDestinationCatalog(req.destination);
        }
    };

    const formatMoney = (amount) => {
        if (isNaN(amount) || amount === null || amount === undefined) return '0';
        return Number(amount).toLocaleString('vi-VN');
    };

    const durationDays = selectedReq ? Math.round((new Date(selectedReq.return_date) - new Date(selectedReq.departure_date)) / (1000 * 60 * 60 * 24)) + 1 : 0;
    const durationNights = Math.max(0, durationDays - 1);
    const totalPax = selectedReq ? selectedReq.people_count : 1;
    
    const autoBreakfastQty = durationNights;
    const autoLunchQty = durationDays;
    const autoDinnerQty = durationNights;
    
    // Dynamic cost calculation based on proposedPlan
    const isMealEnabled = proposedPlan ? proposedPlan.meal?.enabled : (selectedReq?.preferences?.meal && typeof selectedReq.preferences.meal === 'string' ? !selectedReq.preferences.meal.toLowerCase().includes('tự túc') : Boolean(selectedReq?.preferences?.meal));
    const isGuideEnabled = proposedPlan ? proposedPlan.guide?.enabled : (selectedReq?.preferences?.guide && typeof selectedReq.preferences.guide === 'string' ? !selectedReq.preferences.guide.toLowerCase().includes('tự túc') : Boolean(selectedReq?.preferences?.guide));
    const isHotelSelfArranged = proposedPlan ? proposedPlan.hotel?.isSelfArranged : false;
    const isTransportSelfArranged = proposedPlan ? proposedPlan.transport?.isSelfArranged : false;

    const currentPlaces = proposedPlan ? (proposedPlan.selectedPlaces || []) : (selectedReq?.preferences?.selectedPlaces || []);
    const totalPlacesCost = currentPlaces.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    const mealCostPerPerson = isMealEnabled ? (
        (Number(mealPrices.breakfast || 0) * autoBreakfastQty) + 
        (Number(mealPrices.lunch || 0) * autoLunchQty) + 
        (Number(mealPrices.dinner || 0) * autoDinnerQty)
    ) : 0;
    
    const guideCostPerPerson = (isGuideEnabled && totalPax > 0) ? (Number(guidePricePerDay || 0) * durationDays) / totalPax : 0;

    const totalHotelPerPerson = (!isHotelSelfArranged && totalPax > 0) ? ((adjHotelCost || 0) * durationNights) / totalPax : 0;
    const totalTransportPerPerson = (!isTransportSelfArranged && totalPax > 0) ? ((adjTransportCost || 0) * durationDays) / totalPax : 0;

    const totalCost = totalHotelPerPerson + totalTransportPerPerson + totalPlacesCost + mealCostPerPerson + guideCostPerPerson;

    const suggestedPrice = customPrice !== null ? customPrice : Math.round(totalCost * (1 + Number(tempMarkup) / 100));

    // --- PHÂN BỔ THÀNH VIÊN VÀ CHÍNH SÁCH ĐỘ TUỔI ---
    const numAdults = selectedReq?.preferences?.participantBreakdown?.adults || selectedReq?.people_count || 1;
    const numChildren = selectedReq?.preferences?.participantBreakdown?.children || 0;
    const numToddlers = selectedReq?.preferences?.participantBreakdown?.toddlers || 0;
    const numInfants = selectedReq?.preferences?.participantBreakdown?.infants || 0;
    const totalMembers = numAdults + numChildren + numToddlers + numInfants;

    const childPrice = Math.round(suggestedPrice * (childPolicy.child.percent / 100) + Number(childPolicy.child.surcharge));
    const toddlerPrice = Math.round(suggestedPrice * (childPolicy.toddler.percent / 100) + Number(childPolicy.toddler.surcharge));
    const infantPrice = Math.round(suggestedPrice * (childPolicy.infant.percent / 100) + Number(childPolicy.infant.surcharge));

    // Tổng giá bán báo khách cho toàn đoàn
    const calculatedGrandTotal = (numAdults * suggestedPrice) + (numChildren * childPrice) + (numToddlers * toddlerPrice) + (numInfants * infantPrice);
    const grandTotalPrice = manualGrandTotal !== null ? manualGrandTotal : calculatedGrandTotal;

    // --- ĐÁNH GIÁ NGÂN SÁCH ĐOÀN THEO CÔNG THỨC CHUẨN ---
    const customerBudgetPerPax = Number(selectedReq?.budget) || 0;
    const totalGroupBudget = customerBudgetPerPax * totalMembers;
    const isWithinBudget = totalGroupBudget > 0 ? (grandTotalPrice <= totalGroupBudget) : true;
    const groupBudgetRemaining = Math.max(0, totalGroupBudget - grandTotalPrice);
    const groupBudgetOver = Math.max(0, grandTotalPrice - totalGroupBudget);

    // --- TÍNH TOÁN DANH SÁCH THAY ĐỔI SO VỚI YÊU CẦU GỐC (BẮT BUỘC THEO GIAI ĐOẠN 4 & 5) ---
    const computedChanges = useMemo(() => {
        if (!selectedReq || !originalPreferences || !proposedPlan) return [];
        const list = [];

        // 1. Nhóm Đón khách
        if (proposedPlan.pickup?.isCustomized) {
            list.push({
                id: 'pickup',
                group: 'adjusted', // 'added' | 'replaced' | 'removed' | 'adjusted'
                category: 'Đón khách & Giờ khởi hành',
                original: `${originalPreferences.pickup_location || 'Tự túc'}${originalPreferences.departure_time ? ` (${originalPreferences.departure_time})` : ''}`,
                proposed: `${proposedPlan.pickup.location}${proposedPlan.pickup.time ? ` (${proposedPlan.pickup.time})` : ''}`,
                reason: proposedPlan.pickup.reason || 'Điều chỉnh điểm đón và thời gian khởi hành thuận tiện nhất cho lịch trình'
            });
        }

        // 2. Nhóm Phương tiện
        if (proposedPlan.transport?.isCustomized) {
            if (proposedPlan.transport.isSelfArranged) {
                list.push({
                    id: 'transport',
                    group: 'removed',
                    category: 'Phương tiện di chuyển',
                    original: originalPreferences.transportName || originalPreferences.transport || 'Xe đưa đón',
                    proposed: 'Khách tự túc phương tiện',
                    reason: proposedPlan.transport.reason || 'Khách tự túc phương tiện theo yêu cầu hoặc thỏa thuận'
                });
            } else {
                list.push({
                    id: 'transport',
                    group: 'replaced',
                    category: 'Phương tiện di chuyển',
                    original: originalPreferences.transportName || originalPreferences.transport || 'Chưa chọn',
                    proposed: proposedPlan.transport.name,
                    reason: proposedPlan.transport.reason || 'Thay đổi dòng xe phù hợp với quy mô đoàn khách để tối ưu chi phí'
                });
            }
        }

        // 3. Nhóm Lưu trú
        if (proposedPlan.hotel?.isCustomized) {
            if (proposedPlan.hotel.isSelfArranged) {
                list.push({
                    id: 'hotel',
                    group: 'removed',
                    category: 'Cơ sở lưu trú',
                    original: originalPreferences.hotelName || originalPreferences.hotel || 'Khách sạn',
                    proposed: 'Khách tự túc chỗ ở',
                    reason: proposedPlan.hotel.reason || 'Khách tự túc đặt phòng theo nhu cầu cá nhân'
                });
            } else {
                list.push({
                    id: 'hotel',
                    group: 'replaced',
                    category: 'Cơ sở lưu trú',
                    original: originalPreferences.hotelName || originalPreferences.hotel || 'Chưa chọn',
                    proposed: proposedPlan.hotel.name,
                    reason: proposedPlan.hotel.reason || 'Điều chỉnh khách sạn tương đương để cân đối ngân sách và nâng cao chất lượng'
                });
            }
        }

        // 4. Nhóm Ăn uống
        if (proposedPlan.meal?.isCustomized) {
            if (!proposedPlan.meal.enabled) {
                list.push({
                    id: 'meal',
                    group: 'removed',
                    category: 'Ăn uống',
                    original: originalPreferences.meal || 'Trọn gói',
                    proposed: 'Khách tự do ăn uống (Tự túc)',
                    reason: proposedPlan.meal.reason || 'Chuyển sang hình thức tự do trải nghiệm ẩm thực địa phương theo nhu cầu'
                });
            } else {
                list.push({
                    id: 'meal',
                    group: 'adjusted',
                    category: 'Ăn uống',
                    original: originalPreferences.meal || 'Trọn gói',
                    proposed: proposedPlan.meal.name,
                    reason: proposedPlan.meal.reason || 'Điều chỉnh thực đơn và định mức suất ăn phù hợp'
                });
            }
        }

        // 5. Nhóm Hướng dẫn viên
        if (proposedPlan.guide?.isCustomized) {
            if (!proposedPlan.guide.enabled) {
                list.push({
                    id: 'guide',
                    group: 'removed',
                    category: 'Hướng dẫn viên',
                    original: originalPreferences.guide || 'Có HDV',
                    proposed: 'Tour tự do (Không HDV)',
                    reason: proposedPlan.guide.reason || 'Lược bỏ HDV theo yêu cầu tour tự do trải nghiệm'
                });
            } else {
                list.push({
                    id: 'guide',
                    group: 'adjusted',
                    category: 'Hướng dẫn viên',
                    original: originalPreferences.guide || 'Có HDV',
                    proposed: proposedPlan.guide.name,
                    reason: proposedPlan.guide.reason || 'Điều chỉnh phạm vi phục vụ của HDV phù hợp lịch trình'
                });
            }
        }

        // 6. Nhóm Điểm tham quan: Thêm mới
        (proposedPlan.selectedPlaces || []).filter(p => p.isAdded).forEach(p => {
            list.push({
                id: `place_add_${p.place_id}`,
                group: 'added',
                category: 'Điểm tham quan',
                original: 'Chưa có trong yêu cầu ban đầu',
                proposed: `${p.name}${p.price > 0 ? ` (${formatMoney(p.price)}đ)` : ' (Miễn phí)'}`,
                reason: p.reason || 'Bổ sung điểm tham quan đặc sắc, thuận tiện theo cung đường hành trình'
            });
        });

        // 7. Nhóm Điểm tham quan: Lược bỏ
        (proposedPlan.removedPlaces || []).forEach(p => {
            list.push({
                id: `place_rem_${p.place_id}`,
                group: 'removed',
                category: 'Điểm tham quan',
                original: `${p.name}${p.price > 0 ? ` (${formatMoney(p.price)}đ)` : ''}`,
                proposed: 'Đã lược bỏ khỏi phương án',
                reason: p.reason || 'Tạm lược bỏ điểm tham quan có chi phí cao để cân đối ngân sách'
            });
        });

        return list;
    }, [selectedReq, originalPreferences, proposedPlan]);

    // --- GỢI Ý TỐI ƯU CHI PHÍ THỜI GIAN THỰC DỰA TRÊN DỮ LIỆU THẬT ---
    // QUY TẮC: CHỈ HIỂN THỊ KHI TỔNG GIÁ BÁO KHÁCH ĐOÀN > TỔNG NGÂN SÁCH ĐOÀN
    const budgetRecommendations = useMemo(() => {
        if (!selectedReq || totalGroupBudget <= 0 || isWithinBudget) return [];
        const recs = [];
        const pax = totalPax || 1;
        const days = durationDays || 1;
        const nights = durationNights || 1;

        // Tỷ lệ quy đổi giảm giá người lớn sang giảm giá toàn đoàn theo childPolicy hiện hành
        const calcGroupSavings = (savingPerAdultBase) => {
            const markupMultiplier = 1 + Number(tempMarkup) / 100;
            const deltaAdult = Math.round(savingPerAdultBase * markupMultiplier);
            const deltaChild = Math.round(deltaAdult * (childPolicy.child.percent / 100));
            const deltaToddler = Math.round(deltaAdult * (childPolicy.toddler.percent / 100));
            const deltaInfant = Math.round(deltaAdult * (childPolicy.infant.percent / 100));
            const totalGroupSavings = (numAdults * deltaAdult) + (numChildren * deltaChild) + (numToddlers * deltaToddler) + (numInfants * deltaInfant);
            return {
                deltaAdult,
                totalGroupSavings,
                newGrandTotal: Math.max(0, grandTotalPrice - totalGroupSavings)
            };
        };

        // 1. Gợi ý phương tiện: tìm xe có sẵn trong catalog đủ chỗ (capacity >= pax) nhưng rẻ hơn
        if (catalog.vehicles && catalog.vehicles.length > 0 && proposedPlan?.transport && !proposedPlan.transport.isSelfArranged) {
            const currentDaily = adjTransportCost || 0;
            const cheaperVehicles = catalog.vehicles.filter(v => {
                const sName = v.service_name || v.name || '';
                const capMatch = sName.match(/(\d+)\s*chỗ/i);
                const cap = v.capacity || (capMatch ? parseInt(capMatch[1], 10) : 4);
                const price = Number(v.base_cost) || Number(v.price) || Number(v.selling_price) || 0;
                return cap >= pax && price < currentDaily && sName !== proposedPlan.transport.name;
            }).sort((a, b) => (Number(a.base_cost) || Number(a.price) || 0) - (Number(b.base_cost) || Number(b.price) || 0));

            if (cheaperVehicles.length > 0) {
                const bestV = cheaperVehicles[0];
                const sName = bestV.service_name || bestV.name || 'Xe vận chuyển';
                const vPrice = Number(bestV.base_cost) || Number(bestV.price) || Number(bestV.selling_price) || 0;
                const savingPerAdultBase = ((currentDaily - vPrice) * days) / pax;
                const { deltaAdult, totalGroupSavings, newGrandTotal } = calcGroupSavings(savingPerAdultBase);

                if (totalGroupSavings > 0) {
                    recs.push({
                        type: 'transport',
                        title: 'Tối ưu dòng xe vận chuyển',
                        current: `${proposedPlan.transport.name} (${formatMoney(currentDaily)}đ/ngày)`,
                        proposed: `${sName} (${formatMoney(vPrice)}đ/ngày)`,
                        currentPrice: currentDaily,
                        proposedPrice: vPrice,
                        savingsPerPax: deltaAdult,
                        totalSavings: totalGroupSavings,
                        newGrandTotal,
                        explanation: `Đoàn có ${pax} khách, dòng xe ${sName} hoàn toàn đáp ứng đủ chỗ ngồi và hành lý với chi phí tối ưu hơn.`,
                        action: () => {
                            handleSelectVehicle(bestV, `Đổi sang dòng xe ${sName} phù hợp đoàn ${pax} khách để cân đối ngân sách đoàn`);
                        }
                    });
                }
            }
        }

        // 2. Gợi ý khách sạn: tìm KS trong catalog cùng điểm đến có giá tiết kiệm hơn
        if (catalog.accommodations && catalog.accommodations.length > 0 && proposedPlan?.hotel && !proposedPlan.hotel.isSelfArranged) {
            const currentNightly = adjHotelCost || 0;
            const cheaperHotels = catalog.accommodations.filter(h => {
                const sName = h.service_name || h.name || '';
                const price = Number(h.base_cost) || Number(h.price) || Number(h.selling_price) || 0;
                return price < currentNightly && sName !== proposedPlan.hotel.name;
            }).sort((a, b) => (Number(a.base_cost) || Number(a.price) || 0) - (Number(b.base_cost) || Number(b.price) || 0));

            if (cheaperHotels.length > 0) {
                const bestH = cheaperHotels[0];
                const sName = bestH.service_name || bestH.name || 'Khách sạn';
                const hPrice = Number(bestH.base_cost) || Number(bestH.price) || Number(bestH.selling_price) || 0;
                const savingPerAdultBase = ((currentNightly - hPrice) * nights) / pax;
                const { deltaAdult, totalGroupSavings, newGrandTotal } = calcGroupSavings(savingPerAdultBase);

                if (totalGroupSavings > 0) {
                    recs.push({
                        type: 'hotel',
                        title: 'Chọn cơ sở lưu trú tiết kiệm hơn',
                        current: `${proposedPlan.hotel.name} (${formatMoney(currentNightly)}đ/đêm)`,
                        proposed: `${sName} (${formatMoney(hPrice)}đ/đêm)`,
                        currentPrice: currentNightly,
                        proposedPrice: hPrice,
                        savingsPerPax: deltaAdult,
                        totalSavings: totalGroupSavings,
                        newGrandTotal,
                        explanation: 'Tiêu chuẩn lưu trú chất lượng cao, vị trí thuận tiện với mức giá hợp lý hơn cho đoàn.',
                        action: () => {
                            handleSelectHotel(bestH, `Thay thế sang ${sName} có mức giá hợp lý hơn để cân đối ngân sách đoàn`);
                        }
                    });
                }
            }
        }

        // 3. Gợi ý điểm tham quan: điều chỉnh điểm vé cao
        if (proposedPlan?.selectedPlaces && proposedPlan.selectedPlaces.length > 0) {
            const expensivePlaces = proposedPlan.selectedPlaces.filter(p => Number(p.price) >= 150000);
            if (expensivePlaces.length > 0) {
                const topExp = expensivePlaces[0];
                const savingPerAdultBase = Number(topExp.price);
                const { deltaAdult, totalGroupSavings, newGrandTotal } = calcGroupSavings(savingPerAdultBase);

                recs.push({
                    type: 'place',
                    title: 'Lược bỏ điểm vé cao',
                    current: `${topExp.name} (${formatMoney(topExp.price)}đ/vé)`,
                    proposed: 'Lược bỏ khỏi phương án tham quan',
                    currentPrice: Number(topExp.price),
                    proposedPrice: 0,
                    savingsPerPax: deltaAdult,
                    totalSavings: totalGroupSavings,
                    newGrandTotal,
                    explanation: 'Điểm tham quan này có giá vé chiếm tỷ trọng lớn, lược bớt sẽ giúp tổng chi phí đoàn đạt ngân sách.',
                    action: () => {
                        handleRemovePlace(topExp.place_id, `Tạm lược bỏ vé ${topExp.name} để cân đối ngân sách theo yêu cầu của đoàn`);
                    }
                });
            }
        }

        return recs;
    }, [selectedReq, isWithinBudget, totalGroupBudget, grandTotalPrice, totalCost, tempMarkup, childPolicy, numAdults, numChildren, numToddlers, numInfants, catalog, proposedPlan, adjTransportCost, adjHotelCost, totalPax, durationDays, durationNights]);

    const handleMarkupChange = (e) => {
        setTempMarkup(e.target.value);
        setManualGrandTotal(null);
        setCustomPrice(null);
    };

    const handlePriceChange = (val) => {
        const numericVal = Number(val);
        setCustomPrice(numericVal);
        setManualGrandTotal(null);
        if (totalCost > 0) {
            setTempMarkup((((numericVal / totalCost) - 1) * 100).toFixed(1));
        }
    };

    const handleGrandTotalChange = (val) => {
        const numericVal = Number(val);
        setManualGrandTotal(numericVal);
        
        const C_pct = childPolicy.child.percent / 100;
        const T_pct = childPolicy.toddler.percent / 100;
        const I_pct = childPolicy.infant.percent / 100;
        
        const C_sur = Number(childPolicy.child.surcharge);
        const T_sur = Number(childPolicy.toddler.surcharge);
        const I_sur = Number(childPolicy.infant.surcharge);
        
        const totalMultiplier = numAdults + (numChildren * C_pct) + (numToddlers * T_pct) + (numInfants * I_pct);
        const totalSurcharge = (numChildren * C_sur) + (numToddlers * T_sur) + (numInfants * I_sur);
        
        if (totalMultiplier > 0) {
            const newSuggestedPrice = Math.round((numericVal - totalSurcharge) / totalMultiplier);
            setCustomPrice(newSuggestedPrice);
            if (totalCost > 0) {
                setTempMarkup((((newSuggestedPrice / totalCost) - 1) * 100).toFixed(1));
            }
        }
    };

    const updatePolicy = (type, field, value) => {
        setPolicyType('Custom');
        setManualGrandTotal(null);
        setChildPolicy(prev => ({
            ...prev,
            [type]: { ...prev[type], [field]: Number(value) }
        }));
    };

    const handlePolicyTemplateChange = (e) => {
        setManualGrandTotal(null);
        const val = e.target.value;
        setPolicyType(val);
        if (val === 'Template1') {
            setChildPolicy({
                child: { percent: 50, surcharge: 0 },
                toddler: { percent: 0, surcharge: 0 },
                infant: { percent: 0, surcharge: 0 }
            });
        } else if (val === 'Template2') {
            setChildPolicy({
                child: { percent: 85, surcharge: 0 },
                toddler: { percent: 50, surcharge: 0 },
                infant: { percent: 0, surcharge: 0 }
            });
        }
    };

    // --- CÁC HÀM XỬ LÝ ĐIỀU CHỈNH DỊCH VỤ & LƯU LÝ DO THAY ĐỔI ---
    
    // Mở modal sửa lý do cho bất kỳ dịch vụ nào
    const openEditReasonModal = (title, currentReason, onSave, suggestions = []) => {
        setReasonModalData({
            title,
            currentReason: currentReason || '',
            onSave,
            suggestions: suggestions.length > 0 ? suggestions : [
                'Cân đối chi phí theo ngân sách của khách hàng',
                'Phù hợp với quy mô số lượng khách và lịch trình',
                'Tiêu chuẩn dịch vụ tương đương, đảm bảo chất lượng',
                'Bổ sung điểm tham quan đặc sắc theo cung đường',
                'Theo thỏa thuận trao đổi trực tiếp với khách'
            ]
        });
        setActiveModal('reason');
    };

    // Đón khách
    const handleSavePickup = (location, time, reason) => {
        if (!location || !location.trim()) {
            alert('⚠️ Vui lòng nhập địa điểm đón khách!');
            return;
        }
        setProposedPlan(prev => ({
            ...prev,
            pickup: {
                location: location || prev.pickup.location,
                time: time || prev.pickup.time,
                isCustomized: true,
                reason: reason || 'Điều chỉnh điểm đón và giờ khởi hành thuận tiện'
            }
        }));
        setActiveModal(null);
    };

    const handleResetPickup = () => {
        setProposedPlan(prev => ({
            ...prev,
            pickup: {
                location: originalPreferences?.pickup_location || 'Tự túc điểm đón',
                time: originalPreferences?.departure_time || '',
                isCustomized: false,
                reason: ''
            }
        }));
    };

    // Phương tiện
    const handleSelectVehicle = (v, defaultReason = '') => {
        const vName = v.service_name || v.name || 'Xe vận chuyển';
        const price = Number(v.base_cost) || Number(v.price) || Number(v.selling_price) || 0;
        const capMatch = vName.match(/(\d+)\s*chỗ/i);
        const capacity = v.capacity || (capMatch ? parseInt(capMatch[1], 10) : null);
        
        // Kiểm tra xem xe này có thuộc đúng phân khúc khách yêu cầu không
        const isMatch = isVehicleMatchingCategory(v, originalPreferences, totalPax);
        const isCustomized = !isMatch;
        const reason = isCustomized 
            ? (defaultReason || `Điều chỉnh sang dòng xe ${vName} phù hợp đoàn ${totalPax} khách để tối ưu chi phí`)
            : '';

        setProposedPlan(prev => ({
            ...prev,
            transport: {
                ...prev.transport,
                name: vName,
                requestedSegment: prev.transport?.requestedSegment || originalPreferences?.transportName || originalPreferences?.transport || 'Theo đề xuất của công ty',
                pricePerDay: price,
                capacity,
                assignedVehicle: v,
                isAssigned: true,
                isCustomized,
                isSelfArranged: false,
                reason
            }
        }));
        setAdjTransportCost(price);
        setActiveModal(null);
    };

    const handleToggleTransportSelf = () => {
        setProposedPlan(prev => {
            const nextSelf = !prev.transport?.isSelfArranged;
            if (nextSelf) {
                setAdjTransportCost(0);
            } else {
                const origCost = durationDays > 0 ? Math.round(((originalPreferences?.transportPrice || 0) * totalPax) / durationDays) : (originalPreferences?.transportPrice || 0);
                setAdjTransportCost(origCost);
            }
            return {
                ...prev,
                transport: {
                    ...prev.transport,
                    isSelfArranged: nextSelf,
                    isCustomized: true,
                    reason: nextSelf ? 'Khách chủ động tự túc phương tiện di chuyển' : 'Khôi phục dịch vụ xe theo đoàn'
                }
            };
        });
    };

    const handleResetTransport = () => {
        const origName = originalPreferences?.transportName || originalPreferences?.transport || 'Chưa chọn';
        const isSelf = origName.toLowerCase().includes('tự túc');
        setProposedPlan(prev => ({
            ...prev,
            transport: {
                name: isSelf ? 'Khách tự túc phương tiện di chuyển' : origName,
                requestedSegment: origName,
                assignedVehicle: null,
                isAssigned: isSelf,
                pricePerDay: 0,
                capacity: null,
                isCustomized: false,
                isSelfArranged: isSelf,
                reason: ''
            }
        }));
        setAdjTransportCost(0);
    };

    // Khách sạn
    const handleSelectHotel = (h, defaultReason = '') => {
        const rawName = h.service_name || h.name || 'Khách sạn';
        const hName = cleanHotelDisplayName(rawName);
        const price = Number(h.base_cost) || Number(h.price) || Number(h.selling_price) || 0;
        const reason = defaultReason || `Thay thế sang ${hName} có mức giá hợp lý hơn để cân đối ngân sách`;
        setProposedPlan(prev => ({
            ...prev,
            hotel: {
                name: hName,
                pricePerNight: price,
                isCustomized: true,
                isSelfArranged: false,
                reason
            }
        }));
        setAdjHotelCost(price);
        setActiveModal(null);
    };

    const handleToggleHotelSelf = () => {
        setProposedPlan(prev => {
            const nextSelf = !prev.hotel?.isSelfArranged;
            if (nextSelf) {
                setAdjHotelCost(0);
            } else {
                const origCost = durationNights > 0 ? Math.round(((originalPreferences?.hotelPrice || 0) * totalPax) / durationNights) : (originalPreferences?.hotelPrice || 0);
                setAdjHotelCost(origCost);
            }
            return {
                ...prev,
                hotel: {
                    ...prev.hotel,
                    isSelfArranged: nextSelf,
                    isCustomized: true,
                    reason: nextSelf ? 'Khách chủ động tự túc đặt phòng lưu trú' : 'Khôi phục cơ sở lưu trú theo đoàn'
                }
            };
        });
    };

    const handleResetHotel = () => {
        const origName = cleanHotelDisplayName(originalPreferences?.hotelName || originalPreferences?.hotel || 'Chưa chọn');
        const origCost = durationNights > 0 ? Math.round(((originalPreferences?.hotelPrice || 0) * totalPax) / durationNights) : (originalPreferences?.hotelPrice || 0);
        const isSelf = origName.toLowerCase().includes('tự túc');
        setProposedPlan(prev => ({
            ...prev,
            hotel: {
                name: origName,
                pricePerNight: isSelf ? 0 : origCost,
                isCustomized: false,
                isSelfArranged: isSelf,
                reason: ''
            }
        }));
        setAdjHotelCost(isSelf ? 0 : origCost);
    };

    // Ăn uống
    const handleToggleMeal = () => {
        setProposedPlan(prev => ({
            ...prev,
            meal: {
                ...prev.meal,
                enabled: !prev.meal?.enabled,
                isCustomized: true,
                reason: !prev.meal?.enabled ? 'Bật gói ăn uống trọn gói' : 'Chuyển sang hình thức tự do trải nghiệm ẩm thực địa phương theo nhu cầu'
            }
        }));
    };

    const handleResetMeal = () => {
        const isSelf = originalPreferences?.meal ? (originalPreferences.meal.toLowerCase().includes('tự túc') || originalPreferences.meal.toLowerCase().includes('không')) : false;
        setProposedPlan(prev => ({
            ...prev,
            meal: {
                enabled: !isSelf,
                name: originalPreferences?.meal || (isSelf ? 'Khách tự túc ăn uống' : 'Trọn gói (Sáng, Trưa, Tối)'),
                isCustomized: false,
                prices: isSelf ? { breakfast: 0, lunch: 0, dinner: 0 } : { breakfast: 200000, lunch: 200000, dinner: 200000 },
                reason: ''
            }
        }));
        setMealPrices(isSelf ? { breakfast: 0, lunch: 0, dinner: 0 } : { breakfast: 200000, lunch: 200000, dinner: 200000 });
    };

    // Hướng dẫn viên
    const handleToggleGuide = () => {
        setProposedPlan(prev => ({
            ...prev,
            guide: {
                ...prev.guide,
                enabled: !prev.guide?.enabled,
                isCustomized: true,
                reason: !prev.guide?.enabled ? 'Bổ sung hướng dẫn viên theo đoàn' : 'Lược bỏ HDV theo yêu cầu tour tự do trải nghiệm'
            }
        }));
    };

    const handleResetGuide = () => {
        const isSelf = originalPreferences?.guide ? (originalPreferences.guide.toLowerCase().includes('tự túc') || originalPreferences.guide.toLowerCase().includes('không')) : false;
        setProposedPlan(prev => ({
            ...prev,
            guide: {
                enabled: !isSelf,
                name: originalPreferences?.guide || (isSelf ? 'Khách tự túc' : 'Có hướng dẫn viên suốt tuyến'),
                pricePerDay: isSelf ? 0 : 500000,
                isCustomized: false,
                reason: ''
            }
        }));
        setGuidePricePerDay(isSelf ? 0 : 500000);
    };

    // Điểm tham quan
    const handleRemovePlace = (placeId, defaultReason = '') => {
        setProposedPlan(prev => {
            const target = prev.selectedPlaces.find(p => p.place_id === placeId);
            if (!target) return prev;
            const isOriginal = (originalPreferences?.selectedPlaces || []).some(p => p.place_id === placeId || p.name === target.name);
            const reason = defaultReason || 'Tạm lược bỏ điểm tham quan có chi phí cao để cân đối ngân sách';
            return {
                ...prev,
                selectedPlaces: prev.selectedPlaces.filter(p => p.place_id !== placeId),
                removedPlaces: isOriginal && !prev.removedPlaces.some(p => p.place_id === placeId)
                    ? [...prev.removedPlaces, { ...target, reason }]
                    : prev.removedPlaces
            };
        });
    };

    const handleRestorePlace = (place) => {
        setProposedPlan(prev => ({
            ...prev,
            removedPlaces: prev.removedPlaces.filter(p => p.place_id !== place.place_id),
            selectedPlaces: [...prev.selectedPlaces, { ...place, isAdded: false, reason: '' }]
        }));
    };

    const handleAddPlace = (place, defaultReason = '') => {
        setProposedPlan(prev => {
            if (prev.selectedPlaces.some(p => p.place_id === place.place_id || p.name === place.name)) return prev;
            const reason = defaultReason || 'Bổ sung điểm tham quan đặc sắc phù hợp hành trình';
            return {
                ...prev,
                selectedPlaces: [...prev.selectedPlaces, {
                    place_id: place.place_id,
                    name: place.name,
                    price: Number(place.ticket_price) || 0,
                    category: place.category,
                    isAdded: true,
                    reason
                }]
            };
        });
        setActiveModal(null);
    };

    const handleResetPlaces = () => {
        setProposedPlan(prev => ({
            ...prev,
            selectedPlaces: (originalPreferences?.selectedPlaces || []).map((p, idx) => ({
                place_id: p.place_id || idx + 1,
                name: p.name,
                price: Number(p.price) || 0,
                category: p.category || 'Tham quan',
                isAdded: false,
                reason: ''
            })),
            removedPlaces: []
        }));
    };

    // Khôi phục toàn bộ yêu cầu gốc ban đầu
    const handleResetAllToOriginal = () => {
        if (!originalPreferences) return;
        if (!window.confirm('Khôi phục toàn bộ các phương án dịch vụ về yêu cầu gốc ban đầu của khách hàng?')) return;
        handleResetPickup();
        handleResetTransport();
        handleResetHotel();
        handleResetMeal();
        handleResetGuide();
        handleResetPlaces();
    };

    // Lưu bản nháp
    const handleSaveDraft = async () => {
        if (!selectedReq) return;
        setIsSavingDraft(true);
        try {
            const token = localStorage.getItem('token');
            const breakdown = {
                adult: suggestedPrice,
                child: childPrice,
                toddler: toddlerPrice,
                infant: infantPrice,
                childPolicy,
                policyType
            };
            const payload = {
                quote_price: grandTotalPrice,
                base_cost: totalCost,
                markup_percent: Number(tempMarkup),
                note: consultationNote,
                price_breakdown: JSON.stringify(breakdown),
                proposed_plan: {
                    proposedServices: proposedPlan,
                    changes: computedChanges,
                    adjHotelCost,
                    adjTransportCost,
                    mealPrices,
                    guidePricePerDay,
                    childPolicy,
                    policyType,
                    timestamp: new Date().toISOString()
                },
                is_draft: true
            };
            await axios.post(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/initial-quote`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('💾 Đã lưu bản nháp phương án báo giá thành công!');
            fetchRequests();
        } catch (error) {
            console.error('Lỗi khi lưu nháp:', error);
            alert('Lỗi lưu bản nháp: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSavingDraft(false);
        }
    };

    // Trình quản lý duyệt
    const handleSubmitToManager = async () => {
        if (!selectedReq) return;
        if (!window.confirm('Bạn có chắc chắn muốn trình phương án báo giá này lên Quản lý duyệt?')) return;
        setIsSubmittingManager(true);
        try {
            const token = localStorage.getItem('token');
            const breakdown = {
                adult: suggestedPrice,
                child: childPrice,
                toddler: toddlerPrice,
                infant: infantPrice
            };
            const payload = {
                quote_price: grandTotalPrice,
                base_cost: totalCost,
                markup_percent: Number(tempMarkup),
                note: consultationNote,
                price_breakdown: JSON.stringify(breakdown),
                proposed_plan: {
                    proposedServices: proposedPlan,
                    changes: computedChanges,
                    adjHotelCost,
                    adjTransportCost,
                    mealPrices,
                    guidePricePerDay,
                    childPolicy,
                    timestamp: new Date().toISOString()
                },
                send_to_manager: true
            };
            await axios.post(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/initial-quote`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('📋 Đã gửi phương án báo giá lên Quản lý duyệt thành công!');
            fetchRequests();
            setSelectedReq(null);
        } catch (error) {
            console.error('Lỗi gửi duyệt quản lý:', error);
            alert('Lỗi khi gửi quản lý duyệt: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmittingManager(false);
        }
    };

    // Gửi báo giá cho khách
    const handleSendInitialQuote = async () => {
        if (!selectedReq) return;

        // --- RÀNG BUỘC DỮ LIỆU BÁO GIÁ ---
        if (!suggestedPrice || Number(suggestedPrice) <= 0 || isNaN(Number(suggestedPrice))) {
            alert('⚠️ Giá báo khách (người lớn) phải lớn hơn 0 đ!');
            return;
        }
        if (!grandTotalPrice || Number(grandTotalPrice) <= 0 || isNaN(Number(grandTotalPrice))) {
            alert('⚠️ Tổng giá báo khách của cả đoàn phải lớn hơn 0 đ!');
            return;
        }
        if (Number(suggestedPrice) < Number(totalCost)) {
            const confirmLoss = window.confirm(
                '⚠️ CẢNH BÁO LỢI NHUẬN ÂM / DƯỚI GIÁ VỐN:\n\n' +
                '• Giá báo khách: ' + formatMoney(suggestedPrice) + ' đ/người\n' +
                '• Chi phí vốn gốc: ' + formatMoney(totalCost) + ' đ/người\n\n' +
                'Giá báo khách đang THẤP HƠN chi phí gốc. Bạn có chắc chắn muốn gửi phương án báo giá này cho khách hàng không?'
            );
            if (!confirmLoss) return;
        }
        const cPct = Number(childPolicy?.child?.percent || 0);
        const tPct = Number(childPolicy?.toddler?.percent || 0);
        const iPct = Number(childPolicy?.infant?.percent || 0);
        if (cPct < 0 || cPct > 100 || tPct < 0 || tPct > 100 || iPct < 0 || iPct > 100) {
            alert('⚠️ Tỷ lệ % giá người lớn cho trẻ em / trẻ nhỏ / em bé phải nằm trong khoảng từ 0% đến 100%!');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const breakdown = {
                adult: suggestedPrice,
                child: childPrice,
                toddler: toddlerPrice,
                infant: infantPrice
            };
            const payload = {
                quote_price: grandTotalPrice,
                base_cost: totalCost,
                markup_percent: Number(tempMarkup),
                note: consultationNote,
                price_breakdown: JSON.stringify(breakdown),
                proposed_plan: {
                    proposedServices: proposedPlan,
                    changes: computedChanges,
                    adjHotelCost,
                    adjTransportCost,
                    mealPrices,
                    guidePricePerDay,
                    childPolicy,
                    timestamp: new Date().toISOString()
                }
            };
            
            await axios.post(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/initial-quote`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Đã gửi báo giá sơ bộ kèm bảng giải thích thay đổi cho khách hàng!');
            fetchRequests();
            setSelectedReq(null);
        } catch (error) {
            console.error(error);
            alert('Lỗi gửi báo giá sơ bộ!');
        }
    };

    const handleStartDesign = async () => {
        if (!selectedReq) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/start-design`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (onStartDesign) {
                const latestProposal = {
                    ...(typeof selectedReq.proposed_itinerary === 'string' ? (JSON.parse(selectedReq.proposed_itinerary || '{}')) : (selectedReq.proposed_itinerary || {})),
                    proposedServices: proposedPlan,
                    adjHotelCost,
                    adjTransportCost,
                    guidePricePerDay,
                    mealPrices,
                    childPolicy
                };
                onStartDesign({
                    ...selectedReq,
                    markup_percent: tempMarkup,
                    staff_note: consultationNote,
                    quote_price: suggestedPrice,
                    base_cost: totalCost,
                    proposed_itinerary: latestProposal
                });
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi vào phòng thiết kế!');
        }
    };

    const handleSendToCustomer = async (targetReq = null) => {
        const reqToSend = targetReq || selectedReq || viewingDesignReq;
        if (!reqToSend) return;

        const quoteId = reqToSend.quote_id;
        if (!quoteId) {
            alert('Không tìm thấy ID báo giá để gửi khách!');
            return;
        }

        const tourTitle = reqToSend.destination || 'tour';
        const reqCode = reqToSend.request_id || reqToSend.id || '';
        if (!window.confirm(`Xác nhận gửi bản thiết kế ${tourTitle} (#REQ-${reqCode}) cho khách hàng?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/custom-tours/quotes/${quoteId}/send-to-customer`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('🎉 Đã gửi bản thiết kế cho khách hàng thành công!');
            if (viewingDesignReq) setViewingDesignReq(null);
            if (selectedReq) setSelectedReq(null);
            await fetchRequests();
        } catch (error) {
            console.error('Lỗi khi gửi cho khách:', error);
            alert('Có lỗi xảy ra khi gửi cho khách hàng: ' + (error.response?.data?.message || error.message));
        }
    };

    const getStatusUI = (req) => {
        switch (req.status) {
            case 'Pending': 
                return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', text: 'CHỜ BÁO GIÁ' };
            case 'Initial_Quoted': 
                return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', text: 'ĐÃ GỬI BÁO GIÁ' };
            case 'Initial_Accepted': 
                return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', text: 'KHÁCH ĐÃ CHỐT' };
            case 'Designing': 
                return { bg: '#fffbeb', color: '#d97706', border: '#fde68a', text: 'ĐANG THIẾT KẾ' };
            case 'Pending_Manager_Approval': 
                return { bg: '#fefce8', color: '#854d0e', border: '#fef08a', text: 'CHỜ SẾP DUYỆT' };
            case 'Manager_Rejected': 
                return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', text: 'SẾP BẮT SỬA' };
            case 'Manager_Approved': 
                return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', text: 'SẾP ĐÃ DUYỆT' };
            case 'Sent_To_Customer': 
                return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', text: 'ĐÃ GỬI KHÁCH' };
            case 'Customer_Revision': 
                return { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3', text: 'KHÁCH YÊU CẦU SỬA' };
            case 'Customer_Accepted': 
                return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', text: 'ĐÃ CHỐT TOUR' };
            case 'Completed': 
                return { bg: '#ecfdf5', color: '#15803d', border: '#86efac', text: 'HOÀN TẤT' };
            case 'Canceled': 
                return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', text: 'ĐÃ HỦY' };
            default: 
                return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', text: req.status || 'CHƯA RÕ' };
        }
    };

    const getRouteDisplay = (req) => {
        let pickup = '';
        try {
            const r = typeof req.requirements === 'string' ? JSON.parse(req.requirements) : (req.requirements || {});
            pickup = r.pickup_location || '';
        } catch(e) {}
        if (pickup && pickup !== 'Tự túc' && pickup.toLowerCase() !== (req.destination || '').toLowerCase()) {
            return { pickup, destination: req.destination };
        }
        return { pickup: null, destination: req.destination || 'Chưa chọn điểm đến' };
    };

    const getDurationText = (depDate, retDate) => {
        if (!depDate || !retDate) return null;
        const diff = Math.round((new Date(retDate) - new Date(depDate)) / (1000 * 60 * 60 * 24)) + 1;
        if (diff <= 1) return 'Trong ngày';
        return `${diff}N${Math.max(0, diff - 1)}Đ`;
    };

    // 1. Phân vùng dữ liệu đúng phạm vi của chức năng hiện tại
    const stageRequests = useMemo(() => {
        return requests.filter(config.isApplicable);
    }, [requests, config]);

    // 2. Thẻ thống kê riêng biệt cho chức năng hiện tại
    const statCardsList = useMemo(() => {
        return config.statCards(stageRequests);
    }, [config, stageRequests]);

    // 3. Lọc dữ liệu theo bộ lọc trạng thái và ô tìm kiếm
    const filteredRequests = useMemo(() => {
        return stageRequests.filter(req => {
            if (!config.filterMatch(req, filterStatus)) return false;

            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase().trim();
                const idStr = String(req.request_id || req.id || '');
                const name = (req.customer_name || '').toLowerCase();
                const phone = (req.customer_phone || '').toLowerCase();
                const dest = (req.destination || '').toLowerCase();
                let pickup = '';
                try {
                    const r = typeof req.requirements === 'string' ? JSON.parse(req.requirements) : (req.requirements || {});
                    pickup = (r.pickup_location || '').toLowerCase();
                } catch(e) {}
                
                const matchId = idStr.includes(term) || `req-${idStr}`.includes(term) || `#req-${idStr}`.includes(term) || `#${idStr}`.includes(term);
                const matchName = name.includes(term);
                const matchPhone = phone.includes(term);
                const matchDest = dest.includes(term) || pickup.includes(term);

                if (!matchId && !matchName && !matchPhone && !matchDest) return false;
            }

            return true;
        });
    }, [stageRequests, config, filterStatus, searchTerm]);

    // 4. Sắp xếp
    const sortedRequests = useMemo(() => {
        return [...filteredRequests].sort((a, b) => {
            if (sortBy === 'latest') {
                return new Date(b.created_at || b.departure_date || 0) - new Date(a.created_at || a.departure_date || 0);
            }
            if (sortBy === 'oldest') {
                return new Date(a.created_at || a.departure_date || 0) - new Date(b.created_at || b.departure_date || 0);
            }
            if (sortBy === 'departure_date') {
                return new Date(a.departure_date || 0) - new Date(b.departure_date || 0);
            }
            if (sortBy === 'budget_desc') {
                return (Number(b.quoted_price || b.budget) || 0) - (Number(a.quoted_price || a.budget) || 0);
            }
            if (sortBy === 'budget_asc') {
                return (Number(a.quoted_price || a.budget) || 0) - (Number(b.quoted_price || b.budget) || 0);
            }
            if (sortBy === 'pax_desc') {
                return (Number(b.people_count) || 0) - (Number(a.people_count) || 0);
            }
            return 0;
        });
    }, [filteredRequests, sortBy]);

    // 5. Phân trang
    const totalCount = sortedRequests.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const paginatedRequests = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedRequests.slice(start, start + pageSize);
    }, [sortedRequests, currentPage, pageSize]);

    const handleResetFilter = () => {
        setSearchTerm('');
        setFilterStatus(config.defaultFilter);
        setSortBy('latest');
        setCurrentPage(1);
    };

    return (
        <div className="request-manager-container" style={{ padding: '0 0 32px 0', minHeight: 'calc(100vh - 85px)', boxSizing: 'border-box' }}>
            {!selectedReq ? (
                /* MASTER VIEW */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '100%' }}>
                    
                    {/* 1. HEADER SECTION (PHÂN CẤP CHỮ CHUẨN ERP: 26-28px bold) */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        backgroundColor: '#ffffff',
                        padding: '18px 24px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                                    {config.title}
                                </h1>
                                <span style={{
                                    backgroundColor: '#eff6ff',
                                    color: '#0284c7',
                                    border: '1px solid #bae6fd',
                                    padding: '3px 10px',
                                    borderRadius: '16px',
                                    fontSize: '13px',
                                    fontWeight: '700'
                                }}>
                                    {stageRequests.length} {config.badgeSuffix}
                                </span>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0', fontWeight: '400' }}>
                                {config.subtitle}
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                color: '#475569',
                                fontSize: '13px',
                                fontWeight: '600'
                            }}>
                                <Info size={15} color="#0284c7" />
                                <span>Phân hệ: <strong style={{ color: '#0f172a' }}>{mode === 'tour_requests_pending' ? 'Báo giá sơ bộ' : mode === 'tour_requests_revision' ? 'Chỉnh sửa thiết kế' : 'Thiết kế tour'}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* 2. STAT CARDS (ĐỒNG BỘ 1 HÀNG, KHÔNG RỚT THẺ, CHỮ 26-28px BOLD) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${config.statColumns || 4}, 1fr)`,
                        gap: '14px'
                    }}>
                        {statCardsList.map(card => {
                            const CardIcon = card.icon;
                            const isActive = filterStatus === card.filterVal;

                            return (
                                <div
                                    key={card.id}
                                    onClick={() => {
                                        setFilterStatus(card.filterVal);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '10px',
                                        border: isActive ? `2px solid ${card.color}` : '1px solid #e2e8f0',
                                        padding: '14px 18px',
                                        cursor: 'pointer',
                                        boxShadow: isActive ? `0 4px 12px ${card.color}25` : '0 1px 3px rgba(0,0,0,0.02)',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        minHeight: '76px',
                                        boxSizing: 'border-box'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isActive) e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isActive) e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3px',
                                            marginBottom: '3px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }} title={card.label}>
                                            {card.label}
                                        </div>
                                        <div style={{ fontSize: '26px', fontWeight: '800', color: card.color, lineHeight: '1.2' }}>
                                            {card.value}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        backgroundColor: card.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: card.color,
                                        flexShrink: 0,
                                        marginLeft: '8px'
                                    }}>
                                        <CardIcon size={20} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 3. THANH CÔNG CỤ TÌM KIẾM, BỘ LỌC VÀ CHUYỂN CHẾ ĐỘ XEM (CHIỀU CAO 40px CHUẨN ERP) */}
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        padding: '14px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                        }}>
                            {/* Ô tìm kiếm */}
                            <div style={{
                                position: 'relative',
                                flex: '1 1 260px',
                                minWidth: '220px',
                                height: '40px'
                            }}>
                                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                <input
                                    type="text"
                                    placeholder="Tìm theo mã yêu cầu (#REQ-1), khách hàng, SĐT, tuyến điểm..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        width: '100%',
                                        height: '40px',
                                        padding: '0 32px 0 38px',
                                        borderRadius: '7px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '14px',
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
                                            right: '10px',
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
                                        title="Xóa tìm kiếm"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Bộ lọc trạng thái: Với tour_requests, lọc trực tiếp qua 5 thẻ thống kê phía trên để tránh trùng lặp */}
                            {mode !== 'tour_requests' ? (
                                <div style={{ minWidth: '200px', height: '40px' }}>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                        style={{
                                            width: '100%',
                                            height: '40px',
                                            padding: '0 12px',
                                            borderRadius: '7px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '14px',
                                            backgroundColor: '#ffffff',
                                            color: '#0f172a',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {config.filterOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                filterStatus !== 'Tất cả' && (
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '0 12px',
                                        height: '40px',
                                        borderRadius: '7px',
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        color: '#1d4ed8',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                    }}>
                                        <span>Đang lọc: <strong>{statCardsList.find(c => c.filterVal === filterStatus)?.label || filterStatus}</strong></span>
                                        <button
                                            onClick={() => { setFilterStatus('Tất cả'); setCurrentPage(1); }}
                                            style={{
                                                background: '#dbeafe',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#1d4ed8',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '2px',
                                                borderRadius: '50%',
                                                width: '18px',
                                                height: '18px'
                                            }}
                                            title="Bỏ lọc, xem tất cả"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )
                            )}

                            {/* Dropdown sắp xếp */}
                            <div style={{ minWidth: '180px', height: '40px' }}>
                                <select
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        width: '100%',
                                        height: '40px',
                                        padding: '0 12px',
                                        borderRadius: '7px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '14px',
                                        backgroundColor: '#ffffff',
                                        color: '#0f172a',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="latest">Ngày tạo mới nhất</option>
                                    <option value="oldest">Ngày tạo cũ nhất</option>
                                    <option value="departure_date">Ngày khởi hành gần nhất</option>
                                    <option value="budget_desc">Ngân sách / Giá cao → thấp</option>
                                    <option value="budget_asc">Ngân sách / Giá thấp → cao</option>
                                    <option value="pax_desc">Số lượng khách nhiều nhất</option>
                                </select>
                            </div>

                            {/* Nút Reset */}
                            <button
                                onClick={handleResetFilter}
                                style={{
                                    height: '40px',
                                    padding: '0 14px',
                                    borderRadius: '7px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#ffffff',
                                    color: '#475569',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                title="Đặt lại bộ lọc trang hiện tại"
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                            >
                                <RotateCcw size={15} />
                                <span>Đặt lại</span>
                            </button>

                            {/* Toggle xem Bảng / Lưới */}
                            <div style={{
                                display: 'inline-flex',
                                borderRadius: '7px',
                                border: '1px solid #cbd5e1',
                                overflow: 'hidden',
                                height: '40px',
                                marginLeft: 'auto'
                            }}>
                                <button
                                    onClick={() => setViewMode('table')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '100%',
                                        border: 'none',
                                        backgroundColor: viewMode === 'table' ? '#0194f3' : '#ffffff',
                                        color: viewMode === 'table' ? '#ffffff' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    title="Xem dạng Bảng ERP"
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '100%',
                                        border: 'none',
                                        borderLeft: '1px solid #cbd5e1',
                                        backgroundColor: viewMode === 'grid' ? '#0194f3' : '#ffffff',
                                        color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                                        cursor: 'pointer'
                                    }}
                                    title="Xem dạng Lưới Thẻ"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Dòng kết quả tìm kiếm */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13.5px',
                            color: '#475569',
                            borderTop: '1px solid #f1f5f9',
                            paddingTop: '10px'
                        }}>
                            <div>
                                Tìm thấy <strong style={{ color: '#0f172a' }}>{totalCount}</strong> {config.badgeSuffix}
                                {searchTerm && <span> khớp với từ khóa "<strong style={{ color: '#0194f3' }}>{searchTerm}</strong>"</span>}
                                {filterStatus !== 'Tất cả' && filterStatus !== 'Tất cả cần sửa' && (
                                    <span> • Đang lọc: <strong style={{ color: '#0f172a' }}>{config.filterOptions.find(o => o.value === filterStatus)?.label || filterStatus}</strong></span>
                                )}
                            </div>
                            <div>
                                Trang {currentPage} / {totalPages}
                            </div>
                        </div>
                    </div>

                    {/* 4. DATA PRESENTATION */}
                    {totalCount === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px dashed #cbd5e1'
                        }}>
                            <div style={{ fontSize: '44px', marginBottom: '12px' }}>📭</div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '16px', fontWeight: '700' }}>
                                {mode === 'tour_requests_pending' ? 'Không có yêu cầu báo giá nào phù hợp với bộ lọc.' :
                                 mode === 'tour_requests_revision' ? 'Hiện không có bản thiết kế nào cần chỉnh sửa.' :
                                 'Không có hồ sơ thiết kế nào phù hợp với bộ lọc.'}
                            </h3>
                            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
                                Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc để xem các hồ sơ khác.
                            </p>
                            <button
                                onClick={handleResetFilter}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    backgroundColor: '#0194f3',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Đặt lại bộ lọc
                            </button>
                        </div>
) : viewMode === 'table' ? (
                        /* BẢNG DỮ LIỆU ERP: TYPOGRAPHY ĐỒNG NHẤT CHUẨN ERP (14-15px CHÍNH, 13px PHỤ, 12px TRẠNG THÁI, 13px NÚT BẤM) */
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            width: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box'
                        }}>
                            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <table style={{
                                    width: '100%',
                                    minWidth: 0,
                                    borderCollapse: 'collapse',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    tableLayout: 'fixed'
                                }}>
                                    {/* Cấu hình cột theo đúng tỷ lệ chuẩn ERP: 11% - 17% - 24% - 11% - 13% - 13% - 11% = 100% */}
                                    {mode === 'tour_requests' ? (
                                        <colgroup>
                                            <col style={{ width: '10%' }} />  {/* Hồ sơ */}
                                            <col style={{ width: '17%' }} />  {/* Khách hàng */}
                                            <col style={{ width: '22%' }} />  {/* Hành trình */}
                                            <col style={{ width: '10%' }} />  {/* Khởi hành */}
                                            <col style={{ width: '13%' }} />  {/* Giá/khách */}
                                            <col style={{ width: '13%' }} />  {/* Trạng thái (Rộng rãi, không bị đè) */}
                                            <col style={{ width: '15%' }} />  {/* Thao tác (Rộng 15%, nút 32px nằm hoàn toàn bên trong) */}
                                        </colgroup>
                                    ) : mode === 'tour_requests_revision' ? (
                                        <colgroup>
                                            <col style={{ width: '10%' }} />  {/* Hồ sơ */}
                                            <col style={{ width: '17%' }} />  {/* Khách hàng */}
                                            <col style={{ width: '17%' }} />  {/* Hành trình */}
                                            <col style={{ width: '10%' }} />  {/* Khởi hành */}
                                            <col style={{ width: '18%' }} />  {/* Nội dung cần sửa */}
                                            <col style={{ width: '13%' }} />  {/* Trạng thái */}
                                            <col style={{ width: '15%' }} />  {/* Thao tác */}
                                        </colgroup>
                                    ) : (
                                        <colgroup>
                                            <col style={{ width: '9%' }} />   {/* Hồ sơ */}
                                            <col style={{ width: '16%' }} />  {/* Khách hàng */}
                                            <col style={{ width: '17%' }} />  {/* Hành trình */}
                                            <col style={{ width: '9%' }} />   {/* Khởi hành */}
                                            <col style={{ width: '8%' }} />   {/* Số khách */}
                                            <col style={{ width: '12%' }} />  {/* Ngân sách */}
                                            <col style={{ width: '14%' }} />  {/* Trạng thái (Rộng rãi 14%, tách biệt rõ ràng) */}
                                            <col style={{ width: '15%' }} />  {/* Thao tác (Rộng 15%, không dính vào trạng thái) */}
                                        </colgroup>
                                    )}

                                    <thead>
                                        <tr style={{
                                            backgroundColor: '#f8fafc',
                                            borderBottom: '1px solid #e2e8f0',
                                            color: '#475569',
                                            fontWeight: '700',
                                            fontSize: '13px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.4px',
                                            height: '44px'
                                        }}>
                                            <th style={{ padding: '0 10px 0 14px', whiteSpace: 'nowrap' }}>Hồ sơ</th>
                                            <th style={{ padding: '0 10px', whiteSpace: 'nowrap' }}>Khách hàng</th>
                                            <th style={{ padding: '0 10px', whiteSpace: 'nowrap' }}>Hành trình</th>
                                            <th style={{ padding: '0 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>Khởi hành</th>
                                            {mode === 'tour_requests' ? (
                                                <th style={{ padding: '0 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>Tổng giá tour</th>
                                            ) : mode === 'tour_requests_revision' ? (
                                                <th style={{ padding: '0 10px', whiteSpace: 'nowrap' }}>Nội dung cần chỉnh sửa</th>
                                            ) : (
                                                <>
                                                    <th style={{ padding: '0 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>Số khách</th>
                                                    <th style={{ padding: '0 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>Ngân sách</th>
                                                </>
                                            )}
                                            <th style={{ padding: '0 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>Trạng thái</th>
                                            <th style={{ padding: '0 14px 0 6px', textAlign: 'center', whiteSpace: 'nowrap' }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRequests.map((req, idx) => {
                                            const statusUI = getStatusUI(req);
                                            const routeInfo = getRouteDisplay(req);
                                            const duration = getDurationText(req.departure_date, req.return_date);
                                            const revisionNote = req.status === 'Manager_Rejected' ? req.manager_note : (req.customer_note || req.manager_note);

                                            return (
                                                <tr
                                                    key={req.request_id || idx}
                                                    onClick={() => handleSelect(req)}
                                                    style={{
                                                        borderBottom: '1px solid #f1f5f9',
                                                        backgroundColor: '#ffffff',
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.15s ease'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                                >
                                                    {/* 1. HỒ SƠ: Mã YC (14px Bold Monospace) & Ngày tạo (13px) */}
                                                    <td style={{ padding: '12px 10px 12px 14px', verticalAlign: 'middle' }}>
                                                        <div style={{
                                                            fontWeight: '800',
                                                            color: '#0284c7',
                                                            fontSize: '14px',
                                                            fontFamily: 'monospace',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            #REQ-{req.request_id}
                                                        </div>
                                                        {req.created_at && (
                                                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px', whiteSpace: 'nowrap' }}>
                                                                {new Date(req.created_at).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* 2. KHÁCH HÀNG: Họ tên (15px Bold) & SĐT (13px) */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                                            <div style={{
                                                                fontWeight: '700',
                                                                color: '#0f172a',
                                                                fontSize: '15px',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }} title={req.customer_name}>
                                                                {req.customer_name || 'Khách vãng lai'}
                                                            </div>
                                                            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                                                                <Phone size={13} />
                                                                <span>{req.customer_phone || 'Chưa cập nhật SĐT'}</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 3. HÀNH TRÌNH: Điểm đến (15px Bold) & Thời lượng / Điểm đón (13px) */}
                                                    <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                                        <div style={{
                                                            fontWeight: '700',
                                                            color: '#1e293b',
                                                            fontSize: '15px',
                                                            lineHeight: '1.4',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }} title={routeInfo.destination}>
                                                            {routeInfo.destination}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                            {duration && (
                                                                <span style={{ color: '#0284c7', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                                    {duration}
                                                                </span>
                                                            )}
                                                            {routeInfo.pickup && (
                                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={`Đón: ${routeInfo.pickup}`}>
                                                                    • Đón: {routeInfo.pickup}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* 4. KHỞI HÀNH: Ngày bắt đầu (14px Bold Căn giữa) */}
                                                    <td style={{ padding: '12px 6px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                                            {new Date(req.departure_date).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </td>

                                                    {/* 5. CỘT ĐẶC THÙ THEO TỪNG CHỨC NĂNG */}
                                                    {mode === 'tour_requests' ? (
                                                        (() => {
                                                            const { grandTotalRevenue, totalPax, prA } = calculateTourTotalAmount(req);
                                                            return (
                                                                /* TỔNG GIÁ TOUR: Toàn đoàn thực tế (15.5px Bold Xanh) */
                                                                <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'right' }}>
                                                                    <div style={{ fontWeight: '800', color: '#059669', fontSize: '15.5px', whiteSpace: 'nowrap' }}>
                                                                        {formatMoney(grandTotalRevenue)} đ
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap' }} title={`Đơn giá: ${formatMoney(prA)} đ/khách`}>
                                                                        {totalPax > 1 ? `Toàn đoàn (${totalPax} khách)` : '1 khách'}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })()
                                                    ) : mode === 'tour_requests_revision' ? (
                                                        /* NỘI DUNG CẦN CHỈNH SỬA CHO REVISION (13px rõ ràng) */
                                                        <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                                                            <div style={{
                                                                backgroundColor: '#fef2f2',
                                                                border: '1px solid #fecaca',
                                                                borderRadius: '6px',
                                                                padding: '7px 10px',
                                                                color: '#991b1b',
                                                                fontSize: '13px',
                                                                lineHeight: '1.45'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: '#b91c1c', marginBottom: '3px' }}>
                                                                    <AlertTriangle size={13} />
                                                                    <span>{req.status === 'Manager_Rejected' ? 'Quản lý yêu cầu sửa:' : 'Khách yêu cầu sửa:'}</span>
                                                                </div>
                                                                <div style={{
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden'
                                                                }} title={revisionNote}>
                                                                    {revisionNote || 'Yêu cầu kiểm tra và hoàn thiện lại thiết kế'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    ) : (
                                                        /* SỐ KHÁCH VÀ NGÂN SÁCH CHO PENDING (14px & 15.5px) */
                                                        <>
                                                            <td style={{ padding: '12px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', fontSize: '14px' }}>
                                                                    <Users size={14} color="#64748b" />
                                                                    <span>{req.people_count || 1} khách</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'right' }}>
                                                                <div style={{ fontWeight: '800', color: '#059669', fontSize: '15.5px', whiteSpace: 'nowrap' }}>
                                                                    {formatMoney(req.budget)} đ
                                                                </div>
                                                                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>/ người</div>
                                                            </td>
                                                        </>
                                                    )}

                                                    {/* 6. TRẠNG THÁI: 12px Bold, padding 4px 10px bo góc 6px, Rộng 13% không bao giờ bị đè */}
                                                    <td style={{ padding: '12px 6px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            backgroundColor: statusUI.bg,
                                                            color: statusUI.color,
                                                            border: `1px solid ${statusUI.border}`,
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {statusUI.text}
                                                        </span>
                                                    </td>

                                                    {/* 7. THAO TÁC: Rộng 15%, đệm phải 14px, nút nằm hoàn toàn bên trong ô không bao giờ tràn viền */}
                                                    <td style={{ padding: '12px 14px 12px 6px', verticalAlign: 'middle', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {mode === 'tour_requests' ? (
                                                                req.status === 'Initial_Accepted' ? (
                                                                    <button
                                                                        onClick={() => startDesignDirectly(req)}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            backgroundColor: '#0194f3',
                                                                            color: '#ffffff',
                                                                            fontSize: '13px',
                                                                            fontWeight: '700',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap',
                                                                            boxShadow: '0 1px 2px rgba(1, 148, 243, 0.2)'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0194f3'}
                                                                        title="Bắt đầu thiết kế chương trình tour chi tiết"
                                                                    >
                                                                        <Edit3 size={13} />
                                                                        <span>Thiết kế</span>
                                                                    </button>
                                                                ) : req.status === 'Designing' ? (
                                                                    <button
                                                                        onClick={() => startDesignDirectly(req)}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            backgroundColor: '#d97706',
                                                                            color: '#ffffff',
                                                                            fontSize: '13px',
                                                                            fontWeight: '700',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap',
                                                                            boxShadow: '0 1px 2px rgba(217, 119, 6, 0.2)'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b45309'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                                                                        title="Tiếp tục chỉnh sửa bản thiết kế"
                                                                    >
                                                                        <Edit3 size={13} />
                                                                        <span>Tiếp tục sửa</span>
                                                                    </button>
                                                                ) : req.status === 'Manager_Rejected' ? (
                                                                    <button
                                                                        onClick={() => startDesignDirectly(req)}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            backgroundColor: '#dc2626',
                                                                            color: '#ffffff',
                                                                            fontSize: '13px',
                                                                            fontWeight: '700',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap',
                                                                            boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                                                        title="Sửa lại theo yêu cầu của cấp quản lý"
                                                                    >
                                                                        <AlertTriangle size={13} />
                                                                        <span>Sửa lại</span>
                                                                    </button>
                                                                ) : req.status === 'Manager_Approved' ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSendToCustomer(req);
                                                                        }}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            backgroundColor: '#16a34a',
                                                                            color: '#ffffff',
                                                                            fontSize: '13px',
                                                                            fontWeight: '700',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap',
                                                                            boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                                                                        title="Gửi bản thiết kế đã duyệt cho khách hàng"
                                                                    >
                                                                        <Send size={13} />
                                                                        <span>Gửi khách</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            if (mode === 'tour_requests' && ['Pending_Manager_Approval', 'Manager_Approved', 'Sent_To_Customer', 'Customer_Accepted', 'Completed'].includes(req.status)) {
                                                                                setViewingDesignReq(req);
                                                                            } else {
                                                                                handleSelect(req);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #cbd5e1',
                                                                            backgroundColor: '#ffffff',
                                                                            color: '#334155',
                                                                            fontSize: '13px',
                                                                            fontWeight: '600',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                                                        title={mode === 'tour_requests' && req.status === 'Pending_Manager_Approval' ? "Xem chi tiết bản thiết kế tour đã gửi duyệt" : "Xem chi tiết toàn bộ hồ sơ"}
                                                                    >
                                                                        <Eye size={13} />
                                                                        <span>{mode === 'tour_requests' && req.status === 'Pending_Manager_Approval' ? 'Xem bản thiết kế' : 'Chi tiết'}</span>
                                                                    </button>
                                                                )
                                                            ) : mode === 'tour_requests_revision' ? (
                                                                <button
                                                                    onClick={() => startDesignDirectly(req)}
                                                                    style={{
                                                                        height: '32px',
                                                                        padding: '0 12px',
                                                                        borderRadius: '6px',
                                                                        border: 'none',
                                                                        backgroundColor: '#dc2626',
                                                                        color: '#ffffff',
                                                                        fontSize: '13px',
                                                                        fontWeight: '700',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '5px',
                                                                        whiteSpace: 'nowrap'
                                                                    }}
                                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                                                                    title="Mở phòng thiết kế để chỉnh sửa tour"
                                                                >
                                                                    <Edit3 size={13} />
                                                                    <span>Sửa ngay</span>
                                                                </button>
                                                            ) : (
                                                                req.status === 'Pending' ? (
                                                                    <button
                                                                        onClick={() => handleSelect(req)}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            backgroundColor: '#0194f3',
                                                                            color: '#ffffff',
                                                                            fontSize: '13px',
                                                                            fontWeight: '700',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap',
                                                                            boxShadow: '0 1px 2px rgba(1, 148, 243, 0.2)'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0194f3'}
                                                                    >
                                                                        <DollarSign size={13} />
                                                                        <span>Báo giá</span>
                                                                    </button>
                                                                ) : req.status === 'Customer_Revision' ? (
                                                                    <button
                                                                        onClick={() => handleSelect(req)}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            backgroundColor: '#ea580c',
                                                                            color: '#ffffff',
                                                                            fontSize: '13px',
                                                                            fontWeight: '700',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap',
                                                                            boxShadow: '0 1px 2px rgba(234, 88, 12, 0.2)'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c2410c'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                                                                        title="Khách yêu cầu điều chỉnh báo giá. Bấm để sửa và gửi lại báo giá"
                                                                    >
                                                                        <Edit3 size={13} />
                                                                        <span>Sửa báo giá</span>
                                                                    </button>
                                                                ) : req.status === 'Initial_Accepted' ? (
                                                                    <button
                                                                        onClick={() => startDesignDirectly(req)}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: 'none',
                                                                            backgroundColor: '#16a34a',
                                                                            color: '#ffffff',
                                                                            fontSize: '13px',
                                                                            fontWeight: '700',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                                                                    >
                                                                        <Edit3 size={13} />
                                                                        <span>Thiết kế</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleSelect(req)}
                                                                        style={{
                                                                            height: '32px',
                                                                            padding: '0 10px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #cbd5e1',
                                                                            backgroundColor: '#ffffff',
                                                                            color: '#334155',
                                                                            fontSize: '13px',
                                                                            fontWeight: '600',
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                                                    >
                                                                        <Eye size={13} />
                                                                        <span>Chi tiết</span>
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* CHẾ ĐỘ XEM LƯỚI THẺ */
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '16px'
                        }}>
                            {paginatedRequests.map((req, idx) => {
                                const statusUI = getStatusUI(req);
                                const routeInfo = getRouteDisplay(req);
                                const duration = getDurationText(req.departure_date, req.return_date);
                                const revisionNote = req.status === 'Manager_Rejected' ? req.manager_note : (req.customer_note || req.manager_note);

                                return (
                                    <div
                                        key={req.request_id || idx}
                                        onClick={() => handleSelect(req)}
                                        style={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.borderColor = '#0194f3';
                                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(1, 148, 243, 0.09)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: '13px',
                                                fontWeight: '800',
                                                color: '#0284c7',
                                                fontFamily: 'monospace'
                                            }}>
                                                #REQ-{req.request_id}
                                            </span>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                backgroundColor: statusUI.bg,
                                                color: statusUI.color,
                                                border: `1px solid ${statusUI.border}`
                                            }}>
                                                {statusUI.text}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                backgroundColor: statusUI.bg,
                                                color: statusUI.color,
                                                border: `1px solid ${statusUI.border}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '700',
                                                fontSize: '14px',
                                                flexShrink: 0
                                            }}>
                                                {(req.customer_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {req.customer_name || 'Khách vãng lai'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                    {req.customer_phone || 'Chưa cập nhật SĐT'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '8px',
                                            padding: '10px 12px',
                                            border: '1px solid #f1f5f9',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '5px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>
                                                <MapPin size={14} color="#0284c7" />
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{routeInfo.destination}</span>
                                                {duration && <span style={{ color: '#0284c7', fontSize: '12px' }}>({duration})</span>}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} />
                                                    {new Date(req.departure_date).toLocaleDateString('vi-VN')}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#334155' }}>
                                                    <Users size={12} />
                                                    {req.people_count || 1} khách
                                                </span>
                                            </div>
                                        </div>

                                        {(mode === 'tour_requests_revision' || (mode === 'tour_requests_pending' && req.status === 'Customer_Revision')) && revisionNote ? (
                                            <div style={{
                                                backgroundColor: '#fee2e2',
                                                border: '1px solid #fecaca',
                                                borderRadius: '6px',
                                                padding: '8px 10px',
                                                fontSize: '12px',
                                                color: '#991b1b'
                                            }}>
                                                <strong style={{ display: 'block', color: '#b91c1c', marginBottom: '2px' }}>
                                                    {req.status === 'Manager_Rejected' ? '⚠️ Sếp yêu cầu sửa:' : '⚠️ Khách yêu cầu sửa:'}
                                                </strong>
                                                <span style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {revisionNote}
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                    {mode === 'tour_requests' ? 'Giá tour:' : 'Ngân sách:'}
                                                </span>
                                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#059669' }}>
                                                    {formatMoney(mode === 'tour_requests' ? calculateTourTotalAmount(req).grandTotalRevenue : req.budget)} đ
                                                </span>
                                            </div>
                                        )}

                                        <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }} onClick={(e) => e.stopPropagation()}>
                                            {mode === 'tour_requests_pending' ? (
                                                req.status === 'Pending' ? (
                                                    <button
                                                        onClick={() => handleSelect(req)}
                                                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: 'none', backgroundColor: '#0194f3', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                    >
                                                        <DollarSign size={14} />
                                                        <span>Lập báo giá sơ bộ</span>
                                                    </button>
                                                ) : req.status === 'Customer_Revision' ? (
                                                    <button
                                                        onClick={() => handleSelect(req)}
                                                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: 'none', backgroundColor: '#ea580c', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                    >
                                                        <Edit3 size={14} />
                                                        <span>Sửa lại báo giá</span>
                                                    </button>
                                                ) : req.status === 'Initial_Accepted' ? (
                                                    <button
                                                        onClick={() => startDesignDirectly(req)}
                                                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                    >
                                                        <Edit3 size={14} />
                                                        <span>Vào phòng thiết kế</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSelect(req)}
                                                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                    >
                                                        <Eye size={14} />
                                                        <span>Xem chi tiết hồ sơ</span>
                                                    </button>
                                                )
                                            ) : mode === 'tour_requests_revision' ? (
                                                <button
                                                    onClick={() => startDesignDirectly(req)}
                                                    style={{ width: '100%', height: '32px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                >
                                                    <Edit3 size={14} />
                                                    <span>Chỉnh sửa thiết kế</span>
                                                </button>
                                            ) : (
                                                ['Initial_Accepted', 'Designing'].includes(req.status) ? (
                                                    <button
                                                        onClick={() => startDesignDirectly(req)}
                                                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                    >
                                                        <Edit3 size={14} />
                                                        <span>{req.status === 'Designing' ? 'Tiếp tục thiết kế' : 'Vào thiết kế'}</span>
                                                    </button>
                                                ) : req.status === 'Manager_Approved' ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSendToCustomer(req);
                                                        }}
                                                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                        title="Gửi bản thiết kế đã duyệt cho khách hàng"
                                                    >
                                                        <Send size={14} />
                                                        <span>Gửi bản thiết kế cho khách</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSelect(req)}
                                                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                                    >
                                                        <Eye size={14} />
                                                        <span>Xem chi tiết hồ sơ</span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 5. PHÂN TRANG CHUẨN ERP */}
                    {totalCount > 0 && (
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            padding: '12px 18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                                <span>Hiển thị</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        backgroundColor: '#ffffff',
                                        color: '#0f172a',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={48}>48</option>
                                </select>
                                <span>trong tổng số <strong style={{ color: '#0f172a' }}>{totalCount}</strong> {config.badgeSuffix}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor: '#ffffff',
                                        color: currentPage === 1 ? '#cbd5e1' : '#334155',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                    title="Trang trước"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                                    .map((p, index, array) => {
                                        const prev = array[index - 1];
                                        const showEllipsis = prev && p - prev > 1;

                                        return (
                                            <React.Fragment key={p}>
                                                {showEllipsis && (
                                                    <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
                                                )}
                                                <button
                                                    onClick={() => setCurrentPage(p)}
                                                    style={{
                                                        minWidth: '32px',
                                                        height: '32px',
                                                        padding: '0 8px',
                                                        borderRadius: '6px',
                                                        border: currentPage === p ? 'none' : '1px solid #cbd5e1',
                                                        backgroundColor: currentPage === p ? '#0194f3' : '#ffffff',
                                                        color: currentPage === p ? '#ffffff' : '#334155',
                                                        fontSize: '13px',
                                                        fontWeight: currentPage === p ? '700' : '500',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {p}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        backgroundColor: '#ffffff',
                                        color: currentPage === totalPages ? '#cbd5e1' : '#334155',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                    title="Trang sau"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* DETAIL VIEW: BẢO TOÀN NGUYÊN VẸN 100% */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="detail-view-card" style={{ flex: 1, overflowY: 'auto', marginBottom: 0, borderRadius: '20px 20px 0 0', paddingBottom: '40px' }}>
                        <button 
                            onClick={() => setSelectedReq(null)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, marginBottom: '24px' }}
                        >
                            ❮ Quay lại danh sách
                        </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className="request-avatar" style={{ width: '64px', height: '64px', fontSize: '24px', backgroundColor: getStatusUI(selectedReq).bg, color: getStatusUI(selectedReq).color, border: `2px solid ${getStatusUI(selectedReq).color}` }}>
                                {(selectedReq.customer_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Đơn: {selectedReq.destination}</h2>
                                <div style={{ fontSize: '15px', color: '#64748b' }}>
                                    Khách hàng: <strong style={{ color: '#334155' }}>{selectedReq.customer_name}</strong> &nbsp;•&nbsp; SĐT: <strong>{selectedReq.customer_phone}</strong>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '280px' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Tổng ngân sách đoàn ({totalMembers} khách)</div>
                            <div style={{ fontSize: '26px', fontWeight: '800', color: isWithinBudget ? '#10b981' : '#ef4444' }}>
                                {formatMoney(totalGroupBudget)}<span style={{ fontSize: '16px' }}> đ</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Ngân sách khách: {formatMoney(customerBudgetPerPax)} đ/người
                            </div>
                            
                            {/* Budget Progress Bar */}
                            <div className="budget-progress-container" style={{ marginTop: '8px' }}>
                                <div 
                                    className="budget-progress-fill" 
                                    style={{ 
                                        width: `${totalGroupBudget > 0 ? Math.min((grandTotalPrice / totalGroupBudget) * 100, 100) : 0}%`,
                                        backgroundColor: isWithinBudget ? '#10b981' : '#ef4444'
                                    }}
                                ></div>
                            </div>
                            <div style={{ fontSize: '12px', marginTop: '6px', color: isWithinBudget ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                                {isWithinBudget 
                                    ? `Trong ngân sách đoàn (Dư ${formatMoney(groupBudgetRemaining)} đ)` 
                                    : `Vượt ngân sách đoàn (${formatMoney(groupBudgetOver)} đ)`}
                            </div>
                        </div>
                    </div>

                    {(selectedReq.status === 'Manager_Rejected' || selectedReq.status === 'Customer_Revision') && (
                        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '24px' }}>⚠️</div>
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#b91c1c', fontSize: '15px' }}>
                                    {selectedReq.status === 'Manager_Rejected' ? 'Lý do Quản lý từ chối / Yêu cầu chỉnh sửa:' : 'Lý do Khách hàng yêu cầu chỉnh sửa:'}
                                </h4>
                                <p style={{ margin: 0, color: '#991b1b', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                    {selectedReq.status === 'Manager_Rejected' ? (selectedReq.manager_note || 'Không có ghi chú') : (selectedReq.customer_note || 'Không có ghi chú')}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bento-grid">
                        <div className="bento-box">
                            <span className="bento-icon-bg">📅</span>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Thời gian <span style={{ color: '#1d4ed8', textTransform: 'none', marginLeft: '4px' }}>({durationDays} Ngày {durationNights} Đêm)</span></div>
                            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600', lineHeight: '1.5' }}>
                                Đi: {selectedReq.departure_date ? new Date(selectedReq.departure_date).toLocaleDateString('vi-VN') : 'Chưa định'}<br/>
                                Về: {selectedReq.return_date ? new Date(selectedReq.return_date).toLocaleDateString('vi-VN') : 'Chưa định'}
                            </div>
                        </div>
                        <div className="bento-box">
                            <span className="bento-icon-bg">👥</span>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Thành viên</div>
                            <div style={{ fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>{totalMembers} khách</div>
                            <div style={{ fontSize: '13px', color: '#475569' }}>
                                {numAdults} Lớn, {numChildren} Trẻ em
                                {(numToddlers > 0) && `, ${numToddlers} Trẻ nhỏ`}
                                {(numInfants > 0) && `, ${numInfants} Em bé`}
                            </div>
                        </div>
                        {selectedReq.preferences?.note && (
                            <div className="bento-box" style={{ background: '#fffbeb', borderColor: '#fde68a', gridColumn: '1 / -1' }}>
                                <span className="bento-icon-bg" style={{ color: '#f59e0b', opacity: 0.1 }}>📝</span>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Ghi chú đặc biệt</div>
                                <div style={{ fontSize: '15px', color: '#92400e', fontWeight: '500' }}>{selectedReq.preferences.note}</div>
                            </div>
                        )}
                    </div>

                    {/* CARD ERP: ĐÁNH GIÁ NGÂN SÁCH ĐOÀN & GỢI Ý TỐI ƯU CHI PHÍ */}
                    <div style={{
                        marginTop: '24px',
                        background: '#ffffff',
                        border: isWithinBudget ? '1px solid #bbf7d0' : '1px solid #fecaca',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        {/* Header của Card Đánh giá Ngân sách */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '22px' }}>{isWithinBudget ? '🟢' : '⚠️'}</span>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: isWithinBudget ? '#15803d' : '#b91c1c' }}>
                                        {isWithinBudget ? 'Phương án báo giá đạt ngân sách đoàn' : 'Phương án báo giá đang vượt ngân sách đoàn'}
                                    </h4>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                        {isWithinBudget 
                                            ? `Tổng giá đoàn (${formatMoney(grandTotalPrice)} đ) nằm trong ngân sách (${formatMoney(totalGroupBudget)} đ). Tiết kiệm ${formatMoney(groupBudgetRemaining)} đ cho đoàn.` 
                                            : `Tổng giá đoàn (${formatMoney(grandTotalPrice)} đ) cao hơn ngân sách đoàn (${formatMoney(totalGroupBudget)} đ) là ${formatMoney(groupBudgetOver)} đ.`}
                                    </div>
                                </div>
                            </div>
                            <div style={{ flexShrink: 0 }}>
                                <span style={{ 
                                    padding: '6px 14px', 
                                    borderRadius: '20px', 
                                    fontSize: '12.5px', 
                                    fontWeight: '700', 
                                    background: isWithinBudget ? '#dcfce7' : '#fee2e2', 
                                    color: isWithinBudget ? '#15803d' : '#b91c1c',
                                    border: isWithinBudget ? '1px solid #86efac' : '1px solid #fca5a5'
                                }}>
                                    {isWithinBudget ? '✅ Trong ngân sách đoàn' : '⚡ Cần tối ưu chi phí'}
                                </span>
                            </div>
                        </div>

                        {/* Lưới chỉ số đánh giá ngân sách ERP chuẩn */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '12px', 
                            background: isWithinBudget ? '#f0fdf4' : '#fff1f2', 
                            padding: '14px 18px', 
                            borderRadius: '12px',
                            border: isWithinBudget ? '1px solid #dcfce7' : '1px solid #ffe4e6'
                        }}>
                            <div>
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Ngân sách khách/người</div>
                                <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                                    {formatMoney(customerBudgetPerPax)} đ
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Quy mô đoàn</div>
                                <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                                    {totalMembers} khách <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>({numAdults}L, {numChildren}TE{numToddlers > 0 ? `, ${numToddlers}TN` : ''}{numInfants > 0 ? `, ${numInfants}EB` : ''})</span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Tổng ngân sách đoàn</div>
                                <div style={{ fontSize: '17px', fontWeight: '800', color: '#2563eb', marginTop: '2px' }}>
                                    {formatMoney(totalGroupBudget)} đ
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Tổng giá báo khách đoàn</div>
                                <div style={{ fontSize: '17px', fontWeight: '800', color: isWithinBudget ? '#15803d' : '#dc2626', marginTop: '2px' }}>
                                    {formatMoney(grandTotalPrice)} đ
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Chênh lệch ngân sách</div>
                                <div style={{ fontSize: '17px', fontWeight: '800', color: isWithinBudget ? '#15803d' : '#dc2626', marginTop: '2px' }}>
                                    {isWithinBudget ? `Dư ${formatMoney(groupBudgetRemaining)} đ` : `Vượt ${formatMoney(groupBudgetOver)} đ`}
                                </div>
                            </div>
                        </div>

                        {/* GỢI Ý TỐI ƯU CHI PHÍ: CHỈ HIỂN THỊ KHI TỔNG GIÁ BÁO KHÁCH ĐOÀN > TỔNG NGÂN SÁCH ĐOÀN */}
                        {!isWithinBudget && (
                            <div style={{ marginTop: '6px', paddingTop: '14px', borderTop: '1px dashed #fca5a5' }}>
                                <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#991c1c', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>💡 Gợi ý tối ưu chi phí từ danh mục hệ thống:</span>
                                </div>
                                {budgetRecommendations.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                                        {budgetRecommendations.map((rec, idx) => (
                                            <div key={idx} style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                    <div>
                                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            {rec.title}
                                                        </span>
                                                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                                                            Đổi sang: {rec.proposed}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                            Hiện tại: {rec.current}
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                                                        Tiết kiệm: ~{formatMoney(rec.totalSavings)} đ
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                                                    {rec.explanation}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                                    <div style={{ fontSize: '12px', color: '#475569' }}>
                                                        Giá đoàn dự kiến: <strong style={{ color: '#0f172a' }}>{formatMoney(rec.newGrandTotal)} đ</strong>
                                                    </div>
                                                    <button
                                                        onClick={rec.action}
                                                        style={{ padding: '6px 12px', background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <span>Áp dụng gợi ý</span>
                                                        <ArrowRight size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '12.5px', color: '#7f1d1d', fontStyle: 'italic', padding: '6px 0' }}>
                                        Chưa tìm thấy dịch vụ thay thế tự động trong cơ sở dữ liệu. Nhân viên vui lòng dùng các nút điều chỉnh trực tiếp bên dưới để cân đối ngân sách.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '40px 0 20px 0' }}>📦 Bóc tách Dịch vụ Tạm tính</h3>
                    
                    <div className="bento-grid">
                        {/* 1. ĐÓN KHÁCH */}
                        <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>📍</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đón khách</div>
                                {proposedPlan?.pickup?.isCustomized && (
                                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Đã điều chỉnh</span>
                                )}
                            </div>

                            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', marginBottom: '4px' }}>
                                {proposedPlan?.pickup?.location || selectedReq.preferences?.pickup_location || 'Tự túc'}
                            </div>

                            {proposedPlan?.pickup?.time && (
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '8px' }}>
                                    ⏰ {proposedPlan.pickup.time}
                                </div>
                            )}

                            {/* So sánh với yêu cầu gốc & hiển thị lý do */}
                            {proposedPlan?.pickup?.isCustomized && (
                                <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', margin: '6px 0 10px 0', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>Gốc: <strong>{originalPreferences?.pickup_location || 'Tự túc'} {originalPreferences?.departure_time ? `(${originalPreferences.departure_time})` : ''}</strong></div>
                                        <button 
                                            onClick={handleResetPickup}
                                            title="Khôi phục điểm đón gốc của khách"
                                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                                        >
                                            ↺ Khôi phục
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '4px', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>Lý do: {proposedPlan.pickup.reason || 'Điều chỉnh điểm đón thuận tiện'}</span>
                                        <button
                                            onClick={() => openEditReasonModal('Lý do điều chỉnh điểm đón', proposedPlan.pickup.reason, (newR) => {
                                                setProposedPlan(prev => ({ ...prev, pickup: { ...prev.pickup, reason: newR } }));
                                            })}
                                            style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}
                                            title="Sửa lý do"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                                <button
                                    onClick={() => {
                                        setPickupEditData({
                                            location: proposedPlan?.pickup?.location || selectedReq.preferences?.pickup_location || '',
                                            time: proposedPlan?.pickup?.time || selectedReq.preferences?.departure_time || '',
                                            reason: proposedPlan?.pickup?.reason || ''
                                        });
                                        setActiveModal('pickup');
                                    }}
                                    style={{ width: '100%', padding: '6px 10px', background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                    <Edit3 size={13} />
                                    <span>Chỉnh sửa điểm/giờ đón</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. PHƯƠNG TIỆN */}
                        <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🚐</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phương tiện</div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {isTransportSelfArranged && (
                                        <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Khách tự túc</span>
                                    )}
                                    {proposedPlan?.transport?.isCustomized && !isTransportSelfArranged && (
                                        <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Đã điều chỉnh</span>
                                    )}
                                    {!isTransportSelfArranged && !proposedPlan?.transport?.isAssigned && (
                                        <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Chưa chọn xe</span>
                                    )}
                                    {!isTransportSelfArranged && proposedPlan?.transport?.isAssigned && !proposedPlan?.transport?.isCustomized && (
                                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Đã chọn xe</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', marginBottom: '4px' }}>
                                {isTransportSelfArranged 
                                    ? 'Khách tự túc phương tiện di chuyển' 
                                    : (proposedPlan?.transport?.isAssigned 
                                        ? proposedPlan.transport.name 
                                        : (proposedPlan?.transport?.requestedSegment || selectedReq.preferences?.transportName || 'Chưa chọn xe cụ thể'))
                                }
                            </div>

                            {/* Thông báo tình trạng chọn xe */}
                            {!isTransportSelfArranged && proposedPlan?.transport?.isAssigned && !proposedPlan?.transport?.isCustomized && (
                                <div style={{ fontSize: '11.5px', color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 8px', borderRadius: '6px', margin: '2px 0 6px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>✅ Đã chọn xe cụ thể đáp ứng yêu cầu khách</span>
                                </div>
                            )}

                            {!isTransportSelfArranged && !proposedPlan?.transport?.isAssigned && (
                                <div style={{ fontSize: '11.5px', color: '#92400e', background: '#fffbeb', border: '1px dashed #fde68a', padding: '5px 8px', borderRadius: '6px', margin: '2px 0 6px 0', lineHeight: 1.4 }}>
                                    💡 Khách đã chọn phân khúc trên. Bấm <strong>"Chọn xe cho khách"</strong> bên dưới để bố trí xe cụ thể.
                                </div>
                            )}

                            {selectedReq.preferences?.customTransportNote && !proposedPlan?.transport?.isCustomized && (
                                <div style={{ fontSize: '11.5px', background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', margin: '4px 0 6px 0', lineHeight: 1.4 }}>
                                    📝 <strong>Yêu cầu riêng:</strong> {selectedReq.preferences.customTransportNote}
                                </div>
                            )}

                            {/* So sánh với yêu cầu gốc & lý do (chỉ hiện khi có điều chỉnh ngoài phân khúc khách chọn) */}
                            {proposedPlan?.transport?.isCustomized && !isTransportSelfArranged && (
                                <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', margin: '4px 0 8px 0', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>Gốc: <strong>{originalPreferences?.transportName || originalPreferences?.transport || 'Chưa chọn'}</strong></div>
                                        <button 
                                            onClick={handleResetTransport}
                                            title="Khôi phục lại xe khách yêu cầu ban đầu"
                                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                                        >
                                            ↺ Khôi phục
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '4px', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>Lý do: {proposedPlan.transport.reason || 'Tối ưu dòng xe theo quy mô đoàn'}</span>
                                        <button
                                            onClick={() => openEditReasonModal('Lý do thay đổi phương tiện', proposedPlan.transport.reason, (newR) => {
                                                setProposedPlan(prev => ({ ...prev, transport: { ...prev.transport, reason: newR } }));
                                            })}
                                            style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}
                                            title="Sửa lý do"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Thao tác thay đổi */}
                            <div style={{ display: 'flex', gap: '6px', margin: '4px 0 10px 0' }}>
                                <button
                                    onClick={() => { setModalSearch(''); setActiveModal('transport'); }}
                                    style={{ 
                                        flex: 1, 
                                        padding: '7px 10px', 
                                        background: proposedPlan?.transport?.isAssigned ? '#eff6ff' : '#2563eb', 
                                        border: proposedPlan?.transport?.isAssigned ? '1px solid #bfdbfe' : 'none', 
                                        color: proposedPlan?.transport?.isAssigned ? '#1d4ed8' : '#ffffff', 
                                        borderRadius: '6px', 
                                        fontSize: '12px', 
                                        fontWeight: '700', 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '5px',
                                        boxShadow: proposedPlan?.transport?.isAssigned ? 'none' : '0 2px 6px rgba(37,99,235,0.25)'
                                    }}
                                >
                                    <Car size={13} />
                                    <span>{proposedPlan?.transport?.isAssigned ? 'Đổi xe khác' : 'Chọn xe cho khách'}</span>
                                </button>
                                <button
                                    onClick={handleToggleTransportSelf}
                                    style={{ padding: '6px 10px', background: isTransportSelfArranged ? '#f0fdf4' : '#fff', border: '1px solid #cbd5e1', color: isTransportSelfArranged ? '#15803d' : '#475569', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {isTransportSelfArranged ? 'Bật dùng xe' : 'Khách tự túc'}
                                </button>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                {!isTransportSelfArranged ? (
                                    <>
                                        <div style={{ marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
                                                Đơn giá xe / Ngày {!proposedPlan?.transport?.isAssigned && <span style={{ color: '#d97706', fontWeight: 'normal' }}>(Chưa chọn xe)</span>}
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <FormattedMoneyInput value={adjTransportCost} onChange={val => setAdjTransportCost(val || 0)} style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#1d4ed8', boxSizing: 'border-box' }} />
                                                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                            </div>
                                        </div>
                                        {totalTransportPerPerson > 0 && (
                                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>Chi phí/Khách:</span>
                                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1d4ed8', whiteSpace: 'nowrap' }}>{formatMoney(totalTransportPerPerson)} đ</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                                        Khách tự túc di chuyển (0 đ)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. LƯU TRÚ */}
                        <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🏨</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lưu trú</div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {isHotelSelfArranged && (
                                        <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Khách tự túc</span>
                                    )}
                                    {proposedPlan?.hotel?.isCustomized && !isHotelSelfArranged && (
                                        <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Đã điều chỉnh</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', marginBottom: '4px' }}>
                                {isHotelSelfArranged ? 'Khách tự túc chỗ ở (Tự đặt phòng)' : cleanHotelDisplayName(proposedPlan?.hotel?.name || selectedReq.preferences?.hotelName || 'Chưa chọn khách sạn')}
                            </div>

                            {/* So sánh với yêu cầu gốc & lý do */}
                            {proposedPlan?.hotel?.isCustomized && (
                                <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', margin: '4px 0 8px 0', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>Gốc: <strong>{cleanHotelDisplayName(originalPreferences?.hotelName || originalPreferences?.hotel || 'Chưa chọn')}</strong></div>
                                        <button 
                                            onClick={handleResetHotel}
                                            title="Khôi phục lại khách sạn ban đầu"
                                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                                        >
                                            ↺ Khôi phục
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '4px', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>Lý do: {proposedPlan.hotel.reason || 'Điều chỉnh khách sạn phù hợp ngân sách'}</span>
                                        <button
                                            onClick={() => openEditReasonModal('Lý do thay đổi khách sạn', proposedPlan.hotel.reason, (newR) => {
                                                setProposedPlan(prev => ({ ...prev, hotel: { ...prev.hotel, reason: newR } }));
                                            })}
                                            style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}
                                            title="Sửa lý do"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Thao tác thay đổi */}
                            <div style={{ display: 'flex', gap: '6px', margin: '4px 0 10px 0' }}>
                                <button
                                    onClick={() => { setModalSearch(''); setActiveModal('hotel'); }}
                                    style={{ flex: 1, padding: '6px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                    <Building2 size={13} />
                                    <span>Đổi khách sạn</span>
                                </button>
                                <button
                                    onClick={handleToggleHotelSelf}
                                    style={{ padding: '6px 10px', background: isHotelSelfArranged ? '#f0fdf4' : '#fff', border: '1px solid #cbd5e1', color: isHotelSelfArranged ? '#15803d' : '#475569', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {isHotelSelfArranged ? 'Bật khách sạn' : 'Khách tự túc'}
                                </button>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                {!isHotelSelfArranged ? (
                                    <>
                                        <div style={{ marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Đơn giá phòng / Đêm</div>
                                            <div style={{ position: 'relative' }}>
                                                <FormattedMoneyInput value={adjHotelCost} onChange={val => setAdjHotelCost(val || 0)} style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#1d4ed8', boxSizing: 'border-box' }} />
                                                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                            </div>
                                        </div>
                                        {totalHotelPerPerson > 0 && (
                                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>Chi phí/Khách:</span>
                                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1d4ed8', whiteSpace: 'nowrap' }}>{formatMoney(totalHotelPerPerson)} đ</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                                        Khách tự túc lưu trú (0 đ)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. ĂN UỐNG */}
                        <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🍽️</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ăn uống</div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {!isMealEnabled && (
                                        <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Đã bỏ (Tự túc)</span>
                                    )}
                                    {proposedPlan?.meal?.isCustomized && isMealEnabled && (
                                        <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Đã điều chỉnh</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', marginBottom: '4px' }}>
                                {isMealEnabled ? (proposedPlan?.meal?.name || selectedReq.preferences?.meal || 'Trọn gói (Sáng, Trưa, Tối)') : 'Khách tự túc ăn uống'}
                            </div>

                            {/* So sánh với yêu cầu gốc & lý do */}
                            {proposedPlan?.meal?.isCustomized && (
                                <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', margin: '4px 0 8px 0', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>Gốc: <strong>{originalPreferences?.meal || 'Trọn gói'}</strong></div>
                                        <button 
                                            onClick={handleResetMeal}
                                            title="Khôi phục lại chế độ ăn uống ban đầu"
                                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                                        >
                                            ↺ Khôi phục
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '4px', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>Lý do: {proposedPlan.meal.reason || 'Điều chỉnh gói ăn uống'}</span>
                                        <button
                                            onClick={() => openEditReasonModal('Lý do điều chỉnh ăn uống', proposedPlan.meal.reason, (newR) => {
                                                setProposedPlan(prev => ({ ...prev, meal: { ...prev.meal, reason: newR } }));
                                            })}
                                            style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}
                                            title="Sửa lý do"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Thao tác */}
                            <div style={{ margin: '4px 0 8px 0' }}>
                                <button
                                    onClick={handleToggleMeal}
                                    style={{ width: '100%', padding: '6px 10px', background: isMealEnabled ? '#fff1f2' : '#eff6ff', border: isMealEnabled ? '1px solid #fecaca' : '1px solid #bfdbfe', color: isMealEnabled ? '#b91c1c' : '#1d4ed8', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <Utensils size={13} />
                                    <span>{isMealEnabled ? 'Chuyển sang ăn tự túc' : 'Bật gói ăn uống theo đoàn'}</span>
                                </button>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                {isMealEnabled ? (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: '600' }}>Sáng ({autoBreakfastQty} bữa)</div>
                                                <div style={{ position: 'relative' }}>
                                                    <FormattedMoneyInput value={mealPrices.breakfast} onChange={val => setMealPrices({...mealPrices, breakfast: val || 0})} placeholder="Đơn giá" style={{ width: '100%', padding: '4px 20px 4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }} />
                                                    <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94a3b8' }}>đ</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: '600' }}>Trưa ({autoLunchQty} bữa)</div>
                                                <div style={{ position: 'relative' }}>
                                                    <FormattedMoneyInput value={mealPrices.lunch} onChange={val => setMealPrices({...mealPrices, lunch: val || 0})} placeholder="Đơn giá" style={{ width: '100%', padding: '4px 20px 4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }} />
                                                    <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94a3b8' }}>đ</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: '600' }}>Tối ({autoDinnerQty} bữa)</div>
                                                <div style={{ position: 'relative' }}>
                                                    <FormattedMoneyInput value={mealPrices.dinner} onChange={val => setMealPrices({...mealPrices, dinner: val || 0})} placeholder="Đơn giá" style={{ width: '100%', padding: '4px 20px 4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box', outline: 'none' }} />
                                                    <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94a3b8' }}>đ</span>
                                                </div>
                                            </div>
                                        </div>
                                        {mealCostPerPerson > 0 && (
                                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#64748b' }}>Tổng/Khách:</span>
                                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#10b981' }}>{formatMoney(mealCostPerPerson)} đ</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                                        Khách tự do ăn uống (0 đ)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 5. HƯỚNG DẪN VIÊN */}
                        <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🗣️</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hướng dẫn viên</div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {!isGuideEnabled && (
                                        <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Đã bỏ (Tour tự do)</span>
                                    )}
                                    {proposedPlan?.guide?.isCustomized && isGuideEnabled && (
                                        <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>Đã điều chỉnh</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', marginBottom: '4px' }}>
                                {isGuideEnabled ? (proposedPlan?.guide?.name || selectedReq.preferences?.guide || 'Có hướng dẫn viên suốt tuyến') : 'Tour tự do (Không HDV)'}
                            </div>

                            {/* So sánh với yêu cầu gốc & lý do */}
                            {proposedPlan?.guide?.isCustomized && (
                                <div style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', margin: '4px 0 8px 0', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>Gốc: <strong>{originalPreferences?.guide || 'Có HDV'}</strong></div>
                                        <button 
                                            onClick={handleResetGuide}
                                            title="Khôi phục lại HDV ban đầu"
                                            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                                        >
                                            ↺ Khôi phục
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '4px', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>Lý do: {proposedPlan.guide.reason || 'Điều chỉnh HDV'}</span>
                                        <button
                                            onClick={() => openEditReasonModal('Lý do điều chỉnh HDV', proposedPlan.guide.reason, (newR) => {
                                                setProposedPlan(prev => ({ ...prev, guide: { ...prev.guide, reason: newR } }));
                                            })}
                                            style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0 4px', fontSize: '12px' }}
                                            title="Sửa lý do"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Thao tác */}
                            <div style={{ margin: '4px 0 8px 0' }}>
                                <button
                                    onClick={handleToggleGuide}
                                    style={{ width: '100%', padding: '6px 10px', background: isGuideEnabled ? '#fff1f2' : '#eff6ff', border: isGuideEnabled ? '1px solid #fecaca' : '1px solid #bfdbfe', color: isGuideEnabled ? '#b91c1c' : '#1d4ed8', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <UserCheck size={13} />
                                    <span>{isGuideEnabled ? 'Lược bỏ HDV theo yêu cầu tour tự do' : 'Bổ sung HDV theo đoàn'}</span>
                                </button>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                {isGuideEnabled ? (
                                    <>
                                        <div style={{ marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Đơn giá HDV / Ngày</div>
                                            <div style={{ position: 'relative' }}>
                                                <FormattedMoneyInput placeholder="500000" value={guidePricePerDay || ''} onChange={val => setGuidePricePerDay(val || 0)} style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                                                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                            </div>
                                        </div>
                                        {guideCostPerPerson > 0 && (
                                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>Chia đều/Khách:</span>
                                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#10b981', whiteSpace: 'nowrap' }}>{formatMoney(guideCostPerPerson)} đ</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                                        Tour tự do không HDV (0 đ)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 6. ĐIỂM THAM QUAN */}
                        <div className="bento-box" style={{ background: '#f8fafc', gridColumn: 'span 3' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🎫</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Điểm tham quan</div>
                                    <span style={{ fontSize: '11.5px', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                        {currentPlaces.length} điểm • Vé: {formatMoney(totalPlacesCost)}đ/người
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                                    <button
                                        onClick={() => { setModalSearch(''); setModalCategory('All'); setActiveModal('places'); }}
                                        style={{ padding: '6px 12px', background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                    >
                                        <Plus size={13} />
                                        <span>Thêm điểm</span>
                                    </button>
                                    {(proposedPlan?.removedPlaces?.length > 0 || currentPlaces.some(p => p.isAdded)) && (
                                        <button
                                            onClick={handleResetPlaces}
                                            style={{ padding: '6px 10px', background: '#fff', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                            ↺ Khôi phục gốc
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Danh sách điểm đang chọn */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {currentPlaces.length > 0 ? currentPlaces.map(p => (
                                    <div key={p.place_id || p.name} style={{ background: p.isAdded ? '#f0fdf4' : '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#334155', border: p.isAdded ? '1px solid #bbf7d0' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>📍 {p.name}</span>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>({formatMoney(p.price || 0)}đ)</span>
                                        {p.isAdded && (
                                            <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>Mới thêm</span>
                                        )}
                                        <button 
                                            onClick={() => handleRemovePlace(p.place_id)}
                                            title="Lược bỏ điểm này khỏi phương án"
                                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )) : (
                                    <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>Không có điểm tham quan nào trong phương án</div>
                                )}
                            </div>

                            {/* Các điểm gốc đã lược bỏ kèm lý do */}
                            {proposedPlan?.removedPlaces?.length > 0 && (
                                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                                    <div style={{ fontSize: '12.5px', color: '#991b1b', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>🔴 Các điểm gốc của khách đã lược bỏ (kèm lý do giải thích):</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {proposedPlan.removedPlaces.map(p => (
                                            <div key={p.place_id} style={{ background: '#fef2f2', border: '1px dashed #fca5a5', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div>
                                                    <span style={{ textDecoration: 'line-through', fontWeight: '600' }}>{p.name} ({formatMoney(p.price || 0)}đ)</span>
                                                    <div style={{ fontSize: '11px', color: '#7f1d1d', marginTop: '2px' }}>
                                                        Lý do: {p.reason || 'Cân đối ngân sách'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRestorePlace(p)}
                                                    style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#15803d', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '3px 8px', borderRadius: '5px' }}
                                                >
                                                    + Thêm lại
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', padding: '20px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'inline-flex', gap: '24px', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Cost Gốc/Khách</div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>{formatMoney(totalCost)} đ</div>
                        </div>
                        <div style={{ fontSize: '24px', color: '#cbd5e1' }}>+</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Markup (%)</div>
                            <input 
                                type="number" 
                                value={tempMarkup} 
                                onChange={handleMarkupChange}
                                style={{ width: "70px", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "16px", fontWeight: "700", textAlign: "center", outline: 'none' }}
                            />
                        </div>
                        <div style={{ fontSize: '24px', color: '#cbd5e1' }}>=</div>
                        <div style={{ paddingLeft: '24px', borderLeft: '2px solid #e2e8f0' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Giá Báo Khách</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FormattedMoneyInput 
                                    value={suggestedPrice} 
                                    onChange={handlePriceChange}
                                    style={{ width: "140px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #93c5fd", fontSize: "18px", fontWeight: "800", color: "#1d4ed8", outline: 'none', background: '#eff6ff' }}
                                />
                                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1d4ed8', whiteSpace: 'nowrap' }}>đ</span>
                            </div>
                        </div>
                    </div>

                    {/* CHÍNH SÁCH GIÁ TRẺ EM */}
                    <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1d4ed8' }}>Chính sách giá trẻ em</h3>
                            <select 
                                value={policyType} 
                                onChange={handlePolicyTemplateChange}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                            >
                                <option value="Custom">Tùy chỉnh</option>
                                <option value="Template1">Mẫu 1 (Đường bộ): 50% - 0% - 0%</option>
                                <option value="Template2">Mẫu 2 (Hàng không): 85% - 50% - (0% + Phụ thu)</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {/* Trẻ em */}
                            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Trẻ em (5 - 11 tuổi)</div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="text" value={childPolicy.child.percent} onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            updatePolicy('child', 'percent', val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val, 10))));
                                        }} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>%</span>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <FormattedMoneyInput value={childPolicy.child.surcharge} onChange={(val) => updatePolicy('child', 'surcharge', val)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>đ</span>
                                    </div>
                                </div>
                                <div style={{ paddingTop: '12px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Giá bán:</span>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1d4ed8' }}>{formatMoney(childPrice)} đ</span>
                                </div>
                            </div>

                            {/* Trẻ nhỏ */}
                            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Trẻ nhỏ (2 - 4 tuổi)</div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="text" value={childPolicy.toddler.percent} onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            updatePolicy('toddler', 'percent', val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val, 10))));
                                        }} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>%</span>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <FormattedMoneyInput value={childPolicy.toddler.surcharge} onChange={(val) => updatePolicy('toddler', 'surcharge', val)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>đ</span>
                                    </div>
                                </div>
                                <div style={{ paddingTop: '12px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Giá bán:</span>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1d4ed8' }}>{formatMoney(toddlerPrice)} đ</span>
                                </div>
                            </div>

                            {/* Em bé */}
                            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Em bé (&lt; 2 tuổi)</div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="text" value={childPolicy.infant.percent} onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            updatePolicy('infant', 'percent', val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val, 10))));
                                        }} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>%</span>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <FormattedMoneyInput value={childPolicy.infant.surcharge} onChange={(val) => updatePolicy('infant', 'surcharge', val)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>đ</span>
                                    </div>
                                </div>
                                <div style={{ paddingTop: '12px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Giá bán:</span>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1d4ed8' }}>{formatMoney(infantPrice)} đ</span>
                                </div>
                            </div>
                        </div>

                        {/* TỔNG KẾT CHI PHÍ */}
                        <div style={{ marginTop: '20px', padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #93c5fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8' }}>Tổng kết chi phí cho đoàn:</div>
                                <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '4px' }}>
                                    {numAdults} Lớn, {numChildren} Trẻ em, {numToddlers} Trẻ nhỏ, {numInfants} Em bé
                                </div>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FormattedMoneyInput 
                                    value={grandTotalPrice} 
                                    onChange={handleGrandTotalChange}
                                    style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', border: '1px solid #bfdbfe', background: '#fff', textAlign: 'right', width: '200px', outline: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                />
                                <span>đ</span>
                            </div>
                        </div>
                    </div>

                    {/* BẢNG ĐỐI SOÁT CÁC THAY ĐỔI SO VỚI YÊU CẦU GỐC (BẮT BUỘC THEO GIAI ĐOẠN 4 & 5) */}
                    <div style={{ marginTop: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} color="#2563eb" />
                                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '700', color: '#0f172a' }}>
                                    📋 Bảng đối soát các thay đổi so với yêu cầu gốc (Sẽ hiển thị minh bạch cho khách hàng)
                                </h3>
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                Tổng cộng: <strong style={{ color: '#2563eb' }}>{computedChanges.length}</strong> thay đổi được ghi nhận
                            </span>
                        </div>

                        {computedChanges.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '10px 12px', width: '15%' }}>Phân loại</th>
                                            <th style={{ padding: '10px 12px', width: '16%' }}>Hạng mục</th>
                                            <th style={{ padding: '10px 12px', width: '22%' }}>Yêu cầu ban đầu của khách</th>
                                            <th style={{ padding: '10px 12px', width: '22%' }}>Phương án đề xuất mới</th>
                                            <th style={{ padding: '10px 12px', width: '25%' }}>Lý do giải thích cho khách</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {computedChanges.map((ch, idx) => {
                                            const badge = ch.group === 'added' ? { bg: '#dcfce7', color: '#15803d', label: '🟢 Bổ sung' }
                                                : ch.group === 'replaced' ? { bg: '#dbeafe', color: '#1d4ed8', label: '🔄 Thay thế' }
                                                : ch.group === 'removed' ? { bg: '#fee2e2', color: '#b91c1c', label: '🔴 Lược bỏ' }
                                                : { bg: '#fef3c7', color: '#b45309', label: '⚙️ Điều chỉnh' };
                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: badge.bg, color: badge.color }}>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#334155' }}>
                                                        {ch.category}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                                        {ch.original}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>
                                                        {ch.proposed}
                                                    </td>
                                                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                                            <span style={{ fontStyle: 'italic' }}>{ch.reason}</span>
                                                            <button
                                                                onClick={() => openEditReasonModal(`Sửa lý do: ${ch.category}`, ch.reason, (newR) => {
                                                                    // Update reason in the appropriate state
                                                                    if (ch.id === 'pickup') setProposedPlan(p => ({ ...p, pickup: { ...p.pickup, reason: newR } }));
                                                                    else if (ch.id === 'transport') setProposedPlan(p => ({ ...p, transport: { ...p.transport, reason: newR } }));
                                                                    else if (ch.id === 'hotel') setProposedPlan(p => ({ ...p, hotel: { ...p.hotel, reason: newR } }));
                                                                    else if (ch.id === 'meal') setProposedPlan(p => ({ ...p, meal: { ...p.meal, reason: newR } }));
                                                                    else if (ch.id === 'guide') setProposedPlan(p => ({ ...p, guide: { ...p.guide, reason: newR } }));
                                                                    else if (ch.id.startsWith('place_add_')) {
                                                                        const pid = parseInt(ch.id.replace('place_add_', ''), 10);
                                                                        setProposedPlan(p => ({ ...p, selectedPlaces: p.selectedPlaces.map(x => x.place_id === pid ? { ...x, reason: newR } : x) }));
                                                                    } else if (ch.id.startsWith('place_rem_')) {
                                                                        const pid = parseInt(ch.id.replace('place_rem_', ''), 10);
                                                                        setProposedPlan(p => ({ ...p, removedPlaces: p.removedPlaces.map(x => x.place_id === pid ? { ...x, reason: newR } : x) }));
                                                                    }
                                                                })}
                                                                style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '2px 4px', fontSize: '13px' }}
                                                                title="Sửa lý do này"
                                                            >
                                                                ✏️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                                ✅ Phương án báo giá hiện đang giữ nguyên 100% theo các yêu cầu và sở thích ban đầu của khách hàng.
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Ghi chú tư vấn (Chỉ nội bộ)</div>
                        <textarea
                            value={consultationNote}
                            onChange={(e) => setConsultationNote(e.target.value)}
                            placeholder="Ghi chú lại các thỏa thuận, yêu cầu đặc biệt sau khi trao đổi với khách..."
                            style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>
                
                {/* FIXED ACTION BAR DƯỚI CÙNG */}
                <div style={{ padding: '20px 30px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)', flexShrink: 0, zIndex: 10, borderRadius: '0 0 20px 20px' }}>
                    <div>
                        <button
                            onClick={handleResetAllToOriginal}
                            style={{ padding: '10px 16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#b91c1c'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
                        >
                            <RotateCcw size={14} />
                            <span>Khôi phục toàn bộ yêu cầu gốc</span>
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {['Pending', 'Customer_Revision', 'Manager_Rejected'].includes(selectedReq.status) && (
                            <>
                                <button 
                                    onClick={handleSaveDraft}
                                    disabled={isSavingDraft}
                                    style={{ padding: "12px 18px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: isSavingDraft ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Save size={16} />
                                    <span>{isSavingDraft ? 'Đang lưu...' : 'Lưu Bản Nháp'}</span>
                                </button>

                                <button 
                                    onClick={handleSendInitialQuote} 
                                    style={{ padding: "12px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: 'pointer', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    <Send size={15} />
                                    <span>{selectedReq.status === 'Pending' ? 'Gửi Báo Giá Cho Khách' : 'Gửi Lại Báo Giá Mới'}</span>
                                </button>
                            </>
                        )}
                        {selectedReq.status === 'Manager_Approved' && (
                            <button
                                onClick={handleSendToCustomer}
                                style={{ padding: "12px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Send size={15} />
                                <span>Gửi Bản Thiết Kế Cho Khách</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            )}
        
            {/* ================= MODAL CHỌN XE VẬN CHUYỂN ================= */}
            {activeModal === 'transport' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '680px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                    🚐 {proposedPlan?.transport?.isAssigned ? 'Đổi Xe Vận Chuyển' : 'Chọn Xe Cho Khách'}
                                </h3>
                                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>Điểm đến: <strong>{selectedReq.destination}</strong> • Đoàn: <strong style={{ color: '#2563eb' }}>{totalPax} khách</strong></span>
                                    {(proposedPlan?.transport?.requestedSegment || selectedReq.preferences?.transportName) && (
                                        <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', fontSize: '12px' }}>
                                            🎯 Phân khúc khách chọn: {proposedPlan?.transport?.requestedSegment || selectedReq.preferences?.transportName}
                                        </span>
                                    )}
                                    {selectedReq.preferences?.recommendedVehicle && (
                                        <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', fontSize: '12px' }}>
                                            💡 Gợi ý: {selectedReq.preferences.recommendedVehicle}
                                        </span>
                                    )}
                                </div>
                                {selectedReq.preferences?.customTransportNote && (
                                    <div style={{ fontSize: '12px', background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '6px', marginTop: '6px' }}>
                                        📝 <strong>Yêu cầu riêng từ khách:</strong> {selectedReq.preferences.customTransportNote}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                    placeholder="Tìm dòng xe (Sedan 4 chỗ, SUV 7 chỗ, Limousine, 16 chỗ...)"
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {isCatalogLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Đang tải danh sách xe...</div>
                            ) : (
                                <>
                                    {/* Option Khách tự túc */}
                                    <div style={{ padding: '12px 16px', borderRadius: '10px', border: isTransportSelfArranged ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: isTransportSelfArranged ? '#eff6ff' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>🚫 Khách tự túc phương tiện di chuyển</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Khách tự thu xếp phương tiện cá nhân, không cộng chi phí xe</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleToggleTransportSelf();
                                                setActiveModal(null);
                                            }}
                                            style={{ padding: '8px 14px', background: isTransportSelfArranged ? '#2563eb' : '#fff', color: isTransportSelfArranged ? '#fff' : '#1e293b', border: isTransportSelfArranged ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                                        >
                                            {isTransportSelfArranged ? 'Đang chọn' : 'Chọn tự túc'}
                                        </button>
                                    </div>

                                    {/* Danh sách xe từ hệ thống */}
                                    {catalog.vehicles && [...catalog.vehicles]
                                        .filter(v => ((v.service_name || v.name || '')).toLowerCase().includes(modalSearch.toLowerCase()))
                                        .sort((a, b) => {
                                            const aMatch = isVehicleMatchingCategory(a, originalPreferences, totalPax) ? 1 : 0;
                                            const bMatch = isVehicleMatchingCategory(b, originalPreferences, totalPax) ? 1 : 0;
                                            if (bMatch !== aMatch) return bMatch - aMatch;
                                            return (Number(a.base_cost) || 0) - (Number(b.base_cost) || 0);
                                        })
                                        .map(v => {
                                            const vName = v.service_name || v.name || 'Xe vận chuyển';
                                            const capacityMatch = vName.match(/(\d+)\s*chỗ/i);
                                            const capacity = v.capacity || (capacityMatch ? parseInt(capacityMatch[1], 10) : null);
                                            const isSufficient = capacity ? capacity >= totalPax : true;
                                            const price = Number(v.base_cost) || Number(v.price) || Number(v.selling_price) || 0;
                                            const isCurrent = proposedPlan?.transport?.name === vName && proposedPlan?.transport?.isAssigned && !isTransportSelfArranged;
                                            const isMatchingSegment = isVehicleMatchingCategory(v, originalPreferences, totalPax);
                                            const perPaxDayCost = totalPax > 0 ? Math.round(price / totalPax) : price;

                                            return (
                                                <div key={v.service_id || v.id} style={{ padding: '14px 16px', borderRadius: '10px', border: isCurrent ? '2px solid #2563eb' : (isMatchingSegment ? '1.5px solid #93c5fd' : '1px solid #e2e8f0'), background: isCurrent ? '#eff6ff' : (isMatchingSegment ? '#f8faff' : '#fff'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ flex: 1, paddingRight: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <strong style={{ fontSize: '15px', color: '#0f172a' }}>{vName}</strong>
                                                            {isMatchingSegment && (
                                                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', background: '#dcfce7', color: '#15803d' }}>
                                                                    ⭐ Đúng phân khúc khách chọn
                                                                </span>
                                                            )}
                                                            {capacity && (
                                                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', background: isSufficient ? '#e0f2fe' : '#fee2e2', color: isSufficient ? '#0369a1' : '#b91c1c' }}>
                                                                    {capacity} chỗ {isSufficient ? '✅ Phù hợp' : '⚠️ Thiếu chỗ'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                                            {v.description || 'Dòng xe du lịch chất lượng cao, phục vụ suốt tuyến'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', marginTop: '4px' }}>
                                                            ~{formatMoney(perPaxDayCost)} đ/khách/ngày {durationDays > 1 && `• Cả tour (${durationDays} ngày): ~${formatMoney(perPaxDayCost * durationDays)} đ/khách`}
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                                                            {formatMoney(price)} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>đ/ngày</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleSelectVehicle(v)}
                                                            style={{ marginTop: '6px', padding: '7px 14px', background: isCurrent ? '#2563eb' : (isMatchingSegment ? '#1d4ed8' : '#f8fafc'), color: (isCurrent || isMatchingSegment) ? '#fff' : '#1e293b', border: (isCurrent || isMatchingSegment) ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                                                        >
                                                            {isCurrent ? 'Đang áp dụng' : (isMatchingSegment ? 'Bố trí xe này' : 'Chọn xe này')}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL CHỌN KHÁCH SẠN ================= */}
            {activeModal === 'hotel' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '680px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>🏨 Chọn Khách Sạn / Cơ Sở Lưu Trú</h3>
                                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                    Điểm đến: <strong>{selectedReq.destination}</strong> • Thời lượng: <strong>{durationNights} đêm</strong>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                    placeholder="Tìm kiếm khách sạn, resort, homestay..."
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {isCatalogLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Đang tải danh sách khách sạn...</div>
                            ) : (
                                <>
                                    {/* Option Khách tự túc */}
                                    <div style={{ padding: '12px 16px', borderRadius: '10px', border: isHotelSelfArranged ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: isHotelSelfArranged ? '#eff6ff' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>🚫 Khách tự túc chỗ ở (Tự đặt phòng)</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Khách tự thu xếp chỗ nghỉ, không cộng chi phí lưu trú</div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleToggleHotelSelf();
                                                setActiveModal(null);
                                            }}
                                            style={{ padding: '8px 14px', background: isHotelSelfArranged ? '#2563eb' : '#fff', color: isHotelSelfArranged ? '#fff' : '#1e293b', border: isHotelSelfArranged ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                                        >
                                            {isHotelSelfArranged ? 'Đang chọn' : 'Chọn tự túc'}
                                        </button>
                                    </div>

                                    {/* Danh sách khách sạn từ hệ thống */}
                                    {catalog.accommodations && catalog.accommodations
                                        .filter(h => ((h.service_name || h.name || '')).toLowerCase().includes(modalSearch.toLowerCase()))
                                        .map(h => {
                                            const hName = cleanHotelDisplayName(h.service_name || h.name || 'Khách sạn');
                                            const price = Number(h.base_cost) || Number(h.price) || Number(h.selling_price) || 0;
                                            const isCurrent = cleanHotelDisplayName(proposedPlan?.hotel?.name) === hName && !isHotelSelfArranged;
                                            const perPaxNightCost = totalPax > 0 ? Math.round(price / totalPax) : price;

                                            return (
                                                <div key={h.service_id || h.id} style={{ padding: '14px 16px', borderRadius: '10px', border: isCurrent ? '2px solid #2563eb' : '1px solid #e2e8f0', background: isCurrent ? '#eff6ff' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ flex: 1, paddingRight: '16px' }}>
                                                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>{hName}</strong>
                                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                                            {h.description || 'Tiêu chuẩn phòng tiện nghi, bao gồm bữa sáng'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', marginTop: '4px' }}>
                                                            ~{formatMoney(perPaxNightCost)} đ/khách/đêm {durationNights > 1 && `• Cả tour (${durationNights} đêm): ~${formatMoney(perPaxNightCost * durationNights)} đ/khách`}
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                                                            {formatMoney(price)} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>đ/đêm</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleSelectHotel(h)}
                                                            style={{ marginTop: '6px', padding: '7px 14px', background: isCurrent ? '#2563eb' : '#f8fafc', color: isCurrent ? '#fff' : '#1e293b', border: isCurrent ? 'none' : '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                                                        >
                                                            {isCurrent ? 'Đang áp dụng' : 'Chọn khách sạn'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL THÊM ĐIỂM THAM QUAN ================= */}
            {activeModal === 'places' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>🎫 Thêm Điểm Tham Quan</h3>
                                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                    Kho danh lam thắng cảnh tại <strong>{selectedReq.destination}</strong>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                    placeholder="Tìm kiếm điểm tham quan theo tên..."
                                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {isCatalogLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Đang tải danh sách điểm tham quan...</div>
                            ) : (
                                <>
                                    {catalog.places && catalog.places
                                        .filter(p => (p.name || '').toLowerCase().includes(modalSearch.toLowerCase()))
                                        .map(p => {
                                            const isSelected = currentPlaces.some(cp => cp.place_id === p.place_id || cp.name === p.name);
                                            const ticket = Number(p.ticket_price || p.price) || 0;

                                            return (
                                                <div key={p.place_id || p.id} style={{ padding: '12px 16px', borderRadius: '10px', border: isSelected ? '1px solid #86efac' : '1px solid #e2e8f0', background: isSelected ? '#f0fdf4' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>📍 {p.name}</strong>
                                                            {p.category && (
                                                                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                                                                    {p.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                            {p.description ? p.description.substring(0, 90) + '...' : 'Điểm đến hấp dẫn không thể bỏ lỡ'}
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: '700', color: ticket > 0 ? '#059669' : '#64748b' }}>
                                                            {ticket > 0 ? `${formatMoney(ticket)} đ` : 'Miễn phí'}
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddPlace(p)}
                                                            disabled={isSelected}
                                                            style={{ padding: '6px 14px', background: isSelected ? '#e2e8f0' : '#2563eb', color: isSelected ? '#94a3b8' : '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: isSelected ? 'not-allowed' : 'pointer' }}
                                                        >
                                                            {isSelected ? 'Đã thêm' : '+ Thêm'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL CHỈNH SỬA ĐIỂM ĐÓN ================= */}
            {activeModal === 'pickup' && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>📍 Điều Chỉnh Điểm Đón & Giờ Khởi Hành</h3>
                            <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Địa điểm đón khách:</label>
                                <input
                                    type="text"
                                    value={pickupEditData.location}
                                    onChange={(e) => setPickupEditData({ ...pickupEditData, location: e.target.value })}
                                    placeholder="Ví dụ: Sân bay Phú Quốc, Khách sạn trung tâm..."
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Thời gian đón khách:</label>
                                <input
                                    type="time"
                                    value={pickupEditData.time}
                                    onChange={(e) => setPickupEditData({ ...pickupEditData, time: e.target.value })}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Lý do điều chỉnh (Hiển thị cho khách):</label>
                                <input
                                    type="text"
                                    value={pickupEditData.reason}
                                    onChange={(e) => setPickupEditData({ ...pickupEditData, reason: e.target.value })}
                                    placeholder="Ví dụ: Điểm đón thuận tiện theo lịch trình di chuyển..."
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleSavePickup(pickupEditData.location, pickupEditData.time, pickupEditData.reason)}
                                    style={{ padding: '8px 18px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL SỬA LÝ DO ĐIỀU CHỈNH ================= */}
            {activeModal === 'reason' && reasonModalData && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>{reasonModalData.title}</h3>
                            <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Chọn nhanh lý do mẫu:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {reasonModalData.suggestions.map((sug, sIdx) => (
                                    <button
                                        key={sIdx}
                                        type="button"
                                        onClick={() => setReasonModalData({ ...reasonModalData, currentReason: sug })}
                                        style={{ background: reasonModalData.currentReason === sug ? '#eff6ff' : '#f8fafc', border: reasonModalData.currentReason === sug ? '1px solid #3b82f6' : '1px solid #cbd5e1', color: reasonModalData.currentReason === sug ? '#1d4ed8' : '#475569', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}
                                    >
                                        + {sug}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nội dung lý do (Khách hàng sẽ đọc):</label>
                            <textarea
                                rows={3}
                                value={reasonModalData.currentReason}
                                onChange={(e) => setReasonModalData({ ...reasonModalData, currentReason: e.target.value })}
                                placeholder="Nhập lý do điều chỉnh rõ ràng, lịch sự..."
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                            <button
                                onClick={() => setActiveModal(null)}
                                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (reasonModalData.onSave) {
                                        reasonModalData.onSave(reasonModalData.currentReason);
                                    }
                                    setActiveModal(null);
                                }}
                                style={{ padding: '8px 18px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Lưu lý do
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL XEM BẢN THIẾT KẾ TOUR CHI TIẾT ================= */}
            {viewingDesignReq && (() => {
                try {
                    let prefs = {};
                    if (typeof viewingDesignReq.preferences === 'string') {
                        try { prefs = JSON.parse(viewingDesignReq.preferences); } catch(e){}
                    } else if (typeof viewingDesignReq.preferences === 'object') {
                        prefs = viewingDesignReq.preferences || {};
                    }
                    
                    const hotelReq = cleanHotelDisplayName(prefs.hotelName || prefs.accommodation || '');
                    const transportReq = prefs.transportName || prefs.transport || '';
                    const noteReq = prefs.notes || prefs.note || '';
                    const budget = viewingDesignReq.budget || 0;

                    let parsedItinerary = null;
                    const rawItin = viewingDesignReq.proposed_itinerary || viewingDesignReq.design_data || viewingDesignReq.itinerary;
                    try {
                        parsedItinerary = typeof rawItin === 'string' 
                            ? JSON.parse(rawItin) 
                            : rawItin;
                    } catch(e){}

                    const days = parsedItinerary?.days || [];
                    const costConfig = parsedItinerary?.costConfig || {};
                    const totalDays = days.length || Math.max(1, Math.round((new Date(viewingDesignReq.return_date || Date.now()) - new Date(viewingDesignReq.departure_date || Date.now())) / (1000 * 60 * 60 * 24)) + 1);

                    const pA = prefs.participantBreakdown?.adults || viewingDesignReq.people_count || costConfig.minimumPax || 1;
                    const pC = prefs.participantBreakdown?.children || 0;
                    const pT = prefs.participantBreakdown?.toddlers || 0;
                    const pI = prefs.participantBreakdown?.infants || 0;

                    const sC = costConfig.ageMultiplier?.child || { percent: 75, fixed_surcharge: 0 };
                    const sT = costConfig.ageMultiplier?.toddler || { percent: 50, fixed_surcharge: 0 };
                    const sI = costConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                    const prA = Number(viewingDesignReq.quoted_price || viewingDesignReq.quote_price || costConfig.manualSellingPrice || costConfig.calculatedSellingPrice || 0);
                    const prC = (prA * (sC.percent || 0) / 100) + Number(sC.fixed_surcharge || 0);
                    const prT = (prA * (sT.percent || 0) / 100) + Number(sT.fixed_surcharge || 0);
                    const prI = (prA * (sI.percent || 0) / 100) + Number(sI.fixed_surcharge || 0);

                    const totalA = pA * prA;
                    const totalC = pC * prC;
                    const totalT = pT * prT;
                    const totalI = pI * prI;
                    const grandTotalRevenue = totalA + totalC + totalT + totalI;

                    const costA = Number(viewingDesignReq.base_cost || costConfig.netCost || 0);
                    const costC = costA * (sC.percent || 0) / 100;
                    const costT = costA * (sT.percent || 0) / 100;
                    const costI = costA * (sI.percent || 0) / 100;
                    const grandTotalCost = (pA * costA) + (pC * costC) + (pT * costT) + (pI * costI);
                    const grandTotalProfit = grandTotalRevenue - grandTotalCost;

                    let autoAccommodationCost = 0;
                    let autoTicketsCost = 0;
                    let includedBreakfast = 0;
                    let includedLunch = 0;
                    let includedDinner = 0;

                    days.forEach(day => {
                        if (day?.accommodation && day.accommodation.price) autoAccommodationCost += Number(day.accommodation.price);
                        if (day?.meals?.breakfast === true || day?.meals?.breakfast === 'external') includedBreakfast++;
                        if (day?.meals?.lunch === true || day?.meals?.lunch === 'external') includedLunch++;
                        if (day?.meals?.dinner === true || day?.meals?.dinner === 'external') includedDinner++;
                        if (Array.isArray(day?.activities)) {
                            day.activities.forEach(act => {
                                if (act && act.price) autoTicketsCost += Number(act.price || 0);
                            });
                        }
                    });

                    const accommodationPerPax = autoAccommodationCost / 2;
                    const selectedTransport = costConfig.selectedTransport || parsedItinerary?.proposedServices?.transport;
                    let fixedTransport = Number(costConfig.fixed?.transport || 0);
                    if (!fixedTransport && selectedTransport) {
                        const dailyRate = Number(
                            selectedTransport.base_cost || 
                            selectedTransport.price || 
                            selectedTransport.pricePerDay || 
                            selectedTransport.assignedVehicle?.base_cost || 
                            selectedTransport.assignedVehicle?.price || 
                            parsedItinerary?.adjTransportCost || 
                            0
                        );
                        if (dailyRate > 0) {
                            fixedTransport = dailyRate * totalDays;
                        }
                    }
                    const variableTickets = autoTicketsCost + Number(costConfig.variable?.tickets || 0);

                    const countBreakfast = costConfig.variable?.countBreakfast !== undefined ? Number(costConfig.variable.countBreakfast) : includedBreakfast;
                    const countLunch = costConfig.variable?.countLunch !== undefined ? Number(costConfig.variable.countLunch) : includedLunch;
                    const countDinner = costConfig.variable?.countDinner !== undefined ? Number(costConfig.variable.countDinner) : includedDinner;

                    const firstDay = days[0] || {};
                    const lastDay = days[days.length - 1] || {};
                    const startDay1 = firstDay.start_destination_id || 'Điểm xuất phát';
                    const endDay1 = firstDay.end_destination_id || viewingDesignReq.destination || 'Điểm đến';
                    const startLastDay = lastDay.start_destination_id || endDay1;
                    const endLastDay = lastDay.end_destination_id || startDay1;

                    const transportName = formatVehicleDisplayName(selectedTransport) || 'Phương tiện theo đoàn';

                    const defaultImg = 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

                    return (
                        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                            <div style={{ background: '#fff', borderRadius: '16px', width: '95%', maxWidth: '1240px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
                                {/* HEADER */}
                                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                            Bản thiết kế tour: {viewingDesignReq.destination} (#{viewingDesignReq.request_id})
                                        </h3>
                                        <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                            {viewingDesignReq.status === 'Pending_Manager_Approval' ? '⏳ Chờ sếp duyệt' : (viewingDesignReq.status === 'Manager_Approved' ? '✅ Đã duyệt' : viewingDesignReq.status)}
                                        </span>
                                    </div>
                                    <button onClick={() => setViewingDesignReq(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* BODY 2 CỘT */}
                                <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
                                    {!parsedItinerary || (!parsedItinerary.days && !parsedItinerary.costConfig) ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                            Chưa có dữ liệu bản thiết kế chi tiết.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '24px' }}>
                                            {/* CỘT TRÁI: THÔNG TIN & LỊCH TRÌNH */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {/* THÔNG TIN CHUNG */}
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Khách hàng</div>
                                                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{viewingDesignReq.customer_name || 'Khách vãng lai'}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Ngày khởi hành</div>
                                                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{viewingDesignReq.departure_date ? new Date(viewingDesignReq.departure_date).toLocaleDateString('vi-VN') : '---'}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Số lượng khách</div>
                                                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{viewingDesignReq.people_count || 1} người</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Ngân sách dự kiến</div>
                                                            <div style={{ fontWeight: '700', color: '#ea580c', fontSize: '14px' }}>{formatMoney(budget)} đ</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '6px' }}>Yêu cầu từ khách hàng:</div>
                                                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155' }}>
                                                            {hotelReq && <li><strong>Khách sạn:</strong> {cleanHotelDisplayName(hotelReq)}</li>}
                                                            {transportReq && <li><strong>Di chuyển:</strong> {formatVehicleDisplayName(transportReq)}</li>}
                                                            <li>
                                                                <strong>Hướng dẫn viên:</strong>{' '}
                                                                <span style={{ fontWeight: '600', color: (prefs.guide && (prefs.guide.includes('tự túc') || prefs.guide.includes('Không'))) ? '#64748b' : '#0284c7' }}>
                                                                    {prefs.guide || (prefs.guideMode === 'company' ? 'Cần Hướng dẫn viên' : (prefs.guideMode === 'self' ? 'Khách tự túc' : 'Theo thỏa thuận'))}
                                                                </span>
                                                            </li>
                                                            <li>
                                                                <strong>Ăn uống:</strong>{' '}
                                                                <span style={{ fontWeight: '600', color: (prefs.meal && (prefs.meal.includes('tự túc') || prefs.meal.includes('Không'))) ? '#64748b' : '#059669' }}>
                                                                    {prefs.meal || (prefs.mealMode === 'company' ? 'Công ty tự sắp xếp' : (prefs.mealMode === 'self' ? 'Khách tự túc' : 'Theo thỏa thuận'))}
                                                                </span>
                                                            </li>
                                                            {noteReq && <li><strong>Ghi chú:</strong> {noteReq}</li>}
                                                        </ul>
                                                    </div>
                                                </div>

                                                {/* TIÊU ĐỀ TOUR & MÔ TẢ */}
                                                {parsedItinerary.tourName && (
                                                    <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#1d4ed8', marginBottom: '4px' }}>
                                                            📌 {parsedItinerary.tourName}
                                                        </div>
                                                        {parsedItinerary.tourDescription && (
                                                            <div style={{ fontSize: '13.5px', color: '#1e40af', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                                                                {parsedItinerary.tourDescription}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* LỊCH TRÌNH TỪNG NGÀY */}
                                                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                                                    🗺️ Lịch trình chi tiết ({days.length} ngày)
                                                </div>

                                                {days.map((day) => {
                                                    const userUploadedImg = parsedItinerary.dayImages?.[day?.dayIndex];
                                                    const imageUrl = userUploadedImg 
                                                        ? (userUploadedImg.startsWith('/') ? `http://localhost:5000${userUploadedImg}` : userUploadedImg)
                                                        : defaultImg;

                                                    return (
                                                        <div key={day?.dayIndex || Math.random()} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                            <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                                                                <img src={imageUrl} alt={`Ngày ${day?.dayIndex}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '18px 16px 10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>NGÀY {day?.dayIndex} {day?.route_title ? `- ${day.route_title}` : ''}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                {Array.isArray(day?.activities) && day.activities.length > 0 && (
                                                                    <div>
                                                                        <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>🎯 Điểm tham quan / Hoạt động:</div>
                                                                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: '#334155' }}>
                                                                            {day.activities.map((act, i) => (
                                                                                <li key={i}>{act?.name} {act?.notes ? `(${act.notes})` : ''}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {(day?.accommodation?.name || (typeof day?.accommodation === 'string' && day.accommodation)) && (
                                                                    <div>
                                                                        <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>🏨 Lưu trú:</div>
                                                                        <div style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '600' }}>
                                                                            {cleanHotelDisplayName(typeof day.accommodation === 'string' ? day.accommodation : day.accommodation?.name)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {day?.meals && (
                                                                    <div>
                                                                        <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>🍽️ Bữa ăn:</div>
                                                                        <div style={{ fontSize: '13px', color: '#334155' }}>
                                                                            {[
                                                                                day.meals.breakfast ? (day.meals.breakfast === 'external' ? 'Sáng (Tự túc)' : 'Sáng') : null,
                                                                                day.meals.lunch ? (day.meals.lunch === 'external' ? 'Trưa (Tự túc)' : 'Trưa') : null,
                                                                                day.meals.dinner ? (day.meals.dinner === 'external' ? 'Tối (Tự túc)' : 'Tối') : null
                                                                            ].filter(Boolean).join(', ')}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {parsedItinerary.staffNote && (
                                                    <div style={{ background: '#fefce8', padding: '14px 16px', borderRadius: '10px', border: '1px dashed #eab308' }}>
                                                        <div style={{ fontSize: '13px', color: '#a16207', fontWeight: '700', marginBottom: '4px' }}>Ghi chú từ Nhân viên thiết kế:</div>
                                                        <div style={{ fontSize: '13.5px', color: '#854d0e', whiteSpace: 'pre-line' }}>{parsedItinerary.staffNote}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* CỘT PHẢI: BẢNG KÊ TÀI CHÍNH */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>📊 Bảng kê Tài chính & Dịch vụ</div>

                                                {/* Block Phương tiện */}
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                                                        🚗 Phương tiện chính: {transportName}
                                                    </div>

                                                    {costConfig.transportTimes && (
                                                        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '8px' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Chuyến đi</div>
                                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7' }}>
                                                                    {costConfig.transportTimes.startD || '05:30'} ➔ {costConfig.transportTimes.endD || '12:00'}
                                                                </div>
                                                            </div>
                                                            <div style={{ width: '1px', background: '#e2e8f0' }}></div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Chuyến về</div>
                                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7' }}>
                                                                    {costConfig.transportTimes.startR || '12:00'} ➔ {costConfig.transportTimes.endR || '17:30'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Block Định phí */}
                                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                                                        🔒 Định phí (Cố định toàn tour)
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền xe nguyên chuyến:</span> <strong>{formatMoney(fixedTransport)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền Hướng dẫn viên:</span> <strong>{formatMoney((costConfig.fixed?.guidePerDay || 0) * totalDays)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Phí cố định khác:</span> <strong>{formatMoney(costConfig.fixed?.otherFixed)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '12px', color: '#64748b' }}>Chia đều cho {pA} khách</span>
                                                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatMoney((fixedTransport + ((costConfig.fixed?.guidePerDay || 0) * totalDays) + Number(costConfig.fixed?.otherFixed || 0)) / Math.max(1, pA))} đ/khách</strong>
                                                    </div>
                                                </div>

                                                {/* Block Biến phí */}
                                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                                                        👤 Biến phí (Chi phí / 1 khách)
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền Lưu trú (Chia 2):</span> <strong>{formatMoney(accommodationPerPax)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Vé tham quan, khác:</span> <strong>{formatMoney(variableTickets)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền ăn ({countBreakfast + countLunch + countDinner} bữa):</span> <strong>{formatMoney((countBreakfast * (costConfig.variable?.breakfast || 0)) + (countLunch * (costConfig.variable?.lunch || 0)) + (countDinner * (costConfig.variable?.dinner || 0)))} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Bảo hiểm & Phụ phí:</span> <strong>{formatMoney(costConfig.variable?.insurance)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '12px', color: '#64748b' }}>Tổng biến phí / khách</span>
                                                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatMoney(accommodationPerPax + (countBreakfast * (costConfig.variable?.breakfast || 0)) + (countLunch * (costConfig.variable?.lunch || 0)) + (countDinner * (costConfig.variable?.dinner || 0)) + variableTickets + Number(costConfig.variable?.insurance || 0))} đ/khách</strong>
                                                    </div>
                                                </div>

                                                {/* Tổng kết Giá */}
                                                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13.5px', color: '#166534' }}>
                                                        <span>Giá vốn cơ bản / khách:</span> <strong>{formatMoney(costA)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px', color: '#166534' }}>
                                                        <span>Biên lợi nhuận:</span> <strong style={{ color: '#059669' }}>{costConfig.margin || 20}%</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px', color: '#166534' }}>
                                                        <span>Giá bán / 1 khách:</span> <strong>{formatMoney(prA)} đ / khách</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #86efac', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '14.5px', color: '#14532d', fontWeight: '800' }}>TỔNG GIÁ TOUR ({pA + pC + pT + pI} khách):</span>
                                                        <strong style={{ fontSize: '20px', color: '#15803d' }}>{formatMoney(grandTotalRevenue)} đ</strong>
                                                    </div>
                                                </div>

                                                {/* Phân tích tài chính toàn đoàn */}
                                                <h4 style={{ margin: '16px 0 8px 0', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>💰 Phân tích theo nhóm khách</h4>
                                                
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '15px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                                                    <thead>
                                                        <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                                                            <th style={{ padding: '8px 10px', borderBottom: '2px solid #cbd5e1' }}>Loại</th>
                                                            <th style={{ padding: '8px 10px', borderBottom: '2px solid #cbd5e1' }}>SL</th>
                                                            <th style={{ padding: '8px 10px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Giá bán</th>
                                                            <th style={{ padding: '8px 10px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Tổng thu</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pA > 0 && <tr>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Người lớn</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>{pA}</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>{formatMoney(prA)}</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{formatMoney(totalA)}</td>
                                                        </tr>}
                                                        {pC > 0 && <tr>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Trẻ em</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>{pC}</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>{formatMoney(prC)}</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{formatMoney(totalC)}</td>
                                                        </tr>}
                                                        {pT > 0 && <tr>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Trẻ nhỏ</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>{pT}</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>{formatMoney(prT)}</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{formatMoney(totalT)}</td>
                                                        </tr>}
                                                        {pI > 0 && <tr>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>Em bé</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>{pI}</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>{formatMoney(prI)}</td>
                                                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{formatMoney(totalI)}</td>
                                                        </tr>}
                                                    </tbody>
                                                </table>
                                                
                                                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng Vốn (Toàn đoàn)</span>
                                                        <span style={{ fontWeight: '600', color: '#ef4444', fontSize: '15px' }}>{formatMoney(grandTotalCost)} đ</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng Doanh Thu (Toàn đoàn)</span>
                                                        <span style={{ fontWeight: '700', color: '#16a34a', fontSize: '16px' }}>{formatMoney(grandTotalRevenue)} đ</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                                                        <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Lợi nhuận dự kiến</span>
                                                        <span style={{ fontWeight: '700', color: '#3b82f6', fontSize: '16px' }}>{formatMoney(grandTotalProfit)} đ</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* FOOTER BUTTONS */}
                                <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
                                    <button
                                        onClick={() => setViewingDesignReq(null)}
                                        style={{ padding: '9px 18px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        Đóng
                                    </button>
                                    {viewingDesignReq.status === 'Manager_Approved' && (
                                        <button
                                            onClick={() => handleSendToCustomer(viewingDesignReq)}
                                            style={{ padding: '9px 18px', background: '#16a34a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Send size={15} />
                                            <span>Gửi khách hàng</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            const reqToEdit = viewingDesignReq;
                                            setViewingDesignReq(null);
                                            if (onStartDesign) {
                                                onStartDesign(reqToEdit);
                                            }
                                        }}
                                        style={{ padding: '9px 18px', background: '#2563eb', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Edit3 size={15} />
                                        <span>Mở phòng thiết kế</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                } catch (err) {
                    console.error("Error rendering viewingDesignReq modal:", err);
                    return (
                        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                                <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Không thể hiển thị bản thiết kế</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>{err.message || 'Đã xảy ra lỗi khi tải dữ liệu thiết kế.'}</p>
                                <button onClick={() => setViewingDesignReq(null)} style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    );
                }
            })()}
</div>
    );
};

export default StaffTourRequestManager;
