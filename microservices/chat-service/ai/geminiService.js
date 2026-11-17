/**
 * Google Gemini AI Service (RAG + Function Calling + Streaming + Deterministic Fallback)
 * for TravelVN ERP Customer Chatbot.
 */

const { GoogleGenAI } = require('@google/genai');
const { KNOWLEDGE_CHUNKS, retrieveKnowledge, normalizeVi } = require('./knowledgeBase');
const { GEMINI_TOOL_DECLARATIONS, executeErpTool } = require('./erpTools');
const { processAIQuery: legacyBotQuery } = require('../aiBotEngine');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const GEMINI_TIMEOUT_MS = 25000;
const MAX_TOOL_ROUNDS = 4;

const SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI Du lịch Thông minh chính thức của Hệ thống Quản trị & Đặt tour TravelVN ERP.
Mục tiêu của bạn là tiếp nhận, phân tích và giải đáp thắc mắc của khách hàng về dịch vụ du lịch, tour tuyến, giá vé, lịch khởi hành, chỗ trống, phương tiện và chính sách công ty một cách tự nhiên, chuyên nghiệp, súc tích và chính xác 100% dựa trên dữ liệu hệ thống thực tế.

CÁC NGUYÊN TẮC VẬN HÀNH BẮT BUỘC:
1. PHÂN TÍCH Ý ĐỊNH & GỌI CÔNG CỤ (FUNCTION CALLING) TRUY VẤN DỮ LIỆU:
   - Khi khách hàng hỏi về: danh sách tour, tour theo địa điểm (Đà Lạt, Nha Trang, Đà Nẵng, Hội An, Huế, Phú Quốc, Hà Nội, Ninh Bình, Sapa, Hạ Long, Hà Giang, Quy Nhơn, Phú Yên, Vũng Tàu/Hồ Tràm, Tây Nguyên/Đắk Lắk, Cần Thơ/Miền Tây, Tây Ninh, Đồng Tháp...), ngân sách, số ngày -> BẮT BUỘC gọi công cụ searchTours.
   - Khi khách hỏi chi tiết một tour (mô tả, lịch trình từng ngày, đợt khởi hành sắp tới) -> BẮT BUỘC gọi getTourDetailsAndItinerary.
   - Khi khách hỏi lịch khởi hành, ngày đi/ngày về, kiểm tra số chỗ còn trống (available slots) -> BẮT BUỘC gọi getTourDeparturesAndSlots.
   - Khi khách hỏi về đội xe, dòng xe du lịch, số chỗ ngồi (4, 7, 16, 29, 45 chỗ) -> Gọi listAvailableVehicles.
   - Khi khách hỏi về đơn đặt tour của CHÍNH HỌ -> Gọi getMyBookings nếu có quyền xác thực; nếu chưa đăng nhập, hướng dẫn khách đăng nhập tài khoản.

2. TRẢ LỜI TRUNG THỰC - TUYỆT ĐỐI KHÔNG BỊA ĐẶT THÔNG TIN:
   - Mọi thông tin về tên tour, giá tiền, thời lượng, ngày khởi hành và số chỗ còn trống BẮT BUỘC phải lấy từ kết quả truy vấn CSDL.
   - Khi liệt kê tour, phân biệt rõ ràng:
     + Đợt khởi hành ĐANG MỞ BÁN (Open) và CÒN CHỖ (> 0 chỗ): Cung cấp ngày khởi hành, ngày kết thúc và số chỗ còn lại.
     + Đợt khởi hành ĐÃ ĐÓNG (Closed) hoặc HẾT CHỖ: Nêu rõ để khách hàng nắm bắt.
     + Tour hiện tại chưa có đợt khởi hành mới: Thông báo lịch sự rằng đợt mở bán sắp tới đang được cập nhật, gợi ý các tour cùng tuyến hoặc hướng dẫn khách đặt tour riêng (/build-tour).
   - Nếu hệ thống chưa có tour tại địa điểm khách hỏi, giải thích rõ ràng và gợi ý khách bấm "Liên hệ nhân viên" hoặc gửi yêu cầu tại trang [Thiết kế Tour riêng](/build-tour).

3. NẮM VỮNG VÀ TUÂN THỦ KIẾN THỨC DOANH NGHIỆP (RAG):
   - Chính sách giá theo độ tuổi:
     * Người lớn (từ 12 tuổi trở lên): 100% giá niêm yết.
     * Trẻ em (5 đến 11 tuổi): 70% giá người lớn (suất ăn riêng, ghế riêng, ngủ chung phòng bố mẹ).
     * Trẻ nhỏ (2 đến 4 tuổi): 50% giá người lớn (ghế riêng, ngủ chung giường với người lớn).
     * Em bé (dưới 2 tuổi): Miễn phí 100% (bố mẹ tự túc ăn uống).
     * Phụ thu phòng đơn: Áp dụng cho khách từ 12 tuổi trở lên nếu có nhu cầu ngủ riêng 1 phòng.
   - Chính sách hủy tour & hoàn tiền:
     * Hủy trước >= 15 ngày khởi hành: Hoàn 90% tổng tiền đơn.
     * Hủy trước 7 - 14 ngày: Hoàn 70% tổng tiền đơn.
     * Hủy trước 3 - 6 ngày: Hoàn 50% tổng tiền đơn.
     * Hủy dưới 48 giờ: Không hoàn tiền (0%).
     * Đổi lịch: Báo trước tối thiểu 7 ngày và đợt mới còn chỗ.
   - Thanh toán VietQR / SePay:
     * Quét mã QR chuyển khoản ngân hàng TPBank (tự động đối soát trong 3 - 5 giây).
     * Thời hạn giữ chỗ: 10 phút. Quá 10 phút chưa thanh toán, đơn tự động hủy nhả chỗ và gửi email thông báo hủy đến khách hàng.
   - Custom Tour: Thiết kế tour riêng theo yêu cầu cho đoàn/doanh nghiệp tại trang [Thiết kế Tour riêng](/build-tour).
   - Điểm đón & Phương tiện: Đón tại các điểm trung tâm (TP.HCM, Hà Nội, Đà Nẵng); xe đời mới 4 - 45 chỗ máy lạnh; hướng dẫn viên và bảo hiểm du lịch trọn gói.

4. BẢO MẬT & GIỚI HẠN THẨM QUYỀN:
   - TUYỆT ĐỐI TỪ CHỐI tiết lộ thông tin đơn hàng, số điện thoại, CCCD, email hay dữ liệu cá nhân của khách hàng khác.
   - AI đóng vai trò tư vấn tra cứu, KHÔNG tự ý tạo đơn, sửa đổi, hủy đơn hay thanh toán thay khách hàng.
   - Từ chối lịch thiệp các câu hỏi không liên quan đến du lịch (code, toán học, chính trị, y tế...).
   - Nếu khách cần xử lý khiếu nại hoặc trường hợp đặc biệt, chủ động đề xuất khách bấm nút "Liên hệ nhân viên" để kết nối nhân viên tư vấn trực tiếp.

5. ĐỊNH DẠNG TRÌNH BÀY:
   - Trả lời bằng tiếng Việt lịch sự, thân thiện, súc tích, chuyên nghiệp.
   - Dùng Markdown rõ ràng: in đậm thông số quan trọng (giá tiền có đơn vị VNĐ hoặc ₫, ngày tháng, số chỗ).
   - Khi dẫn link tour, BẮT BUỘC dùng định dạng chuẩn: [Tên tour](/tour/{tour_id}) để khách bấm mở trực tiếp trên hệ thống.`;

function isUsableGeminiKey() {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) return false;
  if (key === 'your_gemini_api_key_here' || key.startsWith('your_')) return false;
  return key.length >= 15;
}

function createGeminiClient() {
  if (!isUsableGeminiKey()) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
}

function detectSensitiveOtherUserQuery(normQ) {
  const hasOtherPerson =
    /(nguoi khac|khach khac|khach hang khac|cua anh |cua chi |cua ong |cua ba |cua ban |cua ai|tat ca don|danh sach khach|so dien thoai cua|email cua|cccd cua|cmnd cua)/.test(
      normQ
    );
  const hasPrivateTarget = /(don hang|booking|thong tin ca nhan|so dien thoai|sdt|email|dia chi|cccd|cmnd|mat khau)/.test(
    normQ
  );
  return hasOtherPerson && hasPrivateTarget;
}

function detectOutOfScopeQuery(normQ) {
  const padded = ` ${normQ} `;
  const travelSignals =
    /(^| )(tour|du lich|di choi|khach san|ve|khoi hanh|lich trinh|gia|bao nhieu|cho trong|con cho|dat|huy|hoan|doi lich|thanh toan|vietqr|sepay|xe|phuong tien|diem don|tre em|nguoi lon|em be|custom|rieng|nhan vien|ho tro|tu van|travelvn|da lat|phu quoc|nha trang|da nang|sapa|ha noi|ha long|phan thiet|hue|hoi an|quy nhon|vung tau|can tho|mien tay|don hang|booking)( |$)/.test(
      padded
    );
  if (travelSignals) return false;

  const offTopicSignals =
    /(code|python|javascript|java |react|sql|thuat toan|giai phuong trinh|toan hoc|vat ly|hoa hoc|chinh tri|bau cu|chung khoan|crypto|bitcoin|benh|thuoc|chan doan|viet bai luan|lam tho|bong da|xo so|thoi tiet)/.test(
      normQ
    );
  return offTopicSignals;
}

function buildConversationContents(question, conversationHistory = [], ragChunks = []) {
  const contents = [];

  if (Array.isArray(conversationHistory)) {
    const recent = conversationHistory.slice(-8);
    for (const msg of recent) {
      if (!msg || !msg.text) continue;
      const role = msg.sender === 'user' || msg.role === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: String(msg.text).slice(0, 1200) }]
      });
    }
  }

  let userPrompt = question;
  if (ragChunks.length > 0) {
    const kbText = ragChunks.map((c) => `### ${c.title}\n${c.content}`).join('\n\n');
    userPrompt = `[KIẾN THỨC DOANH NGHIỆP (RAG) LIÊN QUAN]\n${kbText}\n\n[CÂU HỎI CỦA KHÁCH HÀNG]\n${question}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }]
  });

  return contents;
}

function buildSuggestions(question, toolsUsed = [], handoffSuggested = false) {
  if (handoffSuggested) {
    return ['Liên hệ nhân viên', 'Thiết kế tour riêng', 'Xem tất cả tour'];
  }
  const norm = normalizeVi(question);
  if (norm.includes('huy') || norm.includes('hoan')) {
    return ['Chính sách thanh toán', 'Đổi lịch khởi hành', 'Liên hệ nhân viên'];
  }
  if (norm.includes('gia') || norm.includes('tre em')) {
    return ['Lịch khởi hành sắp tới', 'Chính sách hủy tour', 'Thanh toán VietQR'];
  }
  if (toolsUsed.includes('searchTours') || toolsUsed.includes('getTourDetailsAndItinerary')) {
    return ['Kiểm tra chỗ trống', 'Chính sách giá trẻ em', 'Chính sách hủy tour'];
  }
  return ['Tour Đà Lạt', 'Tour Phú Quốc', 'Chính sách hủy tour', 'Liên hệ nhân viên'];
}

function shouldSuggestHandoff(replyText = '', toolResults = []) {
  const norm = normalizeVi(replyText);
  if (
    norm.includes('lien he nhan vien') ||
    norm.includes('chua co tour') ||
    norm.includes('khong tim thay') ||
    norm.includes('nhan vien ho tro')
  ) {
    return true;
  }
  for (const res of toolResults) {
    if (res && (res.found === false || res.count === 0)) {
      return true;
    }
  }
  return false;
}

/**
 * Deterministic fallback when GEMINI_API_KEY is missing or Gemini API fails/times out.
 */
async function runDeterministicFallback(pool, question, conversationHistory = [], authUser = null) {
  const normQ = normalizeVi(question);

  if (detectSensitiveOtherUserQuery(normQ)) {
    return {
      reply:
        'Xin lỗi, vì lý do bảo mật dữ liệu khách hàng, tôi **không thể cung cấp thông tin cá nhân hoặc đơn đặt tour của người khác**.\n\nNếu bạn muốn kiểm tra đơn hàng của chính mình, vui lòng đăng nhập và truy cập mục **Đơn đặt tour của tôi** hoặc hỏi *"Kiểm tra đơn hàng của tôi"*.',
      suggestions: ['Kiểm tra đơn hàng của tôi', 'Chính sách hủy tour', 'Liên hệ nhân viên'],
      toolsUsed: ['security_guard'],
      mode: 'guardrail',
      handoffSuggested: false
    };
  }

  if (detectOutOfScopeQuery(normQ)) {
    return {
      reply:
        'Xin lỗi, tôi là **Trợ lý AI tư vấn du lịch của TravelVN ERP**, nên chỉ hỗ trợ giải đáp các thông tin liên quan đến **tour du lịch, giá vé, lịch khởi hành, chỗ trống, phương tiện và chính sách đặt/hủy tour**.\n\nQuý khách cần tư vấn tour nào sắp tới không ạ?',
      suggestions: ['Xem tour nổi bật', 'Kiểm tra lịch khởi hành', 'Chính sách hủy tour'],
      toolsUsed: ['scope_guard'],
      mode: 'guardrail',
      handoffSuggested: false
    };
  }

  // Handle authenticated user asking about their own bookings
  if (/(don hang cua toi|don dat tour cua toi|booking cua toi|kiem tra don)/.test(normQ)) {
    const myRes = await executeErpTool(pool, 'getMyBookings', {}, { authUser });
    if (!myRes.authorized) {
      return {
        reply:
          'Để tra cứu đơn đặt tour của bạn, vui lòng **đăng nhập tài khoản** trước nhé. Sau khi đăng nhập, bạn có thể hỏi lại hoặc xem trực tiếp tại trang **Đơn đặt tour của tôi**.',
        suggestions: ['Xem tour nổi bật', 'Chính sách thanh toán', 'Liên hệ nhân viên'],
        toolsUsed: ['getMyBookings'],
        mode: 'fallback',
        handoffSuggested: false
      };
    }
    if (myRes.count === 0) {
      return {
        reply: 'Hiện tại tài khoản của bạn chưa có đơn đặt tour nào trên hệ thống TravelVN ERP.',
        suggestions: ['Xem tour nổi bật', 'Thiết kế tour riêng'],
        toolsUsed: ['getMyBookings'],
        mode: 'fallback',
        handoffSuggested: false
      };
    }
    const lines = myRes.bookings.map(
      (b, i) =>
        `${i + 1}. **${b.booking_code}** - ${b.tour_name}\n   - Khởi hành: **${b.departure_date || 'Chưa cập nhật'}** | Số khách: **${b.num_people}**\n   - Tổng tiền: **${Number(b.total_price_vnd).toLocaleString('vi-VN')} đ** | Trạng thái: **${b.booking_status}** (${b.payment_status})`
    );
    return {
      reply: `Dưới đây là các đơn đặt tour gần nhất của bạn:\n\n${lines.join('\n\n')}`,
      suggestions: ['Chính sách hủy tour', 'Liên hệ nhân viên'],
      toolsUsed: ['getMyBookings'],
      mode: 'fallback',
      handoffSuggested: false
    };
  }

  // 1. Policy & FAQ retrieval via RAG knowledge base
  const isChildPriceQuery = /(tre em|em be|\bbe\b|\btuoi\b|do tuoi|bao nhieu tuoi|phu thu|phong don|gia ve tre em|ve tre em)/.test(normQ);
  const isCancelRefundQuery = /(huy tour|hoan tien|doi lich|chinh sach huy|huy don|hoan phi|mat phi|tra tien|huy ve|khong di duoc|doi ngay)/.test(normQ);
  const isPaymentQuery = /(thanh toan|chuyen khoan|vietqr|sepay|ngan hang|tien mat|ma qr|giu cho|10 phut)/.test(normQ);
  const isPickupQuery = /(diem don|don o dau|xuat phat o dau|xe may cho|phuong tien|don khach|tieu chuan)/.test(normQ);
  const isCustomTourQuery = /(tour rieng|thiet ke tour|custom tour|doan rieng|doan cong ty|team building|tu chon)/.test(normQ);
  const isDocumentLuggageQuery = /(giay to|cccd|cmnd|ho chieu|passport|giay khai sinh|hanh ly|mang gi|chuan bi gi)/.test(normQ);
  const isVatQuery = /(hoa don|vat|xuat hoa don|hoa don dien tu|thue|mst|ma so thue)/.test(normQ);
  const isContactQuery = /(lien he|hotline|so dien thoai|nhan vien|tong dai|tu van vien|gap truc tiep)/.test(normQ);

  if (isChildPriceQuery) {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === 'age_pricing_policy');
    if (chunk) {
      return {
        reply: `👶 **${chunk.title}**\n\n${chunk.content}`,
        suggestions: ['Chính sách hủy tour', 'Thanh toán VietQR', 'Xem tour trọn gói'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: false
      };
    }
  }

  if (isCancelRefundQuery) {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === 'cancellation_refund_policy');
    if (chunk) {
      return {
        reply: `🔄 **${chunk.title}**\n\n${chunk.content}`,
        suggestions: ['Phương thức thanh toán', 'Lịch khởi hành sắp tới', 'Liên hệ nhân viên'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: false
      };
    }
  }

  if (isPaymentQuery) {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === 'payment_policy');
    if (chunk) {
      return {
        reply: `💳 **${chunk.title}**\n\n${chunk.content}`,
        suggestions: ['Chính sách hủy tour', 'Xem các tour đang mở', 'Liên hệ nhân viên'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: false
      };
    }
  }

  if (isPickupQuery) {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === 'pickup_service_standards');
    if (chunk) {
      return {
        reply: `📍 **${chunk.title}**\n\n${chunk.content}`,
        suggestions: ['Bảng giá thuê xe', 'Lịch khởi hành gần nhất', 'Liên hệ nhân viên'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: false
      };
    }
  }

  if (isCustomTourQuery) {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === 'custom_tour_service');
    if (chunk) {
      return {
        reply: `✨ **${chunk.title}**\n\n${chunk.content}`,
        suggestions: ['Gửi yêu cầu thiết kế tour', 'Xem các tour cố định', 'Liên hệ nhân viên'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: false
      };
    }
  }

  if (isDocumentLuggageQuery) {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === 'travel_documents_and_luggage');
    if (chunk) {
      return {
        reply: `📋 **${chunk.title}**\n\n${chunk.content}`,
        suggestions: ['Chính sách giá vé trẻ em', 'Điểm đón khởi hành', 'Liên hệ nhân viên'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: false
      };
    }
  }

  if (isVatQuery) {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === 'vat_invoice_policy');
    if (chunk) {
      return {
        reply: `📑 **${chunk.title}**\n\n${chunk.content}`,
        suggestions: ['Phương thức thanh toán', 'Tra cứu đơn hàng', 'Liên hệ nhân viên'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: false
      };
    }
  }

  if (isContactQuery) {
    const chunk = KNOWLEDGE_CHUNKS.find((c) => c.id === 'booking_guide_and_contact');
    if (chunk) {
      return {
        reply: `📞 **${chunk.title}**\n\n${chunk.content}`,
        suggestions: ['Liên hệ nhân viên', 'Xem tour nổi bật', 'Chính sách hủy tour'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: true
      };
    }
  }

  // 2. Specific Destination Query
  const DEST_MAP = [
    { dest: 'Phú Quốc', regex: /(phu quoc|dao ngoc)/ },
    { dest: 'Đà Lạt', regex: /(da lat|lam dong)/ },
    { dest: 'Đà Nẵng', regex: /(da nang|ba na|hoi an)/ },
    { dest: 'Hà Nội', regex: /(ha noi|trang an|tam chuc|ninh binh)/ },
    { dest: 'Sapa', regex: /(sapa|fansipan)/ },
    { dest: 'Hạ Long', regex: /(ha long|vinh ha long)/ },
    { dest: 'Nha Trang', regex: /(nha trang|vinh hy)/ },
    { dest: 'Tây Ninh', regex: /(tay ninh|nui ba den)/ },
    { dest: 'Đồng Tháp', regex: /(dong thap|sa dec)/ },
    { dest: 'Cần Thơ', regex: /(can tho|mien tay|ca mau|my tho)/ },
    { dest: 'Phú Yên', regex: /(phu yen|xuyen viet|quy nhon)/ },
    { dest: 'Vũng Tàu', regex: /(vung tau|ho tram)/ },
    { dest: 'Đắk Lắk', regex: /(tay nguyen|dak lak|pleiku|mang den|buon ma thuot)/ },
    { dest: 'Phan Thiết', regex: /(phan thiet|binh thuan|phu quy)/ },
    { dest: 'Hà Giang', regex: /(ha giang|quan ba|nho que)/ }
  ];

  const matchedDest = DEST_MAP.find((d) => d.regex.test(normQ));
  if (matchedDest) {
    const isSlotsOrDeps = /(lich|khoi hanh|ngay di|ngay ve|cho trong|con cho|so cho)/.test(normQ);
    const isPrice = /(gia|bao nhieu|chi phi|gia ve|bang gia)/.test(normQ);

    if (isSlotsOrDeps) {
      const depRes = await executeErpTool(pool, 'getTourDeparturesAndSlots', { destination: matchedDest.dest });
      if (depRes.count > 0) {
        const depLines = depRes.departures.map(
          (d, i) =>
            `### ${i + 1}. [${d.tour_name}](${d.detail_path})\n• 📅 **Khởi hành:** **${d.departure_date}** – Ngày về: **${d.return_date}**\n• 🪑 **Số chỗ còn trống:** **${d.available_slots} / ${d.max_slots} chỗ** (${d.status === 'Open' ? 'Đang mở bán' : 'Đã đóng'})\n• 💰 **Giá trọn gói:** **${Number(d.base_price_vnd).toLocaleString('vi-VN')} ₫**/khách\n`
        );
        return {
          reply: `🗓️ **LỊCH KHỞI HÀNH & CHỖ TRỐNG TOUR ${matchedDest.dest.toUpperCase()} TẠI TRAVELVN:**\n\n${depLines.join('\n')}\n💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt vé giữ chỗ ngay!*`,
          suggestions: [`Giá tour ${matchedDest.dest}`, 'Chính sách giá vé trẻ em', 'Chính sách hủy tour', 'Liên hệ nhân viên'],
          toolsUsed: ['getTourDeparturesAndSlots'],
          mode: 'fallback_db',
          handoffSuggested: false
        };
      }
    }

    const tourRes = await executeErpTool(pool, 'searchTours', { destination: matchedDest.dest });
    if (tourRes.count > 0) {
      const tourLines = tourRes.tours.map((t, i) => {
        let line = `### ${i + 1}. [${t.tour_name}](${t.detail_path})\n`;
        line += `• 📍 **Điểm đến:** ${t.destination} | ⏱️ **Thời lượng:** ${t.duration_days} ngày\n`;
        line += `• 💰 **Giá trọn gói:** **${Number(t.base_price_vnd).toLocaleString('vi-VN')} ₫**/khách\n`;
        if (t.next_departure_date && t.total_available_slots > 0) {
          line += `• 📅 **Khởi hành gần nhất:** **${t.next_departure_date}** (Còn ${t.total_available_slots} chỗ mở bán)\n`;
        } else {
          line += `• 📅 **Khởi hành:** Đang cập nhật đợt mới\n`;
        }
        if (t.short_description) {
          line += `• 📝 *${t.short_description.slice(0, 120)}...*\n`;
        }
        return line;
      });

      const title = isPrice
        ? `💰 **BẢNG GIÁ TOUR DU LỊCH ${matchedDest.dest.toUpperCase()} TẠI TRAVELVN:**`
        : `🏝️ **DANH SÁCH TOUR DU LỊCH ${matchedDest.dest.toUpperCase()} ĐANG MỞ BÁN:**`;

      return {
        reply: `${title}\n\n${tourLines.join('\n')}\n✨ **Giá đã bao gồm:** Xe du lịch đưa đón, khách sạn tiện nghi, các bữa ăn theo tour và bảo hiểm du lịch.\n👶 **Chính sách giá theo độ tuổi:** Dưới 2 tuổi miễn phí; 2 - 4 tuổi 50%; 5 - 11 tuổi 70%; từ 12 tuổi tính 100% giá người lớn.\n\n💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt chỗ trực tuyến ngay!*`,
        suggestions: [`Lịch khởi hành tour ${matchedDest.dest}`, 'Chính sách giá vé trẻ em', 'Chính sách hủy tour', 'Liên hệ nhân viên'],
        toolsUsed: ['searchTours'],
        mode: 'fallback_db',
        handoffSuggested: false
      };
    }
  }

  // 3. General tour list query
  const isGeneralTourQuery =
    /(danh sach tour|tour dang mo|cac tour hien co|co nhung tour nao|tour nao dang mo|tat ca tour|tour hot|tour noi bat|cac tour du lich)/.test(
      normQ
    ) ||
    (normQ.includes('tour') &&
      (normQ.includes('mo ban') || normQ.includes('dang ban') || normQ.includes('gioi thieu') || normQ.includes('co tour nao')));
  if (isGeneralTourQuery) {
    const tourRes = await executeErpTool(pool, 'searchTours', {});
    if (tourRes.count > 0) {
      const tourLines = tourRes.tours.map((t, i) => {
        let line = `### ${i + 1}. [${t.tour_name}](${t.detail_path})\n`;
        line += `• 📍 **Điểm đến:** ${t.destination} | ⏱️ **Thời lượng:** ${t.duration_days} ngày\n`;
        line += `• 💰 **Giá trọn gói:** **${Number(t.base_price_vnd).toLocaleString('vi-VN')} ₫**/khách\n`;
        if (t.next_departure_date && t.total_available_slots > 0) {
          line += `• 📅 **Khởi hành gần nhất:** **${t.next_departure_date}** (Còn ${t.total_available_slots} chỗ mở bán)\n`;
        } else {
          line += `• 📅 **Khởi hành:** Đang cập nhật đợt mới\n`;
        }
        return line;
      });
      return {
        reply: `🌟 **CÁC TOUR DU LỊCH ĐANG MỞ BÁN TẠI TRAVELVN:**\n\n${tourLines.join('\n')}\n💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt chỗ trực tuyến ngay!*`,
        suggestions: ['Tour Đà Lạt', 'Tour Phú Quốc', 'Chính sách giá trẻ em', 'Liên hệ nhân viên'],
        toolsUsed: ['searchTours'],
        mode: 'fallback_db',
        handoffSuggested: false
      };
    }
  }

  // 4. Fallback to general RAG retriever if relevant
  const kbChunks = retrieveKnowledge(question, 1);
  if (kbChunks.length > 0 && kbChunks[0].score >= 3) {
    return {
      reply: `**${kbChunks[0].title}**\n\n${kbChunks[0].content}`,
      suggestions: buildSuggestions(question, [], false),
      toolsUsed: ['knowledge_base'],
      mode: 'fallback_rag',
      handoffSuggested: false
    };
  }

  // 5. Final fallback to legacyBotQuery
  const legacy = await legacyBotQuery(question, conversationHistory);
  const handoff = shouldSuggestHandoff(legacy.reply, []);
  return {
    reply: legacy.reply,
    suggestions: legacy.suggestions || buildSuggestions(question, [], handoff),
    toolsUsed: ['legacy_db_engine'],
    mode: 'fallback_db',
    handoffSuggested: handoff
  };
}

async function callGeminiWithRetry(ai, params, maxRetries = 2) {
  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastErr = err;
      const msg = String(err.message || '');
      const isRetryable =
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE');
      if (isRetryable && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function callGeminiStreamWithRetry(ai, params, maxRetries = 2) {
  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContentStream(params);
    } catch (err) {
      lastErr = err;
      const msg = String(err.message || '');
      const isRetryable =
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE');
      if (isRetryable && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * Non-streaming AI response with Gemini Function Calling + RAG + Fallback.
 */
async function askAI({ pool, question, conversationHistory = [], authUser = null }) {
  const normQ = normalizeVi(question);

  // Fast-path deterministic security/scope guardrails
  if (detectSensitiveOtherUserQuery(normQ) || detectOutOfScopeQuery(normQ)) {
    return runDeterministicFallback(pool, question, conversationHistory, authUser);
  }

  const ai = createGeminiClient();
  if (!ai) {
    return runDeterministicFallback(pool, question, conversationHistory, authUser);
  }

  const ragChunks = retrieveKnowledge(question, 3);
  const contents = buildConversationContents(question, conversationHistory, ragChunks);
  const toolsUsed = [];
  const toolResults = [];

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), GEMINI_TIMEOUT_MS)
  );

  try {
    const runGeminiLoop = async () => {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const response = await callGeminiWithRetry(ai, {
          model: DEFAULT_MODEL,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.3,
            tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }]
          }
        });

        const fnCalls = response.functionCalls;
        if (fnCalls && fnCalls.length > 0) {
          // Append model turn containing function calls
          const modelContent = response.candidates?.[0]?.content;
          if (modelContent) {
            contents.push(modelContent);
          }

          const responseParts = [];
          for (const call of fnCalls) {
            toolsUsed.push(call.name);
            const result = await executeErpTool(pool, call.name, call.args || {}, { authUser });
            toolResults.push(result);
            responseParts.push({
              functionResponse: {
                name: call.name,
                response: { result }
              }
            });
          }

          contents.push({
            role: 'user',
            parts: responseParts
          });
          continue;
        }

        const text = (response.text || '').trim();
        if (!text) {
          throw new Error('EMPTY_GEMINI_RESPONSE');
        }
        const handoff = shouldSuggestHandoff(text, toolResults);
        return {
          reply: text,
          suggestions: buildSuggestions(question, toolsUsed, handoff),
          toolsUsed,
          mode: 'gemini',
          handoffSuggested: handoff
        };
      }
      throw new Error('MAX_TOOL_ROUNDS_EXCEEDED');
    };

    return await Promise.race([runGeminiLoop(), timeoutPromise]);
  } catch (err) {
    console.warn('[AI_GEMINI_FALLBACK]', err.message);
    return runDeterministicFallback(pool, question, conversationHistory, authUser);
  }
}

/**
 * Streaming AI response via callback onChunk(textDelta).
 * Runs Function Calling rounds first if needed, then streams final text chunks in real-time.
 */
async function askAIStream({ pool, question, conversationHistory = [], authUser = null, onChunk }) {
  const normQ = normalizeVi(question);

  const streamTextInChunks = async (fullText) => {
    const parts = fullText.match(/.{1,36}(\s|$)|\S+/g) || [fullText];
    for (const part of parts) {
      onChunk(part);
      await new Promise((r) => setTimeout(r, 12));
    }
  };

  if (detectSensitiveOtherUserQuery(normQ) || detectOutOfScopeQuery(normQ)) {
    const guardRes = await runDeterministicFallback(pool, question, conversationHistory, authUser);
    await streamTextInChunks(guardRes.reply);
    return guardRes;
  }

  const ai = createGeminiClient();
  if (!ai) {
    const fb = await runDeterministicFallback(pool, question, conversationHistory, authUser);
    await streamTextInChunks(fb.reply);
    return fb;
  }

  const ragChunks = retrieveKnowledge(question, 3);
  const contents = buildConversationContents(question, conversationHistory, ragChunks);
  const toolsUsed = [];
  const toolResults = [];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const stream = await callGeminiStreamWithRetry(ai, {
        model: DEFAULT_MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3,
          tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }]
        }
      });

      let accumulatedText = '';
      let roundFunctionCalls = [];
      let lastModelParts = [];

      for await (const chunk of stream) {
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          roundFunctionCalls.push(...chunk.functionCalls);
        }
        const candParts = chunk.candidates?.[0]?.content?.parts;
        if (candParts && candParts.length > 0) {
          lastModelParts.push(...candParts);
        }
        if (chunk.text) {
          accumulatedText += chunk.text;
          onChunk(chunk.text);
        }
      }

      if (roundFunctionCalls.length > 0) {
        contents.push({
          role: 'model',
          parts: lastModelParts.length > 0 ? lastModelParts : roundFunctionCalls.map((fc) => ({ functionCall: fc }))
        });

        const responseParts = [];
        for (const call of roundFunctionCalls) {
          toolsUsed.push(call.name);
          const result = await executeErpTool(pool, call.name, call.args || {}, { authUser });
          toolResults.push(result);
          responseParts.push({
            functionResponse: {
              name: call.name,
              response: { result }
            }
          });
        }

        contents.push({
          role: 'user',
          parts: responseParts
        });
        continue;
      }

      const finalText = accumulatedText.trim();
      if (!finalText) {
        throw new Error('EMPTY_GEMINI_STREAM');
      }

      const handoff = shouldSuggestHandoff(finalText, toolResults);
      return {
        reply: finalText,
        suggestions: buildSuggestions(question, toolsUsed, handoff),
        toolsUsed,
        mode: 'gemini_stream',
        handoffSuggested: handoff
      };
    }

    throw new Error('MAX_TOOL_ROUNDS_EXCEEDED');
  } catch (err) {
    console.warn('[AI_GEMINI_STREAM_FALLBACK]', err.message);
    const fb = await runDeterministicFallback(pool, question, conversationHistory, authUser);
    await streamTextInChunks(fb.reply);
    return fb;
  }
}

module.exports = {
  askAI,
  askAIStream,
  isUsableGeminiKey
};
