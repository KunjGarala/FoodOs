import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/* ────────────────────────────────────────────────────────────────────────
 * FoodOS Premium Design Kit — Glass surfaces on Warm Ivory (#FFFDF8)
 * with Soft Cream (#FFF8ED), Dark Navy (#17202A), and Primary Orange (#E85D04)
 * ──────────────────────────────────────────────────────────────────────── */

/** Operational dark surface (Floor / Kitchen / POS).
 *  Breaks out of MainLayout's padded <main> using Dark Navy (#17202A). */
export const DarkScreen = ({ className, children }) => (
  <div
    className={cn(
      '-mx-4 -mt-4 -mb-20 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 lg:-mb-8',
      'bg-[#17202A] text-[#FFFDF8] min-h-screen',
      className,
    )}
  >
    {children}
  </div>
);

/** Light management page header: title + subtitle (left), actions (right). */
export const PageHeader = ({ eyebrow, title, subtitle, actions, className }) => (
  <header className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow text-[11px] text-[#667085] mb-1">{eyebrow}</p>}
      <h1 className="font-display font-bold text-[22px] sm:text-[23px] tracking-[-0.01em] text-[#17202A] truncate">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-[#667085] mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

/** Delta pill (▲ green / ▼ red). `value` is a signed number (percent). */
export const DeltaPill = ({ value }) => {
  const v = Number(value || 0);
  const up = v >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold font-mono border',
        up ? 'bg-[#4F772D]/10 text-[#4F772D] border-[#4F772D]/20' : 'bg-[#D64545]/10 text-[#D64545] border-[#D64545]/20',
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(v)}%
    </span>
  );
};

/** KPI card. tone "light" (cream glass surface) or "ink" (dark navy accent). */
export const Kpi = ({ label, value, delta, sub, tone = 'light', className }) => {
  const ink = tone === 'ink';
  return (
    <div
      className={cn(
        'rounded-card p-4 sm:p-5 border shadow-sm backdrop-blur-md transition-all hover:shadow-md',
        ink ? 'bg-[#17202A] text-[#FFFDF8] border-[#273645]' : 'bg-[#FFF8ED]/85 border-[#E7DED2] text-[#17202A]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('eyebrow text-[10px]', ink ? 'text-[#667085]' : 'text-[#667085]')}>{label}</p>
        {delta !== undefined && delta !== null && <DeltaPill value={delta} />}
      </div>
      <p className={cn('font-display font-bold text-[26px] sm:text-[30px] tracking-[-0.02em] mt-2 leading-none', ink ? 'text-[#FFFDF8]' : 'text-[#17202A]')}>
        {value}
      </p>
      {sub && <p className={cn('text-xs mt-2 truncate', ink ? 'text-[#667085]' : 'text-[#667085]')}>{sub}</p>}
    </div>
  );
};

/** Soft cream glass card surface. */
export const Panel = ({ className, children, ...props }) => (
  <div className={cn('bg-[#FFF8ED]/85 backdrop-blur-md border border-[#E7DED2] rounded-card shadow-sm', className)} {...props}>
    {children}
  </div>
);

/** Status pill. */
const PILL_TONES = {
  neutral: 'bg-[#FFF8ED] text-[#667085] border border-[#E7DED2]',
  marigold: 'bg-[#E85D04]/10 text-[#E85D04] border border-[#E85D04]/20',
  success: 'bg-[#4F772D]/10 text-[#4F772D] border border-[#4F772D]/20',
  danger: 'bg-[#D64545]/10 text-[#D64545] border border-[#D64545]/20',
  gold: 'bg-[#F4A261]/15 text-[#17202A] border border-[#F4A261]/30',
  inkLive: 'bg-[#4F772D]/15 text-[#4F772D] border border-[#4F772D]/30',
};
export const Pill = ({ tone = 'neutral', className, children }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', PILL_TONES[tone] || PILL_TONES.neutral, className)}>
    {children}
  </span>
);

/** "Live" pill with pulsing dot. */
export const LivePill = ({ dark = false }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold font-mono uppercase tracking-wider border',
    dark ? 'bg-[#4F772D]/20 text-[#4F772D] border-[#4F772D]/30' : 'bg-[#4F772D]/10 text-[#4F772D] border-[#4F772D]/20')}>
    <span className="h-1.5 w-1.5 rounded-full bg-[#4F772D] animate-pulse" /> Live
  </span>
);

/** Toggle switch (controlled). */
export const Toggle = ({ checked, onChange, disabled, size = 'md' }) => {
  const sm = size === 'sm';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors shrink-0 disabled:opacity-50',
        sm ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-[#4F772D]' : 'bg-[#E7DED2]',
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-[#FFFDF8] shadow-sm transition-transform',
          sm ? 'h-4 w-4' : 'h-5 w-5',
          checked ? (sm ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5',
        )}
      />
    </button>
  );
};

/** Segmented control. options: [{value,label}] */
export const Segmented = ({ options, value, onChange, className, dark = false }) => (
  <div className={cn('inline-flex p-1 rounded-input', dark ? 'bg-[#17202A] border border-[#273645]' : 'bg-[#FFF8ED] border border-[#E7DED2]', className)}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange?.(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-[9px] text-sm font-medium transition-all',
            active
              ? 'bg-[#E85D04] text-[#FFFDF8] shadow-xs'
              : dark ? 'text-[#667085] hover:text-[#FFFDF8]' : 'text-[#667085] hover:text-[#17202A]',
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

/** Bottom sheet / side drawer (no portal; fixed overlay). */
export const Sheet = ({ open, onClose, side = 'bottom', className, children }) => {
  if (!open) return null;
  const isBottom = side === 'bottom';
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#17202A]/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute bg-[#FFF8ED]/90 backdrop-blur-xl border border-[#E7DED2] shadow-float',
          isBottom
            ? 'bottom-0 inset-x-0 rounded-t-card max-h-[85vh] overflow-y-auto animate-slide-up'
            : 'top-0 right-0 h-full w-[88%] max-w-sm overflow-y-auto animate-slide-in',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

/** Primary / ghost button in FoodOS redesign styling. */
export const BtnPrimary = ({ className, children, ...props }) => (
  <button
    className={cn('inline-flex items-center justify-center gap-2 h-10 px-4 rounded-input bg-[#E85D04] text-[#FFFDF8] font-semibold text-sm hover:bg-[#C94D03] active:scale-[0.98] transition shadow-xs disabled:opacity-50', className)}
    {...props}
  >
    {children}
  </button>
);
export const BtnGhost = ({ className, children, ...props }) => (
  <button
    className={cn('inline-flex items-center justify-center gap-2 h-10 px-4 rounded-input border border-[#E7DED2] bg-[#FFF8ED] text-[#17202A] font-medium text-sm hover:bg-[#FFF3E0] transition disabled:opacity-50', className)}
    {...props}
  >
    {children}
  </button>
);

