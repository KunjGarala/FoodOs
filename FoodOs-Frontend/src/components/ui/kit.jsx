import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/* ────────────────────────────────────────────────────────────────────────
 * Redesign UI kit — marigold/gold on navy ink.
 * Shared primitives for the re-skinned screens. Legacy components in
 * Card.jsx / Button.jsx / Badge.jsx are left intact for not-yet-reskinned pages.
 * ──────────────────────────────────────────────────────────────────────── */

/** Full-bleed dark operational surface (Floor / Kitchen / POS).
 *  Breaks out of MainLayout's padded <main>. */
export const DarkScreen = ({ className, children }) => (
  <div
    className={cn(
      '-mx-4 -mt-4 -mb-20 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 lg:-mb-8',
      'bg-ink text-txt-light min-h-screen',
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
      {eyebrow && <p className="eyebrow text-[11px] text-txt-faint mb-1">{eyebrow}</p>}
      <h1 className="font-display font-bold text-[22px] sm:text-[23px] tracking-[-0.01em] text-ink-text truncate">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-txt-muted mt-0.5">{subtitle}</p>}
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
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold font-mono',
        up ? 'bg-success/[0.12] text-success-deep' : 'bg-danger/[0.14] text-danger-deep',
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(v)}%
    </span>
  );
};

/** KPI card. tone "light" (paper-card) or "ink" (dark accent). */
export const Kpi = ({ label, value, delta, sub, tone = 'light', className }) => {
  const ink = tone === 'ink';
  return (
    <div
      className={cn(
        'rounded-card p-4 sm:p-5 border',
        ink ? 'bg-ink text-txt-light border-ink-line' : 'bg-paper-card border-line-light',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('eyebrow text-[10px]', ink ? 'text-txt-faintDark' : 'text-txt-faint')}>{label}</p>
        {delta !== undefined && delta !== null && <DeltaPill value={delta} />}
      </div>
      <p className={cn('font-display font-bold text-[26px] sm:text-[30px] tracking-[-0.02em] mt-2 leading-none', ink ? 'text-white' : 'text-ink-text')}>
        {value}
      </p>
      {sub && <p className={cn('text-xs mt-2 truncate', ink ? 'text-txt-mutedDark' : 'text-txt-muted')}>{sub}</p>}
    </div>
  );
};

/** Light card surface. */
export const Panel = ({ className, children, ...props }) => (
  <div className={cn('bg-paper-card border border-line-light rounded-card', className)} {...props}>
    {children}
  </div>
);

/** Status pill. */
const PILL_TONES = {
  neutral: 'bg-paper-3 text-txt-muted',
  marigold: 'bg-marigold/15 text-[#9a6500]',
  success: 'bg-success/[0.12] text-success-deep',
  danger: 'bg-danger/[0.14] text-danger-deep',
  gold: 'bg-gold/25 text-[#7a5e1d]',
  inkLive: 'bg-success/[0.16] text-success-bright',
};
export const Pill = ({ tone = 'neutral', className, children }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', PILL_TONES[tone] || PILL_TONES.neutral, className)}>
    {children}
  </span>
);

/** "Live" pill with pulsing dot. */
export const LivePill = ({ dark = false }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold font-mono uppercase tracking-wider',
    dark ? 'bg-success/[0.16] text-success-bright' : 'bg-success/[0.12] text-success-deep')}>
    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
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
        checked ? 'bg-success' : 'bg-line-input',
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white shadow transition-transform',
          sm ? 'h-4 w-4' : 'h-5 w-5',
          checked ? (sm ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5',
        )}
      />
    </button>
  );
};

/** Segmented control. options: [{value,label}] */
export const Segmented = ({ options, value, onChange, className, dark = false }) => (
  <div className={cn('inline-flex p-0.5 rounded-input', dark ? 'bg-ink-card' : 'bg-paper-2 border border-line-light', className)}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange?.(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-[9px] text-sm font-medium transition-colors',
            active
              ? 'bg-marigold text-ink'
              : dark ? 'text-txt-mutedDark hover:text-txt-light' : 'text-txt-muted hover:text-ink-text',
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
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div
        className={cn(
          'absolute bg-paper-card shadow-float',
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

/** Primary / ghost button in redesign styling. */
export const BtnPrimary = ({ className, children, ...props }) => (
  <button
    className={cn('inline-flex items-center justify-center gap-2 h-10 px-4 rounded-input bg-marigold text-ink font-semibold text-sm hover:brightness-105 active:brightness-95 transition disabled:opacity-50', className)}
    {...props}
  >
    {children}
  </button>
);
export const BtnGhost = ({ className, children, ...props }) => (
  <button
    className={cn('inline-flex items-center justify-center gap-2 h-10 px-4 rounded-input border border-line-input bg-paper-card text-txt-dark font-medium text-sm hover:bg-paper-2 transition disabled:opacity-50', className)}
    {...props}
  >
    {children}
  </button>
);
