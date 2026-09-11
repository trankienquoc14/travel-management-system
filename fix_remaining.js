const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

const theButtonStr = `<button
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
                        </button>`;

// 1. Điểm Đến
code = code.replace(/<div[^>]*onClick=\{scrollToShowcase\}>\s*Xem tất cả chuyến đi ➡️\s*<\/div>/, theButtonStr);
// And let's change its parent layout to center items and allow wrap
code = code.replace(
    /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' \}\}>\s*<div>\s*<h2[^>]*>[\s\S]*?HOT 2026[\s\S]*?<\/h2>/,
    `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📍 Điểm Đến Thịnh Hành & Nổi Bật
                            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' }}>HOT 2026</span>
                        </h2>`
);

// 2. Ưu Đãi Đặc Biệt
// It might already have `theButtonStr` if I ran the previous replacement successfully, wait, no, the previous one used literal replace that might have failed.
// Let's check if it has "Xem thêm" already under Ưu Đãi.
if (!code.includes("💯 Ưu Đãi Đặc Biệt") || !code.substring(code.indexOf("💯 Ưu Đãi Đặc Biệt"), code.indexOf("💯 Ưu Đãi Đặc Biệt") + 500).includes("Xem thêm")) {
    // Doesn't have it. Insert it.
    code = code.replace(
        /(<h2[^>]*>\s*💯 Ưu Đãi Đặc Biệt\s*<\/h2>\s*<p[^>]*>.*?<\/p>\s*<\/div>)/,
        "$1\n                    " + theButtonStr
    );
    // Fix layout
    code = code.replace(
        /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' \}\}>\s*<div>\s*<h2[^>]*>\s*💯 Ưu Đãi Đặc Biệt/,
        `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', margin: 0 }}>
                            💯 Ưu Đãi Đặc Biệt`
    );
}

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
console.log('Fixed Điểm Đến and Ưu Đãi!');
