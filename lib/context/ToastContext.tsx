"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div 
        aria-live="polite"
        className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-[90vw] sm:max-w-md pointer-events-none"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md transition-all transform translate-y-0 duration-300 animate-fadeIn ${
                isSuccess
                  ? 'bg-primary text-surface border-tertiary/40'
                  : isError
                  ? 'bg-[#2A0E0E] text-[#FFB4AB] border-[#FF5449]/40'
                  : isWarning
                  ? 'bg-[#3A2B0E] text-[#FFDCA8] border-[#B99A62]/50'
                  : 'bg-surface text-on-surface border-outline-variant/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-lg sm:text-xl">
                  {isSuccess ? 'check_circle' : isError ? 'error' : isWarning ? 'warning' : 'info'}
                </span>
                <p className="text-xs sm:text-sm font-medium leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-1 transition-opacity text-current"
                aria-label="Close notification"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
