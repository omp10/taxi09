import React from 'react';
import { Check } from 'lucide-react';

/** Progress rail across the top of every handover step. */
export const StepRail = ({ steps, currentIndex }) => (
  <div className="flex items-center gap-1 px-1">
    {steps.map((step, index) => {
      const done = index < currentIndex;
      const active = index === currentIndex;
      return (
        <React.Fragment key={step.id}>
          <div className="flex min-w-0 flex-col items-center gap-1">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[9.5px] font-extrabold transition-colors ${
                done
                  ? 'bg-[var(--primary)] text-black'
                  : active
                    ? 'bg-black text-[var(--primary)] ring-4 ring-[var(--primary)]/25'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? <Check size={12} strokeWidth={3.5} /> : index + 1}
            </span>
            <span
              className={`max-w-[46px] truncate text-[7.5px] font-bold uppercase tracking-wide ${
                active ? 'text-black' : 'text-slate-400'
              }`}
            >
              {step.short}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <span className={`mt-[-14px] h-[2px] flex-1 rounded-full ${done ? 'bg-[var(--primary)]' : 'bg-slate-200'}`} />
          ) : null}
        </React.Fragment>
      );
    })}
  </div>
);

/** Material 3 style surface used for every block in the flow. */
export const Card = ({ className = '', children }) => (
  <section className={`rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)] ${className}`}>
    {children}
  </section>
);

export const SectionTitle = ({ title, hint, right }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h2 className="text-[15px] font-extrabold leading-tight text-black">{title}</h2>
      {hint ? <p className="mt-0.5 text-[10.5px] font-medium text-slate-500">{hint}</p> : null}
    </div>
    {right}
  </div>
);

/** Tap-to-toggle row. Used for KYC checks and the accessories kit. */
export const CheckRow = ({ label, hint, checked, required, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex w-full items-start gap-3 rounded-[14px] border px-3 py-2.5 text-left transition-colors ${
      checked ? 'border-[var(--primary)] bg-[#FFFBEB]' : 'border-black/[0.07] bg-white'
    }`}
  >
    <span
      className={`mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${
        checked ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-slate-300 bg-white'
      }`}
    >
      {checked ? <Check size={12} strokeWidth={4} className="text-black" /> : null}
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5">
        <span className="text-[12.5px] font-bold text-black">{label}</span>
        {required ? (
          <span className="rounded-[4px] bg-rose-50 px-1 py-[1px] text-[7.5px] font-extrabold uppercase text-rose-600">
            Required
          </span>
        ) : null}
      </span>
      {hint ? <span className="mt-0.5 block text-[10px] font-medium leading-tight text-slate-500">{hint}</span> : null}
    </span>
  </button>
);

/** Sticky footer action. Disabled until the step's requirements are met. */
export const StickyAction = ({ hint, label, disabled, onClick, secondary }) => (
  <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-black/[0.06] bg-white/85 px-4 pb-6 pt-3 backdrop-blur-xl">
    {hint ? <p className="mb-2 text-center text-[10px] font-semibold text-slate-500">{hint}</p> : null}
    <div className="flex gap-2">
      {secondary}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-1 items-center justify-center gap-2 rounded-[16px] py-3.5 text-[15px] font-extrabold transition-colors ${
          disabled
            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
            : 'bg-[var(--primary)] text-black shadow-[0_8px_20px_rgba(255,193,7,0.4)] active:scale-[0.99]'
        }`}
      >
        {label}
      </button>
    </div>
  </div>
);

export const Pill = ({ tone = 'bg-slate-100 text-slate-600', children }) => (
  <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide ${tone}`}>
    {children}
  </span>
);
