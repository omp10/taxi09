import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F3F4F6_38%,#EEF2F7_100%)] max-w-lg mx-auto font-sans relative overflow-hidden pb-12 flex flex-col justify-between">
      {/* Decorative background glows */}
      <div className="absolute -top-16 right-[-40px] h-44 w-44 rounded-full bg-orange-100/60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-28 right-[-40px] h-40 w-40 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full bg-white/85 backdrop-blur-2xl px-5 pt-12 pb-5 border-b border-white/40 shadow-[0_8px_32px_rgba(15,23,42,0.06)] sticky top-0 z-30"
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/taxi/user')}
            className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-[0_4px_12px_rgba(15,23,42,0.15)] shrink-0 group transition-all"
          >
            <ArrowLeft size={20} className="text-white group-hover:opacity-80 transition-opacity" strokeWidth={2.5} />
          </motion.button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500/60 leading-none mb-1.5">Self-drive rentals</p>
            <h1 className="text-[20px] font-bold tracking-tight text-slate-900 leading-none">Choose Rental Type</h1>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="px-5 pt-12 flex-1 flex flex-col justify-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center space-y-2 mb-4"
        >
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Select vehicle category</h2>
          <p className="text-[13px] font-medium text-slate-400 max-w-[280px] mx-auto leading-relaxed">
            Choose the vehicle type that best suits your journey
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {/* 2 Wheeler Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectCategory('bike')}
            className="flex flex-col items-center justify-between rounded-[32px] border border-slate-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)] text-center h-[210px] relative overflow-hidden group w-full"
          >
            <div className="relative w-full h-[135px] flex items-center justify-center bg-white overflow-hidden p-3">
              <motion.img
                src={rentalBikeImg}
                alt="2 Wheeler"
                className="w-full h-full object-contain mix-blend-multiply relative z-10 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="w-full pb-5">
              <span className="text-[16px] font-bold text-slate-900 tracking-tight block">2 Wheeler</span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">Bikes & Scooters</span>
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
            className="flex flex-col items-center justify-between rounded-[32px] border border-slate-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)] text-center h-[210px] relative overflow-hidden group w-full"
          >
            <div className="relative w-full h-[135px] flex items-center justify-center bg-white overflow-hidden p-3">
              <motion.img
                src={rentalCarImg}
                alt="4 Wheeler"
                className="w-full h-full object-contain mix-blend-multiply relative z-10 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="w-full pb-5">
              <span className="text-[16px] font-bold text-slate-900 tracking-tight block">4 Wheeler</span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">Cars & SUVs</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Footer view all button */}
      <div className="px-5 mt-auto pt-8">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          type="button"
          onClick={() => handleSelectCategory('all')}
          className="w-full py-4 rounded-2xl bg-slate-950 text-white text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.18)] hover:bg-black transition-colors"
        >
          Explore Entire Fleet
          <ChevronRight size={14} strokeWidth={3} className="opacity-70" />
        </motion.button>
      </div>
    </div>
  );
};

export default RentalTypeSelection;
