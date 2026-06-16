import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettings, normalizeAssetUrl } from '../../../shared/context/SettingsContext';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';

const ServiceTile = ({ icon, label, description, path, accentClass, shadowClass, borderClass, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex w-full min-h-[110px] items-center justify-center">
        <div className="flex h-full w-full animate-pulse flex-col items-center justify-center gap-2 rounded-[18px] border border-white/20 bg-white/65 p-2">
          <div className="h-[55px] w-[55px] rounded-full bg-slate-200" />
          <div className="h-3 w-16 rounded-full bg-slate-200 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => path && navigate(path)}
      className={`flex flex-col overflow-hidden rounded-[18px] bg-white border ${borderClass || 'border-slate-300'} w-full transition-all hover:scale-[1.02] cursor-pointer shadow-lg ${shadowClass}`}
    >
      {/* Top half with image (Compact) */}
      <div className="relative flex h-[85px] w-full items-center justify-center pt-2.5">
        {/* Circle background */}
        <div className={`absolute h-[68px] w-[68px] rounded-full ${accentClass}`} />
        <img src={icon} alt="" className="relative z-10 h-[80px] w-[80px] object-contain drop-shadow-md transform scale-110" />
      </div>

      {/* Bottom half with text and icons (Compact) */}
      <div className="flex w-full items-center justify-between px-2 pb-2.5">
        {/* Small circle icon */}
        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${accentClass}`}>
          <img src={icon} alt="" className="h-3 w-3 object-contain" />
        </div>

        {/* Label */}
        <div className="flex-1 px-1 text-center">
          <span className="text-[9.5px] font-bold text-slate-900 uppercase leading-tight line-clamp-2">
            {label}
          </span>
        </div>

        {/* Right Arrow */}
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
          <ArrowRight size={10} strokeWidth={3.5} className="text-white" />
        </div>
      </div>
    </motion.button>
  );
};

const ServiceGrid = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const getServiceKey = (service, index) => {
    const label = String(service?.label || '').trim();
    const path = String(service?.path || '').trim();
    return label || path ? `${label || 'service'}-${path || index}` : `service-${index}`;
  };

  const getPath = (module) => {
    const serviceType = String(module?.service_type || '').trim().toLowerCase();
    const transportType = String(module?.transport_type || '').trim().toLowerCase();
    const moduleName = String(module?.name || '').trim().toLowerCase();

    if (transportType === 'delivery') return '/taxi/user/parcel/type';
    if (serviceType === 'rental') return '/taxi/user/rental/type';
    if (serviceType === 'outstation') return '/taxi/user/intercity';
    if (serviceType === 'pooling' || moduleName.includes('pooling')) {
      return '/taxi/user/pooling';
    }

    if (serviceType === 'bus' || transportType === 'bus' || moduleName.includes('bus')) {
      return '/taxi/user/bus';
    }

    if (
      ['normal', 'taxi', 'ride', 'ride_hailing', 'ride-hailing'].includes(serviceType) ||
      ['taxi', 'both'].includes(transportType) ||
      moduleName.includes('taxi') ||
      moduleName.includes('cab')
    ) {
      return '/taxi/user/ride/select-category';
    }

    return '/taxi/user/ride/select-category';
  };

  const getAccent = (index) => {
    const accents = [
      { accentClass: 'bg-amber-100/60', shadowClass: 'shadow-amber-400/20', borderClass: 'border-amber-400' },
      { accentClass: 'bg-orange-100/60', shadowClass: 'shadow-orange-400/20', borderClass: 'border-orange-400' },
      { accentClass: 'bg-blue-100/60', shadowClass: 'shadow-blue-400/20', borderClass: 'border-blue-400' },
      { accentClass: 'bg-purple-100/60', shadowClass: 'shadow-purple-400/20', borderClass: 'border-purple-400' },
      { accentClass: 'bg-emerald-100/60', shadowClass: 'shadow-emerald-400/20', borderClass: 'border-emerald-400' },
      { accentClass: 'bg-rose-100/60', shadowClass: 'shadow-rose-400/20', borderClass: 'border-rose-400' },
    ];
    return accents[index % accents.length];
  };

  const { modules, loading: settingsLoading } = useSettings();

  useEffect(() => {
    if (settingsLoading) return;
    
    // Only show active modules
    const activeModules = (modules || []).filter(m => m.active);
    
    const mapped = activeModules.map((m, idx) => {
      const accent = getAccent(idx);
      return {
        icon: normalizeAssetUrl(m.mobile_menu_icon),
        label: m.name,
        description: m.short_description,
        path: getPath(m),
        accentClass: accent.accentClass,
        shadowClass: accent.shadowClass,
        borderClass: accent.borderClass
      };
    });
    
    setServices(mapped);
    setLoading(false);
  }, [modules, settingsLoading]);

  const optionCount = loading ? '...' : services.length;

  return (
    <div className="px-5 mt-2">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-white/70 backdrop-blur-md rounded-[28px] p-4 shadow-sm border border-white/80"
      >
        {/* Header - Compact */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">Services</p>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight leading-none mt-0.5">Choose your ride</h2>
            <p className="mt-1 text-[12px] font-medium text-slate-400">Tap to start quickly</p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-primary bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm mt-1">
            <SlidersHorizontal size={12} className="text-primary" strokeWidth={2.5} />
            <span>{optionCount} options</span>
          </div>
        </div>

        {/* Grid - Compact */}
        <div className="mt-3.5 grid auto-rows-fr grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-5">
          {loading ? (
             [...Array(4)].map((_, i) => <ServiceTile key={i} loading />)
          ) : (
            services.map((service, index) => (
              <ServiceTile key={getServiceKey(service, index)} {...service} />
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default ServiceGrid;
