import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Menu } from 'lucide-react';
import AppSidebar from './AppSidebar';
import BrandLogo from '../../../shared/components/BrandLogo';

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
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex cursor-pointer items-center text-slate-950"
      >
        <BrandLogo height={40} />
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
