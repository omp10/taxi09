import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CarFront, User, CalendarDays, Tag } from 'lucide-react';
import { useSettings, normalizeAssetUrl } from '../../../shared/context/SettingsContext';
import busIcon from '../../../assets/3d images/AutoCab/bus.png';
import { getLocalUserToken, clearLocalUserSession } from '../services/authService';

const isEnabledFlag = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  const normalized = String(value || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(normalized);
};

const BottomNavbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLoggedIn = !!getLocalUserToken();

  const handleLogout = () => {
    clearLocalUserSession();
    navigate('/taxi/user/login');
  };
  const { settings, modules, loading, hasBootstrapSettings } = useSettings();
  const showBusService = isEnabledFlag(settings.transportRide?.enable_bus_service);
  const busModule = (modules || []).find(m => m.service_type === 'bus' || m.name.toLowerCase() === 'bus');
  const dynamicBusIcon = busModule?.mobile_menu_icon ? normalizeAssetUrl(busModule.mobile_menu_icon) : busIcon;
  const showNavSkeleton = loading && !hasBootstrapSettings;

  const navItems = [
    { icon: Home, label: 'Home', path: '/taxi/user' },
    { icon: CalendarDays, label: 'Bookings', path: '/taxi/user/activity' },
    { icon: CarFront, label: 'Cars', path: '/taxi/user/rental/type', center: true },
    { icon: Tag, label: 'Offers', path: '/taxi/user/promo' },
    { icon: User, label: 'Profile', path: '/taxi/user/profile' },
  ];

  if (showNavSkeleton) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2 pointer-events-none md:max-w-none md:w-full md:top-0 md:bottom-auto md:px-0 md:pt-0 md:pb-0 flex">
        <div className="flex w-full items-center justify-around overflow-visible rounded-full border border-white/40 bg-white/95 px-2 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl pointer-events-auto relative md:flex-row md:justify-center md:h-auto md:rounded-none md:border-b md:border-slate-200 md:border-t-0 md:border-x-0 md:px-8 md:py-3 md:gap-8">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-1 md:flex-none flex-col md:flex-row items-center md:justify-start py-1.5 md:py-3 md:px-4 gap-0 md:gap-4">
              <div className="h-[22px] w-[22px] animate-pulse rounded-full bg-slate-200" />
              <div className="mt-2 md:mt-0 h-2.5 w-8 md:w-16 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Mobile Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-lg md:hidden">
        <div className="flex w-full items-end justify-around border-t border-slate-200 bg-white px-2 pt-2 pb-[max(env(safe-area-inset-bottom),10px)] shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
          {navItems.map(({ icon: Icon, label, path, center }) => {
            const isActive =
              label === 'Cars'
                ? pathname.startsWith('/taxi/user/rental')
                : path === '/taxi/user'
                  ? pathname === path
                  : pathname === path || pathname.startsWith(`${path}/`);

            if (center) {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(path)}
                  className="flex-1 flex flex-col items-center outline-none tap-highlight-transparent"
                >
                  <motion.span
                    whileTap={{ scale: 0.92 }}
                    className="-mt-7 mb-1 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#F5B700] shadow-[0_6px_16px_rgba(245,183,0,0.45)] ring-4 ring-white"
                  >
                    <Icon size={28} strokeWidth={2.2} className="text-slate-900" />
                  </motion.span>
                  <span className="text-[11px] font-bold text-slate-700">{label}</span>
                </button>
              );
            }

            return (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className="flex-1 flex flex-col items-center gap-1 pb-1 outline-none tap-highlight-transparent group"
              >
                <Icon
                  size={23}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-[#F5B700]' : 'text-slate-600'}
                />
                <span className={`text-[11px] ${isActive ? 'font-black text-[#F5B700]' : 'font-semibold text-slate-600'}`}>
                  {label}
                </span>
                <span className={`h-[3px] w-6 rounded-full ${isActive ? 'bg-[#F5B700]' : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Top Yellow Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-[100] bg-[#FFC107] px-8 py-4 items-center justify-between border-b border-amber-500/20 shadow-sm">
        <div className="flex items-center gap-6 cursor-pointer" onClick={() => navigate('/taxi/user')}>
          <span className="font-black text-[26px] italic tracking-widest text-slate-950">
            TAXI<span className="text-white">09</span>
          </span>
        </div>
        <div className="flex items-center gap-8">
          {navItems.map((item) => {
            const isActive =
              item.label === 'Cars'
                ? pathname.startsWith('/taxi/user/rental')
                : item.path === '/taxi/user'
                  ? pathname === item.path
                  : pathname.startsWith(item.path);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`text-[15px] font-bold transition-all outline-none px-4 py-1.5 rounded-full ${isActive
                  ? 'text-white bg-slate-950/90 shadow-sm'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-950/5'
                  }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="flex items-center gap-4 ml-4">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded-md border border-slate-950 text-slate-950 font-bold hover:bg-slate-950 hover:text-white transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/taxi/user/login')}
                  className="px-6 py-2 rounded-md border border-slate-950 text-slate-950 font-bold hover:bg-slate-950 hover:text-white transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/taxi/user/signup')}
                  className="px-6 py-2 rounded-md bg-slate-950 text-white font-bold hover:bg-slate-900 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNavbar;
