import React from 'react';

export const Button = ({type = 'button', children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-input font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-marigold text-ink hover:brightness-105 active:brightness-95 focus:ring-marigold/50",
    secondary: "bg-ink text-txt-light hover:brightness-110 focus:ring-ink/40",
    outline: "border border-line-input bg-paper-card hover:bg-paper-2 text-txt-dark",
    ghost: "bg-transparent hover:bg-paper-2 text-txt-dark",
    danger: "bg-danger text-white hover:brightness-105 focus:ring-danger/50",
    success: "bg-success text-white hover:brightness-105 focus:ring-success/50",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
    icon: "h-10 w-10 p-2",
  };

  return (
    <button 
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
