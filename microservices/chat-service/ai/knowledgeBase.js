/**
 * Knowledge Base & Lightweight RAG Retriever for TravelVN ERP
 * Contains verified company policies, pricing rules, payment, cancellation, FAQ, and service standards.
 */

function normalizeVi(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const KNOWLEDGE_CHUNKS = [
  {
    id: 'age_pricing_policy',
    title: 'Chính sách giá tour theo độ tuổi & phụ thu phòng đơn',
    keywords: [
      'gia tre em', 'tre em', 'em be', 'nguoi lon', 'do tuoi', 'bao nhieu tuoi',
      'tinh gia', 'phu thu', 'phong don', 'tre nho', '5 tuoi', '11 tuoi', '12 tuoi', '2 tuoi',
      've tre em', 'gia ve tre em', 'tre em bao nhieu'
    ],
    content: [
      'Chính sách giá vé tour theo độ tuổi tại TravelVN ERP:',
      '- Người lớn (từ 12 tuổi trở lên): 100% giá tour niêm yết.',
      '- Trẻ em (từ 5 đến 11 tuổi): 70% giá người lớn (có suất ăn riêng, ghế ngồi riêng trên xe, ngủ chung giường với bố mẹ/người lớn đi kèm).',
      '- Trẻ nhỏ (từ 2 đến 4 tuổi): 50% giá người lớn (có ghế ngồi riêng trên xe, ngủ chung giường với người lớn).',
      '- Em bé (dưới 2 tuổi): Miễn phí vé tour (bố mẹ tự lo chi phí ăn uống hoặc các dịch vụ phát sinh cho bé).',
      '- Phụ thu phòng đơn: Áp dụng khi khách hàng từ 12 tuổi trở lên có nhu cầu ngủ riêng 1 phòng. Mức phụ thu hiển thị minh bạch tại bước nhập danh sách hành khách và bảng tính tiền của từng tour.'
    ].join('\n')
  },
  {
    id: 'cancellation_refund_policy',
    title: 'Chính sách hủy tour, đổi lịch khởi hành và hoàn tiền',
    keywords: [
      'huy tour', 'hoan tien', 'doi lich', 'chinh sach huy', 'huy don', 'hoan phi',
      'mat phi', 'tra tien', 'huy ve', 'khong di duoc', 'bao luu', 'tu dong huy',
      'phi huy', 'hoan bao nhieu'
    ],
    content: [
      'Chính sách hủy tour, đổi lịch & hoàn tiền TravelVN ERP:',
      '- Hủy trước ngày khởi hành từ 15 ngày trở lên: Hoàn 90% tổng giá trị đơn hàng.',
      '- Hủy trước từ 7 đến 14 ngày: Hoàn 70% tổng giá trị đơn hàng.',
      '- Hủy trước từ 3 đến 6 ngày: Hoàn 50% tổng giá trị đơn hàng.',
      '- Hủy trong vòng dưới 48 giờ trước giờ khởi hành: Không hoàn tiền (0%).',
      '- Đổi lịch khởi hành: Khách hàng được hỗ trợ đổi sang đợt khởi hành khác cùng tour hoặc tương đương nếu thông báo trước ít nhất 7 ngày và đợt mới còn đủ chỗ trống.',
      '- Lưu ý thanh toán VietQR / SePay: Hệ thống giữ chỗ tạm thời trong vòng 10 phút. Nếu quá 10 phút chưa thanh toán thành công, đơn hàng sẽ tự động bị hủy để nhả chỗ cho khách hàng khác và hệ thống tự động gửi email thông báo hủy đơn về email khách hàng.'
    ].join('\n')
  },
  {
    id: 'payment_policy',
    title: 'Phương thức và quy trình thanh toán trực tuyến VietQR / SePay',
    keywords: [
      'thanh toan', 'chuyen khoan', 'vietqr', 'sepay', 'qr', 'tien mat', 'the',
      'dat coc', 'hoa don', 'xac nhan', 'ngan hang', 'tpbank', '10 phut', 'ma qr',
      'chuyen khoan ngan hang', 'thanh toan nhu the nao'
    ],
    content: [
      'Phương thức thanh toán tại TravelVN ERP:',
      '- Chuyển khoản ngân hàng siêu tốc qua VietQR / SePay: Ngay sau khi bấm đặt tour, hệ thống hiển thị mã VietQR kèm số tiền chính xác và nội dung chuyển khoản tự động. Sau khi khách quét mã thanh toán, hệ thống đối soát tự động qua ngân hàng trong vòng 3 - 5 giây và chuyển trạng thái sang "Đã thanh toán", đồng thời gửi email vé xác nhận.',
      '- Thời gian giữ chỗ: 10 phút đếm ngược kể từ thời điểm tạo đơn.',
      '- Thanh toán tiền mặt: Áp dụng trực tiếp tại các quầy giao dịch TravelVN ERP.',
      '- Tra cứu thanh toán: Quý khách có thể xem lại mã đơn, trạng thái thanh toán và chi tiết vé bất kỳ lúc nào tại mục "Đơn đặt tour của tôi" (/my-bookings).'
    ].join('\n')
  },
  {
    id: 'pickup_service_standards',
    title: 'Điểm đón, đội xe phương tiện và tiêu chuẩn phục vụ',
    keywords: [
      'diem don', 'don khach', 'xe', 'phuong tien', 'huong dan vien', 'hdv',
      'bao hiem', 'khach san', 'an uong', 'chat luong', 'dich vu', 'thue xe',
      'don o dau', 'xe may cho', 'tai xe', 'tieu chuan'
    ],
    content: [
      'Tiêu chuẩn phục vụ & Đội xe TravelVN ERP:',
      '- Điểm đón khách: Các điểm tập trung trung tâm thuận tiện tại TP.HCM (Quận 1, Hàng Xanh, Bến xe Miền Đông, Bến xe Miền Tây, Sân bay Tân Sơn Nhất), Hà Nội (Nhà hát Lớn, Sân bay Nội Bài), Đà Nẵng (Sân bay Đà Nẵng, trung tâm Hải Châu)... Khách chọn điểm đón khi điền thông tin đặt tour.',
      '- Các dòng xe du lịch đang phục vụ tại TravelVN ERP:',
      '  • Xe 4 - 7 chỗ: Toyota Innova, Fortuner, Kia Carnival/Sedona.',
      '  • Xe 16 chỗ: Ford Transit, Hyundai Solati đời mới ghế da ngả êm ái.',
      '  • Xe 29 chỗ: Thaco Town, Isuzu Samco máy lạnh êm, khoang hành lý rộng rãi.',
      '  • Xe 45 chỗ: Hyundai Universe tiêu chuẩn du lịch cao cấp.',
      '  • Xe Limousine VIP: 9 - 11 chỗ hạng thương gia.',
      '- Tiện ích trên xe: 100% xe đời mới trang bị máy lạnh mát sâu, ghế ngả bọc da cao cấp, wifi tốc độ cao, micro hướng dẫn viên, nước suối khăn lạnh và bảo hiểm hành khách trọn gói; tài xế lịch sự, nhiều năm kinh nghiệm lái xe an toàn.',
      '- Hướng dẫn viên (HDV): Có thẻ hướng dẫn viên quốc gia, chuyên nghiệp, nhiệt tình, am hiểu văn hóa - lịch sử - ẩm thực và chăm sóc chu đáo từng thành viên trong đoàn suốt hành trình.',
      '- Bảo hiểm du lịch: Bảo hiểm du lịch nội địa theo quy định pháp luật được bao gồm trọn gói trong giá vé tour.',
      '- Khách sạn & Ẩm thực: Khách sạn 3★ - 5★ tiện nghi; các bữa ăn chính mang đậm hương vị đặc sản địa phương được nêu rõ trong lịch trình chi tiết.'
    ].join('\n')
  },
  {
    id: 'custom_tour_service',
    title: 'Dịch vụ thiết kế tour riêng theo yêu cầu (Custom Tour Builder)',
    keywords: [
      'tour rieng', 'thiet ke tour', 'theo yeu cau', 'custom tour', 'doan rieng',
      'cong ty', 'team building', 'gia dinh', 'tu chon', 'bao gia', 'tour doanh nghiep',
      'dat tour cho cong ty', 'build tour'
    ],
    content: [
      'Dịch vụ Thiết kế Tour riêng (Custom Tour) tại TravelVN ERP:',
      '- Dành cho khách đoàn, cơ quan, doanh nghiệp, team building, gia đình từ 5 khách trở lên có nhu cầu thiết kế hành trình riêng biệt.',
      '- Quý khách chủ động chọn điểm đến, ngày khởi hành, số lượng khách, khách sạn mong muốn, loại phương tiện và ngân sách.',
      '- Cách thực hiện: Truy cập trang "Thiết kế Tour riêng" (/build-tour) trên website để tạo yêu cầu. Đội ngũ điều hành TravelVN sẽ tiếp nhận, tối ưu lịch trình và gửi báo giá chi tiết trong vòng 24 giờ.',
      '- Sau khi quý khách duyệt báo giá, đơn hàng tour riêng sẽ được tạo tự động và thanh toán tiện lợi ngay trên hệ thống.'
    ].join('\n')
  },
  {
    id: 'travel_documents_and_luggage',
    title: 'Giấy tờ tùy thân cần mang theo và quy định hành lý khi đi tour',
    keywords: [
      'giay to', 'cccd', 'cmnd', 'ho chieu', 'passport', 'giay khai sinh',
      'hanh ly', 'mang gi', 'chuan bi gi', 'trang phuc', 'do dac'
    ],
    content: [
      'Quy định giấy tờ tùy thân & Hành lý khi tham gia tour:',
      '- Người lớn (từ 14 tuổi trở lên): Bắt buộc mang theo CCCD gắn chip hoặc Hộ chiếu (Passport) bản gốc còn hạn sử dụng để làm thủ tục khách sạn và lên máy bay/tàu.',
      '- Trẻ em (dưới 14 tuổi): Mang theo Giấy khai sinh bản gốc hoặc bản sao trích lục có dấu mộc đỏ hợp lệ.',
      '- Khách nước ngoài / Việt kiều: Hộ chiếu và Visa/Giấy miễn thị thực nhập cảnh Việt Nam còn hạn.',
      '- Hành lý: Mang hành lý gọn gàng (khoảng 1 vali/túi xách + 1 balo nhỏ cho mỗi khách). Chuẩn bị trang phục phù hợp với thời tiết (áo ấm khi đi Đà Lạt/Sapa/Hà Giang, trang phục lịch sự kín đáo khi viếng chùa Bà Đen Tây Ninh, chùa Tam Chúc, Cố đô Huế, đồ bơi khi đi Phú Quốc/Nha Trang).'
    ].join('\n')
  },
  {
    id: 'vat_invoice_policy',
    title: 'Chính sách xuất hóa đơn giá trị gia tăng (VAT / Hóa đơn điện tử)',
    keywords: [
      'hoa don', 'vat', 'xuat hoa don', 'hoa don dien tu', 'thue', 'mst',
      'ma so thue', 'doanh nghiep', 'cong ty', 'hoa don do'
    ],
    content: [
      'Chính sách xuất hóa đơn VAT tại TravelVN ERP:',
      '- TravelVN hỗ trợ xuất hóa đơn điện tử GTGT (VAT) hợp lệ đầy đủ cho các công ty, doanh nghiệp và đoàn thể có nhu cầu.',
      '- Khách hàng chỉ cần cung cấp Tên công ty, Mã số thuế và Địa chỉ đăng ký kinh doanh tại phần ghi chú khi đặt tour hoặc gửi cho nhân viên tư vấn qua chat/hotline.',
      '- Hóa đơn điện tử được gửi trực tiếp về email khách hàng trong vòng 24 - 48 giờ sau khi thanh toán thành công.'
    ].join('\n')
  },
  {
    id: 'booking_guide_and_contact',
    title: 'Hướng dẫn đặt tour, tra cứu đơn hàng và kết nối nhân viên tư vấn',
    keywords: [
      'dat tour', 'cach dat', 'huong dan', 'lien he', 'hotline', 'so dien thoai',
      'email', 'van phong', 'nhan vien', 'ho tro', 'tu van', 'tai khoan', 'dang nhap',
      'don hang cua toi', 'tra cuu don', 'gap nhan vien', 'nhan vien that'
    ],
    content: [
      'Hướng dẫn đặt tour & Kênh liên hệ hỗ trợ TravelVN ERP:',
      '- Các bước đặt tour nhanh: 1. Chọn tour ưng ý trên website -> 2. Chọn đợt khởi hành còn chỗ -> 3. Nhập danh sách hành khách -> 4. Quét mã VietQR chuyển khoản ngân hàng -> 5. Nhận email vé tour xác nhận tức thì.',
      '- Tra cứu đơn hàng: Khách hàng đã đăng nhập có thể vào mục "Đơn đặt tour của tôi" (/my-bookings) để kiểm tra mã đơn, lịch khởi hành, số khách và trạng thái vé.',
      '- Thẩm quyền của Trợ lý AI: AI chỉ đóng vai trò tư vấn, giải đáp thắc mắc, kiểm tra lịch trình, giá vé và tình trạng chỗ trống theo thời gian thực; AI không tự ý can thiệp tạo đơn, sửa đổi thông tin hay hoàn/hủy đơn của quý khách.',
      '- Kết nối nhân viên thật: Nếu cần giải quyết khiếu nại, yêu cầu hỗ trợ đặc biệt hoặc đặt tour cho đoàn lớn, quý khách có thể bấm nút "Liên hệ nhân viên" ngay trong khung chat này để gặp tư vấn viên trực tiếp.'
    ].join('\n')
  }
];

/**
 * Retrieve top-K relevant knowledge chunks for a user query.
 * @param {string} query
 * @param {number} topK
 * @returns {Array<{id: string, title: string, content: string, score: number}>}
 */
function retrieveKnowledge(query, topK = 3) {
  const normQuery = normalizeVi(query);
  if (!normQuery) return [];

  const queryTokens = normQuery.split(' ').filter((t) => t.length >= 2);
  const scored = KNOWLEDGE_CHUNKS.map((chunk) => {
    let score = 0;
    const normTitle = normalizeVi(chunk.title);
    const normContent = normalizeVi(chunk.content);

    for (const kw of chunk.keywords) {
      if (normQuery.includes(kw)) {
        score += 6;
      }
    }
    for (const token of queryTokens) {
      if (normTitle.includes(token)) score += 2;
      if (normContent.includes(token)) score += 1;
    }
    return { ...chunk, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

module.exports = {
  KNOWLEDGE_CHUNKS,
  retrieveKnowledge,
  normalizeVi
};
