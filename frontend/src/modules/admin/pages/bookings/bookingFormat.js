/**
 * Formatting and tone maps for the booking screens. Kept apart from the
 * components so BookingTable.jsx exports components only - mixing the two
 * disables fast refresh for the module.
 */

export const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const STATUS_TONES = {
  confirmed: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-emerald-50 text-emerald-700',
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-rose-50 text-rose-700',
  failed: 'bg-rose-50 text-rose-700',
  refunded: 'bg-sky-50 text-sky-700',
};

export const PRODUCT_TONES = {
  Hotel: 'bg-sky-50 text-sky-700',
  Tour: 'bg-emerald-50 text-emerald-700',
  International: 'bg-violet-50 text-violet-700',
  Ride: 'bg-amber-50 text-amber-700',
  Bus: 'bg-orange-50 text-orange-700',
  Rental: 'bg-indigo-50 text-indigo-700',
};

export const inputClass =
  'rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-amber-400';
