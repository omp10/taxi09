import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, User, Menu, ChevronDown } from 'lucide-react';
import { DEFAULT_LOCATION_LABEL, getSavedLocationLabel, LOCATION_UPDATED_EVENT } from '../services/locationStore';
import { useSettings } from '../../../shared/context/SettingsContext';

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

  return (
    <div className="relative w-full">
      {/* Top Yellow Bar */}
      <div className="bg-[#FFC107] pt-6 pb-12 px-5">
        <div className="flex items-center justify-between">
          <button className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
            <Menu size={26} className="text-black" strokeWidth={2.5} />
          </button>
          
          <div className="flex-1 flex justify-center">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="h-8 object-contain" />
            ) : showBrandingSkeleton ? (
              <div className="h-8 w-24 bg-black/10 animate-pulse rounded-md" />
            ) : (
              <span className="font-black text-[22px] italic tracking-widest text-black">
                {appName.toUpperCase()}
              </span>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/taxi/user/profile')}
            className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/15 transition-colors"
          >
            <User size={22} className="text-black" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Overlapping White Card */}
      <div className="px-4 -mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100"
        >
          {/* Location row */}
          <button 
            onClick={() => navigate(`${routePrefix}/ride/select-category`)}
            className="w-full flex items-center gap-3 mb-4 text-left group"
          >
            <div className="w-12 h-12 bg-[#FFC107] rounded-[14px] flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
              <MapPin size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#FFC107]">Location</p>
              <p className="text-[12px] font-semibold text-slate-800 mt-0.5 truncate">{locationLabel}</p>
            </div>
            <ChevronDown size={20} className="text-slate-800 shrink-0" strokeWidth={2.5} />
          </button>

          {/* Search row */}
          <button 
            onClick={() => navigate(`${routePrefix}/ride/select-category`)}
            className="w-full flex items-center gap-3 bg-white border border-slate-100 rounded-[20px] p-2 pl-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] group-active:scale-[0.99] transition-transform"
          >
            <Search size={18} className="text-slate-400 shrink-0" strokeWidth={2.5} />
            <span className="flex-1 text-left text-[14px] font-medium text-slate-400 truncate">
              Search destination
            </span>
            <div className="bg-[#FFC107] text-white px-6 py-2.5 rounded-[16px] text-[13px] font-bold shadow-sm">
              Go
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default HeaderGreeting;
