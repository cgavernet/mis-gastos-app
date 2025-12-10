import React, { useEffect, useState } from 'react';
import { Toast as ToastType } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          borderColor: '#38e07b',
          icon: 'check_circle',
          iconColor: '#38e07b',
        };
      case 'error':
        return {
          borderColor: '#ef4444',
          icon: 'error',
          iconColor: '#ef4444',
        };
      case 'info':
        return {
          borderColor: '#389ce0',
          icon: 'info',
          iconColor: '#389ce0',
        };
      default:
        return {
          borderColor: '#389ce0',
          icon: 'info',
          iconColor: '#389ce0',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`flex items-center gap-3 rounded-lg bg-white dark:bg-slate-800 shadow-lg border-l-4 p-4 min-w-[300px] max-w-[400px] transition-all duration-300 ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      style={{ borderLeftColor: styles.borderColor }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{ color: styles.iconColor }}
      >
        <span className="material-symbols-outlined text-2xl">
          {styles.icon}
        </span>
      </div>
      <p className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
        {toast.message}
      </p>
      <button
        onClick={handleClose}
        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>
  );
};

export default Toast;


