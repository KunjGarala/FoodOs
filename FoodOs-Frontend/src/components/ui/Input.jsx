import React from 'react';

export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-input border border-line-input bg-paper-2 px-3 py-2 text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/50 focus:border-marigold disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
      {...props}
    />
  );
};
