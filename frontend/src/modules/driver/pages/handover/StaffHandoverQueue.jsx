import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  KeyRound,
  MapPin,
  Package,
  Search,
  Undo2,
} from 'lucide-react';
import { Card, Pill } from './HandoverUI';
import { TODAY_QUEUE } from './handoverConfig';

const TABS = [
  { id: 'delivery', label: 'Deliveries', icon: Package },
  { id: 'return', label: 'Returns', icon: Undo2 },
  { id: 'pending', label: 'Pending', icon: ClipboardCheck },
];

const StaffHandoverQueue = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('delivery');
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TODAY_QUEUE.filter((item) => {
      if (tab === 'pending') {
        if (item.status !== 'pending') return false;
      } else if (item.kind !== tab) {
        return false;
      }
      if (!needle) return true;
      return [item.customer, item.bookingRef, item.registration, item.vehicle]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [query, tab]);

  const counts = useMemo(
    () => ({
      delivery: TODAY_QUEUE.filter((i) => i.kind === 'delivery').length,
      return: TODAY_QUEUE.filter((i) => i.kind === 'return').length,
      pending: TODAY_QUEUE.filter((i) => i.status === 'pending').length,
    }),
    [],
  );

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[#F7F7F8] pb-8 text-black">
      <header className="bg-[var(--primary)] px-4 pb-5 pt-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-[var(--primary)] active:scale-95 transition-transform"
          >
            <ArrowLeft size={16} strokeWidth={2.8} />
          </button>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-black/70">Staff console</p>
            <h1 className="text-[19px] font-extrabold leading-tight">Today&apos;s handovers</h1>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2 rounded-[14px] bg-white px-3 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.10)]">
          <Search size={15} className="shrink-0 text-slate-400" strokeWidth={2.6} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Booking ref, customer or registration"
            className="w-full min-w-0 bg-transparent text-[12.5px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-400"
          />
        </div>
      </header>

      <div className="sticky top-0 z-20 flex gap-2 bg-[#F7F7F8] px-3 py-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[11px] font-extrabold transition-colors ${
                active ? 'bg-black text-white' : 'bg-white text-slate-500 shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
              }`}
            >
              <Icon size={13} />
              {label}
              <span
                className={`rounded-full px-1.5 text-[9px] ${
                  active ? 'bg-[var(--primary)] text-black' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {counts[id]}
              </span>
            </button>
          );
        })}
      </div>

      <main className="space-y-3 px-3">
        {items.map((item) => (
          <Card key={item.id} className="!p-0 overflow-hidden">
            <button
              type="button"
              onClick={() =>
                navigate(`/taxi/driver/handover/${item.id}`, { state: { job: item } })
              }
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-[15px] font-extrabold">{item.customer}</h3>
                    <Pill
                      tone={
                        item.kind === 'return'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-[var(--primary)]/25 text-[#7a5c00]'
                      }
                    >
                      {item.kind}
                    </Pill>
                  </div>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-slate-500">
                    {item.bookingRef} · {item.duration}
                  </p>
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
                  <ChevronRight size={14} strokeWidth={3} />
                </span>
              </div>

              <div className="mt-3 rounded-[14px] bg-[#FAFAFB] p-3">
                <p className="text-[12.5px] font-extrabold">{item.vehicle}</p>
                <p className="text-[10px] font-semibold text-slate-500">{item.registration}</p>

                <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[10px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1">
                    <CalendarClock size={11} className="text-[#c79100]" /> {item.slotTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-[#c79100]" /> Slot {item.slot}
                  </span>
                  <span className="flex items-center gap-1">
                    <KeyRound size={11} className="text-[#c79100]" /> {item.keyNo}
                  </span>
                </div>
              </div>
            </button>
          </Card>
        ))}

        {items.length === 0 ? (
          <Card className="py-12 text-center">
            <ClipboardCheck size={26} className="mx-auto text-slate-300" />
            <p className="mt-2 text-[13px] font-extrabold">Nothing here</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              {query ? 'No handover matches that search.' : 'This queue is clear for today.'}
            </p>
          </Card>
        ) : null}
      </main>
    </div>
  );
};

export default StaffHandoverQueue;
