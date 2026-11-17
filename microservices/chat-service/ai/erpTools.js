/**
 * ERP Database Tools for Gemini Function Calling
 * All queries are strictly read-only, parameterized, bounded, and enforce JWT ownership for personal data.
 */

const { Type } = require('@google/genai');

const GEMINI_TOOL_DECLARATIONS = [
  {
    name: 'searchTours',
    description:
      'Tìm kiếm danh sách tour du lịch đang hoạt động trong CSDL TravelVN ERP theo địa điểm, từ khóa tên tour, ngân sách tối đa (VNĐ) hoặc số ngày. Trả về tối đa 8 tour kèm giá và đợt khởi hành gần nhất.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        destination: {
          type: Type.STRING,
          description: 'Tên địa điểm muốn đi (ví dụ: Đà Lạt, Phú Quốc, Nha Trang, Đà Nẵng, Sapa, Hà Nội, Phan Thiết, Hạ Long).'
        },
        keyword: {
          type: Type.STRING,
          description: 'Từ khóa tìm trong tên tour hoặc mô tả.'
        },
        maxPrice: {
          type: Type.NUMBER,
          description: 'Ngân sách tối đa cho mỗi khách (VNĐ).'
        },
        minDays: {
          type: Type.INTEGER,
          description: 'Số ngày tối thiểu.'
        },
        maxDays: {
          type: Type.INTEGER,
          description: 'Số ngày tối đa.'
        }
      }
    }
  },
  {
    name: 'getTourDetailsAndItinerary',
    description:
      'Lấy thông tin chi tiết của một tour cụ thể gồm mô tả, giá niêm yết, số ngày, lịch trình chi tiết từng ngày và các đợt khởi hành sắp tới.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tourId: {
          type: Type.INTEGER,
          description: 'Mã tour (tour_id) nếu đã biết.'
        },
        tourName: {
          type: Type.STRING,
          description: 'Tên tour hoặc địa điểm của tour cần xem chi tiết.'
        }
      }
    }
  },
  {
    name: 'getTourDeparturesAndSlots',
    description:
      'Kiểm tra lịch khởi hành, ngày về và số chỗ còn trống (available_slots) thực tế của các tour sắp khởi hành.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tourId: {
          type: Type.INTEGER,
          description: 'Mã tour (tour_id) cần kiểm tra chỗ trống.'
        },
        destination: {
          type: Type.STRING,
          description: 'Tên địa điểm cần kiểm tra lịch khởi hành và chỗ trống.'
        }
      }
    }
  },
  {
    name: 'listAvailableVehicles',
    description:
      'Tra cứu các dòng xe du lịch hiện có và đang sẵn sàng phục vụ (4 chỗ, 7 chỗ, 16 chỗ, 29 chỗ, 45 chỗ...).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        minSeats: {
          type: Type.INTEGER,
          description: 'Số chỗ ngồi tối thiểu cần tìm.'
        }
      }
    }
  },
  {
    name: 'getMyBookings',
    description:
      'Tra cứu các đơn đặt tour của CHÍNH khách hàng đang đăng nhập (dựa trên JWT xác thực). Tuyệt đối không dùng để tra cứu đơn hàng của người khác.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingId: {
          type: Type.INTEGER,
          description: 'Mã đơn đặt tour cụ thể (tùy chọn).'
        }
      }
    }
  }
];

function formatDateVi(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('vi-VN');
}

async function searchTours(pool, args = {}) {
  const { destination, keyword, maxPrice, minDays, maxDays } = args;
  const where = [`t.status = 'Active'`, `(t.is_custom IS NULL OR t.is_custom = 0)`];
  const params = [];

  if (destination && String(destination).trim()) {
    const like = `%${String(destination).trim()}%`;
    where.push(`(t.destination LIKE ? OR t.tour_name LIKE ?)`);
    params.push(like, like);
  }
  if (keyword && String(keyword).trim()) {
    const like = `%${String(keyword).trim()}%`;
    where.push(`(t.tour_name LIKE ? OR t.destination LIKE ? OR t.description LIKE ?)`);
    params.push(like, like, like);
  }
  if (typeof maxPrice === 'number' && maxPrice > 0) {
    where.push(`t.base_price <= ?`);
    params.push(maxPrice);
  }
  if (typeof minDays === 'number' && minDays > 0) {
    where.push(`t.duration_days >= ?`);
    params.push(minDays);
  }
  if (typeof maxDays === 'number' && maxDays > 0) {
    where.push(`t.duration_days <= ?`);
    params.push(maxDays);
  }

  const sql = `
    SELECT
      t.tour_id,
      t.tour_name,
      t.destination,
      t.duration_days,
      t.base_price,
      LEFT(COALESCE(t.description, ''), 240) AS short_description,
      MIN(CASE WHEN d.departure_date >= CURDATE() AND d.available_slots > 0 THEN d.departure_date ELSE NULL END) AS next_departure_date,
      COALESCE(SUM(CASE WHEN d.departure_date >= CURDATE() AND d.available_slots > 0 THEN d.available_slots ELSE 0 END), 0) AS total_available_slots
    FROM tours t
    LEFT JOIN departures d ON t.tour_id = d.tour_id
    WHERE ${where.join(' AND ')}
    GROUP BY t.tour_id, t.tour_name, t.destination, t.duration_days, t.base_price, t.description
    ORDER BY total_available_slots DESC, t.tour_id DESC
    LIMIT 8
  `;

  const [rows] = await pool.query(sql, params);
  return {
    count: rows.length,
    tours: rows.map((r) => ({
      tour_id: r.tour_id,
      tour_name: r.tour_name,
      destination: r.destination,
      duration_days: r.duration_days,
      base_price_vnd: Number(r.base_price || 0),
      short_description: r.short_description,
      next_departure_date: formatDateVi(r.next_departure_date),
      total_available_slots: Number(r.total_available_slots || 0),
      detail_path: `/tour/${r.tour_id}`
    }))
  };
}

async function getTourDetailsAndItinerary(pool, args = {}) {
  const { tourId, tourName } = args;
  let tourRows = [];

  if (tourId) {
    const [rows] = await pool.query(
      `SELECT tour_id, tour_name, destination, duration_days, base_price, description
       FROM tours WHERE tour_id = ? AND status = 'Active' LIMIT 1`,
      [Number(tourId)]
    );
    tourRows = rows;
  } else if (tourName && String(tourName).trim()) {
    const like = `%${String(tourName).trim()}%`;
    const [rows] = await pool.query(
      `SELECT tour_id, tour_name, destination, duration_days, base_price, description
       FROM tours
       WHERE status = 'Active' AND (is_custom IS NULL OR is_custom = 0)
         AND (tour_name LIKE ? OR destination LIKE ?)
       ORDER BY tour_id DESC LIMIT 1`,
      [like, like]
    );
    tourRows = rows;
  }

  if (!tourRows.length) {
    return { found: false, message: 'Không tìm thấy tour phù hợp trong cơ sở dữ liệu.' };
  }

  const tour = tourRows[0];
  const [itineraries] = await pool.query(
    `SELECT day_number, title, description
     FROM itineraries WHERE tour_id = ? ORDER BY day_number ASC`,
    [tour.tour_id]
  );

  const [departures] = await pool.query(
    `SELECT departure_id, departure_date, return_date, available_slots, max_slots, status
     FROM departures
     WHERE tour_id = ? AND departure_date >= CURDATE()
     ORDER BY departure_date ASC LIMIT 6`,
    [tour.tour_id]
  );

  return {
    found: true,
    tour: {
      tour_id: tour.tour_id,
      tour_name: tour.tour_name,
      destination: tour.destination,
      duration_days: tour.duration_days,
      base_price_vnd: Number(tour.base_price || 0),
      description: tour.description || '',
      detail_path: `/tour/${tour.tour_id}`
    },
    itinerary: itineraries.map((it) => ({
      day: it.day_number,
      title: it.title,
      description: it.description
    })),
    upcoming_departures: departures.map((d) => ({
      departure_id: d.departure_id,
      departure_date: formatDateVi(d.departure_date),
      return_date: formatDateVi(d.return_date),
      available_slots: Number(d.available_slots || 0),
      max_slots: Number(d.max_slots || 0),
      status: d.status
    }))
  };
}

async function getTourDeparturesAndSlots(pool, args = {}) {
  const { tourId, destination } = args;
  const where = [`t.status = 'Active'`, `d.departure_date >= CURDATE()`];
  const params = [];

  if (tourId) {
    where.push(`t.tour_id = ?`);
    params.push(Number(tourId));
  }
  if (destination && String(destination).trim()) {
    const like = `%${String(destination).trim()}%`;
    where.push(`(t.destination LIKE ? OR t.tour_name LIKE ?)`);
    params.push(like, like);
  }

  const [rows] = await pool.query(
    `SELECT d.departure_id, t.tour_id, t.tour_name, t.destination, t.base_price,
            d.departure_date, d.return_date, d.available_slots, d.max_slots, d.status
     FROM departures d
     JOIN tours t ON d.tour_id = t.tour_id
     WHERE ${where.join(' AND ')}
     ORDER BY d.departure_date ASC
     LIMIT 10`,
    params
  );

  return {
    count: rows.length,
    departures: rows.map((d) => ({
      departure_id: d.departure_id,
      tour_id: d.tour_id,
      tour_name: d.tour_name,
      destination: d.destination,
      base_price_vnd: Number(d.base_price || 0),
      departure_date: formatDateVi(d.departure_date),
      return_date: formatDateVi(d.return_date),
      available_slots: Number(d.available_slots || 0),
      max_slots: Number(d.max_slots || 0),
      status: d.status,
      detail_path: `/tour/${d.tour_id}`
    }))
  };
}

async function listAvailableVehicles(pool, args = {}) {
  const { minSeats } = args;
  const where = [`status = 'Available'`];
  const params = [];
  if (typeof minSeats === 'number' && minSeats > 0) {
    where.push(`seat_capacity >= ?`);
    params.push(minSeats);
  }

  const [rows] = await pool.query(
    `SELECT vehicle_type, seat_capacity, COUNT(*) AS available_count
     FROM vehicles
     WHERE ${where.join(' AND ')}
     GROUP BY vehicle_type, seat_capacity
     ORDER BY seat_capacity ASC`,
    params
  );

  return {
    count: rows.length,
    vehicles: rows.map((v) => ({
      vehicle_type: v.vehicle_type,
      seat_capacity: Number(v.seat_capacity),
      available_count: Number(v.available_count)
    }))
  };
}

async function getMyBookings(pool, args = {}, context = {}) {
  const userId = context.authUser?.user_id || context.authUser?.id;
  if (!userId) {
    return {
      authorized: false,
      error: 'UNAUTHENTICATED',
      message:
        'Người dùng chưa đăng nhập. Không thể tra cứu đơn hàng cá nhân và tuyệt đối không được trả lời thông tin đơn hàng của khách hàng khác.'
    };
  }

  const params = [Number(userId)];
  let extraWhere = '';
  if (args.bookingId) {
    extraWhere = 'AND b.booking_id = ?';
    params.push(Number(args.bookingId));
  }

  const [rows] = await pool.query(
    `SELECT b.booking_id, b.num_people, b.total_price, b.booking_status, b.payment_status, b.booking_date,
            d.departure_date, d.return_date,
            COALESCE(t.tour_name, 'Tour thiết kế riêng') AS tour_name,
            t.destination
     FROM bookings b
     LEFT JOIN departures d ON b.departure_id = d.departure_id
     LEFT JOIN tours t ON d.tour_id = t.tour_id
     WHERE b.customer_id = ? ${extraWhere}
     ORDER BY b.booking_id DESC
     LIMIT 5`,
    params
  );

  return {
    authorized: true,
    count: rows.length,
    bookings: rows.map((b) => ({
      booking_code: `#BKG-${String(b.booking_id).padStart(4, '0')}`,
      tour_name: b.tour_name,
      destination: b.destination || 'Theo yêu cầu',
      num_people: Number(b.num_people || 0),
      total_price_vnd: Number(b.total_price || 0),
      booking_status: b.booking_status,
      payment_status: b.payment_status,
      departure_date: formatDateVi(b.departure_date),
      return_date: formatDateVi(b.return_date)
    }))
  };
}

async function executeErpTool(pool, toolName, args, context) {
  switch (toolName) {
    case 'searchTours':
      return searchTours(pool, args);
    case 'getTourDetailsAndItinerary':
      return getTourDetailsAndItinerary(pool, args);
    case 'getTourDeparturesAndSlots':
      return getTourDeparturesAndSlots(pool, args);
    case 'listAvailableVehicles':
      return listAvailableVehicles(pool, args);
    case 'getMyBookings':
      return getMyBookings(pool, args, context);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

module.exports = {
  GEMINI_TOOL_DECLARATIONS,
  executeErpTool
};
