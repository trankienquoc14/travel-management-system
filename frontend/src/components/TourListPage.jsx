import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

    return (
        <div className="homepage-container" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* 1. HEADER (STICKY GLASSMORPHISM NAVBAR) */}
            <CustomerNavbar activeTab="explore" />

            {/* 2. PAGE HEADER BANNER */}
            <div style={{ 
                padding: '60px 5%', 
                background: 'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000) center/cover no-repeat',
                position: 'relative',
                marginBottom: '40px'
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.5)'
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
                        Khám Phá Chuyến Đi
                    </h1>
                    <p style={{ fontSize: '16px', color: '#e2e8f0', margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                        Tìm kiếm và chọn lọc hàng trăm hành trình tuyệt vời được thiết kế dành riêng cho bạn.
                    </p>
                </div>
            </div>

            <section ref={showcaseRef} style={{ padding: '0 5%', marginBottom: '60px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: showSidebar ? 'minmax(260px, 290px) 1fr' : '1fr', gap: '28px', alignItems: 'start' }}>
                    
                    {/* LEFT STICKY SIDEBAR FILTER */}
                    {showSidebar && (
                        <TravelPreferenceSidebar 
                            preferences={preferences}
                            onPreferenceChange={(newPrefs) => setPreferences(newPrefs)}
                        />
                    )}

                    {/* MAIN TOURS DISPLAY */}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                    🔥 Tất Cả Chuyến Đi
                                </h2>
                                <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
                                    Hiển thị {filteredTours.length} chuyến đi phù hợp nhất theo tiêu chí tìm kiếm
                                </p>
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

                        {/* TOUR GRID */}
                        {loadingTours ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '20px' }}>
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} style={{ background: '#ffffff', borderRadius: '20px', height: '320px', border: '1px solid #e2e8f0', padding: '16px' }}>
                                        <div style={{ background: '#e2e8f0', height: '160px', borderRadius: '14px', marginBottom: '14px' }} />
                                        <div style={{ background: '#e2e8f0', height: '18px', width: '60%', borderRadius: '6px', marginBottom: '8px' }} />
                                        <div style={{ background: '#e2e8f0', height: '24px', width: '90%', borderRadius: '6px' }} />
                                    </div>
                                ))}
                            </div>
                        ) : filteredTours.length === 0 ? (
                            <div style={{ background: '#ffffff', borderRadius: '24px', padding: '50px 20px', textAlign: 'center', border: '1.5px solid #e2e8f0' }}>
                                <div style={{ fontSize: '50px', marginBottom: '12px' }}>🔍</div>
                                <h3 style={{ fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>Không tìm thấy tour phù hợp</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '500px', margin: '8px auto 20px auto' }}>
                                    Không có chuyến đi nào thỏa mãn toàn bộ tiêu chí lọc hiện tại. Vui lòng đặt lại hoặc chọn tiêu chí linh hoạt hơn.
                                </p>
                                <button
                                    onClick={() => {
                                        setPreferences({
                                            destinations: [], duration: 'All', tripPurposes: [], companions: [], budgetRange: 'All',
                                            interests: [], pace: 'All', accommodationLevel: 'All', transportTypes: [],
                                            keyPriorities: [], searchTerm: '', departureDate: ''
                                        });
                                        setSearchLocation('');
                                        setSelectedCategory('Tất cả');
                                    }}
                                    style={{ padding: '10px 24px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    🔄 Đặt lại tất cả bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '20px' }}>
                                {filteredTours.map(tour => (
                                    <div 
                                        key={tour.tour_id}
                                        onClick={() => {
                                            trackBehavior('CLICK_TOUR', tour.tour_id, { tour_name: tour.tour_name });
                                            navigate(`/tour/${tour.tour_id}`);
                                        }}
                                        style={{
                                            background: '#ffffff', borderRadius: '20px', border: '1.5px solid #e2e8f0',
                                            overflow: 'hidden', cursor: 'pointer', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)',
                                            transition: 'all 0.25s ease'
                                        }}
                                        className="tour-card-modern"
                                    >
                                        <div style={{ position: 'relative', height: '170px' }}>
                                            <div style={{ backgroundImage: `url(${getImageUrl(tour.image_url)})`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }} />
                                            {Number(tour.base_price || 0) <= 4000000 && (
                                                <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px' }}>
                                                    🔥 Giá Cực Tốt
                                                </span>
                                            )}
                                            <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '8px' }}>
                                                ⏱️ {tour.duration_days} Ngày
                                            </span>
                                        </div>

                                        <div style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                                                <span style={{ color: '#0284c7', fontWeight: '700' }}>📍 {tour.destination}</span>
                                                <span style={{ fontWeight: '700', color: '#f59e0b' }}>⭐ 4.9 (128)</span>
                                            </div>

                                            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.4', margin: '0 0 14px 0', height: '42px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {tour.tour_name}
                                            </h3>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Giá từ</span>
                                                    <strong style={{ fontSize: '16px', color: '#ef4444' }}>{formatCurrency(tour.base_price)}</strong>
                                                </div>
                                                <button style={{ padding: '8px 16px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                                                    Khám phá ➡️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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

export default TourListPage;