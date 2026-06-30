import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CarFront, Headset, User, Key, Package, Wallet } from 'lucide-react';
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
    { icon: CarFront, label: 'Rides', path: '/taxi/user/activity' },
    { icon: Wallet, label: 'Wallet', path: '/taxi/user/wallet' },
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
      <nav className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2 pointer-events-none md:hidden flex">
        <div className="flex w-full items-center justify-around overflow-visible rounded-[32px] border border-white/60 bg-white/95 px-2 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl pointer-events-auto relative">
          {navItems.map(({ icon: Icon, imageIcon, label, path }) => {
            const isActive =
              path === '/taxi/user'
                ? pathname === path
                : pathname === path || pathname.startsWith(`${path}/`);

            return (
              <button
                key={label}
                type="button"
                onClick={() => navigate(path)}
                className="flex-1 flex flex-col items-center justify-center py-1.5 relative z-10 outline-none tap-highlight-transparent group"
              >
                <div className="relative flex flex-col items-center justify-center w-full gap-0">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 1 }}
                        className="absolute -inset-y-1 inset-x-2 sm:inset-x-4 bg-[#FFC107] rounded-[18px]"
                      />
                    )}
                  </AnimatePresence>
                  <motion.div
                    animate={{ scale: isActive ? 1.05 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="relative z-20"
                  >
                    {imageIcon ? (
                      <img src={imageIcon} alt="" className={`h-[22px] w-[22px] object-contain transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`} draggable={false} />
                    ) : (
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors duration-300 ${isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-slate-700'}`} />
                    )}
                  </motion.div>
                  <motion.span
                    animate={{ opacity: 1, y: isActive ? 2 : 1, scale: isActive ? 1 : 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`relative z-20 mt-1 text-[11px] font-bold transition-colors duration-300 ${isActive ? 'text-slate-950 font-black' : 'text-slate-500 group-hover:text-slate-900'}`}
                  >
                    {label}
                  </motion.span>
                </div>
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
            const isActive = item.path === '/taxi/user' ? pathname === item.path : pathname.startsWith(item.path);
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
