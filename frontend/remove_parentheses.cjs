const fs = require('fs');
const path = require('path');

const sPath = path.join(__dirname, 'src', 'components', 'StaffFixedTourDesigner.jsx');
let sContent = fs.readFileSync(sPath, 'utf8');

sContent = sContent.replace("Tạo Tour Mới (Auto-generate Lịch trình)", "Tạo Tour Mới");
sContent = sContent.replace("Chọn phương tiện (Tự động phân loại định phí/biến phí)", "Chọn phương tiện");
sContent = sContent.replace("Định phí (Fixed Costs)", "Định phí");
sContent = sContent.replace("Điểm hòa vốn (Minimum Pax)", "Điểm hòa vốn");
sContent = sContent.replace("Định phí khác (Nếu có)", "Định phí khác");
sContent = sContent.replace("Biến phí (Variable Costs / Khách)", "Biến phí / Khách");
sContent = sContent.replace("Vé phương tiện cá nhân (Máy bay/Tàu/Xe)", "Vé phương tiện cá nhân");
sContent = sContent.replace("Chi phí Lưu trú (Ghép đôi 2 người)", "Chi phí Lưu trú");
sContent = sContent.replace("Bữa sáng (Giá)", "Giá bữa sáng");
sContent = sContent.replace("Bữa trưa (Giá)", "Giá bữa trưa");
sContent = sContent.replace("Bữa tối (Giá)", "Giá bữa tối");
sContent = sContent.replace("Biên độ lợi nhuận (Margin %)", "Biên độ lợi nhuận (%)");
sContent = sContent.replace("Giá vốn (Net)", "Giá vốn");
sContent = sContent.replace("Giá bán (Sell)", "Giá bán");

fs.writeFileSync(sPath, sContent, 'utf8');
console.log("Updated StaffFixedTourDesigner.jsx");

const tPath = path.join(__dirname, 'src', 'components', 'TourBuilder', 'TimelineBuilder.jsx');
let tContent = fs.readFileSync(tPath, 'utf8');

tContent = tContent.replace("Module Lịch trình (Multi-Destination Routing)", "Lịch trình");
tContent = tContent.replace("Chuyến đi (Ngày 1)", "Chuyến đi (Ngày đầu)");
// Actually just replace " (Multi-Destination Routing)"
tContent = tContent.replace(" (Multi-Destination Routing)", "");

fs.writeFileSync(tPath, tContent, 'utf8');
console.log("Updated TimelineBuilder.jsx");
