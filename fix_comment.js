const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

code = code.replace(
  "/* 2. QUẢN LÝ YÊU CẦU & QUẢN LÝ TOUR & ĐẶT TOUR (Nhân viên VP & Admin) */",
  "{/* 2. QUẢN LÝ YÊU CẦU & QUẢN LÝ TOUR & ĐẶT TOUR (Nhân viên VP & Admin) */}"
);

fs.writeFileSync('frontend/src/components/Dashboard.jsx', code, 'utf8');
console.log('Fixed comment syntax');
