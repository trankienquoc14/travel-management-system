import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import TravelPreferenceFilter, { trackBehavior } from './TravelPreferenceFilter';
import TravelPreferenceSidebar from './TravelPreferenceSidebar';
import '../index.css';

const HomePage = () => {
    const [user, setUser] = useState(null);
    const [tours, setTours] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingTours, setLoadingTours] = useState(true);
    const [loadingServices, setLoadingServices] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [trendingTab, setTrendingTab] = useState('Tất cả');

    const [selectedSeat, setSelectedSeat] = useState('Tất cả');
    const [selectedQuality, setSelectedQuality] = useState('Tất cả');

    const [selectedRegion, setSelectedRegion] = useState('Tất cả');
    const [showSidebar, setShowSidebar] = useState(true);

    // Floating Travel Search Inputs
    const [searchLocation, setSearchLocation] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [searchBudget, setSearchBudget] = useState('All');

    // Structured travel preferences state (syncs with Top Bar & Left Sidebar)
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('user_travel_preferences');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return {
            destinations: [],
            duration: 'All',
            tripPurposes: [],
            companions: [],
            budgetRange: 'All',
            interests: [],
            pace: 'All',
            accommodationLevel: 'All',
            transportTypes: [],
            keyPriorities: [],
            searchTerm: '',
            departureDate: ''
        };
    });

    const tourSliderRef = useRef(null);
    const discountSliderRef = useRef(null);
    const serviceSliderRef = useRef(null);
    const showcaseRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchTours();
        fetchServices();
    }, []);

    const fetchTours = async () => {
        setLoadingTours(true);
        try {
            const response = await axios.get('http://localhost:5000/api/tours');
            if (response.data.success) {
                setTours(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách tour:', error);
        } finally {
            setLoadingTours(false);
        }
    };

    const fetchServices = async () => {
        setLoadingServices(true);
        try {
            const res = await axios.get('http://localhost:5000/api/services');
            if (res.data.success) {
                const activeServices = res.data.data.filter(s => s.status === 'Active');
                setServices(activeServices);
            }
        } catch (error) {
            console.error('Lỗi khi tải dịch vụ:', error);
        } finally {
            setLoadingServices(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getImageUrl = (url) => {
        if (!url || url === 'undefined' || url === 'null') return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
        if (url.startsWith('http')) return url;

        let imagePath = url.startsWith('/') ? url.substring(1) : url;
        if (!imagePath.startsWith('uploads/')) {
            imagePath = `uploads/${imagePath}`;
        }
        return `http://localhost:5000/${encodeURI(imagePath)}`;
    };

    // 🚀 BỘ LỌC MATCHING SCORE CÁ NHÂN HÓA & TIÊU CHÍ SIDEBAR
    const checkPurposeMatch = (tour, purposes) => {
        if (!purposes || purposes.length === 0) return true;
        const text = `${tour.tour_name} ${tour.description || ''} ${tour.destination || ''}`.toLowerCase();
        return purposes.some(p => {
            if (p.includes('Biển')) return text.includes('biển') || text.includes('phú quốc') || text.includes('nha trang') || text.includes('quy nhơn') || text.includes('phú yên') || text.includes('hạ long') || text.includes('hồ tràm') || text.includes('vĩnh hy') || text.includes('phú quý');
            if (p.includes('Nghỉ dưỡng')) return text.includes('nghỉ dưỡng') || text.includes('thư giãn') || text.includes('resort') || text.includes('đà lạt') || text.includes('phú quốc') || text.includes('hồ tràm') || text.includes('sapa') || text.includes('vĩnh hy') || text.includes('5 sao');
            if (p.includes('Khám phá thiên nhiên')) return text.includes('khám phá') || text.includes('thiên nhiên') || text.includes('vịnh') || text.includes('hạ long') || text.includes('sapa') || text.includes('fansipan') || text.includes('hà giang') || text.includes('nho quế') || text.includes('tràng an') || text.includes('phong nha') || text.includes('đảo') || text.includes('tây nguyên') || text.includes('thác') || text.includes('bobla');
            if (p.includes('Văn hóa')) return text.includes('văn hóa') || text.includes('hội an') || text.includes('huế') || text.includes('cố đô') || text.includes('chùa') || text.includes('đền') || text.includes('tây ninh') || text.includes('miền tây') || text.includes('sa đéc') || text.includes('tam chúc') || text.includes('phố cổ') || text.includes('di sản') || text.includes('núi bà đen');
            if (p.includes('Sông nước')) return text.includes('sông nước') || text.includes('miền tây') || text.includes('cần thơ') || text.includes('bến tre') || text.includes('bạc liêu') || text.includes('cà mau') || text.includes('sa đéc') || text.includes('đồng tháp') || text.includes('chợ nổi') || text.includes('sông hậu');
            if (p.includes('Teambuilding')) return text.includes('teambuilding') || text.includes('doanh nghiệp') || text.includes('đoàn') || text.includes('hạ long') || text.includes('đà nẵng') || text.includes('phú quốc') || text.includes('nha trang');
            return true;
        });
    };

    const checkInterestMatch = (tour, interests) => {
        if (!interests || interests.length === 0) return true;
        const text = `${tour.tour_name} ${tour.description || ''} ${tour.destination || ''}`.toLowerCase();
        return interests.some(i => {
            if (i.includes('Tắm biển')) return text.includes('biển') || text.includes('phú quốc') || text.includes('nha trang') || text.includes('quy nhơn') || text.includes('phú yên') || text.includes('hạ long') || text.includes('hồ tràm') || text.includes('vĩnh hy') || text.includes('phú quý') || text.includes('san hô') || text.includes('kỳ co') || text.includes('eo gió');
            if (i.includes('Chinh phục')) return text.includes('fansipan') || text.includes('sapa') || text.includes('hà giang') || text.includes('núi') || text.includes('lũng cú') || text.includes('mã pí lèng') || text.includes('đỉnh') || text.includes('núi bà đen') || text.includes('săn mây') || text.includes('nho quế');
            if (i.includes('Check-in')) return text.includes('check-in') || text.includes('cầu vàng') || text.includes('hội an') || text.includes('săn mây') || text.includes('đà lạt') || text.includes('grand world') || text.includes('bà nà') || text.includes('làng hoa') || text.includes('gành đá đĩa') || text.includes('eo gió') || text.includes('kỳ co') || text.includes('vân sơn') || text.includes('trạm ký ức') || text.includes('fresh garden');
            if (i.includes('Du thuyền')) return text.includes('du thuyền') || text.includes('nho quế') || text.includes('tràng an') || text.includes('vịnh hạ long') || text.includes('cần thơ') || text.includes('sông hậu') || text.includes('thuyền');
            if (i.includes('Ẩm thực')) return text.includes('ẩm thực') || text.includes('chợ') || text.includes('đêm') || text.includes('lẩu') || text.includes('hải sản') || text.includes('miền tây') || text.includes('buffet') || text.includes('đặc sản') || text.includes('cơm cháy') || text.includes('gà lá é') || text.includes('ba toa');
            if (i.includes('Công viên')) return text.includes('vinwonders') || text.includes('safari') || text.includes('sun world') || text.includes('bà nà') || text.includes('núi bà đen') || text.includes('hòn thơm') || text.includes('cáp treo');
            return true;
        });
    };

    const checkCompanionMatch = (tour, companions) => {
        if (!companions || companions.length === 0) return true;
        const text = `${tour.tour_name} ${tour.description || ''} ${tour.destination || ''}`.toLowerCase();
        return companions.some(c => {
            if (c.includes('Đi một mình')) return tour.duration_days <= 4 || text.includes('sapa') || text.includes('hà giang') || text.includes('đà lạt') || text.includes('phú quý') || text.includes('tây ninh');
            if (c.includes('Cặp đôi')) return text.includes('đà lạt') || text.includes('phú quốc') || text.includes('du thuyền') || text.includes('quy nhơn') || text.includes('nha trang') || text.includes('hội an') || text.includes('hồ tràm');
            if (c.includes('Gia đình có trẻ nhỏ')) return text.includes('vinwonders') || text.includes('safari') || text.includes('grand world') || text.includes('cáp treo') || text.includes('biển') || text.includes('công viên') || tour.duration_days <= 4;
            if (c.includes('Gia đình người lớn tuổi')) return text.includes('chùa') || text.includes('nghỉ dưỡng') || text.includes('huế') || text.includes('miền tây') || text.includes('tam chúc') || text.includes('tràng an') || text.includes('tây ninh') || tour.duration_days <= 3;
            if (c.includes('Nhóm bạn trẻ')) return text.includes('săn mây') || text.includes('hà giang') || text.includes('kỳ co') || text.includes('eo gió') || text.includes('phú quý') || text.includes('sapa') || text.includes('đà lạt') || text.includes('tây nguyên');
            if (c.includes('Đoàn công ty')) return text.includes('teambuilding') || text.includes('du thuyền') || text.includes('đà nẵng') || text.includes('hạ long') || text.includes('phú quốc') || text.includes('nha trang');
            return true;
        });
    };

    const checkTransportMatch = (tour, transports) => {
        if (!transports || transports.length === 0) return true;
        const text = `${tour.tour_name} ${tour.description || ''} ${tour.destination || ''}`.toLowerCase();
        const price = Number(tour.base_price || 0);
        return transports.some(t => {
            if (t.includes('Máy bay')) return text.includes('máy bay') || text.includes('phú quốc') || text.includes('đà nẵng') || text.includes('xuyên việt') || text.includes('nha trang') || price >= 4000000;
            if (t.includes('Xe du lịch')) return text.includes('xe') || text.includes('limousine') || text.includes('giường nằm') || text.includes('đà lạt') || text.includes('sapa') || text.includes('hà giang') || text.includes('miền tây') || text.includes('tây ninh') || text.includes('hồ tràm') || tour.duration_days <= 4;
            if (t.includes('Du thuyền')) return text.includes('du thuyền') || text.includes('vịnh hạ long') || text.includes('nho quế') || text.includes('tràng an') || text.includes('cần thơ') || text.includes('thuyền');
            if (t.includes('Cáp treo')) return text.includes('cáp treo') || text.includes('fansipan') || text.includes('bà nà') || text.includes('núi bà đen') || text.includes('hòn thơm') || text.includes('sun world');
            return true;
        });
    };

    const checkDurationMatch = (tour, duration) => {
        if (!duration || duration === 'All') return true;
        const days = Number(tour.duration_days || 0);
        if (duration === '1D') return days === 1;
        if (duration === '2_3D') return days === 2 || days === 3;
        if (duration === '4_5D') return days === 4 || days === 5;
        if (duration === 'Long') return days > 5;
        return true;
    };

    const checkPriorityMatch = (tour, priorities) => {
        if (!priorities || priorities.length === 0) return true;
        const text = `${tour.tour_name} ${tour.description || ''}`.toLowerCase();
        const price = Number(tour.base_price || 0);
        return priorities.some(p => {
            if (p.includes('Giá ưu đãi')) return price <= 4000000;
            if (p.includes('Chất lượng cao')) return price >= 5000000 || text.includes('5 sao') || text.includes('cao cấp');
            if (p.includes('Lịch trình linh hoạt')) return tour.duration_days <= 4;
            if (p.includes('Khách sạn trung tâm')) return text.includes('trung tâm') || text.includes('phố') || text.includes('resort');
            if (p.includes('Trọn gói bữa ăn')) return text.includes('buffet') || text.includes('ẩm thực') || text.includes('lẩu') || text.includes('bữa ăn') || text.includes('hải sản');
            return true;
        });
    };

    const checkPaceMatch = (tour, pace) => {
        if (!pace || pace === 'All') return true;
        if (pace === 'Relaxed') return tour.duration_days <= 3 || tour.description?.toLowerCase().includes('nghỉ dưỡng');
        if (pace === 'Moderate') return tour.duration_days >= 3 && tour.duration_days <= 5;
        if (pace === 'Active') return tour.duration_days >= 4 || tour.tour_name?.toLowerCase().includes('chinh phục') || tour.tour_name?.toLowerCase().includes('xuyên việt');
        return true;
    };

    const checkAccommodationMatch = (tour, level) => {
        if (!level || level === 'All') return true;
        const price = Number(tour.base_price || 0);
        const text = `${tour.tour_name} ${tour.description || ''}`.toLowerCase();
        if (level === '3Star') return price <= 4500000;
        if (level === '4Star') return price >= 3500000 && price <= 8000000;
        if (level === '5Star') return price >= 6000000 || text.includes('5 sao') || text.includes('du thuyền') || text.includes('resort');
        if (level === 'Homestay') return text.includes('sapa') || text.includes('hà giang') || text.includes('đà lạt') || text.includes('bản');
        return true;
    };

    const calculateMatchScore = (tour, prefs) => {
        if (!prefs) return 90;
        let score = 75;

        if (prefs.destinations && prefs.destinations.length > 0) {
            const matchDest = prefs.destinations.some(d => tour.destination?.toLowerCase().includes(d.toLowerCase()) || tour.tour_name?.toLowerCase().includes(d.toLowerCase()));
            if (matchDest) score += 15;
        }

        if (prefs.budgetRange && prefs.budgetRange !== 'All') {
            const price = Number(tour.base_price || 0);
            if (prefs.budgetRange === 'Under3M' && price <= 3000000) score += 10;
            else if ((prefs.budgetRange === '3M_5M' || prefs.budgetRange === '3M_6M') && price >= 3000000 && price <= 5000000) score += 10;
            else if ((prefs.budgetRange === '5M_8M' || prefs.budgetRange === '6M_12M') && price >= 5000000 && price <= 8000000) score += 10;
            else if ((prefs.budgetRange === 'Above8M' || prefs.budgetRange === 'Above12M') && price >= 8000000) score += 10;
        }

        return Math.min(score, 99);
    };

    // Filter Tours
    const filteredTours = tours.filter(tour => {
        const currentSearch = preferences.searchTerm || searchLocation || '';

        const matchSearch = currentSearch === '' || 
            tour.destination?.toLowerCase().includes(currentSearch.toLowerCase()) ||
            tour.tour_name?.toLowerCase().includes(currentSearch.toLowerCase());

        const matchCat = selectedCategory === 'Tất cả' ||
            (selectedCategory === 'Nghỉ dưỡng' && checkPurposeMatch(tour, ['Nghỉ dưỡng'])) ||
            (selectedCategory === 'Khám phá' && checkPurposeMatch(tour, ['Khám phá thiên nhiên'])) ||
            (selectedCategory === 'Gia đình' && checkCompanionMatch(tour, ['Gia đình có trẻ nhỏ'])) ||
            (selectedCategory === 'Cặp đôi' && checkCompanionMatch(tour, ['Cặp đôi'])) ||
            (selectedCategory === 'Ẩm thực' && checkInterestMatch(tour, ['Ẩm thực'])) ||
            (selectedCategory === 'Trải nghiệm' && checkInterestMatch(tour, ['Chinh phục', 'Check-in'])) ||
            (selectedCategory === 'Team Building' && checkPurposeMatch(tour, ['Teambuilding']));

        let matchDestArr = true;
        if (preferences.destinations && preferences.destinations.length > 0) {
            matchDestArr = preferences.destinations.some(d => tour.destination?.toLowerCase().includes(d.toLowerCase()) || tour.tour_name?.toLowerCase().includes(d.toLowerCase()));
        }

        let matchDuration = checkDurationMatch(tour, preferences.duration);

        let matchBudget = true;
        if (preferences.budgetRange && preferences.budgetRange !== 'All') {
            const p = Number(tour.base_price || 0);
            if (preferences.budgetRange === 'Under3M') matchBudget = p <= 3000000;
            else if (preferences.budgetRange === '3M_5M' || preferences.budgetRange === '3M_6M') matchBudget = p >= 3000000 && p <= 5000000;
            else if (preferences.budgetRange === '5M_8M' || preferences.budgetRange === '6M_12M') matchBudget = p >= 5000000 && p <= 8000000;
            else if (preferences.budgetRange === 'Above8M' || preferences.budgetRange === 'Above12M') matchBudget = p >= 8000000;
        }

        const matchPurposes = checkPurposeMatch(tour, preferences.tripPurposes);
        const matchInterests = checkInterestMatch(tour, preferences.interests);
        const matchCompanions = checkCompanionMatch(tour, preferences.companions);
        const matchTransports = checkTransportMatch(tour, preferences.transportTypes);
        const matchPriorities = checkPriorityMatch(tour, preferences.keyPriorities);
        const matchPace = checkPaceMatch(tour, preferences.pace);
        const matchAccommodation = checkAccommodationMatch(tour, preferences.accommodationLevel);

        const matchPromoTab = !trendingTab.includes('Ưu đãi') || Number(tour.base_price || 0) <= 4500000;

        let matchRegion = true;
        if (selectedRegion !== 'Tất cả') {
            const mienBac = ['Hà Nội', 'Sapa', 'Hạ Long', 'Hà Giang', 'Ninh Bình', 'Cát Bà', 'Mộc Châu', 'Lào Cai'];
            const mienTrung = ['Đà Nẵng', 'Quy Nhơn', 'Phú Yên', 'Nha Trang', 'Huế', 'Hội An', 'Quảng Nam', 'Quảng Bình', 'Ninh Thuận', 'Bình Thuận', 'Bình Định'];
            const mienNam = ['Phú Quốc', 'Cần Thơ', 'Tây Ninh', 'Hồ Chí Minh', 'Vũng Tàu', 'Bến Tre', 'Sài Gòn', 'Cà Mau', 'Kiên Giang'];
            const tayNguyen = ['Đà Lạt', 'Tây Nguyên', 'Buôn Ma Thuột', 'Đắk Lắk', 'Pleiku'];
            
            const dest = tour.destination?.toLowerCase() || '';
            if (selectedRegion === 'Miền Bắc') {
                matchRegion = mienBac.some(d => dest.includes(d.toLowerCase()));
            } else if (selectedRegion === 'Miền Trung') {
                matchRegion = mienTrung.some(d => dest.includes(d.toLowerCase()));
            } else if (selectedRegion === 'Miền Nam') {
                matchRegion = mienNam.some(d => dest.includes(d.toLowerCase()));
            } else if (selectedRegion === 'Tây Nguyên') {
                matchRegion = tayNguyen.some(d => dest.includes(d.toLowerCase()));
            }
        }

        return matchSearch && matchCat && matchDestArr && matchDuration && matchBudget && 
               matchPurposes && matchInterests && matchCompanions && 
               matchTransports && matchPriorities && matchPace && matchAccommodation && matchPromoTab && matchRegion;
    }).map(tour => ({
        ...tour,
        _aiMatchScore: calculateMatchScore(tour, preferences)
    })).sort((a, b) => {
        if (trendingTab === 'Bán chạy') return (b.tour_id || 0) - (a.tour_id || 0);
        if (trendingTab === 'Giá tốt' || trendingTab.includes('Ưu đãi')) return Number(a.base_price || 0) - Number(b.base_price || 0);
        return b._aiMatchScore - a._aiMatchScore;
    });

    // Recommended Tours (Rule-Based)
    const recommendedTours = tours.slice().map(tour => ({
        ...tour,
        _aiMatchScore: calculateMatchScore(tour, preferences)
    })).sort((a, b) => b._aiMatchScore - a._aiMatchScore).slice(0, 6);

    // Compute Featured Destinations from DB tours dataset
    const featuredDestinations = React.useMemo(() => {
        const destMap = {};
        tours.forEach(tour => {
            const destName = tour.destination || 'Việt Nam';
            if (!destMap[destName]) {
                destMap[destName] = {
                    name: destName,
                    count: 0,
                    minPrice: Number(tour.base_price || 0),
                    image: tour.image_url
                };
            }
            destMap[destName].count += 1;
            if (Number(tour.base_price || 0) < destMap[destName].minPrice) {
                destMap[destName].minPrice = Number(tour.base_price || 0);
            }
        });
        return Object.values(destMap).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [tours]);

    // Promos
    const promoTours = tours.filter(t => Number(t.base_price || 0) <= 4500000).slice(0, 4);

    // Filtered Transport Services
    const filteredServices = services.filter(s => {
        return s.service_type === 'Transport' || s.service_type === 'Xe vận chuyển' || s.service_type === 'Xe du lịch';
    });

    
    const finalTransportServices = filteredServices.filter(s => {
        let matchSeat = true;
        let matchQuality = true;

        if (selectedSeat !== 'Tất cả') {
            const cap = Number(s.capacity) || 0;
            if (selectedSeat === '4-7 chỗ') matchSeat = cap >= 4 && cap <= 7;
            else if (selectedSeat === '16-29 chỗ') matchSeat = cap >= 16 && cap <= 29;
            else if (selectedSeat === '35-45 chỗ') matchSeat = cap >= 35 && cap <= 45;
        }

        if (selectedQuality !== 'Tất cả') {
            const nameLower = (s.service_name || '').toLowerCase();
            const descLower = (s.description || '').toLowerCase();
            const attrLower = (s.attributes || '').toLowerCase();
            const isVip = nameLower.includes('vip') || nameLower.includes('limousine') || nameLower.includes('cao cấp') || descLower.includes('vip') || attrLower.includes('vip');
            if (selectedQuality === 'Cao cấp (VIP/Limousine)') matchQuality = isVip;
            else if (selectedQuality === 'Tiêu chuẩn') matchQuality = !isVip;
        }

        return matchSeat && matchQuality;
    });

    const scrollSlider = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = 340;
            ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    const scrollToShowcase = () => {
        if (showcaseRef.current) {
            showcaseRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Hero Banner Slides
    const heroSlides = [
        {
            id: 1,
            image: 'https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=2000',
            badge: '🌟 VietTravel ERP — Thương Hiệu Du Lịch Hàng Đầu 2026',
            title: 'Hành Trình Trong Mơ, Kỷ Niệm Vô Giá',
            subtitle: 'Trải nghiệm tour du lịch trọn gói cao cấp, tự thiết kế lịch trình và nhận ưu đãi độc bản.'
        },
        {
            id: 2,
            image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000',
            badge: '🛳️ Nghỉ dưỡng du thuyền 5 sao thượng hạng',
            title: 'Vịnh Hạ Long — Kỳ Quan Thiên Nhiên Thế Giới',
            subtitle: 'Thưởng ngoạn cảnh sắc kỳ vĩ trên du thuyền 5 sao cùng dịch vụ ẩm thực đẳng cấp.'
        },
        {
            id: 3,
            image: 'https://images.unsplash.com/photo-1542314831-c6a4d14d8373?q=80&w=2000',
            badge: '🏔️ Chinh phục đỉnh núi Fansipan mờ sương',
            title: 'Sapa Nóc Nhà Đông Dương — Bản Sắc Vùng Cao',
            subtitle: 'Tận hưởng không khí vùng cao trong lành, bản làng thanh bình và những mùa hoa rực rỡ.'
        },
        {
            id: 4,
            image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2000',
            badge: '🎆 Di sản thế giới UNESCO Miền Trung',
            title: 'Đà Nẵng & Phố Cổ Hội An Lung Linh Về Đêm',
            subtitle: 'Đón bình minh bãi biển Mỹ Khê, dạo bước qua rặng đèn lồng cổ kính và những cây cầu biểu tượng.'
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHeroPaused, setIsHeroPaused] = useState(false);

    useEffect(() => {
        if (isHeroPaused) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5500);
        return () => clearInterval(timer);
    }, [isHeroPaused, heroSlides.length]);

    const handleApplyFloatingSearch = () => {
        setPreferences(prev => ({
            ...prev,
            searchTerm: searchLocation,
            departureDate: searchDate,
            budgetRange: searchBudget
        }));
        trackBehavior('SEARCH', null, { location: searchLocation, date: searchDate, budget: searchBudget });
        scrollToShowcase();
    };

    return (
        <div className="homepage-container" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* 1. HEADER (STICKY GLASSMORPHISM NAVBAR) */}
            <CustomerNavbar activeTab="home" />

            {/* 2. HERO BANNER KEN BURNS & FLOATING SEARCH BAR */}
            <div className="hero-wrapper" style={{ position: 'relative', marginBottom: '80px' }}>
                <header 
                    className="home-hero-slider"
                    onMouseEnter={() => setIsHeroPaused(true)}
                    onMouseLeave={() => setIsHeroPaused(false)}
                    style={{ position: 'relative', height: '490px', overflow: 'hidden' }}
                >
                    {heroSlides.map((slide, index) => {
                        const isActive = index === currentSlide;
                        return (
                            <div 
                                key={slide.id}
                                className={`hero-slide ${isActive ? 'active' : ''}`}
                                style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    opacity: isActive ? 1 : 0, transition: 'opacity 0.8s ease-in-out',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <div 
                                    className="hero-slide-bg"
                                    style={{
                                        backgroundImage: `url("${slide.image}")`,
                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                        width: '100%', height: '100%',
                                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'transform 6s ease-out'
                                    }}
                                />
                                <div className="hero-gradient-overlay" style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.75) 100%)'
                                }} />
                                
                                <div className="hero-content-box" style={{
                                    position: 'relative', zIndex: 10, textAlign: 'center', color: '#ffffff',
                                    maxWidth: '850px', padding: '0 20px', marginTop: '-40px'
                                }}>
                                    <span style={{
                                        background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)',
                                        color: '#ffffff', fontSize: '13px', fontWeight: '800', padding: '6px 16px',
                                        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)',
                                        display: 'inline-block', marginBottom: '16px'
                                    }}>
                                        {slide.badge}
                                    </span>
                                    <h1 style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: '1.25', marginBottom: '12px' }}>
                                        {slide.title}
                                    </h1>
                                    <p style={{ fontSize: '16px', color: '#e2e8f0', fontWeight: '500', maxWidth: '680px', margin: '0 auto' }}>
                                        {slide.subtitle}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {/* HERO SLIDER CONTROLS */}
                    <div style={{ position: 'absolute', top: '50%', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', transform: 'translateY(-50%)', zIndex: 15, pointerEvents: 'none' }}>
                        <button 
                            onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                            style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', width: '42px', height: '64px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        >❮</button>
                        <button 
                            onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                            style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', width: '42px', height: '64px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        >❯</button>
                    </div>

                    {/* SLIDE DOTS */}
                    <div style={{ position: 'absolute', bottom: '80px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 15 }}>
                        {heroSlides.map((_, idx) => (
                            <div 
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                style={{
                                    width: idx === currentSlide ? '28px' : '8px', height: '8px', borderRadius: '4px',
                                    background: idx === currentSlide ? '#0194f3' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer', transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </header>

                {/* 3. TRAVEL SEARCH (FLOATING BOX REDESIGN - NO OVERFLOW) */}
                <div style={{
                    position: 'absolute', bottom: '-45px', left: '50%', transform: 'translateX(-50%)',
                    width: '92%', maxWidth: '1140px', zIndex: 30, boxSizing: 'border-box'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '24px', padding: '20px 24px',
                        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(0,0,0,0.04)',
                        border: '1.5px solid #e2e8f0', boxSizing: 'border-box', overflow: 'hidden'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.1fr)',
                            gap: '14px',
                            alignItems: 'end',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            
                            {/* FIELD 1: ĐIỂM ĐẾN */}
                            <div style={{ minWidth: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                                    📍 Điểm đến / Từ khóa
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nhập Đà Nẵng, Phú Quốc..."
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFloatingSearch()}
                                    style={{ width: '100%', height: '46px', padding: '0 14px', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '700', color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* FIELD 2: NGÀY KHỞI HÀNH */}
                            <div style={{ minWidth: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                                    📅 Ngày khởi hành
                                </label>
                                <input
                                    type="date"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                    style={{ width: '100%', height: '46px', padding: '0 12px', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '700', color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* FIELD 3: NGÂN SÁCH */}
                            <div style={{ minWidth: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                                    💰 Mức giá Tour
                                </label>
                                <select
                                    value={searchBudget}
                                    onChange={(e) => setSearchBudget(e.target.value)}
                                    style={{ width: '100%', height: '46px', padding: '0 12px', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '700', color: '#0f172a', background: '#f8fafc', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                                >
                                    <option value="All">✨ Tất cả mức giá</option>
                                    <option value="Under3M">Dưới 3 triệu</option>
                                    <option value="3M_5M">Từ 3 - 5 triệu</option>
                                    <option value="5M_8M">Từ 5 - 8 triệu</option>
                                    <option value="Above8M">Trên 8 triệu</option>
                                </select>
                            </div>

                            {/* FIELD 4: TÌM KIẾM & BỘ LỌC NÂNG CAO BUTTONS */}
                            <div style={{ display: 'flex', gap: '8px', minWidth: 0 }}>
                                <button
                                    onClick={handleApplyFloatingSearch}
                                    style={{
                                        flex: 1, height: '46px', padding: '0 12px', borderRadius: '14px', border: 'none',
                                        background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)',
                                        color: '#ffffff', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(1, 148, 243, 0.35)', transition: 'all 0.2s ease',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        whiteSpace: 'nowrap', boxSizing: 'border-box'
                                    }}
                                >
                                    🔎 Tìm Tour
                                </button>
                                
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* 4. KHÁM PHÁ THEO NHU CẦU (CATEGORY CARDS) */}
            <section style={{ padding: '0 5%', marginBottom: '50px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        🌈 Khám Phá Tour Theo Nhu Cầu
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                        Lựa chọn loại hình du lịch yêu thích phù hợp nhất cho chuyến đi của bạn
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                    {[
                        { title: 'Nghỉ dưỡng', icon: '🏖️', color: '#0284c7', bg: '#f0f9ff' },
                        { title: 'Khám phá', icon: '🏔️', color: '#16a34a', bg: '#f0fdf4' },
                        { title: 'Gia đình', icon: '👨‍👩‍👧', color: '#ea580c', bg: '#fff7ed' },
                        { title: 'Cặp đôi', icon: '❤️', color: '#e11d48', bg: '#fff1f2' },
                        { title: 'Ẩm thực', icon: '🍜', color: '#d97706', bg: '#fffbeb' },
                        { title: 'Trải nghiệm', icon: '🏕️', color: '#9333ea', bg: '#faf5ff' },
                        { title: 'Team Building', icon: '🏢', color: '#2563eb', bg: '#eff6ff' }
                    ].map((cat, idx) => {
                        const isSelected = selectedCategory === cat.title;
                        return (
                            <div 
                                key={idx}
                                onClick={() => {
                                    setSelectedCategory(isSelected ? 'Tất cả' : cat.title);
                                    scrollToShowcase();
                                }}
                                style={{
                                    background: isSelected ? cat.color : cat.bg,
                                    color: isSelected ? '#ffffff' : '#1e293b',
                                    borderRadius: '18px', padding: '16px 12px', textCenter: 'center',
                                    textAlign: 'center', cursor: 'pointer', border: `1.5px solid ${isSelected ? cat.color : '#e2e8f0'}`,
                                    boxShadow: isSelected ? `0 10px 20px ${cat.color}33` : '0 4px 12px rgba(0,0,0,0.03)',
                                    transition: 'all 0.25s ease', transform: isSelected ? 'translateY(-4px)' : 'none'
                                }}
                            >
                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{cat.icon}</div>
                                <div style={{ fontSize: '13px', fontWeight: '800' }}>{cat.title}</div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 5. ĐIỂM ĐẾN NỔI BẬT (FEATURED DESTINATIONS REDESIGN) */}
            <section style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 100%)', border: '1px solid #e0f2fe', margin: '0 5% 60px 5%', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 12px 40px rgba(2, 132, 199, 0.05)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '24px' }}>📍</span>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                                Điểm Đến Thịnh Hành & Nổi Bật
                            </h2>
                            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: '12px', fontWeight: '800' }}>
                                HOT 2026
                            </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', margin: 0 }}>
                            Khám phá các điểm đến được săn đón và đánh giá cao nhất bởi cộng đồng du khách VietTravel
                        </p>
                    </div>

                    <button
                            onClick={() => navigate('/tours')}
                            style={{
                                background: '#ffffff', color: '#1d4ed8', border: '1.5px solid #e2e8f0', padding: '5px 5px 5px 18px', borderRadius: '30px',
                                fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'all 0.2s ease', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                        >
                            Xem thêm
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1d4ed8', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronRight size={16} strokeWidth={3} />
                            </div>
                        </button>
                </div>

                {/* DESTINATION CARDS SLIDER */}
                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => { const slider = document.getElementById('dest-slider'); if(slider) slider.scrollBy({ left: -320, behavior: 'smooth' }); }}
                        style={{
                            position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button 
                        onClick={() => { const slider = document.getElementById('dest-slider'); if(slider) slider.scrollBy({ left: 320, behavior: 'smooth' }); }}
                        style={{
                            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div 
                        id="dest-slider"
                        style={{
                            display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                            gap: '20px', paddingBottom: '10px'
                        }}
                        className="hide-scrollbar"
                    >
                        {featuredDestinations.map((dest, i) => {
                            const isTop = i === 0 || i === 1;
                            return (
                                <div 
                                    key={i}
                                    onClick={() => {
                                        setPreferences(prev => ({ ...prev, destinations: [dest.name] }));
                                        scrollToShowcase();
                                    }}
                                    style={{
                                        position: 'relative',
                                        minWidth: 'calc(25% - 15px)', maxWidth: 'calc(25% - 15px)', flex: '0 0 auto', scrollSnapAlign: 'start',
                                        height: '240px',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                                        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    className="destination-card-hover"
                                >
                                    {/* Background Image */}
                                    <div 
                                        style={{
                                            backgroundImage: `url(${getImageUrl(dest.image)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            width: '100%',
                                            height: '100%',
                                            transition: 'transform 0.6s ease'
                                        }}
                                    />

                                    {/* Subtle Overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, width: '100%', height: '100%',
                                        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, rgba(15, 23, 42, 0.88) 100%)'
                                    }} />

                                    {/* Top Badges */}
                                    <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {isTop ? (
                                            <span style={{ fontSize: '11px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}>
                                                🔥 TOP {i + 1} THỊNH HÀNH
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '11px', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                                                📍 Điểm Đến HOT
                                            </span>
                                        )}

                                        <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(8px)', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' }}>
                                            {dest.count} Tour
                                        </span>
                                    </div>

                                    {/* Bottom Info Box */}
                                    <div style={{ position: 'absolute', bottom: '18px', left: '20px', right: '20px', color: '#ffffff' }}>
                                        <h3 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.3px', color: '#ffffff' }}>
                                            {dest.name}
                                        </h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>
                                                Giá từ <strong style={{ color: '#38bdf8', fontSize: '15px', fontWeight: '800' }}>{formatCurrency(dest.minPrice)}</strong>
                                            </span>
                                            <span style={{
                                                fontSize: '12px', fontWeight: '800', color: '#0194f3', background: '#ffffff',
                                                padding: '5px 12px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                                transition: 'all 0.2s'
                                            }}>
                                                Khám phá ➡️
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* 6. ƯU ĐÃI ĐẶC BIỆT (PROMOTIONS SLIDER) */}
            <section style={{ background: 'linear-gradient(145deg, #ffffff 0%, #fff1f2 100%)', border: '1px solid #ffe4e6', margin: '0 5% 60px 5%', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 12px 40px rgba(225, 29, 72, 0.05)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', margin: 0 }}>
                            💯 Ưu Đãi Đặc Biệt
                        </h2>
                        <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                            Các chuyến đi đang được giảm giá tốt nhất
                        </p>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => scrollSlider(discountSliderRef, 'left')}
                        style={{
                            position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button 
                        onClick={() => scrollSlider(discountSliderRef, 'right')}
                        style={{
                            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div 
                        ref={discountSliderRef}
                        style={{
                            display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                            gap: '20px', paddingBottom: '20px'
                        }}
                        className="hide-scrollbar"
                    >
                        {loadingTours ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} style={{ minWidth: '300px', background: '#ffffff', borderRadius: '20px', height: '320px', border: '1px solid #e2e8f0', padding: '16px', flex: '0 0 auto' }} />
                            ))
                        ) : promoTours.map(tour => {
                            let img = null;
                            try {
                                img = tour.images ? JSON.parse(tour.images)[0] : null;
                            } catch (e) {
                                img = tour.images;
                            }
                            const oldPrice = Number(tour.base_price || 0) * 1.25; // fake 20% discount
                            return (
                                <div 
                                    key={tour.tour_id}
                                    onClick={() => {
                                        trackBehavior('CLICK_TOUR', tour.tour_id, { tour_name: tour.tour_name });
                                        navigate(`/tour/${tour.tour_id}`);
                                    }}
                                    style={{
                                        minWidth: 'calc(25% - 15px)', maxWidth: 'calc(25% - 15px)', flex: '0 0 auto', scrollSnapAlign: 'start', height: '380px',
                                        background: '#fff0f2', borderRadius: '20px', border: '1.5px solid #fecdd3',
                                        overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 25px rgba(225, 29, 72, 0.05)',
                                        transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column'
                                    }}
                                    className="tour-card-modern"
                                >
                                    <div style={{ position: 'relative', height: '170px' }}>
                                        <div style={{ backgroundImage: `url(${getImageUrl(tour.image_url || img)})`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }} />
                                        <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: '900', padding: '6px 10px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)' }}>
                                            -20%
                                        </span>
                                        <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px' }}>
                                            ⏱️ {tour.duration_days} Ngày
                                        </span>
                                    </div>

                                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                            <span style={{ color: '#0284c7', fontWeight: '700' }}>📍 {tour.destination}</span>
                                            <span style={{ fontWeight: '700', color: '#f59e0b' }}>⭐ 4.9 (128)</span>
                                        </div>

                                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4', margin: '0 0 14px 0', height: '64px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                            {tour.tour_name}
                                        </h3>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fecdd3', paddingTop: '12px', marginTop: 'auto' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', display: 'block' }}>
                                                    {formatCurrency(oldPrice)}
                                                </span>
                                                <strong style={{ fontSize: '16px', color: '#ef4444' }}>{formatCurrency(tour.base_price)}</strong>
                                            </div>
                                            <button style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                                                Mua Ngay ➔
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* 7. MAIN CONTENT: TOUR TRỌN GÓI */}
            <section ref={showcaseRef} style={{ background: 'linear-gradient(145deg, #ffffff 0%, #eef2ff 100%)', border: '1px solid #e0e7ff', margin: '0 5% 60px 5%', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 12px 40px rgba(79, 70, 229, 0.05)', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                🌍 Tour Trọn Gói
                            </h2>
                            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                                Các chuyến đi trọn gói tốt nhất hiện nay
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/tours')}
                            style={{
                                background: '#ffffff', color: '#1d4ed8', border: '1.5px solid #e2e8f0', padding: '5px 5px 5px 18px', borderRadius: '30px',
                                fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'all 0.2s ease', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                        >
                            Xem thêm
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1d4ed8', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronRight size={16} strokeWidth={3} />
                            </div>
                        </button>
                    </div>

                    {/* FILTER TABS */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        
                        {/* REGION FILTER */}
                        <div style={{ display: 'flex', gap: '6px', background: '#e0f2fe', padding: '4px', borderRadius: '14px' }}>
                            {['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Tây Nguyên'].map(region => (
                                <button 
                                    key={region}
                                    onClick={() => setSelectedRegion(region)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                                        background: selectedRegion === region ? '#0284c7' : 'transparent',
                                        color: selectedRegion === region ? '#ffffff' : '#0369a1',
                                        fontWeight: selectedRegion === region ? '800' : '600', fontSize: '13px',
                                        cursor: 'pointer', boxShadow: selectedRegion === region ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>

                        {/* TAB SORTING */}
                        <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '14px' }}>
                            {['Tất cả', 'Ưu đãi đặc quyền', 'Bán chạy', 'Giá tốt'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setTrendingTab(tab)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                                        background: trendingTab === tab ? '#ffffff' : 'transparent',
                                        color: trendingTab === tab ? (tab === 'Ưu đãi đặc quyền' ? '#0284c7' : '#0f172a') : '#64748b',
                                        fontWeight: trendingTab === tab ? '800' : '600', fontSize: '13px',
                                        cursor: 'pointer', boxShadow: trendingTab === tab ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TOUR SLIDER CONTAINER */}
                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => scrollSlider(tourSliderRef, 'left')}
                        style={{
                            position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button 
                        onClick={() => scrollSlider(tourSliderRef, 'right')}
                        style={{
                            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div 
                        ref={tourSliderRef}
                        style={{
                            display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                            gap: '20px', paddingBottom: '20px'
                        }}
                        className="hide-scrollbar"
                    >
                        {loadingTours ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} style={{ minWidth: '300px', background: '#ffffff', borderRadius: '20px', height: '320px', border: '1px solid #e2e8f0', padding: '16px', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                                    <div style={{ background: '#e2e8f0', height: '160px', borderRadius: '14px', marginBottom: '14px' }} />
                                    <div style={{ background: '#e2e8f0', height: '18px', width: '60%', borderRadius: '6px', marginBottom: '8px' }} />
                                    <div style={{ background: '#e2e8f0', height: '24px', width: '90%', borderRadius: '6px' }} />
                                </div>
                            ))
                        ) : filteredTours.length === 0 ? (
                            <div style={{ minWidth: '100%', background: '#ffffff', borderRadius: '24px', padding: '50px 20px', textAlign: 'center', border: '1.5px solid #e2e8f0', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                                <div style={{ fontSize: '50px', marginBottom: '12px' }}>🔍</div>
                                <h3 style={{ fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>Không tìm thấy tour phù hợp</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '500px', margin: '8px auto 20px auto' }}>
                                    Không có chuyến đi nào thỏa mãn toàn bộ tiêu chí lọc hiện tại.
                                </p>
                            </div>
                        ) : (
                            filteredTours.map(tour => {
                                let img = null;
                                try {
                                    img = tour.images ? JSON.parse(tour.images)[0] : null;
                                } catch (e) {
                                    img = tour.images;
                                }
                                return (
                                    <div 
                                        key={tour.tour_id}
                                        onClick={() => {
                                            trackBehavior('CLICK_TOUR', tour.tour_id, { tour_name: tour.tour_name });
                                            navigate(`/tour/${tour.tour_id}`);
                                        }}
                                        style={{
                                            minWidth: 'calc(25% - 15px)', maxWidth: 'calc(25% - 15px)', flex: '0 0 auto', scrollSnapAlign: 'start', height: '380px',
                                            background: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0',
                                            overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
                                            transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column'
                                        }}
                                        className="tour-card-modern"
                                    >
                                        <div style={{ position: 'relative', height: '170px' }}>
                                            <div style={{ backgroundImage: `url(${getImageUrl(tour.image_url || img)})`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }} />
                                            {Number(tour.base_price || 0) <= 4000000 && (
                                                <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px' }}>
                                                    🔥 Giá Cực Tốt
                                                </span>
                                            )}
                                            <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px' }}>
                                                ⏱️ {tour.duration_days} Ngày
                                            </span>
                                        </div>

                                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                                <span style={{ color: '#0284c7', fontWeight: '700' }}>📍 {tour.destination}</span>
                                                <span style={{ fontWeight: '700', color: '#f59e0b' }}>⭐ 4.9 (128)</span>
                                            </div>

                                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4', margin: '0 0 14px 0', height: '64px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                                {tour.tour_name}
                                            </h3>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Giá từ</span>
                                                    <strong style={{ fontSize: '16px', color: '#ef4444' }}>{formatCurrency(tour.base_price)}</strong>
                                                </div>
                                                <button style={{ padding: '8px 16px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                                                    Khám phá ➔
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>


            {/* 8. DỊCH VỤ DO CÔNG TY CUNG CẤP */}
            <section style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)', border: '1px solid #dcfce7', margin: '0 5% 60px 5%', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 12px 40px rgba(22, 163, 74, 0.05)', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                🚗 Dịch Vụ Xe Di Chuyển
                            </h2>
                            <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                                Các dịch vụ thuê xe du lịch và vận chuyển chất lượng cao
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/services')}
                            style={{
                                background: '#ffffff', color: '#1d4ed8', border: '1.5px solid #e2e8f0', padding: '5px 5px 5px 18px', borderRadius: '30px',
                                fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'all 0.2s ease', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                        >
                            Xem thêm
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1d4ed8', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronRight size={16} strokeWidth={3} />
                            </div>
                        </button>
                    </div>

                    {/* FILTER TABS CHO DỊCH VỤ XE */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* SEAT FILTER */}
                        <div style={{ display: 'flex', gap: '6px', background: '#dcfce7', padding: '4px', borderRadius: '14px' }}>
                            {['Tất cả', '4-7 chỗ', '16-29 chỗ', '35-45 chỗ'].map(seat => (
                                <button 
                                    key={seat}
                                    onClick={() => setSelectedSeat(seat)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                                        background: selectedSeat === seat ? '#16a34a' : 'transparent',
                                        color: selectedSeat === seat ? '#ffffff' : '#15803d',
                                        fontWeight: selectedSeat === seat ? '800' : '600', fontSize: '13px',
                                        cursor: 'pointer', boxShadow: selectedSeat === seat ? '0 2px 6px rgba(22, 163, 74, 0.3)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {seat}
                                </button>
                            ))}
                        </div>

                        {/* QUALITY FILTER */}
                        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '14px' }}>
                            {['Tất cả', 'Tiêu chuẩn', 'Cao cấp (VIP/Limousine)'].map(quality => (
                                <button 
                                    key={quality}
                                    onClick={() => setSelectedQuality(quality)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '10px', border: 'none',
                                        background: selectedQuality === quality ? '#ffffff' : 'transparent',
                                        color: selectedQuality === quality ? '#16a34a' : '#64748b',
                                        fontWeight: selectedQuality === quality ? '800' : '600', fontSize: '13px',
                                        cursor: 'pointer', boxShadow: selectedQuality === quality ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {quality}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <button 
                        onClick={() => scrollSlider(serviceSliderRef, 'left')}
                        style={{
                            position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button 
                        onClick={() => scrollSlider(serviceSliderRef, 'right')}
                        style={{
                            position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: 'rgba(51, 65, 85, 0.7)', backdropFilter: 'blur(4px)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div 
                        ref={serviceSliderRef}
                        style={{
                            display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
                            gap: '20px', paddingBottom: '20px'
                        }}
                        className="hide-scrollbar"
                    >
                        {loadingServices ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} style={{ minWidth: 'calc(25% - 15px)', maxWidth: 'calc(25% - 15px)', background: '#ffffff', borderRadius: '20px', height: '380px', border: '1px solid #e2e8f0', padding: '16px', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                                    <div style={{ background: '#e2e8f0', height: '170px', borderRadius: '14px', marginBottom: '14px' }} />
                                </div>
                            ))
                        ) : finalTransportServices.length === 0 ? (
                            <div style={{ minWidth: '100%', background: '#ffffff', borderRadius: '24px', padding: '50px 20px', textAlign: 'center', border: '1.5px solid #e2e8f0', flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                                <div style={{ fontSize: '50px', marginBottom: '12px' }}>🛠️</div>
                                <h3 style={{ fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>Không tìm thấy dịch vụ</h3>
                            </div>
                        ) : (
                            finalTransportServices.slice(0, 10).map((service, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => navigate('/services')}
                                    style={{
                                        minWidth: 'calc(25% - 15px)', maxWidth: 'calc(25% - 15px)', flex: '0 0 auto', scrollSnapAlign: 'start', height: '380px',
                                        background: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0',
                                        overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
                                        transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column'
                                    }}
                                    className="tour-card-modern"
                                >
                                    <div style={{ position: 'relative', height: '170px' }}>
                                        <div style={{ backgroundImage: `url(${getImageUrl(service.image_url)})`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }} />
                                        <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#38bdf8', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px' }}>
                                            {service.service_type || 'Dịch vụ'}
                                        </span>
                                    </div>

                                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                            <span style={{ color: '#0284c7', fontWeight: '700' }}>⭐ Dịch Vụ Nổi Bật</span>
                                        </div>

                                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4', margin: '0 0 14px 0', height: '64px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                            {service.service_name}
                                        </h3>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Giá từ</span>
                                                <strong style={{ fontSize: '16px', color: '#ef4444' }}>{formatCurrency(service.selling_price || service.base_cost || 0)}</strong>
                                            </div>
                                            <button style={{ padding: '8px 16px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                                                Chi tiết ➔
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>


            {/* 9. SECTION TỰ THIẾT KẾ TOUR BANNER (BALANCED 2-COLUMN DESIGN) */}
            <section style={{ padding: '0 5%', marginBottom: '60px' }}>
                <div style={{
                    position: 'relative', borderRadius: '28px', overflow: 'hidden', padding: '48px 44px',
                    backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.85) 50%, rgba(3, 105, 161, 0.8) 100%), url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000")',
                    backgroundSize: 'cover', backgroundPosition: 'center', color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 25px 50px rgba(15, 23, 42, 0.18)',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center'
                }}>
                    {/* LEFT COLUMN: TITLE & CTA */}
                    <div>
                        <span style={{
                            background: 'rgba(2, 132, 199, 0.3)', backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8',
                            fontSize: '12px', fontWeight: '800', padding: '6px 14px', borderRadius: '20px',
                            display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px'
                        }}>
                            ✨ DỊCH VỤ ĐỘC BẢN VIETTRAVEL
                        </span>
                        
                        <h2 style={{ fontSize: '32px', fontWeight: '900', lineHeight: '1.25', marginBottom: '14px', letterSpacing: '-0.5px' }}>
                            Tự Thiết Kế Hành Trình Theo Phong Cách Của Bạn
                        </h2>

                        <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '22px', maxWidth: '520px' }}>
                            Tùy chọn từng khách sạn 3★ - 5★, phương tiện xe riêng/máy bay, các điểm tham quan yêu thích và thực đơn đặc sản phù hợp ngân sách cá nhân.
                        </p>

                        {/* FEATURE PILLS */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
                            <span style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>
                                🏨 Khách sạn 3★ - 5★
                            </span>
                            <span style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>
                                🚗 Xe riêng & Máy bay
                            </span>
                            <span style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>
                                ⚡ Báo giá tự động
                            </span>
                        </div>

                        <button
                            onClick={() => {
                                if (!user) {
                                    alert('Vui lòng đăng nhập để sử dụng tính năng Tự thiết kế Tour!');
                                    navigate('/login');
                                } else {
                                    navigate('/build-tour');
                                }
                            }}
                            style={{
                                padding: '14px 32px', borderRadius: '16px', border: 'none',
                                background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)',
                                color: '#ffffff', fontWeight: '800', fontSize: '15px', cursor: 'pointer',
                                boxShadow: '0 8px 25px rgba(1, 148, 243, 0.45)', transition: 'all 0.25s ease',
                                display: 'inline-flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            🎨 Bắt đầu thiết kế Tour ngay ➔
                        </button>
                    </div>

                    {/* RIGHT COLUMN: VISUAL GLASSMORPHIC PREVIEW WIDGET */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(16px)',
                        borderRadius: '24px', padding: '24px 28px', border: '1px solid rgba(255, 255, 255, 0.22)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', gap: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>⚙️</span>
                                <strong style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>Lịch Trình Tự Chọn Của Bạn</strong>
                            </div>
                            <span style={{ background: '#22c55e', color: '#ffffff', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '10px' }}>
                                Trực Tuyến
                            </span>
                        </div>

                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', fontWeight: '700' }}>BƯỚC 1: ĐIỂM ĐẾN & NGÀY ĐI</span>
                            <strong style={{ fontSize: '14.5px', color: '#38bdf8', marginTop: '2px', display: 'block' }}>📍 Phú Quốc • 3 Ngày 2 Đêm</strong>
                        </div>

                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', fontWeight: '700' }}>BƯỚC 2: KHÁCH SẠN & DỊCH VỤ</span>
                            <strong style={{ fontSize: '14.5px', color: '#38bdf8', marginTop: '2px', display: 'block' }}>🏨 Resort 5★ Sun World • 🚗 Xe Riêng VIP</strong>
                        </div>

                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', fontWeight: '700' }}>BƯỚC 3: DỰ TOÁN NGUYÊN NGÂN SÁCH</span>
                            <strong style={{ fontSize: '15px', color: '#4ade80', marginTop: '2px', display: 'block' }}>💰 Tính toán tự động theo yêu cầu</strong>
                        </div>

                        <div style={{ fontSize: '12px', color: '#cbd5e1', textAlign: 'center', fontStyle: 'italic', marginTop: '4px' }}>
                            ✨ Nhận ngay bảng báo giá chi tiết trong 2 phút!
                        </div>
                    </div>
                </div>
            </section>

            {/* 10. FOOTER */}
            <CustomerFooter />

        </div>
    );
};

export default HomePage;