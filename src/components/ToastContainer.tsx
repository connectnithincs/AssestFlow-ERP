import React, { useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const toastStyles: Record<string, { bg: string; border: string; icon: React.ReactNode; bar: string }> = {
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />,
    bar: '#16a34a',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    bar: '#d97706',
  },
  danger: {
    bg: '#fef2f2',
    border: '#fecaca',
    icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    bar: '#dc2626',
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    bar: '#2563eb',
  },
};

const ToastItem: React.FC<{ toast: any; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const style = toastStyles[toast.type] || toastStyles.info;

  return (
    <div
      className="animate-slide-in"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '14px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '3px',
        background: style.bar,
        borderRadius: '14px 0 0 14px',
      }} />

      <div className="flex gap-3 flex-1 min-w-0 pl-1">
        {style.icon}
        <div className="min-w-0">
          <h4 className="font-bold text-gray-900 text-sm leading-tight">{toast.title}</h4>
          <p className="text-gray-600 text-xs leading-relaxed mt-0.5">{toast.message}</p>
        </div>
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg shrink-0"
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppState();
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
};
