const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

// Helper to resolve destination names
const helperStr = `                                    const accommodationPerPax = autoAccommodationCost / 2;
                                    const fixedTransport = Number(costConfig.fixed?.transport || 0);
                                    const variableTransport = Number(costConfig.variable?.transportTicket || 0);
                                    const formatMoney = (val) => new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));
                                    
                                    const getDestName = (id) => {
                                        if (!id) return 'Chưa rõ';
                                        const dest = destinations.find(x => String(x.destination_id) === String(id));
                                        return dest ? dest.name : 'Chưa rõ';
                                    };
                                    const firstDay = days[0] || {};
                                    const lastDay = days[days.length - 1] || {};
                                    const startDay1 = getDestName(firstDay.start_destination_id);
                                    const endDay1 = getDestName(firstDay.end_destination_id);
                                    const startLastDay = getDestName(lastDay.start_destination_id);
                                    const endLastDay = getDestName(lastDay.end_destination_id);`;

c = c.replace(/                                    const accommodationPerPax = autoAccommodationCost \/ 2;\n                                    const fixedTransport = Number\(costConfig\.fixed\?\.transport \|\| 0\);\n                                    const variableTransport = Number\(costConfig\.variable\?\.transportTicket \|\| 0\);\n                                    const formatMoney = \(val\) => new Intl\.NumberFormat\('vi-VN'\)\.format\(Math\.round\(val \|\| 0\)\);/, helperStr);

// Replace transport name display
c = c.replace(
    /<strong style=\{\{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '12px' \}\}>🚗 Phương tiện di chuyển chính: \{costConfig\.selectedTransport \? costConfig\.selectedTransport\.name : 'Chưa chọn'\}<\/strong>/,
    `<strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '12px' }}>🚗 Phương tiện di chuyển chính: {costConfig.selectedTransport ? (costConfig.selectedTransport.service_name || costConfig.selectedTransport.name) : 'Chưa chọn'}</strong>`
);

// Replace hardcoded "Điểm xuất phát" -> {startDay1}
c = c.replace(
    /<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569' \}\}>\s*<span>Điểm xuất phát<\/span>\s*<span>Điểm đến<\/span>\s*<\/div>/,
    `<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                                                    <span>{startDay1}</span>
                                                                                    <span>{endDay1}</span>
                                                                                </div>`
);

// Replace hardcoded "Điểm kết thúc" -> {startLastDay}
c = c.replace(
    /<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569' \}\}>\s*<span>Điểm kết thúc<\/span>\s*<span>Điểm về<\/span>\s*<\/div>/,
    `<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                                                    <span>{startLastDay}</span>
                                                                                    <span>{endLastDay}</span>
                                                                                </div>`
);

fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);
