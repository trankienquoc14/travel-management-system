const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const oldFunc = `const renderPaxSummary = (b) => {
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
};`;

const newFunc = `const renderPaxSummary = (b) => {
    try {
        let p = null;
        if (b.breakdown) {
            p = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
        } else if (b.requirements) {
            const reqs = typeof b.requirements === 'string' ? JSON.parse(b.requirements) : b.requirements;
            if (reqs.participantBreakdown) {
                p = reqs.participantBreakdown;
            }
        }
        
        if (p) {
            const parts = [];
            if (p.adults) parts.push(\`\${p.adults} NL\`);
            if (p.children) parts.push(\`\${p.children} TE\`);
            if (p.toddlers) parts.push(\`\${p.toddlers} TN\`);
            if (p.infants) parts.push(\`\${p.infants} EB\`);
            if (parts.length > 0) return parts.join(', ');
        }
    } catch(e) {}
    return \`\${b.num_people} Khách\`;
};`;

code = code.replace(oldFunc, newFunc);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed renderPaxSummary');
