const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

// 1. Refs
code = code.replace(
    'const tourSliderRef = useRef(null);',
    'const tourSliderRef = useRef(null);\n    const discountSliderRef = useRef(null);'
);

// 2. State
code = code.replace(
    "const [trendingTab, setTrendingTab] = useState('Tất cả');",
    "const [trendingTab, setTrendingTab] = useState('Tất cả');\n    const [selectedRegion, setSelectedRegion] = useState('Tất cả');"
);

// 3. Filter logic
const filterSearch = "const matchPromoTab = !trendingTab.includes('?u đãi') || Number(tour.base_price || 0) <= 4500000;";
const filterInsert = `       const matchPromoTab = !trendingTab.includes('?u đãi') || Number(tour.base_price || 0) <= 4500000;

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
            } else if (selectedRegion === 'Tây Nguyån') {
                matchRegion = tayNguyen.some(d => dest.includes(d.toLowerCase()));
            }
        }
`;
        
code = code.replace(filterSearch, filterInsert);
code = code.replace(
    'matchPace && matchAccommodation && matchPromoTab;',
    'matchPace && matchAccommodation && matchPromoTab && matchRegion;'
);

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
