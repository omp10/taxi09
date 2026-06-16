import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const SavingsBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = location.pathname.startsWith('/taxi/user') ? '/taxi/user' : '';

  return (
    <div className="px-5 mt-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-100/60 p-4 shadow-[0_12px_32px_rgba(16,185,129,0.08)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(240px_160px_at_20%_25%,rgba(255,255,255,0.8),transparent_60%)]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(260px_180px_at_85%_85%,rgba(56,189,248,0.15),transparent_62%)]" aria-hidden="true" />

        <div className="relative z-10 flex min-h-[168px] items-end justify-between gap-4">
          <div className="max-w-[62%]">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-200/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800 border border-emerald-200/50">
              <Sparkles size={12} strokeWidth={2.5} className="text-emerald-600" />
              Savings
            </div>

            <h3 className="mt-3 text-[20px] font-black leading-tight tracking-tight text-slate-900">
              Better savings on your next ride.
            </h3>
            <p className="mt-1.5 text-[11px] font-bold leading-relaxed text-slate-500">Book quickly and save more.</p>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`${routePrefix}/ride/select-category`)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-[12px] font-black text-white shadow-lg shadow-emerald-500/25 active:scale-95 border border-emerald-400"
            >
              Ride Now
              <ArrowRight size={14} strokeWidth={3} />
            </motion.button>
          </div>

          <div className="pointer-events-none w-[140px] shrink-0 opacity-100">
            <img src="/ride_now_banner.png" alt="Promo" className="w-full drop-shadow-[0_8px_16px_rgba(16,185,129,0.15)]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SavingsBanner;
