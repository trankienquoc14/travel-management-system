import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimelineBuilder from './TourBuilder/TimelineBuilder';
import { formatVehicleDisplayName } from '../utils/vehicleDisplayHelper';

const cleanHotelDisplayName = (name) => {
    if (!name || typeof name !== 'string') return '';
    let cleaned = name.trim();
    const parts = cleaned.split(' - ').map(p => p.trim());
    if (parts.length >= 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
        parts.splice(1, 1);
        cleaned = parts.join(' - ');
    }
    return cleaned;
};

const formatMoneyLocal = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    return Number(amount).toLocaleString('vi-VN');
};

const FormattedMoneyInput = ({ value, onChange, style }) => {
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
        const rawBeforeCursor = input.value.substring(0, currentCursor).replace(/\D/g, '');
        
        const raw = input.value.replace(/\D/g, '');
        const newVal = raw ? Number(raw) : '';
        const newFormatted = newVal ? Number(newVal).toLocaleString('vi-VN') : '';
        
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
            style={style}
        />
    );
};

const StaffTourDesigner = ({ requestData, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [manualSellingPrice, setManualSellingPrice] = useState(null);

    // Multi-destination Routing State
    const [dayImages, setDayImages] = useState({});
    const [dayImagePreviews, setDayImagePreviews] = useState({});
    const [days, setDays] = useState([]);
    const [tourName, setTourName] = useState('');
    const [tourDescription, setTourDescription] = useState('');

    // Costing State (simplified for Custom Tours)
    const [costConfig, setCostConfig] = useState({
        minimumPax: requestData?.people_count || 1,
        margin: requestData?.markup_percent || 20,
        fixed: { transport: 0, guidePerDay: 500000, otherFixed: 0 },
        variable: { accommPerNight: 0, breakfast: 200000, lunch: 200000, dinner: 200000, tickets: 0, insurance: 0 },
        selectedTransport: null,
        transportTimes: { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' },
        transportLocations: { startD: '', endD: '', startR: '', endR: '' },
        ageMultiplier: {
            preset: 'custom',
            child: { percent: 0, fixed_surcharge: 0 },
            toddler: { percent: 0, fixed_surcharge: 0 },
            infant: { percent: 0, fixed_surcharge: 0 }
        }
    });

    const [staffNote, setStaffNote] = useState('');

    // Resources
    const [destinations, setDestinations] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [transportServices, setTransportServices] = useState([]);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const token = localStorage.getItem("token");
                const [resDest, resServ, resFleet] = await Promise.all([
                    axios.get("http://localhost:5000/api/destinations", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("http://localhost:5000/api/services", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("http://localhost:5000/api/tours/fleet/public-vehicles", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { success: false } }))
                ]);
                
                if (resDest.data.success) setDestinations(resDest.data.data);
                if (resServ.data.success) {
                    setAllServices(resServ.data.data);
                    let transports = resServ.data.data.filter(s => 
                        (s.vehicle_service_id !== null && s.vehicle_service_id !== undefined) ||
                        s.service_type === 'Xe vận chuyển' ||
                        s.service_type === 'Vé máy bay' ||
                        s.service_type === 'Phương tiện' ||
                        s.service_type === 'Transport'
                    );

                    if (resFleet?.data?.success && Array.isArray(resFleet.data.data)) {
                        const fleetVehicles = resFleet.data.data.map(v => ({
                            service_id: `fleet_${v.vehicle_id}`,
                            service_name: `${v.vehicle_name} (${v.license_plate || v.capacity + ' chỗ'})`,
                            base_cost: Number(v.base_cost ?? v.price ?? v.selling_price ?? v.price_per_day ?? 0),
                            capacity: v.capacity,
                            service_type: 'Xe vận chuyển',
                            unit: 'ngày'
                        }));
                        transports = [...transports, ...fleetVehicles];
                    }

                    transports.sort((a, b) => Number(a.capacity || a.seat_capacity || 0) - Number(b.capacity || b.seat_capacity || 0));
                    setTransportServices(transports);
                }
            } catch (error) { console.error('Lỗi tải dữ liệu', error); }
        };
        fetchResources();
    }, []);

    useEffect(() => {
        if (!requestData) return;
        
        let parsedProposal = null;
        const rawProposal = requestData.proposed_itinerary || requestData.itinerary || requestData.proposed_plan;
        if (rawProposal) {
            try {
                parsedProposal = typeof rawProposal === 'string' 
                    ? JSON.parse(rawProposal) 
                    : rawProposal;
            } catch (e) {
                console.error("Lỗi parse proposed_itinerary", e);
            }
        }

        const proposedServices = parsedProposal?.proposedServices || parsedProposal || {};
        const quotedTransport = proposedServices.transport || null;
        const quotedHotel = proposedServices.hotel || null;
        const quotedAdjTransportCost = parsedProposal?.adjTransportCost ?? requestData.adjTransportCost ?? quotedTransport?.pricePerDay;
        const quotedAdjHotelCost = parsedProposal?.adjHotelCost ?? requestData.adjHotelCost ?? quotedHotel?.pricePerNight;
        const quotedGuidePrice = parsedProposal?.guidePricePerDay ?? requestData.guidePricePerDay ?? 500000;
        const quotedMealPrices = parsedProposal?.mealPrices || {};

        if (parsedProposal && parsedProposal.days) {
            setDays(parsedProposal.days);
            if (parsedProposal.costConfig) {
                setCostConfig(prev => {
                    const merged = { ...prev, ...parsedProposal.costConfig };
                    const currentName = merged.selectedTransport?.service_name || '';
                    if (quotedTransport && (currentName.includes('[Dự kiến') || currentName.includes('Xe tiêu chuẩn'))) {
                        const rawTName = quotedTransport.name || quotedTransport.assignedVehicle?.vehicle_name || quotedTransport.assignedVehicle?.service_name;
                        if (rawTName) {
                            merged.selectedTransport = {
                                ...merged.selectedTransport,
                                service_name: rawTName,
                                base_cost: Number(quotedAdjTransportCost ?? quotedTransport.pricePerDay ?? merged.selectedTransport.base_cost ?? 0)
                            };
                        }
                    }
                    return merged;
                });
            }
            if (parsedProposal.dayImages) {
                setDayImagePreviews(parsedProposal.dayImages);
            }
            if (parsedProposal.staffNote && parsedProposal.staffNote !== requestData.staff_note) {
                setStaffNote(parsedProposal.staffNote);
            }
            if (parsedProposal.tourName) setTourName(parsedProposal.tourName);
            if (parsedProposal.tourDescription) setTourDescription(parsedProposal.tourDescription);
            return; // if loaded, stop here
        }

        let prefs = {};
        if (typeof requestData.preferences === 'string') {
            try { prefs = JSON.parse(requestData.preferences); } catch(e){}
        } else if (typeof requestData.preferences === 'object') {
            prefs = requestData.preferences || {};
        }

        // Initialize new days based on departure and return dates
        const d1 = new Date(requestData.departure_date);
        const d2 = new Date(requestData.return_date);
        const totalDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

        // Khách sạn từ báo giá của nhân viên
        const isHotelSelf = quotedHotel
            ? (quotedHotel.isSelfArranged || (quotedHotel.name || '').toLowerCase().includes('tự túc'))
            : (prefs.hotelName || '').toLowerCase().includes('tự túc');
        const rawHotelName = cleanHotelDisplayName(quotedHotel?.name || prefs.hotelName || '');
        const hotelDailyRate = Number(quotedAdjHotelCost ?? quotedHotel?.pricePerNight ?? (prefs.hotelPrice ? Math.round(Number(prefs.hotelPrice)/Math.max(1, totalDays-1)) : 0));

        const initialDays = [];
        for (let i = 1; i <= totalDays; i++) {
            let accommodation = null;
            if (!isHotelSelf && rawHotelName && (i < totalDays || totalDays === 1)) {
                accommodation = {
                    service_id: quotedHotel?.service_id || 'custom',
                    name: rawHotelName,
                    price: hotelDailyRate,
                    autoMatchPending: true
                };
            }

            initialDays.push({
                dayIndex: i,
                start_destination_id: '',
                end_destination_id: '',
                route_title: '',
                activities: [],
                accommodation: accommodation,
                meals: { breakfast: true, lunch: true, dinner: true }
            });
        }
        setDays(initialDays);
        
        // Phương tiện từ báo giá của nhân viên văn phòng
        let transportTicketsCost = 0;
        let transportFixedCost = 0;
        let initialTransport = null;

        const isTransportSelf = quotedTransport
            ? (quotedTransport.isSelfArranged || (quotedTransport.name || '').toLowerCase().includes('tự túc'))
            : (prefs.transportName || '').toLowerCase().includes('tự túc');

        const rawTransportName = quotedTransport?.name 
            || quotedTransport?.assignedVehicle?.vehicle_name 
            || quotedTransport?.assignedVehicle?.service_name 
            || prefs.transportName 
            || '';

        if (!isTransportSelf && rawTransportName) {
            const dailyRate = Number(
                quotedAdjTransportCost ||
                quotedTransport?.pricePerDay ||
                quotedTransport?.price ||
                quotedTransport?.base_cost ||
                quotedTransport?.assignedVehicle?.base_cost ||
                quotedTransport?.assignedVehicle?.price ||
                quotedTransport?.assignedVehicle?.selling_price ||
                quotedTransport?.assignedVehicle?.price_per_day ||
                prefs.transportPrice ||
                0
            );
            
            const isFlight = (quotedTransport?.unit && (quotedTransport.unit.toLowerCase().includes('vé') || quotedTransport.unit.toLowerCase().includes('người')))
                || rawTransportName.toLowerCase().includes('máy bay') 
                || rawTransportName.toLowerCase().includes('vé');

            if (isFlight) {
                transportTicketsCost = dailyRate;
                transportFixedCost = 0;
            } else {
                transportTicketsCost = 0;
                transportFixedCost = dailyRate * totalDays;
            }

            const vehicleId = quotedTransport?.assignedVehicle?.service_id 
                || (quotedTransport?.assignedVehicle?.vehicle_id ? `fleet_${quotedTransport.assignedVehicle.vehicle_id}` : (quotedTransport?.service_id || 'custom'));

            initialTransport = {
                service_id: vehicleId,
                service_name: rawTransportName,
                base_cost: dailyRate,
                unit: isFlight ? 'vé' : 'ngày',
                capacity: quotedTransport?.capacity || quotedTransport?.assignedVehicle?.capacity,
                autoMatchPending: true
            };
        } else if (prefs.transportPrice) {
            transportTicketsCost = Number(prefs.transportPrice);
        }

        setCostConfig(prev => ({
            ...prev,
            margin: Number(requestData.markup_percent || parsedProposal?.markup_percent || 20),
            selectedTransport: initialTransport,
            fixed: {
                ...prev.fixed,
                transport: transportFixedCost,
                guidePerDay: Number(quotedGuidePrice)
            },
            variable: {
                ...prev.variable,
                tickets: transportTicketsCost,
                breakfast: Number(quotedMealPrices.breakfast ?? prev.variable?.breakfast ?? 50000),
                lunch: Number(quotedMealPrices.lunch ?? prev.variable?.lunch ?? 150000),
                dinner: Number(quotedMealPrices.dinner ?? prev.variable?.dinner ?? 150000)
            }
        }));

    }, [requestData]);



    useEffect(() => {
        if (transportServices.length > 0 && costConfig.selectedTransport?.autoMatchPending) {
            const currentSelected = costConfig.selectedTransport;
            const searchName = (currentSelected.service_name || '').toLowerCase().replace('hệ thống - ', '').trim();
            const match = transportServices.find(t => 
                (currentSelected.service_id && currentSelected.service_id !== 'custom' && String(t.service_id) === String(currentSelected.service_id)) ||
                (searchName && (t.service_name.toLowerCase().includes(searchName) || searchName.includes(t.service_name.toLowerCase())))
            );

            if (match) {
                const isTicket = match.unit && (match.unit.toLowerCase().includes('vé') || match.unit.toLowerCase().includes('người'));
                const matchedDailyRate = Number(match.base_cost || match.price || match.selling_price || 0);
                
                setCostConfig(prev => ({
                    ...prev,
                    selectedTransport: match, // Found match in DB
                    fixed: {
                        ...prev.fixed,
                        transport: isTicket ? 0 : (prev.fixed.transport || (matchedDailyRate * (days.length || 1)))
                    },
                    variable: {
                        ...prev.variable,
                        tickets: isTicket ? matchedDailyRate : 0
                    }
                }));
            } else {
                // If not found, just remove the flag so it doesn't loop
                setCostConfig(prev => ({
                    ...prev,
                    selectedTransport: { ...prev.selectedTransport, autoMatchPending: false }
                }));
            }
        }
    }, [transportServices, costConfig.selectedTransport, days.length]);

    useEffect(() => {
        if (allServices.length === 0 || days.length === 0) return;
        let hasChanges = false;
        
        const newDays = days.map(d => {
            if (d.accommodation && d.accommodation.autoMatchPending) {
                hasChanges = true;
                const searchName = d.accommodation.name.toLowerCase().replace('hệ thống - ', '').trim();
                
                const match = allServices.find(s => 
                    (s.service_type === 'Khách sạn' || s.service_type === 'Accommodation') &&
                    (s.service_name.toLowerCase().includes(searchName) || searchName.includes(s.service_name.toLowerCase()))
                );
                
                if (match) {
                    return {
                        ...d,
                        accommodation: {
                            service_id: match.service_id,
                            name: `${match.service_name} (hoặc tương đương)`,
                            price: match.base_cost || 0
                        }
                    };
                } else {
                    return {
                        ...d,
                        accommodation: { ...d.accommodation, autoMatchPending: false }
                    };
                }
            }
            return d;
        });

        if (hasChanges) {
            setDays(newDays);
        }
    }, [days, allServices]);

    const totalDays = days.length;
    
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

    const handleTransportChange = (e) => {
        const sId = e.target.value;
        if (!sId) {
            setCostConfig(prev => ({ 
                ...prev, 
                selectedTransport: null,
                fixed: { ...prev.fixed, transport: 0 },
                variable: { ...prev.variable, tickets: 0 },
                transportTimes: prev.transportTimes || { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' },
                transportLocations: prev.transportLocations || { startD: '', endD: '', startR: '', endR: '' }
            }));
            return;
        }

        setCostConfig(prev => {
            let selected = null;
            if (sId === 'custom' && prev.selectedTransport?.service_id === 'custom') {
                selected = prev.selectedTransport;
            } else if (prev.selectedTransport && String(prev.selectedTransport.service_id) === String(sId)) {
                selected = prev.selectedTransport;
            } else {
                selected = transportServices.find(t => String(t.service_id) === String(sId));
            }
            
            if (!selected) return prev;

            const isTicket = selected && ((selected.unit && (selected.unit.toLowerCase().includes('vé') || selected.unit.toLowerCase().includes('người'))) || selected.service_type === 'Vé máy bay');
            
            return {
                ...prev,
                selectedTransport: selected,
                fixed: { 
                    ...prev.fixed, 
                    transport: isTicket ? 0 : Number(selected.base_cost || 0) * days.length 
                },
                variable: { 
                    ...prev.variable, 
                    tickets: isTicket ? Number(selected.base_cost || 0) : 0 
                }
            };
        });
    };

    const pax = costConfig.minimumPax || requestData?.people_count || 1;
    const totalFixed = Number(costConfig.fixed.transport) + (Number(costConfig.fixed.guidePerDay) * totalDays) + Number(costConfig.fixed.otherFixed);
    const fixedPerPax = pax > 0 ? totalFixed / pax : 0;
    
    const countBreakfast = costConfig.variable.countBreakfast !== undefined ? Number(costConfig.variable.countBreakfast) : includedBreakfast;
    const countLunch = costConfig.variable.countLunch !== undefined ? Number(costConfig.variable.countLunch) : includedLunch;
    const countDinner = costConfig.variable.countDinner !== undefined ? Number(costConfig.variable.countDinner) : includedDinner;

    const totalVariable = (autoAccommodationCost / 2) 
        + autoTicketsCost
        + Number(costConfig.variable.tickets || 0)
        + (Number(costConfig.variable.breakfast) * countBreakfast)
        + (Number(costConfig.variable.lunch) * countLunch)
        + (Number(costConfig.variable.dinner) * countDinner)
        + Number(costConfig.variable.insurance);
        
    const netCost = fixedPerPax + totalVariable;
    const calculatedSellingPrice = netCost * (1 + Number(costConfig.margin) / 100);
    const sellingPrice = manualSellingPrice !== null && manualSellingPrice !== '' ? manualSellingPrice : (manualSellingPrice === '' ? '' : calculatedSellingPrice);

    const handleSubmitToManager = async () => {
        // --- VALIDATION RÀNG BUỘC DỮ LIỆU ---
        // 1. Ràng buộc Tên Tour
        if (!tourName || tourName.trim().length < 5) {
            alert('⚠️ Vui lòng nhập Tên Tour đề xuất (tối thiểu 5 ký tự)!');
            return;
        }

        // 2. Ràng buộc Lịch trình các ngày
        if (!days || days.length === 0) {
            alert('⚠️ Lịch trình tour phải có ít nhất 1 ngày!');
            return;
        }

        // 3. Ràng buộc Số khách hòa vốn
        if (!costConfig.minimumPax || Number(costConfig.minimumPax) < 1) {
            alert('⚠️ Số khách tối thiểu (điểm hòa vốn) phải là số nguyên lớn hơn hoặc bằng 1!');
            return;
        }

        // 4. Ràng buộc Giá bán người lớn
        const finalSellingPrice = Number(sellingPrice);
        if (isNaN(finalSellingPrice) || finalSellingPrice <= 0) {
            alert('⚠️ Giá bán dự kiến (người lớn) phải lớn hơn 0 đ!');
            return;
        }

        // 5. Cảnh báo bán dưới giá vốn
        if (finalSellingPrice < Number(netCost)) {
            const confirmLoss = window.confirm(
                `⚠️ CẢNH BÁO LỖ VỐN / LỢI NHUẬN ÂM:\n\n` +
                `• Giá bán dự kiến: ${formatMoneyLocal(finalSellingPrice)} đ/người\n` +
                `• Chi phí vốn gốc: ${formatMoneyLocal(netCost)} đ/người\n\n` +
                `Giá bán đang THẤP HƠN chi phí vốn thực tế. Bạn có chắc chắn muốn tiếp tục gửi phương án này lên Quản lý phê duyệt không?`
            );
            if (!confirmLoss) return;
        }

        // 6. Ràng buộc Tỷ lệ % giá trẻ em (0% - 100%)
        const childPct = Number(costConfig.ageMultiplier?.child?.percent || 0);
        const toddlerPct = Number(costConfig.ageMultiplier?.toddler?.percent || 0);
        const infantPct = Number(costConfig.ageMultiplier?.infant?.percent || 0);
        if (childPct < 0 || childPct > 100 || toddlerPct < 0 || toddlerPct > 100 || infantPct < 0 || infantPct > 100) {
            alert('⚠️ Tỷ lệ % giá người lớn cho trẻ em / trẻ nhỏ / em bé phải nằm trong khoảng từ 0% đến 100%!');
            return;
        }

        const durationDays = days.length || 1;
        const assignedVehicle = costConfig.selectedTransport;
        const vehicleName = assignedVehicle ? formatVehicleDisplayName(assignedVehicle) : '';
        const isTransportSelf = !assignedVehicle || vehicleName.toLowerCase().includes('tự túc');
        const vehicleDailyRate = isTransportSelf ? 0 : (
            assignedVehicle?.base_cost 
                ? Number(assignedVehicle.base_cost) 
                : (durationDays > 0 && costConfig.fixed?.transport ? Math.round(Number(costConfig.fixed.transport) / durationDays) : 0)
        );

        const firstAcc = days.find(d => d.accommodation)?.accommodation;
        const isHotelSelf = !firstAcc || (firstAcc.name || '').toLowerCase().includes('tự túc');

        let clientPrefs = {};
        if (typeof requestData.preferences === 'string') {
            try { clientPrefs = JSON.parse(requestData.preferences); } catch(e){}
        } else if (typeof requestData.preferences === 'object') {
            clientPrefs = requestData.preferences || {};
        }

        const proposedServicesData = {
            transport: {
                name: isTransportSelf ? 'Khách tự túc phương tiện di chuyển' : (vehicleName || clientPrefs.transportName || 'Chưa chọn xe cụ thể'),
                requestedSegment: clientPrefs.transportName || 'Theo đề xuất của công ty',
                assignedVehicle: assignedVehicle || null,
                isAssigned: Boolean(assignedVehicle && !isTransportSelf),
                pricePerDay: vehicleDailyRate,
                capacity: assignedVehicle?.capacity || null,
                isCustomized: Boolean(assignedVehicle),
                isSelfArranged: isTransportSelf,
                unit: assignedVehicle?.unit || 'ngày',
                reason: ''
            },
            hotel: {
                name: isHotelSelf ? 'Khách tự túc chỗ ở' : cleanHotelDisplayName(firstAcc?.name || clientPrefs.hotelName || ''),
                pricePerNight: Number(firstAcc?.price || 0),
                isAssigned: Boolean(firstAcc && !isHotelSelf),
                isCustomized: Boolean(firstAcc),
                isSelfArranged: isHotelSelf,
                reason: ''
            },
            guide: {
                enabled: Number(costConfig.fixed?.guidePerDay || 0) > 0,
                pricePerDay: Number(costConfig.fixed?.guidePerDay || 500000)
            },
            meal: {
                enabled: true,
                prices: {
                    breakfast: Number(costConfig.variable?.breakfast || 50000),
                    lunch: Number(costConfig.variable?.lunch || 150000),
                    dinner: Number(costConfig.variable?.dinner || 150000)
                }
            }
        };

        const designPayload = JSON.stringify({
            tourName,
            tourDescription,
            days,
            costConfig,
            staffNote,
            proposedServices: proposedServicesData,
            adjTransportCost: vehicleDailyRate,
            adjHotelCost: Number(firstAcc?.price || 0),
            guidePricePerDay: Number(costConfig.fixed?.guidePerDay || 500000),
            mealPrices: {
                breakfast: Number(costConfig.variable?.breakfast || 50000),
                lunch: Number(costConfig.variable?.lunch || 150000),
                dinner: Number(costConfig.variable?.dinner || 150000)
            }
        });

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('base_cost', netCost);
            formData.append('quote_price', sellingPrice);
            formData.append('itinerary', designPayload);
            formData.append('note', staffNote);
            formData.append('existing_day_images', JSON.stringify(dayImagePreviews || {}));

            if (dayImages) {
                Object.keys(dayImages).forEach(dayIdx => {
                    if (dayImages[dayIdx] instanceof File) {
                        formData.append(`dayImage_${dayIdx}`, dayImages[dayIdx]);
                    }
                });
            }

            await axios.post(`http://localhost:5000/api/custom-tours/requests/${requestData.request_id}/submit-manager`, formData, { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                } 
            });

            alert('🎉 Đã chốt bản thiết kế & Gửi Quản lý phê duyệt thành công!');
            onBack();
        } catch (error) {
            console.error("Lỗi API:", error);
            alert('Lỗi khi gửi phê duyệt!');
        }
    };

    if (!requestData) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
            <div style={{ padding: '15px 25px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={onBack} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>⬅ Quay lại Inbox</button>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Phòng Thiết Kế: {requestData.customer_name} - {requestData.destination}</h2>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '25px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <TimelineBuilder 
                    days={days} 
                    setDays={setDays} 
                    destinations={destinations} 
                    allServices={allServices} 
                    dayImages={dayImages}
                    setDayImages={setDayImages}
                    dayImagePreviews={dayImagePreviews}
                    setDayImagePreviews={setDayImagePreviews}
                    requestData={requestData}
                    costConfig={costConfig}
                    setCostConfig={setCostConfig}
                    tourName={tourName}
                    setTourName={setTourName}
                    tourDescription={tourDescription}
                    setTourDescription={setTourDescription}
                />

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Yêu cầu của khách hàng */}
                    {(() => {
                        let prefs = {};
                        if (typeof requestData.preferences === 'string') {
                            try { prefs = JSON.parse(requestData.preferences); } catch(e){}
                        } else if (typeof requestData.preferences === 'object') {
                            prefs = requestData.preferences || {};
                        }
                        return (
                            <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📋</span> Chi tiết yêu cầu
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#334155' }}>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Điểm đến:</strong> <span style={{ fontWeight: '600', color: '#0369a1' }}>{requestData.destination}</span>
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Thời gian:</strong> {Math.round((new Date(requestData.return_date) - new Date(requestData.departure_date)) / (1000 * 60 * 60 * 24)) + 1} Ngày {Math.max(0, Math.round((new Date(requestData.return_date) - new Date(requestData.departure_date)) / (1000 * 60 * 60 * 24)))} Đêm 
                                        <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '6px' }}>({new Date(requestData.departure_date).toLocaleDateString('vi-VN')} - {new Date(requestData.return_date).toLocaleDateString('vi-VN')})</span>
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Đón khách:</strong> {prefs.pickup_location || 'Tự túc'} {prefs.departure_time ? `(Lúc ${prefs.departure_time})` : ''}
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Thành viên:</strong> {requestData.people_count} người (
                                        {[
                                            (prefs.participantBreakdown?.adults || requestData.people_count) + ' Lớn',
                                            prefs.participantBreakdown?.children ? prefs.participantBreakdown.children + ' Trẻ em' : null,
                                            prefs.participantBreakdown?.toddlers ? prefs.participantBreakdown.toddlers + ' Trẻ nhỏ' : null,
                                            prefs.participantBreakdown?.infants ? prefs.participantBreakdown.infants + ' Em bé' : null
                                        ].filter(Boolean).join(', ')}
                                        )
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Ngân sách khách:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{formatMoneyLocal(requestData.budget)} đ/người</span>
                                    </div>
                                    {(() => {
                                        let parsedProp = null;
                                        const rawProp = requestData.proposed_itinerary || requestData.itinerary || requestData.proposed_plan;
                                        if (rawProp) {
                                            try { parsedProp = typeof rawProp === 'string' ? JSON.parse(rawProp) : rawProp; } catch(e){}
                                        }
                                        const propServ = parsedProp?.proposedServices || parsedProp || {};
                                        const displayTransport = propServ.transport?.name 
                                            || propServ.transport?.assignedVehicle?.vehicle_name 
                                            || propServ.transport?.assignedVehicle?.service_name 
                                            || prefs.transportName;
                                        const displayHotel = cleanHotelDisplayName(propServ.hotel?.name || prefs.hotelName);

                                        const displayGuide = (() => {
                                            if (prefs.guide) return prefs.guide;
                                            if (prefs.guideMode === 'company') return 'Cần Hướng dẫn viên';
                                            if (prefs.guideMode === 'self') return 'Khách tự túc';
                                            if (propServ.guide !== undefined && propServ.guide !== null) {
                                                return propServ.guide.enabled ? 'Cần Hướng dẫn viên' : 'Khách tự túc';
                                            }
                                            return 'Theo thỏa thuận';
                                        })();

                                        const displayMeal = (() => {
                                            if (prefs.meal) return prefs.meal;
                                            if (prefs.mealMode === 'company') return 'Công ty tự sắp xếp';
                                            if (prefs.mealMode === 'self') return 'Khách tự túc';
                                            if (propServ.meal !== undefined && propServ.meal !== null) {
                                                return propServ.meal.enabled ? 'Công ty tự sắp xếp' : 'Khách tự túc';
                                            }
                                            return 'Theo thỏa thuận';
                                        })();

                                        const isGuideSelf = displayGuide.toLowerCase().includes('tự túc') || displayGuide.toLowerCase().includes('không');
                                        const isMealSelf = displayMeal.toLowerCase().includes('tự túc') || displayMeal.toLowerCase().includes('không');

                                        return (
                                            <>
                                                <div>
                                                    <strong style={{ color: '#0f172a' }}>Phương tiện:</strong> {formatVehicleDisplayName(displayTransport) || 'Không rõ'}
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#0f172a' }}>Lưu trú:</strong> {displayHotel || 'Không rõ'}
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#0f172a' }}>Hướng dẫn viên:</strong>{' '}
                                                    <span style={{ 
                                                        fontWeight: '700', 
                                                        color: isGuideSelf ? '#64748b' : '#0284c7' 
                                                    }}>
                                                        {displayGuide}
                                                    </span>
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#0f172a' }}>Nhu cầu ăn uống:</strong>{' '}
                                                    <span style={{ 
                                                        fontWeight: '700', 
                                                        color: isMealSelf ? '#64748b' : '#059669' 
                                                    }}>
                                                        {displayMeal}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                    {prefs.note && (
                                        <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px dashed #7dd3fc', color: '#0c4a6e', marginTop: '5px' }}>
                                            <strong>Ghi chú:</strong> {prefs.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#d97706' }}>Định phí</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chọn phương tiện di chuyển chính</label>
                                <select 
                                    value={costConfig.selectedTransport?.service_id || (costConfig.selectedTransport?.service_name ? 'custom' : '')} 
                                    onChange={handleTransportChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Tự túc / Không chọn --</option>
                                    {costConfig.selectedTransport?.service_name && !transportServices.some(t => String(t.service_id) === String(costConfig.selectedTransport.service_id)) && (
                                        <option value={costConfig.selectedTransport.service_id || 'custom'}>{formatVehicleDisplayName(costConfig.selectedTransport)}</option>
                                    )}
                                    {transportServices.map(t => (
                                        <option key={t.service_id} value={t.service_id}>{formatVehicleDisplayName(t)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Điểm hòa vốn (Số khách tối thiểu)</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={costConfig.minimumPax} 
                                    onChange={e => {
                                        const v = parseInt(e.target.value, 10);
                                        setCostConfig({...costConfig, minimumPax: isNaN(v) ? '' : Math.max(1, v)});
                                    }} 
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
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chi phí cố định khác</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.otherFixed || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, otherFixed: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
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
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(costConfig.variable.tickets || 0).toLocaleString('vi-VN')} đ</div>
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
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Lời nhắn cho khách hàng</h3>
                        <textarea
                            value={staffNote}
                            onChange={(e) => setStaffNote(e.target.value)}
                            placeholder="Ví dụ: Dạ em gửi anh chị bản lịch trình thiết kế chi tiết, anh chị xem qua nhé..."
                            style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
                        />
                    </div>
                </div>
            </div>

            {/* THIẾT LẬP LỢI NHUẬN (MARKUP) */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📈</span> Thiết Lập Lợi Nhuận
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ flex: 1, background: '#ecfdf5', padding: '10px 15px', borderRadius: '8px', border: '1px dashed #34d399' }}>
                        <div style={{ fontSize: '12px', color: '#047857', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Giá Vốn / Khách</div>
                        <div style={{ fontSize: '20px', color: '#065f46', fontWeight: 'bold' }}>{formatMoneyLocal(netCost)} đ</div>
                    </div>
                    <div style={{ fontSize: '24px', color: '#cbd5e1' }}>+</div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>Biên độ lợi nhuận Markup (%)</label>
                        <input 
                            type="number" 
                            min="0"
                            value={costConfig.margin} 
                            onChange={e => {
                                setCostConfig({ ...costConfig, margin: e.target.value });
                                setManualSellingPrice(null);
                            }} 
                            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 'bold', outline: 'none' }} 
                        />
                    </div>
                    <div style={{ fontSize: '24px', color: '#cbd5e1' }}>=</div>
                    <div style={{ flex: 1, background: '#fffbeb', padding: '10px 15px', borderRadius: '8px', border: '1px dashed #fcd34d' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#d97706', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Giá Bán Dự Kiến (Người lớn)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FormattedMoneyInput 
                                value={sellingPrice} 
                                onChange={(val) => {
                                    if (val === '' || val === null || val === undefined) {
                                        setManualSellingPrice('');
                                        setCostConfig({ ...costConfig, margin: '' });
                                        return;
                                    }
                                    const numericVal = Number(val);
                                    setManualSellingPrice(numericVal);
                                    if (netCost > 0) {
                                        const newMarkup = (((numericVal / netCost) - 1) * 100).toFixed(1);
                                        setCostConfig({ ...costConfig, margin: newMarkup });
                                    }
                                }}
                                style={{ width: '100%', minWidth: '120px', background: 'transparent', border: 'none', borderBottom: '1px solid #d97706', color: '#b45309', fontSize: '20px', fontWeight: 'bold', outline: 'none', padding: '0 4px' }}
                            />
                            <span style={{ fontSize: '20px', color: '#b45309', fontWeight: 'bold' }}>đ</span>
                        </div>
                    </div>
                </div>
            </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#0ea5e9' }}>Chính sách giá trẻ em</h3>
                            <select 
                                value={costConfig.ageMultiplier?.preset || 'custom'}
                                onChange={e => {
                                    const preset = e.target.value;
                                    let newMulti = { ...(costConfig.ageMultiplier || {}), preset };
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
                                const currentSetting = costConfig.ageMultiplier?.[group.key] || { percent: 0, fixed_surcharge: 0 };
                                const isCustom = costConfig.ageMultiplier?.preset === 'custom';
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
                                                        value={Number(currentSetting.percent).toString()}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            let val = e.target.value;
                                                            if (val === '') val = 0;
                                                            else val = parseInt(val, 10);
                                                            if (isNaN(val)) val = 0;
                                                            val = Math.min(100, Math.max(0, val));
                                                            
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...(costConfig.ageMultiplier || {}),
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
                                                                    ...(costConfig.ageMultiplier || {}),
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


                    {/* TỔNG KẾT CHI PHÍ ĐOÀN */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💰</span> Tổng Kết Chi Phí Toàn Đoàn
                        </h3>
                        {(() => {
                            let prefs = {};
                            try { prefs = typeof requestData.preferences === 'string' ? JSON.parse(requestData.preferences) : requestData.preferences || {}; } catch(e){}
                            
                            const pA = prefs.participantBreakdown?.adults || requestData.people_count;
                            const pC = prefs.participantBreakdown?.children || 0;
                            const pT = prefs.participantBreakdown?.toddlers || 0;
                            const pI = prefs.participantBreakdown?.infants || 0;

                            const sC = costConfig.ageMultiplier?.child || { percent: 0, fixed_surcharge: 0 };
                            const sT = costConfig.ageMultiplier?.toddler || { percent: 0, fixed_surcharge: 0 };
                            const sI = costConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                            const prA = sellingPrice;
                            const prC = (sellingPrice * (sC.percent || 0) / 100) + Number(sC.fixed_surcharge || 0);
                            const prT = (sellingPrice * (sT.percent || 0) / 100) + Number(sT.fixed_surcharge || 0);
                            const prI = (sellingPrice * (sI.percent || 0) / 100) + Number(sI.fixed_surcharge || 0);

                            const totalA = pA * prA;
                            const totalC = pC * prC;
                            const totalT = pT * prT;
                            const totalI = pI * prI;
                            const grandTotal = totalA + totalC + totalT + totalI;

                            return (
                                <div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '15px' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '14px' }}>
                                                <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Loại khách</th>
                                                <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Số lượng</th>
                                                <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Đơn giá</th>
                                                <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pA > 0 && <tr>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Người lớn</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pA}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatMoneyLocal(prA)} đ</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoneyLocal(totalA)} đ</td>
                                            </tr>}
                                            {pC > 0 && <tr>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Trẻ em (5-11t)</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pC}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatMoneyLocal(prC)} đ</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoneyLocal(totalC)} đ</td>
                                            </tr>}
                                            {pT > 0 && <tr>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Trẻ nhỏ (2-4t)</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pT}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatMoneyLocal(prT)} đ</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoneyLocal(totalT)} đ</td>
                                            </tr>}
                                            {pI > 0 && <tr>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Em bé (&lt;2t)</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pI}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatMoneyLocal(prI)} đ</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoneyLocal(totalI)} đ</td>
                                            </tr>}
                                        </tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#ecfdf5', padding: '15px 20px', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '16px', color: '#065f46', fontWeight: 'bold', textTransform: 'uppercase' }}>TỔNG DOANH THU ĐOÀN</span>
                                            <strong style={{ fontSize: '24px', color: '#047857' }}>{formatMoneyLocal(grandTotal)} đ</strong>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

            <div style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '15px 30px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', zIndex: 10 }}>
                {(!requestData || !['Manager_Approved', 'Sent_To_Customer', 'Customer_Accepted', 'Completed', 'Canceled'].includes(requestData.status)) && (
                    <button 
                        onClick={handleSubmitToManager}
                        style={{ padding: '14px 30px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
                    >
                        ✅ Chốt Thiết Kế & Gửi Quản Lý
                    </button>
                )}
            </div>
        </div>
    );
};

export default StaffTourDesigner;