import React from 'react';
import { ArrowLeft } from 'lucide-react';

const ActivityHeader = ({ helperText, onBack }) => {
  return (
    <header className="relative overflow-hidden bg-[var(--primary)] px-4 pb-5 pt-3">
      {/* Decorative skyline + taxi, kept out of the text's way */}
      <img
        src="/city_skyline_footer.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 bottom-0 h-[70px] w-[160px] object-contain opacity-25"
      />
      <img
        src="/taxi09_rental_with_driver.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 bottom-1 h-[52px] w-[100px] object-contain"
      />

      <div className="relative flex items-start gap-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white active:scale-95 transition-transform"
        >
          <ArrowLeft size={15} strokeWidth={2.8} />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800">My bookings</p>
          <h1 className="mt-0.5 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-slate-950">
            Recent activity
          </h1>
          <p className="mt-0.5 max-w-[60%] text-[12px] font-medium leading-tight text-slate-800">{helperText}</p>
        </div>
      </div>
    </header>
  );
};

export default ActivityHeader;
