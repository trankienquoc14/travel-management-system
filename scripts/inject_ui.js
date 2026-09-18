const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const logic = `
const getDepartureLocation = (b) => {
    try {
        if (b.requirements) {
            const reqs = typeof b.requirements === 'string' ? JSON.parse(b.requirements) : b.requirements;
            if (reqs.pickup_location) return reqs.pickup_location;
        }
        if (b.design_data) {
            const dd = typeof b.design_data === 'string' ? JSON.parse(b.design_data) : b.design_data;
            if (dd.pickup_location) return dd.pickup_location;
        }
    } catch(e) {}
    return 'Hồ Chí Minh';
};

const getDepartureTime = (b) => {
    try {
        if (b.requirements) {
            const reqs = typeof b.requirements === 'string' ? JSON.parse(b.requirements) : b.requirements;
            if (reqs.departure_time) return reqs.departure_time;
        }
        if (b.design_data) {
            const dd = typeof b.design_data === 'string' ? JSON.parse(b.design_data) : b.design_data;
            if (dd.departure_time) return dd.departure_time;
        }
    } catch(e) {}
    return '06:00 AM';
};
`;

if (!code.includes('getDepartureLocation')) {
    const importIdx = code.indexOf('const MyBookings = () => {');
    code = code.slice(0, importIdx) + logic + '\n' + code.slice(importIdx);
}

const target = `<div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐIỂM ĐẾN</span>
                                                    <strong style={{ color: '#0f172a' }}>{detailBooking.destination || 'Việt Nam'}</strong>
                                                </div>`;

const replacement = `<div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐỊA ĐIỂM XUẤT PHÁT</span>
                                                    <strong style={{ color: '#0f172a' }}>{getDepartureLocation(detailBooking)}</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>GIỜ KHỞI HÀNH</span>
                                                    <strong style={{ color: '#0f172a' }}>{getDepartureTime(detailBooking)}</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐIỂM ĐẾN</span>
                                                    <strong style={{ color: '#0f172a' }}>{detailBooking.destination || 'Việt Nam'}</strong>
                                                </div>`;

if (!code.includes('ĐỊA ĐIỂM XUẤT PHÁT')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Injected UI');
} else {
    console.log('UI already injected');
}
