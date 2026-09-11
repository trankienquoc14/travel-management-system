const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

// 1. Rename searchGuests to searchBudget
code = code.replace(
    /const \[searchGuests, setSearchGuests\] = useState\('All'\);/g,
    "const [searchBudget, setSearchBudget] = useState('All');"
);

// 2. Change the UI
const targetUI = `<div style={{ minWidth: 0 }}>
                                <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                                    👥 Số lượng hành khách
                                </label>
                                <select
                                    value={searchGuests}
                                    onChange={(e) => setSearchGuests(e.target.value)}
                                    style={{ width: '100%', height: '46px', padding: '0 12px', borderRadius: '14px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '700', color: '#0f172a', background: '#f8fafc', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                                >
                                    <option value="All">✨ Tất cả số lượng</option>
                                    <option value="1">👤 1 Khách (Solo)</option>
                                    <option value="2">👩‍❤️‍👨 2 Khách (Cặp đôi)</option>
                                    <option value="4">👨‍👩‍👧‍👦 Gia đình (3-4 Khách)</option>
                                    <option value="8">💼 Đoàn đông (5+ Khách)</option>
                                </select>
                            </div>`;

const replaceUI = `<div style={{ minWidth: 0 }}>
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
                            </div>`;

code = code.replace(targetUI, replaceUI);

// 3. Update apply logic
const targetLogic = `const handleApplyFloatingSearch = () => {
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
        }));`;

const replaceLogic = `const handleApplyFloatingSearch = () => {
        setPreferences(prev => ({
            ...prev,
            searchTerm: searchLocation,
            departureDate: searchDate,
            budgetRange: searchBudget
        }));`;

code = code.replace(targetLogic, replaceLogic);

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
console.log('Replaced guests with budget');
