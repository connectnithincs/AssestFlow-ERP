import React, { useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppState();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: any; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto close after 5s
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />
  };

  const borders = {
    success: 'border-l-4 border-l-[#167C65]',
    warning: 'border-l-4 border-l-[#F59E0B]',
    danger: 'border-l-4 border-l-[#DC2626]',
    info: 'border-l-4 border-l-[#2563EB]'
  };

  return (
    <div 
      className={`bg-white shadow-lg rounded-xl border border-gray-150 p-4 flex items-start justify-between gap-3 animate-slide-in ${borders[toast.type as 'success'|'warning'|'danger'|'info'] || ''}`}
    >
      <div className="flex gap-3">
        {icons[toast.type as 'success'|'warning'|'danger'|'info'] || <Info className="w-5 h-5 text-gray-500" />}
        <div>
          <h4 className="font-semibold text-gray-900 text-sm leading-none mb-1">{toast.title}</h4>
          <p className="text-gray-600 text-xs leading-normal">{toast.message}</p>
        </div>
      </div>
      <button 
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg hover:bg-gray-100 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
