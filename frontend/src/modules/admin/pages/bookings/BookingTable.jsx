import React from 'react';
import { PRODUCT_TONES, STATUS_TONES } from './bookingFormat';

/** Shared components for the booking screens: status pill and table shell. */

export const StatusPill = ({ value }) => {
  if (!value) return <span className="text-slate-400">—</span>;
  const tone = STATUS_TONES[String(value).toLowerCase()] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${tone}`}>
      {value}
    </span>
  );
};

export const ProductPill = ({ value }) => (
  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${PRODUCT_TONES[value] || 'bg-slate-100 text-slate-600'}`}>
    {value}
  </span>
);

export const PageShell = ({ title, subtitle, count, toolbar, children }) => (
  <div className="admin-theme p-6">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          {subtitle}
          {typeof count === 'number' ? ` · ${count} record${count === 1 ? '' : 's'}` : ''}
        </p>
      </div>
      {toolbar}
    </div>
    {children}
  </div>
);

export const Table = ({ columns, rows, empty, loading, renderRow }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center">
        <p className="text-[15px] font-semibold text-slate-700">{empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70">
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
};
