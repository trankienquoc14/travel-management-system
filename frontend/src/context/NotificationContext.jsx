import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Bell, Info, X } from 'lucide-react';
import soundService from '../utils/soundService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'success', title, message, actionUrl, duration = 5000 }) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Phát âm thanh tương ứng
    if (type === 'success') {
      soundService.playSuccessChime();
    } else if (type === 'error') {
      soundService.playErrorChime();
    } else {
      soundService.playNotificationBell();
    }

    const newToast = {
      id,
      type,
      title: title || (type === 'success' ? 'Thành công!' : type === 'error' ? 'Thất bại!' : 'Thông báo mới'),
      message: message || '',
      timeStr,
      actionUrl
    };

    setToasts(prev => [newToast, ...prev].slice(0, 5)); // Tối đa 5 toast cùng lúc

    // Tự động đóng sau duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Lắng nghe sự kiện toàn cục 'app-notify'
  useEffect(() => {
    const handleGlobalNotify = (e) => {
      if (e.detail) {
        addToast(e.detail);
      }
    };

    window.addEventListener('app-notify', handleGlobalNotify);
    return () => window.removeEventListener('app-notify', handleGlobalNotify);
  }, [addToast]);

  return (
    <NotificationContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Floating Realtime Toasts Container */}
      <div style={toastContainerStyle}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            style={{
              ...toastCardStyle,
              borderLeft: `5px solid ${getBorderColor(toast.type)}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)'
            }}
            onClick={() => {
              if (toast.actionUrl) {
                if (toast.actionUrl.startsWith('/')) {
                  window.location.href = toast.actionUrl;
                } else {
                  window.location.hash = toast.actionUrl;
                }
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {toast.type === 'success' && <CheckCircle2 size={22} color="#16a34a" />}
                {toast.type === 'error' && <AlertTriangle size={22} color="#dc2626" />}
                {(toast.type === 'notification' || toast.type === 'info') && <Bell size={22} color="#0284c7" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: '800' }}>
                    {toast.title}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginLeft: '8px' }}>
                    {toast.timeStr}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.45', wordBreak: 'break-word' }}>
                  {toast.message}
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                style={closeBtnStyle}
                title="Đóng thông báo"
              >
                <X size={15} color="#94a3b8" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Fallback nếu gọi ngoài provider: dispatch qua window event
    return {
      addToast: (detail) => notify(detail),
      removeToast: () => {}
    };
  }
  return context;
};

// Global helper functions
export const notify = ({ type = 'success', title, message, actionUrl, duration = 5000 }) => {
  window.dispatchEvent(new CustomEvent('app-notify', {
    detail: { type, title, message, actionUrl, duration }
  }));
};

export const notifySuccess = (title, message, actionUrl) => {
  notify({ type: 'success', title: title || 'Thành công!', message, actionUrl });
};

export const notifyError = (title, message) => {
  notify({ type: 'error', title: title || 'Thao tác thất bại!', message });
};

export const notifyBell = (title, message, actionUrl) => {
  notify({ type: 'notification', title: title || 'Thông báo mới', message, actionUrl });
};

const getBorderColor = (type) => {
  if (type === 'success') return '#16a34a';
  if (type === 'error') return '#dc2626';
  return '#0284c7';
};

const toastContainerStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  zIndex: 99999,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  maxWidth: '400px',
  width: 'calc(100vw - 40px)',
  pointerEvents: 'none'
};

const toastCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '14px 16px',
  pointerEvents: 'auto',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, opacity 0.2s ease',
  animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  marginLeft: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
