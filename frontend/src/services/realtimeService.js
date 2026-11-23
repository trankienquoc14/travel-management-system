import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const REALTIME_SERVER_URL = 'http://localhost:5005';

let socketInstance = null;
const listeners = new Map();

/**
 * Lấy hoặc khởi tạo kết nối Socket.IO duy nhất (Singleton) cho toàn ứng dụng
 */
export const getRealtimeSocket = () => {
  if (!socketInstance) {
    socketInstance = io(REALTIME_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socketInstance.on('connect', () => {
      // console.log('⚡ [Realtime] Connected to Realtime Event Bus:', socketInstance.id);
      syncUserRooms();
    });

    socketInstance.on('disconnect', (reason) => {
      // console.log('⚠️ [Realtime] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      // console.warn('❌ [Realtime] Connection error:', error.message);
    });
  }
  return socketInstance;
};

/**
 * Đăng ký phòng theo User ID và Role
 */
export const syncUserRooms = () => {
  const socket = getRealtimeSocket();
  if (!socket || !socket.connected) return;

  try {
    const storedUserStr = localStorage.getItem('user');
    if (storedUserStr) {
      const user = JSON.parse(storedUserStr);
      const userId = user.id || user.user_id || user.userId;
      const roleId = Number(user.role || user.role_id);

      if (userId) socket.emit('join_user', userId);
      if (roleId) socket.emit('join_role', roleId);

      // Nếu là nhân viên hoặc admin (role 1, 3, 4, 5) -> tham gia staff_room
      if ([1, 3, 4, 5].includes(roleId)) {
        socket.emit('join_staff');
      }
    }
  } catch (e) {
    console.error('Error syncing user rooms:', e);
  }
};

/**
 * Đăng ký lắng nghe sự kiện realtime
 * @param {string} event - Tên sự kiện ('realtime:booking', 'realtime:tour', 'realtime:request', 'realtime:fleet', 'realtime:dashboard', 'realtime:notification')
 * @param {Function} callback - Hàm thực thi khi có sự kiện
 * @returns {Function} Hàm hủy đăng ký
 */
export const subscribeRealtime = (event, callback) => {
  const socket = getRealtimeSocket();

  if (!listeners.has(event)) {
    listeners.set(event, new Set());
    socket.on(event, (data) => {
      const cbs = listeners.get(event);
      if (cbs) {
        cbs.forEach(cb => {
          try {
            cb(data);
          } catch (err) {
            console.error(`[Realtime] Error in event listener for ${event}:`, err);
          }
        });
      }
    });
  }

  listeners.get(event).add(callback);

  // Trả về hàm hủy đăng ký
  return () => {
    const cbs = listeners.get(event);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) {
        listeners.delete(event);
        socket.off(event);
      }
    }
  };
};

/**
 * React Hook để các Component dễ dàng lắng nghe sự kiện realtime và tự động reload data
 * @param {string|string[]} events - Một hoặc nhiều sự kiện cần lắng nghe
 * @param {Function} callback - Hàm callback (thường là hàm fetch data của component)
 * @param {boolean} [listenVisibility=true] - Tự động refresh khi người dùng quay lại tab trình duyệt
 */
export const useRealtime = (events, callback, listenVisibility = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const eventList = Array.isArray(events) ? events : [events];
    const unsubs = [];

    const handler = (data) => {
      if (savedCallback.current) {
        savedCallback.current(data);
      }
    };

    eventList.forEach(evt => {
      unsubs.push(subscribeRealtime(evt, handler));
    });

    // Smart Focus: Khi người dùng mở lại tab trình duyệt sau khi làm việc khác
    let onVisibilityChange = null;
    if (listenVisibility) {
      onVisibilityChange = () => {
        if (document.visibilityState === 'visible' && savedCallback.current) {
          savedCallback.current({ type: 'visibility_change' });
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('focus', onVisibilityChange);
    }

    return () => {
      unsubs.forEach(unsub => unsub());
      if (onVisibilityChange) {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('focus', onVisibilityChange);
      }
    };
  }, [Array.isArray(events) ? events.join(',') : events, listenVisibility]);
};

export default {
  getRealtimeSocket,
  syncUserRooms,
  subscribeRealtime,
  useRealtime
};
