import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Car, FileCheck, Wrench } from 'lucide-react';
import { adminService } from '../services/adminService';

/**
 * "What needs me today", at the top of the dashboard.
 *
 * Every row is a count of real records with a page to act on - no vanity
 * metrics. Rows at zero are shown greyed rather than hidden, because "nothing
 * overdue" is information an operator wants; a queue that vanishes when clear
 * teaches you not to trust the panel.
 */

const NeedsAttention = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminService
      .getOperationsAttention()
      .then((response) => {
        if (cancelled) return;
        setData(response?.data?.data || response?.data || null);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (failed) return null;

  const rows = [
    {
      key: 'unassignedBookings',
      label: 'Bookings with no car assigned',
      hint: 'Booked but nobody has said which car goes out',
      icon: Car,
      tone: 'text-rose-600 bg-rose-50',
      path: '/admin/pricing/rental-requests',
    },
    {
      key: 'overdueReturns',
      label: 'Overdue returns',
      hint: 'A car went out and has not come back',
      icon: AlertTriangle,
      tone: 'text-rose-600 bg-rose-50',
      path: '/admin/pricing/rental-requests',
    },
    {
      key: 'staleRequests',
      label: 'Stale requests',
      hint: 'Never actioned and now past their own return date',
      icon: AlertTriangle,
      tone: 'text-amber-600 bg-amber-50',
      path: '/admin/pricing/rental-requests',
    },
    {
      key: 'startingToday',
      label: 'Handovers today',
      hint: 'Customers collecting a car today',
      icon: Clock,
      tone: 'text-indigo-600 bg-indigo-50',
      path: '/admin/pricing/rental-requests',
    },
    {
      key: 'dueBackToday',
      label: 'Due back today',
      hint: 'Cars expected in today',
      icon: Clock,
      tone: 'text-amber-600 bg-amber-50',
      path: '/admin/pricing/rental-requests',
    },
    {
      key: 'pendingCarApplications',
      label: 'Car applications to review',
      hint: 'Owners waiting on a decision',
      icon: FileCheck,
      tone: 'text-violet-600 bg-violet-50',
      path: '/admin/pricing/rental-requests',
    },
    {
      key: 'carsInMaintenance',
      label: 'Cars off the road',
      hint: 'In maintenance and not bookable',
      icon: Wrench,
      tone: 'text-amber-600 bg-amber-50',
      path: '/admin/pricing/rental-fleet',
    },
    {
      key: 'modelsWithNoFleet',
      label: 'Models with no cars registered',
      hint: 'Each is treated as having one car, so a single booking blocks it',
      icon: Car,
      tone: 'text-slate-600 bg-slate-100',
      path: '/admin/pricing/rental-fleet',
    },
  ];

  const loading = !data;
  const totalOpen = data
    ? Number(data.unassignedBookings || 0) + Number(data.overdueReturns || 0)
    : 0;

  return (
    <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Needs attention</h2>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Checking...'
              : totalOpen > 0
                ? `${totalOpen} thing${totalOpen === 1 ? '' : 's'} to act on right now`
                : 'Nothing urgent - both action queues are clear'}
          </p>
        </div>
        {!loading && totalOpen === 0 ? (
          <CheckCircle2 size={26} className="text-emerald-500" />
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ key, label, hint, icon: Icon, tone, path }) => {
          const value = Number(data?.[key] ?? 0);
          const quiet = !loading && value === 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              title={hint}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:shadow-sm ${
                quiet ? 'border-slate-100 bg-slate-50/60' : 'border-slate-200 bg-white'
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${quiet ? 'bg-slate-100 text-slate-400' : tone}`}>
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[22px] font-bold leading-none ${quiet ? 'text-slate-400' : 'text-slate-900'}`}>
                  {loading ? '-' : value}
                </span>
                <span className="mt-1 block text-[12.5px] font-semibold leading-tight text-slate-600">{label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-tight text-slate-400">{hint}</span>
              </span>
              {!quiet && !loading ? <ArrowRight size={15} className="mt-1 shrink-0 text-slate-300" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NeedsAttention;
