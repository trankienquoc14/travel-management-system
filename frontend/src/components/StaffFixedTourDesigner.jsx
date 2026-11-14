
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimelineBuilder from './TourBuilder/TimelineBuilder';
import { formatVehicleDisplayName } from '../utils/vehicleDisplayHelper';
import { 
    Search, 
    Filter, 
    Plus, 
    Edit3, 
    Clock, 
    MapPin, 
    LayoutGrid, 
    List, 
    RotateCcw, 
    ChevronLeft, 
    ChevronRight, 
    X,
    Calendar,
    Tag,
    AlertCircle
} from 'lucide-react';
export const formatMoneyLocal = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    return Number(amount).toLocaleString('vi-VN');
};

export const getInitialCostConfig = () => ({
    minimumPax: 15,
    margin: 20,
    fixed: { transport: 0, guidePerDay: 500000, otherFixed: 0 },
    variable: { 
        transportTicket: 0, 
        accommPerNight: 0, 
        singleSupplement: 0, 
        breakfast: 0, 
        lunch: 0, 
        dinner: 0, 
        tickets: 0, 
        insurance: 50000 
    },
    ageMultiplier: { 
        child: { percent: 75, fixed_surcharge: 0 }, 
        toddler: { percent: 50, fixed_surcharge: 0 },
        infant: { percent: 0, fixed_surcharge: 500000 },
        preset: 'custom'
    },
    selectedTransport: null,
    transportTimes: { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' },
    transportLocations: { startD: '', endD: '', startR: '', endR: '' }
});

const StaffFixedTourDesigner = ({ editTourData }) => {
    const [tours, setTours] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Core states
    const [formData, setFormData] = useState({
        tour_id: null,
        tour_name: '',
        description: '',
        destination: '',
        image: null,
        image_url: '', categories: [], highlights: '' });

    // Multi-destination Routing State
    const [dayImages, setDayImages] = useState({});
    const [dayImagePreviews, setDayImagePreviews] = useState({});
    const [filterProv, setFilterProv] = useState('All'); // Lọc theo tỉnh
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('latest');
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const [days, setDays] = useState([
        { dayIndex: 1, start_destination_id: '', end_destination_id: '', route_title: '', activities: [] }
    ]);

    // Costing State
    const [costConfig, setCostConfig] = useState(getInitialCostConfig());

    // Resources
    const [destinations, setDestinations] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [transportServices, setTransportServices] = useState([]);


    const fetchTours = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/tours/staff/tours', { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setTours(res.data.data || []);
        } catch (error) { 
            console.error('Lỗi tải danh sách tour:', error); 
        } finally {
            setLoading(false);
        }
    };

    const fetchDestinations = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/destinations", { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setDestinations(res.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchTransportServices = async () => {
        try {
            const token = localStorage.getItem("token");
            const [resServ, resFleet] = await Promise.all([
                axios.get("http://localhost:5000/api/services", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false } })),
                axios.get("http://localhost:5000/api/tours/fleet/vehicles", { headers: { Authorization: `Bearer ${token}` } }).catch(() => 
                    axios.get("http://localhost:5000/api/tours/fleet/public-vehicles", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false } }))
                )
            ]);

            let transports = [];

            // 1. Lấy danh sách xe thực tế đang hoạt động từ Quản lý đội xe của hệ thống (bảng vehicles)
            if (resFleet?.data?.success && Array.isArray(resFleet.data.data)) {
                transports = resFleet.data.data
                    .filter(v => v.status !== 'MAINTENANCE' && v.status !== 'REPAIR' && v.status !== 'INACTIVE')
                    .map(v => {
                        const seats = v.seat_capacity || v.capacity || 4;
                        const plate = v.license_plate ? ` (${v.license_plate})` : '';
                        return {
                            service_id: `fleet_${v.vehicle_id}`,
                            vehicle_id: v.vehicle_id,
                            service_name: `${v.vehicle_name}${plate}`,
                            displayName: `${v.vehicle_name}${plate} - ${seats} chỗ`,
                            base_cost: Number(v.base_cost ?? v.price ?? v.selling_price ?? 0),
                            capacity: seats,
                            seat_capacity: seats,
                            service_type: 'Xe vận chuyển',
                            unit: 'ngày',
                            license_plate: v.license_plate
                        };
                    });
            }

            // 2. Lấy thêm dịch vụ vé máy bay hoặc phương tiện đường không từ bảng services
            if (resServ?.data?.success && Array.isArray(resServ.data.data)) {
                setAllServices(resServ.data.data);
                const flightServices = resServ.data.data.filter(s => {
                    return s.service_type === 'Vé máy bay' || (s.service_name && s.service_name.toLowerCase().includes('máy bay'));
                }).map(s => {
                    const seats = s.capacity || s.seat_capacity || 0;
                    return {
                        ...s,
                        displayName: `${s.service_name}${seats ? ` (${seats} chỗ)` : ''}`
                    };
                });
                transports = [...transports, ...flightServices];
            }

            // Fallback an toàn nếu chưa tải được bảng đội xe
            if (transports.length === 0 && resServ?.data?.success && Array.isArray(resServ.data.data)) {
                transports = resServ.data.data.filter(s => 
                    (s.vehicle_service_id !== null && s.vehicle_service_id !== undefined) ||
                    s.service_type === 'Xe vận chuyển' ||
                    s.service_type === 'Vé máy bay' ||
                    s.service_type === 'Phương tiện' ||
                    s.service_type === 'Transport'
                );
            }

            transports.sort((a, b) => Number(a.capacity || a.seat_capacity || 0) - Number(b.capacity || b.seat_capacity || 0));
            setTransportServices(transports);
        } catch (error) { console.error('Lỗi tải danh sách phương tiện', error); }
    };

    // Auto-calculators
    const totalDays = days.length;
    const totalNights = Math.max(0, totalDays - 1);
    
    // Auto compute tickets and accommodations
    let autoTicketsCost = 0;
    let autoAccommodationCost = 0;
    let includedBreakfast = 0;
    let includedLunch = 0;
    let includedDinner = 0;

    days.forEach(day => {
        if (day.meals?.breakfast === true || day.meals?.breakfast === 'external') includedBreakfast++;
        if (day.meals?.lunch === true || day.meals?.lunch === 'external') includedLunch++;
        if (day.meals?.dinner === true || day.meals?.dinner === 'external') includedDinner++;
        
        if (day.accommodation && day.accommodation.price) {
            autoAccommodationCost += Number(day.accommodation.price);
        }

        if (day.activities) {
            day.activities.forEach(act => {
                if (act.type === 'Tham quan') autoTicketsCost += Number(act.price || 0);
            });
        }
    });

    const defaultBreakfast = includedBreakfast;
    const defaultLunch = includedLunch;
    const defaultDinner = includedDinner;

    const countBreakfast = costConfig.variable.countBreakfast !== undefined && costConfig.variable.countBreakfast !== '' ? Number(costConfig.variable.countBreakfast) : defaultBreakfast;
    const countLunch = costConfig.variable.countLunch !== undefined && costConfig.variable.countLunch !== '' ? Number(costConfig.variable.countLunch) : defaultLunch;
    const countDinner = costConfig.variable.countDinner !== undefined && costConfig.variable.countDinner !== '' ? Number(costConfig.variable.countDinner) : defaultDinner;

    // Pricing & Break-Even Math
    const totalFixed = Number(costConfig.fixed.transport || 0) + (Number(costConfig.fixed.guidePerDay || 0) * totalDays) + Number(costConfig.fixed.otherFixed || 0);
    const targetMinPax = Math.max(1, Number(costConfig.minimumPax || 1));
    const fixedPerPax = targetMinPax > 0 ? totalFixed / targetMinPax : 0;
    
    const finalTicketsCost = autoTicketsCost;

    const totalVariable = (autoAccommodationCost / 2) 
        + Number(costConfig.variable.transportTicket || 0)
        + (Number(costConfig.variable.breakfast || 0) * countBreakfast)
        + (Number(costConfig.variable.lunch || 0) * countLunch)
        + (Number(costConfig.variable.dinner || 0) * countDinner)
        + finalTicketsCost 
        + Number(costConfig.variable.insurance || 0);
        
    const netCost = fixedPerPax + totalVariable;
    const sellingPrice = netCost * (1 + Number(costConfig.margin || 0) / 100);

    const contributionMargin = sellingPrice - totalVariable;
    const calculatedBreakEvenPax = (totalFixed > 0 && contributionMargin > 0)
        ? Math.ceil(totalFixed / contributionMargin)
        : (totalFixed === 0 ? 0 : Infinity);

    useEffect(() => {
        if (costConfig.selectedTransport) {
            const s = costConfig.selectedTransport;
            const isTicket = s.unit && (s.unit.toLowerCase().includes('vé') || s.unit.toLowerCase().includes('người'));
            if (!isTicket) {
                setCostConfig(prev => ({
                    ...prev,
                    fixed: { ...prev.fixed, transport: Number(s.base_cost) * days.length }
                }));
            }
        }
    }, [days.length, costConfig.selectedTransport]);

    const handleTransportChange = (e) => {
        const sid = e.target.value;
        if (!sid) {
            setCostConfig({...costConfig, 
                selectedTransport: null,
                fixed: { ...costConfig.fixed, transport: 0 },
                variable: { ...costConfig.variable, transportTicket: 0 },
                transportTimes: costConfig.transportTimes || { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' },
                transportLocations: costConfig.transportLocations || { startD: '', endD: '', startR: '', endR: '' }
            });
            return;
        }
        const s = transportServices.find(x => String(x.service_id) === String(sid));
        const isTicket = s && ((s.unit && (s.unit.toLowerCase().includes('vé') || s.unit.toLowerCase().includes('người'))) || s.service_type === 'Vé máy bay');
        
        setCostConfig({...costConfig, 
            selectedTransport: s || null,
            fixed: { ...costConfig.fixed, transport: (!isTicket && s) ? Number(s.base_cost) * days.length : 0 },
            variable: { ...costConfig.variable, transportTicket: (isTicket && s) ? Number(s.base_cost) : 0 },
            transportTimes: costConfig.transportTimes || { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' },
            transportLocations: costConfig.transportLocations || { startD: '', endD: '', startR: '', endR: '' }
        });
    };

    const handleSave = async () => {
        // --- RÀNG BUỘC KIỂM TRA DỮ LIỆU NHẬP ---
        // 1. Ràng buộc Tên Tour
        if (!formData.tour_name || formData.tour_name.trim().length < 5) {
            return alert("⚠️ Vui lòng nhập Tên Tour (tối thiểu 5 ký tự)!");
        }

        // 2. Ràng buộc Lịch trình các ngày
        if (!days || days.length === 0) {
            return alert("⚠️ Lịch trình tour phải có ít nhất 1 ngày!");
        }

        // 3. Ràng buộc Số khách hòa vốn
        if (Number(costConfig.minimumPax || 0) < 1) {
            return alert("⚠️ Số khách tối thiểu (Điểm hòa vốn) phải từ 1 khách trở lên!");
        }

        // 4. Ràng buộc Giá bán người lớn
        const finalSellingPrice = Number(sellingPrice);
        if (isNaN(finalSellingPrice) || finalSellingPrice <= 0) {
            return alert("⚠️ Giá bán dự kiến (người lớn) phải lớn hơn 0 đ!");
        }

        // 5. Cảnh báo bán dưới giá vốn (Cảnh báo lỗ)
        if (finalSellingPrice < netCost) {
            const confirmBelowCost = window.confirm(
                `⚠️ Cảnh báo: Giá bán đề xuất (${Math.round(finalSellingPrice).toLocaleString('vi-VN')} đ) thấp hơn Giá vốn (${Math.round(netCost).toLocaleString('vi-VN')} đ).\nBán dưới giá vốn có thể gây lỗ. Bạn có chắc chắn muốn tiếp tục lưu và gửi Quản lý phê duyệt không?`
            );
            if (!confirmBelowCost) return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const design_data = JSON.stringify({ 
                days, 
                costConfig, 
                computed: { 
                    netCost, 
                    sellingPrice, 
                    totalDays, 
                    totalNights, 
                    totalMeals: { breakfast: countBreakfast, lunch: countLunch, dinner: countDinner }, 
                    autoTicketsCost,
                    breakEvenPax: isFinite(calculatedBreakEvenPax) ? calculatedBreakEvenPax : null,
                    totalFixed,
                    totalVariable
                }, 
                categories: formData.categories, 
                highlights: formData.highlights 
            });
            
            let resolvedDestName = formData.destination ? formData.destination.trim() : '';
            
            // If destination is empty or placeholder, attempt to resolve from day 1 route IDs
            if (!resolvedDestName || resolvedDestName === 'Multi-Destination' || resolvedDestName === 'Nhiều điểm đến') {
                const rawDestId = days[0]?.end_destination_id || days[0]?.start_destination_id;
                if (rawDestId) {
                    const destObj = destinations.find(x => String(x.destination_id) === String(rawDestId));
                    if (destObj) {
                        resolvedDestName = destObj.destination_name;
                    } else if (typeof rawDestId === 'string' && isNaN(Number(rawDestId))) {
                        resolvedDestName = rawDestId;
                    }
                }
            }

            // Fallback to existing tour destination if editing
            if ((!resolvedDestName || resolvedDestName === 'Multi-Destination' || resolvedDestName === 'Nhiều điểm đến') && editTourData?.destination) {
                resolvedDestName = editTourData.destination;
            }

            // Fallback default if still empty
            if (!resolvedDestName) {
                resolvedDestName = 'Chưa phân loại';
            }

            const data = new FormData();
            data.append('tour_name', formData.tour_name);
            data.append('description', formData.description);
            data.append('destination', resolvedDestName);
            data.append('duration_days', totalDays);
            data.append('base_cost', netCost);
            data.append('base_price', sellingPrice);
            data.append('markup_percent', costConfig.margin);
            data.append('design_data', design_data);
            data.append('is_custom', 0); // Fixed Tour
            
            if (formData.image) {
                data.append('image', formData.image);
            }
            if (formData.image_url) {
                data.append('existing_image_url', formData.image_url);
            }

            Object.keys(dayImages).forEach(dIndex => {
                data.append(`dayImage_${dIndex}`, dayImages[dIndex]);
            });

            const existingDayImages = {};
            Object.keys(dayImagePreviews || {}).forEach(k => {
                if (dayImagePreviews[k] && dayImagePreviews[k].startsWith('/')) {
                    existingDayImages[k] = dayImagePreviews[k];
                }
            });
            data.append('existing_day_images', JSON.stringify(existingDayImages));

            if (formData.tour_id) data.append('tour_id', formData.tour_id);

            const url = formData.tour_id 
                ? `http://localhost:5000/api/tours/staff/tours/${formData.tour_id}`
                : 'http://localhost:5000/api/tours/staff/tours';
            const method = formData.tour_id ? 'put' : 'post';

            const res = await axios[method](url, data, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                alert(formData.tour_id ? 'Cập nhật thành công!' : 'Tạo Tour thành công!');
                setIsEditing(false);
                fetchTours();
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi khi lưu!");
        } finally {
            setLoading(false);
        }
    };

    const handleEditTour = async (tour) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/tours/staff/tours/${tour.tour_id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                const tourData = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
                setFormData({
                    tour_id: tourData.tour_id,
                    tour_name: tourData.tour_name,
                    description: tourData.description,
                    destination: tourData.destination || '',
                    image: null,
                    image_url: tourData.image_url, 
                    categories: [], 
                    highlights: '' 
                });
                try {
                    const parsed = typeof tourData.design_data === 'string' ? JSON.parse(tourData.design_data) : tourData.design_data;
                    if (parsed && parsed.dayImages) setDayImagePreviews(parsed.dayImages);
                } catch(e) {}
                
                if (tourData.design_data) {
                    try {
                        const parsed = typeof tourData.design_data === 'string' ? JSON.parse(tourData.design_data) : tourData.design_data;
                        if (parsed.categories) setFormData(prev => ({...prev, categories: parsed.categories}));
                        if (parsed.highlights) setFormData(prev => ({...prev, highlights: parsed.highlights}));
                        if (parsed.days || parsed.itinerary) {
                            const rawDays = parsed.days || parsed.itinerary || [];
                            setDays(rawDays.map((d, i) => {
                                let accomm = null;
                                if (d.accommodation) {
                                    accomm = {
                                        service_id: d.accommodation.service_id !== undefined ? d.accommodation.service_id : (d.hotel_id || 'existing'),
                                        name: d.accommodation.name || d.accommodation.hotel || d.accommodation.hotel_name || 'Khách sạn',
                                        price: d.accommodation.price !== undefined ? d.accommodation.price : (d.hotel_price || 0)
                                    };
                                } else if (d.hotel_id || d.hotel || d.hotel_name) {
                                    accomm = {
                                        service_id: d.hotel_id || 'existing',
                                        name: d.hotel || d.hotel_name || `Khách sạn (ID: ${d.hotel_id})`,
                                        price: d.hotel_price || 0
                                    };
                                } else if (parsed.fixedServices?.accommodation?.[0]) {
                                    accomm = {
                                        service_id: 'existing',
                                        name: parsed.fixedServices.accommodation[0].name,
                                        price: parsed.fixedServices.accommodation[0].price
                                    };
                                }

                                return {
                                    dayIndex: d.dayIndex || d.day || (i + 1),
                                    start_destination_id: d.start_destination_id || '',
                                    end_destination_id: d.end_destination_id || '',
                                    route_title: d.route_title || d.title || '',
                                    activities: d.activities || [],
                                    accommodation: accomm,
                                    meals: d.meals || { breakfast: false, lunch: false, dinner: false }
                                };
                            }));
                        }
                        if (parsed.costConfig) {
                            let parsedAgeMult = parsed.costConfig.ageMultiplier || {};
                            // Backward compatibility migration
                            if (typeof parsedAgeMult.child === 'number') {
                                parsedAgeMult = {
                                    child: { percent: parsedAgeMult.child, fixed_surcharge: 0 },
                                    toddler: { percent: 50, fixed_surcharge: 0 },
                                    infant: { percent: parsedAgeMult.infant || 0, fixed_surcharge: (parsedAgeMult.infant === 0 ? 500000 : 0) },
                                    preset: 'custom'
                                };
                            } else if (!parsedAgeMult.child) {
                                parsedAgeMult = getInitialCostConfig().ageMultiplier;
                            }
                            
                            const baseConfig = getInitialCostConfig();
                            const loadedMinPax = Math.max(1, Number(parsed.costConfig?.minimumPax || 1));
                            setCostConfig({
                                ...baseConfig,
                                ...parsed.costConfig,
                                minimumPax: loadedMinPax,
                                fixed: { ...baseConfig.fixed, ...(parsed.costConfig.fixed || {}) },
                                variable: { ...baseConfig.variable, ...(parsed.costConfig.variable || {}) },
                                ageMultiplier: { ...baseConfig.ageMultiplier, ...parsedAgeMult },
                                transportTimes: { ...baseConfig.transportTimes, ...(parsed.costConfig.transportTimes || {}) },
                                transportLocations: { ...baseConfig.transportLocations, ...(parsed.costConfig.transportLocations || {}) }
                            });
                        } else {
                            setCostConfig(getInitialCostConfig());
                        }
                    } catch (e) { console.error("JSON parse error:", e); }
                }
                setIsEditing(true);
            }
        } catch (error) { console.error(error); }
    };

        useEffect(() => {
        fetchTours();
        fetchDestinations();
        fetchTransportServices();
    }, []);

    useEffect(() => {
        if (editTourData && editTourData.tour_id) {
            handleEditTour(editTourData);
        }
    }, [editTourData]);

    if (!isEditing) {
        const getDestName = (tour) => {
            let destName = 'Chưa phân loại';
            if (tour.destination) {
                const destObj = destinations.find(x => String(x.destination_id) === String(tour.destination));
                if (destObj) {
                    destName = destObj.destination_name;
                } else {
                    destName = String(tour.destination).trim();
                    if (destName === 'Multi-Destination') destName = 'Nhiều điểm đến';
                }
            }
            if (destName === 'Chưa phân loại' || destName === 'Multi-Destination' || destName === 'Nhiều điểm đến') {
                try {
                    const d = typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : (tour.design_data || {});
                    if (d.days && d.days.length > 0) {
                        const firstId = d.days[0].end_destination_id || d.days[0].start_destination_id;
                        const destObj = destinations.find(x => String(x.destination_id) === String(firstId));
                        if (destObj) destName = destObj.destination_name;
                    }
                } catch(e){}
            }

            if (destName.includes('-') && !destName.startsWith('Bà Rịa')) {
                const parts = destName.split('-').map(s => s.trim());
                if (parts[0]) destName = parts[0];
            }

            return destName;
        };

        const resolveTourImage = (url) => {
            if (!url || url === 'undefined' || url === 'null') {
                return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=800';
            }
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            if (url.startsWith('/')) {
                return `http://localhost:5002${url}`;
            }
            return `http://localhost:5002/uploads/${url}`;
        };

        const getStatusBadge = (status) => {
            const s = String(status || 'Active').toLowerCase();
            if (s === 'active' || s === 'approved') {
                return {
                    label: s === 'approved' ? 'Đã duyệt' : 'Đang khai thác',
                    bg: '#ecfdf5',
                    color: '#047857',
                    border: '#a7f3d0'
                };
            }
            if (s === 'pending') {
                return {
                    label: 'Chờ duyệt',
                    bg: '#fffbeb',
                    color: '#b45309',
                    border: '#fde68a'
                };
            }
            if (s === 'inactive') {
                return {
                    label: 'Tạm ngưng',
                    bg: '#f1f5f9',
                    color: '#475569',
                    border: '#cbd5e1'
                };
            }
            if (s === 'rejected') {
                return {
                    label: 'Từ chối',
                    bg: '#fff1f2',
                    color: '#e11d48',
                    border: '#fecdd3'
                };
            }
            return {
                label: status || 'Đang khai thác',
                bg: '#ecfdf5',
                color: '#047857',
                border: '#a7f3d0'
            };
        };

        const handleStartCreateNewTour = () => {
            setFormData({ 
                tour_id: null, 
                tour_name: '', 
                description: '', 
                destination: '', 
                image: null, 
                image_url: '', 
                categories: [], 
                highlights: '' 
            });
            setDays([{ 
                dayIndex: 1, 
                start_destination_id: '', 
                end_destination_id: '', 
                route_title: '', 
                activities: [], 
                accommodation: null, 
                transportTimes: { departureTime: '', returnTime: '' } 
            }]);
            setDayImages({});
            setDayImagePreviews({});
            setCostConfig(getInitialCostConfig());
            setIsEditing(true);
        };

        // Danh sách các khu vực/tỉnh có tour thực tế
        const provOptions = [...new Set(tours.map(t => getDestName(t)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));

        // Logic lọc tour
        const filteredTours = tours.filter(tour => {
            const destName = getDestName(tour);

            if (filterProv !== 'All' && destName !== filterProv) {
                return false;
            }

            if (filterStatus !== 'All') {
                const s = (tour.status || 'Active').toLowerCase();
                if (s !== filterStatus.toLowerCase()) return false;
            }

            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase().trim();
                const tourIdStr = String(tour.tour_id || '');
                const tourCode = `#tour-${tourIdStr}`.toLowerCase();
                const tourName = (tour.tour_name || '').toLowerCase();
                const dest = destName.toLowerCase();
                const origDest = (tour.destination || '').toLowerCase();

                const matchId = tourIdStr.includes(term) || tourCode.includes(term);
                const matchName = tourName.includes(term);
                const matchDest = dest.includes(term) || origDest.includes(term);

                if (!matchId && !matchName && !matchDest) return false;
            }

            return true;
        });

        // Logic sắp xếp tour
        const sortedTours = [...filteredTours].sort((a, b) => {
            if (sortBy === 'price_asc') {
                return Number(a.base_price || 0) - Number(b.base_price || 0);
            }
            if (sortBy === 'price_desc') {
                return Number(b.base_price || 0) - Number(a.base_price || 0);
            }
            if (sortBy === 'duration_asc') {
                return Number(a.duration_days || 0) - Number(b.duration_days || 0);
            }
            if (sortBy === 'duration_desc') {
                return Number(b.duration_days || 0) - Number(a.duration_days || 0);
            }
            if (sortBy === 'name_asc') {
                return (a.tour_name || '').localeCompare(b.tour_name || '', 'vi');
            }
            // Mới nhất (Default)
            return Number(b.tour_id || 0) - Number(a.tour_id || 0);
        });

        // Phân trang
        const totalPages = Math.ceil(sortedTours.length / pageSize) || 1;
        const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
        const paginatedTours = sortedTours.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

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

        const hasActiveFilters = Boolean(searchTerm.trim() || filterProv !== 'All' || filterStatus !== 'All' || sortBy !== 'latest');
        const handleResetFilters = () => {
            setSearchTerm('');
            setFilterProv('All');
            setFilterStatus('All');
            setSortBy('latest');
            setCurrentPage(1);
        };

        return (
            <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '40px' }}>
                {/* 1. KHU VỰC TIÊU ĐỀ TRANG */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: '800',
                            color: '#0f172a',
                            letterSpacing: '-0.3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            Danh sách Tour Cố định
                        </h1>
                        <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '14px',
                            color: '#64748b'
                        }}>
                            Quản lý thông tin, giá và tình trạng khai thác các tour cố định
                        </p>
                    </div>

                    <button
                        onClick={handleStartCreateNewTour}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            backgroundColor: '#0194f3',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(1, 148, 243, 0.25)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#0083d9';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(1, 148, 243, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#0194f3';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(1, 148, 243, 0.25)';
                        }}
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Tạo tour mới</span>
                    </button>
                </div>

                {/* 2. THANH CÔNG CỤ TÌM KIẾM VÀ BỘ LỌC */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                }}>
                    {/* Hàng 1: Search + Filters */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                    }}>
                        {/* Ô tìm kiếm linh hoạt */}
                        <div style={{
                            position: 'relative',
                            flex: '1 1 280px',
                            minWidth: '240px'
                        }}>
                            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Tìm theo tên tour, mã tour hoặc điểm đến..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '9px 36px 9px 36px',
                                    borderRadius: '8px',
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
                                    title="Xóa từ khóa"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* Lọc theo khu vực */}
                        <div style={{ minWidth: '170px' }}>
                            <select
                                value={filterProv}
                                onChange={(e) => { setFilterProv(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="All">-- Tất cả khu vực --</option>
                                {provOptions.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc theo trạng thái */}
                        <div style={{ minWidth: '170px' }}>
                            <select
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="All">-- Tất cả trạng thái --</option>
                                <option value="Active">Đang khai thác</option>
                                <option value="Approved">Đã phê duyệt</option>
                                <option value="Pending">Chờ duyệt</option>
                                <option value="Inactive">Tạm ngưng</option>
                            </select>
                        </div>

                        {/* Sắp xếp */}
                        <div style={{ minWidth: '180px' }}>
                            <select
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="latest">Mới nhất (Mặc định)</option>
                                <option value="price_asc">Giá: Thấp đến Cao</option>
                                <option value="price_desc">Giá: Cao đến Thấp</option>
                                <option value="duration_asc">Thời lượng: Ngắn nhất</option>
                                <option value="duration_desc">Thời lượng: Dài nhất</option>
                                <option value="name_asc">Tên tour: A - Z</option>
                            </select>
                        </div>

                        {/* Nút Xóa bộ lọc */}
                        {hasActiveFilters && (
                            <button
                                onClick={handleResetFilters}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '9px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: '#f8fafc',
                                    color: '#64748b',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            >
                                <RotateCcw size={14} />
                                <span>Xóa lọc</span>
                            </button>
                        )}
                    </div>

                    {/* Hàng 2: Thống kê số lượng + Toggle View Mode */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '10px',
                        flexWrap: 'wrap',
                        gap: '10px'
                    }}>
                        <div style={{ fontSize: '13.5px', color: '#64748b' }}>
                            Hiển thị <strong style={{ color: '#0f172a' }}>{filteredTours.length}</strong> tour cố định
                            {hasActiveFilters && <span> (lọc từ tổng số {tours.length} tour)</span>}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Chế độ xem:</span>
                            <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRight: '1px solid #cbd5e1',
                                        backgroundColor: viewMode === 'grid' ? '#e0f2fe' : '#ffffff',
                                        color: viewMode === 'grid' ? '#0369a1' : '#64748b',
                                        fontWeight: viewMode === 'grid' ? '700' : '500',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <LayoutGrid size={15} />
                                    <span>Lưới thẻ</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        border: 'none',
                                        backgroundColor: viewMode === 'table' ? '#e0f2fe' : '#ffffff',
                                        color: viewMode === 'table' ? '#0369a1' : '#64748b',
                                        fontWeight: viewMode === 'table' ? '700' : '500',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <List size={15} />
                                    <span>Bảng</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. KHU VỰC HIỂN THỊ DANH SÁCH TOUR */}
                {loading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', height: '330px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ backgroundColor: '#f1f5f9', height: '160px', borderRadius: '8px' }} />
                                <div style={{ backgroundColor: '#f1f5f9', height: '18px', width: '35%', borderRadius: '4px' }} />
                                <div style={{ backgroundColor: '#f1f5f9', height: '22px', width: '85%', borderRadius: '4px' }} />
                                <div style={{ backgroundColor: '#f1f5f9', height: '18px', width: '50%', borderRadius: '4px' }} />
                                <div style={{ backgroundColor: '#f1f5f9', height: '24px', width: '40%', borderRadius: '4px', marginTop: 'auto' }} />
                            </div>
                        ))}
                    </div>
                ) : filteredTours.length === 0 ? (
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1.5px dashed #cbd5e1',
                        padding: '48px 24px',
                        textAlign: 'center',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            backgroundColor: '#f1f5f9',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            color: '#64748b'
                        }}>
                            <Search size={26} />
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                            {tours.length === 0 ? 'Chưa có tour cố định nào' : 'Không tìm thấy tour phù hợp'}
                        </h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#64748b', maxWidth: '420px', marginInline: 'auto' }}>
                            {tours.length === 0 
                                ? 'Bắt đầu tạo tour cố định mới để thiết kế hành trình và thiết lập giá bán chuẩn cho doanh nghiệp.' 
                                : 'Hãy thử thay đổi từ khóa tìm kiếm, chọn khu vực khác hoặc bấm nút xóa lọc để hiển thị toàn bộ danh sách.'}
                        </p>
                        {tours.length === 0 ? (
                            <button
                                onClick={handleStartCreateNewTour}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    backgroundColor: '#0194f3',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={16} />
                                <span>Tạo tour đầu tiên</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleResetFilters}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    backgroundColor: '#f8fafc',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                <RotateCcw size={14} />
                                <span>Xóa bộ lọc</span>
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* DẠNG LƯỚI THẺ TOUR (GRID VIEW) */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        {paginatedTours.map(t => {
                            const destName = getDestName(t);
                            const statusBadge = getStatusBadge(t.status);
                            const tourImg = resolveTourImage(t.image_url);

                            return (
                                <div
                                    key={t.tour_id}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.07)';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    {/* Ảnh đại diện tour */}
                                    <div style={{ position: 'relative', height: '160px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                                        <img
                                            src={tourImg}
                                            alt={t.tour_name}
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=800';
                                            }}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />

                                        {/* Badge Mã Tour */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            left: '10px',
                                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                            backdropFilter: 'blur(4px)',
                                            color: '#ffffff',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            letterSpacing: '0.3px'
                                        }}>
                                            #TOUR-{String(t.tour_id).padStart(3, '0')}
                                        </div>

                                        {/* Badge Trạng thái */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            backgroundColor: statusBadge.bg,
                                            color: statusBadge.color,
                                            border: `1px solid ${statusBadge.border}`,
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                                        }}>
                                            {statusBadge.label}
                                        </div>
                                    </div>

                                    {/* Nội dung thông tin tour */}
                                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        {/* Điểm đến */}
                                        <div style={{ marginBottom: '8px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                color: '#0369a1',
                                                backgroundColor: '#e0f2fe',
                                                padding: '3px 8px',
                                                borderRadius: '6px'
                                            }}>
                                                <MapPin size={12} />
                                                {destName}
                                            </span>
                                        </div>

                                        {/* Tên tour */}
                                        <h3
                                            title={t.tour_name}
                                            style={{
                                                margin: '0 0 10px 0',
                                                fontSize: '15px',
                                                fontWeight: '700',
                                                color: '#0f172a',
                                                lineHeight: '1.4',
                                                height: '42px',
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}
                                        >
                                            {t.tour_name}
                                        </h3>

                                        {/* Thông số thời lượng */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '13px',
                                            color: '#64748b',
                                            marginBottom: '14px'
                                        }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                backgroundColor: '#f8fafc',
                                                border: '1px solid #e2e8f0',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                fontWeight: '600'
                                            }}>
                                                <Clock size={13} color="#64748b" />
                                                {t.duration_days} ngày {t.duration_days > 1 ? `${t.duration_days - 1} đêm` : ''}
                                            </span>

                                            {t.is_custom === 0 && (
                                                <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600', backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                                                    Tour Cố định
                                                </span>
                                            )}
                                        </div>

                                        {/* Chân thẻ: Giá & Nút chỉnh sửa */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderTop: '1px solid #f1f5f9',
                                            paddingTop: '12px',
                                            marginTop: 'auto'
                                        }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>
                                                    Giá cơ bản
                                                </span>
                                                <strong style={{ fontSize: '17px', color: '#0284c7', fontWeight: '800' }}>
                                                    {formatMoneyLocal(t.base_price)} đ
                                                </strong>
                                            </div>

                                            <button
                                                onClick={() => handleEditTour(t)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '8px 14px',
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '8px',
                                                    color: '#0f172a',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#0194f3';
                                                    e.currentTarget.style.color = '#ffffff';
                                                    e.currentTarget.style.borderColor = '#0194f3';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                                    e.currentTarget.style.color = '#0f172a';
                                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                                }}
                                            >
                                                <Edit3 size={14} />
                                                <span>Chỉnh sửa</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* DẠNG BẢNG QUẢN LÝ (TABLE VIEW) */
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        marginBottom: '24px'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', width: '105px' }}>Mã tour</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Thông tin Tour</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', width: '160px' }}>Điểm đến</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', width: '130px' }}>Thời lượng</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', width: '150px' }}>Giá cơ bản</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', width: '140px' }}>Trạng thái</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', fontSize: '12px', textTransform: 'uppercase', width: '110px', textAlign: 'center' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTours.map((t, idx) => {
                                        const destName = getDestName(t);
                                        const statusBadge = getStatusBadge(t.status);
                                        const tourImg = resolveTourImage(t.image_url);

                                        return (
                                            <tr
                                                key={t.tour_id}
                                                style={{
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background-color 0.15s ease',
                                                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa'}
                                            >
                                                <td style={{ padding: '14px 16px', fontWeight: '700', color: '#334155' }}>
                                                    #TOUR-{String(t.tour_id).padStart(3, '0')}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <img
                                                            src={tourImg}
                                                            alt=""
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=800';
                                                            }}
                                                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: '#0f172a', lineHeight: '1.4' }}>
                                                                {t.tour_name}
                                                            </div>
                                                            {t.is_custom === 0 && (
                                                                <span style={{ fontSize: '11px', color: '#64748b' }}>Sản phẩm tiêu chuẩn</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        color: '#0369a1',
                                                        backgroundColor: '#e0f2fe',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        <MapPin size={12} />
                                                        {destName}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', color: '#475569', fontWeight: '500' }}>
                                                    {t.duration_days} ngày {t.duration_days > 1 ? `${t.duration_days - 1} đêm` : ''}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontWeight: '800', color: '#0284c7' }}>
                                                    {formatMoneyLocal(t.base_price)} đ
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        backgroundColor: statusBadge.bg,
                                                        color: statusBadge.color,
                                                        border: `1px solid ${statusBadge.border}`,
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        padding: '3px 8px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleEditTour(t)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '6px 12px',
                                                            backgroundColor: '#ffffff',
                                                            border: '1px solid #cbd5e1',
                                                            borderRadius: '6px',
                                                            color: '#0f172a',
                                                            fontSize: '12.5px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#0194f3';
                                                            e.currentTarget.style.color = '#ffffff';
                                                            e.currentTarget.style.borderColor = '#0194f3';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                                            e.currentTarget.style.color = '#0f172a';
                                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                                        }}
                                                    >
                                                        <Edit3 size={13} />
                                                        <span>Sửa</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. PHÂN TRANG (PAGINATION) */}
                {sortedTours.length > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 18px',
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        {/* Range và chọn số tour mỗi trang */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13.5px', color: '#64748b' }}>
                            <span>
                                Hiển thị <strong style={{ color: '#0f172a' }}>{(safeCurrentPage - 1) * pageSize + 1}</strong> - <strong style={{ color: '#0f172a' }}>{Math.min(safeCurrentPage * pageSize, sortedTours.length)}</strong> trong tổng số <strong style={{ color: '#0f172a' }}>{sortedTours.length}</strong> tour
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12.5px' }}>/ Trang:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13px',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value={6}>6</option>
                                    <option value={9}>9</option>
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                </select>
                            </div>
                        </div>

                        {/* Nút phân trang */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                disabled={safeCurrentPage <= 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: safeCurrentPage <= 1 ? '#f8fafc' : '#ffffff',
                                    color: safeCurrentPage <= 1 ? '#94a3b8' : '#334155',
                                    cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            >
                                <ChevronLeft size={16} />
                                <span>Trước</span>
                            </button>

                            {getPaginationGroup().map(pageNum => (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    style={{
                                        minWidth: '32px',
                                        height: '32px',
                                        padding: '0 6px',
                                        borderRadius: '6px',
                                        border: pageNum === safeCurrentPage ? '1px solid #0194f3' : '1px solid #cbd5e1',
                                        backgroundColor: pageNum === safeCurrentPage ? '#0194f3' : '#ffffff',
                                        color: pageNum === safeCurrentPage ? '#ffffff' : '#334155',
                                        fontWeight: pageNum === safeCurrentPage ? '700' : '500',
                                        fontSize: '13px',
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
                                    gap: '4px',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: safeCurrentPage >= totalPages ? '#f8fafc' : '#ffffff',
                                    color: safeCurrentPage >= totalPages ? '#94a3b8' : '#334155',
                                    cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            >
                                <span>Sau</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Quay lại</button>
                    <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{formData.tour_id ? 'Chỉnh sửa Tour' : 'Tạo Tour Mới'}</h2>
                </div>
            </div>

            {/* General Info */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>Thông tin cơ bản</h3>
                    <div style={{ padding: '6px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>THÔNG SỐ HÀNH TRÌNH:</span>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>{totalDays} Ngày {totalNights} Đêm</strong>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    {/* Cột trái: Văn bản (70%) */}
                    <div style={{ flex: '7', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tên Tour</label>
                                <input value={formData.tour_name} onChange={e => setFormData({...formData, tour_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Điểm Đến Chính</label>
                                <input 
                                    value={formData.destination || ''} 
                                    onChange={e => setFormData({...formData, destination: e.target.value})} 
                                    placeholder="Ví dụ: Bà Rịa - Vũng Tàu, Hồ Tràm, Đà Lạt, Phú Quốc..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Phân loại / Chủ đề Tour</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['Nghỉ dưỡng', 'Khám phá', 'Văn hóa', 'Lễ Tết', 'Mạo hiểm', 'Biển đảo', 'Gia đình'].map(cat => {
                                    const isSelected = formData.categories?.includes(cat);
                                    return (
                                        <div 
                                            key={cat} 
                                            onClick={() => {
                                                const current = formData.categories || [];
                                                if (current.includes(cat)) {
                                                    setFormData({...formData, categories: current.filter(c => c !== cat)});
                                                } else {
                                                    setFormData({...formData, categories: [...current, cat]});
                                                }
                                            }}
                                            style={{ 
                                                padding: '6px 12px', 
                                                borderRadius: '20px', 
                                                border: isSelected ? '1px solid #3b82f6' : '1px solid #cbd5e1', 
                                                background: isSelected ? '#eff6ff' : '#f8fafc', 
                                                color: isSelected ? '#2563eb' : '#64748b',
                                                fontSize: '13px', 
                                                cursor: 'pointer',
                                                fontWeight: isSelected ? 'bold' : 'normal',
                                                userSelect: 'none',
                                                transition: 'all 0.2s'
                                            }}>
                                            {cat}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Điểm nhấn Tour (Mỗi dòng 1 điểm nhấn)</label>
                            <textarea 
                                rows="3" 
                                value={formData.highlights || ''} 
                                onChange={e => setFormData({...formData, highlights: e.target.value})} 
                                placeholder="Tặng vé cáp treo Fansipan&#10;Lưu trú khách sạn 4 sao trung tâm&#10;Thưởng thức lẩu cá hồi đặc sản..."
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }} 
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Mô tả tổng quan</label>
                            <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, resize: 'vertical' }} />
                        </div>
                    </div>
                    
                    {/* Cột phải: Hình ảnh (30%) */}
                    <div style={{ flex: '3', display: 'flex', flexDirection: 'column' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Ảnh đại diện</label>
                        <div style={{ flex: 1, border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                            {(formData.image || formData.image_url) ? (
                                <>
                                    <img 
                                        src={formData.image instanceof File ? URL.createObjectURL(formData.image) : (formData.image_url.startsWith('http') ? formData.image_url : `http://localhost:5000${formData.image_url}`)} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                                        alt="Preview"
                                    />
                                    <button 
                                        onClick={() => setFormData({...formData, image: null, image_url: ''})} 
                                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
                                    <span style={{ fontSize: '28px', marginBottom: '8px' }}>📷</span>
                                    <span>Chọn ảnh Tour</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => { if(e.target.files[0]) setFormData({...formData, image: e.target.files[0] }) }} 
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Flex Container for Itinerary and Costing side by side or stacked */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                
                {/* Lịch trình */}
                <TimelineBuilder 
                            days={days} 
                            setDays={setDays} 
                            destinations={destinations} 
                            allServices={allServices} 
                            dayImages={dayImages}
                            setDayImages={setDayImages}
                            dayImagePreviews={dayImagePreviews}
                            setDayImagePreviews={setDayImagePreviews}
                            costConfig={costConfig}
                            setCostConfig={setCostConfig}
                        />

                {/* Costing */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#d97706' }}>Định phí</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chọn phương tiện di chuyển chính</label>
                                <select 
                                    value={costConfig.selectedTransport?.service_id || ''} 
                                    onChange={handleTransportChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Tự túc / Không chọn --</option>
                                    {costConfig.selectedTransport?.service_name && !transportServices.some(t => String(t.service_id) === String(costConfig.selectedTransport.service_id)) && (
                                        <option value={costConfig.selectedTransport.service_id}>
                                            {costConfig.selectedTransport.displayName || formatVehicleDisplayName(costConfig.selectedTransport)}
                                        </option>
                                    )}
                                    {transportServices.map(t => (
                                        <option key={t.service_id} value={t.service_id}>
                                            {t.displayName || formatVehicleDisplayName(t)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Điểm hòa vốn</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={costConfig.minimumPax} 
                                    onChange={e => setCostConfig({...costConfig, minimumPax: e.target.value})} 
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chi phí Xe / Phương tiện</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.transport || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, transport: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Đơn giá HDV / Ngày</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.guidePerDay || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, guidePerDay: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tổng Định Phí:</span>
                            <span style={{ color: '#d97706' }}>{Number(totalFixed).toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#2563eb' }}>Biến phí</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Vé Xe / Máy bay / Khách</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(costConfig.variable.transportTicket || 0).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chi phí khách sạn (2 khách / phòng)</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{(autoAccommodationCost / 2).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa sáng (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultBreakfast}`} value={costConfig.variable.countBreakfast !== undefined ? costConfig.variable.countBreakfast : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countBreakfast: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa sáng" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.breakfast || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, breakfast: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa trưa (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultLunch}`} value={costConfig.variable.countLunch !== undefined ? costConfig.variable.countLunch : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countLunch: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa trưa" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.lunch || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, lunch: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa tối (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultDinner}`} value={costConfig.variable.countDinner !== undefined ? costConfig.variable.countDinner : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countDinner: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa tối" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.dinner || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, dinner: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Tổng chi phí các điểm tham quan</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(autoTicketsCost).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bảo hiểm & Khác</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.insurance || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, insurance: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tổng Biến Phí / Khách:</span>
                            <span style={{ color: '#2563eb' }}>{Number(totalVariable).toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>
                    
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#7c3aed' }}>Lợi nhuận & Phụ thu</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Biên độ lợi nhuận (%)</label>
                                <input type="number" value={costConfig.margin} onChange={e => setCostConfig({...costConfig, margin: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Phụ thu phòng đơn / Khách</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.singleSupplement || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, singleSupplement: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#0ea5e9' }}>Chính sách giá trẻ em</h3>
                            <select 
                                value={costConfig.ageMultiplier.preset || 'custom'}
                                onChange={e => {
                                    const preset = e.target.value;
                                    let newMulti = { ...costConfig.ageMultiplier, preset };
                                    if (preset === 'road') {
                                        newMulti = { preset, child: { percent: 50, fixed_surcharge: 0 }, toddler: { percent: 0, fixed_surcharge: 0 }, infant: { percent: 0, fixed_surcharge: 0 } };
                                    } else if (preset === 'air') {
                                        newMulti = { preset, child: { percent: 85, fixed_surcharge: 0 }, toddler: { percent: 50, fixed_surcharge: 0 }, infant: { percent: 0, fixed_surcharge: 500000 } };
                                    }
                                    setCostConfig({ ...costConfig, ageMultiplier: newMulti });
                                }}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            >
                                <option value="custom">Tuỳ chỉnh (Custom)</option>
                                <option value="road">Mẫu 1 (Đường bộ): 50% - 0% - 0%</option>
                                <option value="air">Mẫu 2 (Hàng không): 85% - 50% - (0% + Phụ thu)</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            {[
                                { key: 'child', label: 'Trẻ em (5 - 11 tuổi)' },
                                { key: 'toddler', label: 'Trẻ nhỏ (2 - 4 tuổi)' },
                                { key: 'infant', label: 'Em bé (< 2 tuổi)' }
                            ].map(group => {
                                const currentSetting = costConfig.ageMultiplier[group.key] || { percent: 0, fixed_surcharge: 0 };
                                const isCustom = costConfig.ageMultiplier.preset === 'custom';
                                const calPrice = (sellingPrice * (currentSetting.percent || 0) / 100) + Number(currentSetting.fixed_surcharge || 0);

                                return (
                                    <div key={group.key} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ display: 'block', marginBottom: '10px', color: '#1e293b', fontSize: '14px' }}>{group.label}</strong>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        max="100"
                                                        value={currentSetting.percent}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...costConfig.ageMultiplier,
                                                                    [group.key]: { ...currentSetting, percent: val }
                                                                }
                                                            })
                                                        }}
                                                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: isCustom ? '#fff' : '#f1f5f9' }}
                                                    />
                                                    <span style={{ color: '#64748b', fontSize: '13px' }}>%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type="text" 
                                                        value={Number(currentSetting.fixed_surcharge || 0).toLocaleString('vi-VN')}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...costConfig.ageMultiplier,
                                                                    [group.key]: { ...currentSetting, fixed_surcharge: Number(e.target.value.replace(/\D/g, '')) }
                                                                }
                                                            })
                                                        }}
                                                        style={{ width: '100%', padding: '6px', paddingRight: '20px', borderRadius: '4px', border: '1px solid #cbd5e1', background: isCustom ? '#fff' : '#f1f5f9' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '12px' }}>đ</span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '5px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>Giá bán:</span>
                                                <strong style={{ fontSize: '14px', color: '#0ea5e9' }}>{formatMoneyLocal(calPrice)} đ</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
            {/* Pricing Footer */}
            <div style={{ marginTop: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', gap: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Giá vốn</span>
                        <strong style={{ fontSize: '20px', color: '#d97706' }}>{formatMoneyLocal(netCost)} đ</strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Định phí: {formatMoneyLocal(fixedPerPax)} | Biến phí: {formatMoneyLocal(totalVariable)}</span>
                    </div>
                    <div style={{ height: '40px', width: '2px', background: '#e2e8f0' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: '#059669', textTransform: 'uppercase', fontWeight: 'bold' }}>Giá bán</span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <input 
                                type="text" 
                                value={Number(sellingPrice || 0).toLocaleString('vi-VN')}
                                onChange={(e) => {
                                    const input = e.target;
                                    const oldCursor = input.selectionStart;
                                    const oldLen = input.value.length;
                                    
                                    const newSellingPrice = Number(input.value.replace(/\D/g, ''));
                                    if (netCost > 0) {
                                        const newMargin = ((newSellingPrice / netCost) - 1) * 100;
                                        setCostConfig({...costConfig, margin: newMargin});
                                    }
                                    
                                    requestAnimationFrame(() => {
                                        const newLen = input.value.length;
                                        const newCursor = Math.max(0, oldCursor + (newLen - oldLen));
                                        input.setSelectionRange(newCursor, newCursor);
                                    });
                                }}
                                style={{ 
                                    fontSize: '26px', 
                                    color: '#10b981', 
                                    fontWeight: '900',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    width: '180px',
                                    textAlign: 'right',
                                    padding: 0
                                }} 
                            />
                            <strong style={{ fontSize: '26px', color: '#10b981', fontWeight: '900' }}>đ</strong>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '20px', borderLeft: '2px dashed #e2e8f0' }}>
                        <span style={{ fontSize: '12px', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 'bold' }}>Phụ thu phòng đơn</span>
                        <strong style={{ fontSize: '18px', color: '#7c3aed' }}>+ {formatMoneyLocal(costConfig.variable.singleSupplement)} đ</strong>
                    </div>
                </div>
                
                {(!editTourData || editTourData.approval_status !== 'Approved') && (
                    <button onClick={handleSave} disabled={loading} style={{ padding: '12px 28px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
                        {loading ? 'Đang xử lý...' : 'Gửi duyệt'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default StaffFixedTourDesigner;
