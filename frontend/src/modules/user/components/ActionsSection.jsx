import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bike, Package, Sparkles } from 'lucide-react';

const ActionCard = ({ 
  title, 
  description, 
  image, 
  path, 
  sidebarColor, 
  iconColor, 
  icon: Icon,
  sweepColor,
  arrowBgColor,
  arrowIconColor,
  shadowColor,
  borderColor
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(path)}
      className={`relative flex h-[140px] flex-1 overflow-hidden rounded-[20px] bg-white border ${borderColor || 'border-slate-300'} cursor-pointer group transition-all duration-300 ${shadowColor}`}
    >
      {/* Left Sidebar Block */}
      <div className={`w-[40px] flex flex-col items-center pt-3.5 z-10 shrink-0 ${sidebarColor}`}>
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/95 shadow-sm">
          <Icon size={14} className={iconColor} strokeWidth={2.5} />
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 p-3 relative overflow-hidden z-10 flex flex-col">
        {/* Background Sweep Shape */}
        <div className={`absolute -right-4 -bottom-4 w-[110%] h-[85%] rounded-tl-[80px] z-0 pointer-events-none ${sweepColor}`} />
        
        {/* Text Container */}
        <div className="relative z-10 pr-[20px]">
          <h3 className="text-[15px] font-bold tracking-tight text-slate-900 leading-none mb-1.5">
            {title}
          </h3>
          <p className="text-[10.5px] font-medium text-slate-500 leading-snug pr-2 line-clamp-2">
            {description}
          </p>
        </div>

        <div className="flex-1" />

        {/* Arrow Button - Positioned absolutely at bottom left */}
        <div className={`absolute left-3 bottom-3 flex h-7 w-7 items-center justify-center rounded-full shadow-sm z-10 transition-transform group-hover:scale-110 ${arrowBgColor}`}>
          <ArrowRight size={14} strokeWidth={3} className={arrowIconColor} />
        </div>

        {/* Floating 3D Image - Positioned absolutely at bottom right */}
        <div className="absolute -bottom-1 -right-2 w-[70px] h-[70px] pointer-events-none select-none z-10">
          <img
            src={image}
            alt=""
            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(15,23,42,0.12)] transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 origin-bottom-right"
          />
        </div>
      </div>
    </motion.div>
  );
};

const ActionsSection = () => {
  const location = useLocation();
  const routePrefix = location.pathname.startsWith('/taxi/user') ? '/taxi/user' : '';

  return (
    <div className="px-5 mt-2 mb-3">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-white/70 backdrop-blur-md rounded-[28px] p-4 shadow-sm border border-white/80 space-y-3.5"
      >
        <div className="flex items-center gap-2 ml-1">
          <Sparkles size={18} fill="#FFC400" className="text-[#FFC400]" />
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Recommended for you</h2>
        </div>
        <div className="flex gap-3">
        <ActionCard
          title="Ride"
          description="Bike, auto, and cab"
          image="/1_Bike.png"
          path={`${routePrefix}/ride/select-category`}
          icon={Bike}
          sidebarColor="bg-primary"
          iconColor="text-slate-900"
          sweepColor="bg-amber-50"
          arrowBgColor="bg-primary"
          arrowIconColor="text-slate-900"
          shadowColor="shadow-lg shadow-amber-400/20"
          borderColor="border-amber-400"
        />

        <ActionCard
          title="Delivery"
          description="Send parcels instantly"
          image="/5_Parcel.png"
          path="/parcel/type"
          icon={Package}
          sidebarColor="bg-secondary"
          iconColor="text-secondary"
          sweepColor="bg-slate-50"
          arrowBgColor="bg-secondary"
          arrowIconColor="text-white"
          shadowColor="shadow-lg shadow-slate-400/20"
          borderColor="border-slate-400"
        />
        </div>
      </motion.section>
    </div>
  );
};

export default ActionsSection;
