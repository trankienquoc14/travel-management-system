/**
 * Geographic Coordinates Dictionary & Distance Calculation Engine
 * for TravelVN Tour Copilot / Assistant.
 *
 * Provides accurate coordinates for tourist attractions and city centers in Vietnam,
 * Haversine distance matrix with road curvature factor (1.25 - 1.35x),
 * estimated driving time calculation, and route leg analysis.
 */

const fs = require('fs');
const path = require('path');
const { normalizeVi } = require('./knowledgeBase');

// Tọa độ các trung tâm tỉnh/thành phố du lịch chính (dùng làm fallback mốc định vị)
const CITY_COORDINATES = {
  'ha noi': { lat: 21.0285, lng: 105.8542, name: 'Hà Nội' },
  'ho chi minh': { lat: 10.7769, lng: 106.7009, name: 'Hồ Chí Minh' },
  'da nang': { lat: 16.0544, lng: 108.2022, name: 'Đà Nẵng' },
  'da lat': { lat: 11.9404, lng: 108.4583, name: 'Đà Lạt' },
  'nha trang': { lat: 12.2388, lng: 109.1967, name: 'Nha Trang' },
  'phu quoc': { lat: 10.2899, lng: 103.9840, name: 'Phú Quốc' },
  'sapa': { lat: 22.3364, lng: 103.8438, name: 'Sapa' },
  'ha long': { lat: 20.9505, lng: 107.0734, name: 'Hạ Long' },
  'ninh binh': { lat: 20.2506, lng: 105.9745, name: 'Ninh Bình' },
  'hue': { lat: 16.4637, lng: 107.5909, name: 'Huế' },
  'hoi an': { lat: 15.8801, lng: 108.3380, name: 'Hội An' },
  'phan thiet': { lat: 10.9264, lng: 108.1022, name: 'Phan Thiết' },
  'can tho': { lat: 10.0452, lng: 105.7469, name: 'Cần Thơ' },
  'vung tau': { lat: 10.3460, lng: 107.0843, name: 'Vũng Tàu' },
  'quy nhon': { lat: 13.7830, lng: 109.2197, name: 'Quy Nhơn' },
  'phu yen': { lat: 13.0882, lng: 109.3094, name: 'Phú Yên' },
  'quang binh': { lat: 17.4690, lng: 106.6200, name: 'Quảng Bình' },
  'hai phong': { lat: 20.8449, lng: 106.6881, name: 'Hải Phòng' },
  'tay ninh': { lat: 11.3100, lng: 106.0983, name: 'Tây Ninh' },
  'buon ma thuot': { lat: 12.6667, lng: 108.0500, name: 'Buôn Ma Thuột' }
};

// Từ điển tọa độ chính xác cho các danh lam thắng cảnh, điểm tham quan khắp Việt Nam
const PLACE_COORDINATES = {
  // === ĐÀ NẴNG ===
  'ba na hills': { lat: 15.9988, lng: 107.9964, city: 'Đà Nẵng' },
  'cau vang': { lat: 15.9950, lng: 107.9965, city: 'Đà Nẵng' },
  'ban dao son tra': { lat: 16.1075, lng: 108.2778, city: 'Đà Nẵng' },
  'chua linh ung': { lat: 16.1075, lng: 108.2778, city: 'Đà Nẵng' },
  'ngu hanh son': { lat: 16.0044, lng: 108.2633, city: 'Đà Nẵng' },
  'bien my khe': { lat: 16.0601, lng: 108.2464, city: 'Đà Nẵng' },
  'cau rong': { lat: 16.0611, lng: 108.2272, city: 'Đà Nẵng' },
  'bao tang cham': { lat: 16.0604, lng: 108.2235, city: 'Đà Nẵng' },
  'cho han': { lat: 16.0682, lng: 108.2246, city: 'Đà Nẵng' },

  // === HỘI AN & QUẢNG NAM ===
  'pho co hoi an': { lat: 15.8801, lng: 108.3380, city: 'Hội An' },
  'chua cau hoi an': { lat: 15.8771, lng: 108.3259, city: 'Hội An' },
  'rung dua bay mau': { lat: 15.8715, lng: 108.3745, city: 'Hội An' },
  'thanh dia my son': { lat: 15.7958, lng: 108.1242, city: 'Quảng Nam' },
  'vinwonders nam hoi an': { lat: 15.7622, lng: 108.4124, city: 'Hội An' },
  'lang gom thanh ha': { lat: 15.8812, lng: 108.3045, city: 'Hội An' },
  'bien an bang': { lat: 15.9080, lng: 108.3385, city: 'Hội An' },

  // === HÀ NỘI ===
  'ho guom': { lat: 21.0285, lng: 105.8542, city: 'Hà Nội' },
  'ho hoan kiem': { lat: 21.0285, lng: 105.8542, city: 'Hà Nội' },
  'den ngoc son': { lat: 21.0307, lng: 105.8524, city: 'Hà Nội' },
  'van mieu quoc tu giam': { lat: 21.0275, lng: 105.8355, city: 'Hà Nội' },
  'lang chu tich ho chi minh': { lat: 21.0368, lng: 105.8346, city: 'Hà Nội' },
  'lang bac': { lat: 21.0368, lng: 105.8346, city: 'Hà Nội' },
  'chua mot cot': { lat: 21.0358, lng: 105.8333, city: 'Hà Nội' },
  'nha tu hoa lo': { lat: 21.0253, lng: 105.8465, city: 'Hà Nội' },
  'ho tay': { lat: 21.0583, lng: 105.8236, city: 'Hà Nội' },
  'chua tran quoc': { lat: 21.0478, lng: 105.8364, city: 'Hà Nội' },
  'nha hat lon ha noi': { lat: 21.0242, lng: 105.8576, city: 'Hà Nội' },
  'cho dong xuan': { lat: 21.0374, lng: 105.8497, city: 'Hà Nội' },
  'pho co ha noi': { lat: 21.0350, lng: 105.8500, city: 'Hà Nội' },
  'hoang thanh thang long': { lat: 21.0333, lng: 105.8400, city: 'Hà Nội' },

  // === TP. HỒ CHÍ MINH ===
  'dinh doc lap': { lat: 10.7770, lng: 106.6953, city: 'Hồ Chí Minh' },
  'nha tho duc ba': { lat: 10.7798, lng: 106.6990, city: 'Hồ Chí Minh' },
  'buu dien trung tam sai gon': { lat: 10.7799, lng: 106.6999, city: 'Hồ Chí Minh' },
  'cho ben thanh': { lat: 10.7725, lng: 106.6980, city: 'Hồ Chí Minh' },
  'pho di bo nguyen hue': { lat: 10.7743, lng: 106.7032, city: 'Hồ Chí Minh' },
  'bao tang chung tich chien tranh': { lat: 10.7794, lng: 106.6922, city: 'Hồ Chí Minh' },
  'toa nha landmark 81': { lat: 10.7951, lng: 106.7218, city: 'Hồ Chí Minh' },
  'dia dao cu chi': { lat: 11.1432, lng: 106.4636, city: 'Hồ Chí Minh' },
  'khu du lich suoi tien': { lat: 10.8660, lng: 106.8028, city: 'Hồ Chí Minh' },
  'cong vien nuoc dam sen': { lat: 10.7686, lng: 106.6375, city: 'Hồ Chí Minh' },
  'cho lon': { lat: 10.7533, lng: 106.6567, city: 'Hồ Chí Minh' },
  'chua ba thien hau': { lat: 10.7539, lng: 106.6601, city: 'Hồ Chí Minh' },

  // === NHA TRANG (KHÁNH HÒA) ===
  'thap ba ponagar': { lat: 12.2655, lng: 109.1958, city: 'Nha Trang' },
  'vinwonders nha trang': { lat: 12.2215, lng: 109.2435, city: 'Nha Trang' },
  'dao hon tre': { lat: 12.2215, lng: 109.2435, city: 'Nha Trang' },
  'vien hai duong hoc': { lat: 12.2066, lng: 109.2155, city: 'Nha Trang' },
  'chua long son': { lat: 12.2505, lng: 109.1804, city: 'Nha Trang' },
  'hon chong': { lat: 12.2725, lng: 109.2057, city: 'Nha Trang' },
  'suoi khoang nong i-resort': { lat: 12.2782, lng: 109.1672, city: 'Nha Trang' },
  'tam bun i-resort': { lat: 12.2782, lng: 109.1672, city: 'Nha Trang' },
  'dao hon mun': { lat: 12.1670, lng: 109.3030, city: 'Nha Trang' },
  'dao hon tam': { lat: 12.1794, lng: 109.2415, city: 'Nha Trang' },
  'bien nha trang': { lat: 12.2450, lng: 109.1960, city: 'Nha Trang' },
  'cho dam': { lat: 12.2533, lng: 109.1917, city: 'Nha Trang' },
  'thap tram huong': { lat: 12.2389, lng: 109.1962, city: 'Nha Trang' },

  // === ĐÀ LẠT (LÂM ĐỒNG) ===
  'dinh langbiang': { lat: 12.0465, lng: 108.4385, city: 'Đà Lạt' },
  'nui langbiang': { lat: 12.0465, lng: 108.4385, city: 'Đà Lạt' },
  'ho xuan huong': { lat: 11.9405, lng: 108.4452, city: 'Đà Lạt' },
  'ho tuyen lam': { lat: 11.8893, lng: 108.4338, city: 'Đà Lạt' },
  'thien vien truc lam da lat': { lat: 11.9022, lng: 108.4347, city: 'Đà Lạt' },
  'thac datanla': { lat: 11.9028, lng: 108.4485, city: 'Đà Lạt' },
  'thung lung tinh yeu': { lat: 11.9772, lng: 108.4480, city: 'Đà Lạt' },
  'cho dem da lat': { lat: 11.9424, lng: 108.4376, city: 'Đà Lạt' },
  'quang truong lam vien': { lat: 11.9360, lng: 108.4440, city: 'Đà Lạt' },
  'samten hills dalat': { lat: 11.7580, lng: 108.4460, city: 'Đà Lạt' },
  'vuon hoa thanh pho da lat': { lat: 11.9515, lng: 108.4516, city: 'Đà Lạt' },
  'nha tho domain de marie': { lat: 11.9489, lng: 108.4286, city: 'Đà Lạt' },
  'ga da lat': { lat: 11.9416, lng: 108.4550, city: 'Đà Lạt' },
  'dinh bao dai': { lat: 11.9297, lng: 108.4303, city: 'Đà Lạt' },
  'doi che cau dat': { lat: 11.8670, lng: 108.5630, city: 'Đà Lạt' },

  // === PHÚ QUỐC (KIÊN GIANG) ===
  'grand world phu quoc': { lat: 10.3235, lng: 103.8601, city: 'Phú Quốc' },
  'vinwonders phu quoc': { lat: 10.3370, lng: 103.8560, city: 'Phú Quốc' },
  'vinpearl safari phu quoc': { lat: 10.3540, lng: 103.8820, city: 'Phú Quốc' },
  'hon thom': { lat: 10.0160, lng: 104.0150, city: 'Phú Quốc' },
  'cap treo hon thom': { lat: 10.0300, lng: 104.0100, city: 'Phú Quốc' },
  'bai sao': { lat: 10.0545, lng: 104.0330, city: 'Phú Quốc' },
  'dinh cau': { lat: 10.2173, lng: 103.9577, city: 'Phú Quốc' },
  'cho dem phu quoc': { lat: 10.2190, lng: 103.9600, city: 'Phú Quốc' },
  'suoi tranh': { lat: 10.2033, lng: 103.9989, city: 'Phú Quốc' },
  'nha tu phu quoc': { lat: 10.0460, lng: 104.0190, city: 'Phú Quốc' },
  'lang chai ham ninh': { lat: 10.1800, lng: 104.0450, city: 'Phú Quốc' },
  'bai dai phu quoc': { lat: 10.3200, lng: 103.8500, city: 'Phú Quốc' },

  // === SAPA (LÀO CAI) ===
  'fansipan': { lat: 22.3034, lng: 103.7750, city: 'Sapa' },
  'dinh fansipan': { lat: 22.3034, lng: 103.7750, city: 'Sapa' },
  'sun world fansipan legend': { lat: 22.3250, lng: 103.8200, city: 'Sapa' },
  'ban cat cat': { lat: 22.3275, lng: 103.8322, city: 'Sapa' },
  'deo o quy ho': { lat: 22.3556, lng: 103.7747, city: 'Sapa' },
  'cong troi sapa': { lat: 22.3556, lng: 103.7747, city: 'Sapa' },
  'nui ham rong': { lat: 22.3338, lng: 103.8436, city: 'Sapa' },
  'thung lung muong hoa': { lat: 22.3021, lng: 103.8860, city: 'Sapa' },
  'thac bac': { lat: 22.3619, lng: 103.7820, city: 'Sapa' },
  'nha tho da sapa': { lat: 22.3344, lng: 103.8419, city: 'Sapa' },
  'ban ta van': { lat: 22.2980, lng: 103.8920, city: 'Sapa' },

  // === VỊNH HẠ LONG (QUẢNG NINH) ===
  'vinh ha long': { lat: 20.9101, lng: 107.1839, city: 'Hạ Long' },
  'hang sung sot': { lat: 20.8465, lng: 107.0910, city: 'Hạ Long' },
  'dao ti top': { lat: 20.8590, lng: 107.0805, city: 'Hạ Long' },
  'sun world ha long': { lat: 20.9575, lng: 107.0545, city: 'Hạ Long' },
  'dao tuan chau': { lat: 20.9328, lng: 106.9930, city: 'Hạ Long' },
  'bao tang quang ninh': { lat: 20.9500, lng: 107.0930, city: 'Hạ Long' },
  'dong thien cung': { lat: 20.9130, lng: 107.0180, city: 'Hạ Long' },
  'hang luon': { lat: 20.8500, lng: 107.0850, city: 'Hạ Long' },

  // === NINH BÌNH ===
  'trang an': { lat: 20.2536, lng: 105.9080, city: 'Ninh Bình' },
  'quan the danh thang trang an': { lat: 20.2536, lng: 105.9080, city: 'Ninh Bình' },
  'chua bai dinh': { lat: 20.2736, lng: 105.8655, city: 'Ninh Bình' },
  'tam coc': { lat: 20.2185, lng: 105.9392, city: 'Ninh Bình' },
  'tam coc bich dong': { lat: 20.2185, lng: 105.9392, city: 'Ninh Bình' },
  'hang mua': { lat: 20.2312, lng: 105.9419, city: 'Ninh Bình' },
  'co do hoa lu': { lat: 20.2825, lng: 105.9038, city: 'Ninh Bình' },
  'tuyet tinh coc ninh binh': { lat: 20.2700, lng: 105.9150, city: 'Ninh Bình' },
  'vuon quoc gia cuc phuong': { lat: 20.3167, lng: 105.6000, city: 'Ninh Bình' },

  // === HUẾ (THỪA THIÊN HUẾ) ===
  'dai noi hue': { lat: 16.4697, lng: 107.5796, city: 'Huế' },
  'kinh thanh hue': { lat: 16.4697, lng: 107.5796, city: 'Huế' },
  'chua thien mu': { lat: 16.4529, lng: 107.5450, city: 'Huế' },
  'lang khai dinh': { lat: 16.3989, lng: 107.5904, city: 'Huế' },
  'lang tu duc': { lat: 16.4328, lng: 107.5658, city: 'Huế' },
  'cho dong ba': { lat: 16.4716, lng: 107.5878, city: 'Huế' },
  'song huong': { lat: 16.4650, lng: 107.5850, city: 'Huế' },
  'cau trang tien': { lat: 16.4686, lng: 107.5906, city: 'Huế' },

  // === PHAN THIẾT - MŨI NÉ (BÌNH THUẬN) ===
  'doi cat bay': { lat: 10.9472, lng: 108.2934, city: 'Phan Thiết' },
  'doi cat do': { lat: 10.9472, lng: 108.2934, city: 'Phan Thiết' },
  'bau trang': { lat: 11.0664, lng: 108.4237, city: 'Phan Thiết' },
  'suoi tien mui ne': { lat: 10.9525, lng: 108.2619, city: 'Phan Thiết' },
  'lang chai mui ne': { lat: 10.9416, lng: 108.2778, city: 'Phan Thiết' },
  'lau dai ruou vang': { lat: 10.9450, lng: 108.1720, city: 'Phan Thiết' },
  'hai dang ke ga': { lat: 10.7025, lng: 107.9940, city: 'Phan Thiết' },

  // === CẦN THƠ & MIỀN TÂY ===
  'cho noi cai rang': { lat: 10.0053, lng: 105.7460, city: 'Cần Thơ' },
  'ben ninh kieu': { lat: 10.0336, lng: 105.7877, city: 'Cần Thơ' },
  'thien vien truc lam phuong nam': { lat: 9.9880, lng: 105.6980, city: 'Cần Thơ' },
  'nha co binh thuy': { lat: 10.0760, lng: 105.7460, city: 'Cần Thơ' },
  'con son can tho': { lat: 10.0800, lng: 105.7600, city: 'Cần Thơ' },

  // === QUY NHƠN (BÌNH ĐỊNH) ===
  'ky co': { lat: 13.8825, lng: 109.2844, city: 'Quy Nhơn' },
  'eo gio': { lat: 13.8732, lng: 109.2977, city: 'Quy Nhơn' },
  'hon kho': { lat: 13.7667, lng: 109.3000, city: 'Quy Nhơn' },
  'thap doi quy nhon': { lat: 13.7842, lng: 109.2081, city: 'Quy Nhơn' },
  'ghe rang tien sa': { lat: 13.7430, lng: 109.2200, city: 'Quy Nhơn' },

  // === PHÚ YÊN ===
  'ghenh da dia': { lat: 13.3644, lng: 109.2974, city: 'Phú Yên' },
  'bai xep': { lat: 13.2030, lng: 109.2995, city: 'Phú Yên' },
  'ganh ong bai xep': { lat: 13.2030, lng: 109.2995, city: 'Phú Yên' },
  'hai dang dai lanh': { lat: 12.8833, lng: 109.4583, city: 'Phú Yên' },
  'mui dien': { lat: 12.8833, lng: 109.4583, city: 'Phú Yên' },
  'vinh vung ro': { lat: 12.8711, lng: 109.4214, city: 'Phú Yên' },
  'thap nhan': { lat: 13.0850, lng: 109.3050, city: 'Phú Yên' },

  // === QUẢNG BÌNH ===
  'dong phong nha': { lat: 17.5855, lng: 106.2840, city: 'Quảng Bình' },
  'dong thien duong': { lat: 17.5210, lng: 106.2230, city: 'Quảng Bình' },
  'suoi nuoc mooc': { lat: 17.5460, lng: 106.2570, city: 'Quảng Bình' },
  'song chay hang toi': { lat: 17.5500, lng: 106.2600, city: 'Quảng Bình' },
  'bai bien nhat le': { lat: 17.4800, lng: 106.6300, city: 'Quảng Bình' },

  // === VŨNG TÀU ===
  'tuong chua kito vua': { lat: 10.3260, lng: 107.0843, city: 'Vũng Tàu' },
  'hai dang vung tau': { lat: 10.3340, lng: 107.0754, city: 'Vũng Tàu' },
  'bai sau vung tau': { lat: 10.3400, lng: 107.0900, city: 'Vũng Tàu' },
  'bai truoc vung tau': { lat: 10.3450, lng: 107.0720, city: 'Vũng Tàu' },
  'bach dinh': { lat: 10.3520, lng: 107.0694, city: 'Vũng Tàu' },
  'mui nghinh phong': { lat: 10.3220, lng: 107.0840, city: 'Vũng Tàu' }
};

// In-memory cache cho các điểm tìm kiếm mới phát sinh
const DYNAMIC_PLACES_CACHE = new Map();

/**
 * Tra cứu tọa độ của một địa danh bất kỳ
 * @param {string} placeName Tên địa điểm (ví dụ: "Tháp Bà Ponagar")
 * @param {string} destinationHint Gợi ý tỉnh/thành (ví dụ: "Nha Trang")
 * @returns {{ lat: number, lng: number, source: string, matchedName: string } | null}
 */
function getPlaceCoordinates(placeName, destinationHint = '') {
  if (!placeName) return null;
  const rawNorm = normalizeVi(placeName).trim().toLowerCase();
  const destNorm = normalizeVi(destinationHint || '').trim().toLowerCase();

  // 1. Kiểm tra cache động trước
  const cacheKey = `${rawNorm}_${destNorm}`;
  if (DYNAMIC_PLACES_CACHE.has(cacheKey)) {
    return DYNAMIC_PLACES_CACHE.get(cacheKey);
  }

  // 2. So khớp trực tiếp hoặc gần đúng trong từ điển PLACE_COORDINATES
  for (const [key, coord] of Object.entries(PLACE_COORDINATES)) {
    if (rawNorm === key || rawNorm.includes(key) || key.includes(rawNorm)) {
      const res = { lat: coord.lat, lng: coord.lng, source: 'dictionary', matchedName: key };
      DYNAMIC_PLACES_CACHE.set(cacheKey, res);
      return res;
    }
  }

  // 3. Tách từ khóa quan trọng để so khớp mở rộng
  const tokens = rawNorm.split(/\s+/).filter(t => t.length > 2);
  for (const [key, coord] of Object.entries(PLACE_COORDINATES)) {
    const matchCount = tokens.filter(t => key.includes(t)).length;
    if (matchCount >= 2 && (!destNorm || normalizeVi(coord.city).includes(destNorm) || destNorm.includes(normalizeVi(coord.city)))) {
      const res = { lat: coord.lat, lng: coord.lng, source: 'dictionary_fuzzy', matchedName: key };
      DYNAMIC_PLACES_CACHE.set(cacheKey, res);
      return res;
    }
  }

  // 4. Nếu không tìm thấy điểm cụ thể, fallback về tọa độ trung tâm tỉnh/thành nếu có hint
  if (destNorm) {
    for (const [cityKey, cityCoord] of Object.entries(CITY_COORDINATES)) {
      if (destNorm.includes(cityKey) || cityKey.includes(destNorm) || rawNorm.includes(cityKey)) {
        const res = { lat: cityCoord.lat, lng: cityCoord.lng, source: 'city_center', matchedName: cityCoord.name };
        DYNAMIC_PLACES_CACHE.set(cacheKey, res);
        return res;
      }
    }
  }

  // 5. Kiểm tra xem tên có chứa tên tỉnh/thành nào không
  for (const [cityKey, cityCoord] of Object.entries(CITY_COORDINATES)) {
    if (rawNorm.includes(cityKey)) {
      const res = { lat: cityCoord.lat, lng: cityCoord.lng, source: 'city_center_derived', matchedName: cityCoord.name };
      DYNAMIC_PLACES_CACHE.set(cacheKey, res);
      return res;
    }
  }

  return null;
}

/**
 * Tính khoảng cách chim bay theo công thức Haversine (km)
 */
function haversineStraightDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tính khoảng cách đường bộ thực tế (km) và thời gian di chuyển ô tô ước tính (phút)
 * Áp dụng hệ số uốn lượn đường sá Việt Nam (Winding Factor 1.25 - 1.35)
 * @param {{ lat: number, lng: number }} coord1 
 * @param {{ lat: number, lng: number }} coord2 
 * @param {string} region 'mountain' | 'urban' | 'highway'
 * @returns {{ distanceKm: number, durationMinutes: number, formattedDuration: string }}
 */
function calculateRouteDistance(coord1, coord2, region = 'urban') {
  if (!coord1 || !coord2 || typeof coord1.lat !== 'number' || typeof coord2.lat !== 'number') {
    return { distanceKm: 0, durationMinutes: 0, formattedDuration: '0 phút' };
  }

  if (coord1.lat === coord2.lat && coord1.lng === coord2.lng) {
    return { distanceKm: 0, durationMinutes: 0, formattedDuration: '0 phút' };
  }

  const straightKm = haversineStraightDistanceKm(coord1.lat, coord1.lng, coord2.lat, coord2.lng);

  // Hệ số uốn cong đường bộ
  let windingFactor = 1.28;
  if (region === 'mountain' || straightKm > 60) {
    windingFactor = 1.35;
  } else if (straightKm < 5) {
    windingFactor = 1.22;
  }

  const roadKm = Math.round(straightKm * windingFactor * 10) / 10;

  // Tính thời gian di chuyển (vận tốc trung bình ô tô du lịch tại VN)
  let speedKmH = 32; // Nội thành / đô thị / ven biển
  if (roadKm > 50) speedKmH = 55; // Quốc lộ / cao tốc
  else if (roadKm > 20) speedKmH = 42; // Ngoại ô / liên huyện
  else if (roadKm < 6) speedKmH = 22; // Trung tâm phố đi bộ / kẹt xe nhẹ

  const durationMinutes = Math.max(5, Math.round((roadKm / speedKmH) * 60));

  let formattedDuration = `${durationMinutes} phút`;
  if (durationMinutes >= 60) {
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    formattedDuration = mins > 0 ? `${hours}h${mins}p` : `${hours} tiếng`;
  }

  return {
    distanceKm: roadKm,
    durationMinutes,
    formattedDuration
  };
}

/**
 * Phân tích và tính toán ma trận khoảng cách giữa các chặng hoạt động trong ngày
 * Phân định rõ ràng:
 * 1. Chặng trung chuyển liên tỉnh (Intercity Transfer) giữa nơi đón và điểm đến (không gộp vào cự ly tham quan nội tỉnh).
 * 2. Chặng tham quan nội tỉnh (Sightseeing legs) kết nối giữa các điểm du lịch thực tế.
 * @param {Array} activities Danh sách hoạt động của 1 ngày
 * @param {string} destinationName Tên điểm đến của ngày
 * @param {string} departureName Tên nơi khởi hành / đón khách
 * @returns {{ totalKm: number, totalMinutes: number, intercityTransfer: object | null, legs: Array, warnings: Array }}
 */
function analyzeDayLegs(activities, destinationName = '', departureName = '') {
  const acts = Array.isArray(activities) ? activities : [];
  const legs = [];
  const warnings = [];
  let totalKm = 0;
  let totalMinutes = 0;
  let intercityTransfer = null;

  const destCoords = getPlaceCoordinates(destinationName, destinationName);

  // 1. Kiểm tra chặng đón/trung chuyển liên tỉnh ở đầu hoặc cuối ngày
  acts.forEach((act, idx) => {
    if (act.type === 'Di chuyển' && act.name) {
      const actCoords = getPlaceCoordinates(act.name, departureName || destinationName);
      if (actCoords && destCoords) {
        const transferRoute = calculateRouteDistance(actCoords, destCoords);
        // Nếu khoảng cách giữa nơi đón/trả và điểm đến > 50 km => Đây là chặng trung chuyển liên tỉnh
        if (transferRoute.distanceKm >= 50 && !intercityTransfer) {
          intercityTransfer = {
            activityIndex: idx,
            name: act.name,
            fromCity: departureName || actCoords.matchedName || 'Nơi đón',
            toCity: destinationName,
            distanceKm: transferRoute.distanceKm,
            durationMinutes: transferRoute.durationMinutes,
            formattedDuration: transferRoute.formattedDuration
          };
        }
      }
    }
  });

  // 2. Lọc các điểm tham quan thực tế trong ngày để tính cự ly nội tỉnh
  const sightseeingStops = [];
  acts.forEach((act, idx) => {
    if (act.type === 'Tham quan') {
      const coords = getPlaceCoordinates(act.name, destinationName);
      sightseeingStops.push({
        activityIndex: idx,
        name: act.name,
        type: act.type,
        coords
      });
    }
  });

  // 3. Tính khoảng cách giữa các điểm tham quan liên tiếp trong ngày
  for (let i = 0; i < sightseeingStops.length - 1; i++) {
    const fromStop = sightseeingStops[i];
    const toStop = sightseeingStops[i + 1];

    if (fromStop.coords && toStop.coords) {
      const route = calculateRouteDistance(fromStop.coords, toStop.coords);
      legs.push({
        fromIndex: fromStop.activityIndex,
        fromName: fromStop.name,
        toIndex: toStop.activityIndex,
        toName: toStop.name,
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
        formattedDuration: route.formattedDuration,
        isConsecutiveSightseeing: true
      });

      totalKm += route.distanceKm;
      totalMinutes += route.durationMinutes;

      // Cảnh báo nếu một chặng di chuyển tham quan liên điểm quá xa (> 35 km hoặc > 50 phút)
      if (route.distanceKm >= 35) {
        warnings.push({
          type: 'leg_too_far',
          from: fromStop.name,
          to: toStop.name,
          distanceKm: route.distanceKm,
          durationMinutes: route.durationMinutes,
          message: `Chặng từ "${fromStop.name}" đến "${toStop.name}" cách nhau tới ${route.distanceKm} km (~${route.formattedDuration}). Khoảng cách khá xa có thể làm giảm thời gian tham quan.`
        });
      }
    }
  }

  // Cảnh báo nếu tổng cự ly tham quan nội tỉnh trong ngày quá 90 km
  if (totalKm >= 90) {
    warnings.push({
      type: 'day_travel_overload',
      totalKm: Math.round(totalKm * 10) / 10,
      totalMinutes,
      message: `Tổng quãng đường di chuyển tham quan trong ngày lên tới ${Math.round(totalKm * 10) / 10} km (~${Math.round(totalMinutes / 60 * 10) / 10} tiếng ngồi xe). Nên gom các điểm tham quan gần nhau để du khách đỡ mệt mỏi.`
    });
  }

  return {
    totalKm: Math.round(totalKm * 10) / 10,
    totalMinutes,
    intercityTransfer,
    legs,
    warnings
  };
}

module.exports = {
  CITY_COORDINATES,
  PLACE_COORDINATES,
  getPlaceCoordinates,
  haversineStraightDistanceKm,
  calculateRouteDistance,
  analyzeDayLegs
};
