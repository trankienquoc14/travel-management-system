import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bot, Send, X, RotateCcw, Sparkles, Compass, Calendar, DollarSign, ShieldAlert, ArrowRight, ChevronDown } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/chat';

const CustomerAIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('travel_ai_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Lọc bỏ tin nhắn cũ có nhắc tới CSDL hoặc welcome-msg
          return parsed.filter(m => m.id !== 'welcome-msg' && !m.text?.includes('Cơ sở dữ liệu'));
        }
      } catch (e) {}
    }
    return [];
  });

  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Lưu lịch sử chat tạm vào sessionStorage
  useEffect(() => {
    sessionStorage.setItem('travel_ai_chat_messages', JSON.stringify(messages));
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleReset = () => {
    setMessages([]);
    sessionStorage.removeItem('travel_ai_chat_messages');
  };

  const handleSendMessage = async (textToSend) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q) return;

    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/ai/ask`, {
        question: q,
        conversationHistory: messages.slice(-6)
      });

      if (res.data.success && res.data.data) {
        const aiMsg = {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: res.data.data.reply,
          suggestions: res.data.data.suggestions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('Không nhận được câu trả lời');
      }
    } catch (error) {
      console.error('Lỗi hỏi AI:', error);
      const errMsg = {
        id: 'ai-err-' + Date.now(),
        sender: 'ai',
        text: 'Dạ xin lỗi Quý khách, kết nối tới máy chủ AI đang bận một chút. Quý khách vui lòng thử lại hoặc bấm vào nút **Message tròn màu xanh** ngay bên dưới để gặp nhân viên hỗ trợ trực tiếp nhé!',
        suggestions: ['Thử lại', 'Tour Phú Quốc', 'Chính sách hoàn tiền'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Hàm render Markdown đơn giản (in đậm, link, bullet point, tiêu đề)
  const renderFormattedText = (content) => {
    if (!content) return null;

    const lines = content.split('\n');

    return (
      <div style={{ lineHeight: '1.6', fontSize: '13.5px' }}>
        {lines.map((line, idx) => {
          // Tiêu đề ###
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} style={{ margin: '10px 0 4px', fontSize: '14.5px', color: '#1e293b', fontWeight: '800' }}>
                {renderInlineMarkdown(line.replace('### ', ''))}
              </h4>
            );
          }
          // Dòng gạch đầu dòng • hoặc -
          if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
              <div key={idx} style={{ display: 'flex', gap: '6px', margin: '3px 0', paddingLeft: '4px' }}>
                <span style={{ color: '#0284c7', fontWeight: '800' }}>•</span>
                <span style={{ flex: 1 }}>{renderInlineMarkdown(line.replace(/^[•-]\s*/, ''))}</span>
              </div>
            );
          }
          // Dòng rỗng
          if (!line.trim()) {
            return <div key={idx} style={{ height: '6px' }} />;
          }

          return (
            <p key={idx} style={{ margin: '3px 0' }}>
              {renderInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Render in đậm **text**, link [text](url), code `text`
  const renderInlineMarkdown = (text) => {
    // Tách link dạng [Text](/url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push({ type: 'text', content: text.substring(lastIdx, match.index) });
      }
      parts.push({ type: 'link', label: match[1], url: match[2] });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIdx) });
    }

    return parts.map((part, i) => {
      if (part.type === 'link') {
        return (
          <span
            key={i}
            onClick={() => {
              if (part.url.startsWith('/')) {
                navigate(part.url);
              } else {
                window.open(part.url, '_blank');
              }
            }}
            style={{
              color: '#0284c7',
              fontWeight: '700',
              textDecoration: 'underline',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}
            title="Bấm để xem chi tiết"
          >
            {renderBoldAndCode(part.label)}
          </span>
        );
      }
      return <span key={i}>{renderBoldAndCode(part.content)}</span>;
    });
  };

  const renderBoldAndCode = (str) => {
    // Render in đậm **bold**
    const boldParts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return boldParts.map((b, j) => {
      if (b.startsWith('**') && b.endsWith('**')) {
        return <strong key={j} style={{ color: '#0f172a', fontWeight: '700' }}>{b.slice(2, -2)}</strong>;
      }
      if (b.startsWith('`') && b.endsWith('`')) {
        return (
          <code key={j} style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#0369a1', fontFamily: 'monospace', fontSize: '12px' }}>
            {b.slice(1, -1)}
          </code>
        );
      }
      return b;
    });
  };

  return (
    <>
      {/* 1. NÚT ROBOT CHAT AI NỔI - ĐẶT NGAY PHÍA TRÊN NÚT MESSAGE */}
      {!isOpen && (
        <div style={{ position: 'fixed', bottom: '104px', right: '28px', zIndex: 99998 }}>
          <button
            onClick={handleOpen}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              border: 'none',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.45), 0 0 0 3px rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.6), 0 0 0 4px rgba(255, 255, 255, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.45), 0 0 0 3px rgba(255, 255, 255, 0.3)';
            }}
            title="Trợ lý du lịch AI"
          >
            <Bot size={30} style={{ animation: 'bounce 2s infinite' }} />
            <span style={{
              fontSize: '10px',
              fontWeight: '900',
              letterSpacing: '0.5px',
              marginTop: '1px',
              textTransform: 'uppercase'
            }}>
              AI BOT
            </span>

            {/* Sparkle badge */}
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#fbbf24',
              color: '#78350f',
              fontSize: '10px',
              fontWeight: '900',
              padding: '2px 5px',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              border: '1.5px solid #fff'
            }}>
              AI
            </span>
          </button>
        </div>
      )}

      {/* 2. CỬA SỔ CHAT ROBOT AI */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '410px',
          maxWidth: 'calc(100vw - 32px)',
          height: '620px',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.15)',
          zIndex: 100000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideIn 0.25s ease-out'
        }}>
          {/* HEADER */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                🤖
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800', letterSpacing: '-0.2px', color: '#ffffff' }}>
                  Trợ lý du lịch AI
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleReset}
                title="Làm mới cuộc trò chuyện"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleClose}
                title="Đóng cửa sổ"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* VÙNG DANH SÁCH TIN NHẮN */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.length === 0 && (
              <div style={{
                margin: 'auto 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '24px 16px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
                  marginBottom: '12px'
                }}>
                  🤖
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                  Trợ lý du lịch AI
                </h4>
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', maxWidth: '300px', lineHeight: '1.5' }}>
                  Xin chào! Em có thể giúp Quý khách tìm kiếm tour, lịch trình, giá vé hoặc dịch vụ thuê xe.
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                  maxWidth: '340px'
                }}>
                  {[
                    'Tour Phú Quốc giá bao nhiêu?',
                    'Có những tour Đà Lạt nào?',
                    'Lịch khởi hành tour sắp tới',
                    'Bảng giá và các dòng xe du lịch',
                    'Chính sách giá vé trẻ em'
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(sug)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#334155',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'all 0.18s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.color = '#4f46e5';
                        e.currentTarget.style.background = '#eef2ff';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#334155';
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Sparkles size={12} color="#6366f1" />
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAi ? 'flex-start' : 'flex-end',
                    maxWidth: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '88%' }}>
                    {isAi && (
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        flexShrink: 0,
                        color: '#fff',
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                      }}>
                        🤖
                      </div>
                    )}
                    <div style={{
                      backgroundColor: isAi ? '#ffffff' : '#4f46e5',
                      color: isAi ? '#1e293b' : '#ffffff',
                      padding: '12px 16px',
                      borderRadius: isAi ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
                      boxShadow: isAi ? '0 3px 12px rgba(0,0,0,0.05), 0 0 0 1px #e2e8f0' : '0 4px 14px rgba(79, 70, 229, 0.35)',
                      wordBreak: 'break-word'
                    }}>
                      {isAi ? renderFormattedText(m.text) : <span style={{ fontSize: '13.5px', lineHeight: '1.5' }}>{m.text}</span>}
                      
                      <div style={{
                        fontSize: '10.5px',
                        marginTop: '6px',
                        textAlign: 'right',
                        opacity: 0.65,
                        color: isAi ? '#64748b' : '#c7d2fe'
                      }}>
                        {m.timestamp}
                      </div>
                    </div>
                  </div>

                  {/* CÁC GỢI Ý CÂU HỎI (SUGGESTIONS CHIPS) NẾU LÀ TIN AI */}
                  {isAi && m.suggestions && m.suggestions.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '8px',
                      marginLeft: '38px',
                      maxWidth: '90%'
                    }}>
                      {m.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '16px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            color: '#334155',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.18s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#6366f1';
                            e.currentTarget.style.color = '#4f46e5';
                            e.currentTarget.style.background = '#eef2ff';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.color = '#334155';
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <Sparkles size={11} color="#6366f1" />
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* TYPING INDICATOR */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  color: '#fff'
                }}>
                  🤖
                </div>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px 18px 18px 18px',
                  padding: '10px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#6366f1', animation: 'bounce 1s infinite 0.1s' }}></div>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#8b5cf6', animation: 'bounce 1s infinite 0.25s' }}></div>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ec4899', animation: 'bounce 1s infinite 0.4s' }}></div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', marginLeft: '4px' }}>AI đang tra cứu CSDL...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* KHUNG SOẠN TIN NHẮN */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f1f5f9'
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '4px 6px 4px 14px',
                border: '1.5px solid #e2e8f0',
                transition: 'border 0.2s'
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                placeholder="Hỏi về tour du lịch, giá vé, lịch trình, thuê xe..."
                disabled={isTyping}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '13.5px',
                  color: '#1e293b'
                }}
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim() || isTyping}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: inputQuestion.trim() && !isTyping ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#e2e8f0',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputQuestion.trim() && !isTyping ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  boxShadow: inputQuestion.trim() && !isTyping ? '0 3px 8px rgba(79, 70, 229, 0.35)' : 'none'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerAIChatWidget;
