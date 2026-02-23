import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className={`bg-white shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[95vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl animate-slide-up sm:animate-none`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 pr-2 truncate">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>

        {footer && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl shrink-0 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
