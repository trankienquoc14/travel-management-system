import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import '../styles/CustomerTourBuilder.css';
import '../index.css';
import { 
    MapPin as FiMapPin, Calendar as FiCalendar, Users as FiUsers, DollarSign as FiDollarSign, 
    CheckCircle as FiCheckCircle, ChevronRight as FiChevronRight, ChevronLeft as FiChevronLeft,
    Home as FiHome, Truck as FiTruck, Coffee as FiCoffee, Camera as FiCamera, Edit as FiEdit3
} from 'lucide-react';
import { formatVehicleDisplayName } from '../utils/vehicleDisplayHelper';
import { FormattedDateInput } from './FormattedDateInput';

const CustomerTourBuilder = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const roleId = Number(localStorage.getItem('roleId')) || JSON.parse(localStorage.getItem('user'))?.role_id;

    // Data lists
    const [destinationList, setDestinationList] = useState([]);
    const [availablePlaces, setAvailablePlaces] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [transports, setTransports] = useState([]);
    const [fleetVehicles, setFleetVehicles] = useState([]);
    const [toursRef, setToursRef] = useState([]);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    // Form Data
    const [formData, setFormData] = useState({
        destination: '',
        pickup_location: '',
        departure_date: '',
        departure_time: '',
        duration_days: 3,
        budget_estimate: ''
    });

    const [participants, setParticipants] = useState({ adults: 1, children: 0, toddlers: 0, infants: 0 });

    const [preferences, setPreferences] = useState({
        hotel: '',
        transport: '',
        activities: [],
        note: ''
    });

    const [hotelMode, setHotelMode] = useState('select'); // 'self', 'company', 'select'
    const [transportMode, setTransportMode] = useState('company'); // 'company', 'select', 'custom'
    const [transportCategory, setTransportCategory] = useState('standard'); // 'standard', 'limousine', 'flight'
    const [customTransportNote, setCustomTransportNote] = useState('');
    const [guideMode, setGuideMode] = useState('company'); // 'self', 'company'
    const [mealMode, setMealMode] = useState('company'); // 'self', 'company'
    const [hotelCategory, setHotelCategory] = useState('all');

    const [suggestedPrice, setSuggestedPrice] = useState({ min: 0, max: 0 });

    // Format tiền tệ
    const formatMoney = (amount) => amount.toLocaleString('vi-VN');

    // Format ngày dd/mm/yyyy
    const formatDateDMY = (dateStr) => {
        if (!dateStr) return '';
        const cleanDate = String(dateStr).split('T')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    // Calculate Costs & Pax
    const totalPax = participants.adults + participants.children + (participants.toddlers || 0) + (participants.infants || 0);

    // Phân loại và nhận diện loại xe/phương tiện
    const getVehicleSearchText = (t) => {
        return `${t.vehicle_name || ''} ${t.service_name || ''} ${t.name || ''} ${t.brand_model || ''} ${t.vehicle_model || ''} ${t.vehicle_type || ''} ${t.vehicle_detail_type || ''} ${t.partner_name || ''} ${t.description || ''} ${t.service_type || ''}`.toLowerCase();
    };

    const isFlightVehicle = (t) => {
        const text = getVehicleSearchText(t);
        return (t.service_type === 'Vé máy bay' || text.includes('máy bay') || text.includes('hàng không') || text.includes('flight') || text.includes('airline'));
    };

    const isLimousineVehicle = (t) => {
        if (isFlightVehicle(t)) return false;
        const type = (t.vehicle_type || '').toLowerCase();
        const text = getVehicleSearchText(t);
        return type.includes('limousine') || text.includes('limousine') || text.includes('dcar') || text.includes('skybus') || text.includes('vip lounge') || text.includes('thượng đỉnh') || text.includes('president');
    };

    const isStandardVehicle = (t) => {
        return !isFlightVehicle(t) && !isLimousineVehicle(t);
    };

    const hasFlightSupport = transports.some(t => isFlightVehicle(t));

    // Gợi ý phương tiện tham khảo theo số lượng thành viên
    const getRecommendedVehicle = (pax) => {
        if (pax <= 0) return 'Xe 4–7 chỗ';
        if (pax >= 1 && pax <= 4) return 'Xe 4–7 chỗ';
        if (pax >= 5 && pax <= 7) return 'Xe 7 chỗ';
        if (pax >= 8 && pax <= 16) return 'Xe 16 chỗ';
        if (pax >= 17 && pax <= 29) return 'Xe 29 chỗ';
        if (pax >= 30 && pax <= 45) return 'Xe 45 chỗ';
        return 'Đoàn lớn trên 45 người (Bố trí nhiều xe)';
    };

    // Tính toán chi phí ước tính thực tế cho từng nhóm phương tiện dựa trên database (services & fleet vehicles)
    const getTransportCategoryPriceInfo = (catId, pax, duration) => {
        const count = pax > 0 ? pax : 1;
        const days = Math.max(1, Number(duration) || 1);

        if (catId === 'flight') {
            // Nhóm máy bay: Lấy đơn giá vé khứ hồi từ dịch vụ Vé máy bay
            const flightItems = transports.filter(t => isFlightVehicle(t));
            const flightPrices = [];
            flightItems.forEach(f => {
                const bCost = Number(f.base_cost) || 0;
                const sPrice = Number(f.selling_price) || Number(f.price) || 0;
                if (bCost > 0) flightPrices.push(bCost);
                if (sPrice > 0) flightPrices.push(sPrice);
            });

            if (flightPrices.length === 0) {
                return {
                    hasPrice: false,
                    displayTotal: 'Chưa có dữ liệu giá tham khảo',
                    displayPerPax: '',
                    note: 'Chuyên viên sẽ kiểm tra giá vé theo thời điểm xuất phát',
                    totalMin: 0,
                    totalMax: 0,
                    perPaxMin: 0,
                    perPaxMax: 0,
                    isFlight: true
                };
            }

            const minTicket = Math.min(...flightPrices);
            const maxTicket = Math.max(...flightPrices);
            const totalMin = minTicket * count;
            const totalMax = maxTicket * count;

            const displayTotal = totalMin === totalMax
                ? `${formatMoney(totalMin)}đ`
                : `${formatMoney(totalMin)} – ${formatMoney(totalMax)}đ`;

            const displayPerPax = minTicket === maxTicket
                ? `~${formatMoney(minTicket)}đ / khách`
                : `~${formatMoney(minTicket)} – ${formatMoney(maxTicket)}đ / khách`;

            return {
                hasPrice: true,
                totalMin,
                totalMax,
                perPaxMin: minTicket,
                perPaxMax: maxTicket,
                displayTotal,
                displayPerPax,
                note: `*Giá vé khứ hồi tham khảo cho đoàn ${count} khách (xác nhận trong báo giá)`,
                isFlight: true
            };
        }

        // Nhóm đường bộ: Xe tiêu chuẩn & Xe Limousine / VIP
        const isLimo = (catId === 'limousine');
        let targetCapacities = [];

        if (isLimo) {
            if (count <= 9) targetCapacities = [9];
            else if (count <= 11) targetCapacities = [9, 11];
            else targetCapacities = [9, 11, 16];
        } else {
            // Xe tiêu chuẩn theo quy mô đoàn
            if (count <= 4) targetCapacities = [4, 7];
            else if (count <= 7) targetCapacities = [7];
            else if (count <= 16) targetCapacities = [16];
            else if (count <= 29) targetCapacities = [29];
            else targetCapacities = [45];
        }

        // Lấy toàn bộ đơn giá ngày từ fleetVehicles (đội xe) và transports (dịch vụ xe)
        const unitPrices = [];

        fleetVehicles.forEach(v => {
            const cap = Number(v.seat_capacity);
            const vIsLimo = isLimousineVehicle(v);
            if (vIsLimo === isLimo && targetCapacities.includes(cap)) {
                const bCost = Number(v.base_cost) || 0;
                const sPrice = Number(v.selling_price) || Number(v.price) || 0;
                if (bCost > 0) unitPrices.push(bCost);
                if (sPrice > 0) unitPrices.push(sPrice);
            }
        });

        transports.forEach(s => {
            if (isFlightVehicle(s)) return;
            const sIsLimo = isLimousineVehicle(s);
            if (sIsLimo === isLimo) {
                const cap = Number(s.capacity) || 0;
                const matchesCap = targetCapacities.includes(cap) || targetCapacities.some(c => (s.service_name || '').includes(`${c} chỗ`));
                if (matchesCap) {
                    const bCost = Number(s.base_cost) || 0;
                    const sPrice = Number(s.selling_price) || Number(s.price) || 0;
                    if (bCost > 0) unitPrices.push(bCost);
                    if (sPrice > 0) unitPrices.push(sPrice);
                }
            }
        });

        if (unitPrices.length === 0) {
            return {
                hasPrice: false,
                displayTotal: 'Chưa có dữ liệu giá tham khảo',
                displayPerPax: '',
                note: 'Chuyên viên sẽ báo giá chi tiết theo dòng xe phù hợp',
                totalMin: 0,
                totalMax: 0,
                perPaxMin: 0,
                perPaxMax: 0,
                isFlight: false
            };
        }

        const minDayUnit = Math.min(...unitPrices);
        const maxDayUnit = Math.max(...unitPrices);

        const maxSingleVehicleCapacity = Math.max(...targetCapacities);
        const numVehicles = Math.max(1, Math.ceil(count / maxSingleVehicleCapacity));

        const totalMin = minDayUnit * days * numVehicles;
        const totalMax = maxDayUnit * days * numVehicles;

        const perPaxMin = Math.round(totalMin / count);
        const perPaxMax = Math.round(totalMax / count);

        const displayTotal = totalMin === totalMax
            ? `${formatMoney(totalMin)}đ`
            : `${formatMoney(totalMin)} – ${formatMoney(totalMax)}đ`;

        const displayPerPax = perPaxMin === perPaxMax
            ? `~${formatMoney(perPaxMin)}đ / khách`
            : `~${formatMoney(perPaxMin)} – ${formatMoney(perPaxMax)}đ / khách`;

        const vehicleCountNote = numVehicles > 1 ? ` (${numVehicles} xe)` : '';
        const note = `*Chi phí tham khảo cho ${days} ngày di chuyển cả đoàn${vehicleCountNote}`;

        return {
            hasPrice: true,
            totalMin,
            totalMax,
            perPaxMin,
            perPaxMax,
            displayTotal,
            displayPerPax,
            numVehicles,
            note,
            isFlight: false
        };
    };

    // Xác định danh sách các nhóm phương tiện phù hợp với số lượng thành viên
    const getAvailableTransportCategories = (pax, duration) => {
        const count = pax > 0 ? pax : 1;
        const days = Math.max(1, Number(duration) || 1);
        const categories = [];

        // 1. Nhóm Xe tiêu chuẩn (Lọc sức chứa phù hợp theo quy mô đoàn)
        if (count <= 4) {
            const priceInfo = getTransportCategoryPriceInfo('standard', count, days);
            categories.push({
                id: 'standard',
                title: 'Xe tiêu chuẩn',
                vehicleClass: 'Xe 4–7 chỗ (Sedan / SUV đời mới)',
                icon: '🚗',
                badge: 'Tiết kiệm',
                companyBadge: '⭐ Đề xuất cho đoàn',
                description: 'Dòng xe du lịch 4–7 chỗ đời mới (Toyota Camry, Vios, Fortuner...), máy lạnh mát mẻ, khoang hành lý tiêu chuẩn, di chuyển linh hoạt, tối ưu chi phí cho đoàn nhỏ.',
                priceInfo
            });
        } else if (count <= 7) {
            const priceInfo = getTransportCategoryPriceInfo('standard', count, days);
            categories.push({
                id: 'standard',
                title: 'Xe tiêu chuẩn',
                vehicleClass: 'Xe 7 chỗ (SUV / MPV gầm cao)',
                icon: '🚗',
                badge: 'Tiết kiệm',
                companyBadge: '⭐ Đề xuất cho đoàn',
                description: 'Dòng xe 7 chỗ gầm cao đa dụng (Innova Cross, Fortuner, Carnival...), khoang ngồi rộng rãi, 2 dàn lạnh độc lập, êm ái trên mọi cung đường.',
                priceInfo
            });
        } else if (count <= 16) {
            const priceInfo = getTransportCategoryPriceInfo('standard', count, days);
            categories.push({
                id: 'standard',
                title: 'Xe tiêu chuẩn',
                vehicleClass: 'Xe 16 chỗ (Ford Transit / Hyundai Solati)',
                icon: '🚐',
                badge: 'Tiết kiệm',
                companyBadge: '⭐ Đề xuất cho đoàn',
                description: 'Dòng xe du lịch 16 chỗ hiện đại, trần cao thoáng mát, ghế bọc da ngả lưng êm ái, khoang hành lý rộng cho cơ quan hoặc đại gia đình.',
                priceInfo
            });
        } else if (count <= 29) {
            const priceInfo = getTransportCategoryPriceInfo('standard', count, days);
            categories.push({
                id: 'standard',
                title: 'Xe tiêu chuẩn',
                vehicleClass: 'Xe 29 chỗ (Thaco Town / Samco)',
                icon: '🚌',
                badge: 'Cân bằng chi phí',
                companyBadge: '⭐ Đề xuất cho đoàn',
                description: 'Dòng xe du lịch 29 chỗ cao cấp hệ thống bóng hơi êm ái, cốp hành lý lớn, trang bị micro karaoke phục vụ đoàn thể, công ty.',
                priceInfo
            });
        } else if (count <= 45) {
            const priceInfo = getTransportCategoryPriceInfo('standard', count, days);
            categories.push({
                id: 'standard',
                title: 'Xe tiêu chuẩn',
                vehicleClass: 'Xe 45 chỗ (Hyundai Universe cao cấp)',
                icon: '🚍',
                badge: 'Cân bằng chi phí',
                companyBadge: '⭐ Đề xuất cho đoàn',
                description: 'Dòng xe du lịch 45 chỗ lớn nhất, bầu hơi 6 túi siêu êm, dàn âm thanh karaoke chuyên nghiệp, hầm chứa 50 vali, chuyên phục vụ đoàn đông.',
                priceInfo
            });
        } else {
            const priceInfo = getTransportCategoryPriceInfo('standard', count, days);
            categories.push({
                id: 'standard',
                title: 'Xe tiêu chuẩn',
                vehicleClass: `Đoàn lớn (${count} người - Bố trí nhiều xe)`,
                icon: '🚍',
                badge: 'Cân bằng chi phí',
                companyBadge: '⭐ Đề xuất cho đoàn',
                description: `Quy mô đoàn ${count} khách được hệ thống đề xuất bố trí ${priceInfo.numVehicles || Math.ceil(count / 45)} xe 45 chỗ hoặc kết hợp nhiều xe linh hoạt theo nhu cầu thực tế.`,
                priceInfo
            });
        }

        // 2. Nhóm Xe Limousine / VIP (Chỉ hiển thị cho đoàn từ 1 đến 16 người)
        if (count <= 7) {
            const priceInfo = getTransportCategoryPriceInfo('limousine', count, days);
            categories.push({
                id: 'limousine',
                title: 'Xe Limousine / VIP',
                vehicleClass: 'Limousine 9 chỗ VIP Hạng Thương Gia',
                icon: '✨',
                badge: 'Cao cấp',
                companyBadge: null,
                description: 'Dòng xe Limousine DCar President 9 chỗ hạng thương gia với ghế massage bọc da cao cấp, cổng sạc USB từng vị trí, đèn trần bầu trời sao và wifi suốt tuyến.',
                priceInfo
            });
        } else if (count <= 9) {
            const priceInfo = getTransportCategoryPriceInfo('limousine', count, days);
            categories.push({
                id: 'limousine',
                title: 'Xe Limousine / VIP',
                vehicleClass: 'Limousine 9 chỗ VIP (hoặc 11 chỗ Thượng Đỉnh)',
                icon: '✨',
                badge: 'Cao cấp',
                companyBadge: '👑 Trải nghiệm VIP',
                description: 'Dòng Limousine 9–11 chỗ cao cấp, ghế massage bọc da êm ái, tiện nghi tối đa, rất phù hợp cho đoàn 8–9 khách muốn trải nghiệm sang trọng.',
                priceInfo
            });
        } else if (count <= 11) {
            const priceInfo = getTransportCategoryPriceInfo('limousine', count, days);
            categories.push({
                id: 'limousine',
                title: 'Xe Limousine / VIP',
                vehicleClass: 'Solati DCar 11 chỗ VIP Hạng Thượng Đỉnh',
                icon: '✨',
                badge: 'Cao cấp',
                companyBadge: null,
                description: 'Dòng Limousine 11 chỗ Solati DCar Hạng Thượng Đỉnh cao cấp, không gian rộng rãi, dàn âm thanh cao cấp, tiện nghi tối đa cho đoàn VIP.',
                priceInfo
            });
        } else if (count <= 16) {
            const priceInfo = getTransportCategoryPriceInfo('limousine', count, days);
            categories.push({
                id: 'limousine',
                title: 'Xe Limousine / VIP',
                vehicleClass: 'Xe Limousine VIP Đoàn (16 chỗ nâng cấp)',
                icon: '✨',
                badge: 'Cao cấp',
                companyBadge: null,
                description: 'Dòng xe 16 chỗ cấu hình VIP thương gia nội thất bọc da êm ái, phục vụ chuyên nghiệp theo tiêu chuẩn đoàn cao cấp.',
                priceInfo
            });
        }

        // 3. Nhóm Máy bay (Vé máy bay khứ hồi)
        if (hasFlightSupport) {
            const priceInfo = getTransportCategoryPriceInfo('flight', count, days);
            categories.push({
                id: 'flight',
                title: 'Di chuyển bằng Máy bay',
                vehicleClass: 'Vé máy bay Khứ hồi (Các hãng hàng không uy tín)',
                icon: '✈️',
                badge: 'Nhanh chóng',
                companyBadge: null,
                description: 'Chuyến bay khứ hồi (Vietnam Airlines, Vietjet, Bamboo...) giúp tối ưu hóa tối đa thời gian di chuyển cho hành trình xa.',
                priceInfo
            });
        }

        return categories;
    };

    const getTransportDisplayString = () => {
        const recommended = getRecommendedVehicle(totalPax);
        const days = Math.max(1, Number(formData.duration_days) || 1);
        if (transportMode === 'company') {
            const stdPrice = getTransportCategoryPriceInfo('standard', totalPax, days);
            const priceText = stdPrice.hasPrice ? ` (Dự kiến: ${stdPrice.displayTotal})` : '';
            return `Theo đề xuất của công ty: ${recommended}${priceText}`;
        }
        if (transportMode === 'select') {
            const catPrice = getTransportCategoryPriceInfo(transportCategory, totalPax, days);
            const priceText = catPrice.hasPrice ? ` [Dự kiến: ${catPrice.displayTotal}]` : '';
            if (transportCategory === 'limousine') {
                const limoType = totalPax <= 9 ? 'Xe 9 chỗ VIP' : totalPax <= 11 ? 'Xe 11 chỗ VIP' : 'Xe Limousine VIP';
                return `Xe Limousine / VIP (${limoType})${priceText}`;
            }
            if (transportCategory === 'flight') {
                return `Máy bay (Vé máy bay khứ hồi)${priceText}`;
            }
            return `Xe tiêu chuẩn (${recommended})${priceText}`;
        }
        if (transportMode === 'custom') {
            return customTransportNote.trim() 
                ? `Yêu cầu riêng: ${customTransportNote.trim()} (Đề xuất: ${recommended})` 
                : `Yêu cầu riêng (Đề xuất: ${recommended})`;
        }
        return `Theo đề xuất của công ty: ${recommended}`;
    };

    const totalPlaceCost = preferences.activities.reduce((sum, placeId) => {
        const place = availablePlaces.find(p => p.place_id === placeId);
        return sum + (place ? Number(place.estimated_price) : 0);
    }, 0);

    // Ước tính chi phí lưu trú (khách sạn)
    const hotelNights = Math.max(1, Number(formData.duration_days) - 1 || 1);
    const hotelRoomsCount = Math.max(1, Math.ceil(totalPax / 2));
    const selectedHotel = hotels.find(h => String(h.partner_service_id || h.service_id || h.id) === String(preferences.hotel));

    const getHotelDisplayName = (h) => {
        if (!h) return '';
        const sName = (h.service_name || h.name || '').trim();
        const pName = (h.partner_name || '').trim();
        if (!pName) return sName;
        if (sName.toLowerCase().startsWith(pName.toLowerCase())) {
            return sName;
        }
        return `${pName} - ${sName}`;
    };

    // Tổng tiền khách sạn cho cả đoàn
    const totalHotelCost = (selectedHotel && hotelMode === 'select')
        ? Number(selectedHotel.price) * hotelNights * hotelRoomsCount
        : 0;

    // Chi phí khách sạn ước tính / khách
    const hotelCostPerPax = (totalHotelCost > 0 && totalPax > 0)
        ? Math.round(totalHotelCost / totalPax)
        : 0;

    const hotelCost = hotelCostPerPax;

    // Ước tính chi phí di chuyển
    const activeTransportPriceInfo = getTransportCategoryPriceInfo(
        transportMode === 'select' ? transportCategory : 'standard',
        totalPax,
        formData.duration_days
    );

    const minTransportPax = activeTransportPriceInfo.hasPrice ? activeTransportPriceInfo.perPaxMin : 0;
    const maxTransportPax = activeTransportPriceInfo.hasPrice ? activeTransportPriceInfo.perPaxMax : 0;
    const minTransportTotal = activeTransportPriceInfo.hasPrice ? activeTransportPriceInfo.totalMin : 0;
    const maxTransportTotal = activeTransportPriceInfo.hasPrice ? activeTransportPriceInfo.totalMax : 0;

    // Tổng tạm tính dự kiến trên mỗi khách (Min - Max)
    const estimatedPerPaxMin = totalPlaceCost + hotelCostPerPax + minTransportPax;
    const estimatedPerPaxMax = totalPlaceCost + hotelCostPerPax + maxTransportPax;

    // Tổng tạm tính dự kiến cho cả đoàn (Min - Max)
    const estimatedGroupMin = (totalPlaceCost * totalPax) + totalHotelCost + minTransportTotal;
    const estimatedGroupMax = (totalPlaceCost * totalPax) + totalHotelCost + maxTransportTotal;

    const estimatedPerPaxDisplay = (estimatedPerPaxMin === estimatedPerPaxMax)
        ? `${formatMoney(estimatedPerPaxMin)} VNĐ / khách`
        : `${formatMoney(estimatedPerPaxMin)} – ${formatMoney(estimatedPerPaxMax)} VNĐ / khách`;

    const estimatedGroupDisplay = (estimatedGroupMin === estimatedGroupMax)
        ? `${formatMoney(estimatedGroupMin)} VNĐ`
        : `${formatMoney(estimatedGroupMin)} – ${formatMoney(estimatedGroupMax)} VNĐ`;

    const totalEstimatedCost = estimatedPerPaxMin;

    const filteredHotels = hotels.filter(h => {
        if (hotelCategory === 'all') return true;
        const name = (h.service_name + ' ' + (h.partner_name || '')).toLowerCase();
        if (hotelCategory === 'luxury') return name.includes('resort') || name.includes('villa') || name.includes('luxury') || name.includes('5 sao') || name.includes('marriott') || name.includes('vinpearl');
        if (hotelCategory === 'standard') return !name.includes('resort') && !name.includes('villa') && !name.includes('luxury') && !name.includes('5 sao');
        return true;
    });

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Tải thông tin dịch vụ di chuyển hệ thống (dịch vụ xe, vé máy bay & đội xe nội bộ)
    const loadTransportsData = async (destName = '') => {
        let loaded = [];
        try {
            const serviceRes = await axios.get('http://localhost:5000/api/services');
            if (serviceRes.data?.success && Array.isArray(serviceRes.data.data)) {
                loaded = serviceRes.data.data
                    .filter(s => s.status === 'Active' && (s.service_type === 'Vé máy bay' || s.service_type === 'Xe vận chuyển' || s.service_type === 'Transport'))
                    .map(s => ({
                        ...s,
                        partner_service_id: s.service_id,
                        price: s.base_cost || s.price || 0,
                        service_type: s.service_type
                    }));
            }
        } catch (sErr) {
            console.log("Services API error:", sErr);
        }

        if (loaded.length > 0) {
            setTransports(loaded);
        }

        // Tải danh sách đội xe thực tế để lấy đơn giá ngày và sức chứa chuẩn xác
        try {
            const fleetRes = await axios.get('http://localhost:5000/api/tours/fleet/public-vehicles');
            if (fleetRes.data?.success && Array.isArray(fleetRes.data.data)) {
                setFleetVehicles(fleetRes.data.data);
            }
        } catch (fErr) {
            console.log("Fleet vehicles API error:", fErr);
        }

        return loaded;
    };

    const handleDestinationChange = async (destName) => {
        setFormData({ ...formData, destination: destName });
        const selectedDest = destinationList.find(d => d.destination_name === destName);
        
        // Tải phương tiện cho điểm đến mới
        loadTransportsData(destName);

        if (selectedDest) {
            // Update suggested price
            const matchingTours = toursRef.filter(t => 
                t.destination.toLowerCase().includes(destName.toLowerCase()) || 
                destName.toLowerCase().includes(t.destination.toLowerCase())
            );
            if (matchingTours.length > 0) {
                const prices = matchingTours.map(t => Number(t.base_price));
                setSuggestedPrice({ min: Math.min(...prices), max: Math.max(...prices) });
            } else {
                setSuggestedPrice({ min: 0, max: 0 });
            }

            // Fetch Places & Hotels
            try {
                const placeRes = await axios.get(`http://localhost:5000/api/places?destination_id=${selectedDest.destination_id}`);
                if (placeRes.data.success) setAvailablePlaces(placeRes.data.data);

                let loadedHotels = [];

                try {
                    const extraRes = await axios.get(`http://localhost:5000/api/custom-tours/services/${encodeURIComponent(destName)}`);
                    if (extraRes.data?.success && extraRes.data?.data) {
                        if (Array.isArray(extraRes.data.data.accommodation) && extraRes.data.data.accommodation.length > 0) {
                            loadedHotels = extraRes.data.data.accommodation.map(h => ({
                                ...h,
                                partner_service_id: h.service_id,
                                price: h.base_cost || h.price || 0,
                                service_type: 'Khách sạn'
                            }));
                        }
                        if (Array.isArray(extraRes.data.data.transport) && extraRes.data.data.transport.length > 0) {
                            const destTransports = extraRes.data.data.transport.map(t => ({
                                ...t,
                                partner_service_id: t.service_id,
                                price: t.base_cost || t.price || 0,
                                service_type: t.service_type
                            }));
                            setTransports(prev => {
                                const map = new Map();
                                prev.forEach(item => map.set(item.service_id || item.id, item));
                                destTransports.forEach(item => map.set(item.service_id || item.id, item));
                                return Array.from(map.values());
                            });
                        }
                    }
                } catch (cErr) {
                    console.log("Custom-tours services API:", cErr);
                }

                try {
                    const serviceRes = await axios.get(`http://localhost:5000/api/services`);
                    if (serviceRes.data?.success && Array.isArray(serviceRes.data.data)) {
                        const allServices = serviceRes.data.data.map(s => ({ ...s, partner_service_id: s.service_id, price: s.base_cost }));
                        const destHotels = allServices.filter(s => s.service_type === 'Khách sạn' && (s.destination_id === selectedDest.destination_id || s.destination_id === null));
                        if (loadedHotels.length === 0 && destHotels.length > 0) loadedHotels = destHotels;
                    }
                } catch (sErr) {
                    console.log("Services API:", sErr);
                }

                setHotels(loadedHotels);

                // Reset selections when destination changes
                setPreferences({ hotel: '', transport: '', activities: [], note: '' });
            } catch (err) { console.error("Lỗi tải dữ liệu theo tỉnh:", err); }
        }
    };

    const handlePlaceToggle = (placeId) => {
        const currentActivities = preferences.activities;
        if (currentActivities.includes(placeId)) {
            setPreferences({ ...preferences, activities: currentActivities.filter(id => id !== placeId) });
        } else {
            setPreferences({ ...preferences, activities: [...currentActivities, placeId] });
        }
    };

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);

        const fetchReferenceTours = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/tours');
                if (response.data.success) setToursRef(response.data.data);
            } catch (error) { console.error(error); }
        };

        const fetchDestinations = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/destinations');
                if (response.data.success) setDestinationList(response.data.data);
            } catch (error) { console.error("Lỗi tải điểm đến:", error); }
        };

        fetchReferenceTours();
        fetchDestinations();
        loadTransportsData(); // Luôn tải danh sách phương tiện hệ thống ngay khi mở trang
    }, []);

    // Đảm bảo nhóm phương tiện đã chọn luôn nằm trong các nhóm khả dụng của quy mô đoàn
    useEffect(() => {
        const available = getAvailableTransportCategories(totalPax, formData.duration_days);
        if (available.length > 0 && !available.some(c => c.id === transportCategory)) {
            setTransportCategory(available[0].id);
        }
    }, [totalPax, formData.duration_days]);

    // Validation & Navigation
    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.destination) return alert("Vui lòng chọn Điểm đến mong muốn!");
            if (!formData.pickup_location) return alert("Vui lòng chọn hoặc nhập Điểm đón khách!");
            if (!formData.departure_date) return alert("Vui lòng chọn ngày khởi hành!");
            if (!formData.budget_estimate) return alert("Vui lòng nhập ngân sách ước tính!");
        }
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const selectedPlaceObjs = availablePlaces.filter(p => preferences.activities.includes(p.place_id));

            let retDate = '';
            if (formData.departure_date) {
                const depDateObj = new Date(formData.departure_date);
                depDateObj.setDate(depDateObj.getDate() + (formData.duration_days - 1));
                retDate = depDateObj.toISOString().split('T')[0];
            }

            const activePriceInfo = getTransportCategoryPriceInfo(
                transportMode === 'select' ? transportCategory : 'standard',
                totalPax,
                formData.duration_days
            );

            const payload = {
                destination: formData.destination,
                departure_date: formData.departure_date,
                return_date: retDate,
                people_count: participants.adults + participants.children + (participants.toddlers || 0) + (participants.infants || 0),
                budget: Number(formData.budget_estimate),
                
                preferences: {
                    ...preferences,
                    pickup_location: formData.pickup_location,
                    departure_time: formData.departure_time,
                    participantBreakdown: participants,
                    hotelName: hotelMode === 'self' ? 'Khách tự túc' : hotelMode === 'company' ? 'Công ty tự sắp xếp' : (selectedHotel ? getHotelDisplayName(selectedHotel) : 'Không chọn'),
                    hotelPrice: hotelCost,
                    hotelEstimatedCost: (selectedHotel && hotelMode === 'select') ? {
                        nights: hotelNights,
                        rooms: hotelRoomsCount,
                        pricePerNight: Number(selectedHotel.price),
                        totalEstimated: totalHotelCost,
                        perPax: hotelCostPerPax
                    } : null,
                    totalEstimatedCost: {
                        perPaxMin: estimatedPerPaxMin,
                        perPaxMax: estimatedPerPaxMax,
                        groupMin: estimatedGroupMin,
                        groupMax: estimatedGroupMax
                    },
                    transportName: getTransportDisplayString(),
                    transportPrice: 0,
                    transportOption: transportMode,
                    transportCategory: transportMode === 'select' ? transportCategory : null,
                    transportEstimatedCost: (transportMode === 'select' || transportMode === 'company') ? {
                        category: transportMode === 'select' ? transportCategory : 'company_recommended',
                        totalMin: activePriceInfo.totalMin,
                        totalMax: activePriceInfo.totalMax,
                        perPaxMin: activePriceInfo.perPaxMin,
                        perPaxMax: activePriceInfo.perPaxMax,
                        displayRange: activePriceInfo.displayTotal,
                        durationDays: formData.duration_days
                    } : null,
                    customTransportNote: transportMode === 'custom' ? customTransportNote.trim() : '',
                    recommendedVehicle: getRecommendedVehicle(totalPax),
                    guide: guideMode === 'company' ? 'Cần Hướng dẫn viên' : 'Khách tự túc',
                    meal: mealMode === 'company' ? 'Công ty tự sắp xếp' : 'Khách tự túc',
                    selectedPlaces: selectedPlaceObjs.map(place => ({
                        name: place.place_name,
                        price: Number(place.estimated_price || 0)
                    })),
                    note: preferences.note
                }
            };

            await axios.post('http://localhost:5000/api/custom-tours/request', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("🎉 Đã gửi yêu cầu thành công! Chuyên viên của chúng tôi sẽ liên hệ sớm nhất.");
            navigate('/my-bookings');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Không thể gửi yêu cầu");
        }
    };

    // --- Render Helpers ---

    const stepsConfig = [
        { num: 1, title: 'Thông tin chuyến đi' },
        { num: 2, title: 'Lưu trú & Di chuyển' },
        { num: 3, title: 'Trải nghiệm & Hoạt động' },
        { num: 4, title: 'Xác nhận & Gửi' }
    ];

    const renderStepper = () => (
        <div className="wizard-stepper-wrapper">
            {/* Desktop Stepper */}
            <div className="wizard-stepper">
                {stepsConfig.map((step, idx) => {
                    const isActive = step.num === currentStep;
                    const isCompleted = step.num < currentStep;
                    return (
                        <React.Fragment key={step.num}>
                            <div className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                <div className="stepper-circle">
                                    {isCompleted ? <FiCheckCircle size={18} /> : step.num}
                                </div>
                                <div className="stepper-label">
                                    <span className="stepper-step-num">BƯỚC {step.num}</span>
                                    <span className="stepper-step-title">{step.title}</span>
                                </div>
                            </div>
                            {idx < stepsConfig.length - 1 && (
                                <div className={`stepper-connector ${step.num < currentStep ? 'completed' : ''}`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Mobile Stepper Pill */}
            <div className="mobile-stepper-pill">
                <div className="mobile-stepper-info">
                    <span className="mobile-stepper-counter">BƯỚC {currentStep} / {totalSteps}</span>
                    <span className="mobile-stepper-title">{stepsConfig[currentStep - 1]?.title}</span>
                </div>
                <div className="mobile-stepper-dots">
                    {stepsConfig.map((step) => {
                        const isDotActive = step.num === currentStep;
                        const isDotCompleted = step.num < currentStep;
                        return (
                            <div 
                                key={step.num} 
                                className={`mobile-step-dot ${isDotActive ? 'active' : ''} ${isDotCompleted ? 'completed' : ''}`}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="wizard-step step-1">
            <div className="step-header">
                <h3 className="step-title">
                    <span className="step-title-icon"><FiMapPin /></span> 
                    Thông tin chuyến đi
                </h3>
                <p className="step-desc">Lựa chọn những thông tin cơ bản nhất cho chuyến hành trình của bạn.</p>
            </div>

            <div className="input-grid">
                <div className="form-group field-full">
                    <label><FiMapPin /> Điểm đến mong muốn *</label>
                    <div className="custom-select-wrapper">
                        <select required value={formData.destination} onChange={(e) => handleDestinationChange(e.target.value)}>
                            <option value="" disabled>-- Chọn tỉnh / thành phố điểm đến --</option>
                            {destinationList.map(dest => (
                                <option key={dest.destination_id} value={dest.destination_name}>{dest.destination_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group field-full">
                    <label><FiMapPin /> Điểm đón khách *</label>
                    <input 
                        type="text" 
                        placeholder="Nhập địa chỉ hoặc sân bay đón khách (VD: Sân bay Tân Sơn Nhất, TPHCM)" 
                        value={formData.pickup_location} 
                        onChange={(e) => setFormData({...formData, pickup_location: e.target.value})} 
                    />
                </div>

                <div className="form-group field-half">
                    <label><FiCalendar /> Thời gian khởi hành dự kiến (dd/mm/yyyy) *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <FormattedDateInput
                                value={formData.departure_date}
                                onChange={(val) => setFormData({ ...formData, departure_date: val })}
                                min={new Date().toISOString().split('T')[0]}
                                placeholder="dd/mm/yyyy"
                            />
                        </div>
                        <input 
                            type="time" 
                            style={{ width: '130px' }} 
                            value={formData.departure_time || ''} 
                            onChange={(e) => setFormData({...formData, departure_time: e.target.value})} 
                        />
                    </div>
                </div>
                
                <div className="form-group field-half">
                    <label><FiCalendar /> Thời gian đi (Số ngày) *</label>
                    <div className="pax-counter-card" style={{ padding: '8px 14px' }}>
                        <div className="pax-controls" style={{ width: '100%', boxSizing: 'border-box' }}>
                            <button type="button" className="pax-btn" onClick={() => setFormData(f => ({...f, duration_days: Math.max(1, f.duration_days - 1)}))}>-</button>
                            <span className="pax-value" style={{ fontWeight: 800, color: 'var(--tv-primary)' }}>{formData.duration_days} ngày</span>
                            <button type="button" className="pax-btn" onClick={() => setFormData(f => ({...f, duration_days: f.duration_days + 1}))}>+</button>
                        </div>
                    </div>
                </div>

                <div className="form-group field-full">
                    <div className="pax-section-title">
                        <span><FiUsers /> Số lượng thành viên đoàn *</span>
                        <span className="pax-total-badge">Tổng cộng: {totalPax} khách</span>
                    </div>
                    <div className="pax-counter-grid">
                        <div className="pax-counter-card">
                            <div className="pax-card-header">
                                <span className="pax-card-name">Người lớn</span>
                                <span className="pax-card-sub">Từ 12 tuổi trở lên</span>
                            </div>
                            <div className="pax-controls">
                                <button type="button" className="pax-btn" onClick={() => setParticipants(p => ({...p, adults: Math.max(1, p.adults - 1)}))}>-</button>
                                <span className="pax-value">{participants.adults}</span>
                                <button type="button" className="pax-btn" onClick={() => setParticipants(p => ({...p, adults: p.adults + 1}))}>+</button>
                            </div>
                        </div>

                        <div className="pax-counter-card">
                            <div className="pax-card-header">
                                <span className="pax-card-name">Trẻ em</span>
                                <span className="pax-card-sub">Từ 5 – 11 tuổi</span>
                            </div>
                            <div className="pax-controls">
                                <button type="button" className="pax-btn" onClick={() => setParticipants(p => ({...p, children: Math.max(0, p.children - 1)}))}>-</button>
                                <span className="pax-value">{participants.children}</span>
                                <button type="button" className="pax-btn" onClick={() => setParticipants(p => ({...p, children: p.children + 1}))}>+</button>
                            </div>
                        </div>

                        <div className="pax-counter-card">
                            <div className="pax-card-header">
                                <span className="pax-card-name">Trẻ nhỏ</span>
                                <span className="pax-card-sub">Từ 2 – 4 tuổi</span>
                            </div>
                            <div className="pax-controls">
                                <button type="button" className="pax-btn" onClick={() => setParticipants(p => ({...p, toddlers: Math.max(0, p.toddlers - 1)}))}>-</button>
                                <span className="pax-value">{participants.toddlers}</span>
                                <button type="button" className="pax-btn" onClick={() => setParticipants(p => ({...p, toddlers: p.toddlers + 1}))}>+</button>
                            </div>
                        </div>

                        <div className="pax-counter-card">
                            <div className="pax-card-header">
                                <span className="pax-card-name">Em bé</span>
                                <span className="pax-card-sub">Dưới 2 tuổi</span>
                            </div>
                            <div className="pax-controls">
                                <button type="button" className="pax-btn" onClick={() => setParticipants(p => ({...p, infants: Math.max(0, p.infants - 1)}))}>-</button>
                                <span className="pax-value">{participants.infants}</span>
                                <button type="button" className="pax-btn" onClick={() => setParticipants(p => ({...p, infants: p.infants + 1}))}>+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group field-full">
                    <label><FiDollarSign /> Ngân sách ước tính (trên 1 người) *</label>
                    {suggestedPrice.min > 0 && (
                        <div className="price-hint-badge">💡 Gợi ý hệ thống: {formatMoney(suggestedPrice.min)}đ - {formatMoney(suggestedPrice.max)}đ</div>
                    )}
                    <input 
                        type="text" 
                        placeholder="Nhập số tiền bạn dự kiến chi trả cho 1 người (VD: 5.000.000)" 
                        value={formData.budget_estimate ? formatMoney(Number(formData.budget_estimate)) : ''} 
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            setFormData({...formData, budget_estimate: rawValue});
                        }} 
                    />
                    {formData.budget_estimate && (
                        <div style={{ marginTop: '8px', color: '#10b981', fontWeight: '600', fontSize: '0.95rem' }}>
                            💰 Tổng ngân sách dự kiến cho cả đoàn ({totalPax} người): {formatMoney(Number(formData.budget_estimate) * totalPax)}đ
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="wizard-step step-2">
            <div className="step-header">
                <h3 className="step-title">
                    <span className="step-title-icon"><FiHome /></span>
                    Dịch vụ Lưu trú & Di chuyển
                </h3>
                <p className="step-desc">Tùy chọn nơi lưu trú, phương tiện di chuyển và các dịch vụ đi kèm theo mong muốn của bạn.</p>
            </div>
            
            <div className="service-notice-banner">
                <FiCheckCircle size={18} />
                <div>
                    <strong>Lưu ý dịch vụ:</strong> Các lựa chọn dịch vụ dưới đây mang tính chất tham khảo mong muốn. Chuyên viên sẽ căn cứ vào tình trạng phòng, đội xe thực tế và thời điểm xuất phát để tối ưu chi phí và chất lượng trong bản báo giá chính thức.
                </div>
            </div>

            {/* KHÁCH SẠN & LƯU TRÚ */}
            <div className="service-section">
                <h4 className="section-subtitle"><FiHome /> Khách sạn & Lưu trú</h4>
                
                <div className="modern-choice-group">
                    <div 
                        className={`modern-choice-card ${hotelMode === 'self' ? 'active' : ''}`}
                        onClick={() => { setHotelMode('self'); setPreferences({...preferences, hotel: ''}); }}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">🧳</span>
                            <span className="choice-title">Khách tự túc</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {hotelMode === 'self' && <div className="choice-radio-dot" />}
                        </div>
                    </div>

                    <div 
                        className={`modern-choice-card ${hotelMode === 'company' ? 'active' : ''}`}
                        onClick={() => { setHotelMode('company'); setPreferences({...preferences, hotel: ''}); }}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">🏢</span>
                            <span className="choice-title">Công ty tự sắp xếp</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {hotelMode === 'company' && <div className="choice-radio-dot" />}
                        </div>
                    </div>

                    <div 
                        className={`modern-choice-card ${hotelMode === 'select' ? 'active' : ''}`}
                        onClick={() => setHotelMode('select')}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">⭐</span>
                            <span className="choice-title">Chọn khách sạn cụ thể</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {hotelMode === 'select' && <div className="choice-radio-dot" />}
                        </div>
                    </div>
                </div>

                {hotelMode === 'select' && (
                    <div style={{ marginTop: '16px' }}>
                        <div className="filter-chips-row">
                            <button type="button" className={`filter-chip ${hotelCategory === 'all' ? 'active' : ''}`} onClick={() => setHotelCategory('all')}>Tất cả phân khúc</button>
                            <button type="button" className={`filter-chip ${hotelCategory === 'luxury' ? 'active' : ''}`} onClick={() => setHotelCategory('luxury')}>🌟 Cao cấp (5 Sao / Resort)</button>
                            <button type="button" className={`filter-chip ${hotelCategory === 'standard' ? 'active' : ''}`} onClick={() => setHotelCategory('standard')}>🏨 Tiêu chuẩn (3–4 Sao)</button>
                        </div>
                        {filteredHotels.length === 0 ? (
                            <div className="empty-state-box">Chưa có dữ liệu khách sạn thuộc phân khúc này tại điểm đến đã chọn.</div>
                        ) : (
                            <div className="hotels-grid">
                                {filteredHotels.map(h => {
                                    const isSelected = String(preferences.hotel) === String(h.partner_service_id);
                                    return (
                                        <div 
                                            key={h.partner_service_id} 
                                            className={`hotel-booking-card ${isSelected ? 'selected' : ''}`} 
                                            onClick={() => setPreferences({
                                                ...preferences, 
                                                hotel: isSelected ? '' : h.partner_service_id.toString()
                                            })}
                                        >
                                            <div className="hotel-thumb-wrapper">
                                                {h.image_url ? (
                                                    <img className="hotel-thumb-img" src={`http://localhost:5000${h.image_url}`} alt={h.service_name} />
                                                ) : (
                                                    <div className="place-no-img"><span>🏨</span><small>Không ảnh</small></div>
                                                )}
                                                {isSelected && (
                                                    <div className="hotel-badge-selected">
                                                        <FiCheckCircle size={14} /> Đang chọn
                                                    </div>
                                                )}
                                            </div>
                                            <div className="hotel-card-content">
                                                <div>
                                                    <div className="hotel-name">{h.service_name}</div>
                                                    <div className="hotel-partner">{h.partner_name || 'Đối tác TravelVN'}</div>
                                                </div>
                                                <div className="hotel-pricing-box">
                                                    <span className="hotel-price-per-night">Dự kiến / đêm:</span>
                                                    <span className="hotel-price-num">+{formatMoney(Number(h.price))}đ</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PHƯƠNG TIỆN DI CHUYỂN */}
            <div className="service-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <h4 className="section-subtitle" style={{ margin: 0 }}><FiTruck /> Phương tiện Di chuyển</h4>
                    <div className="transport-rec-badge">
                        💡 Đề xuất đoàn {totalPax > 0 ? `${totalPax} khách` : 'hiện tại'}: <strong>{getRecommendedVehicle(totalPax)}</strong>
                    </div>
                </div>
                
                {/* 3 PHƯƠNG ÁN CHỌN PHƯƠNG TIỆN */}
                <div className="modern-choice-group">
                    <div 
                        className={`modern-choice-card ${transportMode === 'company' ? 'active' : ''}`}
                        onClick={() => setTransportMode('company')}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">🏢</span>
                            <span className="choice-title">Theo đề xuất của công ty</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {transportMode === 'company' && <div className="choice-radio-dot" />}
                        </div>
                    </div>

                    <div 
                        className={`modern-choice-card ${transportMode === 'select' ? 'active' : ''}`}
                        onClick={() => setTransportMode('select')}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">🚗</span>
                            <span className="choice-title">Khách tự chọn nhu cầu</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {transportMode === 'select' && <div className="choice-radio-dot" />}
                        </div>
                    </div>

                    <div 
                        className={`modern-choice-card ${transportMode === 'custom' ? 'active' : ''}`}
                        onClick={() => setTransportMode('custom')}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">✍️</span>
                            <span className="choice-title">Yêu cầu riêng</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {transportMode === 'custom' && <div className="choice-radio-dot" />}
                        </div>
                    </div>
                </div>

                {/* NỘI DUNG CHI TIẾT TỪNG PHƯƠNG ÁN */}
                {/* PHƯƠNG ÁN 1: THEO ĐỀ XUẤT CỦA CÔNG TY */}
                {transportMode === 'company' && (() => {
                    const companyPrice = getTransportCategoryPriceInfo('standard', totalPax, formData.duration_days);
                    return (
                        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                <div style={{ fontSize: '30px' }}>✨</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>TravelVN tự động bố trí phương tiện tối ưu nhất</strong>
                                        <span style={{ fontSize: '12px', background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>
                                            Lựa chọn khuyên dùng • Tối ưu chi phí
                                        </span>
                                    </div>
                                    <p style={{ margin: '6px 0 14px 0', fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>
                                        Công ty sẽ chủ động sắp xếp phương tiện chất lượng cao, an toàn, phù hợp với quy mô đoàn <strong>{totalPax} người</strong> (đề xuất: <strong>{getRecommendedVehicle(totalPax)}</strong>), hành trình {formData.duration_days} ngày và ngân sách của bạn. Bạn không cần bận tâm chọn loại xe cụ thể.
                                    </p>

                                    {companyPrice.hasPrice && (
                                        <div style={{ padding: '14px 18px', background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                            <div>
                                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                                    Chi phí dự kiến tham khảo ({formData.duration_days} ngày):
                                                </span>
                                                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--tv-primary)', marginTop: '2px' }}>
                                                    {companyPrice.displayTotal} <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>/ đoàn</span>
                                                </div>
                                            </div>
                                            {companyPrice.displayPerPax && (
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Ước tính / khách:</span>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#059669', marginTop: '2px' }}>
                                                        {companyPrice.displayPerPax}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', fontStyle: 'italic' }}>
                                        💡 Chi phí trên là mức dự kiến tham khảo cho lịch trình {formData.duration_days} ngày. Chuyên viên TravelVN sẽ tính toán và xác nhận chi phí chính xác trong bản báo giá.
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* PHƯƠNG ÁN 2: KHÁCH TỰ CHỌN NHU CẦU PHƯƠNG TIỆN */}
                {transportMode === 'select' && (
                    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                                Nhóm phương tiện phù hợp với đoàn ({totalPax} khách):
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', lineHeight: '1.5' }}>
                                Hệ thống tự động đề xuất các nhóm phương tiện có sức chứa phù hợp nhất và ước tính chi phí cho chuyến đi {formData.duration_days} ngày. Chuyên viên sẽ căn cứ vào nhóm bạn chọn để bố trí dòng xe chuẩn xác trong báo giá.
                            </div>
                        </div>

                        {totalPax > 45 ? (
                            <div style={{ padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', color: '#92400e', fontSize: '13.5px', lineHeight: '1.6' }}>
                                <strong>⚠️ Quy mô đoàn lớn ({totalPax} người):</strong> Số lượng thành viên vượt quá sức chứa của 1 xe du lịch 45 chỗ. Chuyên viên TravelVN sẽ chủ động liên hệ tư vấn phương án kết hợp nhiều xe (ví dụ: 2 xe 29 chỗ hoặc xe 45 chỗ + 16 chỗ) tối ưu nhất. Quý khách vui lòng chọn phương án <strong>"Theo đề xuất của công ty"</strong> hoặc nhập <strong>"Yêu cầu riêng"</strong>.
                            </div>
                        ) : (
                            <div className="transport-grid">
                                {getAvailableTransportCategories(totalPax, formData.duration_days).map(cat => {
                                    const isSelected = transportCategory === cat.id;
                                    const priceInfo = cat.priceInfo || getTransportCategoryPriceInfo(cat.id, totalPax, formData.duration_days);

                                    return (
                                        <div
                                            key={cat.id}
                                            onClick={() => setTransportCategory(cat.id)}
                                            className={`transport-choice-card ${isSelected ? 'selected' : ''}`}
                                        >
                                            <div>
                                                <div className="transport-card-header">
                                                    <div className="transport-icon-title">
                                                        <span className="transport-icon">{cat.icon}</span>
                                                        <div className="transport-title-group">
                                                            <h5>{cat.title}</h5>
                                                            <span className="transport-vehicle-class">{cat.vehicleClass}</span>
                                                        </div>
                                                    </div>
                                                    <div className="choice-radio-indicator">
                                                        {isSelected && <div className="choice-radio-dot" />}
                                                    </div>
                                                </div>

                                                <div className="transport-badge-row">
                                                    <span className={`transport-badge ${
                                                        cat.badge === 'Cao cấp' ? 'transport-badge-vip' : 
                                                        cat.badge === 'Nhanh chóng' ? 'transport-badge-flight' : 
                                                        'transport-badge-eco'
                                                    }`}>
                                                        {cat.badge}
                                                    </span>
                                                    {cat.companyBadge && (
                                                        <span className="transport-badge transport-badge-recommended">
                                                            {cat.companyBadge}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="transport-desc">
                                                    {cat.description}
                                                </p>
                                            </div>

                                            {/* KHỐI HIỂN THỊ CHI PHÍ ƯỚC TÍNH */}
                                            <div className="transport-pricing-block">
                                                <div className="pricing-top-row">
                                                    <span>Chi phí ước tính:</span>
                                                    {priceInfo.hasPrice && priceInfo.displayPerPax && (
                                                        <span className="pricing-per-pax">{priceInfo.displayPerPax}</span>
                                                    )}
                                                </div>

                                                {priceInfo.hasPrice ? (
                                                    <div>
                                                        <div className="pricing-total-amount">
                                                            {priceInfo.displayTotal} <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--tv-muted)' }}>/ đoàn</span>
                                                        </div>
                                                        <div className="pricing-note">
                                                            {priceInfo.note}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#d97706', marginTop: '4px' }}>
                                                            ⚠️ {priceInfo.displayTotal}
                                                        </div>
                                                        <div className="pricing-note">
                                                            {priceInfo.note}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* PHƯƠNG ÁN 3: YÊU CẦU RIÊNG */}
                {transportMode === 'custom' && (
                    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', marginTop: '12px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                            ✍️ Nhập mong muốn cụ thể về phương tiện di chuyển:
                        </label>
                        <textarea
                            value={customTransportNote}
                            onChange={(e) => setCustomTransportNote(e.target.value)}
                            placeholder="Ví dụ: Đoàn chỉ có 5 người nhưng muốn sử dụng xe 29 chỗ vì cần không gian rộng rãi để nhiều hành lý; muốn xe đời mới 2024; hoặc xe có cửa trượt tự động..."
                            rows={3}
                            className="premium-textarea"
                        />
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', lineHeight: '1.4' }}>
                            💡 Nhân viên văn phòng sẽ xem xét kỹ mong muốn này của bạn để chọn dòng xe và tối ưu chi phí phù hợp nhất khi lập báo giá.
                        </div>
                    </div>
                )}
            </div>

            {/* HƯỚNG DẪN VIÊN */}
            <div className="service-section">
                <h4 className="section-subtitle"><FiUsers /> Hướng dẫn viên & Dẫn đoàn</h4>
                
                <div className="modern-choice-group">
                    <div 
                        className={`modern-choice-card ${guideMode === 'company' ? 'active' : ''}`}
                        onClick={() => setGuideMode('company')}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">🚩</span>
                            <span className="choice-title">Cần công ty bố trí Hướng dẫn viên</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {guideMode === 'company' && <div className="choice-radio-dot" />}
                        </div>
                    </div>

                    <div 
                        className={`modern-choice-card ${guideMode === 'self' ? 'active' : ''}`}
                        onClick={() => setGuideMode('self')}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">🚶</span>
                            <span className="choice-title">Tự túc không cần Hướng dẫn viên</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {guideMode === 'self' && <div className="choice-radio-dot" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* DỊCH VỤ ĂN UỐNG */}
            <div className="service-section">
                <h4 className="section-subtitle"><FiCoffee /> Dịch vụ Ăn uống</h4>
                
                <div className="modern-choice-group">
                    <div 
                        className={`modern-choice-card ${mealMode === 'company' ? 'active' : ''}`}
                        onClick={() => setMealMode('company')}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">🍽️</span>
                            <span className="choice-title">Để công ty sắp xếp thực đơn chuẩn</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {mealMode === 'company' && <div className="choice-radio-dot" />}
                        </div>
                    </div>

                    <div 
                        className={`modern-choice-card ${mealMode === 'self' ? 'active' : ''}`}
                        onClick={() => setMealMode('self')}
                    >
                        <div className="choice-label-wrapper">
                            <span className="choice-icon">🍜</span>
                            <span className="choice-title">Khách tự túc ăn uống</span>
                        </div>
                        <div className="choice-radio-indicator">
                            {mealMode === 'self' && <div className="choice-radio-dot" />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="wizard-step step-3">
            <div className="step-header">
                <h3 className="step-title">
                    <span className="step-title-icon"><FiCamera /></span>
                    Trải nghiệm & Hoạt động
                </h3>
                <p className="step-desc">Chọn các địa điểm tham quan mà bạn và đoàn muốn khám phá tại điểm đến.</p>
            </div>

            {availablePlaces.length === 0 ? (
                <div className="empty-state-box">
                    <span>📍</span>
                    <p>Vui lòng chọn <strong>Điểm đến mong muốn</strong> ở Bước 1 để hiển thị danh sách các điểm tham quan nổi bật.</p>
                </div>
            ) : (
                <div className="places-grid">
                    {availablePlaces.map(place => {
                        const isSelected = preferences.activities.includes(place.place_id);
                        return (
                            <div 
                                key={place.place_id} 
                                className={`place-card-modern ${isSelected ? 'selected' : ''}`} 
                                onClick={() => handlePlaceToggle(place.place_id)}
                            >
                                <div className="place-thumb-box">
                                    {place.image_url ? (
                                        <img className="place-thumb-img" src={`http://localhost:5000${place.image_url}`} alt={place.place_name} />
                                    ) : (
                                        <div className="place-no-img">
                                            <FiCamera size={24} />
                                            <small>Điểm đến du lịch</small>
                                        </div>
                                    )}
                                    {isSelected && (
                                        <div className="place-check-pill">
                                            <FiCheckCircle size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className="place-card-body">
                                    <div className="place-name">{place.place_name}</div>
                                    <div className="place-meta-row">
                                        <span className="place-category-tag">{place.category || 'Tham quan'}</span>
                                        <span className={`place-price-badge ${Number(place.estimated_price) > 0 ? '' : 'free'}`}>
                                            {Number(place.estimated_price) > 0 ? `+${formatMoney(Number(place.estimated_price))}đ` : 'Miễn phí'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderStep4 = () => (
        <div className="wizard-step step-4">
            <div className="step-header">
                <h3 className="step-title">
                    <span className="step-title-icon"><FiCheckCircle /></span>
                    Xác nhận & Gửi Yêu Cầu
                </h3>
                <p className="step-desc">Kiểm tra lại toàn bộ thông tin chuyến đi và để lại lời nhắn cho chuyên viên tư vấn TravelVN.</p>
            </div>

            <div className="summary-container-card">
                <div className="summary-card-header">
                    <h4>📋 Tóm tắt kế hoạch chuyến đi</h4>
                    <span className="pax-total-badge">{totalPax} khách • {formData.duration_days} ngày</span>
                </div>

                <div className="summary-items-list">
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiMapPin size={16} /> Hành trình:</div>
                        <div className="summary-item-right">{formData.pickup_location || 'Chưa nhập'} → <strong>{formData.destination || 'Chưa chọn'}</strong></div>
                    </div>
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiCalendar size={16} /> Thời gian:</div>
                        <div className="summary-item-right">{formData.departure_time ? formData.departure_time + ' - ' : ''}{formatDateDMY(formData.departure_date)} ({formData.duration_days} ngày)</div>
                    </div>
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiUsers size={16} /> Thành viên:</div>
                        <div className="summary-item-right">{participants.adults} Người lớn{participants.children > 0 ? `, ${participants.children} Trẻ em` : ''}{participants.toddlers > 0 ? `, ${participants.toddlers} Trẻ nhỏ` : ''}{participants.infants > 0 ? `, ${participants.infants} Em bé` : ''}</div>
                    </div>
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiDollarSign size={16} /> Ngân sách ước tính:</div>
                        <div className="summary-item-right">{formData.budget_estimate ? `${formatMoney(Number(formData.budget_estimate))} VNĐ / khách` : 'Chưa nhập'}</div>
                    </div>
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiHome size={16} /> Khách sạn & Lưu trú:</div>
                        <div className="summary-item-right">{hotelMode === 'self' ? 'Khách tự túc' : hotelMode === 'company' ? 'Công ty tự sắp xếp' : (selectedHotel ? getHotelDisplayName(selectedHotel) : 'Chưa chọn')}</div>
                    </div>
                    {hotelMode === 'select' && selectedHotel && (
                        <div className="summary-list-item" style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                            <div className="summary-item-left" style={{ color: 'var(--tv-primary)' }}>
                                Ước tính lưu trú ({hotelNights} đêm):
                            </div>
                            <div className="summary-item-right" style={{ color: 'var(--tv-primary)', fontWeight: '700' }}>
                                {formatMoney(totalHotelCost)}đ (~{formatMoney(hotelCostPerPax)}đ / khách)
                            </div>
                        </div>
                    )}
                    {hotelMode === 'company' && (
                        <div className="summary-list-item" style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                            <div className="summary-item-left" style={{ color: 'var(--tv-primary)' }}>
                                Ước tính lưu trú ({hotelNights} đêm):
                            </div>
                            <div className="summary-item-right" style={{ color: '#059669', fontWeight: '600', fontSize: '13px' }}>
                                Công ty bố trí khách sạn tiêu chuẩn theo ngân sách
                            </div>
                        </div>
                    )}
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiTruck size={16} /> Phương tiện di chuyển:</div>
                        <div className="summary-item-right">{getTransportDisplayString()}</div>
                    </div>
                    {activeTransportPriceInfo.hasPrice && (
                        <div className="summary-list-item" style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                            <div className="summary-item-left" style={{ color: 'var(--tv-primary)' }}>
                                Ước tính di chuyển ({formData.duration_days} ngày):
                            </div>
                            <div className="summary-item-right" style={{ color: 'var(--tv-primary)', fontWeight: '700' }}>
                                {activeTransportPriceInfo.displayTotal} ({activeTransportPriceInfo.displayPerPax})
                            </div>
                        </div>
                    )}
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiUsers size={16} /> Hướng dẫn viên:</div>
                        <div className="summary-item-right">{guideMode === 'company' ? 'Cần công ty bố trí HDV' : 'Khách tự túc'}</div>
                    </div>
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiCoffee size={16} /> Ăn uống:</div>
                        <div className="summary-item-right">{mealMode === 'company' ? 'Công ty tự sắp xếp' : 'Khách tự túc'}</div>
                    </div>
                    <div className="summary-list-item">
                        <div className="summary-item-left"><FiCamera size={16} /> Điểm tham quan:</div>
                        <div className="summary-item-right">{preferences.activities.length} địa điểm đã chọn {totalPlaceCost > 0 ? `(+${formatMoney(totalPlaceCost)}đ / khách)` : ''}</div>
                    </div>
                </div>

                <div className="summary-total-banner">
                    <div>
                        <div className="total-banner-label">Tạm tính dịch vụ cơ bản đã chọn:</div>
                        <div style={{ fontSize: '12px', color: '#c2410c', marginTop: '3px', fontWeight: '600' }}>
                            Dự kiến cả đoàn ({totalPax} khách): {estimatedGroupDisplay}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <strong className="total-banner-amount">{estimatedPerPaxDisplay}</strong>
                    </div>
                </div>
            </div>

            <div className="service-warning-banner">
                <FiCheckCircle size={18} />
                <p style={{ margin: 0 }}><strong>Lưu ý quan trọng:</strong> Các chi phí được liệt kê (bao gồm ngân sách và dịch vụ lựa chọn) chỉ mang tính chất tham khảo tạm tính. Giá chính thức sẽ được chuyên viên TravelVN báo lại chi tiết dựa trên tình trạng phòng, phương tiện thực tế và thời điểm xuất phát sau khi bạn gửi yêu cầu.</p>
            </div>

            <div className="form-group" style={{ marginTop: '24px' }}>
                <label><FiEdit3 /> Ghi chú yêu cầu đặc biệt (Ăn chay, hỗ trợ xe lăn, yêu cầu đặc biệt...)</label>
                <textarea 
                    rows="4" 
                    placeholder="Hãy chia sẻ thêm về mong muốn của bạn để chuyến đi trọn vẹn nhất..." 
                    value={preferences.note}
                    onChange={(e) => setPreferences({...preferences, note: e.target.value})}
                    className="premium-textarea"
                />
            </div>
        </div>
    );

    return (
        <div className="homepage-container">
            {/* NAVBAR GIAO DIỆN CHUẨN */}
            <CustomerNavbar activeTab="build-tour" />

            <div className="wizard-page-wrapper">
                <div className="wizard-container">
                    <div className="wizard-header">
                        <div className="header-badge">✨ Cá nhân hóa hành trình • TravelVN</div>
                        <h2>Thiết Kế Chuyến Đi Trong Mơ</h2>
                        <p>Cá nhân hóa trải nghiệm du lịch theo đúng gu và phong cách của bạn</p>
                    </div>

                    {renderStepper()}

                    <div className="wizard-body">
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                        {currentStep === 4 && renderStep4()}
                    </div>

                    <div className="wizard-footer">
                        {currentStep > 1 ? (
                            <button className="btn-back-modern" onClick={prevStep}><FiChevronLeft /> Quay lại</button>
                        ) : <div></div>}
                        
                        {currentStep < totalSteps ? (
                            <button className="btn-next-modern" onClick={nextStep}>Tiếp tục <FiChevronRight /></button>
                        ) : (
                            <button className="btn-submit-modern" onClick={handleSubmit}>Hoàn Tất & Gửi Yêu Cầu</button>
                        )}
                    </div>
                </div>
            </div>
            
            <CustomerFooter />
        </div>
    );
};

export default CustomerTourBuilder;
