const https = require('https');
const { calculateRooms } = require('../utils/roomCalculator');
const sequelize = require('../config/database');

// =========================================================================
// CẤU HÌNH SEPAY & VIETQR REALTIME (TPBANK - DOAN THI TRAM - 00000419627)
// =========================================================================
const SEPAY_CONFIG = {
  apiToken: process.env.SEPAY_API_TOKEN || '',
  accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '00000419627',
  accountName: process.env.SEPAY_ACCOUNT_NAME || 'DOAN THI TRAM',
  bankName: process.env.SEPAY_BANK_NAME || 'TPBank',
  bankCode: process.env.SEPAY_BANK_CODE || 'TPB',
  bankBin: process.env.SEPAY_BANK_BIN || '970423'
};

// Hàm gọi SePay UserAPI trực tiếp (Hoạt động realtime trên cả Localhost và Hosting)
const fetchSepayTransactions = (limit = 25) => {
  return new Promise((resolve, reject) => {
    const url = `https://my.sepay.vn/userapi/transactions/list?account_number=${SEPAY_CONFIG.accountNumber}&limit=${limit}`;
    const req = https.get(url, {
      headers: {
        'Authorization': `Bearer ${SEPAY_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          resolve(parsed.transactions || []);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('SePay API request timeout'));
    });
  });
};

// 1. Tạo đơn đặt hàng cho Tour trọn gói cố định (Định nghĩa chính thức nằm ở dòng 96 phía dưới)

// 2. Lấy danh sách đơn hàng của khách hàng (HỖ TRỢ CẢ TOUR TRỌN GÓI VÀ TOUR THIẾT KẾ RIÊNG)
exports.getMyBookings = async (req, res) => {
  try {
    const customer_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!customer_id) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    // Dùng LEFT JOIN và COALESCE để lấy thông tin toàn diện cho cả 2 loại tour
    const [bookings] = await sequelize.query(`
      SELECT 
        b.booking_id, 
        b.num_people, 
        b.total_amount, 
        b.booking_status, 
        b.payment_status,
        b.booking_date,
        b.notes,
        b.breakdown,
        b.quote_id,
        b.departure_id,
        (SELECT GROUP_CONCAT(CONCAT(p.full_name, '::', IFNULL(p.gender, ''), '::', IFNULL(p.birth_date, ''), '::', IFNULL(p.identity_number, '')) SEPARATOR '||') FROM booking_passengers p WHERE p.booking_id = b.booking_id) AS passengers_list,
        (SELECT status FROM booking_change_requests WHERE booking_id = b.booking_id ORDER BY change_id DESC LIMIT 1) AS change_request_status,
        (SELECT request_type FROM booking_change_requests WHERE booking_id = b.booking_id ORDER BY change_id DESC LIMIT 1) AS change_request_type,
        (SELECT fee_percentage FROM booking_change_requests WHERE booking_id = b.booking_id ORDER BY change_id DESC LIMIT 1) AS change_request_fee_percentage,
        (SELECT fee_amount FROM booking_change_requests WHERE booking_id = b.booking_id ORDER BY change_id DESC LIMIT 1) AS change_request_fee_amount,
        (SELECT refund_amount FROM booking_change_requests WHERE booking_id = b.booking_id ORDER BY change_id DESC LIMIT 1) AS change_request_refund_amount,
        (SELECT days_before_departure FROM booking_change_requests WHERE booking_id = b.booking_id ORDER BY change_id DESC LIMIT 1) AS change_request_days,
        
        COALESCE(t.tour_name, CONCAT('Tour ', cr.destination)) AS tour_name,
        COALESCE(t.destination, cr.destination, 'Việt Nam') AS destination,
        
        COALESCE(d.departure_date, cr.departure_date) AS departure_date,
        COALESCE(d.return_date, cr.return_date) AS return_date,
        COALESCE(t.duration_days, DATEDIFF(cr.return_date, cr.departure_date) + 1, 3) AS duration_days,
        
        ROUND(b.total_amount / GREATEST(b.num_people, 1)) AS price_per_person,
        t.base_price, COALESCE(t.image_url, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000') AS image_url,
        t.design_data,
        cr.requirements,
        
        u.full_name AS customer_name,
        u.phone AS customer_phone,
        u.email AS customer_email,
        p_method.payment_method

      FROM bookings b
      LEFT JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
      LEFT JOIN (SELECT booking_id, MAX(payment_method) as payment_method FROM payments GROUP BY booking_id) p_method ON b.booking_id = p_method.booking_id
      WHERE b.customer_id = ?
      ORDER BY b.booking_id DESC
    `, {
      replacements: [customer_id]
    });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Lỗi getMyBookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { departure_id, num_people, total_amount, notes, payment_method = 'VNPAY_QR' } = req.body;
    const customer_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!customer_id) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đặt tour!' });
    }

    const count = num_people || (req.body.num_adults ? req.body.num_adults + (req.body.num_children || 0) : 1);
    
let requiredRooms = 0; let singleRoomCount = 0;

    const amount = total_amount || req.body.total_price || 0;

    if (departure_id) {
      const [depRows] = await sequelize.query(`
        SELECT d.departure_id, d.departure_date, d.return_date, d.available_slots, d.status, t.design_data 
        FROM departures d
        JOIN tours t ON d.tour_id = t.tour_id
        WHERE d.departure_id = ?
      `, { replacements: [departure_id], transaction });

      if (depRows.length > 0) {
        const dep = depRows[0];
        
        if (req.body.passengers && Array.isArray(req.body.passengers)) {
            // Default rules
            let roomRules = { max_adults: 2, max_children: 2, max_infants: 1, min_adults: 1 };
            
            // Try to extract specific rules from tour design_data
            if (dep.design_data) {
                try {
                    const parsed = typeof dep.design_data === 'string' ? JSON.parse(dep.design_data) : dep.design_data;
                    const days = parsed.days || parsed.itinerary || [];
                    // Find first day with accommodation that might have rules
                    for (const day of days) {
                        if (day.accommodation && day.accommodation.service_id) {
                            const [srvRows] = await sequelize.query("SELECT s.*, hsd.max_adults, hsd.max_children, hsd.max_infants, hsd.min_adults, hsd.single_room_allowed FROM services s LEFT JOIN hotel_service_details hsd ON s.service_id = hsd.service_id WHERE s.service_id = ?", { replacements: [day.accommodation.service_id], transaction });
                            if (srvRows.length > 0) {
                                const srv = srvRows[0];
                                roomRules = {
                                    max_adults: srv.max_adults !== undefined ? srv.max_adults : 2,
                                    max_children: srv.max_children !== undefined ? srv.max_children : 2,
                                    max_infants: srv.max_infants !== undefined ? srv.max_infants : 1,
                                    min_adults: srv.min_adults !== undefined ? srv.min_adults : 1,
                                    single_room_allowed: srv.single_room_allowed !== undefined ? !!srv.single_room_allowed : true
                                };
                                break; // Just take the first hotel's rule
                            }
                        }
                    }
                } catch(e) {
                    console.error("Error parsing design_data for room rules", e);
                }
            }
            
            // Validate if single_room_allowed
            const hasSingle = req.body.passengers.some(p => p.passenger_type === 'ADULT' && p.single_room);
            if (hasSingle && roomRules.single_room_allowed === false) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Loại phòng khách sạn của tour này không cho phép chọn phòng đơn.' });
            }

            const roomResult = calculateRooms(req.body.passengers, roomRules);
            if (!roomResult.valid) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: roomResult.error });
            }
            requiredRooms = roomResult.requiredRooms;
            singleRoomCount = roomResult.singleRoomCount;
        }
        const todayStr = new Date().toISOString().split('T')[0];
        const isPast = dep.return_date ? String(dep.return_date).substring(0, 10) < todayStr : false;

        // 🔒 CHẶN ĐẶT TOUR NẾU CÒN DƯỚI 30 NGÀY SO VỚI NGÀY KHỞI HÀNH (ĐỂ ĐÓNG TOUR GỬI NHÀ CUNG CẤP)
        if (dep.departure_date) {
          const depDate = new Date(dep.departure_date);
          const now = new Date();
          depDate.setHours(0, 0, 0, 0);
          now.setHours(0, 0, 0, 0);
          const diffTime = depDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 30) {
            await transaction.rollback();
            const dateFmt = `${String(depDate.getDate()).padStart(2, '0')}/${String(depDate.getMonth() + 1).padStart(2, '0')}/${depDate.getFullYear()}`;
            return res.status(400).json({
              success: false,
              message: `Tour này đã đóng nhận khách (chỉ nhận đặt trước tối thiểu 30 ngày để chốt dịch vụ khách sạn, nhà hàng với nhà cung cấp). Đợt khởi hành ngày ${dateFmt} hiện chỉ còn ${diffDays > 0 ? diffDays : 0} ngày. Vui lòng chọn đợt khởi hành khác!`
            });
          }
        }

        if (dep.status === 'Closed' || dep.status === 'Completed' || isPast) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Đợt khởi hành này đã kết thúc hoặc ở trạng thái KHÓA (CLOSED). Không thể đặt vé!' });
        }
        if (dep.available_slots < count) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Số lượng chỗ trống không đủ!' });
        }
      }
    }

    // 1. Tạo đơn đặt hàng (Dùng dấu ? an toàn chống SQL Injection)
    const [result] = await sequelize.query(`
      INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes, breakdown, required_rooms, single_room_count)
      VALUES (?, ?, NULL, ?, NOW(), ?, 'Pending', 'Unpaid', ?, ?, ?, ?)
    `, {
      replacements: [customer_id, departure_id, count, amount, notes || null, req.body.breakdown ? JSON.stringify(req.body.breakdown) : null, requiredRooms, singleRoomCount],
      transaction
    });

    const newBookingId = result;

    // Insert passengers if provided
    if (req.body.passengers && Array.isArray(req.body.passengers)) {
      for (const p of req.body.passengers) {
        await sequelize.query(`
          INSERT INTO booking_passengers (booking_id, full_name, identity_number, gender, birth_date, is_checked_in, passenger_type, single_room)
          VALUES (?, ?, ?, ?, ?, 0, ?, ?)
        `, {
          replacements: [newBookingId, p.full_name, p.identity_number || null, p.gender || 'Other', p.birth_date || null, p.passenger_type || 'ADULT', !!p.single_room],
          transaction
        });
      }
    }

    // 2. Trừ số lượng chỗ trống
    await sequelize.query(`
      UPDATE departures SET available_slots = GREATEST(0, available_slots - ?) WHERE departure_id = ?
    `, { replacements: [count, departure_id], transaction });

    // 3. Ghi nhận phương thức thanh toán vào bảng payments
    const txnCode = payment_method === 'VNPAY_QR' ? `THANHTOAN${newBookingId}` : ('TXN_' + Date.now());
    await sequelize.query(`
      INSERT INTO payments (booking_id, payment_method, amount, transaction_code, payment_status)
      VALUES (?, ?, ?, ?, 'Pending')
    `, { replacements: [newBookingId, payment_method, amount, txnCode], transaction });

    // 4. Tạo thông báo realtime cho khách hàng
    try {
      const [tourRow] = await sequelize.query(`
        SELECT t.tour_name, d.departure_date 
        FROM departures d 
        JOIN tours t ON d.tour_id = t.tour_id 
        WHERE d.departure_id = ?
      `, { replacements: [departure_id], transaction });
      const tourName = tourRow[0]?.tour_name || 'Tour du lịch';
      const depDateStr = tourRow[0]?.departure_date ? new Date(tourRow[0].departure_date).toLocaleDateString('vi-VN') : '';

      await sequelize.query(`
        INSERT INTO notifications (user_id, title, content, type, target_role, is_read, action_url, created_at)
        VALUES (?, ?, ?, 'BOOKING_SUCCESS', 'CUSTOMER', 0, '/my-bookings', NOW())
      `, {
        replacements: [
          customer_id,
          '🎉 Đặt tour thành công!',
          `Đơn đặt tour #${newBookingId} (${tourName}${depDateStr ? ` - Khởi hành: ${depDateStr}` : ''}) đã được ghi nhận. Vui lòng thanh toán để nhận vé điện tử và mã QR check-in!`
        ],
        transaction
      });
    } catch (notifErr) {
      console.error('Lỗi tạo notification createBooking:', notifErr);
    }

    await transaction.commit();
    res.status(200).json({ success: true, message: 'Đặt tour thành công!', booking_id: newBookingId, transfer_content: txnCode });
  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi createBooking:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Thiết lập thanh toán / Tạo thông tin QR Code
// POST /api/bookings/:bookingId/setup-payment
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { payment_method } = req.body; // 'Cash' hoặc 'VNPAY_QR'

    const [bookings] = await sequelize.query(`SELECT total_amount FROM bookings WHERE booking_id = ?`, { replacements: [bookingId] });
    if (bookings.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });

    const amount = Math.round(Number(bookings[0].total_amount || 0));
    const txnCode = payment_method === 'VNPAY_QR' ? `THANHTOAN${bookingId}` : ('TXN_' + Date.now());

    // Cập nhật phương thức thanh toán mới
    await sequelize.query(`
      UPDATE payments SET payment_method = ?, transaction_code = ? WHERE booking_id = ? AND payment_status = 'Pending'
    `, { replacements: [payment_method, txnCode, bookingId] });

    if (payment_method === 'Cash') {
      return res.status(200).json({ success: true, message: '💵 Đã chuyển sang Tiền mặt. Vui lòng đến văn phòng đóng tiền để nhân viên xác nhận!' });
    } else {
      const qrUrl = `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.accountNumber}&bank=${SEPAY_CONFIG.bankName}&amount=${amount}&des=${encodeURIComponent(txnCode)}&template=compact`;
      return res.status(200).json({
        success: true,
        message: '📸 Tạo mã QR SePay thành công!',
        qrData: {
          bankName: SEPAY_CONFIG.bankName,
          bankCode: SEPAY_CONFIG.bankCode,
          bankBin: SEPAY_CONFIG.bankBin,
          accountNumber: SEPAY_CONFIG.accountNumber,
          accountName: SEPAY_CONFIG.accountName,
          amount: amount,
          info: txnCode,
          qrUrl: qrUrl
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xác nhận đã thanh toán xong (Chốt trạng thái Paid)
// PUT /api/bookings/:bookingId/pay
exports.confirmPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bookingId } = req.params;

    // Chuyển payments sang Success
    await sequelize.query(`UPDATE payments SET payment_status = 'Success', paid_at = NOW() WHERE booking_id = ?`, { replacements: [bookingId], transaction });

    // Chuyển bookings sang Paid & Confirmed
    await sequelize.query(`UPDATE bookings SET payment_status = 'Paid', booking_status = 'Confirmed' WHERE booking_id = ?`, { replacements: [bookingId], transaction });

    // Tạo thông báo realtime cho khách hàng
    try {
      const [bkInfo] = await sequelize.query(`
        SELECT b.customer_id, COALESCE(t.tour_name, CONCAT('Tour ', cr.destination), 'Tour du lịch') AS tour_name
        FROM bookings b
        LEFT JOIN departures d ON b.departure_id = d.departure_id
        LEFT JOIN tours t ON d.tour_id = t.tour_id
        LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
        LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
        WHERE b.booking_id = ?
      `, { replacements: [bookingId], transaction });

      if (bkInfo.length > 0 && bkInfo[0].customer_id) {
        await sequelize.query(`
          INSERT INTO notifications (user_id, title, content, type, target_role, is_read, action_url, created_at)
          VALUES (?, ?, ?, 'PAYMENT_SUCCESS', 'CUSTOMER', 0, '/my-bookings', NOW())
        `, {
          replacements: [
            bkInfo[0].customer_id,
            '💳 Thanh toán thành công!',
            `Đơn hàng #${bookingId} (${bkInfo[0].tour_name}) đã thanh toán thành công. Vé điện tử và mã QR check-in đã sẵn sàng!`
          ],
          transaction
        });
      }
    } catch(notifErr) {
      console.error('Lỗi tạo notification confirmPayment:', notifErr);
    }

    await transaction.commit();
    await autoSyncAttendanceForTourDate(bookingId);
    res.status(200).json({ success: true, message: '✅ Cập nhật trạng thái thanh toán thành công!' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};
// 1. LẤY DANH SÁCH GIAO DỊCH THANH TOÁN (Dành cho Nhân viên văn phòng / Admin)
exports.getAllPayments = async (req, res) => {
  try {
    const [payments] = await sequelize.query(`
      SELECT 
        p.payment_id, p.booking_id, p.payment_method, p.amount, p.transaction_code, p.payment_status, p.paid_at,
        b.booking_date, b.booking_status, b.notes,
        u.full_name AS customer_name, u.phone AS customer_phone,
        COALESCE(t.tour_name, CONCAT('Tour ', cr.destination)) AS tour_name,
        COALESCE(t.destination, cr.destination, 'Việt Nam') AS destination,
        COALESCE(d.departure_date, cr.departure_date) AS departure_date,
        t.design_data,
        cr.requirements
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      LEFT JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
      ORDER BY 
        CASE WHEN p.payment_status = 'Pending' THEN 1 ELSE 2 END,
        p.payment_id DESC
    `);

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error("Lỗi getAllPayments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. NHÂN VIÊN VĂN PHÒNG XÁC NHẬN THU TIỀN MẶT
exports.confirmCashByStaff = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bookingId } = req.params;

    // A. Chuyển trạng thái bảng payments sang Success
    await sequelize.query(`
      UPDATE payments 
      SET payment_status = 'Success', paid_at = NOW() 
      WHERE booking_id = ?
    `, { replacements: [bookingId], transaction });

    // B. Chuyển trạng thái bảng bookings sang Paid & Confirmed
    await sequelize.query(`
      UPDATE bookings 
      SET payment_status = 'Paid', booking_status = 'Confirmed' 
      WHERE booking_id = ?
    `, { replacements: [bookingId], transaction });

    // C. Tạo thông báo realtime cho khách hàng
    try {
      const [bkInfo] = await sequelize.query(`
        SELECT b.customer_id, COALESCE(t.tour_name, CONCAT('Tour ', cr.destination), 'Tour du lịch') AS tour_name
        FROM bookings b
        LEFT JOIN departures d ON b.departure_id = d.departure_id
        LEFT JOIN tours t ON d.tour_id = t.tour_id
        LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
        LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
        WHERE b.booking_id = ?
      `, { replacements: [bookingId], transaction });

      if (bkInfo.length > 0 && bkInfo[0].customer_id) {
        await sequelize.query(`
          INSERT INTO notifications (user_id, title, content, type, target_role, is_read, action_url, created_at)
          VALUES (?, ?, ?, 'PAYMENT_SUCCESS', 'CUSTOMER', 0, '/my-bookings', NOW())
        `, {
          replacements: [
            bkInfo[0].customer_id,
            '💵 Xác nhận thanh toán tiền mặt thành công!',
            `Nhân viên đã xác nhận thu tiền mặt cho đơn hàng #${bookingId} (${bkInfo[0].tour_name}). Vé điện tử và mã QR check-in đã sẵn sàng!`
          ],
          transaction
        });
      }
    } catch(notifErr) {
      console.error('Lỗi tạo notification confirmCashByStaff:', notifErr);
    }

    await transaction.commit();
    await autoSyncAttendanceForTourDate(bookingId);
    res.status(200).json({ success: true, message: '✅ Xác nhận thu tiền mặt & chốt đơn thành công!' });
  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi confirmCashByStaff:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// QUẢN LÝ YÊU CẦU HỦY / ĐỔI LỊCH (BOOKING CHANGE REQUESTS)
// =========================================================================

// 1. Khách hàng gửi yêu cầu Hủy hoặc Đổi Lịch
exports.createChangeRequest = async (req, res) => {
  try {
    const { booking_id, request_type, reason, new_departure_id } = req.body;
    const customer_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!booking_id || !request_type) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã đơn hàng và loại yêu cầu!' });
    }

    // Kiểm tra đơn hàng thuộc về khách hàng
    const [bookingRows] = await sequelize.query(`
      SELECT b.booking_id, b.booking_status, b.payment_status, b.departure_id, b.num_people, b.total_amount,
             COALESCE(d.departure_date, cr.departure_date) AS departure_date
      FROM bookings b
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
      WHERE b.booking_id = ? AND b.customer_id = ?
    `, {
      replacements: [booking_id, customer_id]
    });

    if (bookingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng của bạn!' });
    }

    const booking = bookingRows[0];

    if (booking.booking_status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã được hủy trước đó!' });
    }

    // Tính số ngày còn lại trước ngày khởi hành
    let daysBeforeDeparture = null;
    if (booking.departure_date) {
      const depDate = new Date(booking.departure_date);
      const today = new Date();
      depDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = depDate.getTime() - today.getTime();
      daysBeforeDeparture = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const isPaid = booking.payment_status === 'Paid';
    const totalAmount = Number(booking.total_amount || 0);

    let feePercentage = 0;
    let feeAmount = 0;
    let refundAmount = 0;

    if (!isPaid) {
      feePercentage = 0;
      feeAmount = 0;
      refundAmount = 0;
    } else {
      const days = daysBeforeDeparture !== null ? daysBeforeDeparture : 0;
      if (request_type === 'Cancel') {
        if (days >= 30) {
          feePercentage = 10;
        } else if (days >= 15) {
          feePercentage = 30;
        } else if (days >= 7) {
          feePercentage = 50;
        } else if (days >= 3) {
          feePercentage = 75;
        } else {
          feePercentage = 100;
        }
        feeAmount = Math.round(totalAmount * (feePercentage / 100));
        refundAmount = Math.max(0, totalAmount - feeAmount);
      } else {
        // Reschedule
        if (days >= 30) {
          feePercentage = 0;
        } else if (days >= 15) {
          feePercentage = 10;
        } else if (days >= 7) {
          feePercentage = 20;
        } else if (days >= 3) {
          feePercentage = 40;
        } else {
          feePercentage = 100; // Cận ngày không hỗ trợ đổi lịch
        }
        feeAmount = Math.round(totalAmount * (feePercentage / 100));
        refundAmount = 0;
      }
    }

    // ĐẶC BIỆT: Nếu khách xin HỦY đơn chưa thanh toán (Unpaid / Pending) -> Tự động hủy ngay lập tức và giải phóng vé
    if (request_type === 'Cancel' && !isPaid) {
      await sequelize.query(`
        UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?
      `, { replacements: [booking_id] });

      if (booking.departure_id) {
        await sequelize.query(`
          UPDATE departures SET available_slots = available_slots + ? WHERE departure_id = ?
        `, { replacements: [booking.num_people || 1, booking.departure_id] });
      }

      await sequelize.query(`
        UPDATE payments SET payment_status = 'Failed' WHERE booking_id = ?
      `, { replacements: [booking_id] });

      await sequelize.query(`
        INSERT INTO booking_change_requests (booking_id, request_type, reason, new_departure_id, status, staff_note, fee_percentage, fee_amount, refund_amount, days_before_departure, created_at)
        VALUES (?, 'Cancel', ?, NULL, 'Approved', 'Đơn chưa thanh toán - Hệ thống tự động hủy theo yêu cầu khách hàng', 0, 0, 0, ?, NOW())
      `, {
        replacements: [booking_id, reason || 'Khách chủ động hủy đơn chưa thanh toán', daysBeforeDeparture]
      });

      return res.status(200).json({
        success: true,
        message: 'Đã hủy đơn hàng thành công và giải phóng vé giữ chỗ!'
      });
    }

    // Kiểm tra xem đã có yêu cầu nào đang chờ xử lý hay chưa
    const [existing] = await sequelize.query(`
      SELECT change_id FROM booking_change_requests WHERE booking_id = ? AND status = 'Pending'
    `, { replacements: [booking_id] });

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã có yêu cầu đang chờ nhân viên xử lý!' });
    }

    await sequelize.query(`
      INSERT INTO booking_change_requests (booking_id, request_type, reason, new_departure_id, status, fee_percentage, fee_amount, refund_amount, days_before_departure, created_at)
      VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, NOW())
    `, {
      replacements: [booking_id, request_type, reason || null, new_departure_id || null, feePercentage, feeAmount, refundAmount, daysBeforeDeparture]
    });

    // Tạo thông báo realtime cho khách hàng
    try {
      const isCancel = request_type === 'Cancel';
      const notifTitle = isCancel ? '📝 Đã gửi yêu cầu Hủy Tour & Hoàn tiền' : '📝 Đã gửi yêu cầu Đổi Lịch khởi hành';
      const notifContent = isCancel
        ? `Yêu cầu hủy đơn tour #${booking_id} đã được gửi thành công. Mức phí khấu trừ: ${feePercentage}%. Số tiền hoàn lại dự kiến: ${new Intl.NumberFormat('vi-VN').format(refundAmount)}đ. CSKH sẽ liên hệ sớm nhất!`
        : `Yêu cầu đổi lịch cho đơn tour #${booking_id} đã được gửi thành công. Nhân viên sẽ liên hệ và xử lý cho bạn trong thời gian sớm nhất.`;

      await sequelize.query(`
        INSERT INTO notifications (user_id, title, content, type, target_role, is_read, action_url, created_at)
        VALUES (?, ?, ?, 'CHANGE_REQUEST_SENT', 'CUSTOMER', 0, '/my-bookings', NOW())
      `, {
        replacements: [customer_id, notifTitle, notifContent]
      });
    } catch (notifErr) {
      console.error('Lỗi tạo notification createChangeRequest:', notifErr);
    }

    res.status(201).json({
      success: true,
      data: {
        fee_percentage: feePercentage,
        fee_amount: feeAmount,
        refund_amount: refundAmount,
        days_before_departure: daysBeforeDeparture
      },
      message: request_type === 'Cancel' 
        ? `Đã gửi yêu cầu Hủy Tour & Hoàn tiền! Mức phí khấu trừ theo quy định là ${feePercentage}% (${feeAmount.toLocaleString('vi-VN')} ₫). Số tiền dự kiến hoàn lại: ${refundAmount.toLocaleString('vi-VN')} ₫. CSKH sẽ liên hệ và giải quyết trong thời gian sớm nhất.` 
        : `Đã gửi yêu cầu Đổi Lịch khởi hành! Phí đổi lịch theo quy định: ${feePercentage}% (${feeAmount.toLocaleString('vi-VN')} ₫). Nhân viên CSKH sẽ liên hệ hỗ trợ bạn.`
    });

  } catch (error) {
    console.error("Lỗi createChangeRequest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Nhân viên / Admin lấy danh sách các yêu cầu Hủy / Đổi lịch
exports.getAllChangeRequests = async (req, res) => {
  try {
    const [requests] = await sequelize.query(`
      SELECT 
        cr.change_id, cr.booking_id, cr.request_type, cr.reason, cr.status, cr.staff_note, cr.created_at, cr.new_departure_id,
        cr.fee_percentage, cr.fee_amount, cr.refund_amount, cr.days_before_departure,
        b.num_people, b.total_amount, b.booking_status, b.payment_status, b.booking_date,
        u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
        COALESCE(t.tour_name, CONCAT('Tour thiết kế: ', ctr.destination)) AS tour_name,
        d.departure_date AS current_departure_date,
        nd.departure_date AS requested_departure_date
      FROM booking_change_requests cr
      JOIN bookings b ON cr.booking_id = b.booking_id
      LEFT JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN departures nd ON cr.new_departure_id = nd.departure_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests ctr ON q.request_id = ctr.request_id
      ORDER BY 
        CASE WHEN cr.status = 'Pending' THEN 1 ELSE 2 END,
        cr.change_id DESC
    `);

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Lỗi getAllChangeRequests:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Nhân viên / Admin duyệt hoặc từ chối yêu cầu
exports.processChangeRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params; // change_id
    const { status, staff_note } = req.body; // 'Approved' hoặc 'Rejected'
    const staff_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!['Approved', 'Rejected'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Trạng thái xử lý không hợp lệ!' });
    }

    const [reqRow] = await sequelize.query(`
      SELECT change_id, booking_id, request_type, new_departure_id, status FROM booking_change_requests WHERE change_id = ?
    `, { replacements: [id], transaction });

    if (reqRow.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu!' });
    }

    const request = reqRow[0];

    // Cập nhật trạng thái yêu cầu
    await sequelize.query(`
      UPDATE booking_change_requests 
      SET status = ?, staff_note = ?, processed_by = ? 
      WHERE change_id = ?
    `, {
      replacements: [status, staff_note || null, staff_id, id],
      transaction
    });

    // Nếu Duyệt (Approved)
    if (status === 'Approved') {
      if (request.request_type === 'Cancel') {
        // Hủy booking & Trả chỗ lại cho departure
        const [bk] = await sequelize.query(`SELECT departure_id, num_people FROM bookings WHERE booking_id = ?`, { replacements: [request.booking_id], transaction });
        
        await sequelize.query(`
          UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?
        `, { replacements: [request.booking_id], transaction });

        // Vô hiệu hóa toàn bộ điểm danh và mã check-in của hành khách
        await sequelize.query(`
          UPDATE booking_passengers SET is_checked_in = 0 WHERE booking_id = ?
        `, { replacements: [request.booking_id], transaction });

        // Cập nhật trạng thái thanh toán sang Refunded hoặc Failed
        await sequelize.query(`
          UPDATE payments SET payment_status = 'Refunded' WHERE booking_id = ? AND payment_status = 'Paid'
        `, { replacements: [request.booking_id], transaction });

        await sequelize.query(`
          UPDATE payments SET payment_status = 'Failed' WHERE booking_id = ? AND payment_status != 'Refunded'
        `, { replacements: [request.booking_id], transaction });

        if (bk.length > 0 && bk[0].departure_id) {
          await sequelize.query(`
            UPDATE departures SET available_slots = available_slots + ? WHERE departure_id = ?
          `, { replacements: [bk[0].num_people || 1, bk[0].departure_id], transaction });
        }
      } else if (request.request_type === 'Reschedule' && request.new_departure_id) {
        // Đổi sang ngày mới
        await sequelize.query(`
          UPDATE bookings SET departure_id = ? WHERE booking_id = ?
        `, { replacements: [request.new_departure_id, request.booking_id], transaction });
      }
    }

    // Tạo thông báo realtime cho khách hàng về kết quả xử lý
    try {
      const [crData] = await sequelize.query(`
        SELECT cr.booking_id, cr.request_type, cr.refund_amount, cr.fee_percentage, b.customer_id,
               COALESCE(t.tour_name, CONCAT('Tour ', crq.destination), 'Tour du lịch') AS tour_name
        FROM booking_change_requests cr
        JOIN bookings b ON cr.booking_id = b.booking_id
        LEFT JOIN departures d ON b.departure_id = d.departure_id
        LEFT JOIN tours t ON d.tour_id = t.tour_id
        LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
        LEFT JOIN custom_tour_requests crq ON q.request_id = crq.request_id
        WHERE cr.change_id = ?
      `, { replacements: [id], transaction });

      if (crData.length > 0) {
        const row = crData[0];
        const isCancel = row.request_type === 'Cancel';
        let notifTitle = '';
        let notifContent = '';

        if (status === 'Approved') {
          if (isCancel) {
            notifTitle = '✅ Yêu cầu Hủy Tour đã được chấp thuận!';
            notifContent = `Đơn hàng #${row.booking_id} (${row.tour_name}) đã được duyệt hủy thành công. Toàn bộ mã QR check-in đã hết hiệu lực. Số tiền hoàn lại: ${new Intl.NumberFormat('vi-VN').format(row.refund_amount || 0)}đ. Kế toán sẽ liên hệ hoàn tiền theo quy định.`;
          } else {
            notifTitle = '✅ Yêu cầu Đổi Lịch tour đã được chấp thuận!';
            notifContent = `Đơn hàng #${row.booking_id} (${row.tour_name}) đã được đổi sang ngày khởi hành mới thành công! Vui lòng kiểm tra lại vé điện tử.`;
          }
        } else {
          notifTitle = `❌ Yêu cầu ${isCancel ? 'Hủy tour' : 'Đổi lịch'} không được chấp thuận`;
          notifContent = `Yêu cầu của bạn cho đơn hàng #${row.booking_id} (${row.tour_name}) đã bị từ chối.${staff_note ? ` Lý do: ${staff_note}` : ''}. Vui lòng liên hệ CSKH để được giải đáp.`;
        }

        await sequelize.query(`
          INSERT INTO notifications (user_id, title, content, type, target_role, is_read, action_url, created_at)
          VALUES (?, ?, ?, 'CHANGE_REQUEST_RESULT', 'CUSTOMER', 0, '/my-bookings', NOW())
        `, {
          replacements: [row.customer_id, notifTitle, notifContent],
          transaction
        });
      }
    } catch(notifErr) {
      console.error('Lỗi tạo notification processChangeRequest:', notifErr);
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: status === 'Approved' 
        ? (request.request_type === 'Cancel' 
            ? '✅ Đã duyệt Hủy Tour thành công! Đơn hàng đã chuyển sang trạng thái ĐÃ HỦY và toàn bộ mã QR check-in đã bị vô hiệu hóa hoàn toàn.'
            : '✅ Đã duyệt Đổi Lịch tour thành công!')
        : '❌ Đã từ chối yêu cầu xử lý tour!'
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi processChangeRequest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. LẤY TẤT CẢ BOOKING DÀNH CHO NHÂN VIÊN VĂN PHÒNG & ADMIN
exports.getAllBookings = async (req, res) => {
  try {
    const [bookings] = await sequelize.query(`
      SELECT 
        b.booking_id, 
        b.customer_id,
        b.num_people, 
        b.total_amount, 
        b.booking_status, 
        b.payment_status,
        b.booking_date,
        b.notes,
        b.quote_id, b.departure_id, b.breakdown, (SELECT GROUP_CONCAT(CONCAT(p.full_name, '::', IFNULL(p.gender, ''), '::', IFNULL(p.birth_date, ''), '::', IFNULL(p.identity_number, '')) SEPARATOR '||') FROM booking_passengers p WHERE p.booking_id = b.booking_id) AS passengers_list,
        
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        
        COALESCE(t.tour_name, CONCAT('Tour thiết kế riêng: ', cr.destination)) AS tour_name,
        COALESCE(d.departure_date, cr.departure_date) AS departure_date,
        COALESCE(t.duration_days, DATEDIFF(cr.return_date, cr.departure_date) + 1) AS duration_days,
        COALESCE(t.image_url, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000') AS image_url,
        t.base_price, t.design_data, cr.requirements

      FROM bookings b
      LEFT JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
      ORDER BY b.booking_id DESC
    `);

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Lỗi getAllBookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// TỰ ĐỘNG CẬP NHẬT BẢNG CÔNG (TIMEKEEPING) VÀO NGÀY ĐI TOUR KHI DUYỆT ĐƠN HÀNG
const autoSyncAttendanceForTourDate = async (bookingId) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT 
        b.booking_id,
        COALESCE(DATE_FORMAT(d.departure_date, '%Y-%m-%d'), DATE_FORMAT(cr.departure_date, '%Y-%m-%d'), DATE_FORMAT(b.booking_date, '%Y-%m-%d')) AS tour_date,
        g.user_id AS guide_user_id,
        q.staff_id AS staff_user_id
      FROM bookings b
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN guide_assignments ga ON d.departure_id = ga.departure_id
      LEFT JOIN guides g ON ga.guide_id = g.guide_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
      WHERE b.booking_id = ?
    `, { replacements: [bookingId] });

    if (rows.length > 0 && rows[0].tour_date) {
      const tourDate = rows[0].tour_date; // Lấy chính xác NGHỆT KHỞI HÀNH TOUR, KHÔNG PHẢI NGÀY DUYỆT
      const targetUserId = rows[0].guide_user_id || rows[0].staff_user_id || 2;

      console.log(`[Auto-Timekeeping] Ghi nhận ngày công vào ngày đi tour ${tourDate} cho User ID ${targetUserId}`);

      await sequelize.query(`
        INSERT INTO timekeeping (employee_id, work_date, status, check_in, check_out, notes)
        VALUES (?, ?, 'Present', '08:00:00', '17:00:00', ?)
        ON DUPLICATE KEY UPDATE 
          status = 'Present',
          notes = VALUES(notes)
      `, {
        replacements: [
          targetUserId,
          tourDate,
          `Tự động chốt công ngày đi tour theo đơn hàng #BKG-${bookingId} đã được duyệt`
        ]
      });
    }
  } catch (err) {
    console.error("[Auto-Timekeeping Error]:", err.message);
  }
};

// 5. CẬP NHẬT TRẠNG THÁI BOOKING (Dành cho Nhân viên / Admin)
exports.updateBookingStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bookingId } = req.params;
    const { booking_status, reason, staff_note } = req.body;
    const staff_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!['Pending', 'Confirmed', 'Cancelled'].includes(booking_status)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ!' });
    }

    if (booking_status === 'Cancelled') {
      // 1. Lấy thông tin booking, departure_date, total_amount, departure_id
      const [bks] = await sequelize.query(`
        SELECT b.booking_id, b.departure_id, b.num_people, b.total_amount, b.payment_status,
               COALESCE(d.departure_date, cr.departure_date) AS departure_date
        FROM bookings b
        LEFT JOIN departures d ON b.departure_id = d.departure_id
        LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
        LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
        WHERE b.booking_id = ?
      `, { replacements: [bookingId], transaction });

      if (bks.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
      }

      const bk = bks[0];

      // 2. Tính số ngày còn lại và chính sách tài chính
      let daysLeft = null;
      if (bk.departure_date) {
        const depDate = new Date(bk.departure_date);
        const today = new Date();
        depDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diff = depDate.getTime() - today.getTime();
        daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      const isPaid = bk.payment_status === 'Paid';
      const totalAmount = Number(bk.total_amount || 0);
      let feePercentage = 0;
      let feeAmount = 0;
      let refundAmount = 0;

      if (isPaid) {
        const days = daysLeft !== null ? daysLeft : 0;
        if (days >= 30) feePercentage = 10;
        else if (days >= 15) feePercentage = 30;
        else if (days >= 7) feePercentage = 50;
        else if (days >= 3) feePercentage = 75;
        else feePercentage = 100;

        feeAmount = Math.round(totalAmount * (feePercentage / 100));
        refundAmount = Math.max(0, totalAmount - feeAmount);
      }

      // 3. Cập nhật trạng thái đơn
      await sequelize.query(`UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?`, {
        replacements: [bookingId], transaction
      });

      // 4. Giải phóng vé giữ chỗ
      if (bk.departure_id) {
        await sequelize.query(`
          UPDATE departures SET available_slots = available_slots + ? WHERE departure_id = ?
        `, { replacements: [bk.num_people || 1, bk.departure_id], transaction });
      }

      // 5. Vô hiệu hóa mã QR check-in
      await sequelize.query(`
        UPDATE booking_passengers SET is_checked_in = 0 WHERE booking_id = ?
      `, { replacements: [bookingId], transaction });

      // 6. Cập nhật payment
      if (isPaid) {
        await sequelize.query(`
          UPDATE payments SET payment_status = 'Refunded' WHERE booking_id = ? AND payment_status = 'Paid'
        `, { replacements: [bookingId], transaction });
      } else {
        await sequelize.query(`
          UPDATE payments SET payment_status = 'Failed' WHERE booking_id = ?
        `, { replacements: [bookingId], transaction });
      }

      // 7. Ghi nhận vào booking_change_requests để lưu vết lịch sử quyết toán
      await sequelize.query(`
        INSERT INTO booking_change_requests (booking_id, request_type, reason, status, staff_note, fee_percentage, fee_amount, refund_amount, days_before_departure, processed_by, created_at)
        VALUES (?, 'Cancel', ?, 'Approved', ?, ?, ?, ?, ?, ?, NOW())
      `, {
        replacements: [
          bookingId,
          reason || 'Nhân viên hủy đơn trực tiếp trên hệ thống',
          staff_note || `Nhân viên hủy đơn. Khấu trừ ${feePercentage}% (${feeAmount.toLocaleString('vi-VN')} ₫). Số tiền hoàn khách: ${refundAmount.toLocaleString('vi-VN')} ₫`,
          feePercentage, feeAmount, refundAmount, daysLeft, staff_id || null
        ],
        transaction
      });

      await transaction.commit();
      return res.status(200).json({
        success: true,
        message: `✅ Đã hủy đơn hàng thành công! Khấu trừ ${feePercentage}% (${feeAmount.toLocaleString('vi-VN')} ₫). Số tiền cần hoàn trả cho khách: ${refundAmount.toLocaleString('vi-VN')} ₫. Toàn bộ mã QR check-in đã bị vô hiệu hóa.`,
        data: { feePercentage, feeAmount, refundAmount, daysLeft }
      });
    }

    // Các trạng thái khác (Pending, Confirmed)
    await sequelize.query(`UPDATE bookings SET booking_status = ? WHERE booking_id = ?`, {
      replacements: [booking_status, bookingId], transaction
    });

    await transaction.commit();

    if (booking_status === 'Confirmed') {
      await autoSyncAttendanceForTourDate(bookingId);
    }

    res.status(200).json({ success: true, message: '✅ Cập nhật trạng thái booking thành công!' });
  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi updateBookingStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// TÍNH NĂNG ĐẶT DỊCH VỤ ĐƠN LẺ (STANDALONE)
// ==========================================

exports.bookStandaloneService = async (req, res) => {
    try {
        const customer_id = req.user.user_id;
        const { service_id, quantity, usage_date, total_amount, payment_method, notes } = req.body;

        if (!service_id || !quantity || !usage_date || !total_amount) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin đặt dịch vụ' });
        }

        // Lấy thông tin partner_id từ bảng services
        const [serviceData] = await sequelize.query('SELECT partner_id FROM travel_management.services WHERE service_id = ?', {
            replacements: [service_id]
        });

        const partner_id = serviceData[0] ? serviceData[0].partner_id : null;
        const initialStatus = partner_id ? 'SentToPartner' : 'Pending';

        const [result] = await sequelize.query(`
            INSERT INTO service_bookings 
            (customer_id, service_id, quantity, usage_date, total_amount, payment_method, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, {
            replacements: [customer_id, service_id, quantity, usage_date, total_amount, payment_method || 'Prepaid', initialStatus, notes || '']
        });

        const newBookingId = result;

        // Nếu có đối tác, tự động gửi yêu cầu sang cho đối tác luôn (bỏ qua NV Văn phòng)
        if (partner_id) {
            const content = `Khách hàng đặt: Ngày ${usage_date} - Số lượng: ${quantity}`;
            await sequelize.query(`
                INSERT INTO service_requests (service_booking_id, partner_id, requested_by, request_content, status, agreed_price)
                VALUES (?, ?, ?, ?, 'Pending', ?)
            `, {
                replacements: [newBookingId, partner_id, customer_id, content, total_amount]
            });
        }

        res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu đặt dịch vụ thành công',
            data: { booking_id: result }
        });
    } catch (error) {
        console.error('Lỗi khi đặt dịch vụ đơn lẻ:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getMyServiceBookings = async (req, res) => {
    try {
        const customer_id = req.user.user_id || req.user.id || req.user.userId;
        const [bookings] = await sequelize.query(`
            SELECT sb.*, 
                   CASE WHEN sb.status IN ('Paid', 'Completed') THEN 'Paid' ELSE 'Unpaid' END AS payment_status,
                   s.service_name, s.service_type, s.image_url, s.unit
            FROM service_bookings sb
            JOIN travel_management.services s ON sb.service_id = s.service_id
            WHERE sb.customer_id = ?
            ORDER BY sb.created_at DESC
        `, {
            replacements: [customer_id]
        });

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách dịch vụ:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getAllServiceBookingsAdmin = async (req, res) => {
    try {
        const [bookings] = await sequelize.query(`
            SELECT sb.*, 
                   CASE WHEN sb.status IN ('Paid', 'Completed') THEN 'Paid' ELSE 'Unpaid' END AS payment_status,
                   s.service_name, s.service_type, s.image_url, s.unit,
                   (SELECT status FROM service_requests sr WHERE sr.service_booking_id = sb.booking_id ORDER BY created_at DESC LIMIT 1) as partner_status
            FROM service_bookings sb
            JOIN travel_management.services s ON sb.service_id = s.service_id
            ORDER BY sb.created_at DESC
        `);

        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách dịch vụ admin:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.confirmServiceBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'confirm' hoặc 'reject'
        
        const [bookingData] = await sequelize.query('SELECT * FROM service_bookings WHERE booking_id = ?', {
            replacements: [id]
        });
        const booking = bookingData[0];
        
        if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });

        if (action === 'reject') {
            await sequelize.query("UPDATE service_bookings SET status = 'Rejected' WHERE booking_id = ?", { replacements: [id] });
            return res.json({ success: true, message: 'Đã từ chối yêu cầu' });
        }

        if (action === 'confirm') {
            const voucher_code = 'VOUCHER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            
            await sequelize.query(`
                UPDATE service_bookings 
                SET status = 'Confirmed', voucher_code = ? 
                WHERE booking_id = ?
            `, { replacements: [voucher_code, id] });

            return res.json({ success: true, message: 'Đã xác nhận dịch vụ', voucher: voucher_code });
        }

    } catch (error) {
        console.error('Lỗi xác nhận dịch vụ:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ==========================================
// TÍNH NĂNG ĐỐI TÁC (PARTNER PORTAL)
// ==========================================

exports.forwardToPartner = async (req, res) => {
    try {
        const { id } = req.params; // service_booking_id
        const user_id = req.user.user_id;

        const [bookingData] = await sequelize.query('SELECT * FROM service_bookings WHERE booking_id = ?', {
            replacements: [id]
        });
        const booking = bookingData[0];
        
        if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu đặt dịch vụ' });

        // Lấy thông tin partner_id từ bảng services
        const [serviceData] = await sequelize.query('SELECT partner_id FROM travel_management.services WHERE service_id = ?', {
            replacements: [booking.service_id]
        });
        
        if (!serviceData[0] || !serviceData[0].partner_id) {
             return res.status(400).json({ success: false, message: 'Dịch vụ này chưa được gán cho đối tác cụ thể nào!' });
        }
        
        const partner_id = serviceData[0].partner_id;

        // Kiểm tra xem đã gửi yêu cầu trước đó chưa
        const [existingReq] = await sequelize.query('SELECT request_id FROM service_requests WHERE service_booking_id = ? LIMIT 1', {
            replacements: [id]
        });
        
        if (existingReq && existingReq.length > 0) {
            return res.status(400).json({ success: false, message: 'Yêu cầu cho dịch vụ này đã được gửi trước đó rồi!' });
        }

        // Ghi vào bảng service_requests
        const content = `Khách hàng đặt: Ngày ${booking.usage_date} - Số lượng: ${booking.quantity}`;
        await sequelize.query(`
            INSERT INTO service_requests (service_booking_id, partner_id, requested_by, request_content, status, agreed_price)
            VALUES (?, ?, ?, ?, 'Pending', ?)
        `, {
            replacements: [id, partner_id, user_id, content, booking.total_amount]
        });

        res.json({ success: true, message: 'Đã gửi yêu cầu sang cho Đối tác thành công!' });
    } catch (error) {
        console.error('Lỗi khi gửi đối tác:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getPartnerRequests = async (req, res) => {
    try {
        const user_id = req.user.user_id || req.user.id; // Tài khoản đang đăng nhập
        
        // Lấy email của user
        const [userData] = await sequelize.query('SELECT email FROM travel_management.users WHERE user_id = ?', {
            replacements: [user_id]
        });
        
        if (!userData || !userData[0] || !userData[0].email) {
            return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ' });
        }
        
        // Tìm partner_id từ bảng partners thông qua email
        const [partnerData] = await sequelize.query('SELECT partner_id FROM travel_management.partners WHERE email = ?', {
            replacements: [userData[0].email]
        });

        if (!partnerData || partnerData.length === 0) {
            return res.json({ success: true, data: [] }); // Không tìm thấy partner tương ứng với email
        }

        const real_partner_id = partnerData[0].partner_id;

        const [requests] = await sequelize.query(`
            SELECT sr.*, sb.usage_date, sb.quantity, sb.total_amount, 
                   s.service_name, s.service_type, s.image_url
            FROM service_requests sr
            JOIN service_bookings sb ON sr.service_booking_id = sb.booking_id
            JOIN travel_management.services s ON sb.service_id = s.service_id
            WHERE sr.partner_id = ?
            ORDER BY sr.created_at DESC
        `, {
            replacements: [real_partner_id]
        });

        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Lỗi khi tải danh sách yêu cầu Đối tác:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.updatePartnerRequestStatus = async (req, res) => {
    try {
        const { id } = req.params; // request_id
        const { status } = req.body; // 'Accepted' hoặc 'Rejected'
        
        await sequelize.query(`
            UPDATE service_requests 
            SET status = ? 
            WHERE request_id = ?
        `, { replacements: [status, id] });

        res.json({ success: true, message: 'Đã phản hồi yêu cầu dịch vụ!' });
    } catch (error) {
        console.error('Lỗi cập nhật yêu cầu:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// =========================================================================
// TÍCH HỢP THANH TOÁN REALTIME SEPAY (VIETQR + NGÂN HÀNG LIÊN KẾT + WEBHOOK)
// =========================================================================

// 1. Lấy thông tin QR & Ngân hàng liên kết theo đúng đơn hàng
// GET /api/bookings/:bookingId/sepay-qr?type=tour|service
exports.getSepayPaymentInfo = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const type = req.query.type === 'service' ? 'service' : 'tour';

        let orderInfo = null;
        let transferContent = '';
        let orderCode = '';
        let orderTitle = '';
        let isPaid = false;

        if (type === 'service') {
            const [rows] = await sequelize.query(`
                SELECT sb.booking_id, sb.total_amount, sb.status, sb.voucher_code, sb.created_at,
                       s.service_name, u.full_name AS customer_name
                FROM service_bookings sb
                LEFT JOIN travel_management.services s ON sb.service_id = s.service_id
                LEFT JOIN travel_management.users u ON sb.customer_id = u.user_id
                WHERE sb.booking_id = ?
            `, { replacements: [bookingId] });

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt dịch vụ!' });
            }
            orderInfo = rows[0];
            transferContent = `THANHTOANSRV${bookingId}`;
            orderCode = `#SRV-${String(bookingId).padStart(4, '0')}`;
            orderTitle = orderInfo.service_name || `Dịch vụ #${bookingId}`;
            isPaid = ['Paid', 'Completed'].includes(orderInfo.status);
        } else {
            const [rows] = await sequelize.query(`
                SELECT b.booking_id, b.total_amount, b.payment_status, b.booking_status, b.booking_date,
                       u.full_name AS customer_name,
                       COALESCE(t.tour_name, CONCAT('Tour thiết kế riêng: ', cr.destination), 'Tour du lịch') AS tour_name
                FROM bookings b
                LEFT JOIN users u ON b.customer_id = u.user_id
                LEFT JOIN departures d ON b.departure_id = d.departure_id
                LEFT JOIN tours t ON d.tour_id = t.tour_id
                LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
                LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
                WHERE b.booking_id = ?
            `, { replacements: [bookingId] });

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt tour!' });
            }
            orderInfo = rows[0];
            transferContent = `THANHTOAN${bookingId}`;
            orderCode = `#BKG-${String(bookingId).padStart(4, '0')}`;
            orderTitle = orderInfo.tour_name;
            isPaid = orderInfo.payment_status === 'Paid';

            // Đồng bộ mã giao dịch kỳ vọng vào bảng payments nếu đang Pending
            await sequelize.query(`
                UPDATE payments 
                SET payment_method = 'VNPAY_QR', transaction_code = ?
                WHERE booking_id = ? AND payment_status = 'Pending'
            `, { replacements: [transferContent, bookingId] });
        }

        const amount = Math.round(Number(orderInfo.total_amount || 0));
        const sepayQrUrl = `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.accountNumber}&bank=${SEPAY_CONFIG.bankName}&amount=${amount}&des=${encodeURIComponent(transferContent)}&template=compact`;
        const vietQrUrl = `https://img.vietqr.io/image/${SEPAY_CONFIG.bankCode}-${SEPAY_CONFIG.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(SEPAY_CONFIG.accountName)}`;
        const deeplinkBase = `https://dl.vietqr.io/pay?ba=${SEPAY_CONFIG.accountNumber}@${SEPAY_CONFIG.bankCode.toLowerCase()}&am=${amount}&tn=${encodeURIComponent(transferContent)}&bn=${encodeURIComponent(SEPAY_CONFIG.accountName)}`;

        return res.status(200).json({
            success: true,
            data: {
                booking_id: Number(bookingId),
                type,
                order_code: orderCode,
                order_title: orderTitle,
                customer_name: orderInfo.customer_name || 'Quý khách',
                created_at: orderInfo.booking_date || orderInfo.created_at,
                booking_status: orderInfo.booking_status || orderInfo.status,
                amount,
                transfer_content: transferContent,
                payment_status: isPaid ? 'Paid' : 'Unpaid',
                bank: {
                    bankName: SEPAY_CONFIG.bankName,
                    bankFullName: 'Ngân hàng TMCP Tiên Phong (TPBank)',
                    bankCode: SEPAY_CONFIG.bankCode,
                    bankBin: SEPAY_CONFIG.bankBin,
                    accountNumber: SEPAY_CONFIG.accountNumber,
                    accountName: SEPAY_CONFIG.accountName
                },
                qr_url: sepayQrUrl,
                vietqr_url: vietQrUrl,
                deeplink_base: deeplinkBase
            }
        });
    } catch (error) {
        console.error('Lỗi getSepayPaymentInfo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Hàm nội bộ chốt đơn thành công khi phát hiện giao dịch từ SePay (dùng chung cho cả Webhook và API Polling)
const markOrderPaidFromSepay = async ({ type, bookingId, txAmount, txRef, txContent }) => {
    const transaction = await sequelize.transaction();
    try {
        const finalCode = `${type === 'service' ? 'THANHTOANSRV' : 'THANHTOAN'}${bookingId}${txRef ? ` (SePay #${txRef})` : ''}`;

        if (type === 'service') {
            const voucher_code = 'VOUCHER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            await sequelize.query(`
                UPDATE service_bookings
                SET status = 'Paid', voucher_code = COALESCE(voucher_code, ?)
                WHERE booking_id = ?
            `, { replacements: [voucher_code, bookingId], transaction });
        } else {
            // Kiểm tra xem đã có dòng payment nào cho booking này chưa
            const [existingPay] = await sequelize.query(
                `SELECT payment_id FROM payments WHERE booking_id = ? LIMIT 1`,
                { replacements: [bookingId], transaction }
            );
            if (existingPay.length > 0) {
                await sequelize.query(`
                    UPDATE payments
                    SET payment_method = 'VNPAY_QR',
                        payment_status = 'Success',
                        transaction_code = ?,
                        paid_at = NOW()
                    WHERE booking_id = ?
                `, { replacements: [finalCode, bookingId], transaction });
            } else {
                await sequelize.query(`
                    INSERT INTO payments (booking_id, payment_method, amount, transaction_code, payment_status, paid_at)
                    VALUES (?, 'VNPAY_QR', ?, ?, 'Success', NOW())
                `, { replacements: [bookingId, txAmount || 0, finalCode], transaction });
            }

            await sequelize.query(`
                UPDATE bookings
                SET payment_status = 'Paid', booking_status = 'Confirmed'
                WHERE booking_id = ?
            `, { replacements: [bookingId], transaction });
        }

        await transaction.commit();

        if (type !== 'service') {
            await autoSyncAttendanceForTourDate(bookingId);
        }
        console.log(`✅ [SePay Realtime] Đã tự động xác nhận thanh toán cho ${type.toUpperCase()} #${bookingId} (${txAmount}đ - ${txContent})`);
        return true;
    } catch (err) {
        await transaction.rollback();
        console.error('❌ Lỗi markOrderPaidFromSepay:', err);
        throw err;
    }
};

// 2. Kiểm tra trạng thái thanh toán Realtime (Hỗ trợ cả Localhost qua SePay UserAPI + Hosting qua DB/Webhook)
// GET /api/bookings/:bookingId/check-sepay?type=tour|service
exports.checkSepayPaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const type = req.query.type === 'service' ? 'service' : 'tour';

        let expectedAmount = 0;
        let isAlreadyPaid = false;
        let bookingCreatedAt = null;

        if (type === 'service') {
            const [rows] = await sequelize.query(
                `SELECT booking_id, total_amount, status, voucher_code, created_at FROM service_bookings WHERE booking_id = ?`,
                { replacements: [bookingId] }
            );
            if (rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn dịch vụ!' });
            expectedAmount = Math.round(Number(rows[0].total_amount || 0));
            isAlreadyPaid = ['Paid', 'Completed'].includes(rows[0].status);
            bookingCreatedAt = rows[0].created_at;
        } else {
            const [rows] = await sequelize.query(
                `SELECT booking_id, total_amount, payment_status, booking_status, booking_date FROM bookings WHERE booking_id = ?`,
                { replacements: [bookingId] }
            );
            if (rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt tour!' });
            expectedAmount = Math.round(Number(rows[0].total_amount || 0));
            isAlreadyPaid = rows[0].payment_status === 'Paid';
            bookingCreatedAt = rows[0].booking_date;
        }

        // Bước 1: Nếu DB đã cập nhật Paid (nhờ Webhook hoặc lần check trước) -> trả về ngay
        if (isAlreadyPaid) {
            return res.status(200).json({
                success: true,
                paid: true,
                source: 'database',
                message: 'Đơn hàng đã được thanh toán thành công!'
            });
        }

        // Bước 2: Gọi trực tiếp SePay UserAPI bằng Token để kiểm tra lịch sử giao dịch ngân hàng TPBank 00000419627
        const transactions = await fetchSepayTransactions(30);

        // Regex khớp chính xác mã đơn (không bị nhầm lẫn giữa đơn #2 và #25 nhờ (?!\d))
        const pattern = type === 'service'
            ? new RegExp(`(?:THANHTOANSRV|SRV)0*${bookingId}(?!\\d)`, 'i')
            : new RegExp(`(?:THANHTOAN|BKG|DH)0*${bookingId}(?!\\d)`, 'i');

        // Thời điểm tối thiểu của giao dịch hợp lệ: phải phát sinh từ khi tạo đơn (trừ hao 5 phút chống lệch đồng hồ)
        const orderDateObj = new Date(bookingCreatedAt || Date.now());
        const minTxTime = orderDateObj.getTime() - (5 * 60 * 1000);

        // Lấy danh sách các mã tham chiếu giao dịch SePay đã từng được xác nhận trong hệ thống để tránh trùng lặp
        const [usedPayments] = await sequelize.query(
            `SELECT transaction_code FROM payments WHERE payment_status = 'Success'`
        );
        const usedRefs = new Set();
        usedPayments.forEach(p => {
            const code = String(p.transaction_code || '');
            const m = code.match(/SePay #([a-zA-Z0-9_-]+)/i);
            if (m && m[1]) usedRefs.add(m[1].toLowerCase());
        });

        const matchedTx = transactions.find(tx => {
            const amountIn = Number(tx.amount_in || 0);
            if (amountIn <= 0) return false;

            // 1. Kiểm tra thời gian: Giao dịch ngân hàng PHẢI phát sinh SAU thời điểm tạo đơn hàng
            const txDateStr = String(tx.transaction_date || '').trim();
            if (!txDateStr) return false;
            // SePay lưu thời gian theo giờ Việt Nam (GMT+7: YYYY-MM-DD HH:mm:ss)
            const txTime = new Date(`${txDateStr.replace(' ', 'T')}+07:00`).getTime();
            if (isNaN(txTime) || txTime < minTxTime) return false;

            // 2. Không cho phép tái sử dụng giao dịch cũ đã xác nhận cho đơn khác
            const refNumber = String(tx.reference_number || tx.id || '').toLowerCase();
            if (refNumber && usedRefs.has(refNumber)) return false;

            // 3. Khớp mã đơn trong nội dung chuyển khoản
            const rawContent = String(tx.transaction_content || tx.content || '');
            const cleanContent = rawContent.replace(/[^a-zA-Z0-9]/g, '');
            const isCodeMatched = pattern.test(cleanContent);
            if (!isCodeMatched) return false;

            // 4. Kiểm tra số tiền chuyển khoản:
            // Mặc định phải đủ tiền đơn hàng (amountIn >= expectedAmount).
            // Chỉ khi developer chủ động bật SEPAY_ALLOW_DEMO_AMOUNT=true mới chấp nhận >= 2000đ để test thẻ thật.
            const allowDemo = process.env.SEPAY_ALLOW_DEMO_AMOUNT === 'true';
            return (amountIn >= expectedAmount) || (allowDemo && amountIn >= 2000);
        });

        if (matchedTx) {
            await markOrderPaidFromSepay({
                type,
                bookingId,
                txAmount: Number(matchedTx.amount_in || expectedAmount),
                txRef: matchedTx.reference_number || matchedTx.id,
                txContent: matchedTx.transaction_content
            });

            return res.status(200).json({
                success: true,
                paid: true,
                source: 'sepay_realtime_api',
                message: '🎉 Hệ thống SePay đã nhận được khoản chuyển khoản của bạn!',
                transaction: {
                    id: matchedTx.id,
                    reference_number: matchedTx.reference_number,
                    amount_in: matchedTx.amount_in,
                    transaction_date: matchedTx.transaction_date,
                    content: matchedTx.transaction_content,
                    bank_brand_name: matchedTx.bank_brand_name
                }
            });
        }

        return res.status(200).json({
            success: true,
            paid: false,
            expected_amount: expectedAmount,
            expected_content: type === 'service' ? `THANHTOANSRV${bookingId}` : `THANHTOAN${bookingId}`
        });
    } catch (error) {
        console.error('Lỗi checkSepayPaymentStatus:', error.message);
        // Trả về paid: false nhẹ nhàng để frontend tiếp tục polling mà không báo lỗi đỏ
        res.status(200).json({ success: true, paid: false, warning: error.message });
    }
};

// 3. Webhook nhận thông báo đẩy trực tiếp từ SePay (Dành cho môi trường Hosting / Production)
// POST /api/bookings/sepay-webhook
exports.sepayWebhook = async (req, res) => {
    try {
        const payload = req.body || {};
        console.log('🔔 [SePay Webhook Received]:', JSON.stringify(payload));

        const transferType = payload.transferType || 'in';
        const transferAmount = Number(payload.transferAmount || payload.amount_in || 0);
        const rawContent = String(payload.content || payload.transaction_content || '');
        const referenceCode = payload.referenceCode || payload.reference_number || payload.id || '';
        const transactionDate = payload.transactionDate || payload.transaction_date;

        if (transferType !== 'in' || transferAmount <= 0) {
            return res.status(200).json({ success: true, message: 'Ignored non-incoming transaction' });
        }

        // Kiểm tra xem transaction reference này đã được xử lý chưa
        if (referenceCode) {
            const [alreadyUsed] = await sequelize.query(
                `SELECT payment_id FROM payments WHERE transaction_code LIKE ? LIMIT 1`,
                { replacements: [`%${referenceCode}%`] }
            );
            if (alreadyUsed.length > 0) {
                return res.status(200).json({ success: true, message: 'Transaction already processed previously' });
            }
        }

        const cleanContent = rawContent.replace(/[^a-zA-Z0-9]/g, '');
        const allowDemo = process.env.SEPAY_ALLOW_DEMO_AMOUNT === 'true';

        // Kiểm tra xem có phải đơn Dịch vụ lẻ (THANHTOANSRV{id}) không
        const srvMatch = cleanContent.match(/(?:THANHTOANSRV|SRV)0*(\d+)/i);
        if (srvMatch && srvMatch[1]) {
            const serviceBookingId = Number(srvMatch[1]);
            const [rows] = await sequelize.query(
                `SELECT booking_id, total_amount, status, created_at FROM service_bookings WHERE booking_id = ?`,
                { replacements: [serviceBookingId] }
            );
            if (rows.length > 0 && !['Paid', 'Completed'].includes(rows[0].status)) {
                const expected = Math.round(Number(rows[0].total_amount || 0));
                const minTime = new Date(rows[0].created_at || Date.now()).getTime() - (5 * 60 * 1000);
                let isTimeValid = true;
                if (transactionDate) {
                    const txTime = new Date(`${String(transactionDate).replace(' ', 'T')}+07:00`).getTime();
                    if (!isNaN(txTime) && txTime < minTime) isTimeValid = false;
                }

                if (isTimeValid && ((transferAmount >= expected) || (allowDemo && transferAmount >= 2000))) {
                    await markOrderPaidFromSepay({
                        type: 'service',
                        bookingId: serviceBookingId,
                        txAmount: transferAmount,
                        txRef: referenceCode,
                        txContent: rawContent
                    });
                }
            }
            return res.status(200).json({ success: true, message: `Processed service booking #${serviceBookingId}` });
        }

        // Kiểm tra đơn Tour (THANHTOAN{id} / BKG{id} / DH{id})
        const tourMatch = cleanContent.match(/(?:THANHTOAN|BKG|DH)0*(\d+)/i);
        if (tourMatch && tourMatch[1]) {
            const tourBookingId = Number(tourMatch[1]);
            const [rows] = await sequelize.query(
                `SELECT booking_id, total_amount, payment_status, booking_date FROM bookings WHERE booking_id = ?`,
                { replacements: [tourBookingId] }
            );
            if (rows.length > 0 && rows[0].payment_status !== 'Paid') {
                const expected = Math.round(Number(rows[0].total_amount || 0));
                const minTime = new Date(rows[0].booking_date || Date.now()).getTime() - (5 * 60 * 1000);
                let isTimeValid = true;
                if (transactionDate) {
                    const txTime = new Date(`${String(transactionDate).replace(' ', 'T')}+07:00`).getTime();
                    if (!isNaN(txTime) && txTime < minTime) isTimeValid = false;
                }

                if (isTimeValid && ((transferAmount >= expected) || (allowDemo && transferAmount >= 2000))) {
                    await markOrderPaidFromSepay({
                        type: 'tour',
                        bookingId: tourBookingId,
                        txAmount: transferAmount,
                        txRef: referenceCode,
                        txContent: rawContent
                    });
                }
            }
            return res.status(200).json({ success: true, message: `Processed tour booking #${tourBookingId}` });
        }

        return res.status(200).json({ success: true, message: 'No matching booking code found in transfer content' });
    } catch (error) {
        console.error('❌ Lỗi xử lý SePay Webhook:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Hủy đơn hàng khi hết hạn thanh toán 10 phút (Quá 10 phút không thanh toán sẽ tự hủy để nhường chỗ)
// PUT /api/bookings/:bookingId/cancel-expired?type=tour|service
exports.cancelExpiredBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { bookingId } = req.params;
        const type = req.query.type === 'service' ? 'service' : 'tour';

        if (type === 'service') {
            const [rows] = await sequelize.query(
                `SELECT booking_id, status FROM service_bookings WHERE booking_id = ?`,
                { replacements: [bookingId], transaction }
            );
            if (rows.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn dịch vụ!' });
            }
            if (['Paid', 'Completed'].includes(rows[0].status)) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Đơn hàng đã thanh toán thành công, không thể hủy!' });
            }
            await sequelize.query(
                `UPDATE service_bookings SET status = 'Rejected' WHERE booking_id = ?`,
                { replacements: [bookingId], transaction }
            );
        } else {
            const [rows] = await sequelize.query(
                `SELECT booking_id, departure_id, num_people, booking_status, payment_status 
                 FROM bookings WHERE booking_id = ?`,
                { replacements: [bookingId], transaction }
            );
            if (rows.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt tour!' });
            }
            if (rows[0].payment_status === 'Paid' || rows[0].booking_status === 'Confirmed') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Đơn hàng đã thanh toán thành công, không thể hủy!' });
            }

            // Cập nhật trạng thái Cancelled do hết hạn thanh toán 10 phút
            await sequelize.query(
                `UPDATE bookings 
                 SET booking_status = 'Cancelled', 
                     notes = CONCAT(COALESCE(notes, ''), ' [Tự động hủy: Hết thời gian thanh toán 10 phút]')
                 WHERE booking_id = ?`,
                { replacements: [bookingId], transaction }
            );

            // Hoàn lại số slot trống vào departure
            if (rows[0].departure_id && rows[0].num_people) {
                await sequelize.query(
                    `UPDATE departures SET available_slots = available_slots + ? WHERE departure_id = ?`,
                    { replacements: [rows[0].num_people, rows[0].departure_id], transaction }
                );
            }

            // Đánh dấu payment pending thành Failed
            await sequelize.query(
                `UPDATE payments SET payment_status = 'Failed' WHERE booking_id = ? AND payment_status = 'Pending'`,
                { replacements: [bookingId], transaction }
            );
        }

        await transaction.commit();
        console.log(`⏱️ [Auto-Cancel] Đã tự động hủy đơn ${type.toUpperCase()} #${bookingId} do hết hạn thanh toán 10 phút.`);
        return res.status(200).json({
            success: true,
            message: 'Đã tự động hủy đơn hàng do quá 10 phút chưa nhận được thanh toán.'
        });
    } catch (err) {
        await transaction.rollback();
        console.error('❌ Lỗi cancelExpiredBooking:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =========================================================================
// THÔNG BÁO QUẢN TRỊ & ĐIỀU HÀNH ERP (ĐÚNG TÀI KHOẢN - ĐÚNG ROLE - ĐÚNG VIỆC)
// =========================================================================

// Hàm tự động quét và sinh thông báo khi đợt khởi hành chạm mốc <= 30 ngày (Dành cho Nhân viên văn phòng)
const autoScanAndNotifyTourClosed = async () => {
  try {
    // Quét các đợt khởi hành có khoảng cách <= 30 ngày so với hôm nay
    const [departures] = await sequelize.query(`
      SELECT 
        d.departure_id, d.tour_id, d.departure_date, d.return_date, d.status,
        t.tour_name,
        DATEDIFF(d.departure_date, CURDATE()) AS days_left,
        (
          SELECT COALESCE(SUM(b.num_people), 0) 
          FROM bookings b 
          WHERE b.departure_id = d.departure_id 
            AND b.booking_status IN ('Confirmed', 'Pending', 'Completed') 
            AND b.payment_status != 'Refunded'
        ) AS total_booked,
        (
          SELECT COUNT(b.booking_id) 
          FROM bookings b 
          WHERE b.departure_id = d.departure_id 
            AND b.booking_status IN ('Confirmed', 'Pending', 'Completed') 
            AND b.payment_status != 'Refunded'
        ) AS total_orders
      FROM departures d
      JOIN tours t ON d.tour_id = t.tour_id
      WHERE DATEDIFF(d.departure_date, CURDATE()) <= 30
        AND DATEDIFF(d.departure_date, CURDATE()) >= -7
      ORDER BY d.departure_date ASC
    `);

    for (const dep of departures) {
      // Kiểm tra xem đã có thông báo TOUR_CLOSED cho departure_id này chưa
      const [existing] = await sequelize.query(`
        SELECT notification_id FROM notifications 
        WHERE type = 'TOUR_CLOSED' AND departure_id = ? 
        LIMIT 1
      `, { replacements: [dep.departure_id] });

      const numBooked = Number(dep.total_booked || 0);
      const numOrders = Number(dep.total_orders || 0);
      const depDateObj = new Date(dep.departure_date);
      const formattedDate = `${String(depDateObj.getDate()).padStart(2, '0')}/${String(depDateObj.getMonth() + 1).padStart(2, '0')}/${depDateObj.getFullYear()}`;
      const daysLeftText = dep.days_left > 0 ? `còn ${dep.days_left} ngày` : 'hôm nay';

      const title = `🔒 Tour [${dep.tour_name}] đã khóa nhận khách`;
      const content = `Đợt khởi hành ngày ${formattedDate} (${daysLeftText}) đã chính thức khóa nhận khách (đóng trước 30 ngày để chốt dịch vụ). Hiện có ${numBooked} khách đã đặt (${numOrders} đơn). Vui lòng tiến hành gửi yêu cầu dịch vụ (khách sạn, nhà hàng, xe...) cho nhà cung cấp!`;

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO notifications (
            type, target_role, title, content, departure_id, tour_id, departure_date, num_booked, is_read, action_url, created_at
          ) VALUES (
            'TOUR_CLOSED', 'STAFF', ?, ?, ?, ?, ?, ?, 0, 'create_request', NOW()
          )
        `, {
          replacements: [
            title,
            content,
            dep.departure_id,
            dep.tour_id,
            dep.departure_date,
            numBooked
          ]
        });
      } else {
        // Cập nhật lại số lượng khách nếu có booking mới thay đổi trước khi khóa
        await sequelize.query(`
          UPDATE notifications 
          SET num_booked = ?, content = ?, action_url = 'create_request'
          WHERE notification_id = ?
        `, {
          replacements: [numBooked, content, existing[0].notification_id]
        });
      }

      // Đổi status departure sang Closed nếu còn Open
      if (dep.status === 'Open') {
        await sequelize.query(`
          UPDATE departures SET status = 'Closed' WHERE departure_id = ?
        `, { replacements: [dep.departure_id] });
      }
    }
  } catch (error) {
    console.error('❌ Lỗi autoScanAndNotifyTourClosed:', error);
  }
};

// Hàm tự động đồng bộ thông báo theo từng Role và từng User cụ thể (Đúng tài khoản - Đúng role - Đúng công việc - Đúng thời điểm)
const autoSyncStaffRoleNotifications = async (currentUser) => {
  const userId = currentUser.user_id;
  const roleId = Number(currentUser.role_id);

  try {
    // -------------------------------------------------------------
    // ROLE 4: NHÂN VIÊN VĂN PHÒNG (STAFF)
    // -------------------------------------------------------------
    if (roleId === 4) {
      // 1. Quét các tour chạm mốc <= 30 ngày (Khóa tour để gửi yêu cầu dịch vụ nhà cung cấp)
      await autoScanAndNotifyTourClosed();

      // 2. Quét các yêu cầu đổi/hủy tour mới của khách hàng (Pending)
      const [pendingChanges] = await sequelize.query(`
        SELECT cr.change_id, cr.booking_id, cr.request_type, cr.reason, cr.created_at,
               u.full_name AS customer_name,
               COALESCE(t.tour_name, CONCAT('Tour: ', ctr.destination), 'Tour du lịch') AS tour_name
        FROM booking_change_requests cr
        JOIN bookings b ON cr.booking_id = b.booking_id
        LEFT JOIN users u ON b.customer_id = u.user_id
        LEFT JOIN departures d ON b.departure_id = d.departure_id
        LEFT JOIN tours t ON d.tour_id = t.tour_id
        LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
        LEFT JOIN custom_tour_requests ctr ON q.request_id = ctr.request_id
        WHERE cr.status = 'Pending'
        ORDER BY cr.change_id DESC
        LIMIT 15
      `);

      for (const req of pendingChanges) {
        const [exists] = await sequelize.query(`
          SELECT notification_id FROM notifications 
          WHERE type = 'CHANGE_REQUEST_PENDING' AND content LIKE ?
          LIMIT 1
        `, { replacements: [`%#${req.change_id}%`] });

        if (exists.length === 0) {
          const isCancel = req.request_type === 'Cancel';
          const title = `📝 Yêu cầu ${isCancel ? 'Hủy tour & Hoàn tiền' : 'Đổi lịch khởi hành'} mới`;
          const content = `Khách hàng ${req.customer_name || 'Khách'} vừa gửi yêu cầu ${isCancel ? 'hủy tour' : 'đổi lịch'} cho đơn #${req.booking_id} (${req.tour_name}) - Mã yêu cầu #${req.change_id}. Vui lòng kiểm tra và xử lý!`;

          await sequelize.query(`
            INSERT INTO notifications (type, target_role, title, content, is_read, action_url, created_at)
            VALUES ('CHANGE_REQUEST_PENDING', 'STAFF', ?, ?, 0, 'change_request', ?)
          `, { replacements: [title, content, req.created_at || new Date()] });
        }
      }

      // 3. Quét các đơn đặt tour mới chờ xác nhận (Pending)
      const [pendingBookings] = await sequelize.query(`
        SELECT b.booking_id, b.num_people, b.total_amount, b.booking_date,
               u.full_name AS customer_name,
               COALESCE(t.tour_name, CONCAT('Tour: ', ctr.destination), 'Tour du lịch') AS tour_name
        FROM bookings b
        LEFT JOIN users u ON b.customer_id = u.user_id
        LEFT JOIN departures d ON b.departure_id = d.departure_id
        LEFT JOIN tours t ON d.tour_id = t.tour_id
        LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
        LEFT JOIN custom_tour_requests ctr ON q.request_id = ctr.request_id
        WHERE b.booking_status = 'Pending'
          AND b.booking_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY b.booking_id DESC
        LIMIT 10
      `);

      for (const bk of pendingBookings) {
        const [exists] = await sequelize.query(`
          SELECT notification_id FROM notifications 
          WHERE type = 'BOOKING_NEW' AND content LIKE ?
          LIMIT 1
        `, { replacements: [`%đơn #${bk.booking_id}%`] });

        if (exists.length === 0) {
          const title = `🛒 Đơn đặt tour mới #${bk.booking_id}`;
          const content = `Khách hàng ${bk.customer_name || 'Khách'} vừa đặt tour "${bk.tour_name}" (${bk.num_people} khách - ${new Intl.NumberFormat('vi-VN').format(bk.total_amount || 0)} ₫). Mã đơn #${bk.booking_id}.`;

          await sequelize.query(`
            INSERT INTO notifications (type, target_role, title, content, is_read, action_url, created_at)
            VALUES ('BOOKING_NEW', 'STAFF', ?, ?, 0, 'orders', ?)
          `, { replacements: [title, content, bk.booking_date || new Date()] });
        }
      }
    }

    // -------------------------------------------------------------
    // ROLE 5: HƯỚNG DẪN VIÊN (GUIDE)
    // -------------------------------------------------------------
    else if (roleId === 5) {
      // Lấy guide_id của user
      const [guideRows] = await sequelize.query(`SELECT guide_id FROM guides WHERE user_id = ?`, { replacements: [userId] });
      const guideId = guideRows[0]?.guide_id;

      if (guideId) {
        // Quét các đợt khởi hành mà HDV này được phân công (chưa hoàn thành)
        const [toursAssigned] = await sequelize.query(`
          SELECT d.departure_id, d.tour_id, d.departure_date, d.return_date, d.status, t.tour_name,
                 DATEDIFF(d.departure_date, CURDATE()) AS days_left,
                 (
                   SELECT COALESCE(SUM(b.num_people), 0) 
                   FROM bookings b 
                   WHERE b.departure_id = d.departure_id 
                     AND b.booking_status IN ('Confirmed', 'Pending', 'Completed') 
                     AND b.payment_status != 'Refunded'
                 ) AS total_passengers
          FROM departures d
          JOIN tours t ON d.tour_id = t.tour_id
          WHERE (
            d.guide_id = ? 
            OR d.departure_id IN (SELECT departure_id FROM guide_assignments WHERE guide_id = ?)
          )
            AND d.status != 'Completed'
            AND d.departure_date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
          ORDER BY d.departure_date ASC
        `, { replacements: [guideId, guideId] });

        for (const dep of toursAssigned) {
          const depDateObj = new Date(dep.departure_date);
          const formattedDate = `${String(depDateObj.getDate()).padStart(2, '0')}/${String(depDateObj.getMonth() + 1).padStart(2, '0')}/${depDateObj.getFullYear()}`;
          const daysLeft = dep.days_left;
          const daysLeftText = daysLeft > 0 ? `còn ${daysLeft} ngày` : (daysLeft === 0 ? 'hôm nay' : 'đang diễn ra');

          // Thông báo 1: Phân công HDV (GUIDE_ASSIGNED)
          const [existsAssign] = await sequelize.query(`
            SELECT notification_id FROM notifications 
            WHERE type = 'GUIDE_ASSIGNED' AND user_id = ? AND departure_id = ?
            LIMIT 1
          `, { replacements: [userId, dep.departure_id] });

          if (existsAssign.length === 0) {
            const title = `🚩 Phân công HDV: ${dep.tour_name}`;
            const content = `Bạn đã được phân công dẫn đoàn cho tour "${dep.tour_name}" - Khởi hành ngày ${formattedDate}. Hiện có ${dep.total_passengers || 0} hành khách. Vui lòng kiểm tra lịch trình và danh sách đoàn!`;

            await sequelize.query(`
              INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, departure_date, num_booked, is_read, action_url, created_at)
              VALUES (?, 'GUIDE_ASSIGNED', 'GUIDE', ?, ?, ?, ?, ?, ?, 0, 'guide_assigned', NOW())
            `, {
              replacements: [userId, title, content, dep.departure_id, dep.tour_id, dep.departure_date, dep.total_passengers || 0]
            });
          }

          // Thông báo 2: Tour sắp khởi hành (trong vòng 7 ngày) (GUIDE_TOUR_UPCOMING)
          if (daysLeft >= 0 && daysLeft <= 7) {
            const [existsUpcoming] = await sequelize.query(`
              SELECT notification_id FROM notifications 
              WHERE type = 'GUIDE_TOUR_UPCOMING' AND user_id = ? AND departure_id = ?
              LIMIT 1
            `, { replacements: [userId, dep.departure_id] });

            if (existsUpcoming.length === 0) {
              const title = `⏰ Tour sắp khởi hành: ${dep.tour_name} (${daysLeftText})`;
              const content = `Tour "${dep.tour_name}" sẽ khởi hành vào ngày ${formattedDate} (${daysLeftText}). Vui lòng chuẩn bị công tác dẫn đoàn, đón tiếp ${dep.total_passengers || 0} khách và liên hệ tài xế.`;

              await sequelize.query(`
                INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, departure_date, num_booked, is_read, action_url, created_at)
                VALUES (?, 'GUIDE_TOUR_UPCOMING', 'GUIDE', ?, ?, ?, ?, ?, ?, 0, 'guide_assigned', NOW())
              `, {
                replacements: [userId, title, content, dep.departure_id, dep.tour_id, dep.departure_date, dep.total_passengers || 0]
              });
            }
          }
        }
      }
    }

    // -------------------------------------------------------------
    // ROLE 8: TÀI XẾ (DRIVER)
    // -------------------------------------------------------------
    else if (roleId === 8) {
      // Quét các chuyến đi tài xế được phân công
      const [tripsAssigned] = await sequelize.query(`
        SELECT d.departure_id, d.tour_id, d.departure_date, d.return_date, d.status, d.vehicle_number, t.tour_name,
               DATEDIFF(d.departure_date, CURDATE()) AS days_left,
               (
                 SELECT COALESCE(SUM(b.num_people), 0) 
                 FROM bookings b 
                 WHERE b.departure_id = d.departure_id 
                   AND b.booking_status IN ('Confirmed', 'Pending', 'Completed') 
                   AND b.payment_status != 'Refunded'
               ) AS total_passengers
        FROM departures d
        JOIN tours t ON d.tour_id = t.tour_id
        WHERE (
          d.driver_id = ? 
          OR d.departure_id IN (
            SELECT departure_id FROM tour_vehicle_assignments WHERE driver_id = ? AND status != 'CANCELLED'
          )
        )
          AND d.status != 'Completed'
          AND d.departure_date >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        ORDER BY d.departure_date ASC
      `, { replacements: [userId, userId] });

      for (const trip of tripsAssigned) {
        const depDateObj = new Date(trip.departure_date);
        const formattedDate = `${String(depDateObj.getDate()).padStart(2, '0')}/${String(depDateObj.getMonth() + 1).padStart(2, '0')}/${depDateObj.getFullYear()}`;
        const daysLeft = trip.days_left;
        const daysLeftText = daysLeft > 0 ? `còn ${daysLeft} ngày` : (daysLeft === 0 ? 'hôm nay' : 'đang diễn ra');
        const vehText = trip.vehicle_number ? ` (Xe: ${trip.vehicle_number})` : '';

        // Thông báo 1: Phân công lái xe (DRIVER_ASSIGNED)
        const [existsAssign] = await sequelize.query(`
          SELECT notification_id FROM notifications 
          WHERE type = 'DRIVER_ASSIGNED' AND user_id = ? AND departure_id = ?
          LIMIT 1
        `, { replacements: [userId, trip.departure_id] });

        if (existsAssign.length === 0) {
          const title = `🚌 Phân công lái xe: ${trip.tour_name}`;
          const content = `Bạn được phân công phụ trách xe cho tour "${trip.tour_name}"${vehText} - Ngày khởi hành: ${formattedDate}. Đoàn có ${trip.total_passengers || 0} khách. Vui lòng kiểm tra phương tiện sẵn sàng.`;

          await sequelize.query(`
            INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, departure_date, num_booked, is_read, action_url, created_at)
            VALUES (?, 'DRIVER_ASSIGNED', 'DRIVER', ?, ?, ?, ?, ?, ?, 0, 'driver_assigned', NOW())
          `, {
            replacements: [userId, title, content, trip.departure_id, trip.tour_id, trip.departure_date, trip.total_passengers || 0]
          });
        }

        // Thông báo 2: Chuyến xe sắp khởi hành (trong vòng 7 ngày) (DRIVER_TRIP_UPCOMING)
        if (daysLeft >= 0 && daysLeft <= 7) {
          const [existsUpcoming] = await sequelize.query(`
            SELECT notification_id FROM notifications 
            WHERE type = 'DRIVER_TRIP_UPCOMING' AND user_id = ? AND departure_id = ?
            LIMIT 1
          `, { replacements: [userId, trip.departure_id] });

          if (existsUpcoming.length === 0) {
            const title = `⏰ Chuyến xe sắp khởi hành: ${trip.tour_name} (${daysLeftText})`;
            const content = `Chuyến xe tour "${trip.tour_name}"${vehText} sẽ khởi hành vào ngày ${formattedDate} (${daysLeftText}). Vui lòng kiểm tra xe, nhiên liệu và có mặt đón khách đúng giờ.`;

            await sequelize.query(`
              INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, departure_date, num_booked, is_read, action_url, created_at)
              VALUES (?, 'DRIVER_TRIP_UPCOMING', 'DRIVER', ?, ?, ?, ?, ?, ?, 0, 'driver_schedule', NOW())
            `, {
              replacements: [userId, title, content, trip.departure_id, trip.tour_id, trip.departure_date, trip.total_passengers || 0]
            });
          }
        }
      }
    }

    // -------------------------------------------------------------
    // ROLE 7: ĐỐI TÁC NHÀ CUNG CẤP (PARTNER)
    // -------------------------------------------------------------
    else if (roleId === 7) {
      // Tìm partner_id tương ứng với tài khoản này
      const [pRows] = await sequelize.query(`
        SELECT partner_id, partner_name FROM partners 
        WHERE email = ? OR phone = ? OR partner_name = ?
           OR (? = 'partner.muongthanh@travel.com' AND partner_id = 5)
        LIMIT 1
      `, { replacements: [currentUser.email, currentUser.phone, currentUser.full_name, currentUser.email] });

      const partnerId = pRows[0]?.partner_id;

      if (partnerId) {
        // Quét các yêu cầu dịch vụ gửi tới đối tác này
        const [partnerReqs] = await sequelize.query(`
          SELECT sr.request_id, sr.departure_id, sr.service_type, sr.status, sr.created_at,
                 COALESCE(t.tour_name, 'Dịch vụ du lịch') AS tour_name,
                 d.departure_date
          FROM service_requests sr
          LEFT JOIN departures d ON sr.departure_id = d.departure_id
          LEFT JOIN tours t ON d.tour_id = t.tour_id
          WHERE sr.partner_id = ?
          ORDER BY sr.request_id DESC
          LIMIT 20
        `, { replacements: [partnerId] });

        for (const req of partnerReqs) {
          const [exists] = await sequelize.query(`
            SELECT notification_id FROM notifications 
            WHERE type = 'PARTNER_SERVICE_REQUEST' AND user_id = ? AND content LIKE ?
            LIMIT 1
          `, { replacements: [userId, `%#${req.request_id}%`] });

          if (exists.length === 0) {
            const depDateStr = req.departure_date ? new Date(req.departure_date).toLocaleDateString('vi-VN') : 'Sắp tới';
            const title = `🛎️ Yêu cầu dịch vụ [${req.service_type}] #${req.request_id}`;
            const content = `Bạn nhận được yêu cầu cung cấp dịch vụ ${req.service_type} cho tour "${req.tour_name}" (Ngày đi: ${depDateStr}). Trạng thái: ${req.status}. Vui lòng kiểm tra và xử lý báo giá/xác nhận!`;

            await sequelize.query(`
              INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, is_read, action_url, created_at)
              VALUES (?, 'PARTNER_SERVICE_REQUEST', 'PARTNER', ?, ?, ?, 0, 'partner_requests', ?)
            `, {
              replacements: [userId, title, content, req.departure_id || null, req.created_at || new Date()]
            });
          }
        }
      }
    }

    // -------------------------------------------------------------
    // ROLE 2: QUẢN LÝ NHÂN SỰ (HR MANAGER)
    // -------------------------------------------------------------
    else if (roleId === 2) {
      // Quét các đơn xin nghỉ phép / giải trình chấm công đang chờ duyệt (Pending)
      const [pendingLeaves] = await sequelize.query(`
        SELECT lr.request_id, lr.request_type, lr.leave_type, lr.explanation_type, lr.created_at,
               u.full_name AS employee_name
        FROM leave_requests lr
        JOIN users u ON lr.employee_id = u.user_id
        WHERE lr.status = 'Pending'
        ORDER BY lr.request_id DESC
        LIMIT 20
      `);

      for (const lr of pendingLeaves) {
        const [exists] = await sequelize.query(`
          SELECT notification_id FROM notifications 
          WHERE type = 'HR_LEAVE_REQUEST' AND content LIKE ?
          LIMIT 1
        `, { replacements: [`%#${lr.request_id}%`] });

        if (exists.length === 0) {
          const typeLabel = lr.leave_type || lr.explanation_type || (lr.request_type === 'leave' ? 'nghỉ phép' : 'giải trình');
          const title = `📝 Đơn xin ${typeLabel} cần phê duyệt`;
          const content = `Nhân viên ${lr.employee_name} vừa gửi đơn #${lr.request_id} (${typeLabel}). Vui lòng xem xét và xử lý phê duyệt.`;

          await sequelize.query(`
            INSERT INTO notifications (user_id, type, target_role, title, content, is_read, action_url, created_at)
            VALUES (?, 'HR_LEAVE_REQUEST', 'HR', ?, ?, 0, 'hr_employees', ?)
          `, { replacements: [userId, title, content, lr.created_at || new Date()] });
        }
      }
    }

    // -------------------------------------------------------------
    // ROLE 3: QUẢN LÝ TOUR (TOUR MANAGER)
    // -------------------------------------------------------------
    else if (roleId === 3) {
      // 1. Quét các tour đang chờ phê duyệt (Pending_Approval)
      const [pendingTours] = await sequelize.query(`
        SELECT tour_id, tour_name, created_at 
        FROM tours 
        WHERE status = 'Pending_Approval'
        ORDER BY tour_id DESC
        LIMIT 15
      `);

      for (const pt of pendingTours) {
        const [exists] = await sequelize.query(`
          SELECT notification_id FROM notifications 
          WHERE type = 'TOUR_PENDING_APPROVAL' AND tour_id = ?
          LIMIT 1
        `, { replacements: [pt.tour_id] });

        if (exists.length === 0) {
          const title = `📋 Tour mới chờ phê duyệt: ${pt.tour_name}`;
          const content = `Tour "${pt.tour_name}" (Mã #${pt.tour_id}) đã hoàn tất thiết kế và đang chờ quản lý tour phê duyệt để mở bán chính thức.`;

          await sequelize.query(`
            INSERT INTO notifications (user_id, type, target_role, title, content, tour_id, is_read, action_url, created_at)
            VALUES (?, 'TOUR_PENDING_APPROVAL', 'MANAGER', ?, ?, ?, 0, 'approve_quotes', ?)
          `, { replacements: [userId, title, content, pt.tour_id, pt.created_at || new Date()] });
        }
      }

      // 2. Quét các báo cáo sự cố tour cần xử lý (status != 'Resolved')
      const [pendingIncidents] = await sequelize.query(`
        SELECT ir.incident_id, ir.title, ir.description, ir.created_at, ir.status,
               t.tour_name
        FROM incident_reports ir
        LEFT JOIN departures d ON ir.departure_id = d.departure_id
        LEFT JOIN tours t ON d.tour_id = t.tour_id
        WHERE ir.status IN ('Pending', 'Reported', 'In_Progress')
        ORDER BY ir.incident_id DESC
        LIMIT 15
      `);

      for (const inc of pendingIncidents) {
        const [exists] = await sequelize.query(`
          SELECT notification_id FROM notifications 
          WHERE type = 'TOUR_INCIDENT' AND content LIKE ?
          LIMIT 1
        `, { replacements: [`%#${inc.incident_id}%`] });

        if (exists.length === 0) {
          const title = `⚠️ Sự cố tour: ${inc.title || inc.tour_name || 'Cần xử lý'}`;
          const content = `Báo cáo sự cố #${inc.incident_id} trên tour "${inc.tour_name || 'Đang vận hành'}": ${inc.description || 'Cần điều phối hỗ trợ'}. Trạng thái: ${inc.status}.`;

          await sequelize.query(`
            INSERT INTO notifications (user_id, type, target_role, title, content, is_read, action_url, created_at)
            VALUES (?, 'TOUR_INCIDENT', 'MANAGER', ?, ?, 0, 'incidents', ?)
          `, { replacements: [userId, title, content, inc.created_at || new Date()] });
        }
      }
    }

    // -------------------------------------------------------------
    // ROLE 1: QUẢN TRỊ VIÊN (ADMIN)
    // -------------------------------------------------------------
    else if (roleId === 1) {
      // Quét các sự cố cần lưu ý
      const [adminIncidents] = await sequelize.query(`
        SELECT ir.incident_id, ir.title, ir.description, ir.created_at, ir.status,
               t.tour_name
        FROM incident_reports ir
        LEFT JOIN departures d ON ir.departure_id = d.departure_id
        LEFT JOIN tours t ON d.tour_id = t.tour_id
        WHERE ir.status IN ('Pending', 'Reported', 'In_Progress')
        ORDER BY ir.incident_id DESC
        LIMIT 10
      `);

      for (const inc of adminIncidents) {
        const [exists] = await sequelize.query(`
          SELECT notification_id FROM notifications 
          WHERE type = 'ADMIN_INCIDENT' AND content LIKE ?
          LIMIT 1
        `, { replacements: [`%#${inc.incident_id}%`] });

        if (exists.length === 0) {
          const title = `⚠️ [Quản trị] Sự cố vận hành: ${inc.title || inc.tour_name}`;
          const content = `Sự cố #${inc.incident_id} (${inc.tour_name || 'Vận hành'}): ${inc.description || 'Cần quản trị viên kiểm tra'}.`;

          await sequelize.query(`
            INSERT INTO notifications (user_id, type, target_role, title, content, is_read, action_url, created_at)
            VALUES (?, 'ADMIN_INCIDENT', 'ADMIN', ?, ?, 0, 'incidents', ?)
          `, { replacements: [userId, title, content, inc.created_at || new Date()] });
        }
      }
    }
  } catch (error) {
    console.error('❌ Lỗi autoSyncStaffRoleNotifications:', error);
  }
};

// 1. LẤY DANH SÁCH THÔNG BÁO CHO NHÂN VIÊN & QUẢN LÝ (REALTIME - THEO ĐÚNG TÀI KHOẢN & ROLE)
// GET /api/bookings/staff-notifications
exports.getStaffNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    const [userRows] = await sequelize.query(`
      SELECT user_id, role_id, email, phone, full_name 
      FROM users 
      WHERE user_id = ?
    `, { replacements: [userId] });

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản.' });
    }

    const currentUser = userRows[0];
    const roleId = Number(currentUser.role_id);

    // Tự động đồng bộ thông báo đúng tài khoản - đúng role - đúng công việc
    await autoSyncStaffRoleNotifications(currentUser);

    // Xác định bộ lọc SQL theo từng Role đảm bảo không bị lẫn lộn thông báo
    let whereClause = '';
    let replacements = [userId];

    if (roleId === 5) {
      // Hướng dẫn viên: Chỉ thấy thông báo gắn đích danh cho mình
      whereClause = "WHERE n.user_id = ? AND n.target_role IN ('GUIDE', 'ALL')";
    } else if (roleId === 8) {
      // Tài xế: Chỉ thấy thông báo gắn đích danh cho mình
      whereClause = "WHERE n.user_id = ? AND n.target_role IN ('DRIVER', 'ALL')";
    } else if (roleId === 7) {
      // Đối tác: Chỉ thấy thông báo yêu cầu gửi cho đối tác đó
      whereClause = "WHERE n.user_id = ? AND n.target_role IN ('PARTNER', 'ALL')";
    } else if (roleId === 2) {
      // HR: Thông báo nhân sự và thông báo đích danh
      whereClause = "WHERE (n.user_id = ? OR (n.target_role = 'HR' AND n.user_id IS NULL))";
    } else if (roleId === 3) {
      // Tour Manager: Thông báo duyệt tour/sự cố và thông báo đích danh
      whereClause = "WHERE (n.user_id = ? OR (n.target_role = 'MANAGER' AND n.user_id IS NULL))";
    } else if (roleId === 4) {
      // Office Staff: Khóa tour 30 ngày, đơn đặt tour, yêu cầu đổi/hủy
      whereClause = "WHERE (n.user_id = ? OR (n.target_role = 'STAFF' AND n.user_id IS NULL))";
    } else if (roleId === 1) {
      // Admin: Nhận thông báo quản trị và toàn quyền
      whereClause = "WHERE (n.user_id = ? OR (n.target_role IN ('ADMIN', 'ALL') AND n.user_id IS NULL))";
    } else {
      whereClause = "WHERE n.user_id = ?";
    }

    const [notifications] = await sequelize.query(`
      SELECT 
        n.notification_id,
        n.title,
        n.content,
        n.type,
        n.target_role,
        n.departure_id,
        n.tour_id,
        n.departure_date,
        n.num_booked,
        n.is_read,
        n.action_url,
        n.created_at,
        t.tour_name,
        COALESCE(t.image_url, '') AS tour_image
      FROM notifications n
      LEFT JOIN tours t ON n.tour_id = t.tour_id
      ${whereClause}
      ORDER BY n.created_at DESC, n.notification_id DESC
      LIMIT 60
    `, { replacements });

    // Đếm số thông báo chưa đọc
    const [unreadCountResult] = await sequelize.query(`
      SELECT COUNT(*) AS unread_count
      FROM notifications n
      ${whereClause} AND n.is_read = 0
    `, { replacements });

    const unreadCount = Number(unreadCountResult[0]?.unread_count || 0);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Lỗi getStaffNotifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. ĐÁNH DẤU 1 THÔNG BÁO ĐÃ ĐỌC
// PUT /api/bookings/staff-notifications/:id/read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.query(`UPDATE notifications SET is_read = 1 WHERE notification_id = ?`, {
      replacements: [id]
    });
    res.status(200).json({ success: true, message: 'Đã đánh dấu thông báo là đã đọc.' });
  } catch (error) {
    console.error('❌ Lỗi markNotificationAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. ĐÁNH DẤU TẤT CẢ LÀ ĐÃ ĐỌC (ĐÚNG ROLE VÀ TÀI KHOẢN ĐANG ĐĂNG NHẬP)
// PUT /api/bookings/staff-notifications/read-all
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    const [userRows] = await sequelize.query(`
      SELECT user_id, role_id FROM users WHERE user_id = ?
    `, { replacements: [userId] });

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }

    const roleId = Number(userRows[0].role_id);
    let whereClause = '';
    let replacements = [userId];

    if (roleId === 5) {
      whereClause = "WHERE user_id = ? AND target_role IN ('GUIDE', 'ALL')";
    } else if (roleId === 8) {
      whereClause = "WHERE user_id = ? AND target_role IN ('DRIVER', 'ALL')";
    } else if (roleId === 7) {
      whereClause = "WHERE user_id = ? AND target_role IN ('PARTNER', 'ALL')";
    } else if (roleId === 2) {
      whereClause = "WHERE (user_id = ? OR (target_role = 'HR' AND user_id IS NULL))";
    } else if (roleId === 3) {
      whereClause = "WHERE (user_id = ? OR (target_role = 'MANAGER' AND user_id IS NULL))";
    } else if (roleId === 4) {
      whereClause = "WHERE (user_id = ? OR (target_role = 'STAFF' AND user_id IS NULL))";
    } else if (roleId === 1) {
      whereClause = "WHERE (user_id = ? OR (target_role IN ('ADMIN', 'ALL') AND user_id IS NULL))";
    } else {
      whereClause = "WHERE user_id = ?";
    }

    await sequelize.query(`
      UPDATE notifications 
      SET is_read = 1 
      ${whereClause} AND is_read = 0
    `, { replacements });

    res.status(200).json({ success: true, message: 'Đã đánh dấu tất cả thông báo của bạn là đã đọc.' });
  } catch (error) {
    console.error('❌ Lỗi markAllNotificationsAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. XÓA THÔNG BÁO
// DELETE /api/bookings/staff-notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.query(`DELETE FROM notifications WHERE notification_id = ?`, {
      replacements: [id]
    });
    res.status(200).json({ success: true, message: 'Đã xóa thông báo thành công.' });
  } catch (error) {
    console.error('❌ Lỗi deleteNotification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// THÔNG BÁO DÀNH CHO KHÁCH HÀNG (CUSTOMER NOTIFICATIONS REALTIME)
// =========================================================================

// Hàm tự động đồng bộ sinh thông báo ban đầu cho khách hàng nếu DB chưa có
const autoSyncCustomerInitialNotifications = async (userId) => {
  try {
    // 1. Quét bookings của khách hàng
    const [bookings] = await sequelize.query(`
      SELECT b.booking_id, b.booking_status, b.payment_status, b.booking_date, b.num_people,
             COALESCE(t.tour_name, CONCAT('Tour ', cr.destination), 'Tour du lịch') AS tour_name,
             COALESCE(d.departure_date, cr.departure_date) AS departure_date
      FROM bookings b
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
      WHERE b.customer_id = ?
      ORDER BY b.booking_id DESC
      LIMIT 10
    `, { replacements: [userId] });

    for (const b of bookings) {
      // Kiểm tra xem đã có thông báo cho booking này chưa
      const [exists] = await sequelize.query(`
        SELECT notification_id FROM notifications 
        WHERE user_id = ? AND content LIKE ? 
        LIMIT 1
      `, { replacements: [userId, `%#${b.booking_id}%`] });

      if (exists.length === 0) {
        const depDateStr = b.departure_date ? new Date(b.departure_date).toLocaleDateString('vi-VN') : 'Sắp tới';
        const isPaid = b.payment_status === 'Paid';
        const isCancelled = b.booking_status === 'Cancelled';

        let title = '🎉 Đặt tour thành công!';
        let content = `Đơn đặt tour #${b.booking_id} (${b.tour_name} - Ngày đi: ${depDateStr}) đã được ghi nhận. Vui lòng kiểm tra chi tiết đơn hàng.`;
        let type = 'BOOKING_SUCCESS';

        if (isCancelled) {
          title = '🗑️ Đơn tour đã hủy';
          content = `Đơn hàng #${b.booking_id} (${b.tour_name}) đã chuyển sang trạng thái đã hủy. Mã QR check-in đã vô hiệu hóa.`;
          type = 'BOOKING_CANCELLED';
        } else if (isPaid) {
          title = '💳 Thanh toán thành công!';
          content = `Đơn hàng #${b.booking_id} (${b.tour_name} - Ngày đi: ${depDateStr}) đã thanh toán thành công. Vé điện tử và mã QR check-in đã sẵn sàng!`;
          type = 'PAYMENT_SUCCESS';
        }

        await sequelize.query(`
          INSERT INTO notifications (user_id, title, content, type, target_role, is_read, action_url, created_at)
          VALUES (?, ?, ?, ?, 'CUSTOMER', 0, '/my-bookings', ?)
        `, {
          replacements: [userId, title, content, type, b.booking_date || new Date()]
        });
      }
    }

    // 2. Quét các yêu cầu đổi/hủy lịch đã duyệt của khách hàng
    const [changeReqs] = await sequelize.query(`
      SELECT cr.change_id, cr.booking_id, cr.request_type, cr.status, cr.refund_amount, cr.created_at,
             COALESCE(t.tour_name, 'Tour du lịch') AS tour_name
      FROM booking_change_requests cr
      JOIN bookings b ON cr.booking_id = b.booking_id
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      WHERE b.customer_id = ?
      ORDER BY cr.change_id DESC
      LIMIT 10
    `, { replacements: [userId] });

    for (const cr of changeReqs) {
      const [existsCr] = await sequelize.query(`
        SELECT notification_id FROM notifications 
        WHERE user_id = ? AND content LIKE ? 
        LIMIT 1
      `, { replacements: [userId, `%yêu cầu%#${cr.booking_id}%`] });

      if (existsCr.length === 0) {
        const isCancel = cr.request_type === 'Cancel';
        const isApproved = cr.status === 'Approved';
        const title = isApproved 
          ? `✅ Yêu cầu ${isCancel ? 'Hủy tour' : 'Đổi lịch'} đã được chấp thuận!`
          : `📝 Yêu cầu ${isCancel ? 'Hủy tour' : 'Đổi lịch'} đang xử lý`;
        const content = isApproved
          ? `Yêu cầu cho đơn tour #${cr.booking_id} (${cr.tour_name}) đã được chấp thuận.${isCancel && cr.refund_amount ? ` Tiền hoàn lại: ${new Intl.NumberFormat('vi-VN').format(cr.refund_amount)}đ.` : ''}`
          : `Yêu cầu cho đơn tour #${cr.booking_id} (${cr.tour_name}) đã được ghi nhận và đang chờ nhân viên kiểm duyệt.`;

        await sequelize.query(`
          INSERT INTO notifications (user_id, title, content, type, target_role, is_read, action_url, created_at)
          VALUES (?, ?, ?, 'CHANGE_REQUEST_RESULT', 'CUSTOMER', 0, '/my-bookings', ?)
        `, {
          replacements: [userId, title, content, cr.created_at || new Date()]
        });
      }
    }
  } catch (error) {
    console.error('Lỗi autoSyncCustomerInitialNotifications:', error);
  }
};

// 1. LẤY DANH SÁCH THÔNG BÁO CỦA KHÁCH HÀNG (REALTIME)
// GET /api/bookings/customer-notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    // Tự động đồng bộ các thông báo đơn hàng của khách hàng nếu chưa có
    await autoSyncCustomerInitialNotifications(userId);

    // Lấy danh sách thông báo
    const [notifications] = await sequelize.query(`
      SELECT 
        notification_id,
        title,
        content,
        type,
        is_read,
        action_url,
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC, notification_id DESC
      LIMIT 40
    `, { replacements: [userId] });

    // Đếm số lượng chưa đọc
    const [unreadCountResult] = await sequelize.query(`
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, { replacements: [userId] });

    const unreadCount = Number(unreadCountResult[0]?.unread_count || 0);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Lỗi getMyNotifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. ĐÁNH DẤU 1 THÔNG BÁO LÀ ĐÃ ĐỌC
// PUT /api/bookings/customer-notifications/:id/read
exports.markCustomerNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.user_id || req.user?.userId;

    await sequelize.query(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE notification_id = ? AND user_id = ?
    `, { replacements: [id, userId] });

    res.status(200).json({ success: true, message: 'Đã đánh dấu thông báo là đã đọc.' });
  } catch (error) {
    console.error('❌ Lỗi markCustomerNotificationAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. ĐÁNH DẤU TẤT CẢ THÔNG BÁO CỦA KHÁCH HÀNG LÀ ĐÃ ĐỌC
// PUT /api/bookings/customer-notifications/read-all
exports.markAllCustomerNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.user_id || req.user?.userId;

    await sequelize.query(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ?
    `, { replacements: [userId] });

    res.status(200).json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
  } catch (error) {
    console.error('❌ Lỗi markAllCustomerNotificationsAsRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


