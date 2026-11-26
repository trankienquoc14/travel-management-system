import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import CustomerNavbar from './CustomerNavbar';
import CustomerFooter from './CustomerFooter';
import { useRealtime } from '../services/realtimeService';
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
    const [tours, setTours] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_tours_data');
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });
    const [services, setServices] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_services_data');
            return cached ? JSON.parse(cached) : [];
        } catch (e) {
            return [];
        }
    });
    const [loadingTours, setLoadingTours] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_tours_data');
            return !cached || JSON.parse(cached).length === 0;
        } catch (e) {
            return true;
        }
    });
    const [loadingServices, setLoadingServices] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_services_data');
            return !cached || JSON.parse(cached).length === 0;
        } catch (e) {
            return true;
        }
    });

    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [trendingTab, setTrendingTab] = useState('Tất cả');
    const [showSidebar, setShowSidebar] = useState(true);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const toursPerPage = 6;

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

        const handleOnline = () => {
            fetchTours();
            fetchServices();
        };
        const handleOffline = () => {
            setLoadingTours(false);
            setLoadingServices(false);
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useRealtime('realtime:tour', () => {
        fetchTours();
    });

    const fetchTours = async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setLoadingTours(false);
            return;
        }

        if (tours.length === 0) {
            setLoadingTours(true);
        }

        try {
            const response = await axios.get('http://localhost:5000/api/tours', { timeout: 7000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                setTours(response.data.data);
                try {
                    localStorage.setItem('cached_tours_data', JSON.stringify(response.data.data));
                } catch (e) {}
            }
        } catch (error) {
            console.warn('Lỗi khi tải danh sách tour (sử dụng cache nếu có):', error.message);
            try {
                const cached = localStorage.getItem('cached_tours_data');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.length > 0) setTours(parsed);
                }
            } catch (e) {}
        } finally {
            setLoadingTours(false);
        }
    };

    const fetchServices = async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setLoadingServices(false);
            return;
        }

        if (services.length === 0) {
            setLoadingServices(true);
        }

        try {
            const res = await axios.get('http://localhost:5000/api/services', { timeout: 7000 });
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
                const activeServices = res.data.data.filter(s => s.status === 'Active');
                setServices(activeServices);
                try {
                    localStorage.setItem('cached_services_data', JSON.stringify(activeServices));
                } catch (e) {}
            }
        } catch (error) {
            console.warn('Lỗi khi tải dịch vụ (sử dụng cache nếu có):', error.message);
            try {
                const cached = localStorage.getItem('cached_services_data');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.length > 0) setServices(parsed);
                }
            } catch (e) {}
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

    // Pagination calculations
    const totalPages = Math.ceil(filteredTours.length / toursPerPage) || 1;
    const startIndex = (currentPage - 1) * toursPerPage;
    const displayedTours = filteredTours.slice(startIndex, startIndex + toursPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            if (showcaseRef.current) {
                showcaseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

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
        setCurrentPage(1);
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
        setCurrentPage(1);
    };

    return (
        <div className="tt-page">
            {/* 1. HEADER */}
            <CustomerNavbar activeTab="explore" />

            {/* 2. PAGE HEADER BANNER + INLINE SEARCH */}
            <div style={{
                padding: '48px 20px 56px 20px',
                background: 'linear-gradient(135deg, rgba(16, 42, 67, 0.88) 0%, rgba(22, 139, 235, 0.78) 100%), url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000) center/cover no-repeat',
                marginBottom: '32px',
                position: 'relative'
            }}>
                <div className="tt-container" style={{ textAlign: 'center', color: '#ffffff' }}>
                    <span style={{
                        background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                        padding: '6px 14px', borderRadius: '999px', fontSize: '12.5px', fontWeight: '700',
                        display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <Compass size={14} color="#FF9852" /> Khám phá hành trình TravelVN ERP
                    </span>
                    <h1 style={{ fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-0.5px', color: '#ffffff', lineHeight: 1.25 }}>
                        Khám Phá Tất Cả Tour Du Lịch
                    </h1>
                    <p style={{ fontSize: 'clamp(13.5px, 2.5vw, 15.5px)', color: '#D9E2EC', margin: '0 auto 22px auto', maxWidth: '620px', lineHeight: 1.5 }}>
                        Tìm kiếm và lọc nhanh theo điểm đến, thời lượng, ngân sách và sở thích cá nhân hóa.
                    </p>

                    {/* INLINE SEARCH BAR */}
                    <div style={{ 
                        maxWidth: '720px', 
                        margin: '0 auto', 
                        background: '#ffffff', 
                        borderRadius: '16px', 
                        padding: '6px', 
                        display: 'flex', 
                        gap: '8px', 
                        boxShadow: '0 16px 36px rgba(16, 42, 67, 0.25)',
                        border: '1px solid rgba(255,255,255,0.4)'
                    }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px', minWidth: 0 }}>
                            <Search size={19} color="#829AB1" style={{ flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="Tìm điểm đến, tên tour (Đà Nẵng, Phú Quốc, Sapa...)"
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
                                    style={{ border: 'none', background: 'transparent', color: '#829AB1', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
                                    aria-label="Xóa tìm kiếm"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button 
                            onClick={handleApplyFloatingSearch} 
                            className="tt-btn tt-btn-primary" 
                            style={{ 
                                borderRadius: '12px', 
                                padding: '10px 22px',
                                fontWeight: '700',
                                fontSize: '14px',
                                flexShrink: 0,
                                background: 'linear-gradient(135deg, #168BEB 0%, #0c6cbd 100%)',
                                boxShadow: '0 4px 12px rgba(22, 139, 235, 0.35)'
                            }}
                        >
                            Tìm kiếm
                        </button>
                    </div>

                    {/* QUICK DESTINATION PILLS */}
                    <div style={{ 
                        maxWidth: '720px', 
                        margin: '14px auto 0 auto', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        flexWrap: 'wrap', 
                        justifyContent: 'center',
                        fontSize: '12.5px' 
                    }}>
                        <span style={{ color: '#BAC7D5', fontWeight: '600' }}>Gợi ý:</span>
                        {[
                            { name: 'Đà Nẵng', label: '🌉 Đà Nẵng' },
                            { name: 'Phú Quốc', label: '🏝️ Phú Quốc' },
                            { name: 'Đà Lạt', label: '🌲 Đà Lạt' },
                            { name: 'Hạ Long', label: '🛳️ Hạ Long' },
                            { name: 'Sapa', label: '🏔️ Sapa' },
                            { name: 'Hà Nội', label: '⛩️ Hà Nội' }
                        ].map(dest => {
                            const isSelected = preferences.destinations?.includes(dest.name) || searchLocation.includes(dest.name);
                            return (
                                <button
                                    key={dest.name}
                                    onClick={() => {
                                        const current = preferences.destinations || [];
                                        const exists = current.includes(dest.name);
                                        const updated = exists ? current.filter(d => d !== dest.name) : [...current, dest.name];
                                        setPreferences(prev => ({ ...prev, destinations: updated }));
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        border: isSelected ? '1px solid #FF9852' : '1px solid rgba(255,255,255,0.25)',
                                        background: isSelected ? 'rgba(255, 152, 82, 0.25)' : 'rgba(255,255,255,0.12)',
                                        color: isSelected ? '#FF9852' : '#ffffff',
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: isSelected ? '700' : '500',
                                        backdropFilter: 'blur(4px)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {dest.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <section ref={showcaseRef} className="tt-container" style={{ marginBottom: '40px' }}>
                {/* MOBILE FILTER TRIGGER & ACTIVE SUMMARY BAR */}
                <div className="tt-mobile-only" style={{ marginBottom: '16px', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => setMobileFilterOpen(true)}
                        className="tt-btn tt-btn-primary"
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '14px',
                            background: 'linear-gradient(135deg, #102A43 0%, #168BEB 100%)',
                            boxShadow: '0 4px 14px rgba(16, 42, 67, 0.2)'
                        }}
                    >
                        <SlidersHorizontal size={17} />
                        Bộ lọc tiêu chí
                        {(preferences.destinations?.length > 0 || preferences.duration !== 'All' || preferences.budgetRange !== 'All') && (
                            <span style={{
                                background: '#FF9852',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                marginLeft: '4px'
                            }}>
                                {(preferences.destinations?.length || 0) + (preferences.duration !== 'All' ? 1 : 0) + (preferences.budgetRange !== 'All' ? 1 : 0)}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={handleResetFilters} 
                        className="tt-btn tt-btn-ghost"
                        style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: '1.5px solid #D9E2EC',
                            background: '#ffffff',
                            fontWeight: '700',
                            color: '#486581'
                        }}
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>

                {/* MOBILE FILTER DRAWER (MODAL BOTTOM SHEET / SLIDE OVER) */}
                {mobileFilterOpen && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        {/* Backdrop Click */}
                        <div 
                            style={{ flex: 1 }} 
                            onClick={() => setMobileFilterOpen(false)}
                        />

                        {/* Drawer Content */}
                        <div style={{
                            background: '#ffffff',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
                            overflow: 'hidden'
                        }}>
                            {/* Drawer Header */}
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: '1.5px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#ffffff'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>🎛️</span>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Bộ Lọc Tiêu Chí</h3>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>Tìm chuyến đi chuẩn gu bạn</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <button
                                        onClick={handleResetFilters}
                                        style={{
                                            border: 'none',
                                            background: '#fef2f2',
                                            color: '#ef4444',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Đặt lại
                                    </button>
                                    <button
                                        onClick={() => setMobileFilterOpen(false)}
                                        style={{
                                            border: 'none',
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                        aria-label="Đóng bộ lọc"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Body - Scrollable */}
                            <div style={{
                                padding: '16px 20px',
                                overflowY: 'auto',
                                flex: 1,
                                WebkitOverflowScrolling: 'touch'
                            }}>
                                <TravelPreferenceSidebar
                                    preferences={preferences}
                                    onPreferenceChange={(newPrefs) => setPreferences(newPrefs)}
                                    isDrawer={true}
                                />
                            </div>

                            {/* Drawer Footer - Sticky Action */}
                            <div style={{
                                padding: '14px 20px',
                                borderTop: '1.5px solid #f1f5f9',
                                background: '#ffffff',
                                display: 'flex',
                                gap: '12px',
                                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.04)'
                            }}>
                                <button
                                    onClick={() => setMobileFilterOpen(false)}
                                    className="tt-btn tt-btn-primary"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        padding: '13px',
                                        fontSize: '15px',
                                        fontWeight: '800',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #168BEB 0%, #0c6cbd 100%)',
                                        boxShadow: '0 4px 14px rgba(22, 139, 235, 0.35)'
                                    }}
                                >
                                    Xem {filteredTours.length} chuyến đi phù hợp
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="tour-list-layout-grid" style={{ display: 'grid', gridTemplateColumns: showSidebar ? 'minmax(260px, 290px) 1fr' : '1fr', gap: '28px', alignItems: 'stretch' }}>
                    {/* LEFT STICKY SIDEBAR FILTER (DESKTOP) */}
                    {showSidebar && (
                        <div className="tt-desktop-only" style={{ display: 'flex', flexDirection: 'column' }}>
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
                                    Hiển thị <strong>{filteredTours.length > 0 ? `${startIndex + 1} - ${Math.min(startIndex + toursPerPage, filteredTours.length)}` : 0}</strong> trong <strong>{filteredTours.length}</strong> chuyến đi phù hợp
                                </p>
                            </div>

                            {/* TAB SORTING */}
                            <div className="tour-sort-tabs-container" style={{ 
                                display: 'flex', 
                                gap: '6px', 
                                background: '#ffffff', 
                                padding: '5px', 
                                borderRadius: '12px', 
                                border: '1px solid #D9E2EC', 
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                maxWidth: '100%'
                            }}>
                                {['Tất cả', 'Ưu đãi đặc quyền', 'Bán chạy', 'Giá tốt'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            setTrendingTab(tab);
                                            setCurrentPage(1);
                                        }}
                                        style={{
                                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                                            background: trendingTab === tab ? '#168BEB' : 'transparent',
                                            color: trendingTab === tab ? '#ffffff' : '#486581',
                                            fontWeight: trendingTab === tab ? '700' : '600', fontSize: '13px',
                                            cursor: 'pointer', transition: 'all 0.2s',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0
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
                            <>
                                <div className="tt-tour-grid">
                                    {displayedTours.map(tour => {
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

                                {/* PAGINATION CONTROLS */}
                                {totalPages > 1 && (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginTop: '24px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            style={{
                                                border: '1.5px solid #e2e8f0',
                                                background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                                                color: currentPage === 1 ? '#cbd5e1' : '#1e293b',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <ChevronLeft size={16} /> Trước
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => {
                                            const isActive = pageNumber === currentPage;
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    style={{
                                                        border: isActive ? 'none' : '1.5px solid #e2e8f0',
                                                        background: isActive ? 'linear-gradient(135deg, #168BEB 0%, #0c6cbd 100%)' : '#ffffff',
                                                        color: isActive ? '#ffffff' : '#334155',
                                                        width: '38px',
                                                        height: '38px',
                                                        borderRadius: '10px',
                                                        fontSize: '14px',
                                                        fontWeight: isActive ? '800' : '600',
                                                        cursor: 'pointer',
                                                        boxShadow: isActive ? '0 4px 12px rgba(22, 139, 235, 0.35)' : 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            style={{
                                                border: '1.5px solid #e2e8f0',
                                                background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                                                color: currentPage === totalPages ? '#cbd5e1' : '#1e293b',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Sau <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* SECTION TỰ THIẾT KẾ TOUR BANNER (ĐỒNG BỘ 100% VỚI TRANG CHỦ) */}
            <section className="tt-container" style={{ marginBottom: '48px' }}>
                <div className="custom-tour-banner" style={{
                    position: 'relative',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    padding: '36px 40px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 55%, #e0f2fe 100%)',
                    border: '1.5px solid #bae6fd',
                    boxShadow: '0 12px 35px rgba(1, 148, 243, 0.08)',
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr',
                    gap: '36px',
                    alignItems: 'center',
                    boxSizing: 'border-box'
                }}>
                    {/* LEFT COLUMN: TITLE, HIGHLIGHTS & CTA */}
                    <div style={{ textAlign: 'left' }}>
                        <span style={{
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            color: '#0284c7',
                            fontSize: '12px',
                            fontWeight: '800',
                            padding: '5px 14px',
                            borderRadius: '20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '14px',
                            letterSpacing: '0.3px'
                        }}>
                            ✨ DỊCH VỤ TOUR THEO YÊU CẦU
                        </span>

                        <h2 style={{ fontSize: '28px', fontWeight: '900', lineHeight: '1.35', marginBottom: '12px', letterSpacing: '-0.4px', color: '#0f172a' }}>
                            Tự Thiết Kế Chuyến Đi Của Riêng Bạn
                        </h2>

                        <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.65', marginBottom: '22px', maxWidth: '540px' }}>
                            Chủ động lựa chọn điểm đến, ngày khởi hành, tiêu chuẩn khách sạn 3★ - 5★ và xe đưa đón riêng. Đội ngũ TravelVN sẽ tối ưu lộ trình và gửi báo giá chi tiết trong 2 phút.
                        </p>

                        {/* KEY PERKS */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#ffffff', padding: '7px 13px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                                <span style={{ fontSize: '15px' }}>🏨</span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Khách sạn 3★ - 5★</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#ffffff', padding: '7px 13px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                                <span style={{ fontSize: '15px' }}>🚗</span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Xe riêng đưa đón VIP</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#ffffff', padding: '7px 13px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                                <span style={{ fontSize: '15px' }}>⚡</span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Báo giá tự động 2 phút</span>
                            </div>
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
                                padding: '12px 28px',
                                borderRadius: '24px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)',
                                color: '#ffffff',
                                fontWeight: '800',
                                fontSize: '14.5px',
                                cursor: 'pointer',
                                boxShadow: '0 6px 18px rgba(1, 148, 243, 0.35)',
                                transition: 'all 0.25s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 22px rgba(1, 148, 243, 0.45)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 18px rgba(1, 148, 243, 0.35)';
                            }}
                        >
                            Tự Thiết Kế Tour Ngay ➔
                        </button>
                    </div>

                    {/* RIGHT COLUMN: TRAVEL REAL SHOWCASE (ẢNH BIỂN ĐẢO NGHỈ DƯỠNG CÂN ĐỐI) */}
                    <div className="custom-tour-visual-card" style={{
                        position: 'relative',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
                        border: '4px solid #ffffff',
                        height: '230px',
                        backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <span style={{
                                background: 'rgba(15, 23, 42, 0.65)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                color: '#ffffff',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                padding: '5px 12px',
                                borderRadius: '16px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                🌴 Nghỉ dưỡng đẳng cấp theo ý bạn
                            </span>
                        </div>

                        <div style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '10px 16px',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                                    Hơn 1.500+ Khách Hài Lòng
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                                    ⭐ 4.9/5 Đánh giá hành trình tùy chỉnh
                                </div>
                            </div>
                            <span style={{
                                background: '#f0f9ff',
                                color: '#0284c7',
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                border: '1px solid #bae6fd'
                            }}>
                                Độc Bản
                            </span>
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