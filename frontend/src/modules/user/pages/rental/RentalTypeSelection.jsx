import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Car, Bike, Check } from 'lucide-react';
import rentalBikeImg from '@/assets/images/rental_bike.png';
import rentalCarImg from '@/assets/images/rental_car.png';

const RentalTypeSelection = () => {
  const navigate = useNavigate();

  const handleSelectCategory = (category) => {
    if (category === 'all') {
      navigate('/taxi/user/rental');
    } else if (category === 'bike') {
      navigate('/taxi/user/rental/bike-categories');
    } else {
      navigate('/taxi/user/rental', { state: { preSelectedCategory: category } });
    }
  };

  return (
    <div className="premium-theme min-h-screen bg-background text-on-background font-body-md pb-8 max-w-lg md:max-w-none md:mx-0 w-full mx-auto relative overflow-hidden flex flex-col justify-between shadow-xl border-x border-surface-variant">
      
      {/* Decorative background glows */}
      <div className="absolute top-[-100px] right-[-100px] h-[300px] w-[300px] rounded-full bg-primary-container/10 blur-[80px] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full bg-surface px-6 pt-4 pb-4 border-b border-surface-variant sticky top-0 z-30"
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/taxi/user')}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shadow-sm shrink-0 border border-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">arrow_back</span>
          </motion.button>
          <div className="min-w-0 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant leading-none mb-1.5">Self-drive rentals</p>
            <h1 className="text-[20px] font-black tracking-tight text-primary leading-none">Choose Rental Type</h1>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="px-6 pt-3 flex-1 flex flex-col justify-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center space-y-2 mb-2 flex flex-col items-center"
        >
          <div className="relative mb-2">
            <div className="w-[68px] h-[68px] rounded-full border-[6px] border-background flex items-center justify-center bg-surface-container-low shadow-md">
              <Car size={32} className="text-primary" strokeWidth={2.5} />
            </div>
            <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-primary border-[3px] border-background flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm font-black">check</span>
            </div>
          </div>
          <h2 className="text-[20px] font-black text-on-surface tracking-tight">Select vehicle category</h2>
          <p className="text-[13px] font-semibold text-on-surface-variant max-w-[240px] mx-auto leading-relaxed">
            Choose the vehicle type that best suits your journey
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          
          {/* 2 Wheeler Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectCategory('bike')}
            className="flex flex-col items-center justify-start rounded-[24px] bg-surface-container-lowest border border-surface-variant hover:border-primary shadow-sm text-center h-[260px] relative overflow-hidden group w-full pt-6 pb-6 cursor-pointer transition-all"
          >
            <div className="relative w-full h-[120px] flex items-center justify-center">
              <div className="absolute inset-0 m-auto w-[110px] h-[110px] rounded-full bg-surface-container/50" />
              <div className="absolute top-0 left-6 grid grid-cols-3 gap-1.5 opacity-20">
                {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-primary" />)}
              </div>
              <motion.img
                src={rentalBikeImg}
                alt="2 Wheeler"
                className="w-[85%] h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
              />
            </div>
            
            <div className="flex flex-col items-center w-full relative z-20 mt-auto">
              <div className="w-8 h-8 rounded-full bg-primary/10 border-[3px] border-surface-container-lowest flex items-center justify-center mb-2 shadow-sm">
                <Bike size={14} className="text-primary" strokeWidth={2.5} />
              </div>
              <span className="text-[16px] font-black text-on-surface tracking-tight block">2 Wheeler</span>
              <div className="w-6 h-[2px] bg-primary mt-2 mb-2" />
              <span className="text-[11px] font-bold text-on-surface-variant block">Bikes & Scooters</span>
            </div>
          </motion.button>

          {/* 4 Wheeler Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectCategory('car')}
            className="flex flex-col items-center justify-start rounded-[24px] bg-surface-container-lowest border border-surface-variant hover:border-primary shadow-sm text-center h-[260px] relative overflow-hidden group w-full pt-6 pb-6 cursor-pointer transition-all"
          >
            <div className="relative w-full h-[120px] flex items-center justify-center">
              <div className="absolute inset-0 m-auto w-[110px] h-[110px] rounded-full bg-surface-container/50" />
              <div className="absolute top-0 right-6 grid grid-cols-3 gap-1.5 opacity-20">
                {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-primary" />)}
              </div>
              <motion.img
                src={rentalCarImg}
                alt="4 Wheeler"
                className="w-[85%] h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
              />
            </div>
            
            <div className="flex flex-col items-center w-full relative z-20 mt-auto">
              <div className="w-8 h-8 rounded-full bg-primary/10 border-[3px] border-surface-container-lowest flex items-center justify-center mb-2 shadow-sm">
                <Car size={14} className="text-primary" strokeWidth={2.5} />
              </div>
              <span className="text-[16px] font-black text-on-surface tracking-tight block">4 Wheeler</span>
              <div className="w-6 h-[2px] bg-primary mt-2 mb-2" />
              <span className="text-[11px] font-bold text-on-surface-variant block">Cars & SUVs</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Footer view all button */}
      <div className="px-6 mt-auto pt-8">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          type="button"
          onClick={() => handleSelectCategory('all')}
          className="w-full h-[60px] rounded-[20px] bg-primary-container text-on-primary-container flex items-center justify-between px-3 shadow-md hover:bg-amber-400 transition-colors yellow-glow cursor-pointer active:scale-95"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
             <Car size={20} className="text-on-primary-container" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-bold uppercase tracking-[0.12em] pl-2 flex-1 text-center">
            Explore Entire Fleet
          </span>
          <div className="w-10 h-10 flex items-center justify-end pr-1">
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default RentalTypeSelection;
