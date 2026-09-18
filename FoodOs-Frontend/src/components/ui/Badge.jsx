import React from 'react';

export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: "bg-[#FFF8ED] text-[#17202A] border border-[#E7DED2]",
    primary: "bg-[#E85D04]/10 text-[#E85D04] border border-[#E85D04]/20",
    success: "bg-[#4F772D]/10 text-[#4F772D] border border-[#4F772D]/20",
    warning: "bg-[#F4A261]/15 text-[#17202A] border border-[#F4A261]/30",
    danger: "bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20",
    outline: "border border-[#E7DED2] text-[#667085]",
    info: "bg-[#E85D04]/10 text-[#E85D04] border border-[#E85D04]/20",
    secondary: "bg-[#FFF8ED] text-[#667085] border border-[#E7DED2]",
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

