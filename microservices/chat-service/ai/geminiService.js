/**
 * Google Gemini AI Service (RAG + Function Calling + Streaming + Deterministic Fallback)
 * for TravelVN ERP Customer Chatbot.
 */

let GoogleGenAI = null;
try {
  GoogleGenAI = require('@google/genai').GoogleGenAI;
} catch (e) {
  console.warn('⚠️ [@google/genai] chưa được cài đặt, Chatbot sẽ dùng deterministic fallback.');
}
const { KNOWLEDGE_CHUNKS, retrieveKnowledge, normalizeVi } = require('./knowledgeBase');
const { GEMINI_TOOL_DECLARATIONS, executeErpTool } = require('./erpTools');
const { processAIQuery: legacyBotQuery } = require('../aiBotEngine');

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
].filter(Boolean);
const DEFAULT_MODEL = CANDIDATE_MODELS[0] || 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 25000;
const MAX_TOOL_ROUNDS = 4;

const SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI Du lịch Thông minh chính thức của Hệ thống Quản trị & Đặt tour TravelVN ERP.
Mục tiêu của bạn là tiếp nhận, phân tích và giải đáp thắc mắc của khách hàng về dịch vụ du lịch, tour tuyến, giá vé, lịch khởi hành, chỗ trống, phương tiện và chính sách công ty một cách tự nhiên, chuyên nghiệp, súc tích và chính xác 100% dựa trên dữ liệu hệ thống thực tế.

CÁC NGUYÊN TẮC VẬN HÀNH BẮT BUỘC:
1. PHÂN TÍCH Ý ĐỊNH & GỌI CÔNG CỤ (FUNCTION CALLING) TRUY VẤN DỮ LIỆU:
   - Khi khách hàng hỏi về: danh sách tour, tour theo địa điểm, ngân sách, số ngày, khoảng cách, vùng miền -> BẮT BUỘC gọi công cụ searchTours.
   - TRÍCH XUẤT NGÂN SÁCH (RẤT QUAN TRỌNG):
     * Khi khách nêu ngân sách (ví dụ: "ngân sách 5 triệu", "dưới 4tr", "tầm 3 củ", "không quá 6.000.000đ", "5000k"): BẮT BUỘC quy đổi ra số nguyên VNĐ (5.000.000 -> maxPrice: 5000000) và truyền vào tham số maxPrice của searchTours.
     * TUYỆT ĐỐI KHÔNG đề xuất tour có giá bán vượt quá ngân sách khách yêu cầu mà coi như phù hợp. Nếu không có tour nào thỏa mãn mức giá đó, phải giải thích rõ ràng và gợi ý các tour có giá thấp nhất hiện tại hoặc hướng dẫn khách đặt tour riêng (/build-tour).
   - TRÍCH XUẤT THỜI GIAN & KHOẢNG CÁCH:
     * Khách hỏi "du lịch xa", "đi xa", "dài ngày", "tuyến xa" -> truyền minDays: 3 vào searchTours.
     * Khách hỏi "du lịch gần", "đi gần", "ngắn ngày", "cuối tuần", "trong ngày" -> truyền maxDays: 2 vào searchTours.
     * Khách nêu số ngày cụ thể (ví dụ: "3 ngày 2 đêm", "4 ngày") -> truyền minDays và maxDays tương ứng.
   - TRÍCH XUẤT VÙNG MIỀN:
     * Khách hỏi Miền Bắc, Miền Trung, Miền Nam, Miền Tây, Tây Nguyên, Tour Biển -> truyền tham số region tương ứng ('north', 'central', 'highland', 'south', 'beach').
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
  if (!GoogleGenAI) return false;
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

function extractBudgetFromText(rawText = '') {
  const text = rawText.toLowerCase();

  // Pattern A: "3tr5", "3 củ 5", "3tr2", "3cu5" -> 3.5M, 3.2M
  const compoundRegex = /(\d+)\s*(?:tr|trieu|triệu|củ|cu)\s*(\d+)\b/i;
  const compMatch = text.match(compoundRegex);
  if (compMatch) {
    const main = parseInt(compMatch[1], 10);
    const sub = parseInt(compMatch[2], 10);
    const fraction = sub >= 10 ? sub / 100 : sub / 10;
    return Math.round((main + fraction) * 1000000);
  }

  // Pattern B: "5 triệu", "5 trieu", "5tr", "5 tr", "5 củ", "5 cu", "5.5 triệu", "5,5tr"
  const millionRegex = /(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu|tr|củ|cu)\b/i;
  const millionMatch = text.match(millionRegex);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      return Math.round(num * 1000000);
    }
  }

  // Pattern C: "5000k", "3500 k"
  const kRegex = /(\d+(?:[.,]\d+)?)\s*k\b/i;
  const kMatch = text.match(kRegex);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      return Math.round(num * 1000);
    }
  }

  // Pattern D: "5.000.000", "5,000,000", "5000000"
  const fullNumRegex = /(?:ngân sách|budget|tầm|khoảng|dưới|tối đa|giá)?\s*(\d{1,3}(?:[.,]\d{3}){1,3}|\d{6,8})\s*(?:đ|vnd|dong|vnđ)?/i;
  const fullMatch = text.match(fullNumRegex);
  if (fullMatch && fullMatch[1]) {
    const cleanNum = parseInt(fullMatch[1].replace(/[.,]/g, ''), 10);
    if (!isNaN(cleanNum) && cleanNum >= 100000) {
      return cleanNum;
    }
  }

  return null;
}

function parseCustomerTourQuery(rawQuestion = '', normQ = '') {
  const rawLower = rawQuestion.toLowerCase();
  const budget = extractBudgetFromText(rawQuestion);

  const isCheapQuery =
    /(re nhat|gia re|tiet kiem|binh dan|gia tot|sinh vien)/.test(normQ) ||
    /(rẻ nhất|giá rẻ|tiết kiệm|bình dân|giá tốt|sinh viên)/i.test(rawQuestion);

  // Duration & Distance
  let minDays = null;
  let maxDays = null;
  const daysMatch = rawLower.match(/(\d+)\s*(?:ngày|ngay|n\d*d|n\b)/i);
  if (daysMatch) {
    const d = parseInt(daysMatch[1], 10);
    if (!isNaN(d) && d > 0) {
      minDays = d;
      maxDays = d;
    }
  }

  const isFar =
    /(du lich xa|di xa|dai ngay|tuyen xa|xuyen viet)/.test(normQ) ||
    /(du lịch xa|đi xa|dài ngày|tuyến xa|xuyên việt)/i.test(rawQuestion);
  if (isFar && !minDays) {
    minDays = 3;
  }

  const isNear =
    /(du lich gan|di gan|trong ngay|ngan ngay|cuoi tuan)/.test(normQ) ||
    /(du lịch gần|đi gần|trong ngày|ngắn ngày|cuối tuần)/i.test(rawQuestion);
  if (isNear && !maxDays) {
    maxDays = 2;
  }

  // Regions
  let region = null;
  let regionTitle = '';
  if (/(mien bac|phia bac|vung bac)/.test(normQ)) {
    region = 'north';
    regionTitle = 'MIỀN BẮC';
  } else if (/(mien trung)/.test(normQ)) {
    region = 'central';
    regionTitle = 'MIỀN TRUNG';
  } else if (/(tay nguyen)/.test(normQ)) {
    region = 'highland';
    regionTitle = 'TÂY NGUYÊN';
  } else if (/(mien nam|mien tay|song nuoc)/.test(normQ)) {
    region = 'south';
    regionTitle = 'MIỀN TÂY / MIỀN NAM';
  } else if (/(bien|dao|tam bien|nghi duong bien)/.test(normQ)) {
    region = 'beach';
    regionTitle = 'BIỂN ĐẢO';
  }

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
    { dest: 'Đắk Lắk', regex: /(dak lak|pleiku|mang den|buon ma thuot)/ },
    { dest: 'Phan Thiết', regex: /(phan thiet|binh thuan|phu quy|mui ne)/ },
    { dest: 'Hà Giang', regex: /(ha giang|quan ba|nho que)/ }
  ];

  const matchedDest = DEST_MAP.find((d) => d.regex.test(normQ));

  const isSlotsOrDeps = /(lich|khoi hanh|ngay di|ngay ve|cho trong|con cho|so cho)/.test(normQ);
  const isPrice = /(gia|bao nhieu|chi phi|gia ve|bang gia)/.test(normQ);
  const isItinerary = /(lich trinh|di dau|chuong trinh|chi tiet)/.test(normQ);

  const isGeneralTourQuery =
    /(danh sach tour|tour dang mo|cac tour hien co|co nhung tour nao|tour nao dang mo|tat ca tour|tour hot|tour noi bat|cac tour du lich)/.test(
      normQ
    ) ||
    (normQ.includes('tour') &&
      (normQ.includes('mo ban') || normQ.includes('dang ban') || normQ.includes('gioi thieu') || normQ.includes('co tour nao')));

  return {
    budget,
    isCheapQuery,
    duration: { minDays, maxDays, isFar, isNear },
    region,
    regionTitle,
    matchedDest,
    isSlotsOrDeps,
    isPrice,
    isItinerary,
    isGeneralTourQuery
  };
}

function extractFamilyComposition(rawText = '', normQ = '') {
  const text = rawText.toLowerCase();

  let adultCount = null;
  const adultMatch = text.match(/(\d+)\s*(?:người lớn|nguoi lon|ng lớn|ng lon|khách lớn|vé người lớn)/i);
  if (adultMatch) {
    adultCount = parseInt(adultMatch[1], 10);
  }

  const children = [];
  const childRegex = /(\d+)?\s*(?:bé|be|trẻ\s*em|tre\s*em|trẻ\s*nhỏ|tre\s*nho|trẻ|tre|cháu|chau|con|em\s*bé|em\s*be)\s*(\d+(?:[.,]\d+)?)\s*(?:tuổi|tuoi|\bt\b)/gi;
  let match;
  while ((match = childRegex.exec(text)) !== null) {
    const count = match[1] ? parseInt(match[1], 10) : 1;
    const age = parseFloat(match[2].replace(',', '.'));
    if (!isNaN(age)) {
      children.push({ count, age });
    }
  }

  return {
    adultCount,
    children,
    hasFamilyCalculation: adultCount !== null && (children.length > 0 || /(tính tiền|tổng tiền|tổng chi phí|hết bao nhiêu|tất cả bao nhiêu)/.test(normQ))
  };
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

  // 1. Family Price Calculation & Child Age Queries
  const familyComp = extractFamilyComposition(question, normQ);
  if (familyComp.hasFamilyCalculation) {
    const matchedDest = [
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
      { dest: 'Đắk Lắk', regex: /(dak lak|pleiku|mang den|buon ma thuot)/ },
      { dest: 'Phan Thiết', regex: /(phan thiet|binh thuan|phu quy|mui ne)/ },
      { dest: 'Hà Giang', regex: /(ha giang|quan ba|nho que)/ }
    ].find((d) => d.regex.test(normQ));

    const tourRes = await executeErpTool(pool, 'searchTours', {
      destination: matchedDest ? matchedDest.dest : undefined
    });

    if (tourRes.count > 0) {
      const tour = tourRes.tours[0];
      const basePrice = Number(tour.base_price_vnd || 0);
      let total = 0;
      const lines = [];

      const adultCount = familyComp.adultCount || 2;
      const adultTotal = adultCount * basePrice;
      total += adultTotal;
      lines.push(
        `• 🧑 **${adultCount} Người lớn (100%):** ${adultCount} × ${basePrice.toLocaleString('vi-VN')} ₫ = **${adultTotal.toLocaleString('vi-VN')} ₫**`
      );

      for (const c of familyComp.children) {
        const age = c.age;
        const count = c.count || 1;
        let rate = 1;
        let group = '';
        if (age < 2) {
          rate = 0;
          group = `Em bé ${age} tuổi (Dưới 2 tuổi - Miễn phí 100%)`;
        } else if (age < 5) {
          rate = 0.5;
          group = `Trẻ nhỏ ${age} tuổi (2 - 4 tuổi - 50%)`;
        } else if (age < 12) {
          rate = 0.7;
          group = `Trẻ em ${age} tuổi (5 - 11 tuổi - 70%)`;
        } else {
          rate = 1.0;
          group = `Trẻ ${age} tuổi (Từ 12 tuổi trở lên - 100%)`;
        }

        const pricePerChild = Math.round(basePrice * rate);
        const childTotal = pricePerChild * count;
        total += childTotal;
        lines.push(
          `• 👶 **${count} ${group}:** ${count} × ${pricePerChild.toLocaleString('vi-VN')} ₫ = **${childTotal.toLocaleString('vi-VN')} ₫**`
        );
      }

      const reply =
        `💰 **BẢNG DỰ TOÁN CHI PHÍ TOUR CHO GIA ĐÌNH BẠN:**\n\n` +
        `🏝️ **Tour:** [${tour.tour_name}](${tour.detail_path})\n` +
        `💵 **Giá vé niêm yết người lớn:** **${basePrice.toLocaleString('vi-VN')} ₫**/khách\n\n` +
        `📋 **Chi tiết từng thành viên:**\n` +
        `${lines.join('\n')}\n\n` +
        `--------------------------------------------------\n` +
        `👉 **TỔNG CHI PHÍ DỰ TÍNH:** **${total.toLocaleString('vi-VN')} ₫**\n\n` +
        `✨ **Giá đã bao gồm:** Toàn bộ xe du lịch đời mới đưa đón, khách sạn tiện nghi, các bữa ăn trọn gói theo tour, vé tham quan và bảo hiểm du lịch.\n` +
        `💡 *Quý khách có thể bấm trực tiếp vào tên tour ở trên để kiểm tra lịch khởi hành và tiến hành đặt vé giữ chỗ trực tuyến!*`;

      return {
        reply,
        suggestions: [`Lịch khởi hành tour ${tour.destination}`, 'Chính sách hủy tour', 'Thanh toán VietQR', 'Liên hệ nhân viên'],
        toolsUsed: ['searchTours', 'family_calculator'],
        mode: 'fallback_calculator',
        handoffSuggested: false
      };
    }
  }

  // If specific child age mentioned (e.g. "bé 6 tuổi", "trẻ 3 tuổi")
  if (familyComp.children.length > 0 && /(tuoi|ve|gia|tinh|bao nhieu)/.test(normQ)) {
    const c = familyComp.children[0];
    const age = c.age;
    let groupName = '';
    let rate = 100;
    let service = '';

    if (age < 2) {
      groupName = 'Em bé (dưới 2 tuổi)';
      rate = 0;
      service = 'Được **miễn phí 100%** vé tour (bố mẹ tự túc chi phí ăn uống và dịch vụ phát sinh cho bé)';
    } else if (age < 5) {
      groupName = 'Trẻ nhỏ (từ 2 đến 4 tuổi)';
      rate = 50;
      service = 'Tính **50% giá vé người lớn** (có ghế ngồi riêng trên xe du lịch, ngủ chung giường với bố mẹ/người lớn đi kèm)';
    } else if (age < 12) {
      groupName = 'Trẻ em (từ 5 đến 11 tuổi)';
      rate = 70;
      service = 'Tính **70% giá vé người lớn** (có suất ăn riêng, ghế ngồi riêng trên xe du lịch, ngủ chung giường với bố mẹ)';
    } else {
      groupName = 'Người lớn (từ 12 tuổi trở lên)';
      rate = 100;
      service = 'Tính **100% giá vé người lớn** (hưởng đầy đủ các dịch vụ ăn uống, ghế ngồi, vé tham quan)';
    }

    const reply =
      `👶 **CHÍNH SÁCH GIÁ VÉ CHO BÉ ${age} TUỔI TẠI TRAVELVN:**\n\n` +
      `Theo quy định của hệ thống, bé **${age} tuổi** thuộc diện **${groupName}**:\n` +
      `• 🎟️ **Mức tính vé:** **${rate}% giá vé người lớn**.\n` +
      `• 🍽️ **Tiêu chuẩn dịch vụ:** ${service}.\n` +
      `• 🛏️ **Quy định chỗ ngủ:** Ngủ chung phòng và chung giường với người lớn đi kèm (nếu gia đình có nhu cầu ngủ riêng 1 phòng sẽ áp dụng phụ thu phòng đơn).\n\n` +
      `📋 *Bảng tóm tắt các độ tuổi khác để Quý khách tiện tham khảo:* \n` +
      `- 🍼 **Dưới 2 tuổi:** Miễn phí (0%)\n` +
      `- 🧒 **2 đến 4 tuổi:** 50% giá người lớn\n` +
      `- 👦 **5 đến 11 tuổi:** 70% giá người lớn\n` +
      `- 🧑 **Từ 12 tuổi trở lên:** 100% giá người lớn`;

    return {
      reply,
      suggestions: ['Xem các tour đang mở', 'Chính sách hủy tour', 'Liên hệ nhân viên'],
      toolsUsed: ['knowledge_base'],
      mode: 'fallback_rag',
      handoffSuggested: false
    };
  }

  // 2. Cancellation & Refund Policy with Specific Days
  const isCancelRefundQuery = /(huy tour|hoan tien|doi lich|chinh sach huy|huy don|hoan phi|mat phi|tra tien|huy ve|khong di duoc|doi ngay)/.test(normQ);
  if (isCancelRefundQuery) {
    const daysMatch = question.match(/(\d+)\s*(?:ngày|ngay)/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      let refundPercent = 0;
      let bracketDesc = '';

      if (days >= 15) {
        refundPercent = 90;
        bracketDesc = 'trước ngày khởi hành từ 15 ngày trở lên';
      } else if (days >= 7) {
        refundPercent = 70;
        bracketDesc = 'trước ngày khởi hành từ 7 đến 14 ngày';
      } else if (days >= 3) {
        refundPercent = 50;
        bracketDesc = 'trước ngày khởi hành từ 3 đến 6 ngày';
      } else {
        refundPercent = 0;
        bracketDesc = 'dưới 48 giờ trước giờ khởi hành';
      }

      const reply =
        `🔄 **QUY ĐỊNH HOÀN TIỀN KHI HỦY TOUR TRƯỚC ${days} NGÀY:**\n\n` +
        `Theo chính sách của TravelVN, mốc **${days} ngày trước khởi hành** thuộc khung **${bracketDesc}**:\n` +
        `• 🟢 **Mức hoàn tiền nhận được:** **${refundPercent}% tổng giá trị đơn hàng** (mức phí hủy áp dụng là ${100 - refundPercent}%).\n` +
        `• ⏱️ **Hình thức hoàn tiền:** Tiền hoàn sẽ được chuyển khoản trực tiếp qua ngân hàng cho Quý khách trong vòng 1 - 3 ngày làm việc.\n\n` +
        `📋 *Bảng khung chính sách hoàn tiền tổng thể tại TravelVN:*\n` +
        `- 🟢 **Trước >= 15 ngày:** Hoàn **90%** (phí hủy 10%)\n` +
        `- 🟡 **Từ 7 đến 14 ngày:** Hoàn **70%** (phí hủy 30%)\n` +
        `- 🟠 **Từ 3 đến 6 ngày:** Hoàn **50%** (phí hủy 50%)\n` +
        `- 🔴 **Dưới 48 giờ:** Không hoàn tiền (0%)\n` +
        `- 📅 **Đổi lịch khởi hành:** Báo trước tối thiểu 7 ngày và đợt mới còn chỗ trống.`;

      return {
        reply,
        suggestions: ['Đổi lịch khởi hành', 'Phương thức thanh toán', 'Liên hệ nhân viên'],
        toolsUsed: ['knowledge_base'],
        mode: 'fallback_rag',
        handoffSuggested: false
      };
    }

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

  // 3. Other Policies & FAQs
  const isChildPriceQuery = /(tre em|em be|\bbe\b|\btuoi\b|do tuoi|bao nhieu tuoi|phu thu|phong don|gia ve tre em|ve tre em)/.test(normQ);
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

  // 2. Parse specific user criteria (Budget, Duration, Distance, Region, Destination)
  const parsed = parseCustomerTourQuery(question, normQ);

  const formatTourList = (tours) => {
    return tours
      .map((t, i) => {
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
      })
      .join('\n');
  };

  // 2.1 Customer specifies budget, distance (far/near), specific duration, region, or cheap preference:
  const hasSpecificConstraints =
    parsed.budget ||
    parsed.isCheapQuery ||
    parsed.duration.isFar ||
    parsed.duration.isNear ||
    parsed.duration.minDays ||
    parsed.region;

  if (hasSpecificConstraints) {
    const tourRes = await executeErpTool(pool, 'searchTours', {
      destination: parsed.matchedDest?.dest,
      maxPrice: parsed.budget,
      minDays: parsed.duration.minDays,
      maxDays: parsed.duration.maxDays,
      region: parsed.region,
      isFar: parsed.duration.isFar,
      isNear: parsed.duration.isNear,
      isCheapSort: parsed.isCheapQuery || Boolean(parsed.budget)
    });

    if (tourRes.count > 0) {
      let title = '🌟 **DANH SÁCH TOUR DU LỊCH PHÙ HỢP:**';
      if (parsed.budget && parsed.duration.isFar) {
        title = `🎯 **CÁC TOUR DU LỊCH ĐI XA / DÀI NGÀY PHÙ HỢP VỚI NGÂN SÁCH DƯỚI ${parsed.budget.toLocaleString('vi-VN')} ₫:**`;
      } else if (parsed.budget && parsed.matchedDest) {
        title = `🎯 **CÁC TOUR ${parsed.matchedDest.dest.toUpperCase()} VỚI NGÂN SÁCH DƯỚI ${parsed.budget.toLocaleString('vi-VN')} ₫:**`;
      } else if (parsed.budget) {
        title = `🎯 **CÁC TOUR DU LỊCH PHÙ HỢP VỚI NGÂN SÁCH DƯỚI ${parsed.budget.toLocaleString('vi-VN')} ₫:**`;
      } else if (parsed.duration.isFar) {
        title = `🧭 **CÁC TOUR DU LỊCH TUYẾN XA / DÀI NGÀY ĐANG MỞ BÁN:**`;
      } else if (parsed.duration.isNear) {
        title = `🚗 **CÁC TOUR DU LỊCH GẦN / NGẮN NGÀY CUỐI TUẦN ĐANG MỞ BÁN:**`;
      } else if (parsed.regionTitle) {
        title = `🏝️ **CÁC TOUR DU LỊCH ${parsed.regionTitle} ĐANG MỞ BÁN:**`;
      } else if (parsed.isCheapQuery) {
        title = `💰 **CÁC TOUR DU LỊCH GIÁ TIẾT KIỆM NHẤT HIỆN CÓ TẠI TRAVELVN:**`;
      }

      return {
        reply: `${title}\n\n${formatTourList(tourRes.tours)}\n✨ **Giá đã bao gồm:** Xe du lịch đưa đón, khách sạn tiện nghi, các bữa ăn theo tour và bảo hiểm du lịch.\n👶 **Chính sách giá theo độ tuổi:** Dưới 2 tuổi miễn phí; 2 - 4 tuổi 50%; 5 - 11 tuổi 70%; từ 12 tuổi tính 100% giá người lớn.\n\n💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt chỗ trực tuyến ngay!*`,
        suggestions: [
          parsed.matchedDest ? `Lịch khởi hành tour ${parsed.matchedDest.dest}` : 'Lịch khởi hành sắp tới',
          'Chính sách giá vé trẻ em',
          'Thiết kế tour riêng',
          'Liên hệ nhân viên'
        ],
        toolsUsed: ['searchTours'],
        mode: 'fallback_db',
        handoffSuggested: false
      };
    } else {
      // No exact matches found for budget/duration constraint
      const budgetStr = parsed.budget ? `${parsed.budget.toLocaleString('vi-VN')} ₫` : '';
      let noMatchMsg = '';
      if (parsed.budget) {
        const minPriceStr = tourRes.minPriceInDb
          ? `${Number(tourRes.minPriceInDb).toLocaleString('vi-VN')} ₫`
          : '2.500.000 ₫';
        noMatchMsg = `Dạ hiện tại TravelVN chưa có tour trọn gói cố định nào dưới **${budgetStr}** (mức giá tour tiết kiệm nhất hiện tại mở bán từ **${minPriceStr}**/khách).\n\n`;
      } else {
        noMatchMsg = `Dạ hiện tại chưa tìm thấy tour nào khớp hoàn toàn với tiêu chí tìm kiếm của Quý khách.\n\n`;
      }

      if (tourRes.suggestedAlternatives && tourRes.suggestedAlternatives.length > 0) {
        noMatchMsg += `💡 **GỢI Ý CÁC TOUR GIÁ TỐT NHẤT CHO QUÝ KHÁCH THAM KHẢO:**\n\n${formatTourList(tourRes.suggestedAlternatives)}\n\n`;
      }

      noMatchMsg += `✨ **Giải pháp tối ưu ngân sách:** Quý khách có thể tự do lựa chọn điểm đến, khách sạn và dịch vụ tại trang **[Thiết kế Tour riêng](/build-tour)** để hệ thống tối ưu hóa chi phí vừa vặn với ngân sách!`;

      return {
        reply: noMatchMsg,
        suggestions: ['Xem tất cả tour', 'Thiết kế tour riêng', 'Liên hệ nhân viên'],
        toolsUsed: ['searchTours'],
        mode: 'fallback_db',
        handoffSuggested: false
      };
    }
  }

  // 2.2 Specific Destination Query
  if (parsed.matchedDest) {
    if (parsed.isSlotsOrDeps) {
      const depRes = await executeErpTool(pool, 'getTourDeparturesAndSlots', { destination: parsed.matchedDest.dest });
      if (depRes.count > 0) {
        const depLines = depRes.departures.map(
          (d, i) =>
            `### ${i + 1}. [${d.tour_name}](${d.detail_path})\n• 📅 **Khởi hành:** **${d.departure_date}** – Ngày về: **${d.return_date}**\n• 🪑 **Số chỗ còn trống:** **${d.available_slots} / ${d.max_slots} chỗ** (${d.status === 'Open' ? 'Đang mở bán' : 'Đã đóng'})\n• 💰 **Giá trọn gói:** **${Number(d.base_price_vnd).toLocaleString('vi-VN')} ₫**/khách\n`
        );
        return {
          reply: `🗓️ **LỊCH KHỞI HÀNH & CHỖ TRỐNG TOUR ${parsed.matchedDest.dest.toUpperCase()} TẠI TRAVELVN:**\n\n${depLines.join('\n')}\n💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt vé giữ chỗ ngay!*`,
          suggestions: [`Giá tour ${parsed.matchedDest.dest}`, 'Chính sách giá vé trẻ em', 'Chính sách hủy tour', 'Liên hệ nhân viên'],
          toolsUsed: ['getTourDeparturesAndSlots'],
          mode: 'fallback_db',
          handoffSuggested: false
        };
      }
    }

    const tourRes = await executeErpTool(pool, 'searchTours', {
      destination: parsed.matchedDest.dest,
      maxPrice: parsed.budget
    });
    if (tourRes.count > 0) {
      const title = parsed.isPrice
        ? `💰 **BẢNG GIÁ TOUR DU LỊCH ${parsed.matchedDest.dest.toUpperCase()} TẠI TRAVELVN:**`
        : `🏝️ **DANH SÁCH TOUR DU LỊCH ${parsed.matchedDest.dest.toUpperCase()} ĐANG MỞ BÁN:**`;

      return {
        reply: `${title}\n\n${formatTourList(tourRes.tours)}\n✨ **Giá đã bao gồm:** Xe du lịch đưa đón, khách sạn tiện nghi, các bữa ăn theo tour và bảo hiểm du lịch.\n👶 **Chính sách giá theo độ tuổi:** Dưới 2 tuổi miễn phí; 2 - 4 tuổi 50%; 5 - 11 tuổi 70%; từ 12 tuổi tính 100% giá người lớn.\n\n💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt chỗ trực tuyến ngay!*`,
        suggestions: [`Lịch khởi hành tour ${parsed.matchedDest.dest}`, 'Chính sách giá vé trẻ em', 'Chính sách hủy tour', 'Liên hệ nhân viên'],
        toolsUsed: ['searchTours'],
        mode: 'fallback_db',
        handoffSuggested: false
      };
    }
  }

  // 2.3 General tour list query
  if (parsed.isGeneralTourQuery || normQ.includes('tour')) {
    const tourRes = await executeErpTool(pool, 'searchTours', {});
    if (tourRes.count > 0) {
      return {
        reply: `🌟 **CÁC TOUR DU LỊCH ĐANG MỞ BÁN TẠI TRAVELVN:**\n\n${formatTourList(tourRes.tours)}\n💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt chỗ trực tuyến ngay!*`,
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
  const modelsToTry = [params.model, ...CANDIDATE_MODELS.filter((m) => m !== params.model)];
  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent({ ...params, model: modelName });
      } catch (err) {
        lastErr = err;
        const msg = String(err.message || '');
        if (msg.includes('not found') || msg.includes('404')) {
          break;
        }
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
        break;
      }
    }
  }
  throw lastErr;
}

async function callGeminiStreamWithRetry(ai, params, maxRetries = 2) {
  let lastErr = null;
  const modelsToTry = [params.model, ...CANDIDATE_MODELS.filter((m) => m !== params.model)];
  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContentStream({ ...params, model: modelName });
      } catch (err) {
        lastErr = err;
        const msg = String(err.message || '');
        if (msg.includes('not found') || msg.includes('404')) {
          break;
        }
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
        break;
      }
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

/**
 * AI Copilot for Tour Itinerary Design & Audit (Support Office Staff)
 */
async function copilotTourDesign({ action = 'audit', destinationName = '', daysCount = 3, days = [], availablePlaces = [], availableHotels = [] }) {
  const normDest = normalizeVi(destinationName || '');

  // 1. RULE-BASED AUDIT ENGINE
  if (action === 'audit') {
    const issues = [];

    // Danh sách từ khóa địa danh lớn để phát hiện lệch tỉnh thành
    const CITY_KEYWORDS = [
      { city: 'Hồ Chí Minh', regex: /(ben thanh|suoi tien|dam sen|pho di bo nguyen hue|dinh doc lap|nha tho duc ba|cho ben thanh)/i },
      { city: 'Hà Nội', regex: /(ho guom|ho tay|chua mot cot|lang bac|van mieu|hoa lo|dong xuan)/i },
      { city: 'Đà Nẵng', regex: /(ba na|cau vang|ngu hanh son|linh ung|son tra|my khe)/i },
      { city: 'Đà Lạt', regex: /(langbiang|xuan huong|tuyen lam|datanla|thung lung tinh yeu|samten hills)/i },
      { city: 'Nha Trang', regex: /(ponagar|hon mun|vinwonders nha trang|i-resort|chua long son)/i },
      { city: 'Phú Quốc', regex: /(hon thom|safari phu quoc|grand world|bai sao|dinh cau)/i },
      { city: 'Sapa', regex: /(fansipan|cat cat|o quy ho|ham rong)/i },
      { city: 'Hạ Long', regex: /(vinh ha long|hang sung sot|dao ti top|tuan chau)/i },
      { city: 'Ninh Bình', regex: /(trang an|tam coc|bai dinh|hang mua)/i },
      { city: 'Huế', regex: /(dai noi|thien mu|lang khai dinh|song huong)/i }
    ];

    days.forEach((day, index) => {
      const dNum = day.dayIndex || (index + 1);
      const acts = Array.isArray(day.activities) ? day.activities : [];
      let tourDayEndDest = day.end_destination_id;
      let sightseeingCount = 0;

      acts.forEach(act => {
        const actName = act.name || '';
        const normActName = normalizeVi(actName);
        if (act.type === 'Tham quan') sightseeingCount++;

        // Kiểm tra place_id với danh sách places
        if (act.place_id && availablePlaces.length > 0) {
          const matchedPlace = availablePlaces.find(p => String(p.place_id) === String(act.place_id));
          if (matchedPlace && matchedPlace.destination_id) {
            if (tourDayEndDest && String(matchedPlace.destination_id) !== String(tourDayEndDest)) {
              issues.push({
                dayIndex: dNum,
                severity: 'error',
                type: 'location_mismatch',
                title: 'Sai lệch địa phương',
                message: `Điểm tham quan "${actName}" có mã vùng không thuộc điểm đến Ngày ${dNum}. Vui lòng kiểm tra lại để tránh nhầm tuyến.`
              });
            }
          }
        }

        // Kiểm tra từ khóa địa danh chéo
        for (const kw of CITY_KEYWORDS) {
          const kwNorm = normalizeVi(kw.city);
          if (normDest && !normDest.includes(kwNorm) && !kwNorm.includes(normDest)) {
            if (kw.regex.test(actName) || kw.regex.test(normActName)) {
              issues.push({
                dayIndex: dNum,
                severity: 'error',
                type: 'location_mismatch',
                title: 'Địa điểm không cùng tỉnh/thành',
                message: `Phát hiện "${actName}" thuộc khu vực ${kw.city}, trong khi tour đang đi ${destinationName || 'điểm đến khác'}. Việc di chuyển giữa hai nơi này là bất khả thi trong cùng một ngày.`
              });
            }
          }
        }
      });

      // Kiểm tra mật độ hoạt động
      if (sightseeingCount >= 5) {
        issues.push({
          dayIndex: dNum,
          severity: 'warning',
          type: 'overload',
          title: 'Lịch trình quá dày',
          message: `Ngày ${dNum} có tới ${sightseeingCount} điểm tham quan. Khách du lịch sẽ phải di chuyển vội vàng, dễ mệt mỏi và không có đủ thời gian trải nghiệm.`
        });
      }

      // Kiểm tra các công viên lớn cần nhiều thời gian
      const hasBigPark = acts.some(a => /(vinwonders|sun world|ba na|safari|fansipan|grand world)/i.test(a.name || ''));
      if (hasBigPark && sightseeingCount >= 3) {
        issues.push({
          dayIndex: dNum,
          severity: 'warning',
          type: 'pacing',
          title: 'Xung đột thời gian vui chơi',
          message: `Ngày ${dNum} có khu vui chơi quy mô lớn cần từ 5 - 8 tiếng trải nghiệm. Không nên xếp thêm nhiều điểm tham quan khác trong cùng ngày này.`
        });
      }

      // Kiểm tra nơi lưu trú cho ngày qua đêm
      if (index < days.length - 1 && (!day.accommodation || !day.accommodation.name)) {
        issues.push({
          dayIndex: dNum,
          severity: 'info',
          type: 'hotel_missing',
          title: 'Chưa chọn nơi lưu trú',
          message: `Ngày ${dNum} là ngày qua đêm nhưng chưa chọn khách sạn đối tác lưu trú.`
        });
      }
    });

    let aiReviewText = '';
    const ai = createGeminiClient();
    if (ai) {
      try {
        const prompt = `Bạn là Chuyên gia Điều hành & Thẩm định Thiết kế Tour tại TravelVN.
Hãy đánh giá ngắn gọn lịch trình tour sau đây dành cho nhân viên văn phòng (tối đa 4 câu):
- Điểm đến: ${destinationName}
- Số ngày: ${days.length} ngày
- Lịch trình các ngày:
${days.map(d => `Ngày ${d.dayIndex}: ${d.route_title || ''} (Khách sạn: ${d.accommodation?.name || 'Chưa chọn'}) - Các hoạt động: ${(d.activities || []).map(a => a.name).join(', ')}`).join('\n')}

Hãy nhận xét súc tích về tính khả thi, phân bổ thời gian sáng - chiều - tối, và đưa ra 2 lời khuyên hữu ích cho người thiết kế. Văn phong lịch sự, tích cực, mang tính hỗ trợ tư vấn viên.`;
        
        const geminiRes = await callGeminiWithRetry(ai, {
          model: DEFAULT_MODEL,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { temperature: 0.3 }
        });
        aiReviewText = (geminiRes.text || '').trim();
      } catch (geminiErr) {
        console.warn('Gemini review fallback:', geminiErr.message);
      }
    }

    if (!aiReviewText) {
      if (issues.length === 0) {
        aiReviewText = `Lịch trình tour ${destinationName || ''} được phân bổ khoa học, các hoạt động tham quan và nghỉ ngơi cân đối, đảm bảo trải nghiệm thư giãn cho du khách.`;
      } else {
        aiReviewText = `Hệ thống ghi nhận một số điểm cần điều chỉnh về địa phương hoặc thời lượng di chuyển. Nhân viên vui lòng xem chi tiết cảnh báo bên dưới để tối ưu trước khi gửi quản lý hoặc khách hàng.`;
      }
    }

    return {
      action: 'audit',
      overallStatus: issues.some(i => i.severity === 'error') ? 'error' : (issues.some(i => i.severity === 'warning') ? 'warning' : 'good'),
      summary: issues.length === 0 ? 'Lịch trình rất tốt, không phát hiện lỗi xung đột!' : `Phát hiện ${issues.length} lưu ý cần xem xét trên lịch trình.`,
      issues,
      aiReview: aiReviewText
    };
  }

  // 2. SMART ITINERARY SUGGESTION ENGINE
  if (action === 'suggest') {
    const ai = createGeminiClient();
    let suggestedResult = null;

    if (ai && availablePlaces.length > 0) {
      try {
        const prompt = `Bạn là Chuyên gia Thiết kế Lịch trình Tour Du lịch chuyên nghiệp tại TravelVN.
Nhiệm vụ của bạn là xây dựng lịch trình mẫu ${daysCount} ngày cho điểm đến: [${destinationName}].
Dưới đây là danh sách điểm tham quan CÓ THẬT trong cơ sở dữ liệu:
${JSON.stringify(availablePlaces.slice(0, 30).map(p => ({ place_id: p.place_id, name: p.auto_text || p.place_name, price: p.estimated_price })), null, 2)}

Dưới đây là danh sách khách sạn CÓ THẬT trong cơ sở dữ liệu:
${JSON.stringify(availableHotels.slice(0, 10).map(h => ({ service_id: h.service_id, name: h.service_name, price: h.base_cost })), null, 2)}

NGUYÊN TẮC:
1. Mỗi ngày bố trí từ 2 - 3 điểm tham quan cùng tuyến đường.
2. Thêm các hoạt động ăn uống và nghỉ ngơi: 'Di chuyển', 'Ăn sáng', 'Ăn trưa', 'Ăn tối', 'Nghỉ ngơi'.
3. Chọn khách sạn phù hợp cho các đêm lưu trú.

Hãy trả về duy nhất chuỗi JSON hợp lệ theo mẫu:
{
  "tourName": "Tên tour gợi ý (ví dụ: Khám phá Nha Trang - Biển Xanh Cát Trắng 3N2Đ)",
  "tourDescription": "Mô tả điểm nhấn chuyến đi...",
  "suggestedDays": [
    {
      "dayIndex": 1,
      "route_title": "Tiêu đề ngày",
      "activities": [
        { "type": "Di chuyển", "name": "Đón khách tại điểm hẹn..." },
        { "type": "Tham quan", "name": "Tên điểm từ danh sách", "place_id": 1, "price": 30000 },
        { "type": "Ăn trưa", "name": "Dùng bữa trưa tại nhà hàng địa phương" },
        { "type": "Tham quan", "name": "Tên điểm từ danh sách", "place_id": 2, "price": 50000 },
        { "type": "Ăn tối", "name": "Thưởng thức ẩm thực địa phương" },
        { "type": "Nghỉ ngơi", "name": "Về khách sạn nhận phòng nghỉ ngơi" }
      ],
      "accommodation": {
        "service_id": 123,
        "name": "Tên khách sạn (hoặc tương đương)",
        "price": 900000
      }
    }
  ]
}`;

        const geminiRes = await callGeminiWithRetry(ai, {
          model: DEFAULT_MODEL,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { temperature: 0.3 }
        });
        const text = (geminiRes.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
        suggestedResult = JSON.parse(text);
      } catch (err) {
        console.warn('Gemini suggest error, using deterministic generator:', err.message);
      }
    }

    // Deterministic fallback generator if Gemini is unavailable
    if (!suggestedResult || !Array.isArray(suggestedResult.suggestedDays)) {
      const defaultHotel = availableHotels[0] ? {
        service_id: availableHotels[0].service_id,
        name: `${availableHotels[0].service_name} (hoặc tương đương)`,
        price: availableHotels[0].base_cost || 900000
      } : null;

      const suggestedDays = [];
      const placesPool = [...availablePlaces];

      for (let i = 1; i <= daysCount; i++) {
        const dayActs = [];
        if (i === 1) {
          dayActs.push({ type: 'Di chuyển', name: `Đón khách và khởi hành đến ${destinationName || 'điểm đến'}` });
        } else {
          dayActs.push({ type: 'Ăn sáng', name: 'Dùng bữa sáng tại khách sạn' });
        }

        // Bốc 2 điểm tham quan từ pool
        const p1 = placesPool.shift();
        if (p1) {
          dayActs.push({ type: 'Tham quan', name: p1.auto_text || p1.place_name, place_id: p1.place_id, price: Number(p1.estimated_price || 0) });
        }
        dayActs.push({ type: 'Ăn trưa', name: 'Dùng bữa trưa tại nhà hàng địa phương' });
        
        const p2 = placesPool.shift();
        if (p2) {
          dayActs.push({ type: 'Tham quan', name: p2.auto_text || p2.place_name, place_id: p2.place_id, price: Number(p2.estimated_price || 0) });
        }
        dayActs.push({ type: 'Ăn tối', name: 'Dùng bữa tối đặc sản địa phương' });

        if (i < daysCount) {
          dayActs.push({ type: 'Nghỉ ngơi', name: 'Về khách sạn nghỉ ngơi, tự do dạo phố đêm' });
        } else {
          dayActs.push({ type: 'Di chuyển', name: `Mua sắm đặc sản và tiễn khách kết thúc hành trình` });
        }

        suggestedDays.push({
          dayIndex: i,
          route_title: `${destinationName || 'Hành trình'} - Ngày ${i}`,
          activities: dayActs,
          accommodation: i < daysCount ? defaultHotel : null
        });
      }

      suggestedResult = {
        tourName: `Tour Khám Phá ${destinationName || 'Việt Nam'} ${daysCount}N${Math.max(1, daysCount - 1)}Đ`,
        tourDescription: `Hành trình trải nghiệm trọn vẹn nét đẹp thiên nhiên, văn hóa và ẩm thực đặc trưng tại ${destinationName || 'các điểm đến'}.`,
        suggestedDays
      };
    }

    return {
      action: 'suggest',
      ...suggestedResult
    };
  }

  return { success: false, message: 'Invalid action' };
}

module.exports = {
  askAI,
  askAIStream,
  isUsableGeminiKey,
  copilotTourDesign
};
