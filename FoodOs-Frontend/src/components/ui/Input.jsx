import React from 'react';

export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-input border border-[#E7DED2] bg-[#FFFDF8] px-3 py-2 text-sm text-[#17202A] placeholder:text-[#667085] focus:outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-[#E85D04]/15 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
      {...props}
    />
  );
};

