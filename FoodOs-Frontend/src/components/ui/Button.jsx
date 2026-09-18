import React from 'react';

export const Button = ({type = 'button', children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-input font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variants = {
    primary: "bg-[#E85D04] text-[#FFFDF8] hover:bg-[#C94D03] focus:ring-[#E85D04]/40 shadow-sm",
    secondary: "bg-[#FFF8ED] text-[#17202A] border border-[#E7DED2] hover:bg-[#FFF3E0] focus:ring-[#E85D04]/20",
    outline: "border border-[#E7DED2] bg-[#FFFDF8] hover:bg-[#FFF8ED] text-[#17202A] focus:ring-[#E85D04]/20",
    ghost: "bg-transparent hover:bg-[#FFF8ED] text-[#17202A]",
    danger: "bg-[#D64545] text-[#FFFDF8] hover:bg-[#B83232] focus:ring-[#D64545]/40 shadow-sm",
    success: "bg-[#4F772D] text-[#FFFDF8] hover:bg-[#3B5922] focus:ring-[#4F772D]/40 shadow-sm",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10 p-2",
  };

  return (
    <button 
      type={type}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

