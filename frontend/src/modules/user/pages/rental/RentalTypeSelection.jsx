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
    <div className="min-h-screen bg-[#0a0a0a] max-w-lg md:max-w-none md:mx-0 w-full mx-auto font-sans relative overflow-hidden pb-8 md:pt-24 flex flex-col justify-between">
      {/* Decorative background glows */}
      <div className="absolute top-[-100px] right-[-100px] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full bg-[#111111]/80 backdrop-blur-xl px-6 pt-3 pb-4 border-b border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)] sticky top-0 z-30"
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/taxi/user')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-md shrink-0 group transition-all border border-white/20"
          >
            <ArrowLeft size={22} className="text-white" strokeWidth={2.5} />
          </motion.button>
          <div className="min-w-0 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 leading-none mb-1.5">Self-drive rentals</p>
            <h1 className="text-[24px] font-black tracking-tight text-white leading-none">Choose Rental Type</h1>
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
            <div className="w-[68px] h-[68px] rounded-full border-[6px] border-[#0a0a0a] flex items-center justify-center bg-[#1a1a1a] shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
              <Car size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#2563EB] border-[3px] border-[#0a0a0a] flex items-center justify-center">
              <Check size={14} className="text-white" strokeWidth={4} />
            </div>
          </div>
          <h2 className="text-[20px] font-black text-white tracking-tight">Select vehicle category</h2>
          <p className="text-[13px] font-semibold text-slate-400 max-w-[240px] mx-auto leading-relaxed">
            Choose the vehicle type that best suits your journey
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* 2 Wheeler Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectCategory('bike')}
            className="flex flex-col items-center justify-start rounded-[28px] bg-[#1a1a1a] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] text-center h-[260px] relative overflow-hidden group w-full pt-6 pb-6 hover:border-[#2563EB]"
          >
            <div className="relative w-full h-[120px] flex items-center justify-center bg-[#1a1a1a]">
              <div className="absolute inset-0 m-auto w-[110px] h-[110px] rounded-full bg-white/5" />
              <div className="absolute top-0 left-6 grid grid-cols-3 gap-1.5 opacity-40">
                {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />)}
              </div>
              <motion.img
                src={rentalBikeImg}
                alt="2 Wheeler"
                className="w-[85%] h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-xl"
              />
            </div>
            
            <div className="flex flex-col items-center w-full relative z-20 mt-auto">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border-[3px] border-[#1a1a1a] flex items-center justify-center mb-2 shadow-sm">
                <Bike size={14} className="text-blue-400" strokeWidth={2.5} />
              </div>
              <span className="text-[16px] font-black text-white tracking-tight block">2 Wheeler</span>
              <div className="w-6 h-[2px] bg-blue-500 mt-2 mb-2" />
              <span className="text-[11px] font-bold text-slate-400 block">Bikes & Scooters</span>
            </div>
          </motion.button>

          {/* 4 Wheeler Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectCategory('car')}
            className="flex flex-col items-center justify-start rounded-[28px] bg-[#1a1a1a] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] text-center h-[260px] relative overflow-hidden group w-full pt-6 pb-6 hover:border-[#2563EB]"
          >
            <div className="relative w-full h-[120px] flex items-center justify-center bg-[#1a1a1a]">
              <div className="absolute inset-0 m-auto w-[110px] h-[110px] rounded-full bg-white/5" />
              <div className="absolute top-0 right-6 grid grid-cols-3 gap-1.5 opacity-40">
                {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />)}
              </div>
              <motion.img
                src={rentalCarImg}
                alt="4 Wheeler"
                className="w-[85%] h-full object-contain relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-xl"
              />
            </div>
            
            <div className="flex flex-col items-center w-full relative z-20 mt-auto">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border-[3px] border-[#1a1a1a] flex items-center justify-center mb-2 shadow-sm">
                <Car size={14} className="text-blue-400" strokeWidth={2.5} />
              </div>
              <span className="text-[16px] font-black text-white tracking-tight block">4 Wheeler</span>
              <div className="w-6 h-[2px] bg-blue-500 mt-2 mb-2" />
              <span className="text-[11px] font-bold text-slate-400 block">Cars & SUVs</span>
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
          className="w-full h-[60px] rounded-[16px] bg-[#2563EB] text-white flex items-center justify-between px-3 shadow-[0_12px_24px_rgba(37,99,235,0.25)] hover:bg-blue-600 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
             <Car size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-bold uppercase tracking-[0.12em] pl-2 flex-1 text-center">
            Explore Entire Fleet
          </span>
          <div className="w-10 h-10 flex items-center justify-end pr-1">
            <ChevronRight size={20} strokeWidth={3} className="text-white" />
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default RentalTypeSelection;
