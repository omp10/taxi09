import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Menu } from 'lucide-react';
import AppSidebar from './AppSidebar';

/**
 * Shared Taxi09 top app bar.
 * Pass `showBack` on inner pages to swap the menu button for a back arrow.
 */
const AppHeader = ({ showBack = false, subtitle = '' }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="bg-[#fffdf8] h-[64px] flex items-center justify-between px-5 w-full sticky top-0 z-50 select-none">
      <button
        onClick={() => (showBack ? navigate(-1) : setMenuOpen(true))}
        className="text-slate-900 active:scale-95 transition-transform"
        aria-label={showBack ? 'Back' : 'Menu'}
      >
        {showBack ? <ArrowLeft size={21} strokeWidth={2.6} /> : <Menu size={22} strokeWidth={2.5} />}
      </button>

      <div
        onClick={() => navigate('/taxi/user')}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer leading-none"
      >
        <svg viewBox="0 0 120 22" className="w-[74px] h-[11px] -mb-0.5" aria-hidden="true">
          <path
            d="M4 20C22 4 74 -2 116 8"
            fill="none"
            stroke="#F5B700"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[21px] font-black italic tracking-[-0.05em] text-slate-950 leading-none">
          Taxi<span className="text-[#F5B700]">09</span>
        </span>
        <span className="text-[6.5px] font-semibold tracking-[0.34em] text-slate-700 mt-0.5">
          {subtitle || 'RIDE YOUR WAY'}
        </span>
      </div>

      <button
        onClick={() => navigate('/taxi/user/notifications')}
        className="relative text-slate-900 active:scale-95 transition-transform"
        aria-label="Notifications"
      >
        <Bell size={21} strokeWidth={2.2} />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#F5B700] rounded-full border-2 border-white" />
      </button>

      <AppSidebar open={menuOpen} onClose={closeMenu} />
    </header>
  );
};

export default AppHeader;
