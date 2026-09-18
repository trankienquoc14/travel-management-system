const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /const getPassengerName = \(b, idx\) => \{[\s\S]*?if \(b\.breakdown\)/;

const newStr = `const getPassengerName = (b, idx) => {
    try {
        if (b.passengers_list) {
            if (typeof b.passengers_list === 'string') {
                if (b.passengers_list.includes('||')) {
                    const list = b.passengers_list.split('||');
                    if (list[idx]) return list[idx];
                } else if (b.passengers_list.startsWith('[')) {
                    const list = JSON.parse(b.passengers_list);
                    if (list && list[idx]) {
                        if (list[idx].name) return list[idx].name;
                        if (list[idx].full_name) return list[idx].full_name;
                    }
                }
            } else if (Array.isArray(b.passengers_list)) {
                if (b.passengers_list[idx]) {
                    if (b.passengers_list[idx].name) return b.passengers_list[idx].name;
                    if (b.passengers_list[idx].full_name) return b.passengers_list[idx].full_name;
                }
            }
        }
        if (b.breakdown)`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed getPassengerName separator handling');
} else {
    console.log('Regex failed');
}
