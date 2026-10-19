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
  if (isNaN(d.getTime())) return String(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// =========================================================================
// 1. TỪ ĐIỂN ĐỊA LÝ DU LỊCH TOÀN DIỆN (63 TỈNH THÀNH & DANH THẮNG NỔI TIẾNG)
// =========================================================================
const DESTINATION_MAP = [
  // Tuyến điểm du lịch hàng đầu
  {
    name: 'Đà Lạt',
    province: 'Lâm Đồng',
    aliases: ['đà lạt', 'da lat', 'lâm đồng', 'lam dong', 'bảo lộc', 'langbiang', 'thác bobla', 'hồ tuyền lâm'],
    searchTerms: ['Đà Lạt', 'Lâm Đồng']
  },
  {
    name: 'Phú Quốc',
    province: 'Kiên Giang',
    aliases: ['phú quốc', 'phu quoc', 'đảo ngọc', 'kiên giang', 'kien giang', 'hòn thơm', 'nam du', 'hà tiên', 'rạch giá', 'hòn sơn'],
    searchTerms: ['Phú Quốc', 'Kiên Giang']
  },
  {
    name: 'Vũng Tàu',
    province: 'Bà Rịa - Vũng Tàu',
    aliases: ['vũng tàu', 'vung tau', 'bà rịa', 'ba ria', 'hồ tràm', 'ho tram', 'côn đảo', 'con dao', 'long hải', 'bình châu'],
    searchTerms: ['Vũng Tàu', 'Bà Rịa', 'Hồ Tràm', 'Côn Đảo']
  },
  {
    name: 'Tây Ninh',
    province: 'Tây Ninh',
    aliases: ['tây ninh', 'tay ninh', 'núi bà đen', 'nui ba den', 'tòa thánh', 'đỉnh vân sơn'],
    searchTerms: ['Tây Ninh', 'Bà Đen']
  },
  {
    name: 'Phan Thiết',
    province: 'Bình Thuận',
    aliases: ['phan thiết', 'phan thiet', 'mũi né', 'mui ne', 'bình thuận', 'binh thuan', 'phú quý', 'đảo phú quý', 'kê gà'],
    searchTerms: ['Phan Thiết', 'Mũi Né', 'Phú Quý', 'Bình Thuận']
  },
  {
    name: 'Nha Trang',
    province: 'Khánh Hòa',
    aliases: ['nha trang', 'khánh hòa', 'khanh hoa', 'cam ranh', 'vân phong', 'điệp sơn', 'bình ba', 'bình hưng', 'vĩnh hy'],
    searchTerms: ['Nha Trang', 'Khánh Hòa', 'Vĩnh Hy']
  },
  {
    name: 'Quy Nhơn',
    province: 'Bình Định',
    aliases: ['quy nhơn', 'quy nhon', 'bình định', 'binh dinh', 'kỳ co', 'ky co', 'eo gió', 'eo gio', 'hầm hồ', 'ghềnh ráng'],
    searchTerms: ['Quy Nhơn', 'Bình Định']
  },
  {
    name: 'Phú Yên',
    province: 'Phú Yên',
    aliases: ['phú yên', 'phu yen', 'tuy hòa', 'tuy hoa', 'gành đá đĩa', 'ghềnh đá đĩa', 'mũi điện', 'vịnh xuân đài', 'bãi xép'],
    searchTerms: ['Phú Yên', 'Tuy Hòa']
  },
  {
    name: 'Đà Nẵng',
    province: 'Đà Nẵng',
    aliases: ['đà nẵng', 'da nang', 'bà nà', 'ba na', 'bà nà hills', 'sơn trà', 'ngũ hành sơn'],
    searchTerms: ['Đà Nẵng', 'Bà Nà']
  },
  {
    name: 'Hội An',
    province: 'Quảng Nam',
    aliases: ['hội an', 'hoi an', 'quảng nam', 'quang nam', 'cù lao chàm', 'cu lao cham', 'mỹ sơn'],
    searchTerms: ['Hội An', 'Quảng Nam']
  },
  {
    name: 'Huế',
    province: 'Thừa Thiên Huế',
    aliases: ['huế', 'hue', 'thừa thiên huế', 'thua thien hue', 'cố đô', 'lăng cô', 'lang co', 'phá tam giang'],
    searchTerms: ['Huế', 'Lăng Cô']
  },
  {
    name: 'Quảng Bình',
    province: 'Quảng Bình',
    aliases: ['quảng bình', 'quang binh', 'đồng hới', 'dong hoi', 'phong nha', 'kẻ bàng', 'sơn đoòng', 'hang én', 'nhật lệ'],
    searchTerms: ['Quảng Bình', 'Phong Nha']
  },
  {
    name: 'Hà Nội',
    province: 'Hà Nội',
    aliases: ['hà nội', 'ha noi', 'thủ đô', 'hồ gươm', 'ho guom', 'ba đình'],
    searchTerms: ['Hà Nội']
  },
  {
    name: 'Hạ Long',
    province: 'Quảng Ninh',
    aliases: ['hạ long', 'ha long', 'vịnh hạ long', 'quảng ninh', 'quang ninh', 'cô tô', 'co to', 'vân đồn', 'móng cái', 'yên tử'],
    searchTerms: ['Hạ Long', 'Quảng Ninh', 'Cô Tô']
  },
  {
    name: 'Ninh Bình',
    province: 'Ninh Bình',
    aliases: ['ninh bình', 'ninh binh', 'tràng an', 'trang an', 'bái đính', 'bai dinh', 'tam cốc', 'hang múa'],
    searchTerms: ['Ninh Bình', 'Tràng An', 'Bái Đính']
  },
  {
    name: 'Sa Pa',
    province: 'Lào Cai',
    aliases: ['sa pa', 'sapa', 'lào cai', 'lao cai', 'fansipan', 'fanxipan', 'bắc hà'],
    searchTerms: ['Sa Pa', 'Sapa', 'Fansipan', 'Lào Cai']
  },
  {
    name: 'Hà Giang',
    province: 'Hà Giang',
    aliases: ['hà giang', 'ha giang', 'đồng văn', 'mã pì lèng', 'lũng cú', 'hoàng su phì', 'sông nho quế', 'quản bạ'],
    searchTerms: ['Hà Giang', 'Đồng Văn', 'Nho Quế', 'Quản Bạ']
  },
  {
    name: 'Cần Thơ',
    province: 'Cần Thơ',
    aliases: ['cần thơ', 'can tho', 'cái răng', 'ninh kiều', 'bến ninh kiều'],
    searchTerms: ['Cần Thơ']
  },
  {
    name: 'Đồng Tháp',
    province: 'Đồng Tháp',
    aliases: ['đồng tháp', 'dong thap', 'sa đéc', 'sa dec', 'làng hoa', 'tràm chim', 'cao lãnh'],
    searchTerms: ['Đồng Tháp', 'Sa Đéc']
  },
  {
    name: 'Miền Tây',
    province: 'Miền Tây',
    aliases: ['miền tây', 'mien tay', 'sông nước', 'chợ nổi', 'mỹ tho', 'tiền giang', 'bến tre', 'bạc liêu', 'cà mau', 'sóc trăng', 'an giang'],
    searchTerms: ['Miền Tây', 'Cần Thơ', 'Đồng Tháp', 'Mỹ Tho', 'Bạc Liêu', 'Cà Mau']
  },
  {
    name: 'Tây Nguyên',
    province: 'Tây Nguyên',
    aliases: ['tây nguyên', 'tay nguyen', 'đắk lắk', 'dak lak', 'đắc lắc', 'buôn ma thuột', 'buon ma thuot', 'pleiku', 'măng đen', 'kon tum', 'gia lai'],
    searchTerms: ['Tây Nguyên', 'Đắk Lắk', 'Pleiku', 'Buôn Ma Thuột', 'Măng Đen']
  },
  {
    name: 'Xuyên Việt',
    province: 'Việt Nam',
    aliases: ['xuyên việt', 'xuyen viet', 'bắc nam', 'dọc miền đất nước'],
    searchTerms: ['Xuyên Việt']
  },

  // Bắc Trung Bộ & Miền Trung (Bao gồm Nghệ An, Thanh Hóa, Hà Tĩnh)
  {
    name: 'Nghệ An',
    province: 'Nghệ An',
    aliases: ['nghệ an', 'nghe an', 'vinh', 'thành phố vinh', 'tp vinh', 'cửa lò', 'cua lo', 'nam đàn', 'nam dan', 'quê bác', 'que bac', 'thanh chương'],
    searchTerms: ['Nghệ An', 'Cửa Lò', 'TP Vinh', 'Thành phố Vinh']
  },
  {
    name: 'Thanh Hóa',
    province: 'Thanh Hóa',
    aliases: ['thanh hóa', 'thanh hoa', 'sầm sơn', 'sam son', 'pù luông', 'pu luong', 'hải tiến', 'bến en'],
    searchTerms: ['Thanh Hóa', 'Sầm Sơn', 'Pù Luông']
  },
  {
    name: 'Hà Tĩnh',
    province: 'Hà Tĩnh',
    aliases: ['hà tĩnh', 'ha tinh', 'thiên cầm', 'thien cam', 'đồng lộc', 'ngã ba đồng lộc'],
    searchTerms: ['Hà Tĩnh', 'Thiên Cầm']
  },
  {
    name: 'Quảng Trị',
    province: 'Quảng Trị',
    aliases: ['quảng trị', 'quang tri', 'khe sanh', 'cửa tùng', 'la vang', 'thành cổ'],
    searchTerms: ['Quảng Trị']
  },
  {
    name: 'Quảng Ngãi',
    province: 'Quảng Ngãi',
    aliases: ['quảng ngãi', 'quang ngai', 'lý sơn', 'ly son', 'sa huỳnh'],
    searchTerms: ['Quảng Ngãi', 'Lý Sơn']
  },
  {
    name: 'Ninh Thuận',
    province: 'Ninh Thuận',
    aliases: ['ninh thuận', 'ninh thuan', 'phan rang', 'hang rái', 'tháp chàm', 'đồng cừu an hòa'],
    searchTerms: ['Ninh Thuận', 'Phan Rang']
  },

  // Bắc Bộ
  { name: 'Cao Bằng', province: 'Cao Bằng', aliases: ['cao bằng', 'cao bang', 'bản giốc', 'thác bản giốc', 'pác bó'], searchTerms: ['Cao Bằng', 'Bản Giốc'] },
  { name: 'Bắc Kạn', province: 'Bắc Kạn', aliases: ['bắc kạn', 'bac kan', 'ba bể', 'hồ ba bể'], searchTerms: ['Bắc Kạn', 'Ba Bể'] },
  { name: 'Lạng Sơn', province: 'Lạng Sơn', aliases: ['lạng sơn', 'lang son', 'mẫu sơn', 'tân thanh'], searchTerms: ['Lạng Sơn'] },
  { name: 'Yên Bái', province: 'Yên Bái', aliases: ['yên bái', 'yen bai', 'mù cang chải', 'mu cang chai', 'nghĩa lộ'], searchTerms: ['Yên Bái', 'Mù Cang Chải'] },
  { name: 'Sơn La', province: 'Sơn La', aliases: ['sơn la', 'son la', 'mộc châu', 'moc chau', 'tà xùa', 'ta xua'], searchTerms: ['Sơn La', 'Mộc Châu', 'Tà Xùa'] },
  { name: 'Hòa Bình', province: 'Hòa Bình', aliases: ['hòa bình', 'hoa binh', 'mai châu', 'mai chau', 'thung nai', 'kim bôi'], searchTerms: ['Hòa Bình', 'Mai Châu'] },
  { name: 'Điện Biên', province: 'Điện Biên', aliases: ['điện biên', 'dien bien', 'mường thanh', 'pha đin'], searchTerms: ['Điện Biên'] },
  { name: 'Lai Châu', province: 'Lai Châu', aliases: ['lai châu', 'lai chau', 'ô quy hồ'], searchTerms: ['Lai Châu'] },
  { name: 'Tuyên Quang', province: 'Tuyên Quang', aliases: ['tuyên quang', 'tuyen quang', 'na hang'], searchTerms: ['Tuyên Quang'] },
  { name: 'Thái Nguyên', province: 'Thái Nguyên', aliases: ['thái nguyên', 'thai nguyen', 'hồ núi cốc'], searchTerms: ['Thái Nguyên'] },
  { name: 'Phú Thọ', province: 'Phú Thọ', aliases: ['phú thọ', 'phu tho', 'đền hùng', 'thanh thủy'], searchTerms: ['Phú Thọ', 'Đền Hùng'] },
  { name: 'Bắc Giang', province: 'Bắc Giang', aliases: ['bắc giang', 'bac giang', 'tây yên tử'], searchTerms: ['Bắc Giang'] },
  { name: 'Bắc Ninh', province: 'Bắc Ninh', aliases: ['bắc ninh', 'bac ninh'], searchTerms: ['Bắc Ninh'] },
  { name: 'Hà Nam', province: 'Hà Nam', aliases: ['hà nam', 'ha nam', 'tam chúc', 'chùa tam chúc'], searchTerms: ['Hà Nam', 'Tam Chúc'] },
  { name: 'Hải Dương', province: 'Hải Dương', aliases: ['hải dương', 'hai duong', 'côn sơn', 'kiếp bạc'], searchTerms: ['Hải Dương'] },
  { name: 'Hưng Yên', province: 'Hưng Yên', aliases: ['hưng yên', 'hung yen', 'phố hiến'], searchTerms: ['Hưng Yên'] },
  { name: 'Nam Định', province: 'Nam Định', aliases: ['nam định', 'nam dinh', 'quất lâm'], searchTerms: ['Nam Định'] },
  { name: 'Thái Bình', province: 'Thái Bình', aliases: ['thái bình', 'thai binh', 'đồng châu'], searchTerms: ['Thái Bình'] },
  { name: 'Vĩnh Phúc', province: 'Vĩnh Phúc', aliases: ['vĩnh phúc', 'vinh phuc', 'tam đảo', 'tam dao', 'tây thiên'], searchTerms: ['Vĩnh Phúc', 'Tam Đảo'] },
  { name: 'Hải Phòng', province: 'Hải Phòng', aliases: ['hải phòng', 'hai phong', 'cát bà', 'cat ba', 'đồ sơn', 'do son'], searchTerms: ['Hải Phòng', 'Cát Bà'] },

  // Đông Nam Bộ & Nam Trung Bộ
  { name: 'TP. Hồ Chí Minh', province: 'TP. Hồ Chí Minh', aliases: ['hồ chí minh', 'ho chi minh', 'tp hcm', 'tphcm', 'sài gòn', 'sai gon'], searchTerms: ['Hồ Chí Minh', 'Sài Gòn'] },
  { name: 'Bình Dương', province: 'Bình Dương', aliases: ['bình dương', 'binh duong', 'đại nam'], searchTerms: ['Bình Dương'] },
  { name: 'Bình Phước', province: 'Bình Phước', aliases: ['bình phước', 'binh phuoc', 'bù gia mập'], searchTerms: ['Bình Phước'] },
  { name: 'Đồng Nai', province: 'Đồng Nai', aliases: ['đồng nai', 'dong nai', 'nam cát tiên', 'giang điền'], searchTerms: ['Đồng Nai'] },
  { name: 'Đắk Nông', province: 'Đắk Nông', aliases: ['đắk nông', 'dak nong', 'tà đùng', 'ta dung'], searchTerms: ['Đắk Nông', 'Tà Đùng'] },

  // Tây Nam Bộ (Miền Tây)
  { name: 'Long An', province: 'Long An', aliases: ['long an', 'tân lập'], searchTerms: ['Long An'] },
  { name: 'Tiền Giang', province: 'Tiền Giang', aliases: ['tiền giang', 'tien giang', 'cái bè', 'mỹ tho', 'my tho'], searchTerms: ['Tiền Giang', 'Mỹ Tho'] },
  { name: 'Bến Tre', province: 'Bến Tre', aliases: ['bến tre', 'ben tre', 'xứ dừa'], searchTerms: ['Bến Tre'] },
  { name: 'Trà Vinh', province: 'Trà Vinh', aliases: ['trà vinh', 'tra vinh', 'ba động'], searchTerms: ['Trà Vinh'] },
  { name: 'Vĩnh Long', province: 'Vĩnh Long', aliases: ['vĩnh long', 'vinh long'], searchTerms: ['Vĩnh Long'] },
  { name: 'An Giang', province: 'An Giang', aliases: ['an giang', 'châu đốc', 'chau doc', 'trà sư', 'miếu bà chúa xứ'], searchTerms: ['An Giang', 'Châu Đốc'] },
  { name: 'Hậu Giang', province: 'Hậu Giang', aliases: ['hậu giang', 'hau giang', 'ngã bảy'], searchTerms: ['Hậu Giang'] },
  { name: 'Sóc Trăng', province: 'Sóc Trăng', aliases: ['sóc trăng', 'soc trang', 'chùa dơi'], searchTerms: ['Sóc Trăng'] },
  { name: 'Bạc Liêu', province: 'Bạc Liêu', aliases: ['bạc liêu', 'bac lieu', 'công tử bạc liêu', 'điện gió'], searchTerms: ['Bạc Liêu'] },
  { name: 'Cà Mau', province: 'Cà Mau', aliases: ['cà mau', 'ca mau', 'đất mũi', 'dat mui', 'u minh'], searchTerms: ['Cà Mau'] }
];

// Tuyến quốc tế
const INTERNATIONAL_DESTINATIONS = [
  { name: 'Thái Lan', keys: ['thái lan', 'thai lan', 'bangkok', 'pattaya', 'phuket', 'chiang mai'] },
  { name: 'Singapore', keys: ['singapore', 'sing'] },
  { name: 'Malaysia', keys: ['malaysia', 'kuala lumpur'] },
  { name: 'Hàn Quốc', keys: ['hàn quốc', 'han quoc', 'seoul', 'jeju', 'nami'] },
  { name: 'Nhật Bản', keys: ['nhật bản', 'nhat ban', 'tokyo', 'osaka', 'kyoto', 'fuji'] },
  { name: 'Trung Quốc', keys: ['trung quốc', 'trung quoc', 'bắc kinh', 'thượng hải', 'trương gia giới', 'phượng hoàng cổ trấn'] },
  { name: 'Đài Loan', keys: ['đài loan', 'dai loan', 'đài bắc'] },
  { name: 'Campuchia', keys: ['campuchia', 'angkor', 'siem reap', 'phnom penh'] },
  { name: 'Lào', keys: ['lào', 'laos', 'luang prabang', 'vientiane'] },
  { name: 'Bali / Indonesia', keys: ['bali', 'indonesia'] },
  { name: 'Dubai', keys: ['dubai'] },
  { name: 'Châu Âu', keys: ['châu âu', 'chau au', 'pháp', 'ý', 'đức', 'thụy sĩ'] },
  { name: 'Mỹ / Úc', keys: ['mỹ', 'hoa kỳ', 'úc', 'australia'] }
];

/**
 * Trích xuất địa danh từ câu hỏi người dùng
 */
function extractDestination(text) {
  const clean = text.toLowerCase().trim();

  // 1. Tìm trong từ điển Việt Nam (sắp xếp alias dài hơn ưu tiên match trước)
  let bestMatch = null;

  for (const item of DESTINATION_MAP) {
    for (const alias of item.aliases) {
      if (clean.includes(alias)) {
        if (!bestMatch || alias.length > bestMatch.alias.length) {
          bestMatch = {
            item,
            alias
          };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      type: 'domestic',
      name: bestMatch.item.name,
      matchedKey: bestMatch.alias,
      searchTerms: bestMatch.item.searchTerms || [bestMatch.item.name]
    };
  }

  // 2. Tìm trong danh sách quốc tế
  for (const item of INTERNATIONAL_DESTINATIONS) {
    if (item.keys.some(k => clean.includes(k))) {
      return {
        type: 'international',
        name: item.name
      };
    }
  }

  // 3. Fallback: Trích xuất cụm từ sau "tour", "đi", "đến", "du lịch"
  const patterns = [
    /(?:tour|chuyến đi|du lịch|vé đi|đi)\s+(?:đến|đi|tới|về)?\s*([a-zà-ỹ\s]{2,25}?)(?:\s+(?:đã có chưa|có chưa|có không|giá bao nhiêu|mấy ngày|khi nào|lịch trình|như thế nào|khởi hành))?$/i,
    /^([a-zà-ỹ\s]{2,20}?)\s+(?:đã có tour chưa|có tour chưa|có tour không|đã có chưa|có chưa)/i
  ];

  for (const p of patterns) {
    const match = clean.match(p);
    if (match && match[1]) {
      const extracted = match[1].trim();
      const ignoreWords = ['gì', 'nào', 'sao', 'đâu', 'này', 'ấy', 'rẻ', 'hot', 'mới', 'vip'];
      if (!ignoreWords.includes(extracted) && extracted.length > 2) {
        const capitalized = extracted.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return {
          type: 'dynamic',
          name: capitalized,
          matchedKey: extracted,
          searchTerms: [capitalized]
        };
      }
    }
  }

  return null;
}

/**
 * Phân tích và xử lý câu hỏi người dùng
 */
async function processAIQuery(question, conversationHistory = []) {
  const qRaw = (question || '').trim();
  const qLower = qRaw.toLowerCase();

  // -------------------------------------------------------------
  // 1. CHÀO HỎI / GIỚI THIỆU
  // -------------------------------------------------------------
  if (isGreeting(qLower)) {
    return {
      reply: `Dạ xin chào Quý khách! 🤖 Em là **Trợ lý du lịch AI của TravelVN**.\n\nEm sẵn sàng hỗ trợ Quý khách 24/7:\n- 🗺️ **Tra cứu Tour**: Kiểm tra tour đã mở bán chưa, giá vé, lịch trình, ngày khởi hành.\n- 🚌 **Dịch vụ Đội xe**: Xe 4, 7, 16, 29, 45 chỗ & Limousine VIP có tài xế.\n- 📋 **Chính sách**: Giá vé trẻ em, quy định hoàn tiền khi hủy tour, đổi lịch trình.\n- 💳 **Thanh toán**: Hướng dẫn chuyển khoản VietQR tự động qua SePay, thanh toán online.\n- ✨ **Thiết kế tour riêng**: Lên lịch trình theo yêu cầu cho cá nhân & đoàn thể.\n\nQuý khách muốn tìm tour đi đâu hoặc cần em hỗ trợ thông tin gì ạ?`,
      suggestions: [
        'Có những tour nào đang mở bán?',
        'Tour Đà Lạt giá bao nhiêu?',
        'Lịch khởi hành tour sắp tới',
        'Bảng giá thuê xe du lịch',
        'Chính sách giá vé trẻ em'
      ]
    };
  }

  // -------------------------------------------------------------
  // 2. CHÍNH SÁCH GIÁ VÉ TRẺ EM
  // -------------------------------------------------------------
  if (qLower.includes('trẻ em') || qLower.includes('em bé') || qLower.includes('con nít') || (qLower.includes('tuổi') && (qLower.includes('giá') || qLower.includes('vé')))) {
    return {
      reply: `👶 **CHÍNH SÁCH GIÁ VÉ TRẺ EM TẠI TRAVELVN:**\n\nTheo quy định vận hành tour của công ty:\n- 🍼 **Dưới 2 tuổi:** **Miễn phí 100%** giá tour (bố mẹ tự lo ăn uống và vé phát sinh nếu có).\n- 🧒 **Từ 2 đến dưới 5 tuổi:** Tính **50% giá tour người lớn** (có ghế ngồi riêng trên xe, ăn ngủ chung cùng bố mẹ).\n- 👦 **Từ 6 đến dưới 11 tuổi:** Tính **75% giá tour người lớn** (tiêu chuẩn suất ăn riêng, ghế riêng, ngủ chung phòng cùng bố mẹ).\n- 🧑 **Từ 12 tuổi trở lên:** Tính **100% như người lớn** (hưởng đầy đủ dịch vụ giường nằm, phòng riêng).\n\n💡 *Lưu ý: 2 người lớn chỉ được kèm 1 trẻ em diện miễn phí hoặc 50%, từ bé thứ 2 trở đi áp dụng phụ thu phòng đơn hoặc suất 75%.*`,
      suggestions: ['Chính sách hoàn hủy tour', 'Phương thức thanh toán', 'Xem tour trọn gói']
    };
  }

  // -------------------------------------------------------------
  // 3. CHÍNH SÁCH HOÀN TIỀN / HỦY ĐỔI TOUR
  // -------------------------------------------------------------
  if (qLower.includes('hủy tour') || qLower.includes('hoàn tiền') || qLower.includes('đổi lịch') || qLower.includes('đổi tour') || qLower.includes('hoàn vé')) {
    return {
      reply: `🔄 **CHÍNH SÁCH HỦY TOUR & HOÀN TIỀN CỦA TRAVELVN:**\n\nHệ thống TravelVN áp dụng quy định bảo vệ quyền lợi khách hàng minh bạch như sau:\n\n1. **Quy định hoàn tiền khi hủy tour:**\n- 🟢 **Hủy trước 7 ngày khởi hành:** **Hoàn tiền 100%** giá trị tour đã thanh toán.\n- 🟡 **Hủy từ 3 đến 6 ngày trước khởi hành:** **Hoàn tiền 50%** (do công ty đã đặt cọc dịch vụ phòng và xe).\n- 🔴 **Hủy dưới 3 ngày trước khởi hành:** Không hoàn lại tiền.\n\n2. **Quy định đổi lịch khởi hành:**\n- 📅 Hỗ trợ đổi ngày khởi hành **miễn phí 1 lần** nếu thông báo trước ít nhất 5 ngày (tùy vào tình trạng còn chỗ của đoàn tiếp theo).\n\n3. **Thời gian nhận tiền hoàn:**\n- Tiền hoàn sẽ được chuyển khoản trực tiếp về tài khoản ngân hàng của Quý khách trong vòng **24 - 48 giờ** làm việc sau khi yêu cầu được duyệt!`,
      suggestions: ['Các tour sắp khởi hành', 'Hình thức thanh toán', 'Tư vấn viên trực tiếp']
    };
  }

  // -------------------------------------------------------------
  // 4. HÌNH THỨC THANH TOÁN (SEPAY / VIETQR)
  // -------------------------------------------------------------
  if (qLower.includes('thanh toán') || qLower.includes('chuyển khoản') || qLower.includes('sepay') || qLower.includes('ngân hàng') || qLower.includes('đặt cọc')) {
    return {
      reply: `💳 **CÁC PHƯƠNG THỨC THANH TOÁN TẠI TRAVELVN:**\n\nQuý khách có thể lựa chọn các hình thức thanh toán tiện lợi và an toàn:\n\n1. ⚡ **Chuyển khoản VietQR Realtime (Tự động 24/7):**\n- Hệ thống tạo mã QR động tích hợp SePay. Quý khách chỉ cần mở ứng dụng ngân hàng quét mã QR, hệ thống sẽ tự động đối soát và kích hoạt đơn đặt tour thành công ngay lập tức (trong 3 giây).\n- Ngân hàng liên kết: **TPBank** (Số tài khoản: \`00000419627\` - DOAN THI TRAM).\n\n2. 🏢 **Thanh toán tiền mặt tại quầy:**\n- Quý khách có thể ghé trực tiếp quầy giao dịch TravelVN trước ngày khởi hành để nhận vé bản cứng và thanh toán tiền mặt.\n\n3. 🔒 **Chính sách giữ chỗ:**\n- Sau khi đặt đơn, vé được giữ chỗ tạm thời trong 24 giờ để Quý khách hoàn tất thanh toán.`,
      suggestions: ['Xem các tour đang mở', 'Chính sách hoàn tiền', 'Tư vấn thiết kế tour']
    };
  }

  // -------------------------------------------------------------
  // 5. ĐIỂM ĐÓN / ĐÓN Ở ĐÂU / XUẤT PHÁT
  // -------------------------------------------------------------
  if (qLower.includes('đón ở đâu') || qLower.includes('điểm đón') || qLower.includes('tập trung ở đâu') || qLower.includes('xuất phát ở đâu') || qLower.includes('nơi đón')) {
    return {
      reply: `📍 **ĐIỂM ĐÓN & TẬP TRUNG KHỞI HÀNH:**\n\nĐể thuận tiện nhất cho Quý khách, TravelVN bố trí nhiều điểm đón cố định:\n\n- 🏢 **Trụ sở chính TravelVN:** Tòa nhà TravelVN, TP. Hồ Chí Minh.\n- ✈️ **Khu vực Sân bay:** Cột 12 Ga Quốc nội - Sân bay Tân Sơn Nhất.\n- 🚌 **Khu vực Bến xe & Cửa ngõ:** Bến xe Miền Đông, Bến xe Miền Tây, Ngã tư Hàng Xanh, Ngã tư Thủ Đức dọc tuyến Quốc lộ.\n- 🌟 **Đặc biệt với đoàn riêng hoặc Tour thiết kế:** Xe sẽ **đón tận nơi** tại nhà riêng, cơ quan hoặc khách sạn theo yêu cầu của đoàn!\n\n💡 *Trước ngày khởi hành 1 ngày, Trưởng đoàn / Hướng dẫn viên sẽ gọi điện xác nhận chính xác thời gian và vị trí đón cụ thể cho Quý khách.*`,
      suggestions: ['Xem lịch khởi hành gần nhất', 'Bảng giá thuê xe', 'Tư vấn trực tiếp']
    };
  }

  // -------------------------------------------------------------
  // 6. TIÊU CHUẨN DỊCH VỤ / KHÁCH SẠN / ĂN UỐNG
  // -------------------------------------------------------------
  if (qLower.includes('bao gồm những gì') || qLower.includes('có ăn uống') || qLower.includes('khách sạn mấy sao') || qLower.includes('tiêu chuẩn tour') || qLower.includes('có bao gồm ăn')) {
    return {
      reply: `🏨 **TIÊU CHUẨN DỊCH VỤ TOUR TRỌN GÓI CỦA TRAVELVN:**\n\nTất cả các tour du lịch tại TravelVN đều là **Tour trọn gói chất lượng cao**, đã bao gồm đầy đủ:\n\n- 🚌 **Phương tiện vận chuyển:** Xe du lịch đời mới (16, 29, 45 chỗ hoặc Limousine VIP) có máy lạnh, Wifi, ghế ngả êm ái và tài xế chuyên nghiệp.\n- 🏨 **Lưu trú:** Khách sạn tiêu chuẩn từ **3★ đến 5★** hoặc Resort cao cấp (tiêu chuẩn 2 khách/phòng, có hỗ trợ phòng đơn).\n- 🍽️ **Ăn uống:** Bao gồm bữa sáng buffet tại khách sạn và các bữa ăn chính đặc sản địa phương theo thực đơn phong phú.\n- 🎟️ **Vé tham quan:** Vé vào cổng tất cả các danh lam thắng cảnh có trong lịch trình.\n- 🛡️ **Bảo hiểm du lịch:** Mức bồi thường tối đa lên đến **100.000.000 ₫/vụ**.\n- 🎁 **Quà tặng:** Nón du lịch TravelVN, khăn lạnh và nước suối chai 500ml/người/ngày.`,
      suggestions: ['Các tour đang mở bán', 'Chính sách giá trẻ em', 'Tư vấn thiết kế tour']
    };
  }

  // -------------------------------------------------------------
  // 7. THIẾT KẾ TOUR THEO YÊU CẦU (CUSTOM TOUR BUILDER)
  // -------------------------------------------------------------
  if (qLower.includes('thiết kế tour') || qLower.includes('tour riêng') || qLower.includes('đoàn riêng') || qLower.includes('tour gia đình') || qLower.includes('tự chọn')) {
    return {
      reply: `✨ **DỊCH VỤ THIẾT KẾ TOUR RIÊNG THEO YÊU CẦU:**\n\nTravelVN có công cụ **Tự thiết kế Tour** thông minh dành cho cá nhân, gia đình hoặc đoàn công ty:\n\n- 🎯 **Tùy biến lịch trình:** Tự chọn điểm đến, số ngày, điểm tham quan yêu thích.\n- 🏨 **Tùy chọn tiện ích:** Khách sạn từ 3★ đến Resort 5★ sang trọng.\n- 🚗 **Xe riêng VIP:** Tự chọn loại xe 4, 7, 16, 29, 45 chỗ đời mới theo quy mô đoàn.\n- 💰 **Báo giá tức thì:** Hệ thống tự động tính toán tổng chi phí và gửi bảng dự toán chi tiết trong 2 phút!\n\n👉 Quý khách có thể nhấn vào mục **"Thiết kế tour theo yêu cầu"** trên thanh menu hoặc để lại thông tin để chuyên viên TravelVN lên lịch trình riêng cho đoàn nhé!`,
      suggestions: ['Gửi yêu cầu thiết kế tour', 'Xem các tour cố định', 'Bảng giá thuê xe']
    };
  }

  // -------------------------------------------------------------
  // 8. DỊCH VỤ THUÊ XE / ĐỘI XE NỘI BỘ
  // -------------------------------------------------------------
  if (qLower.includes('thuê xe') || (qLower.includes('xe') && (qLower.includes('chỗ') || qLower.includes('giá') || qLower.includes('bảng giá') || qLower.includes('tài xế')))) {
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

      vehicleText += `\n✨ **Ưu điểm dịch vụ xe:**\n- Xe được bảo dưỡng định kỳ, kiểm tra an toàn trước mỗi chuyến đi.\n- Tài xế được đào tạo bài bản, nhiệt tình, am hiểu cung đường du lịch.\n- Quý khách có thể đặt xe theo tour hoặc thuê xe riêng kèm tài xế đưa đón sân bay, tham quan.`;

      return {
        reply: vehicleText,
        suggestions: ['Xem các tour có xe đưa đón', 'Tour Đà Lạt', 'Tour Tây Ninh']
      };
    } catch (err) {
      console.error('Lỗi truy vấn xe:', err);
    }
  }

  // -------------------------------------------------------------
  // 9. THÔNG TIN CÔNG TY & LIÊN HỆ
  // -------------------------------------------------------------
  if (qLower.includes('liên hệ') || qLower.includes('hotline') || qLower.includes('địa chỉ') || qLower.includes('công ty') || qLower.includes('số điện thoại') || qLower.includes('ở đâu')) {
    return {
      reply: `🏢 **THÔNG TIN LIÊN HỆ TRAVELVN:**\n\n- 🌐 **Thương hiệu:** TravelVN - Dịch vụ Lữ hành & Vận chuyển Du lịch\n- 📞 **Hotline hỗ trợ 24/7:** \`1900 6868\` - \`0908 123 456\`\n- 📧 **Email:** \`support@travelvn.com\` | \`booking@travelvn.com\`\n- 📍 **Trụ sở chính:** Tòa nhà TravelVN, TP. Hồ Chí Minh\n- ⏰ **Giờ làm việc:** 08:00 - 21:00 (Tất cả các ngày trong tuần, kể cả Lễ/Tết)\n\nNếu Quý khách cần gặp chuyên viên tư vấn trực tiếp, vui lòng bấm vào nút **Message tròn màu xanh** ngay bên dưới em nhé!`,
      suggestions: ['Xem các tour đang hot', 'Chính sách hoàn tiền', 'Bảng giá thuê xe']
    };
  }

  // -------------------------------------------------------------
  // 10. TRÍCH XUẤT ĐỊA DANH TỪ CÂU HỎI
  // -------------------------------------------------------------
  const destInfo = extractDestination(qLower);

  // 10.1 XỬ LÝ TOUR QUỐC TẾ
  if (destInfo && destInfo.type === 'international') {
    return {
      reply: `🌏 **THÔNG TIN TOUR DU LỊCH ${destInfo.name.toUpperCase()}:**\n\nDạ hiện tại TravelVN đang tập trung chuyên sâu cho các **tuyến tour du lịch nội địa và xuyên Việt chất lượng cao** (Đà Lạt, Phú Quốc, Tây Ninh, Nha Trang, Miền Tây, Tây Nguyên...).\n\nĐối với tuyến **${destInfo.name}**:\n- TravelVN hiện nhận tổ chức theo **Hợp đồng đoàn riêng cho doanh nghiệp, công ty hoặc gia đình từ 15 khách trở lên**.\n- Hỗ trợ trọn gói: Visa, vé máy bay khứ hồi, khách sạn 4★ - 5★ và hướng dẫn viên tiếng Việt suốt tuyến.\n\nQuý khách có thể bấm vào mục liên hệ để chuyên viên phụ trách tour quốc tế tư vấn riêng cho đoàn nhé!`,
      suggestions: ['Tư vấn đoàn riêng', 'Xem các tour nội địa đang hot', 'Liên hệ hotline']
    };
  }

  // -------------------------------------------------------------
  // 11. XỬ LÝ CÂU HỎI VỀ ĐỊA DANH CỤ THỂ HOẶC KIỂM TRA "CÓ TOUR CHƯA"
  // -------------------------------------------------------------
  const isAvailabilityCheck = qLower.includes('đã có chưa') || qLower.includes('có chưa') || qLower.includes('có không') || qLower.includes('có tour') || qLower.includes('mở tour') || qLower.includes('đi tour');
  const isPriceQuery = qLower.includes('giá') || qLower.includes('nhiêu tiền') || qLower.includes('chi phí') || qLower.includes('bao nhiêu');
  const isItineraryQuery = qLower.includes('lịch trình') || qLower.includes('đi đâu') || qLower.includes('mấy ngày') || qLower.includes('chương trình');
  const isDepartureQuery = qLower.includes('khởi hành') || qLower.includes('ngày đi') || qLower.includes('khi nào đi') || qLower.includes('khi nào có') || qLower.includes('còn chỗ') || qLower.includes('lịch đi');

  if (destInfo) {
    const destName = destInfo.name;
    const searchTerms = destInfo.searchTerms && destInfo.searchTerms.length > 0 
      ? destInfo.searchTerms 
      : [destInfo.name];

    // Tìm tour khớp theo destination hoặc tên tour (tour_name)
    const directClauses = [];
    const directParams = [];
    searchTerms.forEach(term => {
      directClauses.push('(destination LIKE ? OR tour_name LIKE ?)');
      directParams.push(`%${term}%`, `%${term}%`);
    });

    const [matchedTours] = await pool.query(`
      SELECT tour_id, tour_name, destination, duration_days, base_price, description
      FROM tours
      WHERE status = 'Active' AND (${directClauses.join(' OR ')})
      ORDER BY tour_id DESC
    `, directParams);

    // TRƯỜNG HỢP A: CÓ TOUR TRONG CSDL KHỚP VỚI ĐỊA DANH
    if (matchedTours && matchedTours.length > 0) {
      // A.1: Khách hỏi giá tour cụ thể của địa danh
      if (isPriceQuery) {
        let priceReply = `💰 **BẢNG GIÁ TOUR DU LỊCH ${destName.toUpperCase()} TẠI TRAVELVN:**\n\n`;
        matchedTours.forEach((t, i) => {
          priceReply += `${i + 1}. **[${t.tour_name}](/tour/${t.tour_id})**\n`;
          priceReply += `   • ⏱️ Thời lượng: **${t.duration_days} ngày**\n`;
          priceReply += `   • 💵 Giá trọn gói: **${formatVND(t.base_price)}**/khách\n\n`;
        });
        priceReply += `✨ **Giá đã bao gồm:** Xe du lịch đưa đón khứ hồi, khách sạn 3★ - 4★, toàn bộ các bữa ăn đặc sản, vé tham quan và bảo hiểm du lịch.\n`;
        priceReply += `👶 **Trẻ em:** Dưới 2 tuổi miễn phí 100%, 2 - 5 tuổi 50%, 6 - 11 tuổi 75%.`;
        return {
          reply: priceReply,
          suggestions: [`Lịch khởi hành tour ${destName}`, `Lịch trình tour ${destName}`, 'Chính sách hoàn hủy']
        };
      }

      // A.2: Khách hỏi ngày khởi hành tour của địa danh
      if (isDepartureQuery) {
        const tourIds = matchedTours.map(t => t.tour_id);
        const [depRows] = await pool.query(`
          SELECT d.departure_id, d.tour_id, t.tour_name, t.destination, d.departure_date, d.return_date, 
                 d.available_slots, d.max_slots, t.base_price
          FROM departures d
          JOIN tours t ON d.tour_id = t.tour_id
          WHERE d.tour_id IN (?) AND d.departure_date >= CURDATE() AND d.status = 'Open'
          ORDER BY d.departure_date ASC
          LIMIT 5
        `, [tourIds]);

        if (depRows && depRows.length > 0) {
          let depText = `📅 **LỊCH KHỞI HÀNH CÁC TOUR ${destName.toUpperCase()} SẮP TỚI:**\n\n`;
          depRows.forEach((d, idx) => {
            depText += `${idx + 1}. **[${d.tour_name}](/tour/${d.tour_id})**\n`;
            depText += `   - 🗓️ Khởi hành: **${formatDateVN(d.departure_date)}** ➔ Về: **${formatDateVN(d.return_date)}**\n`;
            depText += `   - 🎟️ Số chỗ còn trống: **${d.available_slots}** / ${d.max_slots} chỗ\n`;
            depText += `   - 💵 Giá trọn gói: **${formatVND(d.base_price)}**/khách\n\n`;
          });
          depText += `👉 Quý khách có thể bấm trực tiếp vào tên tour để chọn chuyến và đặt vé giữ chỗ ngay nhé!`;

          return {
            reply: depText,
            suggestions: [`Giá tour ${destName}`, `Lịch trình tour ${destName}`, 'Chính sách thanh toán']
          };
        } else {
          return {
            reply: `📅 **THÔNG TIN KHỞI HÀNH TUYẾN ${destName.toUpperCase()}:**\n\nHiện tại các chuyến định kỳ cho tour ${destName} đang được chuẩn bị cập nhật đợt khởi hành tiếp theo trong tháng.\n\nNếu Quý khách có dự định đi theo đoàn gia đình hoặc công ty, TravelVN có thể **sắp xếp ngày khởi hành linh hoạt theo đúng yêu cầu của Quý khách**!`,
            suggestions: [`Thiết kế tour ${destName} riêng`, `Giá tour ${destName}`, 'Liên hệ tư vấn viên']
          };
        }
      }

      // A.3: Khách hỏi lịch trình tour của địa danh
      if (isItineraryQuery) {
        let itinReply = `🗺️ **LỊCH TRÌNH CÁC TOUR DU LỊCH ${destName.toUpperCase()} ĐANG MỞ BÁN:**\n\n`;
        matchedTours.forEach((t, i) => {
          itinReply += `### ${i + 1}. [${t.tour_name}](/tour/${t.tour_id})\n`;
          itinReply += `• ⏱️ **Thời lượng:** ${t.duration_days} ngày\n`;
          itinReply += `• 💰 **Giá trọn gói:** **${formatVND(t.base_price)}**/khách\n`;
          if (t.description) {
            const shortDesc = t.description.length > 150 ? t.description.slice(0, 150) + '...' : t.description;
            itinReply += `• 📍 **Điểm nổi bật:** ${shortDesc}\n`;
          }
          itinReply += `👉 [Xem chi tiết toàn bộ lịch trình từng ngày](/tour/${t.tour_id})\n\n`;
        });
        itinReply += `💡 Quý khách có thể bấm vào link xem chi tiết để xem toàn bộ điểm tham quan và thực đơn ăn uống trọn gói nhé!`;
        return {
          reply: itinReply,
          suggestions: [`Giá tour ${destName}`, `Lịch khởi hành tour ${destName}`, 'Tư vấn trực tiếp']
        };
      }

      // A.4: Khách hỏi kiểm tra "có tour chưa" hoặc danh sách tour của địa danh
      let replyText = `🏝️ **Dạ TravelVN hiện đang có ${matchedTours.length} tour du lịch ${destName} trọn gói đang mở bán:**\n\n`;

      for (let i = 0; i < matchedTours.length; i++) {
        const t = matchedTours[i];
        const [nextDep] = await pool.query(`
          SELECT departure_date, available_slots
          FROM departures
          WHERE tour_id = ? AND departure_date >= CURDATE() AND status = 'Open'
          ORDER BY departure_date ASC LIMIT 1
        `, [t.tour_id]);

        replyText += `### ${i + 1}. [${t.tour_name}](/tour/${t.tour_id})\n`;
        replyText += `• 📍 **Điểm đến:** ${t.destination || destName} | ⏱️ **Thời lượng:** ${t.duration_days} ngày\n`;
        replyText += `• 💰 **Giá trọn gói:** **${formatVND(t.base_price)}**/khách\n`;
        if (nextDep && nextDep.length > 0) {
          replyText += `• 📅 **Khởi hành gần nhất:** **${formatDateVN(nextDep[0].departure_date)}** (Còn ${nextDep[0].available_slots} chỗ)\n`;
        }
        if (t.description) {
          const shortDesc = t.description.length > 100 ? t.description.slice(0, 100) + '...' : t.description;
          replyText += `• 📝 *${shortDesc}*\n`;
        }
        replyText += `\n`;
      }
      replyText += `💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt vé giữ chỗ trực tuyến ngay ạ!*`;

      return {
        reply: replyText,
        suggestions: [
          `Giá tour ${destName}`,
          `Lịch khởi hành tour ${destName}`,
          'Chính sách giá trẻ em',
          'Tư vấn trực tiếp'
        ]
      };
    } 
    
    // TRƯỜNG HỢP B: ĐỊA DANH CHƯA CÓ TOUR CỐ ĐỊNH TRONG CSDL (VÍ DỤ: NGHỆ AN, THANH HÓA, HÀ TĨNH...)
    else {
      return {
        reply: `Dạ hiện tại TravelVN **chưa có tour cố định mở bán sẵn cho tuyến ${destName}** ạ! 🌿\n\nTuy nhiên, TravelVN có thể hỗ trợ Quý khách theo 2 phương án rất thuận tiện:\n\n1. 🎯 **Thiết kế tour riêng theo yêu cầu đến ${destName}:**\n- Thiết kế lịch trình riêng theo sở thích của Quý khách hoặc đoàn công ty/gia đình.\n- Tự do chọn số ngày, điểm tham quan, tiêu chuẩn khách sạn (3★ - 5★) và thời gian xuất phát.\n- Báo giá dự toán minh bạch, nhanh chóng chỉ trong 5 phút.\n\n2. 🚌 **Dịch vụ Đội xe du lịch từ 4 đến 45 chỗ đời mới:**\n- Thuê xe riêng có tài xế chuyên nghiệp, lịch sự đưa đón đoàn đi ${destName} trọn gói an toàn.\n\nQuý khách có thể cho em biết đoàn mình dự kiến đi bao nhiêu người và mấy ngày để chuyên viên TravelVN lên lịch trình và dự toán chi phí tốt nhất nhé!`,
        suggestions: [
          `Thiết kế tour ${destName} riêng`,
          `Thuê xe đi ${destName}`,
          'Xem các tour đang mở bán',
          'Liên hệ tư vấn viên'
        ]
      };
    }
  }

  // -------------------------------------------------------------
  // 12. CÂU HỎI VỀ LỊCH KHỞI HÀNH CHUNG (KHÔNG CÓ ĐỊA DANH)
  // -------------------------------------------------------------
  if (isDepartureQuery) {
    try {
      const [depRows] = await pool.query(`
        SELECT d.departure_id, d.tour_id, t.tour_name, t.destination, d.departure_date, d.return_date, 
               d.available_slots, d.max_slots, t.base_price
        FROM departures d
        JOIN tours t ON d.tour_id = t.tour_id
        WHERE d.departure_date >= CURDATE() AND d.status = 'Open' AND t.status = 'Active'
        ORDER BY d.departure_date ASC
        LIMIT 5
      `);

      if (depRows && depRows.length > 0) {
        let depText = `📅 **LỊCH KHỞI HÀNH CÁC TOUR DU LỊCH GẦN NHẤT:**\n\nDưới đây là danh sách các tour đang mở nhận khách sắp tới:\n\n`;
        depRows.forEach((d, idx) => {
          depText += `${idx + 1}. **[${d.tour_name}](/tour/${d.tour_id})**\n`;
          depText += `   - 🗓️ Khởi hành: **${formatDateVN(d.departure_date)}** ➔ Về: **${formatDateVN(d.return_date)}**\n`;
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

  // -------------------------------------------------------------
  // 13. CÂU HỎI XEM DANH SÁCH TOUR TỔNG QUÁT (CHỈ KHI THỰC SỰ HỎI VỀ TOUR)
  // -------------------------------------------------------------
  const isGeneralTourRequest = qLower.includes('có những tour nào') || qLower.includes('các tour đang mở') || qLower.includes('danh sách tour') || qLower.includes('tour hot') || qLower.includes('tour nổi bật') || qLower.includes('giới thiệu tour') || qLower.includes('xem tour');

  if (isGeneralTourRequest) {
    try {
      const [tours] = await pool.query(`
        SELECT tour_id, tour_name, destination, duration_days, base_price, description
        FROM tours
        WHERE status = 'Active'
        ORDER BY tour_id DESC
        LIMIT 5
      `);

      if (tours && tours.length > 0) {
        let tourText = `🌟 **CÁC TOUR DU LỊCH NỔI BẬT ĐANG MỞ BÁN TẠI TRAVELVN:**\n\n`;

        for (let i = 0; i < tours.length; i++) {
          const t = tours[i];
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
          tourText += `\n`;
        }

        tourText += `💡 *Quý khách có thể bấm trực tiếp vào tên tour để xem chi tiết lịch trình và đặt vé trực tuyến ngay!*`;

        return {
          reply: tourText,
          suggestions: ['Tour Đà Lạt', 'Tour Tây Ninh', 'Thuê xe du lịch', 'Chính sách giá trẻ em']
        };
      }
    } catch (err) {
      console.error('Lỗi truy vấn tours:', err);
    }
  }

  // -------------------------------------------------------------
  // 14. TRƯỜNG HỢP CÂU HỎI TỰ DO / TƯ VẤN CHUNG
  // -------------------------------------------------------------
  return {
    reply: `Dạ em đã ghi nhận câu hỏi của Quý khách: *"${qRaw}"*.\n\n🤖 Để em hỗ trợ Quý khách chính xác và nhanh nhất, Quý khách có thể cho em biết thêm:\n1. Quý khách đang quan tâm đến **địa điểm du lịch nào** (ví dụ: *Đà Lạt, Phú Quốc, Nghệ An, Miền Tây, Tây Ninh...*)?\n2. Hoặc Quý khách cần thông tin về **Giá vé, Lịch khởi hành, Thuê xe du lịch hay Thiết kế tour riêng**?\n\nQuý khách cũng có thể chọn nhanh một trong các gợi ý bên dưới hoặc bấm nút **Message tròn màu xanh** để gặp tư vấn viên trực tiếp ạ!`,
    suggestions: [
      'Tour Đà Lạt có những tour nào?',
      'Tour Tây Ninh 1 ngày',
      'Lịch khởi hành sắp tới',
      'Bảng giá thuê xe du lịch',
      'Chính sách hủy đổi vé'
    ]
  };
}

function isGreeting(text) {
  const greetings = ['xin chào', 'chào', 'hello', 'hi', 'alo', 'bạn là ai', 'chào bạn', 'hey', 'ad ơi', 'admin ơi', 'chào em', 'alo em'];
  return greetings.some(g => text === g || text.startsWith(g + ' ') || text.endsWith(' ' + g));
}

module.exports = {
  processAIQuery,
  extractDestination
};
