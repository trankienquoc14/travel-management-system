import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    SlidersHorizontal,
    MapPin,
    Clock,
    Star,
    Calendar,
    ArrowRight,
    RotateCcw,
    Compass,
    Sparkles,
    Award,
    X
} from 'lucide-react';
import TravelPreferenceFilter, { trackBehavior } from './TravelPreferenceFilter';
import TravelPreferenceSidebar from './TravelPreferenceSidebar';
import '../index.css';

const TourListPage = () => {
    const [user, setUser] = useState(null);
    const [tours, setTours] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingTours, setLoadingTours] = useState(true);
    const [loadingServices, setLoadingServices] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [trendingTab, setTrendingTab] = useState('Tất cả');
    const [showSidebar, setShowSidebar] = useState(true);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    // Floating Travel Search Inputs
    const [searchLocation, setSearchLocation] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [searchGuests, setSearchGuests] = useState('All');

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
    const serviceSliderRef = useRef(null);
    const showcaseRef = useRef(null);
    const destSliderRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchQ = params.get('search');
        if (searchQ) {
            setSearchLocation(searchQ);
            setPreferences(prev => ({ ...prev, searchTerm: searchQ }));
        }
    }, [location.search]);

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
        if (!url) return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
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

        return matchSearch && matchCat && matchDestArr && matchDuration && matchBudget && 
               matchPurposes && matchInterests && matchCompanions && 
               matchTransports && matchPriorities && matchPace && matchAccommodation && matchPromoTab;
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
        let companionFilter = [];
        if (searchGuests === '1') companionFilter = ['Đi một mình'];
        else if (searchGuests === '2') companionFilter = ['Cặp đôi'];
        else if (searchGuests === '4') companionFilter = ['Gia đình có trẻ nhỏ'];
        else if (searchGuests === '8') companionFilter = ['Đoàn công ty', 'Nhóm bạn trẻ'];

        setPreferences(prev => ({
            ...prev,
            searchTerm: searchLocation,
            departureDate: searchDate,
            companions: companionFilter
        }));
        trackBehavior('SEARCH', null, { location: searchLocation, date: searchDate, guests: searchGuests });
        scrollToShowcase();
    };

    const handleResetFilters = () => {
        setPreferences({
            destinations: [], duration: 'All', tripPurposes: [], companions: [], budgetRange: 'All',
            interests: [], pace: 'All', accommodationLevel: 'All', transportTypes: [],
            keyPriorities: [], searchTerm: '', departureDate: ''
        });
        setSearchLocation('');
        setSearchDate('');
        setSearchGuests('All');
        setSelectedCategory('Tất cả');
        setTrendingTab('Tất cả');
    };

    return (
        <div className="tt-page">
            {/* 1. HEADER */}
            <CustomerNavbar activeTab="explore" />

            {/* 2. PAGE HEADER BANNER + INLINE SEARCH */}
            <div style={{
                padding: '54px 24px 64px 24px',
                background: 'linear-gradient(135deg, rgba(16, 42, 67, 0.84) 0%, rgba(22, 139, 235, 0.72) 100%), url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000) center/cover no-repeat',
                marginBottom: '36px'
            }}>
                <div className="tt-container" style={{ textAlign: 'center', color: '#ffffff' }}>
                    <span style={{
                        background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)',
                        padding: '6px 14px', borderRadius: '999px', fontSize: '12.5px', fontWeight: '700',
                        display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px',
                        border: '1px solid rgba(255,255,255,0.28)'
                    }}>
                        <Compass size={14} color="#FF9852" /> Khám phá hành trình TravelVN ERP
                    </span>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-0.5px', color: '#ffffff' }}>
                        Khám Phá Tất Cả Tour Du Lịch
                    </h1>
                    <p style={{ fontSize: '15.5px', color: '#D9E2EC', margin: '0 auto 26px auto', maxWidth: '620px' }}>
                        Tìm kiếm và lọc nhanh theo điểm đến, thời lượng, ngân sách và sở thích của bạn.
                    </p>

                    {/* INLINE SEARCH BAR */}
                    <div style={{ maxWidth: '720px', margin: '0 auto', background: '#ffffff', borderRadius: '14px', padding: '8px', display: 'flex', gap: '8px', boxShadow: '0 16px 36px rgba(16, 42, 67, 0.22)' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '10px' }}>
                            <Search size={18} color="#829AB1" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên tour, điểm đến (Đà Nẵng, Phú Quốc, Sapa...)"
                                value={searchLocation}
                                onChange={(e) => {
                                    setSearchLocation(e.target.value);
                                    setPreferences(prev => ({ ...prev, searchTerm: e.target.value }));
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFloatingSearch()}
                                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#102A43', fontWeight: '600' }}
                            />
                            {searchLocation && (
                                <button
                                    onClick={() => { setSearchLocation(''); setPreferences(prev => ({ ...prev, searchTerm: '' })); }}
                                    style={{ border: 'none', background: 'transparent', color: '#829AB1', cursor: 'pointer', padding: '4px' }}
                                    aria-label="Xóa tìm kiếm"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button onClick={handleApplyFloatingSearch} className="tt-btn tt-btn-primary" style={{ borderRadius: '10px', padding: '10px 20px' }}>
                            Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>

            <section ref={showcaseRef} className="tt-container" style={{ marginBottom: '56px' }}>
                {/* MOBILE FILTER BAR TOGGLE */}
                <div className="tt-mobile-only" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '10px' }}>
                    <button
                        onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                        className="tt-btn tt-btn-outline"
                        style={{ flex: 1 }}
                    >
                        <SlidersHorizontal size={16} />
                        {mobileFilterOpen ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'}
                    </button>
                    <button onClick={handleResetFilters} className="tt-btn tt-btn-ghost">
                        <RotateCcw size={15} /> Đặt lại
                    </button>
                </div>

                {/* MOBILE COLLAPSIBLE FILTER */}
                {mobileFilterOpen && (
                    <div className="tt-mobile-only" style={{ marginBottom: '20px', width: '100%' }}>
                        <div style={{ width: '100%' }}>
                            <TravelPreferenceSidebar
                                preferences={preferences}
                                onPreferenceChange={(newPrefs) => setPreferences(newPrefs)}
                            />
                        </div>
                    </div>
                )}

                <div className="tour-list-layout-grid" style={{ display: 'grid', gridTemplateColumns: showSidebar ? 'minmax(260px, 290px) 1fr' : '1fr', gap: '28px', alignItems: 'start' }}>
                    {/* LEFT STICKY SIDEBAR FILTER (DESKTOP) */}
                    {showSidebar && (
                        <div className="tt-desktop-only" style={{ display: 'block' }}>
                            <TravelPreferenceSidebar
                                preferences={preferences}
                                onPreferenceChange={(newPrefs) => setPreferences(newPrefs)}
                            />
                        </div>
                    )}

                    {/* MAIN TOURS DISPLAY */}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h2 className="tt-section-title" style={{ fontSize: '22px' }}>
                                    Danh sách Tour Trọn Gói
                                </h2>
                                <p className="tt-section-subtitle">
                                    Hiển thị <strong>{filteredTours.length}</strong> chuyến đi phù hợp
                                </p>
                            </div>

                            {/* TAB SORTING */}
                            <div style={{ display: 'flex', gap: '6px', background: '#ffffff', padding: '5px', borderRadius: '12px', border: '1px solid #D9E2EC', flexWrap: 'wrap' }}>
                                {['Tất cả', 'Ưu đãi đặc quyền', 'Bán chạy', 'Giá tốt'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setTrendingTab(tab)}
                                        style={{
                                            padding: '7px 14px', borderRadius: '8px', border: 'none',
                                            background: trendingTab === tab ? '#168BEB' : 'transparent',
                                            color: trendingTab === tab ? '#ffffff' : '#486581',
                                            fontWeight: trendingTab === tab ? '700' : '600', fontSize: '13px',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TOUR GRID */}
                        {loadingTours ? (
                            <div className="tt-tour-grid">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="tt-tour-card" style={{ padding: '16px', gap: '12px' }}>
                                        <div className="tt-skeleton" style={{ height: '165px' }} />
                                        <div className="tt-skeleton" style={{ height: '16px', width: '55%' }} />
                                        <div className="tt-skeleton" style={{ height: '22px', width: '92%' }} />
                                        <div className="tt-skeleton" style={{ height: '32px', width: '100%', marginTop: '8px' }} />
                                    </div>
                                ))}
                            </div>
                        ) : tours.length === 0 ? (
                            <div className="tt-empty-state">
                                <div className="tt-empty-icon"><Compass size={28} /></div>
                                <h3 style={{ fontSize: '18px', color: '#102A43', fontWeight: '800', margin: 0 }}>Hiện chưa có tour nào được mở bán</h3>
                                <p style={{ fontSize: '14px', color: '#486581', maxWidth: '460px', margin: 0 }}>
                                    Hệ thống đang cập nhật lịch khởi hành mới. Bạn có thể tự thiết kế lịch trình riêng theo yêu cầu.
                                </p>
                                <button onClick={() => navigate('/build-tour')} className="tt-btn tt-btn-primary" style={{ marginTop: '6px' }}>
                                    <Sparkles size={16} /> Tự thiết kế Tour ngay
                                </button>
                            </div>
                        ) : filteredTours.length === 0 ? (
                            <div className="tt-empty-state">
                                <div className="tt-empty-icon"><Search size={28} /></div>
                                <h3 style={{ fontSize: '18px', color: '#102A43', fontWeight: '800', margin: 0 }}>Không tìm thấy tour phù hợp</h3>
                                <p style={{ fontSize: '14px', color: '#486581', maxWidth: '480px', margin: 0 }}>
                                    Không có chuyến đi nào thỏa mãn toàn bộ tiêu chí lọc hiện tại. Vui lòng đặt lại bộ lọc để xem thêm lựa chọn.
                                </p>
                                <button onClick={handleResetFilters} className="tt-btn tt-btn-primary" style={{ marginTop: '6px' }}>
                                    <RotateCcw size={16} /> Đặt lại tất cả bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="tt-tour-grid">
                                {filteredTours.map(tour => {
                                    const reviewCount = Number(tour.review_count || 0);
                                    const avgRating = tour.average_rating ? Number(tour.average_rating).toFixed(1) : null;
                                    const nextDep = tour.next_departure_date || tour.departure_date || null;

                                    return (
                                        <div
                                            key={tour.tour_id}
                                            onClick={() => {
                                                trackBehavior('CLICK_TOUR', tour.tour_id, { tour_name: tour.tour_name });
                                                navigate(`/tour/${tour.tour_id}`);
                                            }}
                                            className="tt-tour-card"
                                        >
                                            <div className="tt-tour-card-media">
                                                <div
                                                    className="tt-tour-card-img"
                                                    style={{ backgroundImage: `url(${getImageUrl(tour.image_url)})` }}
                                                />
                                                {Number(tour.base_price || 0) <= 4000000 && (
                                                    <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#FF9852', color: '#ffffff', fontSize: '11.5px', fontWeight: '800', padding: '4px 10px', borderRadius: '999px' }}>
                                                        Giá tốt
                                                    </span>
                                                )}
                                                <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(16, 42, 67, 0.8)', backdropFilter: 'blur(6px)', color: '#ffffff', fontSize: '11.5px', fontWeight: '700', padding: '5px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                    <Clock size={13} /> {tour.duration_days} Ngày {Math.max(0, Number(tour.duration_days || 1) - 1)} Đêm
                                                </span>
                                            </div>

                                            <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', marginBottom: '8px', gap: '8px' }}>
                                                    <span style={{ color: '#168BEB', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        <MapPin size={13} /> {tour.destination}
                                                    </span>
                                                    {reviewCount > 0 && avgRating ? (
                                                        <span style={{ fontWeight: '700', color: '#F59E0B', display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                                                            <Star size={13} fill="#F59E0B" color="#F59E0B" /> {avgRating} ({reviewCount})
                                                        </span>
                                                    ) : (
                                                        <span className="tt-badge tt-badge-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>Mở bán</span>
                                                    )}
                                                </div>

                                                <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#102A43', lineHeight: '1.4', margin: '0 0 10px 0', minHeight: '44px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {tour.tour_name}
                                                </h3>

                                                {nextDep && (
                                                    <div style={{ fontSize: '12px', color: '#486581', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                                                        <Calendar size={13} color="#168BEB" />
                                                        <span>Khởi hành: {new Date(nextDep).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EBF2F7', paddingTop: '12px', marginTop: 'auto', gap: '10px' }}>
                                                    <div>
                                                        <span style={{ fontSize: '11.5px', color: '#829AB1', display: 'block' }}>Giá từ</span>
                                                        <strong style={{ fontSize: '17px', color: '#168BEB', fontWeight: '800' }}>{formatCurrency(tour.base_price)}</strong>
                                                    </div>
                                                    <button className="tt-btn tt-btn-primary" style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '10px' }}>
                                                        Khám phá <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SECTION TỰ THIẾT KẾ TOUR BANNER */}
            <section className="tt-container" style={{ marginBottom: '64px' }}>
                <div className="custom-tour-banner" style={{
                    borderRadius: '18px',
                    overflow: 'hidden',
                    padding: '36px 40px',
                    background: 'linear-gradient(135deg, #102A43 0%, #168BEB 100%)',
                    color: '#ffffff',
                    boxShadow: '0 18px 40px rgba(16, 42, 67, 0.16)',
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr',
                    gap: '36px',
                    alignItems: 'center'
                }}>
                    <div style={{ textAlign: 'left' }}>
                        <span style={{
                            background: 'rgba(255, 152, 82, 0.2)',
                            border: '1px solid rgba(255, 152, 82, 0.45)',
                            color: '#FF9852',
                            fontSize: '12px',
                            fontWeight: '800',
                            padding: '5px 14px',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '14px'
                        }}>
                            <Sparkles size={14} /> DỊCH VỤ TOUR THEO YÊU CẦU
                        </span>

                        <h2 style={{ fontSize: '28px', fontWeight: '900', lineHeight: '1.3', marginBottom: '12px', color: '#ffffff' }}>
                            Tự Thiết Kế Chuyến Đi Của Riêng Bạn
                        </h2>

                        <p style={{ fontSize: '14.5px', color: '#D9E2EC', lineHeight: '1.65', marginBottom: '22px', maxWidth: '540px' }}>
                            Chủ động lựa chọn điểm đến, ngày khởi hành, tiêu chuẩn khách sạn và phương tiện riêng. Đội ngũ TravelVN sẽ tối ưu lộ trình và gửi báo giá chi tiết.
                        </p>

                        <button
                            onClick={() => {
                                if (!user) {
                                    alert('Vui lòng đăng nhập để sử dụng tính năng Tự thiết kế Tour!');
                                    navigate('/login');
                                } else {
                                    navigate('/build-tour');
                                }
                            }}
                            className="tt-btn tt-btn-accent"
                            style={{ padding: '13px 26px', fontSize: '15px', borderRadius: '12px' }}
                        >
                            Tự Thiết Kế Tour Ngay <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="custom-tour-visual-card" style={{
                        position: 'relative',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '3px solid rgba(255,255,255,0.25)',
                        height: '220px',
                        backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '16px'
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.96)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#102A43' }}>
                                    Lịch trình cá nhân hóa 100%
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#486581', marginTop: '2px' }}>
                                    Linh hoạt theo ngân sách & số lượng khách
                                </div>
                            </div>
                            <Award size={22} color="#FF9852" />
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <CustomerFooter />
        </div>
    );
};

export default TourListPage;