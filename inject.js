const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

// 1. Inject lucide-react icons if missing
if (!code.includes('ChevronLeft')) {
    code = code.replace(
        "import { useNavigate, Link } from 'react-router-dom';",
        "import { useNavigate, Link } from 'react-router-dom';\nimport { ChevronLeft, ChevronRight } from 'lucide-react';"
    );
}

// 2. Inject discountSliderRef
if (!code.includes('discountSliderRef')) {
    code = code.replace(
        'const tourSliderRef = useRef(null);',
        'const tourSliderRef = useRef(null);\n    const discountSliderRef = useRef(null);'
    );
}

// 3. Inject selectedRegion state
if (!code.includes('selectedRegion')) {
    code = code.replace(
        "const [trendingTab, setTrendingTab] = useState('Tất cả');",
        "const [trendingTab, setTrendingTab] = useState('Tất cả');\n    const [selectedRegion, setSelectedRegion] = useState('Tất cả');"
    );
}

// 4. Inject region filter logic
const filterSearch = "const matchPromoTab = !trendingTab.includes('Ưu đãi') || Number(tour.base_price || 0) <= 4500000;";
if (code.includes(filterSearch) && !code.includes('matchRegion')) {
    const filterInsert = `const matchPromoTab = !trendingTab.includes('Ưu đãi') || Number(tour.base_price || 0) <= 4500000;

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
        }`;
    
    code = code.replace(filterSearch, filterInsert);
    code = code.replace(
        'matchPace && matchAccommodation && matchPromoTab;',
        'matchPace && matchAccommodation && matchPromoTab && matchRegion;'
    );
}

// 5. Replace UI block from `7. MAIN CONTENT` to `9. SECTION` with our snippet
const snippet = fs.readFileSync('snippet.jsx', 'utf8');

const s1 = code.indexOf('            {/* 7. MAIN CONTENT: TOUR ĐANG ĐƯỢC QUAN TÂM & STICKY SIDEBAR */}');
const s2 = code.indexOf('            {/* 9. SECTION TỰ THIẾT KẾ TOUR BANNER (BALANCED 2-COLUMN DESIGN) */}');

if (s1 !== -1 && s2 !== -1) {
    code = code.substring(0, s1) + snippet + '\n\n' + code.substring(s2);
}

// 6. Fix promoTours logic (which might be missing)
if (!code.includes('promoTours')) {
    code = code.replace(
        'const filteredTours = useMemo(() => {',
        `const promoTours = useMemo(() => {
        return tours.filter(t => Number(t.base_price || 0) <= 4500000).slice(0, 10);
    }, [tours]);

    const filteredTours = useMemo(() => {`
    );
}

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
console.log('Injected successfully');
