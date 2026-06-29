import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bikeImg from '../../../../assets/images/yellow_sports_bike.png';
import carImg from '../../../../assets/images/yellow_sports_car.png';

const ChooseRideSection = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-[#FFC107] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-px w-8 bg-black/20" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">Choose Your Ride</h2>
            <div className="h-px w-8 bg-black/20" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bike Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden group shadow-xl"
          >
            <div className="flex-1 z-10 text-white">
              <h3 className="text-2xl font-extrabold mb-2">2 Wheeler<br/><span className="text-[#FFC107]">Rentals</span></h3>
              <ul className="space-y-2 my-4">
                <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-[#FFC107]"/> Scooters</li>
                <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-[#FFC107]"/> Sports Bikes</li>
                <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-[#FFC107]"/> Electric Vehicles</li>
              </ul>
              <button 
                onClick={() => navigate('/taxi/user/rental')}
                className="bg-[#FFC107] text-black px-6 py-2.5 rounded-md font-bold flex items-center gap-2 hover:bg-amber-400 transition-colors"
              >
                Explore Bikes <div className="bg-black text-[#FFC107] rounded-full p-0.5"><ChevronRight size={14} /></div>
              </button>
            </div>
            <div className="w-full sm:w-1/2 flex justify-end items-center relative z-10">
              <img src={bikeImg} alt="Sports Bike" className="w-full max-w-[280px] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" />
            </div>
            {/* Background glow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFC107] opacity-10 blur-3xl rounded-full" />
          </motion.div>

          {/* Car Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden group shadow-xl"
          >
            <div className="flex-1 z-10 text-white">
              <h3 className="text-2xl font-extrabold mb-2">4 Wheeler<br/><span className="text-[#FFC107]">Rentals</span></h3>
              <ul className="space-y-2 my-4">
                <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-[#FFC107]"/> Hatchbacks</li>
                <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-[#FFC107]"/> SUVs</li>
                <li className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={16} className="text-[#FFC107]"/> Luxury Cars</li>
              </ul>
              <button 
                onClick={() => navigate('/taxi/user/rental')}
                className="bg-[#FFC107] text-black px-6 py-2.5 rounded-md font-bold flex items-center gap-2 hover:bg-amber-400 transition-colors"
              >
                Explore Cars <div className="bg-black text-[#FFC107] rounded-full p-0.5"><ChevronRight size={14} /></div>
              </button>
            </div>
            <div className="w-full sm:w-1/2 flex justify-end items-center relative z-10">
              <img src={carImg} alt="Luxury Car" className="w-full max-w-[280px] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" />
            </div>
            {/* Background glow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFC107] opacity-10 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ChooseRideSection;
