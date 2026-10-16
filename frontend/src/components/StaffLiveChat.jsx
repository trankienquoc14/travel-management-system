import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Search, MessageSquare, Send, Paperclip, Image as ImageIcon, 
  MapPin, Mic, Play, Pause, Download, ExternalLink,
  User, RefreshCw, Phone, Mail, Clock, CheckCheck, PlusCircle,
  Users, MessageCircle, X
} from 'lucide-react';

const SOCKET_SERVER_URL = 'http://localhost:5005';
const CHAT_API_URL = 'http://localhost:5005/api/chat';

const StaffLiveChat = () => {
  // 1. Quản lý trạng thái Hội thoại & Khách hàng
  const [conversations, setConversations] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Tab điều hướng cột trái: 'recent' (Đoạn chat gần đây) | 'customers' (Tất cả tài khoản khách) | 'unread' (Chưa đọc)
  const [activeLeftTab, setActiveLeftTab] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');

  // Trạng thái Upload & Typing
  const [isUploading, setIsUploading] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);

  // Trạng thái Ghi âm Voice
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Trạng thái Phát Audio
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioPlayerRef = useRef(null);

  // Lightbox xem ảnh
  const [previewImage, setPreviewImage] = useState(null);

  // References
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Lấy thông tin Staff đang đăng nhập
  const getStaffUser = () => {
    const s = localStorage.getItem('user');
    if (s) {
      try { return JSON.parse(s); } catch (e) {}
    }
    return { id: 999, fullName: 'Nhân viên tư vấn' };
  };

  // Khởi tạo Socket.IO & Tải dữ liệu ban đầu
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.emit('join_staff');

    fetchConversations();
    fetchCustomerAccounts();

    // Lắng nghe sự kiện cập nhật hội thoại mới
    socket.on('conversation_updated', (updatedConv) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.conversation_id === updatedConv.conversation_id);
        if (idx !== -1) {
          const list = [...prev];
          list[idx] = { ...list[idx], ...updatedConv };
          return list.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
        } else {
          return [updatedConv, ...prev];
        }
      });
    });

    // Lắng nghe tin nhắn mới
    socket.on('new_message', (newMsg) => {
      setSelectedConv(current => {
        if (current && current.conversation_id === newMsg.conversation_id) {
          setMessages(prev => {
            if (prev.some(m => m.message_id === newMsg.message_id)) return prev;
            return [...prev, newMsg];
          });
          // Đánh dấu đã đọc
          axios.post(`${CHAT_API_URL}/conversations/${current.conversation_id}/read`, {
            reader: 'staff'
          }).catch(e => console.error(e));
        }
        return current;
      });
    });

    // Lắng nghe khách đang gõ
    socket.on('user_typing', ({ isTyping }) => {
      setCustomerTyping(isTyping);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Lấy danh sách cuộc trò chuyện
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${CHAT_API_URL}/conversations`);
      if (res.data.success) {
        const list = res.data.data || [];
        setConversations(list);
        if (!selectedConv && list.length > 0) {
          handleSelectConversation(list[0]);
        }
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách chat:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách tất cả tài khoản khách hàng để nhân viên chủ động chọn chat
  const fetchCustomerAccounts = async () => {
    setLoadingCustomers(true);
    try {
      const res = await axios.get(`${CHAT_API_URL}/customers`);
      if (res.data.success) {
        setCustomerAccounts(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi lấy tài khoản khách hàng:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Chọn hoặc Khởi tạo cuộc trò chuyện với một tài khoản khách hàng cụ thể
  const handleStartChatWithCustomer = async (cust) => {
    try {
      const res = await axios.post(`${CHAT_API_URL}/init`, {
        customerId: cust.user_id,
        customerName: cust.full_name,
        customerEmail: cust.email,
        customerPhone: cust.phone
      });

      if (res.data.success && res.data.conversation) {
        const conv = res.data.conversation;
        // Cập nhật vào danh sách hội thoại nếu chưa có
        setConversations(prev => {
          if (!prev.some(c => c.conversation_id === conv.conversation_id)) {
            return [conv, ...prev];
          }
          return prev;
        });

        // Chuyển sang hội thoại đó và chuyển tab sang "Đang nhắn"
        setActiveLeftTab('recent');
        handleSelectConversation(conv);
      }
    } catch (err) {
      console.error('Lỗi khởi tạo chat với khách:', err);
    }
  };

  // Chọn hội thoại cụ thể
  const handleSelectConversation = async (conv) => {
    setSelectedConv(conv);
    setCustomerTyping(false);

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', conv.conversation_id);
    }

    if (conv.unread_staff_count > 0) {
      axios.post(`${CHAT_API_URL}/conversations/${conv.conversation_id}/read`, {
        reader: 'staff'
      }).then(() => {
        setConversations(prev => prev.map(c => 
          c.conversation_id === conv.conversation_id ? { ...c, unread_staff_count: 0 } : c
        ));
      }).catch(e => console.error(e));
    }

    try {
      const res = await axios.get(`${CHAT_API_URL}/conversations/${conv.conversation_id}/messages`);
      if (res.data.success) {
        setMessages(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi lấy tin nhắn:', err);
    }
  };

  // Tự động cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, customerTyping]);

  // Gửi tin nhắn Text
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputText).trim();
    if (!text || !selectedConv) return;

    if (textToSend === null) setInputText('');

    const staffUser = getStaffUser();
    const payload = {
      conversation_id: selectedConv.conversation_id,
      sender_type: 'staff',
      sender_id: staffUser.id || null,
      sender_name: staffUser.fullName || staffUser.name || 'Nhân viên tư vấn',
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
      console.error('Lỗi gửi tin:', err);
    }
  };

  // Câu trả lời mẫu nhanh
  const quickResponses = [
    'Dạ em chào anh/chị! Em có thể hỗ trợ gì cho chuyến đi của mình ạ?',
    'Dạ bên em đã nhận được yêu cầu và đang kiểm tra tình trạng chỗ trống ạ.',
    'Dạ tour này hiện đang có giá ưu đãi đặc biệt trong tuần này anh/chị nhé!',
    'Dạ anh/chị cho em xin số lượng khách dự kiến tham gia được không ạ?',
    'Cảm ơn anh/chị đã quan tâm đến dịch vụ của Travel Management!'
  ];

  // Upload Ảnh & File tài liệu
  const handleFileUpload = async (event, forceType = null) => {
    const file = event.target.files[0];
    if (!file || !selectedConv) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Tệp quá lớn (>25MB)!');
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
        const staffUser = getStaffUser();

        const payload = {
          conversation_id: selectedConv.conversation_id,
          sender_type: 'staff',
          sender_id: staffUser.id || null,
          sender_name: staffUser.fullName || staffUser.name || 'Nhân viên tư vấn',
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
      alert('Không thể tải tệp lên.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  // Gửi vị trí GPS
  const handleSendLocation = () => {
    if (!selectedConv) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const staffUser = getStaffUser();
          const payload = {
            conversation_id: selectedConv.conversation_id,
            sender_type: 'staff',
            sender_id: staffUser.id || null,
            sender_name: staffUser.fullName || staffUser.name || 'Nhân viên tư vấn',
            message_type: 'location',
            content: '📍 Vị trí văn phòng Travel Management',
            latitude,
            longitude
          };

          if (socketRef.current?.connected) {
            socketRef.current.emit('send_message', payload);
          } else {
            await axios.post(`${CHAT_API_URL}/messages`, payload);
          }
        },
        () => {
          const staffUser = getStaffUser();
          const payload = {
            conversation_id: selectedConv.conversation_id,
            sender_type: 'staff',
            sender_id: staffUser.id || null,
            sender_name: staffUser.fullName || staffUser.name || 'Nhân viên tư vấn',
            message_type: 'location',
            content: '📍 Trụ sở Travel Management (Hà Nội)',
            latitude: 21.028511,
            longitude: 105.804817
          };
          if (socketRef.current?.connected) {
            socketRef.current.emit('send_message', payload);
          } else {
            axios.post(`${CHAT_API_URL}/messages`, payload);
          }
        }
      );
    }
  };

  // Ghi âm Voice Note
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
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
      alert('Không thể kết nối Micro để ghi âm.');
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

      if (audioBlob.size < 100) return;

      setIsUploading(true);
      const audioFile = new File([audioBlob], `staff_voice_${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioFile);

      try {
        const uploadRes = await axios.post(`${CHAT_API_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data.success) {
          const { fileUrl, fileName, fileSize } = uploadRes.data;
          const staffUser = getStaffUser();

          const payload = {
            conversation_id: selectedConv.conversation_id,
            sender_type: 'staff',
            sender_id: staffUser.id || null,
            sender_name: staffUser.fullName || staffUser.name || 'Nhân viên tư vấn',
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

  // Play/Pause Audio
  const togglePlayAudio = (msgId, url) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      setPlayingAudioId(msgId);
      audio.play().catch(e => console.error(e));
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  // Format giây
  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Lọc danh sách hội thoại
  const filteredConversations = conversations.filter(c => {
    const matchSearch = (c.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (c.customer_phone || '').includes(searchTerm) ||
                        (c.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (activeLeftTab === 'unread') {
      return matchSearch && c.unread_staff_count > 0;
    }
    return matchSearch;
  });

  // Lọc danh sách tài khoản khách hàng
  const filteredCustomerAccounts = customerAccounts.filter(cust => {
    return (cust.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (cust.phone || '').includes(searchTerm) ||
           (cust.email || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const unreadTotal = conversations.filter(c => c.unread_staff_count > 0).length;

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: 'calc(100vh - 120px)',
      minHeight: '640px',
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 10px 35px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }}>
      {/* ========================================================================= */}
      {/* KHU VỰC 1 (CỘT BÊN TRÁI): CHỌN TÀI KHOẢN ĐỂ CHAT & HỘI THOẠI MESSENGER     */}
      {/* ========================================================================= */}
      <div style={{
        width: '340px',
        minWidth: '340px',
        maxWidth: '340px',
        flexShrink: 0,
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        zIndex: 2
      }}>
        {/* Header Cột Trái */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💬</span>
              <span>Đoạn chat</span>
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => { fetchConversations(); fetchCustomerAccounts(); }}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#475569',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Làm mới dữ liệu"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Ô Tìm Kiếm Messenger */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '10px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm khách hàng, SĐT..."
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: '20px',
                border: 'none',
                background: '#f0f2f5',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Tabs Lựa Chọn: [Đang nhắn] [Chọn tài khoản khách] [Chưa đọc] */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '12px', gap: '2px' }}>
            <button
              onClick={() => setActiveLeftTab('recent')}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '12px',
                fontWeight: activeLeftTab === 'recent' ? '800' : '600',
                cursor: 'pointer',
                background: activeLeftTab === 'recent' ? '#ffffff' : 'transparent',
                color: activeLeftTab === 'recent' ? '#0194f3' : '#64748b',
                boxShadow: activeLeftTab === 'recent' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>Hội thoại</span>
              <span style={{ fontSize: '10.5px', opacity: 0.8 }}>({conversations.length})</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('customers')}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '12px',
                fontWeight: activeLeftTab === 'customers' ? '800' : '600',
                cursor: 'pointer',
                background: activeLeftTab === 'customers' ? '#ffffff' : 'transparent',
                color: activeLeftTab === 'customers' ? '#0194f3' : '#64748b',
                boxShadow: activeLeftTab === 'customers' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
              title="Chọn tài khoản khách hàng để mở cuộc trò chuyện mới"
            >
              <span>👤 Tài khoản</span>
              <span style={{ fontSize: '10.5px', opacity: 0.8 }}>({customerAccounts.length})</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('unread')}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '12px',
                fontWeight: activeLeftTab === 'unread' ? '800' : '600',
                cursor: 'pointer',
                background: activeLeftTab === 'unread' ? '#ffffff' : 'transparent',
                color: activeLeftTab === 'unread' ? '#ef4444' : '#64748b',
                boxShadow: activeLeftTab === 'unread' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>Chưa đọc</span>
              {unreadTotal > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>
                  {unreadTotal}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Danh Sách Cuộn Cột Trái */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          {/* TAB 1 & 3: DANH SÁCH CUỘC HỘI THOẠI HIỆN TẠI */}
          {(activeLeftTab === 'recent' || activeLeftTab === 'unread') && (
            loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Đang tải tin nhắn...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#475569' }}>Chưa có tin nhắn nào</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Bấm tab "Tài khoản" để chọn khách hàng và nhắn tin trước!</div>
              </div>
            ) : (
              filteredConversations.map(c => {
                const isSelected = selectedConv?.conversation_id === c.conversation_id;
                const hasUnread = c.unread_staff_count > 0;

                return (
                  <div
                    key={c.conversation_id}
                    onClick={() => handleSelectConversation(c)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      marginBottom: '4px',
                      background: isSelected ? '#e7f3ff' : hasUnread ? '#f0f9ff' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#f0f2f5';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = hasUnread ? '#f0f9ff' : 'transparent';
                    }}
                  >
                    {/* Avatar Khách kèm chấm Online */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: isSelected ? 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)' : '#e2e8f0',
                        color: isSelected ? '#ffffff' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '800'
                      }}>
                        {c.customer_name ? c.customer_name.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <span style={{
                        position: 'absolute',
                        bottom: '1px',
                        right: '1px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        border: '2px solid #ffffff'
                      }} />
                    </div>

                    {/* Thông tin đoạn chat */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                        <span style={{
                          fontSize: '14px',
                          color: hasUnread ? '#0f172a' : '#1e293b',
                          fontWeight: hasUnread ? '800' : '600',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {c.customer_name || 'Khách hàng'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0, marginLeft: '6px' }}>
                          {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '12.5px',
                          color: hasUnread ? '#0194f3' : '#64748b',
                          fontWeight: hasUnread ? '700' : '400',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}>
                          {c.last_message || 'Bắt đầu cuộc trò chuyện'}
                        </span>

                        {hasUnread && (
                          <span style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: '800',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            marginLeft: '8px',
                            flexShrink: 0
                          }}>
                            {c.unread_staff_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* TAB 2: CHỌN TÀI KHOẢN KHÁCH HÀNG ĐỂ CHỦ ĐỘNG NHẮN TIN */}
          {activeLeftTab === 'customers' && (
            loadingCustomers ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Đang tải danh sách tài khoản khách...
              </div>
            ) : filteredCustomerAccounts.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#475569' }}>Không tìm thấy khách hàng nào</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', padding: '6px 10px', textTransform: 'uppercase' }}>
                  Chọn tài khoản để chat:
                </div>
                {filteredCustomerAccounts.map(cust => (
                  <div
                    key={cust.user_id}
                    onClick={() => handleStartChatWithCustomer(cust)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      marginBottom: '4px',
                      background: '#ffffff',
                      border: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#bae6fd';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#f1f5f9';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#0284c7',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: '800',
                        flexShrink: 0
                      }}>
                        {cust.full_name ? cust.full_name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cust.full_name}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cust.email || cust.phone || `ID: #${cust.user_id}`}
                        </span>
                      </div>
                    </div>

                    <button
                      style={{
                        border: 'none',
                        background: '#e0f2fe',
                        color: '#0284c7',
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      Nhắn tin 💬
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHU VỰC 2 (CỘT BÊN PHẢI): KHUNG CHAT TRỰC TIẾP VỚI KHÁCH HÀNG ĐƯỢC CHỌN    */}
      {/* ========================================================================= */}
      {selectedConv ? (
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          position: 'relative'
        }}>
          {/* HEADER CHAT TRỰC TIẾP */}
          <div style={{
            height: '68px',
            padding: '0 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '800'
                }}>
                  {selectedConv.customer_name ? selectedConv.customer_name.charAt(0).toUpperCase() : 'K'}
                </div>
                <span style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid #ffffff'
                }} />
              </div>

              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedConv.customer_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  <span style={{ color: '#22c55e', fontWeight: '700' }}>● Đang trực tuyến</span>
                  {selectedConv.customer_phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} color="#0194f3" />
                      <span>{selectedConv.customer_phone}</span>
                    </span>
                  )}
                  {selectedConv.customer_email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} color="#0194f3" />
                      <span>{selectedConv.customer_email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* KHUNG DANH SÁCH TIN NHẮN (MESSAGE BUBBLES MESSENGER STYLE) */}
          <div style={{
            flex: 1,
            minHeight: 0,
            padding: '20px 24px',
            overflowY: 'auto',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Lời chào đầu hội thoại */}
            <div style={{ textAlign: 'center', padding: '16px 0 24px', color: '#94a3b8' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#e0f2fe',
                color: '#0194f3',
                fontSize: '24px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px'
              }}>
                {selectedConv.customer_name ? selectedConv.customer_name.charAt(0).toUpperCase() : 'K'}
              </div>
              <strong style={{ fontSize: '15px', color: '#1e293b', display: 'block' }}>{selectedConv.customer_name}</strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Bắt đầu kết nối và tư vấn dịch vụ du lịch</span>
            </div>

            {/* Render danh sách tin nhắn */}
            {messages.map((m) => {
              const isStaff = m.sender_type === 'staff';
              const isBot = m.sender_type === 'bot';

              return (
                <div
                  key={m.message_id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isStaff ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    alignSelf: isStaff ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Nhãn người gửi */}
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '3px', marginLeft: isStaff ? '0' : '4px', marginRight: isStaff ? '4px' : '0' }}>
                    {isStaff ? '👨‍💼 Bạn (Nhân viên)' : isBot ? '🤖 Trợ lý Bot' : `👤 ${m.sender_name || 'Khách hàng'}`}
                  </span>

                  {/* Bong bóng tin nhắn */}
                  <div style={{
                    padding: m.message_type === 'image' ? '6px' : '10px 16px',
                    borderRadius: isStaff ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: isStaff ? '#0194f3' : isBot ? '#f1f5f9' : '#ffffff',
                    color: isStaff ? '#ffffff' : '#0f172a',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: isStaff ? 'none' : '1px solid #e2e8f0',
                    fontSize: '13.5px',
                    lineHeight: '1.45',
                    wordBreak: 'break-word'
                  }}>
                    {/* 1. TEXT */}
                    {m.message_type === 'text' && (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    )}

                    {/* 2. IMAGE */}
                    {m.message_type === 'image' && (
                      <div>
                        <img
                          src={m.file_url}
                          alt="Đính kèm"
                          style={{
                            maxWidth: '280px',
                            maxHeight: '280px',
                            borderRadius: '10px',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: isStaff ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                          color: isStaff ? '#ffffff' : '#0194f3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}>
                          📄
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.file_name || 'Tài liệu'}
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
                            background: isStaff ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                            color: isStaff ? '#ffffff' : '#1e293b',
                            padding: '6px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                          title="Tải xuống"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    )}

                    {/* 4. VỊ TRÍ GPS */}
                    {m.message_type === 'location' && (
                      <div style={{ minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '6px' }}>
                          <MapPin size={16} color={isStaff ? '#ffffff' : '#ef4444'} />
                          <span>{m.content || 'Vị trí chia sẻ'}</span>
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
                            background: isStaff ? 'rgba(255,255,255,0.25)' : '#0194f3',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          <span>Mở trên Google Maps</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {/* 5. GHI ÂM (VOICE AUDIO PLAYER) */}
                    {m.message_type === 'audio' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
                        <button
                          onClick={() => togglePlayAudio(m.message_id, m.file_url)}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: isStaff ? '#ffffff' : '#0194f3',
                            color: isStaff ? '#0194f3' : '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          {playingAudioId === m.message_id ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                        </button>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: '700' }}>
                            {playingAudioId === m.message_id ? 'Đang phát...' : 'Tin nhắn thoại'}
                          </div>
                          <div style={{ fontSize: '11px', opacity: 0.8 }}>
                            Thời lượng: {formatSeconds(m.duration || 0)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Giờ gửi & Trạng thái */}
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '4px' }}>
                    <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    {isStaff && (
                      <span>{m.is_read ? '✓✓ Khách đã xem' : '✓ Đã gửi'}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Khách đang soạn tin */}
            {customerTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
                <span>👤 Khách hàng đang soạn tin...</span>
                <span className="typing-dots">•••</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* DÒNG CÂU TRẢ LỜI MẪU NHANH (CANNED RESPONSES) */}
          <div style={{
            padding: '8px 20px',
            background: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', alignSelf: 'center', flexShrink: 0 }}>
              ⚡ Trả lời nhanh:
            </span>
            {quickResponses.map((qr, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qr)}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe'; e.currentTarget.style.borderColor = '#0194f3'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              >
                {qr.slice(0, 30)}...
              </button>
            ))}
          </div>

          {/* HỘP SOẠN THẢO & ĐA PHƯƠNG TIỆN CỦA NHÂN VIÊN */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            flexShrink: 0
          }}>
            {isRecording ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: '#fef2f2',
                borderRadius: '12px',
                border: '1px solid #fecaca'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>
                    Nhân viên đang ghi âm: {formatSeconds(recordingSeconds)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={cancelRecording} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 8px' }}>
                    Hủy
                  </button>
                  <button
                    onClick={finishAndSendRecording}
                    style={{
                      border: 'none',
                      background: '#22c55e',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Send size={14} /> Gửi Voice Note
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Thanh công cụ: Ảnh, File, Vị trí, Micro */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {/* Nút gửi ảnh */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    style={{ border: 'none', background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Gửi hình ảnh"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <input type="file" ref={imageInputRef} accept="image/*" style={{ display: 'none' }} onChange={e => handleFileUpload(e, 'image')} />

                  {/* Nút gửi tài liệu */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: 'none', background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Đính kèm tài liệu"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />

                  {/* Nút gửi vị trí */}
                  <button
                    type="button"
                    onClick={handleSendLocation}
                    style={{ border: 'none', background: '#f1f5f9', color: '#ef4444', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Gửi vị trí văn phòng công ty"
                  >
                    <MapPin size={18} />
                  </button>

                  {/* Nút ghi âm micro */}
                  <button
                    type="button"
                    onClick={startRecording}
                    style={{ border: 'none', background: '#f1f5f9', color: '#0194f3', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Ghi âm trả lời khách hàng"
                  >
                    <Mic size={18} />
                  </button>

                  {isUploading && (
                    <span style={{ fontSize: '11px', color: '#0194f3', fontWeight: '600', marginLeft: 'auto' }}>
                      ⏳ Đang tải file lên...
                    </span>
                  )}
                </div>

                {/* Form Soạn Tin Nhắn Kiểu Messenger */}
                <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Nhập câu trả lời cho khách hàng..."
                    style={{
                      flex: 1,
                      padding: '11px 18px',
                      borderRadius: '24px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = '#0194f3'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    style={{
                      padding: '0 22px',
                      borderRadius: '24px',
                      background: inputText.trim() ? '#0194f3' : '#cbd5e1',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: inputText.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={15} /> Gửi
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
          <h4 style={{ margin: 0, fontSize: '16px', color: '#475569' }}>Chọn một cuộc hội thoại</h4>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Chọn khách hàng ở danh sách bên trái hoặc bấm "Tài khoản" để bắt đầu nhắn tin.</p>
        </div>
      )}

      {/* Lightbox xem ảnh lớn */}
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
    </div>
  );
};

export default StaffLiveChat;
