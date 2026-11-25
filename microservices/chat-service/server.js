const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('../node_modules/mysql2/promise');
const jwt = require('../node_modules/jsonwebtoken');
const { askAI, askAIStream, isUsableGeminiKey, copilotTourDesign } = require('./ai/geminiService');
const {
  validateQuestion,
  checkRateLimit,
  getCachedResponse,
  setCachedResponse,
  logAIChat
} = require('./ai/aiSecurity');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Thư mục lưu trữ uploads cục bộ (tự lưu trữ, không cần bên thứ 3)
const uploadsDir = path.join(__dirname, '../shared-uploads/chat');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads/chat', express.static(uploadsDir));

// Cấu hình Multer upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${baseName}_${uniqueSuffix}${ext || ''}`);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Database pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'travel_management',
  ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost')) ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' ? true : false
  } : undefined,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --- HELPER FUNCTION: SAVE MESSAGE ---
async function saveMessageToDb({
  conversation_id,
  sender_type,
  sender_id = null,
  sender_name,
  message_type = 'text',
  content = null,
  file_url = null,
  file_name = null,
  file_size = null,
  latitude = null,
  longitude = null,
  duration = null
}) {
  const [res] = await pool.query(`
    INSERT INTO chat_messages (
      conversation_id, sender_type, sender_id, sender_name,
      message_type, content, file_url, file_name, file_size,
      latitude, longitude, duration, is_read, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
  `, [
    conversation_id, sender_type, sender_id, sender_name,
    message_type, content, file_url, file_name, file_size,
    latitude, longitude, duration
  ]);

  const messageId = res.insertId;

  // Lấy lại tin nhắn vừa tạo
  const [msgRows] = await pool.query(
    'SELECT * FROM chat_messages WHERE message_id = ?',
    [messageId]
  );
  const savedMsg = msgRows[0];

  // Nội dung tóm tắt để hiển thị trên danh sách hội thoại
  let previewText = content || '';
  if (message_type === 'image') previewText = '📷 [Hình ảnh]';
  else if (message_type === 'file') previewText = `📎 [Tệp] ${file_name || ''}`;
  else if (message_type === 'audio') previewText = '🎙️ [Tin nhắn thoại]';
  else if (message_type === 'location') previewText = '📍 [Vị trí]';

  // Cập nhật cuộc hội thoại
  if (sender_type === 'customer') {
    await pool.query(`
      UPDATE chat_conversations 
      SET last_message = ?, 
          last_message_at = NOW(), 
          last_message_sender = 'customer', 
          unread_staff_count = unread_staff_count + 1 
      WHERE conversation_id = ?
    `, [previewText, conversation_id]);
  } else if (sender_type === 'staff') {
    await pool.query(`
      UPDATE chat_conversations 
      SET last_message = ?, 
          last_message_at = NOW(), 
          last_message_sender = 'staff', 
          unread_customer_count = unread_customer_count + 1,
          staff_id = COALESCE(staff_id, ?)
      WHERE conversation_id = ?
    `, [previewText, sender_id, conversation_id]);
  } else {
    // bot
    await pool.query(`
      UPDATE chat_conversations 
      SET last_message = ?, 
          last_message_at = NOW(), 
          last_message_sender = 'bot' 
      WHERE conversation_id = ?
    `, [previewText, conversation_id]);
  }

  // Lấy dữ liệu hội thoại mới nhất để báo cho staff
  const [convRows] = await pool.query(
    'SELECT * FROM chat_conversations WHERE conversation_id = ?',
    [conversation_id]
  );
  const updatedConv = convRows[0];

  // Broadcast realtime qua Socket.IO
  io.to(`conversation_${conversation_id}`).emit('new_message', savedMsg);
  io.emit('conversation_updated', updatedConv);

  return savedMsg;
}

// =================== REST APIS ===================

// 0. Endpoint Realtime Broadcast chung cho toàn bộ hệ thống
app.post('/api/chat/broadcast', (req, res) => {
  try {
    const { event, data, room } = req.body;
    if (!event) return res.status(400).json({ success: false, message: 'Event is required' });
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }
    return res.json({ success: true, event });
  } catch (err) {
    console.error('Broadcast error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Khách hàng khởi tạo / tìm hội thoại
app.post('/api/chat/init', async (req, res) => {
  try {
    const { customerId, guestId, customerName, customerEmail, customerPhone } = req.body;
    let conversation = null;

    if (customerId) {
      const [rows] = await pool.query(
        'SELECT * FROM chat_conversations WHERE customer_id = ? ORDER BY conversation_id DESC LIMIT 1',
        [customerId]
      );
      if (rows.length > 0) {
        conversation = rows[0];
      }
    } else if (guestId) {
      const [rows] = await pool.query(
        'SELECT * FROM chat_conversations WHERE guest_id = ? ORDER BY conversation_id DESC LIMIT 1',
        [guestId]
      );
      if (rows.length > 0) {
        conversation = rows[0];
      }
    }

    // Nếu chưa có, tạo hội thoại mới
    if (!conversation) {
      const name = customerName || (customerId ? `Khách hàng #${customerId}` : `Khách vãng lai`);
      const [insertRes] = await pool.query(`
        INSERT INTO chat_conversations (
          customer_id, guest_id, customer_name, customer_email, customer_phone,
          status, last_message, last_message_at, last_message_sender,
          unread_staff_count, unread_customer_count, created_at
        ) VALUES (?, ?, ?, ?, ?, 'active', NULL, NOW(), 'bot', 0, 0, NOW())
      `, [customerId || null, guestId || null, name, customerEmail || null, customerPhone || null]);

      const convId = insertRes.insertId;

      // Gửi tin nhắn chào mừng tự động từ hệ thống
      await saveMessageToDb({
        conversation_id: convId,
        sender_type: 'bot',
        sender_id: null,
        sender_name: 'Hệ thống hỗ trợ',
        message_type: 'text',
        content: 'Xin chào! 👋 Cảm ơn quý khách đã liên hệ với TravelVN. Nhân viên tư vấn đang tiếp nhận thông tin và sẽ phản hồi trong vài phút. Quý khách vui lòng để lại câu hỏi hoặc yêu cầu hỗ trợ nhé!'
      });

      const [newConv] = await pool.query(
        'SELECT * FROM chat_conversations WHERE conversation_id = ?',
        [convId]
      );
      conversation = newConv[0];
    } else {
      // Cập nhật lại thông tin tên/email/phone nếu có thay đổi
      if (customerName || customerEmail || customerPhone) {
        await pool.query(`
          UPDATE chat_conversations 
          SET customer_name = COALESCE(?, customer_name),
              customer_email = COALESCE(?, customer_email),
              customer_phone = COALESCE(?, customer_phone)
          WHERE conversation_id = ?
        `, [customerName || null, customerEmail || null, customerPhone || null, conversation.conversation_id]);
      }
    }

    // Lấy tin nhắn của hội thoại
    const [messages] = await pool.query(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversation.conversation_id]
    );

    res.json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    console.error('Error init chat:', error);
    res.status(500).json({ success: false, message: 'Lỗi khởi tạo chat', error: error.message });
  }
});

// 2. Nhân viên: Lấy danh sách tất cả các cuộc hội thoại
app.get('/api/chat/conversations', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM chat_conversations WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY last_message_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách chat', error: error.message });
  }
});

// 2b. Lấy danh sách tài khoản khách hàng từ hệ thống để nhân viên chủ động chọn nhắn tin
app.get('/api/chat/customers', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT user_id, full_name, email, phone, avatar FROM users WHERE role_id = 6';
    const params = [];

    if (search) {
      sql += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY full_name ASC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách khách hàng', error: error.message });
  }
});

// 3. Lấy tin nhắn của một cuộc hội thoại
app.get('/api/chat/conversations/:id/messages', async (req, res) => {
  try {
    const convId = req.params.id;
    const [messages] = await pool.query(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [convId]
    );
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy tin nhắn', error: error.message });
  }
});

// 4. Đánh dấu đã đọc
app.post('/api/chat/conversations/:id/read', async (req, res) => {
  try {
    const convId = req.params.id;
    const { reader } = req.body; // 'staff' | 'customer'

    if (reader === 'staff') {
      await pool.query(
        'UPDATE chat_conversations SET unread_staff_count = 0 WHERE conversation_id = ?',
        [convId]
      );
      await pool.query(
        "UPDATE chat_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'customer'",
        [convId]
      );
    } else {
      await pool.query(
        'UPDATE chat_conversations SET unread_customer_count = 0 WHERE conversation_id = ?',
        [convId]
      );
      await pool.query(
        "UPDATE chat_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type IN ('staff', 'bot')",
        [convId]
      );
    }

    io.to(`conversation_${convId}`).emit('messages_read', { conversationId: convId, reader });
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật đã đọc', error: error.message });
  }
});

// 5. Upload tệp đa phương tiện (Ảnh, File tài liệu, File ghi âm voice)
app.post('/api/chat/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp để tải lên' });
    }

    const mime = req.file.mimetype || '';
    const originalName = req.file.originalname || '';
    let messageType = 'file';

    if (mime.startsWith('image/')) {
      messageType = 'image';
    } else if (
      mime.startsWith('audio/') || 
      originalName.endsWith('.webm') || 
      originalName.endsWith('.wav') || 
      originalName.endsWith('.mp3') ||
      originalName.endsWith('.ogg') ||
      originalName.endsWith('.m4a')
    ) {
      messageType = 'audio';
    }

    // URL file phục vụ qua cổng gateway 5000 (hoặc port 5005)
    const fileUrl = `http://localhost:5000/uploads/chat/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      messageType
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, message: 'Lỗi upload tệp', error: error.message });
  }
});

// 6. Gửi tin nhắn qua REST API
app.post('/api/chat/messages', async (req, res) => {
  try {
    const savedMsg = await saveMessageToDb(req.body);
    res.json({ success: true, data: savedMsg });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Lỗi gửi tin nhắn', error: error.message });
  }
});

// 7. ROBOT CHAT AI - GEMINI RAG + FUNCTION CALLING + STREAMING
function extractAuthUser(req) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    const secret = process.env.JWT_SECRET || 'travel_management_secret_key_2026';
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function getClientRateKey(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const sessionId = req.body?.sessionId || req.headers['x-session-id'] || '';
  return `${ip}:${sessionId}`;
}

app.get('/api/chat/ai/health', (req, res) => {
  res.json({
    success: true,
    geminiConfigured: isUsableGeminiKey(),
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  });
});

app.post('/api/chat/ai/tour-copilot', async (req, res) => {
  try {
    const { action, destinationName, destinationsList, departureDestination, daysCount, days, availablePlaces, availableHotels } = req.body || {};
    const result = await copilotTourDesign({
      action: action || 'audit',
      destinationName,
      destinationsList: Array.isArray(destinationsList) ? destinationsList : [],
      departureDestination: departureDestination || null,
      daysCount: Number(daysCount || 3),
      days: Array.isArray(days) ? days : [],
      availablePlaces: Array.isArray(availablePlaces) ? availablePlaces : [],
      availableHotels: Array.isArray(availableHotels) ? availableHotels : []
    });
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in tour-copilot:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xử lý trợ lý AI thiết kế tour: ' + error.message
    });
  }
});

app.post('/api/chat/ai/ask', async (req, res) => {
  const startedAt = Date.now();
  const authUser = extractAuthUser(req);
  const { question: rawQuestion, conversationHistory } = req.body || {};

  const validation = validateQuestion(rawQuestion);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  const rate = checkRateLimit(getClientRateKey(req));
  if (!rate.allowed) {
    return res.status(429).json({
      success: false,
      message: `Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${rate.retryAfterSec} giây.`
    });
  }

  try {
    const question = validation.question;
    const canUseCache = !authUser && (!Array.isArray(conversationHistory) || conversationHistory.length <= 1);
    const cacheKey = question.toLowerCase();

    if (canUseCache) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        logAIChat({
          question,
          responseTimeMs: Date.now() - startedAt,
          mode: `${cached.mode}_cache`,
          toolsUsed: cached.toolsUsed,
          status: 'ok',
          userId: authUser?.user_id || authUser?.id
        });
        return res.json({ success: true, data: cached });
      }
    }

    const result = await askAI({
      pool,
      question,
      conversationHistory,
      authUser
    });

    if (canUseCache && result.mode !== 'guardrail') {
      setCachedResponse(cacheKey, result);
    }

    logAIChat({
      question,
      responseTimeMs: Date.now() - startedAt,
      mode: result.mode,
      toolsUsed: result.toolsUsed,
      status: 'ok',
      userId: authUser?.user_id || authUser?.id
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logAIChat({
      question: validation.question,
      responseTimeMs: Date.now() - startedAt,
      mode: 'error',
      status: 'error',
      userId: authUser?.user_id || authUser?.id
    });
    console.error('Error in AI ask:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xử lý câu hỏi AI',
      error: error.message
    });
  }
});

app.post('/api/chat/ai/stream', async (req, res) => {
  const startedAt = Date.now();
  const authUser = extractAuthUser(req);
  const { question: rawQuestion, conversationHistory } = req.body || {};

  const validation = validateQuestion(rawQuestion);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  const rate = checkRateLimit(getClientRateKey(req));
  if (!rate.allowed) {
    return res.status(429).json({
      success: false,
      message: `Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${rate.retryAfterSec} giây.`
    });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const sendEvent = (event, payload) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const result = await askAIStream({
      pool,
      question: validation.question,
      conversationHistory,
      authUser,
      onChunk: (textDelta) => {
        sendEvent('delta', { text: textDelta });
      }
    });

    logAIChat({
      question: validation.question,
      responseTimeMs: Date.now() - startedAt,
      mode: result.mode,
      toolsUsed: result.toolsUsed,
      status: 'ok',
      userId: authUser?.user_id || authUser?.id
    });

    sendEvent('done', {
      suggestions: result.suggestions || [],
      handoffSuggested: Boolean(result.handoffSuggested),
      mode: result.mode,
      toolsUsed: result.toolsUsed || []
    });
    res.end();
  } catch (error) {
    logAIChat({
      question: validation.question,
      responseTimeMs: Date.now() - startedAt,
      mode: 'stream_error',
      status: 'error',
      userId: authUser?.user_id || authUser?.id
    });
    console.error('Error in AI stream:', error);
    sendEvent('error', { message: 'Không thể kết nối trợ lý AI lúc này. Vui lòng thử lại hoặc liên hệ nhân viên.' });
    res.end();
  }
});

// =================== SOCKET.IO REALTIME ===================

io.on('connection', (socket) => {
  // console.log('Client connected to Socket.IO:', socket.id);

  // Tham gia phòng hội thoại cụ thể
  socket.on('join_conversation', (convId) => {
    if (convId) {
      socket.join(`conversation_${convId}`);
    }
  });

  // Rời phòng hội thoại
  socket.on('leave_conversation', (convId) => {
    if (convId) {
      socket.leave(`conversation_${convId}`);
    }
  });

  // Tham gia phòng chung của nhân viên
  socket.on('join_staff', () => {
    socket.join('staff_room');
  });

  // Tham gia phòng người dùng (khách hoặc nhân viên)
  socket.on('join_user', (userId) => {
    if (userId) socket.join(`user_${userId}`);
  });

  // Tham gia phòng theo vai trò (1: Admin, 3: Office Staff, 4: Tour Manager...)
  socket.on('join_role', (roleId) => {
    if (roleId) socket.join(`role_${roleId}`);
  });

  // Sự kiện gửi tin nhắn qua Socket
  socket.on('send_message', async (data, callback) => {
    try {
      const savedMsg = await saveMessageToDb(data);
      if (typeof callback === 'function') {
        callback({ success: true, data: savedMsg });
      }
    } catch (err) {
      console.error('Socket send_message error:', err);
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Sự kiện người dùng đang gõ phím
  socket.on('typing', ({ conversationId, senderName, isTyping }) => {
    socket.to(`conversation_${conversationId}`).emit('user_typing', { senderName, isTyping });
  });

  socket.on('disconnect', () => {
    // console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.CHAT_SERVICE_PORT || 5005;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`💬 Chat Service running on port ${PORT}`);
  console.log(`📡 Socket.IO ready at http://0.0.0.0:${PORT}`);
  console.log(`📁 Uploads served from ${uploadsDir}`);
});
