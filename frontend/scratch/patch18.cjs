const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

c = c.replace(
    /\{parsedDesign\.costConfig\.selectedTransport \? 'Đã chọn phương tiện di chuyển' : 'Chưa chọn phương tiện'\}/,
    `{parsedDesign.costConfig.selectedTransport ? (parsedDesign.costConfig.selectedTransport.service_name || parsedDesign.costConfig.selectedTransport.name || 'Đã chọn phương tiện di chuyển') : 'Chưa chọn phương tiện'}`
);

fs.writeFileSync('src/components/TourDetail.jsx', c);
