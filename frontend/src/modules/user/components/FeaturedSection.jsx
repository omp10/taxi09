import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bmwImg from '../../../assets/images/bmw.png';

const FeaturedSection = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white py-12 px-4 sm:px-6 lg:px-8 relative z-30">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Featured</h2>
          <div className="flex gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 transition-colors">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          
          {/* Card 1: 7 DAYS Rental Package */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => navigate('/taxi/user/rental')}
            className="relative flex-shrink-0 w-[340px] md:w-[380px] h-[180px] overflow-hidden rounded-2xl bg-slate-50 shadow-sm cursor-pointer border border-slate-100"
          >
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#FFC107] rounded-l-full scale-150 translate-x-1/4" />
            <div className="relative z-10 p-6 flex flex-col h-full justify-between w-1/2">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">7 DAYS</h3>
                <p className="text-lg font-bold text-amber-600">Rental Package</p>
              </div>
              <div className="flex items-center gap-1 mt-auto">
                <span className="text-xs font-bold text-slate-800">Lowest Price Ever</span>
                <ArrowRight size={14} className="text-slate-800" />
              </div>
            </div>
            <div className="absolute right-2 bottom-0 z-20 h-full w-[180px] flex items-end justify-center pb-2">
              <img src={bmwImg} alt="7 Days Rental" className="object-contain w-full drop-shadow-2xl" />
            </div>
          </motion.div>

          {/* Card 2: Rental Pass */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => navigate('/taxi/user/rental')}
            className="relative flex-shrink-0 w-[340px] md:w-[380px] h-[180px] overflow-hidden rounded-2xl bg-white shadow-sm cursor-pointer border border-[#FFC107] flex"
          >
            <div className="absolute left-0 top-0 bottom-0 w-3/4 bg-[#111111] rounded-r-full scale-150 -translate-x-1/4" />
            <div className="relative z-10 p-6 flex flex-col h-full justify-between w-[60%] text-white">
              <div>
                <h3 className="text-2xl font-bold">Rental pass</h3>
                <p className="text-[10px] text-white/70 mt-2 font-medium">Get Rental Pass and</p>
                <p className="text-2xl font-extrabold text-[#FFC107] mt-0.5">Save 25%</p>
                <p className="text-[10px] text-white/70 font-medium">on bookings</p>
              </div>
            </div>
            <div className="relative z-10 w-[40%] flex flex-col items-end justify-between p-4">
              <div className="text-[#FFC107]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="drop-shadow-sm">
                  <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.55 18.55 20 18 20H6C5.45 20 5 19.55 5 19V18H19V19Z" />
                </svg>
              </div>
              <button className="bg-[#FFC107] hover:bg-amber-400 transition-colors text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1 shadow-md">
                See Benefits <ArrowRight size={12} />
              </button>
            </div>
          </motion.div>

          {/* Card 3: 1 MONTH Rental Package */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => navigate('/taxi/user/rental')}
            className="relative flex-shrink-0 w-[340px] md:w-[380px] h-[180px] overflow-hidden rounded-2xl bg-slate-50 shadow-sm cursor-pointer border border-slate-100"
          >
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#FFC107] rounded-l-full scale-150 translate-x-1/4" />
            <div className="relative z-10 p-6 flex flex-col h-full justify-between w-1/2">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">1 MONTH</h3>
                <p className="text-lg font-bold text-amber-600">Rental Package</p>
              </div>
              <div className="flex items-center gap-1 mt-auto">
                <span className="text-xs font-bold text-slate-800">Lowest Price Ever</span>
                <ArrowRight size={14} className="text-slate-800" />
              </div>
            </div>
            <div className="absolute right-2 bottom-0 z-20 h-full w-[180px] flex items-end justify-center pb-2">
              <img src={bmwImg} alt="1 Month Rental" className="object-contain w-full drop-shadow-2xl" />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default FeaturedSection;
