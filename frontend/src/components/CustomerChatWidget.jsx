import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  MessageCircle, X, Send, Paperclip, Image as ImageIcon, 
  MapPin, Mic, Square, Play, Pause, Download, ExternalLink,
  ChevronDown, Smile, AlertCircle
} from 'lucide-react';

const SOCKET_SERVER_URL = 'http://localhost:5005';
const CHAT_API_URL = 'http://localhost:5005/api/chat';

const CustomerChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [staffTyping, setStaffTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Trạng thái Ghi âm
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Trạng thái phát Audio
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioPlayerRef = useRef(null);

  // Lightbox xem ảnh
  const [previewImage, setPreviewImage] = useState(null);

  // References
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Lấy hoặc tạo Guest ID trong LocalStorage nếu khách chưa đăng nhập
  const getGuestId = () => {
    let gid = localStorage.getItem('chat_guest_id');
    if (!gid) {
      gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('chat_guest_id', gid);
    }
    return gid;
  };

  // 1. Khởi tạo kết nối Socket & API hội thoại
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    // Lấy thông tin user đăng nhập
    const storedUserStr = localStorage.getItem('user');
    let currentUser = null;
    if (storedUserStr) {
      try { currentUser = JSON.parse(storedUserStr); } catch (e) {}
    }

    const guestId = getGuestId();

    // Gọi API khởi tạo / lấy hội thoại
    axios.post(`${CHAT_API_URL}/init`, {
      customerId: currentUser?.id || null,
      guestId: currentUser ? null : guestId,
      customerName: currentUser?.fullName || currentUser?.name || 'Khách vãng lai',
      customerEmail: currentUser?.email || null,
      customerPhone: currentUser?.phone || null
    }).then(res => {
      if (res.data.success && res.data.conversation) {
        const conv = res.data.conversation;
        setConversation(conv);
        setMessages(res.data.messages || []);
        setUnreadCount(conv.unread_customer_count || 0);

        // Join room hội thoại
        socket.emit('join_conversation', conv.conversation_id);
      }
    }).catch(err => {
      console.error('Lỗi khởi tạo chat:', err);
    });

    // Lắng nghe tin nhắn mới từ Socket
    socket.on('new_message', (newMsg) => {
      setMessages(prev => {
        // Tránh trùng lặp
        if (prev.some(m => m.message_id === newMsg.message_id)) return prev;
        return [...prev, newMsg];
      });

      // Tăng số tin chưa đọc nếu đang đóng chat và tin nhắn từ nhân viên/bot
      if (!isOpen && (newMsg.sender_type === 'staff' || newMsg.sender_type === 'bot')) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Lắng nghe sự kiện nhân viên đang gõ
    socket.on('user_typing', ({ isTyping }) => {
      setStaffTyping(isTyping);
    });

    // Lắng nghe tin nhắn được đọc
    socket.on('messages_read', ({ reader }) => {
      if (reader === 'staff') {
        setMessages(prev => prev.map(m => m.sender_type === 'customer' ? { ...m, is_read: 1 } : m));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Tự động cuộn xuống tin nhắn cuối
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, staffTyping]);

  // Khi mở cửa sổ chat -> Đánh dấu đã đọc
  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (conversation?.conversation_id) {
      axios.post(`${CHAT_API_URL}/conversations/${conversation.conversation_id}/read`, {
        reader: 'customer'
      }).catch(e => console.error(e));
    }
  };

  // Đóng cửa sổ chat
  const handleCloseChat = () => {
    setIsOpen(false);
  };

  // Xử lý gửi tin nhắn Text
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !conversation) return;

    setInputText('');
    emitTyping(false);

    const storedUser = localStorage.getItem('user');
    let user = null;
    if (storedUser) {
      try { user = JSON.parse(storedUser); } catch (e) {}
    }

    const payload = {
      conversation_id: conversation.conversation_id,
      sender_type: 'customer',
      sender_id: user?.id || null,
      sender_name: user?.fullName || user?.name || conversation.customer_name || 'Khách hàng',
      message_type: 'text',
      content: text
    };

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', payload);
      } else {
        await axios.post(`${CHAT_API_URL}/messages`, payload);
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
    }
  };

  // Xử lý Typing
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitTyping(false);
    }, 2000);
  };

  const emitTyping = (typingStatus) => {
    if (socketRef.current && conversation) {
      socketRef.current.emit('typing', {
        conversationId: conversation.conversation_id,
        senderName: conversation.customer_name,
        isTyping: typingStatus
      });
    }
  };

  // 2. Xử lý Gửi Vị Trí (Location)
  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS!');
      return;
    }

    if (!window.confirm('Quý khách có muốn chia sẻ vị trí hiện tại với nhân viên tư vấn không?')) {
      return;
    }

    setIsUploading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsUploading(false);
        const { latitude, longitude } = pos.coords;
        const storedUser = localStorage.getItem('user');
        let user = null;
        if (storedUser) {
          try { user = JSON.parse(storedUser); } catch (e) {}
        }

        const payload = {
          conversation_id: conversation.conversation_id,
          sender_type: 'customer',
          sender_id: user?.id || null,
          sender_name: user?.fullName || user?.name || conversation.customer_name || 'Khách hàng',
          message_type: 'location',
          content: '📍 Đã chia sẻ vị trí hiện tại',
          latitude: latitude,
          longitude: longitude
        };

        if (socketRef.current?.connected) {
          socketRef.current.emit('send_message', payload);
        } else {
          await axios.post(`${CHAT_API_URL}/messages`, payload);
        }
      },
      (err) => {
        setIsUploading(false);
        console.error('Lỗi lấy vị trí:', err);
        alert('Không thể lấy vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 3. Xử lý Gửi Ảnh & File tài liệu
  const handleFileUpload = async (event, forceType = null) => {
    const file = event.target.files[0];
    if (!file || !conversation) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Dung lượng tệp vượt quá 25MB!');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await axios.post(`${CHAT_API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        const { fileUrl, fileName, fileSize, messageType } = uploadRes.data;
        const storedUser = localStorage.getItem('user');
        let user = null;
        if (storedUser) {
          try { user = JSON.parse(storedUser); } catch (e) {}
        }

        const payload = {
          conversation_id: conversation.conversation_id,
          sender_type: 'customer',
          sender_id: user?.id || null,
          sender_name: user?.fullName || user?.name || conversation.customer_name || 'Khách hàng',
          message_type: forceType || messageType,
          content: forceType === 'image' || messageType === 'image' ? '📷 Hình ảnh' : `📎 ${fileName}`,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize
        };

        if (socketRef.current?.connected) {
          socketRef.current.emit('send_message', payload);
        } else {
          await axios.post(`${CHAT_API_URL}/messages`, payload);
        }
      }
    } catch (err) {
      console.error('Lỗi upload file:', err);
      alert('Không thể tải tệp lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  // 4. Xử lý Ghi Âm Voice Message
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Dừng tất cả audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Lỗi micro:', err);
      alert('Không thể truy cập Microphone. Vui lòng cấp quyền truy cập micro trên trình duyệt để ghi âm.');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const finishAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const duration = recordingSeconds;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingSeconds(0);

      if (audioBlob.size < 100) return; // quá ngắn

      setIsUploading(true);
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioFile);

      try {
        const uploadRes = await axios.post(`${CHAT_API_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data.success) {
          const { fileUrl, fileName, fileSize } = uploadRes.data;
          const storedUser = localStorage.getItem('user');
          let user = null;
          if (storedUser) {
            try { user = JSON.parse(storedUser); } catch (e) {}
          }

          const payload = {
            conversation_id: conversation.conversation_id,
            sender_type: 'customer',
            sender_id: user?.id || null,
            sender_name: user?.fullName || user?.name || conversation.customer_name || 'Khách hàng',
            message_type: 'audio',
            content: '🎙️ Tin nhắn thoại',
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            duration: duration || 1
          };

          if (socketRef.current?.connected) {
            socketRef.current.emit('send_message', payload);
          } else {
            await axios.post(`${CHAT_API_URL}/messages`, payload);
          }
        }
      } catch (err) {
        console.error('Lỗi gửi voice note:', err);
      } finally {
        setIsUploading(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  // Format thời lượng ghi âm
  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Format giờ gửi
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const d = new Date(timeStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Play/Pause Audio
  const togglePlayAudio = (msgId, url) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      setPlayingAudioId(msgId);
      audio.play().catch(e => console.error(e));
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  return (
    <>
      {/* 1. NÚT CHAT BONG BÓNG NỔI GÓC PHẢI DƯỚI */}
      {!isOpen && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 99999 }}>
          <button
            onClick={handleOpenChat}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#0194f3',
              background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)',
              border: 'none',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(1, 148, 243, 0.45)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(1, 148, 243, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(1, 148, 243, 0.45)';
            }}
            title="Chat trực tuyến với nhân viên hỗ trợ"
          >
            <MessageCircle size={32} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '800',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 2. CỬA SỔ CHAT TRỰC TUYẾN */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          height: '560px',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0,0,0,0.06)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideIn 0.25s ease-out'
        }}>
          {/* HEADER CHAT */}
          <div style={{
            background: 'linear-gradient(135deg, #0194f3 0%, #005bb5 100%)',
            padding: '16px 20px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#0194f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '800',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  💬
                </div>
                <span style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid #ffffff'
                }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '-0.2px' }}>
                  Hỗ Trợ Khách Hàng 24/7
                </h4>
                <div style={{ fontSize: '11.5px', color: '#e0f2fe', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
                  <span>Nhân viên trực tuyến • Phản hồi ngay</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseChat}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              title="Đóng chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* DANH SÁCH TIN NHẮN (MESSAGE LIST) */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((m) => {
              const isMe = m.sender_type === 'customer';
              const isBot = m.sender_type === 'bot';

              return (
                <div
                  key={m.message_id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Tên người gửi nếu không phải là mình */}
                  {!isMe && (
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '3px', marginLeft: '4px' }}>
                      {isBot ? '🤖 Bot Tư Vấn' : `👨‍💼 ${m.sender_name || 'Nhân viên Travel'}`}
                    </span>
                  )}

                  {/* BONG BÓNG TIN NHẮN */}
                  <div style={{
                    padding: m.message_type === 'image' ? '6px' : '10px 14px',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: isMe ? '#0194f3' : '#ffffff',
                    color: isMe ? '#ffffff' : '#1e293b',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: isMe ? 'none' : '1px solid #e2e8f0',
                    fontSize: '13.5px',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                    position: 'relative'
                  }}>
                    {/* 1. TEXT MESSAGE */}
                    {m.message_type === 'text' && (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    )}

                    {/* 2. IMAGE MESSAGE */}
                    {m.message_type === 'image' && (
                      <div>
                        <img
                          src={m.file_url}
                          alt="Đính kèm"
                          style={{
                            maxWidth: '220px',
                            maxHeight: '220px',
                            borderRadius: '12px',
                            display: 'block',
                            cursor: 'pointer',
                            objectFit: 'cover'
                          }}
                          onClick={() => setPreviewImage(m.file_url)}
                        />
                        {m.content && m.content !== '📷 Hình ảnh' && (
                          <div style={{ padding: '6px 4px 2px', fontSize: '12px' }}>{m.content}</div>
                        )}
                      </div>
                    )}

                    {/* 3. FILE TÀI LIỆU */}
                    {m.message_type === 'file' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          background: isMe ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                          color: isMe ? '#ffffff' : '#0194f3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px'
                        }}>
                          📄
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {m.file_name || 'Tài liệu đính kèm'}
                          </div>
                          {m.file_size && (
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>
                              {(m.file_size / 1024).toFixed(1)} KB
                            </div>
                          )}
                        </div>
                        <a
                          href={m.file_url}
                          download={m.file_name}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: isMe ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                            color: isMe ? '#ffffff' : '#1e293b',
                            padding: '6px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Tải tệp xuống"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    )}

                    {/* 4. VỊ TRÍ (LOCATION) */}
                    {m.message_type === 'location' && (
                      <div style={{ minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '6px' }}>
                          <MapPin size={16} color={isMe ? '#ffffff' : '#ef4444'} />
                          <span>Vị trí chia sẻ</span>
                        </div>
                        <div style={{ fontSize: '11.5px', opacity: 0.85, marginBottom: '8px' }}>
                          Tọa độ: {Number(m.latitude).toFixed(4)}, {Number(m.longitude).toFixed(4)}
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isMe ? 'rgba(255,255,255,0.25)' : '#0194f3',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          <span>Mở Google Maps</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {/* 5. GHI ÂM (AUDIO VOICE MESSAGE) */}
                    {m.message_type === 'audio' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
                        <button
                          onClick={() => togglePlayAudio(m.message_id, m.file_url)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isMe ? '#ffffff' : '#0194f3',
                            color: isMe ? '#0194f3' : '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          {playingAudioId === m.message_id ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '2px' }} />}
                        </button>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700' }}>
                            {playingAudioId === m.message_id ? 'Đang phát...' : 'Tin nhắn thoại'}
                          </div>
                          <div style={{ fontSize: '10.5px', opacity: 0.8 }}>
                            {formatSeconds(m.duration || 0)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thời gian & Trạng thái đọc */}
                  <div style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    marginTop: '2px',
                    marginRight: isMe ? '4px' : '0',
                    marginLeft: isMe ? '0' : '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{formatTime(m.created_at)}</span>
                    {isMe && (
                      <span>{m.is_read ? '✓✓ Đã xem' : '✓ Đã gửi'}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Hiệu ứng nhân viên đang soạn tin */}
            {staffTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11.5px' }}>
                <span>👨‍💼 Nhân viên đang soạn tin...</span>
                <span className="typing-dots">•••</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* FOOTER: HỘP SOẠN THẢO & ĐA PHƯƠNG TIỆN */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0'
          }}>
            {/* Thanh ghi âm đang hoạt động */}
            {isRecording ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                background: '#fef2f2',
                borderRadius: '12px',
                border: '1px solid #fecaca'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 1s infinite'
                  }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>
                    Đang ghi âm: {formatSeconds(recordingSeconds)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={cancelRecording}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#64748b',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={finishAndSendRecording}
                    style={{
                      border: 'none',
                      background: '#22c55e',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Send size={13} />
                    <span>Gửi</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* TOOLBAR ĐÍNH KÈM: Ảnh, File, Vị trí, Ghi âm */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {/* Nút gửi ảnh */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      border: 'none',
                      background: '#f1f5f9',
                      color: '#475569',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Gửi hình ảnh"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleFileUpload(e, 'image')}
                  />

                  {/* Nút gửi tệp tài liệu */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: 'none',
                      background: '#f1f5f9',
                      color: '#475569',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Đính kèm tài liệu (PDF, Word, Excel,...)"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  {/* Nút gửi vị trí */}
                  <button
                    type="button"
                    onClick={handleSendLocation}
                    style={{
                      border: 'none',
                      background: '#f1f5f9',
                      color: '#ef4444',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Gửi vị trí hiện tại của bạn"
                  >
                    <MapPin size={18} />
                  </button>

                  {/* Nút ghi âm micro */}
                  <button
                    type="button"
                    onClick={startRecording}
                    style={{
                      border: 'none',
                      background: '#f1f5f9',
                      color: '#0194f3',
                      borderRadius: '8px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Ghi âm tin nhắn thoại"
                  >
                    <Mic size={18} />
                  </button>

                  {isUploading && (
                    <span style={{ fontSize: '11px', color: '#0194f3', fontWeight: '600', marginLeft: 'auto' }}>
                      ⏳ Đang tải lên...
                    </span>
                  )}
                </div>

                {/* FORM NHẬP TIN NHẮN */}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Nhập tin nhắn..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '24px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      transition: 'border 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#0194f3'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: inputText.trim() ? '#0194f3' : '#e2e8f0',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: inputText.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MODAL XEM ẢNH FULL (LIGHTBOX) */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <img
            src={previewImage}
            alt="Xem ảnh lớn"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}
    </>
  );
};

export default CustomerChatWidget;
