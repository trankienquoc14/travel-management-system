const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const oldCode = `const getPassengerName = (b, idx) => {
    try {
        if (b.passengers_list) {
            const list = typeof b.passengers_list === 'string' ? JSON.parse(b.passengers_list) : b.passengers_list;
            if (list && list[idx] && list[idx].name) return list[idx].name;
        }
        if (b.breakdown) {
            const parsed = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
            if (parsed && parsed.passengers && parsed.passengers[idx]) {
                if (parsed.passengers[idx].full_name) return parsed.passengers[idx].full_name;
            }
        }
    } catch(e) {}
    if (b.num_people > 1) {
        return idx === 0 ? \`\${b.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${b.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`;
    }
    return b.customer_name || 'Khách hàng';
};`;

const newCode = `const getPassengerName = (b, idx) => {
    try {
        if (b.passengers_list) {
            // Check if it's a JSON array string
            if (b.passengers_list.startsWith('[')) {
                const list = JSON.parse(b.passengers_list);
                if (list && list[idx] && list[idx].name) return list[idx].name;
            } else {
                // It's a string separated by ||
                const list = b.passengers_list.split('||');
                if (list && list[idx]) return list[idx].trim();
            }
        }
        if (b.breakdown) {
            const parsed = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
            if (parsed && parsed.passengers && parsed.passengers[idx]) {
                if (parsed.passengers[idx].full_name) return parsed.passengers[idx].full_name;
            }
        }
    } catch(e) {}
    if (b.num_people > 1) {
        return idx === 0 ? \`\${b.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${b.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`;
    }
    return b.customer_name || 'Khách hàng';
};`;

code = code.replace(oldCode, newCode);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed getPassengerName separator');
