const mysql = require('../node_modules/mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'travel_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const formatVND = (num) => {
  if (!num) return '0 ₫';
  return Number(num).toLocaleString('vi-VN') + ' ₫';
};

const formatDateVN = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

/**
 * Phân tích câu hỏi và truy vấn CSDL để trả lời khách hàng
 */
async function processAIQuery(question, conversationHistory = []) {
  const qLower = (question || '').toLowerCase().trim();

  // 1. CHÀO HỎI / GIỚI THIỆU
  if (isGreeting(qLower)) {
    return {
      reply: `Dạ xin chào Quý khách! 🤖 Em là **Trợ lý du lịch AI của TravelVN**.\n\nEm sẵn sàng hỗ trợ Quý khách 24/7:\n- 🗺️ **Tour du lịch**: Giá tour, lịch trình, ngày khởi hành, số chỗ còn trống.\n- 🚌 **Dịch vụ Đội xe**: Xe 4, 7, 16, 29, 45 chỗ, Limousine cao cấp.\n- 🏨 **Khách sạn & Dịch vụ**: Khách sạn 3★ - 5★, dịch vụ ăn uống các tỉnh thành.\n- 📋 **Chính sách**: Giá vé trẻ em, quy định hoàn tiền khi hủy tour, đổi lịch trình.\n- 💳 **Thanh toán**: Hướng dẫn chuyển khoản VietQR tự động, thanh toán online.\n\nQuý khách muốn tìm tour đi đâu hoặc cần em hỗ trợ thông tin gì ạ?`,
      suggestions: [
        'Tour Phú Quốc giá bao nhiêu?',
        'Có những tour Đà Lạt nào?',
        'Lịch khởi hành tour sắp tới',
        'Bảng giá thuê xe du lịch',
        'Chính sách giá vé trẻ em'
      ]
    };
  }

  // 2. CHÍNH SÁCH GIÁ VÉ TRẺ EM
  if (qLower.includes('trẻ em') || qLower.includes('em bé') || qLower.includes('con nít') || qLower.includes('tuổi')) {
    return {
      reply: `👶 **CHÍNH SÁCH GIÁ VÉ TRẺ EM TẠI TRAVELVN:**\n\nTheo quy định vận hành tour của công ty:\n- 🍼 **Dưới 2 tuổi:** **Miễn phí 100%** giá tour (bố mẹ tự lo ăn uống và vé phát sinh nếu có).\n- 🧒 **Từ 2 đến dưới 5 tuổi:** Tính **50% giá tour người lớn** (có ghế ngồi riêng trên xe, ăn ngủ chung cùng bố mẹ).\n- 👦 **Từ 6 đến dưới 11 tuổi:** Tính **75% giá tour người lớn** (tiêu chuẩn suất ăn riêng, ghế riêng, ngủ chung phòng cùng bố mẹ).\n- 🧑 **Từ 12 tuổi trở lên:** Tính **100% như người lớn** (hưởng đầy đủ dịch vụ giường nằm, phòng riêng).\n\n💡 *Lưu ý: 2 người lớn chỉ được kèm 1 trẻ em diện miễn phí hoặc 50%, từ bé thứ 2 trở đi áp dụng phụ thu phòng đơn hoặc suất 75%.*`,
      suggestions: ['Chính sách hoàn hủy tour', 'Phương thức thanh toán', 'Xem tour trọn gói']
    };
  }

  // 3. CHÍNH SÁCH HOÀN TIỀN / HỦY ĐỔI TOUR
  if (qLower.includes('hủy tour') || qLower.includes('hoàn tiền') || qLower.includes('đổi lịch') || qLower.includes('đổi tour') || qLower.includes('hoàn vé')) {
    return {
      reply: `🔄 **CHÍNH SÁCH HỦY TOUR & HOÀN TIỀN CỦA TRAVELVN:**\n\nHệ thống TravelVN áp dụng quy định bảo vệ quyền lợi khách hàng minh bạch như sau:\n\n1. **Quy định hoàn tiền khi hủy tour:**\n- 🟢 **Hủy trước 7 ngày khởi hành:** **Hoàn tiền 100%** giá trị tour đã thanh toán.\n- 🟡 **Hủy từ 3 đến 6 ngày trước khởi hành:** **Hoàn tiền 50%** (do công ty đã đặt cọc dịch vụ phòng và xe).\n- 🔴 **Hủy dưới 3 ngày trước khởi hành:** Không hoàn lại tiền.\n\n2. **Quy định đổi lịch khởi hành:**\n- 📅 Hỗ trợ đổi ngày khởi hành **miễn phí 1 lần** nếu thông báo trước ít nhất 5 ngày (tùy vào tình trạng còn chỗ của đoàn tiếp theo).\n\n3. **Thời gian nhận tiền hoàn:**\n- Tiền hoàn sẽ được chuyển khoản trực tiếp về tài khoản ngân hàng của Quý khách trong vòng **24 - 48 giờ** làm việc sau khi yêu cầu được duyệt!`,
      suggestions: ['Các tour sắp khởi hành', 'Hình thức thanh toán', 'Tư vấn viên trực tiếp']
    };
  }

  // 4. HÌNH THỨC THANH TOÁN (SEPAY / VIETQR)
  if (qLower.includes('thanh toán') || qLower.includes('chuyển khoản') || qLower.includes('qr') || qLower.includes('sepay') || qLower.includes('ngân hàng')) {
    return {
      reply: `💳 **CÁC PHƯƠNG THỨC THANH TOÁN TẠI TRAVELVN:**\n\nQuý khách có thể lựa chọn 3 hình thức thanh toán tiện lợi và an toàn:\n\n1. ⚡ **Chuyển khoản VietQR Realtime (Tự động 24/7):**\n- Hệ thống tạo mã QR động tích hợp SePay. Quý khách chỉ cần mở ứng dụng ngân hàng quét mã QR, hệ thống sẽ tự động đối soát và kích hoạt đơn đặt tour thành công ngay lập tức (trong 3 giây).\n- Ngân hàng liên kết: **TPBank** (Số tài khoản: \`00000419627\` - DOAN THI TRAM).\n\n2. 💳 **Thẻ ATM / Thẻ quốc tế (Visa, MasterCard):**\n- Hỗ trợ thanh toán bảo mật chuẩn quốc tế qua cổng thanh toán.\n\n3. 🏢 **Thanh toán tiền mặt tại Văn phòng:**\n- Quý khách có thể ghé trực tiếp quầy giao dịch TravelVN để nhận vé và thanh toán trực tiếp.`,
      suggestions: ['Xem các tour đang mở', 'Chính sách hoàn tiền', 'Tư vấn thiết kế tour']
    };
  }

  // 5. THIẾT KẾ TOUR THEO YÊU CẦU (CUSTOM TOUR BUILDER)
  if (qLower.includes('thiết kế tour') || qLower.includes('tour riêng') || qLower.includes('đoàn riêng') || qLower.includes('tour gia đình') || qLower.includes('tự chọn')) {
    return {
      reply: `✨ **DỊCH VỤ THIẾT KẾ TOUR RIÊNG THEO YÊU CẦU:**\n\nTravelVN có công cụ **Tự thiết kế Tour** thông minh dành cho cá nhân, gia đình hoặc đoàn công ty:\n\n- 🎯 **Tùy biến lịch trình:** Tự chọn điểm đến, số ngày, điểm tham quan yêu thích.\n- 🏨 **Tùy chọn tiện ích:** Khách sạn từ 3★ đến Resort 5★ sang trọng.\n- 🚗 **Xe riêng VIP:** Tự chọn loại xe 4, 7, 16, 29, 45 chỗ đời mới theo quy mô đoàn.\n- 💰 **Báo giá tức thì:** Hệ thống tự động tính toán tổng chi phí và gửi bảng dự toán chi tiết trong 2 phút!\n\n👉 Quý khách có thể nhấn vào mục **"Thiết kế tour theo yêu cầu"** trên thanh menu hoặc để lại thông tin để chuyên viên TravelVN lên lịch trình riêng cho đoàn nhé!`,
      suggestions: ['Gửi yêu cầu thiết kế tour', 'Xem các tour cố định', 'Bảng giá thuê xe']
    };
  }

  // 6. DỊCH VỤ THUÊ XE / ĐỘI XE NỘI BỘ
  if (qLower.includes('xe') || qLower.includes('thuê xe') || qLower.includes('4 chỗ') || qLower.includes('7 chỗ') || qLower.includes('16 chỗ') || qLower.includes('29 chỗ') || qLower.includes('45 chỗ') || qLower.includes('limousine')) {
    try {
      const [vehicleRows] = await pool.query(`
        SELECT vehicle_type, seat_capacity, COUNT(*) as total_vehicles
        FROM vehicles
        WHERE status != 'MAINTENANCE'
        GROUP BY vehicle_type, seat_capacity
        ORDER BY seat_capacity ASC
      `);

      let vehicleText = `🚌 **HỆ THỐNG ĐỘI XE DU LỊCH ĐỜI MỚI CỦA TRAVELVN:**\n\nCông ty hiện đang vận hành đội xe chất lượng cao, trang bị đầy đủ máy lạnh, Wifi, ghế ngả cao cấp và tài xế giàu kinh nghiệm:\n\n`;

      if (vehicleRows && vehicleRows.length > 0) {
        vehicleRows.forEach(v => {
          vehicleText += `• **${v.vehicle_type}** (${v.seat_capacity} chỗ): Đang sẵn sàng ${v.total_vehicles} xe phục vụ đoàn.\n`;
        });
      } else {
        vehicleText += `• Xe 4 chỗ, 7 chỗ (Innova, Fortuner, Sedona)\n• Xe 16 chỗ (Ford Transit, Hyundai Solati)\n• Xe 29 chỗ (Thaco Town, Samco)\n• Xe 45 chỗ (Hyundai Universe)\n• Xe Limousine 9 - 11 chỗ hạng thương gia.\n`;
      }

      vehicleText += `\n✨ **Ưu điểm dịch vụ xe:**\n- Xe được bảo dưỡng định kỳ, kiểm tra kỹ thuật an toàn trước mỗi chuyến đi.\n- Tài xế được đào tạo bài bản, nhiệt tình, am hiểu cung đường du lịch.\n- Quý khách có thể đặt xe theo tour hoặc thuê xe riêng kèm tài xế đưa đón sân bay, tham quan.`;

      return {
        reply: vehicleText,
        suggestions: ['Xem các tour có xe đưa đón', 'Tour Đà Lạt', 'Tour Phú Quốc']
      };
    } catch (err) {
      console.error('Lỗi truy vấn xe:', err);
    }
  }

  // 7. LỊCH KHỞI HÀNH SẮP TỚI (DEPARTURES)
  if (qLower.includes('khởi hành') || qLower.includes('lịch đi') || qLower.includes('ngày đi') || qLower.includes('còn chỗ') || qLower.includes('tháng này') || qLower.includes('tháng tới')) {
    try {
      const [depRows] = await pool.query(`
        SELECT d.departure_id, d.tour_id, t.tour_name, t.destination, d.departure_date, d.return_date, 
               d.available_slots, d.max_slots, t.base_price
        FROM departures d
        JOIN tours t ON d.tour_id = t.tour_id
        WHERE d.departure_date >= CURDATE() AND d.status = 'Open' AND t.status = 'Active'
        ORDER BY d.departure_date ASC
        LIMIT 6
      `);

      if (depRows && depRows.length > 0) {
        let depText = `📅 **LỊCH KHỞI HÀNH CÁC TOUR DU LỊCH GẦN NHẤT:**\n\nDưới đây là danh sách các tour đang mở nhận khách sắp tới:\n\n`;
        depRows.forEach((d, idx) => {
          depText += `${idx + 1}. **${d.tour_name}**\n`;
          depText += `   - 🗓️ Ngày khởi hành: **${formatDateVN(d.departure_date)}** ➔ Ngày về: **${formatDateVN(d.return_date)}**\n`;
          depText += `   - 🎟️ Số chỗ còn trống: **${d.available_slots}** / ${d.max_slots} chỗ\n`;
          depText += `   - 💵 Giá trọn gói: **${formatVND(d.base_price)}**/khách\n\n`;
        });
        depText += `👉 Quý khách hãy nhanh tay đặt sớm để giữ chỗ vì số lượng chỗ trống có hạn nhé!`;

        return {
          reply: depText,
          suggestions: ['Đặt tour ngay', 'Chính sách thanh toán', 'Tư vấn trực tiếp']
        };
      }
    } catch (err) {
      console.error('Lỗi truy vấn departures:', err);
    }
  }

  // 8. TÌM KIẾM TOUR THEO ĐỊA DANH HOẶC TỪ KHÓA
  const matchedDest = extractDestination(qLower);
  let tourQuerySql = `
    SELECT tour_id, tour_name, destination, duration_days, base_price, description, status
    FROM tours
    WHERE status = 'Active'
  `;
  const queryParams = [];

  if (matchedDest) {
    tourQuerySql += ` AND (destination LIKE ? OR tour_name LIKE ?)`;
    queryParams.push(`%${matchedDest}%`, `%${matchedDest}%`);
  }

  // Lọc theo ngân sách nếu khách hỏi rẻ nhất
  if (qLower.includes('rẻ nhất') || qLower.includes('giá rẻ') || qLower.includes('tiết kiệm')) {
    tourQuerySql += ` ORDER BY base_price ASC LIMIT 5`;
  } else if (qLower.includes('cao cấp') || qLower.includes('vip') || qLower.includes('đắt nhất')) {
    tourQuerySql += ` ORDER BY base_price DESC LIMIT 5`;
  } else {
    tourQuerySql += ` ORDER BY tour_id DESC LIMIT 5`;
  }

  try {
    const [tours] = await pool.query(tourQuerySql, queryParams);

    if (tours && tours.length > 0) {
      let title = matchedDest 
        ? `🏝️ **DANH SÁCH TOUR DU LỊCH ${matchedDest.toUpperCase()} ĐANG MỞ BÁN:**\n\n`
        : `🌟 **CÁC TOUR DU LỊCH NỔI BẬT ĐANG MỞ BÁN TẠI TRAVELVN:**\n\n`;

      let tourText = title;

      for (let i = 0; i < tours.length; i++) {
        const t = tours[i];
        // Lấy lịch khởi hành gần nhất của tour này
        const [nextDep] = await pool.query(`
          SELECT departure_date, available_slots
          FROM departures
          WHERE tour_id = ? AND departure_date >= CURDATE() AND status = 'Open'
          ORDER BY departure_date ASC LIMIT 1
        `, [t.tour_id]);

        tourText += `### ${i + 1}. [${t.tour_name}](/tour/${t.tour_id})\n`;
        tourText += `• 📍 **Điểm đến:** ${t.destination || 'Việt Nam'} | ⏱️ **Thời lượng:** ${t.duration_days} ngày\n`;
        tourText += `• 💰 **Giá trọn gói:** **${formatVND(t.base_price)}**/khách\n`;
        
        if (nextDep && nextDep.length > 0) {
          tourText += `• 📅 **Khởi hành gần nhất:** **${formatDateVN(nextDep[0].departure_date)}** (Còn ${nextDep[0].available_slots} chỗ)\n`;
        }
        
        if (t.description) {
          const shortDesc = t.description.length > 120 ? t.description.slice(0, 120) + '...' : t.description;
          tourText += `• 📝 *${shortDesc}*\n`;
        }
        tourText += `\n`;
      }

      tourText += `💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt vé trực tuyến ngay!*`;

      return {
        reply: tourText,
        suggestions: [
          matchedDest ? `Lịch trình tour ${matchedDest}` : 'Tour Phú Quốc',
          'Chính sách giá trẻ em',
          'Chính sách hoàn hủy',
          'Thuê xe du lịch'
        ]
      };
    } else if (matchedDest) {
      // Trường hợp địa điểm chưa có tour cố định có sẵn
      return {
        reply: `Dạ hiện tại trên hệ thống chưa có tour cố định sẵn cho **${matchedDest}**, nhưng TravelVN có thể **THIẾT KẾ TOUR RIÊNG THEO YÊU CẦU** đến **${matchedDest}** cho Quý khách và đoàn!\n\nQuý khách chỉ cần cho em biết:\n1. Số lượng người tham gia?\n2. Dự kiến đi bao nhiêu ngày?\n3. Tiêu chuẩn khách sạn (3★, 4★, 5★) và loại xe mong muốn?\n\nChuyên viên của TravelVN sẽ lên ngay lịch trình và bảng báo giá chi tiết trong 5 phút ạ!`,
        suggestions: ['Gửi yêu cầu thiết kế tour', 'Xem các tour Đà Lạt', 'Xem các tour Phú Quốc']
      };
    }
  } catch (err) {
    console.error('Lỗi truy vấn tour:', err);
  }

  // 9. THÔNG TIN CÔNG TY & LIÊN HỆ
  if (qLower.includes('liên hệ') || qLower.includes('hotline') || qLower.includes('địa chỉ') || qLower.includes('công ty') || qLower.includes('ở đâu')) {
    return {
      reply: `🏢 **THÔNG TIN LIÊN HỆ TRAVELVN:**\n\n- 🌐 **Thương hiệu:** TravelVN - Dịch vụ Lữ hành & Vận chuyển Du lịch\n- 📞 **Hotline hỗ trợ 24/7:** \`1900 6868\` - \`0908 123 456\`\n- 📧 **Email:** \`support@travelvn.com\` | \`booking@travelvn.com\`\n- 📍 **Trụ sở chính:** Tòa nhà TravelVN, TP. Hồ Chí Minh\n- ⏰ **Giờ làm việc:** 08:00 - 21:00 (Tất cả các ngày trong tuần, kể cả Lễ/Tết)\n\nNếu Quý khách cần gặp chuyên viên tư vấn trực tiếp, vui lòng bấm vào nút **Message tròn màu xanh** ngay bên dưới em nhé!`,
      suggestions: ['Xem các tour đang hot', 'Chính sách hoàn tiền', 'Bảng giá thuê xe']
    };
  }

  // 10. TRƯỜNG HỢP CÂU HỎI CHUNG / TỰ DO
  return {
    reply: `Dạ em đã ghi nhận câu hỏi của Quý khách: *"${question}"*.\n\n🤖 TravelVN hiện đang cung cấp:\n- Hơn **15+ tour du lịch trọn gói cao cấp** (Phú Quốc, Đà Lạt, Đà Nẵng, Hạ Long, Miền Tây, Tây Nguyên...)\n- Đội xe riêng đời mới từ **4 đến 45 chỗ** và **Limousine VIP**.\n- Hỗ trợ **thanh toán VietQR SePay tự động** trong 3 giây và **hoàn tiền 100%** nếu báo trước 7 ngày.\n\nQuý khách có thể nhập tên địa điểm muốn đi (ví dụ: *"Tour Phú Quốc"*, *"Tour Đà Lạt"*), hoặc chọn một trong các gợi ý bên dưới để em hỗ trợ chi tiết nhé!`,
    suggestions: [
      'Tour Phú Quốc 3N2Đ',
      'Tour Đà Lạt 3N3Đ',
      'Lịch khởi hành gần nhất',
      'Giá thuê xe 7 chỗ & 16 chỗ',
      'Chính sách giá vé trẻ em'
    ]
  };
}

function isGreeting(text) {
  const greetings = ['xin chào', 'chào', 'hello', 'hi', 'alo', 'bạn là ai', 'chào bạn', 'hey', 'ad ơi', 'admin ơi'];
  return greetings.some(g => text === g || text.startsWith(g + ' ') || text.endsWith(' ' + g));
}

function extractDestination(text) {
  const destinations = [
    { key: 'phú quốc', name: 'Phú Quốc' },
    { key: 'phu quoc', name: 'Phú Quốc' },
    { key: 'đà lạt', name: 'Đà Lạt' },
    { key: 'da lat', name: 'Đà Lạt' },
    { key: 'đà nẵng', name: 'Đà Nẵng' },
    { key: 'da nang', name: 'Đà Nẵng' },
    { key: 'nha trang', name: 'Nha Trang' },
    { key: 'hạ long', name: 'Hạ Long' },
    { key: 'ha long', name: 'Hạ Long' },
    { key: 'hà nội', name: 'Hà Nội' },
    { key: 'ha noi', name: 'Hà Nội' },
    { key: 'hội an', name: 'Hội An' },
    { key: 'huế', name: 'Huế' },
    { key: 'miền tây', name: 'Miền Tây' },
    { key: 'cần thơ', name: 'Cần Thơ' },
    { key: 'phan thiết', name: 'Phan Thiết' },
    { key: 'vũng tàu', name: 'Vũng Tàu' },
    { key: 'hồ tràm', name: 'Hồ Tràm' },
    { key: 'măng đen', name: 'Măng Đen' },
    { key: 'tây nguyên', name: 'Tây Nguyên' },
    { key: 'tây ninh', name: 'Tây Ninh' },
    { key: 'ninh bình', name: 'Ninh Bình' },
    { key: 'sa pa', name: 'Sa Pa' },
    { key: 'sapa', name: 'Sa Pa' },
    { key: 'hà giang', name: 'Hà Giang' },
    { key: 'quy nhơn', name: 'Quy Nhơn' },
    { key: 'phú yên', name: 'Phú Yên' },
    { key: 'đồng tháp', name: 'Đồng Tháp' },
    { key: 'tam chúc', name: 'Chùa Tam Chúc' }
  ];

  for (const item of destinations) {
    if (text.includes(item.key)) {
      return item.name;
    }
  }
  return null;
}

module.exports = {
  processAIQuery
};
