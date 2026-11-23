import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { ShoppingCart, CheckCircle, ChevronRight, User, Phone, Mail, MapPin, Tag, MessageSquare, ShieldCheck, ChevronDown, Check, X, Calendar, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight, Banknote, CreditCard } from 'lucide-react';


import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import { formatVehicleDisplayName } from '../utils/vehicleDisplayHelper';

const GATEWAY_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000');

// Helper format ngày dd/mm/yyyy
const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const cleanDate = String(dateStr).split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
};

// Định nghĩa quy tắc tính tuổi và ngày sinh hợp lệ theo ngày khởi hành tour
const getPassengerAgeRules = (depDate) => {
    let base = (depDate && !isNaN(new Date(depDate).getTime())) 
        ? new Date(depDate) 
        : new Date();
    
    // Đưa về 00:00:00 của ngày khởi hành để so sánh chuẩn xác
    base = new Date(base.getFullYear(), base.getMonth(), base.getDate());

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const toISO = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const toDMY = (d) => {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const addDays = (d, days) => {
        const res = new Date(d.getTime());
        res.setDate(res.getDate() + days);
        return res;
    };

    const addYears = (d, years) => {
        const res = new Date(d.getTime());
        res.setFullYear(res.getFullYear() + years);
        return res;
    };

    // Mốc 12 năm trước ngày khởi hành (Người lớn: sinh từ d12 trở về trước)
    const d12 = addYears(base, -12);
    // Mốc 5 năm trước ngày khởi hành (Trẻ em: sinh từ d12 + 1 ngày đến d5)
    const d5 = addYears(base, -5);
    // Mốc 2 năm trước ngày khởi hành (Trẻ nhỏ: sinh từ d5 + 1 ngày đến d2)
    const d2 = addYears(base, -2);

    return {
        baseDate: base,
        adults: {
            minDate: '1900-01-01',
            maxDate: toISO(d12),
            desc: `Người lớn sinh trước ngày ${toDMY(addDays(d12, 1))} (từ 12 tuổi trở lên)`,
            shortDesc: `Từ 12 tuổi trở lên (sinh trước ${toDMY(addDays(d12, 1))})`,
            validator: (dobStr) => {
                if (!dobStr || !dobStr.trim()) return 'Vui lòng nhập ngày sinh';
                const dob = new Date(dobStr);
                if (isNaN(dob.getTime())) return 'Ngày sinh không hợp lệ';
                dob.setHours(0, 0, 0, 0);
                if (dob > d12) {
                    return `Hành khách Người lớn phải từ 12 tuổi trở lên (sinh trước ngày ${toDMY(addDays(d12, 1))}).`;
                }
                if (dob < new Date(1900, 0, 1)) {
                    return 'Năm sinh không hợp lệ.';
                }
                return null;
            }
        },
        children: {
            minDate: toISO(addDays(d12, 1)),
            maxDate: toISO(d5),
            desc: `Trẻ em sinh từ ${toDMY(addDays(d12, 1))} đến ${toDMY(d5)} (từ 5 - 11 tuổi)`,
            shortDesc: `Từ 5 - 11 tuổi (sinh ${toDMY(addDays(d12, 1))} - ${toDMY(d5)})`,
            validator: (dobStr) => {
                if (!dobStr || !dobStr.trim()) return 'Vui lòng nhập ngày sinh';
                const dob = new Date(dobStr);
                if (isNaN(dob.getTime())) return 'Ngày sinh không hợp lệ';
                dob.setHours(0, 0, 0, 0);
                if (dob <= d12) {
                    return `Hành khách này đã từ 12 tuổi trở lên (sinh trước ngày ${toDMY(addDays(d12, 1))}), vui lòng chọn vé Người lớn.`;
                }
                if (dob > d5) {
                    return `Trẻ em phải từ 5 đến 11 tuổi (sinh từ ${toDMY(addDays(d12, 1))} đến ${toDMY(d5)}).`;
                }
                return null;
            }
        },
        toddlers: {
            minDate: toISO(addDays(d5, 1)),
            maxDate: toISO(d2),
            desc: `Trẻ nhỏ sinh từ ${toDMY(addDays(d5, 1))} đến ${toDMY(d2)} (từ 2 - 4 tuổi)`,
            shortDesc: `Từ 2 - 4 tuổi (sinh ${toDMY(addDays(d5, 1))} - ${toDMY(d2)})`,
            validator: (dobStr) => {
                if (!dobStr || !dobStr.trim()) return 'Vui lòng nhập ngày sinh';
                const dob = new Date(dobStr);
                if (isNaN(dob.getTime())) return 'Ngày sinh không hợp lệ';
                dob.setHours(0, 0, 0, 0);
                if (dob <= d5) {
                    return `Hành khách này đã từ 5 tuổi trở lên, vui lòng chọn vé Trẻ em hoặc Người lớn.`;
                }
                if (dob > d2) {
                    return `Trẻ nhỏ phải từ 2 đến 4 tuổi (sinh từ ${toDMY(addDays(d5, 1))} đến ${toDMY(d2)}).`;
                }
                return null;
            }
        },
        infants: {
            minDate: toISO(addDays(d2, 1)),
            maxDate: toISO(today),
            desc: `Em bé sinh từ ${toDMY(addDays(d2, 1))} (dưới 2 tuổi)`,
            shortDesc: `Dưới 2 tuổi (sinh từ ${toDMY(addDays(d2, 1))})`,
            validator: (dobStr) => {
                if (!dobStr || !dobStr.trim()) return 'Vui lòng nhập ngày sinh';
                const dob = new Date(dobStr);
                if (isNaN(dob.getTime())) return 'Ngày sinh không hợp lệ';
                dob.setHours(0, 0, 0, 0);
                if (dob <= d2) {
                    return `Hành khách này đã từ 2 tuổi trở lên, vui lòng chọn vé Trẻ nhỏ hoặc Trẻ em.`;
                }
                if (dob > today) {
                    return `Ngày sinh không hợp lệ (không được lớn hơn ngày hiện tại).`;
                }
                return null;
            }
        }
    };
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#b91c1c' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.info && this.state.info.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const BookingFormInner = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const bookingData = location.state;

    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Contact info
    const [contactInfo, setContactInfo] = useState({
        fullName: '', phone: '', email: '', address: '', notes: ''
    });

    // Payment method
    const [paymentMethod, setPaymentMethod] = useState('VNPAY_QR');
    
    // Privacy consent
    const [privacyConsent, setPrivacyConsent] = useState(false);

    // Passenger quantities
    const [paxWarning, setPaxWarning] = useState('');
    let initialPax = {
        adults: bookingData?.numPeople || 1,
        children: 0,
        toddlers: 0,
        infants: 0
    };
    if (bookingData?.isCustomTour && bookingData?.quoteData) {
        try {
            const req = typeof bookingData.quoteData.requirements === 'string' ? JSON.parse(bookingData.quoteData.requirements) : bookingData.quoteData.requirements;
            if (req?.participantBreakdown) {
                initialPax = { ...initialPax, ...req.participantBreakdown };
            }
        } catch (e) {
            console.error("Error parsing quote requirements", e);
        }
    }

    const [pax, setPax] = useState(initialPax);
    
    // Expanded sections
    const [showPassengerModal, setShowPassengerModal] = useState(false);
    const [showItineraryModal, setShowItineraryModal] = useState(false);
    const [passengerDetails, setPassengerDetails] = useState({});
    
    // Notification & Success Modals + Inline Field Errors
    const [successModal, setSuccessModal] = useState(null);
    const [alertModal, setAlertModal] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    
    const [destinations, setDestinations] = useState([]);
    useEffect(() => {
        axios.get(`${GATEWAY_URL}/api/destinations`)
            .then(res => setDestinations(res.data?.data || []))
            .catch(err => console.log(err));
    }, []);

    const [expandedSections, setExpandedSections] = useState({
        transport: true,
        price: true
    });

    useEffect(() => {
        if (!bookingData) {
            navigate('/home');
            return;
        }
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setContactInfo(prev => ({
                ...prev,
                fullName: parsedUser.fullName || '',
                email: parsedUser.email || '',
                phone: parsedUser.phone || ''
            }));
        }
    }, [navigate, bookingData]);

    if (!bookingData) return null;

    const isCustom = bookingData.isCustomTour;
    const quote = bookingData.quoteData;
    const tour = bookingData.tour;
    const selDep = bookingData.selectedDeparture; // Might be passed from TourDetail? Actually let's just use what's available.

    const parsedDesign = isCustom
        ? (quote?.proposed_itinerary || quote?.itinerary ? (typeof (quote.proposed_itinerary || quote.itinerary) === 'string' ? JSON.parse(quote.proposed_itinerary || quote.itinerary) : (quote.proposed_itinerary || quote.itinerary)) : null)
        : (tour?.design_data ? (typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : tour.design_data) : null);
    
    const daysArr = parsedDesign?.days || parsedDesign?.itineraryDays || parsedDesign?.itinerary || tour?.itineraries || [];
    const firstDay = daysArr[0];
    const lastDay = daysArr[daysArr.length - 1];

    // --- 1. DEPARTURE & RETURN DATES ---
    let depDateStr = 'Đang cập nhật';
    let retDateStr = 'Đang cập nhật';
    let depDateObj = null;

    if (tour?.departures && bookingData.departureId) {
        const dep = tour.departures.find(d => String(d.departure_id) === String(bookingData.departureId) || String(d.id) === String(bookingData.departureId));
        if (dep && dep.departure_date) {
            depDateObj = new Date(dep.departure_date);
        }
    }
    if (!depDateObj && bookingData.departure_date) {
        depDateObj = new Date(bookingData.departure_date);
    }
    if (!depDateObj && bookingData.selectedDeparture) {
        if (typeof bookingData.selectedDeparture === 'object' && bookingData.selectedDeparture.departure_date) {
            depDateObj = new Date(bookingData.selectedDeparture.departure_date);
        } else if (typeof bookingData.selectedDeparture === 'string') {
            depDateObj = new Date(bookingData.selectedDeparture);
        }
    }

    if (depDateObj && !isNaN(depDateObj.getTime())) {
        depDateStr = depDateObj.toLocaleDateString('vi-VN');
        const durationDays = Number(tour?.duration_days) || daysArr.length || 1;
        const retObj = new Date(depDateObj);
        retObj.setDate(retObj.getDate() + Math.max(0, durationDays - 1));
        retDateStr = retObj.toLocaleDateString('vi-VN');
    } else if (isCustom && quote) {
        if (!depDateObj && quote.departure_date) depDateObj = new Date(quote.departure_date);
        depDateStr = quote.departure_date ? new Date(quote.departure_date).toLocaleDateString('vi-VN') : 'Đang cập nhật';
        retDateStr = quote.return_date ? new Date(quote.return_date).toLocaleDateString('vi-VN') : 'Đang cập nhật';
    }

    // --- BẢNG QUY TẮC ĐỘ TUỔI HÀNH KHÁCH DỰA TRÊN NGÀY KHỞI HÀNH TOUR ---
    const ageRules = useMemo(() => getPassengerAgeRules(depDateObj), [depDateObj]);

    // --- 2. TRANSPORT & TIME ---
    const transportType = parsedDesign?.costConfig?.selectedTransport?.service_type;
    const isFlight = transportType === 'Vé máy bay';
    const transportIcon = isFlight ? '✈️' : '🚌';
    const transportName = isFlight ? (parsedDesign?.costConfig?.selectedTransport?.provider_name || 'Máy bay') : (formatVehicleDisplayName(parsedDesign?.costConfig?.selectedTransport) || 'Xe khách du lịch');

    const safeDestinations = Array.isArray(destinations) ? destinations : [];

    // --- 3. START LOCATION (Điểm xuất phát) ---
    // A. Bóc tách từ hành trình ngày 1 (route_title) nếu có dạng "TP.HCM - ..." hoặc "Hà Nội - ..."
    let routeOrigin = '';
    if (firstDay?.route_title) {
        const rawFirst = firstDay.route_title.split(/[-–]/)[0]?.trim();
        if (rawFirst) {
            const low = rawFirst.toLowerCase();
            if (low.includes('tp.hcm') || low.includes('tphcm') || low.includes('hồ chí minh') || low.includes('sài gòn')) {
                routeOrigin = 'TP.HCM';
            } else if (low.includes('hà nội')) {
                routeOrigin = 'Hà Nội';
            } else if (low.includes('đà nẵng')) {
                routeOrigin = 'Đà Nẵng';
            } else if (low.includes('cần thơ')) {
                routeOrigin = 'Cần Thơ';
            }
        }
    }

    // B. Kiểm tra hoạt động đầu tiên ngày 1 (nếu có đón khách tại...)
    let actOrigin = '';
    const firstActStr = (firstDay?.activities?.[0]?.name || firstDay?.activities?.[0]?.title || '').toLowerCase();
    if (firstActStr.includes('tp.hcm') || firstActStr.includes('tphcm') || firstActStr.includes('hồ chí minh') || firstActStr.includes('sài gòn')) {
        actOrigin = 'TP.HCM';
    } else if (firstActStr.includes('hà nội')) {
        actOrigin = 'Hà Nội';
    } else if (firstActStr.includes('đà nẵng')) {
        actOrigin = 'Đà Nẵng';
    } else if (firstActStr.includes('cần thơ')) {
        actOrigin = 'Cần Thơ';
    }

    let startLocD = safeDestinations.find(x => String(x.destination_id) === String(firstDay?.start_destination_id))?.destination_name;
    if (startLocD === 'Hồ Chí Minh') startLocD = 'TP.HCM';

    // Nếu startLocD bị trùng với điểm đến của tour nhưng thực tế xuất phát từ TP.HCM/Hà Nội
    const tourDestName = safeDestinations.find(x => String(x.destination_id) === String(tour?.destination))?.destination_name || tour?.destination;
    if ((routeOrigin || actOrigin) && (startLocD === tourDestName || !startLocD)) {
        startLocD = routeOrigin || actOrigin;
    } else if (routeOrigin && !startLocD) {
        startLocD = routeOrigin;
    } else if (actOrigin && !startLocD) {
        startLocD = actOrigin;
    }

    if (!startLocD && firstDay?.start_destination_id && isNaN(Number(firstDay.start_destination_id))) {
        startLocD = firstDay.start_destination_id;
    }
    if (!startLocD && (tour?.departure_location || tour?.start_point)) {
        startLocD = tour.departure_location || tour.start_point;
    }
    if (!startLocD && firstDay?.route_title) {
        const firstPart = firstDay.route_title.split(/[-–]/)[0]?.trim();
        if (firstPart && firstPart.length < 30) {
            startLocD = firstPart;
        }
    }
    if (!startLocD && tour?.tour_name) {
        if (tour.tour_name.includes('Hà Nội')) startLocD = 'Hà Nội';
        else if (tour.tour_name.includes('TP.HCM') || tour.tour_name.includes('Sài Gòn') || tour.tour_name.includes('Hồ Chí Minh')) startLocD = 'TP.HCM';
        else if (tour.tour_name.includes('Đà Nẵng')) startLocD = 'Đà Nẵng';
        else if (tour.tour_name.includes('Cần Thơ')) startLocD = 'Cần Thơ';
    }
    if (!startLocD) {
        startLocD = 'TP.HCM';
    }
    if (startLocD === 'Hồ Chí Minh') startLocD = 'TP.HCM';

    // --- 4. END LOCATION (Điểm đến) ---
    let endLocD = safeDestinations.find(x => String(x.destination_id) === String(lastDay?.end_destination_id || firstDay?.end_destination_id))?.destination_name;
    if (!endLocD && (lastDay?.end_destination_id || firstDay?.end_destination_id)) {
        const rawVal = lastDay?.end_destination_id || firstDay?.end_destination_id;
        if (rawVal && isNaN(Number(rawVal))) endLocD = rawVal;
    }
    if (!endLocD && tour?.destination) {
        const dObj = safeDestinations.find(x => String(x.destination_id) === String(tour.destination));
        endLocD = dObj ? dObj.destination_name : (isNaN(Number(tour.destination)) ? tour.destination : null);
    }
    if (!endLocD && tour?.tour_name) {
        const cleaned = tour.tour_name.replace(/Tour\s*/i, '');
        const parts = cleaned.split(/[-–:]/);
        if (parts.length > 1) {
            const candidate = parts[parts.length - 1].replace(/\d+N\d+Đ|\d+\s*ngày|\d+\s*đêm/gi, '').trim();
            if (candidate) endLocD = candidate;
        }
    }
    if (!endLocD) {
        endLocD = 'Nhiều điểm';
    }

    const transLocs = parsedDesign?.costConfig?.transportLocations || {};
    if (transLocs.startD) startLocD = transLocs.startD;
    if (transLocs.endD) endLocD = transLocs.endD;

    const startLocR = transLocs.startR || endLocD;
    const endLocR = transLocs.endR || startLocD;

    const timeStartD = parsedDesign?.costConfig?.transportTimes?.startD || '06:00';
    const timeEndD = parsedDesign?.costConfig?.transportTimes?.endD || '09:00';
    const timeStartR = parsedDesign?.costConfig?.transportTimes?.startR || '16:00';
    const timeEndR = parsedDesign?.costConfig?.transportTimes?.endR || '19:00';

    const title = isCustom ? `✨ Tour thiết kế riêng: ${quote?.destination || ''}` : tour?.tour_name;
    const basePrice = isCustom ? (quote?.quoted_price || quote?.quote_price) : tour?.base_price;
    
    let finalImageUrl = 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=500';
    if (tour?.image_url) {
        if (tour.image_url.startsWith('http')) {
            finalImageUrl = tour.image_url;
        } else {
            let imagePath = tour.image_url.startsWith('/') ? tour.image_url.substring(1) : tour.image_url;
            if (!imagePath.startsWith('uploads/')) {
                imagePath = `uploads/${imagePath}`;
            }
            finalImageUrl = `${GATEWAY_URL}/${imagePath}`;
        }
    }
    const bgImage = isCustom
        ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600'
        : finalImageUrl;

    // Calculate Prices
    let adultPrice = basePrice || 0;
    
    // Extract age multiplier from parsedDesign if available
    const ageMultiplier = parsedDesign?.costConfig?.ageMultiplier || {};
    const childPercent = ageMultiplier.child?.percent !== undefined ? ageMultiplier.child.percent : 75;
    const toddlerPercent = ageMultiplier.toddler?.percent !== undefined ? ageMultiplier.toddler.percent : 50;
    const infantPercent = ageMultiplier.infant?.percent !== undefined ? ageMultiplier.infant.percent : 0;
    
    let childPrice = (adultPrice * childPercent) / 100 + Number(ageMultiplier.child?.fixed_surcharge || 0);
    let toddlerPrice = (adultPrice * toddlerPercent) / 100 + Number(ageMultiplier.toddler?.fixed_surcharge || 0);
    let infantPrice = (adultPrice * infantPercent) / 100 + Number(ageMultiplier.infant?.fixed_surcharge || 0);
    let singleSupp = parsedDesign?.costConfig?.variable?.singleSupplement || 0;

    if (!isCustom && parsedDesign) {
        const ageMult = parsedDesign?.costConfig?.ageMultiplier || {};
        const getPrice = (type) => {
            const s = ageMult[type];
            if (!s) return adultPrice * (type === 'child' ? 0.75 : type === 'toddler' ? 0.5 : 0);
            return (adultPrice * (s.percent / 100)) + Number(s.fixed_surcharge || 0);
        };
        childPrice = getPrice('child');
        toddlerPrice = getPrice('toddler');
        infantPrice = getPrice('infant');
        singleSupp = parsedDesign?.costConfig?.variable?.singleSupplement || 0;
    }

    
    const validatePhoneFormat = (val) => {
        const cleaned = (val || '').trim().replace(/[\s.-]/g, '');
        return /^(0|\+?84)[0-9]{8,10}$/.test(cleaned);
    };

    const validateEmailFormat = (val) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());
    };

    const updatePassenger = (type, idx, field, value) => {
        const key = `${type}_${idx}`;
        setPassengerDetails(prev => {
            const next = {
                ...prev,
                [key]: {
                    ...prev[key],
                    [field]: value
                }
            };

            // Nếu cập nhật ngày sinh (field 'dob'), đồng bộ luôn dobYear, dobMonth, dobDay để tương thích tuyệt đối
            if (field === 'dob') {
                if (value && typeof value === 'string') {
                    const parts = value.split('-');
                    if (parts.length === 3) {
                        next[key].dobYear = parts[0];
                        next[key].dobMonth = String(parseInt(parts[1], 10));
                        next[key].dobDay = String(parseInt(parts[2], 10));
                    }
                } else {
                    next[key].dobYear = '';
                    next[key].dobMonth = '';
                    next[key].dobDay = '';
                }
            }

            const pObj = next[key] || {};
            setFieldErrors(prevErr => {
                const updatedErr = { ...prevErr };
                if (field === 'name') {
                    if (value && value.trim()) delete updatedErr[`${key}_name`];
                } else if (field === 'dob') {
                    const ageErr = ageRules[type]?.validator(value);
                    if (ageErr) {
                        updatedErr[`${key}_dob`] = ageErr;
                    } else {
                        delete updatedErr[`${key}_dob`];
                    }
                } else if (field === 'dobDay' || field === 'dobMonth' || field === 'dobYear') {
                    const currentDob = pObj.dob || (pObj.dobYear && pObj.dobMonth && pObj.dobDay ? `${pObj.dobYear}-${String(pObj.dobMonth).padStart(2, '0')}-${String(pObj.dobDay).padStart(2, '0')}` : '');
                    const ageErr = ageRules[type]?.validator(currentDob);
                    if (ageErr) {
                        updatedErr[`${key}_dob`] = ageErr;
                    } else {
                        delete updatedErr[`${key}_dob`];
                    }
                } else if (field === 'phone') {
                    if (!value || !value.trim() || validatePhoneFormat(value)) {
                        delete updatedErr[`${key}_phone`];
                    } else {
                        updatedErr[`${key}_phone`] = 'Số điện thoại không hợp lệ (gồm 10–11 chữ số, bắt đầu bằng 0)';
                    }
                }
                return updatedErr;
            });
            return next;
        });
    };
    
    let singleRoomsCount = 0;
    if (pax.adults > 0) {
        for (let i = 0; i < pax.adults; i++) {
            if (passengerDetails[`adults_${i}`]?.singleRoom) {
                singleRoomsCount++;
            }
        }
    }

    const totalPax = pax.adults + pax.children + pax.toddlers + pax.infants;
    const totalSeatsRequested = pax.adults + pax.children + pax.toddlers; // Em bé dưới 2 tuổi ngồi cùng người lớn
    const totalAmount = (pax.adults * adultPrice) + (pax.children * childPrice) + (pax.toddlers * toddlerPrice) + (pax.infants * infantPrice) + (singleRoomsCount * singleSupp);

    // --- BƯỚC 6: XÁC ĐỊNH NHU CẦU PHÒNG & KIỂM TRA KHẢ NĂNG ĐÁP ỨNG LƯU TRÚ ---
    const sharingAdults = Math.max(0, pax.adults - singleRoomsCount);
    const sharedRooms = Math.ceil(sharingAdults / 2);
    const totalRequiredRooms = singleRoomsCount + sharedRooms;
    const singleOccupiedFromSharing = sharingAdults % 2;
    const totalSingleOccupiedRooms = singleRoomsCount + singleOccupiedFromSharing;
    const doubleOccupiedRooms = Math.floor(sharingAdults / 2);
    const maxChildrenAllowed = (doubleOccupiedRooms * 1) + (totalSingleOccupiedRooms * 2);
    const isRoomAllocationValid = pax.adults >= 1 && pax.children <= maxChildrenAllowed;
    const roomAllocationMessage = isRoomAllocationValid
        ? `Phân bổ hợp lệ: ${totalRequiredRooms} phòng (${doubleOccupiedRooms} phòng đôi ghép, ${totalSingleOccupiedRooms} phòng 1 người lớn${pax.children > 0 ? `, ${pax.children} trẻ em ngủ ghép` : ''}). Đáp ứng tiêu chuẩn lưu trú.`
        : `Số lượng Trẻ em (${pax.children} bé) vượt quá tiêu chuẩn ngủ ghép tối đa (${maxChildrenAllowed} bé) cho ${totalRequiredRooms} phòng hiện tại. Vui lòng điều chỉnh số lượng hoặc chọn thêm phòng đơn.`;

    const selectedDepObj = (!isCustom && tour?.departures && bookingData?.departureId)
        ? tour.departures.find(d => String(d.departure_id) === String(bookingData.departureId))
        : null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setContactInfo({ ...contactInfo, [name]: value });
        setFieldErrors(prev => {
            const next = { ...prev };
            if (name === 'fullName') {
                if (value.trim()) delete next.contact_fullName;
            } else if (name === 'phone') {
                if (!value.trim()) {
                    next.contact_phone = 'Vui lòng nhập số điện thoại liên hệ';
                } else if (!validatePhoneFormat(value)) {
                    next.contact_phone = 'Số điện thoại không hợp lệ (gồm 10–11 chữ số, bắt đầu bằng 0)';
                } else {
                    delete next.contact_phone;
                }
            } else if (name === 'email') {
                if (!value.trim()) {
                    next.contact_email = 'Vui lòng nhập địa chỉ Email liên hệ';
                } else if (!validateEmailFormat(value)) {
                    next.contact_email = 'Định dạng Email không hợp lệ (VD: example@mail.com)';
                } else {
                    delete next.contact_email;
                }
            }
            return next;
        });
    };

    const updatePax = (type, delta) => {
        if (isCustom) return;
        setPax(prev => {
            const newVal = prev[type] + delta;
            // Prevent going below 0, and ensure at least 1 adult
            if (newVal < 0) return prev;
            if (type === 'adults' && newVal < 1) return prev;
            
            // Validate against available seats (Luồng sự kiện thay thế 5.1)
            if (delta > 0 && !isCustom && tour?.departures && bookingData?.departureId) {
                const dep = tour.departures.find(d => String(d.departure_id) === String(bookingData.departureId));
                if (dep && dep.available_slots !== undefined) {
                    const avail = Number(dep.available_slots);
                    // Đếm số chỗ thực tế (không tính em bé dưới 2 tuổi)
                    const currentTotal = prev.adults + prev.children + prev.toddlers;
                    const increment = (type === 'infants') ? 0 : 1; 
                    
                    if (increment > 0 && currentTotal + increment > avail) {
                        const msg51 = `Số lượng hành khách vượt quá số chỗ còn lại (còn ${avail} chỗ), vui lòng điều chỉnh số lượng khách`;
                        setPaxWarning(msg51);
                        return prev; // Reject the increment
                    } else {
                        setPaxWarning(''); // Clear warning if valid
                    }
                }
            } else if (delta < 0) {
                setPaxWarning('');
            }

            return { ...prev, [type]: newVal };
        });
    };

    const toggleSection = (sec) => {
        setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0) + 'đ';


    // --- 1.1 KIỂM TRA HẠN CHÓT ĐẶT TOUR (TRƯỚC 30 NGÀY) ---
    let isBookingCutoffClosed = false;
    let cutoffDaysLeft = 999;
    if (!isCustom && depDateObj && !isNaN(depDateObj.getTime())) {
        const depD = new Date(depDateObj);
        const now = new Date();
        depD.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        cutoffDaysLeft = Math.ceil((depD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (cutoffDaysLeft < 30) {
            isBookingCutoffClosed = true;
        }
    }

    const isFormValid = privacyConsent && contactInfo.fullName.trim() !== '' && contactInfo.email.trim() !== '' && contactInfo.phone.trim() !== '';

    const submitBooking = async (e) => {
        e.preventDefault();

        // Bước 2.1 & 2.2: Kiểm tra lại trạng thái tour, đợt khởi hành và số chỗ còn khả dụng
        if (!isCustom) {
            if (!tour || tour.status === 'Inactive' || tour.status === 'Closed' || !selectedDepObj || selectedDepObj.status === 'Closed' || selectedDepObj.status === 'Cancelled') {
                setAlertModal({
                    type: 'error',
                    title: 'Tour không khả dụng',
                    message: 'Tour hoặc đợt khởi hành hiện không khả dụng, vui lòng lựa chọn tour khác'
                });
                return;
            }
            if (Number(selectedDepObj.available_slots) <= 0) {
                setAlertModal({
                    type: 'error',
                    title: 'Đợt khởi hành đã hết chỗ',
                    message: 'Đợt khởi hành này đã hết chỗ, vui lòng lựa chọn đợt khởi hành khác'
                });
                return;
            }
        }

        // Bước 2: Kiểm tra điều kiện đặt trước tối thiểu 30 ngày
        if (isBookingCutoffClosed) {
            setAlertModal({
                type: 'warning',
                title: 'Đợt khởi hành đã đóng nhận khách',
                message: `Đợt khởi hành này chỉ nhận đặt trước tối thiểu 30 ngày để chốt dịch vụ khách sạn & nhà hàng với đối tác. Hiện chỉ còn ${cutoffDaysLeft > 0 ? cutoffDaysLeft : 0} ngày đến ngày đi.`
            });
            return;
        }

        // Luồng sự kiện thay thế 5.1: Số lượng hành khách vượt quá số chỗ khả dụng
        if (!isCustom && selectedDepObj && selectedDepObj.available_slots !== undefined) {
            const availSlots = Number(selectedDepObj.available_slots);
            if (totalSeatsRequested > availSlots) {
                setPaxWarning(`Số lượng hành khách vượt quá số chỗ còn lại (còn ${availSlots} chỗ), vui lòng điều chỉnh số lượng khách`);
                setTimeout(() => {
                    const el = document.getElementById('pax-quantity-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
                return;
            }
        }

        // Luồng sự kiện thay thế 5.2 & 7.1: Kiểm tra tính hợp lệ và đầy đủ của từng trường -> Cảnh báo trực tiếp tại trường đó
        const newErrors = {};
        if (!contactInfo.fullName.trim()) {
            newErrors.contact_fullName = 'Vui lòng nhập họ tên người đặt';
        }
        if (!contactInfo.phone.trim()) {
            newErrors.contact_phone = 'Vui lòng nhập số điện thoại liên hệ';
        } else if (!validatePhoneFormat(contactInfo.phone)) {
            newErrors.contact_phone = 'Số điện thoại không hợp lệ (gồm 10–11 chữ số, bắt đầu bằng 0)';
        }
        if (!contactInfo.email.trim()) {
            newErrors.contact_email = 'Vui lòng nhập địa chỉ Email liên hệ';
        } else if (!validateEmailFormat(contactInfo.email)) {
            newErrors.contact_email = 'Định dạng Email không hợp lệ (VD: example@mail.com)';
        }

        ['adults', 'children', 'toddlers', 'infants'].forEach(type => {
            for (let i = 0; i < pax[type]; i++) {
                const pKey = `${type}_${i}`;
                const pObj = passengerDetails[pKey] || {};
                if (!pObj.name || !pObj.name.trim()) {
                    newErrors[`${pKey}_name`] = 'Vui lòng nhập họ tên hành khách';
                }
                const dobVal = pObj.dob || (pObj.dobYear && pObj.dobMonth && pObj.dobDay ? `${pObj.dobYear}-${String(pObj.dobMonth).padStart(2, '0')}-${String(pObj.dobDay).padStart(2, '0')}` : '');
                const ageErr = ageRules[type]?.validator(dobVal);
                if (ageErr) {
                    newErrors[`${pKey}_dob`] = ageErr;
                }
                if (pObj.phone && pObj.phone.trim() !== '' && !validatePhoneFormat(pObj.phone)) {
                    newErrors[`${pKey}_phone`] = 'Số điện thoại không hợp lệ (gồm 10–11 chữ số, bắt đầu bằng 0)';
                }
            }
        });

        // Luồng sự kiện thay thế 7.1: Khách hàng chưa đồng ý điều khoản dịch vụ
        if (!privacyConsent) {
            newErrors.privacyConsent = 'Vui lòng xác nhận đồng ý với điều khoản trước khi tiếp tục đặt tour';
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            setTimeout(() => {
                const firstErrEl = document.querySelector('[data-error-active="true"]');
                if (firstErrEl) {
                    firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const inputEl = firstErrEl.querySelector('input, select');
                    if (inputEl) inputEl.focus();
                }
            }, 60);
            return;
        }

        // Bước 6: Kiểm tra phân bổ phòng & khả năng đáp ứng dịch vụ lưu trú
        if (!isCustom && !isRoomAllocationValid) {
            setTimeout(() => {
                const roomEl = document.getElementById('room-allocation-section');
                if (roomEl) roomEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        const passengersArray = [];
        ['adults', 'children', 'toddlers', 'infants'].forEach(type => {
            for (let i = 0; i < pax[type]; i++) {
                const pObj = passengerDetails[`${type}_${i}`] || {};
                const pGender = pObj.gender || 'Nam';
                let mappedGender = 'Other';
                if (pGender === 'Nam') mappedGender = 'Male';
                if (pGender === 'Nữ') mappedGender = 'Female';

                let birthDateStr = pObj.dob || null;
                if (!birthDateStr && pObj.dobYear && pObj.dobMonth && pObj.dobDay) {
                    const y = pObj.dobYear;
                    const m = pObj.dobMonth.toString().padStart(2, '0');
                    const d = pObj.dobDay.toString().padStart(2, '0');
                    birthDateStr = `${y}-${m}-${d}`;
                }

                let passType = 'ADULT';
                if (type === 'children') passType = 'CHILD';
                if (type === 'toddlers') passType = 'TODDLER';
                if (type === 'infants') passType = 'INFANT';

                passengersArray.push({ 
                    full_name: (pObj.name || '').trim(),
                    gender: mappedGender,
                    birth_date: birthDateStr,
                    identity_number: pObj.phone || null,
                    passenger_type: passType,
                    single_room: passType === 'ADULT' ? !!pObj.singleRoom : false
                });
            }
        });

        try {
            const dbPaymentMethod = paymentMethod === 'Cash' ? 'Cash' : 'VNPAY_QR';

            if (isCustom) {
                const response = await axios.post(
                    `${GATEWAY_URL}/api/custom-tours/quotes/${quote.quote_id}/book`,
                    { 
                        payment_method: dbPaymentMethod, 
                        notes: contactInfo.notes, 
                        passengers: passengersArray,
                        contact_name: contactInfo.fullName,
                        contact_email: contactInfo.email,
                        contact_phone: contactInfo.phone,
                        contact_address: contactInfo.address,
                        contact_info: contactInfo
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.data.success) {
                    const createdId = response.data?.data?.booking_id || response.data?.booking_id;
                    setSuccessModal({
                        bookingId: createdId,
                        bookingCode: `#BKG-${String(createdId).padStart(4, '0')}`,
                        bookingStatus: 'Chờ thanh toán',
                        holdExpiresSeconds: 600,
                        requiredRooms: totalRequiredRooms,
                        singleRoomsCount,
                        totalPax,
                        totalAmount,
                        email: contactInfo.email,
                        paymentMethod: paymentMethod,
                        isCustom: true
                    });
                }
            } else {
                const response = await axios.post(`${GATEWAY_URL}/api/bookings`, {
                    departure_id: bookingData.departureId,
                    num_people: totalPax, // Gửi tổng số người xuống backend
                    total_amount: totalAmount,
                    breakdown: {
                        ...pax,
                        singleRoomsCount,
                        requiredRooms: totalRequiredRooms,
                        contact_info: contactInfo,
                        passengers: passengersArray
                    },
                    payment_method: dbPaymentMethod,
                    notes: contactInfo.notes,
                    passengers: passengersArray,
                    contact_name: contactInfo.fullName,
                    contact_email: contactInfo.email,
                    contact_phone: contactInfo.phone,
                    contact_address: contactInfo.address,
                    contact_info: contactInfo
                }, { headers: { Authorization: `Bearer ${token}` } });

                if (response.data.success) {
                    const createdId = response.data?.booking_id || response.data?.data?.booking_id;
                    setSuccessModal({
                        bookingId: createdId,
                        bookingCode: response.data?.booking_code || `#BKG-${String(createdId).padStart(4, '0')}`,
                        bookingStatus: response.data?.booking_status || 'Chờ thanh toán',
                        holdExpiresSeconds: response.data?.hold_expires_seconds || 600,
                        requiredRooms: response.data?.required_rooms || totalRequiredRooms,
                        singleRoomsCount: response.data?.single_room_count ?? singleRoomsCount,
                        totalPax,
                        totalAmount,
                        email: contactInfo.email,
                        paymentMethod: paymentMethod,
                        isCustom: false
                    });
                }
            }
        } catch (error) {
            setAlertModal({
                type: 'error',
                title: error.response?.status === 409 ? 'Xung đột dữ liệu giữ chỗ' : 'Không thể hoàn tất đặt tour',
                message: error.response?.data?.message || error.message || 'Đã có lỗi xảy ra trong quá trình xử lý đơn hàng.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', paddingBottom: '60px', fontFamily: '"Inter", sans-serif' }}>
<div className="no-print"><CustomerNavbar /></div>

            <div className="no-print booking-layout-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                
                {/* Cột trái: Form nhập liệu */}
                <div className="booking-main-left" style={{ flex: '1', minWidth: 0 }}>
                    <h1 style={{ fontSize: '28px', color: '#0f172a', marginBottom: '8px' }}>Đặt tour của bạn</h1>
                    <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px' }}>Hãy đảm bảo tất cả thông tin chi tiết trên trang này đã chính xác trước khi tiến hành thanh toán.</p>

                    {isBookingCutoffClosed && (
                        <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '16px', padding: '18px 24px', marginBottom: '24px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)' }}>
                            <span style={{ fontSize: '32px' }}>🔒</span>
                            <div>
                                <strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px', color: '#b91c1c' }}>
                                    Đợt khởi hành đã đóng nhận khách (Chốt trước 30 ngày)
                                </strong>
                                <span style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                    Đợt khởi hành này chỉ còn {cutoffDaysLeft > 0 ? cutoffDaysLeft : 0} ngày đến ngày đi. Hệ thống đã chính thức đóng nhận khách để chốt danh sách đặt khách sạn và nhà hàng với các nhà cung cấp. Bạn không thể hoàn tất đặt vé cho đợt này. Vui lòng quay lại chọn đợt khởi hành khác!
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Khối Thông tin liên lạc */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '20px' }}>Thông tin liên lạc</h2>
                        
                        {!user && (
                            <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <User size={18} color="#1d4ed8" />
                                <span style={{ fontSize: '14px', color: '#1e40af' }}>
                                    <strong style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Đăng nhập</strong> để nhận ưu đãi, tích điểm và quản lý đơn hàng dễ dàng hơn!
                                </span>
                            </div>
                        )}

                        <div className="booking-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div data-error-active={!!fieldErrors.contact_fullName}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Họ tên <span style={{color: '#dc2626'}}>*</span></label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={contactInfo.fullName}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: fieldErrors.contact_fullName ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                        background: fieldErrors.contact_fullName ? '#fef2f2' : '#f8fafc',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                    placeholder="VD: Nguyễn Văn A"
                                />
                                {fieldErrors.contact_fullName && (
                                    <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>⚠️</span> {fieldErrors.contact_fullName}
                                    </div>
                                )}
                            </div>
                            <div data-error-active={!!fieldErrors.contact_phone}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Số điện thoại <span style={{color: '#dc2626'}}>*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={contactInfo.phone}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: fieldErrors.contact_phone ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                        background: fieldErrors.contact_phone ? '#fef2f2' : '#f8fafc',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                    placeholder="VD: 0901234567"
                                />
                                {fieldErrors.contact_phone && (
                                    <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>⚠️</span> {fieldErrors.contact_phone}
                                    </div>
                                )}
                            </div>
                            <div data-error-active={!!fieldErrors.contact_email}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Email <span style={{color: '#dc2626'}}>*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={contactInfo.email}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: fieldErrors.contact_email ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                        background: fieldErrors.contact_email ? '#fef2f2' : '#f8fafc',
                                        fontSize: '15px',
                                        outline: 'none'
                                    }}
                                    placeholder="VD: example@mail.com"
                                />
                                {fieldErrors.contact_email && (
                                    <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span>⚠️</span> {fieldErrors.contact_email}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Địa chỉ</label>
                                <input type="text" name="address" value={contactInfo.address} onChange={handleInputChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none' }} placeholder="Số nhà, đường, quận/huyện..." />
                            </div>
                        </div>
                    </div>

                    {/* Khối Hành khách (Số lượng) */}
                    <div id="pax-quantity-section" style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: paxWarning ? '1.5px solid #ef4444' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                            <h2 style={{ fontSize: '20px', color: '#0f172a', margin: 0 }}>Hành khách</h2>
                            {paxWarning && <span style={{ color: '#dc2626', fontSize: '13.5px', fontWeight: '600', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px' }}>⚠️ {paxWarning}</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Người lớn */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Người lớn</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Từ 12 tuổi trở lên</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button disabled={isCustom} onClick={() => updatePax('adults', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: isCustom ? '#f1f5f9' : '#fff', cursor: isCustom ? 'not-allowed' : 'pointer', opacity: isCustom ? 0.6 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontSize: '16px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{pax.adults}</span>
                                    <button disabled={isCustom} onClick={() => updatePax('adults', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: isCustom ? '#f1f5f9' : '#fff', cursor: isCustom ? 'not-allowed' : 'pointer', opacity: isCustom ? 0.6 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>
                            
                            {/* Trẻ em */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Trẻ em</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Từ 5 - 11 tuổi</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button disabled={isCustom} onClick={() => updatePax('children', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: isCustom ? '#f1f5f9' : '#fff', cursor: isCustom ? 'not-allowed' : 'pointer', opacity: isCustom ? 0.6 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontSize: '16px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{pax.children}</span>
                                    <button disabled={isCustom} onClick={() => updatePax('children', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: isCustom ? '#f1f5f9' : '#fff', cursor: isCustom ? 'not-allowed' : 'pointer', opacity: isCustom ? 0.6 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>
                            
                            {/* Trẻ nhỏ */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Trẻ nhỏ</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Từ 2 - 4 tuổi</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button disabled={isCustom} onClick={() => updatePax('toddlers', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: isCustom ? '#f1f5f9' : '#fff', cursor: isCustom ? 'not-allowed' : 'pointer', opacity: isCustom ? 0.6 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontSize: '16px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{pax.toddlers}</span>
                                    <button disabled={isCustom} onClick={() => updatePax('toddlers', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: isCustom ? '#f1f5f9' : '#fff', cursor: isCustom ? 'not-allowed' : 'pointer', opacity: isCustom ? 0.6 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>

                            {/* Em bé */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Em bé</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Dưới 2 tuổi</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button disabled={isCustom} onClick={() => updatePax('infants', -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: isCustom ? '#f1f5f9' : '#fff', cursor: isCustom ? 'not-allowed' : 'pointer', opacity: isCustom ? 0.6 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                    <span style={{ fontSize: '16px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{pax.infants}</span>
                                    <button disabled={isCustom} onClick={() => updatePax('infants', 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e1', background: isCustom ? '#f1f5f9' : '#fff', cursor: isCustom ? 'not-allowed' : 'pointer', opacity: isCustom ? 0.6 : 1, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Khối Thông tin hành khách (Dynamic Forms) */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Thông tin hành khách</h2>

                        {['adults', 'children', 'toddlers', 'infants'].map(type => {
                            if (pax[type] === 0) return null;
                            const typeName = type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : type === 'toddlers' ? 'Trẻ nhỏ' : 'Em bé';
                            const typeDesc = ageRules[type]?.shortDesc || (type === 'adults' ? 'Từ 12 tuổi trở lên' : type === 'children' ? 'Từ 5 - 11 tuổi' : type === 'toddlers' ? 'Từ 2 - 4 tuổi' : 'Dưới 2 tuổi');

                            return (
                                <div key={type} style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <User size={18} color="#2563eb" />
                                        <strong style={{ fontSize: '16px', color: '#1e40af' }}>{typeName} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>({typeDesc})</span></strong>
                                    </div>

                                    {Array.from({ length: pax[type] }).map((_, idx) => {
                                        const pKey = `${type}_${idx}`;
                                        const pData = passengerDetails[pKey] || {};
                                        const errName = fieldErrors[`${pKey}_name`];
                                        const errDob = fieldErrors[`${pKey}_dob`];
                                        const errPhone = fieldErrors[`${pKey}_phone`];
                                        const rowErrors = [errName, errDob, errPhone].filter(Boolean);
                                        const hasRowErr = rowErrors.length > 0;

                                        return (
                                            <div key={idx} data-error-active={hasRowErr} style={{ marginBottom: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500', width: '20px' }}>#{idx + 1}</span>
                                                    <div
                                                        onClick={() => setShowPassengerModal(true)}
                                                        style={{
                                                            flex: 1,
                                                            border: hasRowErr ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                                            background: hasRowErr ? '#fef2f2' : '#fff',
                                                            borderRadius: '24px',
                                                            padding: '12px 20px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '14px', color: '#64748b' }}>{typeName} <span style={{ color: '#dc2626' }}>*</span></span>
                                                        {pData.name ? (
                                                            <span style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>
                                                                {pData.name}
                                                                {pData.dob ? ` • ${formatDateDMY(pData.dob)}` : (pData.dobDay && pData.dobMonth && pData.dobYear ? ` • ${String(pData.dobDay).padStart(2, '0')}/${String(pData.dobMonth).padStart(2, '0')}/${pData.dobYear}` : '')}
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>Nhập thông tin ➔</span>
                                                        )}
                                                    </div>
                                                    {type === 'adults' && (
                                                        <div
                                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                                            onClick={() => updatePassenger(type, idx, 'singleRoom', !pData.singleRoom)}
                                                            title="Phòng đơn: ở riêng, không ghép với hành khách khác."
                                                        >
                                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Phòng đơn</span>
                                                            <div style={{ width: '40px', height: '20px', background: pData.singleRoom ? '#0ea5e9' : '#e2e8f0', borderRadius: '10px', position: 'relative', transition: 'background 0.3s' }}>
                                                                <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: pData.singleRoom ? '22px' : '2px', transition: 'left 0.3s' }}></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {hasRowErr && (
                                                    <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', marginTop: '6px', paddingLeft: '36px' }}>
                                                        ⚠️ {rowErrors.join(' • ')} (Nhấn vào dòng trên để chỉnh sửa)
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {/* BƯỚC 6: XÁC ĐỊNH NHU CẦU PHÒNG & PHÂN BỔ DỊCH VỤ LƯU TRÚ */}
                        <div id="room-allocation-section" style={{
                            marginTop: '12px',
                            padding: '16px 20px',
                            borderRadius: '14px',
                            background: isRoomAllocationValid ? '#f0fdf4' : '#fef2f2',
                            border: `1.5px solid ${isRoomAllocationValid ? '#bbf7d0' : '#ef4444'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <strong style={{ fontSize: '15px', color: isRoomAllocationValid ? '#166534' : '#991b1b' }}>
                                    🏨 Xác định nhu cầu phòng & Phân bổ dịch vụ lưu trú
                                </strong>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    background: isRoomAllocationValid ? '#dcfce7' : '#fee2e2',
                                    color: isRoomAllocationValid ? '#15803d' : '#b91c1c'
                                }}>
                                    {isRoomAllocationValid ? `Tổng ${totalRequiredRooms} phòng lưu trú` : 'Cần điều chỉnh xếp phòng'}
                                </span>
                            </div>
                            <div style={{ fontSize: '13.5px', color: isRoomAllocationValid ? '#14532d' : '#7f1d1d', lineHeight: '1.5' }}>
                                {roomAllocationMessage}
                            </div>
                        </div>
                    </div>

                    {/* Khối Mã ưu đãi */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Mã ưu đãi</h2>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <input type="text" placeholder="Ví dụ: TRAVELERP100" style={{ flex: 1, padding: '14px 20px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none' }} />
                            <button style={{ padding: '0 32px', borderRadius: '24px', background: '#e2e8f0', color: '#94a3b8', border: 'none', fontWeight: 'bold', fontSize: '15px' }}>Áp dụng</button>
                        </div>
                    </div>

                    {/* Khối Phương thức thanh toán (QR / Ngân hàng + Tiền mặt) */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '16px' }}>Phương thức thanh toán</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: paymentMethod === 'VNPAY_QR' ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '12px', background: paymentMethod === 'VNPAY_QR' ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <input type="radio" name="payment" checked={paymentMethod === 'VNPAY_QR'} onChange={() => setPaymentMethod('VNPAY_QR')} style={{ width: '20px', height: '20px', accentColor: '#2563eb' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <strong style={{ fontSize: '16px', color: '#0f172a' }}>📱 Thanh toán bằng QR / Ngân hàng</strong>
                                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>ĐỀ XUẤT • TỰ ĐỘNG 24/7</span>
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                                        Quét mã VietQR qua ứng dụng Mobile Banking hoặc ví điện tử. Hệ thống tự động xác nhận đơn hàng sau 3-5 giây.
                                    </span>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: paymentMethod === 'Cash' ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '12px', background: paymentMethod === 'Cash' ? '#eff6ff' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <input type="radio" name="payment" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} style={{ width: '20px', height: '20px', accentColor: '#2563eb' }} />
                                <div>
                                    <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>💵 Thanh toán bằng tiền mặt</strong>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Đến trực tiếp văn phòng TravelERP để đóng tiền. Đơn hàng sẽ ở trạng thái chờ xác nhận.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Khối Ghi chú */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '8px' }}>Ghi chú</h2>
                        <p style={{ fontSize: '14px', color: '#0f172a', fontWeight: '500', marginBottom: '16px' }}>Vui lòng cho chúng tôi biết nếu Quý khách có ghi chú hoặc yêu cầu đặc biệt.</p>
                        <textarea name="notes" value={contactInfo.notes} onChange={handleInputChange} rows="4" placeholder="Ví dụ: Bữa ăn chay, đến muộn..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#f8fafc', fontSize: '15px', outline: 'none', resize: 'vertical' }}></textarea>
                    </div>
                </div>

                {/* Cột phải: Sidebar Tóm tắt đơn hàng */}
                <div className="booking-sidebar-right" style={{ width: '380px', position: 'sticky', top: '100px' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '20px', color: '#0f172a', marginBottom: '20px' }}>Tóm tắt đơn hàng</h2>
                        
                        {/* Header của Tour */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <img src={bgImage} alt="Tour" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                            <div>
                                <h3 style={{ fontSize: '14px', color: '#0f172a', margin: '0 0 8px 0', lineHeight: '1.4' }}>{title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                                    <Tag size={14} /> {tour?.tour_code || `${tour?.tour_id || quote?.quote_id}-DEP`}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <button type="button" onClick={() => setShowItineraryModal(true)} style={{ width: '100%', padding: '12px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.05)' }}>
                                <Calendar size={18} /> Xem lại chi tiết lịch trình
                            </button>
                        </div>

                        {/* Accordion 1: Thông tin chuyến xe */}
                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '16px', marginBottom: '16px' }}>
                            <div onClick={() => toggleSection('transport')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: '600', fontSize: '15px' }}>
                                    <span>🚌</span> Thông tin chuyến xe
                                </div>
                                <ChevronDown size={18} color="#64748b" style={{ transform: expandedSections.transport ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>
                            
                            {expandedSections.transport && (

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Ngày đi: <strong style={{color: '#0f172a'}}>{depDateStr}</strong></span>
                                        <span style={{ color: '#ea580c', fontWeight: '600' }}>{transportIcon} {transportName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '16px' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>{timeStartD}</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{startLocD}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block' }}>{timeEndD}</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{endLocD}</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px dotted #e2e8f0', margin: '12px 0' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                                        <span style={{ color: '#64748b' }}>Ngày về: <strong style={{color: '#0f172a'}}>{retDateStr}</strong></span>
                                        <span style={{ color: '#ea580c', fontWeight: '600' }}>{transportIcon} {transportName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <div>
                                            <strong style={{ display: 'block' }}>{timeStartR}</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{startLocR}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block' }}>{timeEndR}</strong>
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>{endLocR}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Accordion 2: Chi tiết chi phí */}
                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '16px', marginBottom: '16px' }}>
                            <div onClick={() => toggleSection('price')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: '600', fontSize: '15px' }}>
                                    <span>💵</span> Chi tiết chi phí
                                </div>
                                <ChevronDown size={18} color="#64748b" style={{ transform: expandedSections.price ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>
                            
                            {expandedSections.price && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#475569' }}>
                                    {pax.adults > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Người lớn</span>
                                            <span>{pax.adults} x {formatCurrency(adultPrice)}</span>
                                        </div>
                                    )}
                                    {pax.children > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Trẻ em</span>
                                            <span>{pax.children} x {formatCurrency(childPrice)}</span>
                                        </div>
                                    )}
                                    {pax.toddlers > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Trẻ nhỏ</span>
                                            <span>{pax.toddlers} x {formatCurrency(toddlerPrice)}</span>
                                        </div>
                                    )}
                                    {pax.infants > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Em bé</span>
                                            <span>{pax.infants} x {formatCurrency(infantPrice)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Phụ thu phòng đơn</span>
                                        <span>{singleRoomsCount > 0 ? `${singleRoomsCount} x ${formatCurrency(singleSupp)}` : formatCurrency(singleSupp) + " / phòng"}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dotted #e2e8f0', color: '#0f172a', fontWeight: '600' }}>
                                        <span>Số phòng lưu trú phân bổ</span>
                                        <span>{totalRequiredRooms} phòng ({singleRoomsCount} phòng đơn)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Tổng tiền và Submit */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginTop: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <strong style={{ fontSize: '18px', color: '#0f172a' }}>Tổng tiền</strong>
                            <strong style={{ fontSize: '24px', color: '#dc2626' }}>{formatCurrency(totalAmount)}</strong>
                        </div>

                        <div data-error-active={!!fieldErrors.privacyConsent} style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: fieldErrors.privacyConsent ? '10px 12px' : '0', borderRadius: '10px', border: fieldErrors.privacyConsent ? '1.5px solid #ef4444' : 'none', background: fieldErrors.privacyConsent ? '#fef2f2' : 'transparent' }}>
                                <div style={{ width: '20px', height: '20px', minWidth: '20px', border: privacyConsent ? 'none' : (fieldErrors.privacyConsent ? '1.5px solid #ef4444' : '1px solid #cbd5e1'), borderRadius: '4px', background: privacyConsent ? '#2563eb' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                                    {privacyConsent && <Check size={14} color="#fff" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={privacyConsent}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setPrivacyConsent(checked);
                                        if (checked) {
                                            setFieldErrors(prev => {
                                                const next = { ...prev };
                                                delete next.privacyConsent;
                                                return next;
                                            });
                                        }
                                    }}
                                    style={{ display: 'none' }}
                                />
                                <span style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                    Tôi đồng ý với <strong style={{ color: '#2563eb' }}>Chính sách bảo vệ dữ liệu cá nhân</strong> và <strong style={{ color: '#2563eb' }}>Điều khoản dịch vụ</strong>
                                </span>
                            </label>
                            {fieldErrors.privacyConsent && (
                                <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>⚠️</span> {fieldErrors.privacyConsent}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" style={{ width: '48px', height: '48px', borderRadius: '24px', background: '#1d4ed8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                <Phone size={20} />
                            </button>
                            {isBookingCutoffClosed ? (
                                <button disabled style={{ flex: 1, height: '48px', borderRadius: '24px', background: '#94a3b8', color: '#fff', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'not-allowed' }}>
                                    🔒 Đã đóng nhận khách (Quá hạn 30 ngày)
                                </button>
                            ) : (
                                <button onClick={submitBooking} disabled={isSubmitting} style={{ flex: 1, height: '48px', borderRadius: '24px', background: '#dc2626', color: '#fff', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }}>
                                    {isSubmitting ? 'Đang kiểm tra & giữ chỗ...' : 'Xác Nhận Đặt Tour'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Passenger Info Modal */}
            {showPassengerModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflowY: 'auto' }}>
                    <div style={{ background: '#f8fafc', width: '100%', maxWidth: '800px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: '20px', marginBottom: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        
                        {/* Modal Header */}
                        <div style={{ background: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                            <h2 style={{ fontSize: '20px', color: '#0f172a', margin: 0 }}>Thông tin hành khách</h2>
                            <button onClick={() => setShowPassengerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px' }}>
                            <div style={{ background: '#eff6ff', color: '#1e40af', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '24px' }}>
                                Phòng đơn dành cho khách hàng từ 12 tuổi trở lên, giá phòng đơn là: <strong style={{color: '#3b82f6'}}>{formatCurrency(singleSupp)} / phòng</strong>
                            </div>

                            {['adults', 'children', 'toddlers', 'infants'].map(type => {
                                if (pax[type] === 0) return null;
                                const typeName = type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : type === 'toddlers' ? 'Trẻ nhỏ' : 'Em bé';
                                const typeDesc = ageRules[type]?.desc || '';
                                
                                return (
                                    <div key={type} style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                            <User size={18} color="#3b82f6" />
                                            <strong style={{ fontSize: '16px', color: '#2563eb' }}>{typeName} <span style={{fontSize: '13px', fontWeight: 'normal', color: '#64748b'}}>({typeDesc})</span></strong>
                                        </div>

                                        {Array.from({ length: pax[type] }).map((_, idx) => {
                                            const pKey = `${type}_${idx}`;
                                            const pData = passengerDetails[pKey] || {};
                                            const errName = fieldErrors[`${pKey}_name`];
                                            const errDob = fieldErrors[`${pKey}_dob`];
                                            const errPhone = fieldErrors[`${pKey}_phone`];

                                            return (
                                            <div key={idx} style={{ display: 'flex', gap: '16px', marginBottom: '24px', paddingBottom: idx !== pax[type]-1 ? '24px' : '0', borderBottom: idx !== pax[type]-1 ? '1px dashed #e2e8f0' : 'none' }}>
                                                <strong style={{ fontSize: '16px', color: '#0f172a', paddingTop: '8px' }}>#{idx + 1}</strong>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Họ tên <span style={{color: '#dc2626'}}>*</span></label>
                                                        <input
                                                            type="text"
                                                            value={pData.name || ''}
                                                            onChange={e => updatePassenger(type, idx, 'name', e.target.value)}
                                                            placeholder="VD: Nguyễn Văn A"
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px 16px',
                                                                borderRadius: '24px',
                                                                border: errName ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                                                background: errName ? '#fef2f2' : '#f8fafc',
                                                                fontSize: '15px',
                                                                outline: 'none',
                                                                boxSizing: 'border-box'
                                                            }}
                                                        />
                                                        {errName && <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', marginTop: '6px' }}>⚠️ {errName}</div>}
                                                    </div>
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Ngày sinh <span style={{color: '#dc2626'}}>*</span></label>
                                                            <input
                                                                type="date"
                                                                value={pData.dob || (pData.dobYear && pData.dobMonth && pData.dobDay ? `${pData.dobYear}-${String(pData.dobMonth).padStart(2, '0')}-${String(pData.dobDay).padStart(2, '0')}` : '')}
                                                                onChange={e => updatePassenger(type, idx, 'dob', e.target.value)}
                                                                min={ageRules[type]?.minDate}
                                                                max={ageRules[type]?.maxDate}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    borderRadius: '24px',
                                                                    border: errDob ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                                                    background: errDob ? '#fef2f2' : '#f8fafc',
                                                                    fontSize: '15px',
                                                                    outline: 'none',
                                                                    color: '#0f172a',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            />
                                                            {errDob && <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', marginTop: '6px' }}>⚠️ {errDob}</div>}
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Giới tính <span style={{color: '#dc2626'}}>*</span></label>
                                                            <select value={pData.gender || 'Nam'} onChange={e => updatePassenger(type, idx, 'gender', e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none', appearance: 'none', boxSizing: 'border-box' }}>
                                                                <option value="Nam">Nam</option>
                                                                <option value="Nữ">Nữ</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {type === 'adults' && (
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Số điện thoại</label>
                                                                <input
                                                                    type="tel"
                                                                    value={pData.phone || ''}
                                                                    onChange={e => updatePassenger(type, idx, 'phone', e.target.value)}
                                                                    placeholder="Ví dụ: 0901234567"
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '12px 16px',
                                                                        borderRadius: '24px',
                                                                        border: errPhone ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                                                                        background: errPhone ? '#fef2f2' : '#f8fafc',
                                                                        fontSize: '15px',
                                                                        outline: 'none',
                                                                        boxSizing: 'border-box'
                                                                    }}
                                                                />
                                                                {errPhone && <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', marginTop: '6px' }}>⚠️ {errPhone}</div>}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4px' }}>
                                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Phòng đơn</label>
                                                                <div onClick={() => updatePassenger(type, idx, 'singleRoom', !pData.singleRoom)} style={{ width: '44px', height: '24px', background: pData.singleRoom ? '#3b82f6' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                                                                    <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: pData.singleRoom ? '22px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', transition: 'left 0.2s' }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ background: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: '16px', borderTop: '1px solid #e2e8f0' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const paxErrors = {};
                                    ['adults', 'children', 'toddlers', 'infants'].forEach(type => {
                                        for (let i = 0; i < pax[type]; i++) {
                                            const pKey = `${type}_${i}`;
                                            const pObj = passengerDetails[pKey] || {};
                                            if (!pObj.name || !pObj.name.trim()) {
                                                paxErrors[`${pKey}_name`] = 'Vui lòng nhập họ tên hành khách';
                                            }
                                            const dobVal = pObj.dob || (pObj.dobYear && pObj.dobMonth && pObj.dobDay ? `${pObj.dobYear}-${String(pObj.dobMonth).padStart(2, '0')}-${String(pObj.dobDay).padStart(2, '0')}` : '');
                                            const ageErr = ageRules[type]?.validator(dobVal);
                                            if (ageErr) {
                                                paxErrors[`${pKey}_dob`] = ageErr;
                                            }
                                            if (pObj.phone && pObj.phone.trim() !== '' && !validatePhoneFormat(pObj.phone)) {
                                                paxErrors[`${pKey}_phone`] = 'Số điện thoại không hợp lệ (gồm 10–11 chữ số, bắt đầu bằng 0)';
                                            }
                                        }
                                    });
                                    setFieldErrors(prev => {
                                        const cleaned = { ...prev };
                                        Object.keys(cleaned).forEach(k => {
                                            if (k.startsWith('adults_') || k.startsWith('children_') || k.startsWith('toddlers_') || k.startsWith('infants_')) {
                                                delete cleaned[k];
                                            }
                                        });
                                        return { ...cleaned, ...paxErrors };
                                    });
                                    if (Object.keys(paxErrors).length === 0) {
                                        setShowPassengerModal(false);
                                    }
                                }}
                                style={{ padding: '12px 32px', borderRadius: '24px', border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', minWidth: '160px' }}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ITINERARY MODAL */}
            {showItineraryModal && (
                <div className="printable-modal-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div className="printable-modal-content" style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '800px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div className="no-print" style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>🗺️ Lịch trình</h3>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                    <i className="fas fa-print"></i> In
                                </button>
                                <button onClick={() => {
                                    const element = document.querySelector('.itinerary-print-area');
                                    if (!element) return;
                                    const opt = {
                                        margin: [10, 10, 10, 10],
                                        filename: `Lich-Trinh-${(title || 'Tour').replace(/[^a-zA-Z0-9_À-ỹ]/g, '-')}.pdf`,
                                        image: { type: 'jpeg', quality: 0.98 },
                                        html2canvas: { scale: 2, useCORS: true },
                                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                                        pagebreak: { mode: 'css', avoid: '.print-modal-day' }
                                    };
                                    html2pdf().set(opt).from(element).save();
                                }} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                    <i className="fas fa-file-pdf"></i> Tải PDF
                                </button>
                                <button onClick={() => setShowItineraryModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '28px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                            </div>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
                            <div className="itinerary-print-area" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {/* Brand Header */}
                                <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px dashed #e2e8f0' }}>
                                    <h1 style={{ margin: '0', fontSize: '32px', fontWeight: '900', color: '#3b82f6', letterSpacing: '-1px' }}>Travel<span style={{ color: '#0f172a' }}>VN</span></h1>
                                    <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>Hành Trình Chi Tiết</p>
                                    <h2 style={{ margin: '16px 0 0 0', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{title}</h2>
                                </div>

                                {/* Overview Card */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}><i className="far fa-calendar-alt"></i></div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Ngày đi</div>
                                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{timeStartD} <br/> <span style={{ color: '#3b82f6' }}>{depDateStr}</span></div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}><i className="far fa-calendar-check"></i></div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Ngày về</div>
                                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{timeStartR} <br/> <span style={{ color: '#d97706' }}>{retDateStr}</span></div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}><i className="fas fa-map-marker-alt"></i></div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Xuất phát</div>
                                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{startLocD}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}><i className="far fa-clock"></i></div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Thời lượng</div>
                                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{tour?.duration_days || daysArr.length || 1} ngày</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fdf4ff', color: '#d946ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}><i className="fas fa-route"></i></div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Điểm đến</div>
                                            <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{endLocD || 'Nhiều điểm'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Itinerary Cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '16px' }}>
                                    {daysArr.map((d, idx) => {
                                        const dayNum = d.dayIndex || d.day_number || d.day || (idx + 1);
                                        const dayTitle = d.route_title || d.title || `Ngày ${dayNum}`;
                                        const cleanTitle = dayTitle.replace(new RegExp(`^Ngày ${dayNum}:\\s*`), '').replace(new RegExp(`^Ngày ${dayNum}\\s*`), '');
                                        const desc = d.activities
                                            ? d.activities.map(a => typeof a === 'string' ? `• ${a}` : `• ${a.name || a.title || a.service_name || ''}`).join('\n')
                                            : (typeof d.description === 'string' ? d.description : '');

                                        const rawHotel = d.hotel || d.hotel_name || d.accommodation || d.lodging;
                                        let hotelText = '';
                                        if (rawHotel) {
                                            if (typeof rawHotel === 'string') hotelText = rawHotel;
                                            else if (typeof rawHotel === 'object') {
                                                hotelText = rawHotel.name || rawHotel.service_name || rawHotel.hotel_name || rawHotel.title || '';
                                            }
                                        }

                                        return (
                                            <div key={idx} className="print-modal-day" style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ background: 'linear-gradient(to right, #eff6ff, #ffffff)', padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                                    <div style={{ background: '#3b82f6', color: '#fff', padding: '10px 24px', borderRadius: '14px', fontSize: '15px', fontWeight: '800', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                                                        NGÀY {dayNum}
                                                    </div>
                                                    <h4 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800', flex: 1, minWidth: '200px' }}>
                                                        {cleanTitle}
                                                    </h4>
                                                    <div style={{ fontSize: '50px', fontWeight: '900', color: '#e2e8f0', lineHeight: 1, userSelect: 'none' }}>
                                                        {String(dayNum).padStart(2, '0')}
                                                    </div>
                                                </div>
                                                <div style={{ padding: '32px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        {desc.split('\n').filter(line => line.trim() !== '').map((line, lIdx) => (
                                                            <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                                                <div style={{ marginTop: '4px', minWidth: '28px', height: '28px', borderRadius: '50%', background: '#f8fafc', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                                                </div>
                                                                <div style={{ color: '#334155', fontSize: '16px', lineHeight: '1.6', paddingTop: '3px' }}>
                                                                    {line.replace(/^•\s*/, '').replace(/^-\s*/, '')}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {hotelText ? (
                                                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                                                            <span>🏨 Nơi lưu trú:</span> <strong style={{ color: '#0f172a' }}>{hotelText}</strong>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            {successModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 99999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        width: '100%',
                        maxWidth: '480px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
                        textAlign: 'center',
                        padding: '36px 28px 28px',
                        position: 'relative',
                        border: '1px solid #e2e8f0'
                    }}>
                        {/* Glowing Success Badge */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 12px 28px rgba(34, 197, 94, 0.25)'
                        }}>
                            <CheckCircle2 size={46} color="#16a34a" strokeWidth={2.5} />
                        </div>

                        {/* Title & Booking Code (Bước 10, 11, 12) */}
                        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
                            Khởi Tạo Đơn Đặt Tour & Giữ Chỗ Thành Công!
                        </h2>
                        {successModal.bookingId && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                <span style={{ background: '#f1f5f9', color: '#0284c7', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                                    Mã Booking: {successModal.bookingCode || `#BKG-${String(successModal.bookingId).padStart(4, '0')}`}
                                </span>
                                <span style={{ background: '#fef3c7', color: '#b45309', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                                    Trạng thái: {successModal.bookingStatus || 'Chờ thanh toán'}
                                </span>
                            </div>
                        )}

                        {/* Tóm tắt giữ chỗ & thông tin đơn đặt tour */}
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: '14px 16px',
                            marginBottom: '16px',
                            textAlign: 'left',
                            fontSize: '13.5px',
                            color: '#334155',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>⏱️ Thời hạn giữ chỗ tạm thời:</span>
                                <strong style={{ color: '#dc2626' }}>10 phút ({Math.round((successModal.holdExpiresSeconds || 600) / 60)} phút)</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>👥 Số lượng hành khách:</span>
                                <strong>{successModal.totalPax || totalPax} hành khách</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>🏨 Phân bổ phòng lưu trú:</span>
                                <strong>{successModal.requiredRooms || totalRequiredRooms} phòng ({successModal.singleRoomsCount ?? singleRoomsCount} phòng đơn)</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                                <span style={{ color: '#0f172a', fontWeight: '700' }}>💰 Tổng tiền thanh toán:</span>
                                <strong style={{ color: '#dc2626', fontSize: '15px' }}>{formatCurrency(successModal.totalAmount || totalAmount)}</strong>
                            </div>
                        </div>

                        {/* Email Notification Card */}
                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '16px',
                            padding: '16px',
                            marginBottom: '16px',
                            textAlign: 'left',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                background: '#16a34a',
                                color: '#ffffff',
                                borderRadius: '50%',
                                width: '38px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Mail size={20} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '2px' }}>
                                    Thông tin đơn hàng đã gửi về email:
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#14532d', wordBreak: 'break-all' }}>
                                    {successModal.email}
                                </div>
                            </div>
                        </div>

                        {/* Payment Instruction Card */}
                        {successModal.paymentMethod === 'Cash' ? (
                            <div style={{
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: '16px',
                                padding: '14px 16px',
                                marginBottom: '24px',
                                textAlign: 'left',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start'
                            }}>
                                <div style={{ fontSize: '22px', lineHeight: 1 }}>💵</div>
                                <div style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
                                    <strong style={{ display: 'block', marginBottom: '2px', color: '#78350f' }}>Thanh toán tiền mặt:</strong>
                                    Bạn có thể đến văn phòng TravelERP để hoàn tất thanh toán, hoặc bấm chuyển khoản VietQR ngay bên dưới để xác nhận đơn thành công lập tức.
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '16px',
                                padding: '14px 16px',
                                marginBottom: '24px',
                                textAlign: 'left',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start'
                            }}>
                                <div style={{ fontSize: '22px', lineHeight: 1 }}>💳</div>
                                <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
                                    <strong style={{ display: 'block', marginBottom: '2px', color: '#1e3a8a' }}>Thanh toán Chuyển khoản / VietQR:</strong>
                                    Hệ thống đã giữ chỗ tạm thời cho đơn đặt tour của bạn. Nhấn xác nhận bên dưới để chuyển sang bước thanh toán.
                                </div>
                            </div>
                        )}

                        {/* Action Buttons (Bước 11 & Bước 12) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    navigate(`/my-bookings?pay=${successModal.bookingId}&type=tour`);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span>{successModal.paymentMethod === 'Cash' ? '💳 Đổi sang Chuyển khoản VietQR ngay' : 'Xác nhận tiếp tục thanh toán'}</span>
                                <ArrowRight size={18} />
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/my-bookings')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#f8fafc',
                                    color: '#0f172a',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '14px',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                📋 Xem Đơn Hàng Của Tôi
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#f8fafc',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '14px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Về Trang Chủ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ALERT / WARNING MODAL */}
            {alertModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 99999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        width: '100%',
                        maxWidth: '440px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
                        textAlign: 'center',
                        padding: '32px 24px 24px',
                        position: 'relative',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            background: alertModal.type === 'error' ? '#fee2e2' : '#fef3c7',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {alertModal.type === 'error' ? (
                                <AlertCircle size={40} color="#dc2626" />
                            ) : (
                                <AlertTriangle size={40} color="#d97706" />
                            )}
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>
                            {alertModal.title}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                            {alertModal.message}
                        </p>
                        <button
                            type="button"
                            onClick={() => setAlertModal(null)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: alertModal.type === 'error' ? '#dc2626' : '#d97706',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Đã Hiểu
                        </button>
                    </div>
                </div>
            )}

            <div className="no-print"><CustomerFooter /></div>
        </div>
    );
};
const BookingForm = () => <ErrorBoundary><BookingFormInner /></ErrorBoundary>;
export default BookingForm;
