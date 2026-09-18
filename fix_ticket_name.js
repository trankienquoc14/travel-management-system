const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// Update getPassengerName to parse more places where passengers might be stored
const getPassengerNameRegex = /const getPassengerName = \(b, idx\) => \{[\s\S]*?\};/;
const newGetPassengerName = `const getPassengerName = (b, idx) => {
    try {
        if (b.passengers_list) {
            const list = typeof b.passengers_list === 'string' ? JSON.parse(b.passengers_list) : b.passengers_list;
            if (list && list[idx] && list[idx].name) return list[idx].name;
            if (list && list[idx] && list[idx].full_name) return list[idx].full_name;
        }
        if (b.breakdown) {
            const parsed = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
            if (parsed && parsed.passengers && parsed.passengers[idx]) {
                if (parsed.passengers[idx].full_name) return parsed.passengers[idx].full_name;
                if (parsed.passengers[idx].name) return parsed.passengers[idx].name;
            }
        }
        if (b.requirements) {
            const req = typeof b.requirements === 'string' ? JSON.parse(b.requirements) : b.requirements;
            if (req && req.passengers && req.passengers[idx]) {
                if (req.passengers[idx].full_name) return req.passengers[idx].full_name;
                if (req.passengers[idx].name) return req.passengers[idx].name;
            }
        }
        if (b.design_data) {
            const d = typeof b.design_data === 'string' ? JSON.parse(b.design_data) : b.design_data;
            if (d && d.passengers && d.passengers[idx]) {
                if (d.passengers[idx].full_name) return d.passengers[idx].full_name;
                if (d.passengers[idx].name) return d.passengers[idx].name;
            }
        }
    } catch(e) {}
    
    // If no specific names found, use customer name + index
    if (b.num_people > 1) {
        return idx === 0 ? \`\${b.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${b.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`;
    }
    return b.customer_name || 'Khách hàng';
};`;

if (code.match(getPassengerNameRegex)) {
    code = code.replace(getPassengerNameRegex, newGetPassengerName);
    console.log('Fixed getPassengerName');
}

// Update MODAL 4 to use getPassengerName again
const hardcodedNameRegex = /<div style=\{\{ fontSize: '19px', color: '#0f172a', fontWeight: '800' \}\}>\{ticketBooking\.customer_name \|\| 'Khách hàng'\}<\/div>/g;
const dynamicNameStr = `<div style={{ fontSize: '19px', color: '#0f172a', fontWeight: '800' }}>{getPassengerName(ticketBooking, idx)}</div>`;

if (code.match(hardcodedNameRegex)) {
    code = code.replace(hardcodedNameRegex, dynamicNameStr);
    console.log('Restored dynamic passenger name in ticket');
}

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
