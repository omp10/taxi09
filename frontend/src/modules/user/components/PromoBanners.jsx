import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3, ShieldCheck, Sparkles } from 'lucide-react';

const rotatingCards = [
  {
    icon: Clock3,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50/80',
    title: 'In a hurry?',
    description: 'Auto for shorter wait times.',
    buttonBorder: 'border border-amber-300',
    buttonIconColor: 'text-amber-500',
    sweepClass: 'bg-amber-50/60',
    shadowColor: 'shadow-[0_12px_24px_rgba(245,158,11,0.15)]',
    borderColor: 'border-amber-400',
    path: '/taxi/user/ride/select-location',
    state: { selectedCategory: 'auto' },
    image: '/2_AutoRickshaw.png',
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50/80',
    title: 'Need more space?',
    description: 'Cab for luggage or comfort.',
    buttonBorder: 'border border-blue-200',
    buttonIconColor: 'text-blue-500',
    sweepClass: 'bg-blue-50/60',
    shadowColor: 'shadow-[0_12px_24px_rgba(59,130,246,0.15)]',
    borderColor: 'border-blue-400',
    path: '/taxi/user/ride/select-location',
    state: { selectedCategory: 'car' },
    image: '/4_Taxi.png',
  },
];

const PromoCard = ({ icon: Icon, iconColor, iconBg, title, description, buttonBorder, buttonIconColor, sweepClass, shadowColor, borderColor, path, state, image, onNavigate }) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onNavigate(path, { state })}
    className={`relative flex flex-col min-h-[180px] overflow-hidden rounded-[20px] border ${borderColor || 'border-slate-300'} bg-white p-3.5 cursor-pointer group transition-all duration-300 ${shadowColor}`}
  >
    {/* Background Sweep Shape at bottom right */}
    <div className={`absolute -right-8 -bottom-8 w-[130%] h-[75%] rounded-tl-[100px] z-0 pointer-events-none ${sweepClass}`} />
    
    <div className="relative z-10 flex-1 flex flex-col">
      {/* Top Left Icon Circle */}
      <div className={`flex h-8 w-8 items-center justify-center rounded-full mb-3 ${iconBg}`}>
        <Icon size={15} strokeWidth={2.5} className={iconColor} />
      </div>

      <h3 className="text-[16px] font-bold leading-tight tracking-tight text-slate-900 mb-1 pr-1">{title}</h3>
      <p className="text-[11.5px] font-medium leading-snug text-slate-500 pr-[70px]">{description}</p>
      
      <div className="flex-1" /> {/* Spacer to push button to bottom */}
      
      {/* Bottom Elements: Arrow Button & 3D Image */}
      <div className="relative flex items-end justify-between mt-3 z-10 w-full">
        {/* Arrow Button */}
        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm transition-transform group-hover:scale-105 ${buttonBorder}`}>
          <ArrowRight size={15} strokeWidth={2.5} className={buttonIconColor} />
        </div>

        {/* Floating 3D Image */}
        <div className="absolute -bottom-2.5 -right-2 w-[80px] h-[80px] pointer-events-none select-none flex items-end justify-end">
          <img src={image} alt="" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(15,23,42,0.1)] transform group-hover:scale-105 group-hover:-translate-x-1 group-hover:-translate-y-1 transition-all duration-300 origin-bottom-right" />
        </div>
      </div>
    </div>
  </motion.div>
);

const PromoBanners = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = location.pathname.startsWith('/taxi/user') ? '/taxi/user' : '';

  return (
    <div className="px-5 mt-0 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {rotatingCards.map((card, index) => (
          <PromoCard
            key={index}
            {...card}
            path={routePrefix ? `${routePrefix}/ride/select-location` : '/ride/select-location'}
            onNavigate={navigate}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoBanners;
