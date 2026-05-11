import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-500 animate-[fadeInRight_0.3s_ease-out]
              ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/50 text-white shadow-emerald-500/20' : ''}
              ${toast.type === 'error' ? 'bg-rose-500/90 border-rose-400/50 text-white shadow-rose-500/20' : ''}
              ${toast.type === 'info' ? 'bg-blue-500/90 border-blue-400/50 text-white shadow-blue-500/20' : ''}
            `}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <i className={`fas ${
                toast.type === 'success' ? 'fa-check' : 
                toast.type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle'
              } text-[12px]`}></i>
            </div>
            <p className="text-sm font-bold m-0 tracking-tight">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
