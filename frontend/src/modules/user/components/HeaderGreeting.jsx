import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, ChevronDown, Home, CarFront, Headset, User } from 'lucide-react';
import { DEFAULT_LOCATION_LABEL, getSavedLocationLabel, LOCATION_UPDATED_EVENT } from '../services/locationStore';
import { useSettings, normalizeAssetUrl } from '../../../shared/context/SettingsContext';

const HeaderGreeting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = location.pathname.startsWith('/taxi/user') ? '/taxi/user' : '';

  const { settings, loading, hasBootstrapSettings } = useSettings();
  const appLogo = settings.general?.logo || settings.customization?.logo || settings.general?.favicon || '';
  const appName = settings.general?.app_name || 'App';
  const [locationLabel, setLocationLabel] = useState(getSavedLocationLabel);
  const showBrandingSkeleton = loading && !hasBootstrapSettings && !appLogo;

  useEffect(() => {
    const syncLocationLabel = () => {
      setLocationLabel(getSavedLocationLabel());
    };

    syncLocationLabel();
    window.addEventListener('storage', syncLocationLabel);
    window.addEventListener(LOCATION_UPDATED_EVENT, syncLocationLabel);

    return () => {
      window.removeEventListener('storage', syncLocationLabel);
      window.removeEventListener(LOCATION_UPDATED_EVENT, syncLocationLabel);
    };
  }, []);

  const navItems = [
    { label: 'Home', path: '/taxi/user' },
    { label: 'Activity', path: '/taxi/user/activity' },
    { label: 'Support', path: '/taxi/user/support' },
    { label: 'Profile', path: '/taxi/user/profile' },
  ];

  return (
    <div className="relative w-full z-50">
      {/* Top Dark Bar (Mobile Only, Desktop handled by BottomNavbar) */}
      <div className="bg-[#0a0a0a] py-3.5 px-5 md:hidden border-b border-white/10">
        <div className="flex items-center justify-between">
          {/* Left Admin Logo / Spacer */}
          <div className="w-12 flex justify-start items-center cursor-pointer" onClick={() => navigate('/taxi/user')}>
            {appLogo && (
              <img src={normalizeAssetUrl(appLogo)} alt="App Logo" className="h-8 w-auto object-contain" />
            )}
          </div>

          {/* Center Logo */}
          <div className="flex-1 flex justify-center cursor-pointer" onClick={() => navigate('/taxi/user')}>
            <span className="font-black text-[22px] italic tracking-widest text-white">
              TAXI<span className="text-[#FFC107]">09</span>
            </span>
          </div>

          {/* Right Profile Icon */}
          <div className="w-12 flex justify-end">
            <button 
              onClick={() => navigate('/taxi/user/profile')}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:text-black hover:bg-[#FFC107] hover:border-[#FFC107] transition-colors"
            >
              <User size={20} strokeWidth={2.5} />
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default HeaderGreeting;
