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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#17202A]/40 backdrop-blur-md">
      <div className={`bg-[#FFF8ED]/90 backdrop-blur-xl border border-[#E7DED2]/80 text-[#17202A] shadow-float w-full ${sizeClasses[size]} flex flex-col max-h-[95vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-card animate-slide-up sm:animate-none`}>
        <div className="flex items-center justify-between p-4 border-b border-[#E7DED2] shrink-0">
          <h3 className="text-base sm:text-lg font-display font-bold text-[#17202A] pr-2 truncate">{title}</h3>
          <button onClick={onClose} className="text-[#667085] hover:text-[#17202A] hover:bg-[#FFFDF8] p-1.5 rounded-lg transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-[#17202A]">
          {children}
        </div>

        {footer && (
          <div className="p-4 border-t border-[#E7DED2] bg-[#FFF8ED]/95 rounded-b-card shrink-0 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

