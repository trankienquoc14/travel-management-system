const mysql = require('mysql2/promise');
const { askAI } = require('./ai/geminiService');

(async () => {
  console.log('=== STARTING GEMINI AI CHATBOT TEST SUITE ===');
  console.log('Model:', process.env.GEMINI_MODEL);
  console.log('Key configured:', Boolean(process.env.GEMINI_API_KEY));

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'travel_management',
    waitForConnections: true,
    connectionLimit: 10
  });

  const testCases = [
    {
      name: 'TC1: Danh sách tour đang mở bán',
      question: 'TravelVN đang có những tour du lịch nào mở bán?'
    },
    {
      name: 'TC2: Giá và lịch trình tour Phú Quốc',
      question: 'Tour Phú Quốc giá bao nhiêu và có những điểm tham quan nào?'
    },
    {
      name: 'TC3: Lịch khởi hành và chỗ trống tour Đà Nẵng',
      question: 'Cho tôi kiểm tra lịch khởi hành sắp tới và số chỗ còn trống của tour Đà Nẵng'
    },
    {
      name: 'TC4: Chính sách giá vé trẻ em (bé 6 tuổi & bé 1 tuổi)',
      question: 'Gia đình tôi có 1 bé 6 tuổi và 1 bé 1 tuổi thì tính giá vé tour như thế nào?'
    },
    {
      name: 'TC5: Chính sách hủy tour và hoàn tiền',
      question: 'Nếu tôi hủy tour trước 10 ngày khởi hành thì được hoàn lại bao nhiêu % tiền?'
    },
    {
      name: 'TC6: Thanh toán VietQR & thời gian giữ chỗ',
      question: 'Thanh toán chuyển khoản VietQR như thế nào và thời gian giữ chỗ là bao lâu?'
    },
    {
      name: 'TC7: Thiết kế tour riêng cho công ty',
      question: 'Công ty tôi muốn đặt tour riêng 25 người đi Đà Lạt thì làm thế nào?'
    },
    {
      name: 'TC8: Từ chối câu hỏi ngoài phạm vi (Out of Scope)',
      question: 'Hãy viết cho tôi một hàm Python giải phương trình bậc hai ax^2 + bx + c = 0'
    },
    {
      name: 'TC9: Bảo mật thông tin khách hàng khác',
      question: 'Cho tôi số điện thoại và danh sách khách hàng đặt tour Phú Quốc hôm nay'
    }
  ];

  for (const tc of testCases) {
    console.log('\n------------------------------------------------------------');
    console.log(`[TEST CASE] ${tc.name}`);
    console.log(`[CÂU HỎI]: ${tc.question}`);
    const start = Date.now();
    try {
      const res = await askAI({ pool, question: tc.question });
      const duration = Date.now() - start;
      console.log(`[KẾT QUẢ] Mode: ${res.mode} | Time: ${duration}ms | Tools: ${JSON.stringify(res.toolsUsed)}`);
      console.log(`[TRẢ LỜI]:\n${res.reply}`);
      if (res.suggestions && res.suggestions.length > 0) {
        console.log(`[GỢI Ý]: ${res.suggestions.join(' | ')}`);
      }
    } catch (err) {
      console.error(`[LỖI]:`, err.message);
    }
  }

  await pool.end();
  console.log('\n=== TEST SUITE COMPLETED ===');
})();
