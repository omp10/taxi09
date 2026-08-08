import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Moon, Sun, UserRound } from 'lucide-react';
import { NAV_LINKS, QUICK_RAIL, openRentalVehicle, readUserToken } from './desktopShared';

/**
 * Chrome shared by the desktop landing pages (home, self drive).
 *
 * These pieces are identical across those screens, so they live here rather
 * than being copied per page - the nav in particular has to stay consistent.
 */

export const DesktopNav = ({ activePath, theme, onToggleTheme }) => {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(readUserToken());

  return (
    <header className="sticky top-0 z-50 bg-[var(--dh-surface)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[84px] max-w-[1440px] items-center gap-8 px-8 xl:px-12">
        <button onClick={() => navigate('/taxi/user')} className="flex shrink-0 flex-col leading-none">
          <svg viewBox="0 0 120 22" className="mb-0.5 h-[13px] w-[86px]" aria-hidden="true">
            <path d="M4 20C22 4 74 -2 116 8" fill="none" stroke="#F5B700" strokeWidth="5" strokeLinecap="round" />
          </svg>
          <span className="text-[30px] font-black italic tracking-[-0.05em] text-[var(--dh-text)]">
            Taxi<span className="text-[#F5B700]">09</span>
          </span>
          <span className="mt-0.5 text-[9px] font-semibold tracking-[0.08em] text-[var(--dh-muted)]">
            Self Drive | With Driver
          </span>
        </button>

        <nav className="flex flex-1 items-center justify-center gap-6">
          {NAV_LINKS.map(({ label, path, badge }) => {
            const isActive = path === activePath;
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap text-[14.5px] transition-colors ${
                  isActive
                    ? 'font-bold text-[var(--dh-text)]'
                    : 'font-medium text-[var(--dh-muted)] hover:text-[var(--dh-text)]'
                }`}
              >
                {label}
                {badge && (
                  <span className="rounded-full bg-[#F5B700] px-1.5 py-[1px] text-[8.5px] font-black text-slate-950">
                    {badge}
                  </span>
                )}
                {isActive && <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-[#F5B700]" />}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <button
            onClick={onToggleTheme}
            className="flex h-[38px] w-[74px] items-center justify-between rounded-full bg-[var(--dh-chip)] px-2.5"
            aria-label="Toggle theme"
            aria-pressed={theme === 'dark'}
          >
            <Sun size={17} className={theme === 'light' ? 'text-[#F5B700]' : 'text-[var(--dh-muted)]'} strokeWidth={2.4} />
            <Moon size={17} className={theme === 'dark' ? 'text-[#F5B700]' : 'text-[var(--dh-muted)]'} strokeWidth={2.4} />
          </button>

          <button
            onClick={() => navigate(isAuthenticated ? '/taxi/user/profile' : '/taxi/user/login')}
            className="flex h-[50px] items-center gap-2 rounded-[14px] bg-[#F5B700] px-6 text-[15px] font-bold text-slate-950 shadow-[0_8px_20px_rgba(245,183,0,0.32)] transition-transform hover:-translate-y-0.5"
          >
            <UserRound size={18} strokeWidth={2.6} />
            {isAuthenticated ? 'My Account' : 'Login / Sign Up'}
          </button>
        </div>
      </div>
    </header>
  );
};

export const QuickRail = () => {
  const navigate = useNavigate();

  return (
    <div className="absolute -right-1 top-1/2 w-[104px] -translate-y-1/2 rounded-[20px] bg-[var(--dh-surface)] py-4 shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
      {QUICK_RAIL.map(({ icon: Icon, label, path }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          className="flex w-full flex-col items-center gap-1.5 px-2 py-2.5 transition-colors hover:bg-[var(--dh-chip)]"
        >
          <Icon size={22} className="text-[#F5B700]" strokeWidth={2.2} />
          <span className="text-center text-[10.5px] font-bold leading-tight text-[var(--dh-text)]">{label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Live vehicle panel. Driven by the real rental catalogue - these are cars
 * that are actually listed, not invented "recently booked" rows.
 */
export const LiveFleetPanel = ({ fleet, className = '' }) => {
  const navigate = useNavigate();
  if (!fleet.length) return null;

  return (
    <div className={`w-[230px] rounded-[18px] bg-[var(--dh-surface)] p-4 shadow-[0_18px_44px_rgba(15,23,42,0.16)] ${className}`}>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="text-[14px] font-black text-[var(--dh-text)]">Live Booking</span>
      </div>
      <p className="mt-1 text-[12.5px] font-semibold text-[var(--dh-muted)]">Available now</p>

      <div className="mt-3 space-y-2">
        {fleet.map((vehicle) => (
          <button
            key={vehicle.id || vehicle._id}
            onClick={() => openRentalVehicle(navigate, vehicle)}
            className="flex w-full items-center gap-2.5 rounded-[12px] border border-[var(--dh-border)] p-2 text-left"
          >
            <img
              src={vehicle.image || vehicle.coverImage || '/taxi09_rental_self_drive.png'}
              alt=""
              className="h-9 w-12 shrink-0 rounded-[6px] object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-black text-[var(--dh-text)]">{vehicle.name}</span>
              <span className="block truncate text-[11px] font-semibold text-[var(--dh-muted)]">
                {vehicle.vehicleCategory || 'Car'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ServiceCard = ({ title, copy, image, path, badge, highlighted }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className={`group relative flex flex-col overflow-hidden rounded-[18px] p-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition-transform hover:-translate-y-1 ${
        highlighted
          ? 'bg-[#FFFCF2] ring-2 ring-[#F5B700]'
          : 'bg-[var(--dh-surface)] ring-1 ring-[var(--dh-border)]'
      }`}
    >
      {badge && (
        <span className="absolute left-0 top-0 rounded-br-[12px] bg-[#F5B700] px-2.5 py-1 text-[10.5px] font-black text-slate-950">
          {badge}
        </span>
      )}
      <img src={image} alt="" className="h-[92px] w-full object-contain" />
      <span className="mt-2.5 block text-[15px] font-black tracking-[-0.02em] text-[var(--dh-text)]">{title}</span>
      <span className="mt-1.5 block flex-1 text-[12px] font-medium leading-[1.45] text-[var(--dh-muted)]">{copy}</span>
      <span className="mt-3 flex h-8 w-8 items-center justify-center self-end rounded-full border border-[#F5B700] text-[#F5B700] transition-colors group-hover:bg-[#F5B700] group-hover:text-slate-950">
        <ArrowRight size={15} strokeWidth={2.8} />
      </span>
    </button>
  );
};

export const AiChatBubble = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/taxi/user/support')}
      className="fixed bottom-7 right-7 z-40 flex items-center gap-3 rounded-[18px] bg-[var(--dh-surface)] py-3 pl-3 pr-6 shadow-[0_18px_44px_rgba(15,23,42,0.18)]"
    >
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0B8] text-[22px]">
        🤖
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--dh-surface)] bg-emerald-500" />
      </span>
      <span className="text-left">
        <span className="block text-[14px] font-black text-[var(--dh-text)]">Hi, I&apos;m Taxi09 AI 👋</span>
        <span className="block text-[12.5px] font-medium text-[var(--dh-muted)]">How can I help you today?</span>
      </span>
    </button>
  );
};
