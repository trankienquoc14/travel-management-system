const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const helperFunc = `
const renderPaxSummary = (b) => {
    try {
        if (b.breakdown) {
            const p = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
            const parts = [];
            if (p.adults) parts.push(\`\${p.adults} NL\`);
            if (p.children) parts.push(\`\${p.children} TE\`);
            if (p.toddlers) parts.push(\`\${p.toddlers} TN\`);
            if (p.infants) parts.push(\`\${p.infants} EB\`);
            if (parts.length > 0) return parts.join(', ');
        }
    } catch(e) {}
    return \`\${b.num_people} Khách\`;
};

const getPassengerName`;

code = code.replace("const getPassengerName", helperFunc);

// Replace line 658
const oldText1 = `<strong style={{ color: '#0f172a' }}>{detailBooking.num_people} Người lớn / Trẻ em</strong>`;
const newText1 = `<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>`;

code = code.replace(oldText1, newText1);

// Let's also update the "booking.num_people Người" in the list to look slightly better if we want.
// Wait, the user specifically sent a screenshot of "4 Người lớn / Trẻ em". I will just replace the modal one first. Let me also replace the card one to keep it consistent.
const oldText2 = `<strong style={{ color: '#0f172a' }}>{booking.num_people} Người</strong>`;
const newText2 = `<strong style={{ color: '#0f172a' }}>{renderPaxSummary(booking)}</strong>`;

code = code.replace(oldText2, newText2);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed Pax summary');
