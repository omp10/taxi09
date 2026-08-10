import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BusFront, Car, Package, Route as RouteIcon } from 'lucide-react';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';
import Activity from '../Activity';

/**
 * Bookings on desktop.
 *
 * The phone screen already merges rides, rentals, buses and pooling behind one
 * set of tabs with its own paging, so it is embedded here rather than rebuilt -
 * a second copy of that logic would be the thing that drifts. What changes is
 * the chrome: the site header instead of the phone's bottom tab bar, and a
 * readable column instead of a 512px strip in the middle of a wide window.
 */

const SHORTCUTS = [
  { icon: Car, label: 'Book a car', path: '/taxi/user/rental' },
  { icon: BusFront, label: 'Book a bus', path: '/taxi/user/bus' },
  { icon: RouteIcon, label: 'Tour packages', path: '/taxi/user/tours' },
  { icon: Package, label: 'Send a parcel', path: '/taxi/user/parcel/type' },
];

const DesktopActivity = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDesktopTheme();

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/activity" theme={theme} onToggleTheme={toggleTheme} />

      <div className="mx-auto max-w-[1440px] px-8 pb-16 pt-5 xl:px-12">
        <h1 className="text-[24px] font-black text-slate-900">My Bookings</h1>
        <p className="text-[12.5px] text-slate-500">Rides, rentals, buses and parcels in one place.</p>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <Activity embedded />
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="text-[14.5px] font-black text-slate-900">Book something new</h2>
              <div className="mt-3 space-y-1">
                {SHORTCUTS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                      <item.icon size={15} className="text-amber-600" />
                    </span>
                    <span className="text-[13px] font-bold text-slate-800">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="text-[14.5px] font-black text-slate-900">Need help?</h2>
              <p className="mt-1 text-[12px] text-slate-500">
                Something wrong with a booking? Start a chat and we will pick it up.
              </p>
              <button
                onClick={() => navigate('/taxi/user/support')}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-[12.5px] font-black text-white"
              >
                Get support
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DesktopActivity;
