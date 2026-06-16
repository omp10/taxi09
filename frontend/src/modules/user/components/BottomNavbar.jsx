import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CarFront, Headset, User } from 'lucide-react';
import { useSettings, normalizeAssetUrl } from '../../../shared/context/SettingsContext';
import busIcon from '../../../assets/3d images/AutoCab/bus.png';

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
  const { settings, modules, loading, hasBootstrapSettings } = useSettings();
  const showBusService = isEnabledFlag(settings.transportRide?.enable_bus_service);
  const busModule = (modules || []).find(m => m.service_type === 'bus' || m.name.toLowerCase() === 'bus');
  const dynamicBusIcon = busModule?.mobile_menu_icon ? normalizeAssetUrl(busModule.mobile_menu_icon) : busIcon;
  const showNavSkeleton = loading && !hasBootstrapSettings;

  const navItems = [
    { icon: Home, label: 'Home', path: '/taxi/user' },
    { icon: CarFront, label: 'Rides', path: '/taxi/user/activity' },
    ...(showBusService ? [{ imageIcon: dynamicBusIcon, label: 'Bus', path: '/taxi/user/bus' }] : []),
    { icon: Headset, label: 'Support', path: '/taxi/user/support' },
    { icon: User, label: 'Profile', path: '/taxi/user/profile' },
  ];

  if (showNavSkeleton) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2 pointer-events-none">
        <div className="flex items-center justify-around overflow-visible rounded-full border border-white/40 bg-white/95 px-2 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl pointer-events-auto relative">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-1 flex-col items-center justify-center py-1.5">
              <div className="h-[22px] w-[22px] animate-pulse rounded-full bg-slate-200" />
              <div className="mt-2 h-2.5 w-8 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] mx-auto w-full max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-2 pointer-events-none">
      <div className="flex items-center justify-around overflow-visible rounded-[32px] border border-white/60 bg-white/95 px-2 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl pointer-events-auto relative">
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
              <div className="relative flex flex-col items-center w-full">
                {/* Active Sliding Background Pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 32,
                        mass: 1
                      }}
                      className="absolute -inset-y-2 -inset-x-2 sm:-inset-x-4 bg-[#FFC107] rounded-[22px]"
                    />
                  )}
                </AnimatePresence>

                {/* Icon Container with Transition */}
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.05 : 1,
                    y: isActive ? -1 : 0
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30
                  }}
                  className="relative z-20"
                >
                  {imageIcon ? (
                    <img
                      src={imageIcon}
                      alt=""
                      className={`h-[22px] w-[22px] object-contain transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`}
                      draggable={false}
                    />
                  ) : (
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`}
                    />
                  )}
                </motion.div>

                {/* Label with Transition */}
                <motion.span 
                  animate={{ 
                    opacity: 1,
                    y: isActive ? 2 : 1,
                    scale: isActive ? 1 : 0.95
                  }}
                  transition={{
                    duration: 0.2
                  }}
                  className={`relative z-20 mt-1 text-[11px] font-bold transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {label}
                </motion.span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
