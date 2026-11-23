const axios = require('axios');

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:5005';

/**
 * Phát sự kiện realtime đến các client đang mở trang
 * @param {string} event - Tên sự kiện ('realtime:booking', 'realtime:tour', 'realtime:request', 'realtime:fleet', 'realtime:notification')
 * @param {object} data - Dữ liệu kèm theo
 * @param {string|null} room - Tùy chọn phòng (user_123, staff_room, role_1...)
 */
const broadcastRealtime = async (event, data = {}, room = null) => {
  try {
    await axios.post(`${CHAT_SERVICE_URL}/api/chat/broadcast`, {
      event,
      data,
      room
    }, { timeout: 3000 });
  } catch (err) {
    // Luồng chính không bị gián đoạn nếu realtime tạm bận
  }
};

module.exports = { broadcastRealtime };
