import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar } from 'lucide-react';
import heroImg from '../../../../assets/images/hero_car_bike.png';
import { useNavigate } from 'react-router-dom';

const LandingHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full bg-[#0a0a0a] min-h-[70vh] flex items-center overflow-hidden pt-20 pb-12">
      {/* Background styling */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-[#FFC107] opacity-[0.15] blur-[150px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 w-[96%] max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between">
        
        {/* Left Content (Text) */}
        <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-start text-center lg:text-left z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold !text-white leading-tight tracking-tight drop-shadow-md"
          >
            Rent Your <br/>
            <span className="text-[#FFC107]">Perfect Ride,</span><br/>
            Anytime
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg !text-gray-200 max-w-xs md:max-w-md mx-auto lg:mx-0 font-medium"
          >
            Choose from premium bikes and cars for daily, weekly, or monthly rentals.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 w-full"
          >
            <button 
              onClick={() => navigate('/taxi/user/rental')}
              className="px-6 py-3 bg-[#FFC107] text-black font-bold rounded-md hover:bg-[#e0a800] transition-colors flex items-center gap-2"
            >
              Explore Vehicles <ChevronRight size={18} />
            </button>
            <button 
              onClick={() => navigate('/taxi/user/rental')}
              className="px-6 py-3 bg-transparent border border-gray-600 text-white font-bold rounded-md hover:border-white transition-colors flex items-center gap-2"
            >
              Book Now <Calendar size={18} />
            </button>
          </motion.div>
        </div>

        {/* Center Content (Image) */}
        <div className="w-full lg:w-1/3 mt-12 lg:mt-0 relative flex justify-center items-center z-10">
          <div className="relative w-full flex justify-center items-center">
            {/* Subtle glow behind image */}
            <div className="absolute inset-0 bg-[#FFC107] opacity-20 blur-[100px] rounded-full" />
            <img 
              src={heroImg} 
              alt="Hero Car and Bike" 
              className="w-full max-w-[500px] lg:max-w-none h-auto object-contain relative z-10 mix-blend-screen drop-shadow-2xl scale-[1.2] lg:scale-[1.45] xl:scale-[1.6]"
            />
          </div>
        </div>

        {/* Right Content (Cards) */}
        <div 
          className="w-full lg:w-1/3 mt-12 lg:mt-0 flex flex-col items-center lg:items-end justify-center gap-6 z-10"
        >
          {/* Stat 1 */}
          <div className="flex items-center gap-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 w-full max-w-xs hover:bg-white/10 transition-colors shadow-lg">
             <div className="text-[#FFC107]">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>
             </div>
             <div>
               <h4 className="text-2xl font-extrabold !text-white leading-tight">500+</h4>
               <p className="text-sm font-medium !text-gray-400">Vehicles</p>
             </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 w-full max-w-xs hover:bg-white/10 transition-colors shadow-lg">
             <div className="text-[#FFC107]">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
             </div>
             <div>
               <h4 className="text-2xl font-extrabold !text-white leading-tight">24/7</h4>
               <p className="text-sm font-medium !text-gray-400">Support</p>
             </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 w-full max-w-xs hover:bg-white/10 transition-colors shadow-lg">
             <div className="text-[#FFC107]">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
             </div>
             <div>
               <h4 className="text-xl font-extrabold !text-white leading-tight">Best Price</h4>
               <p className="text-sm font-medium !text-gray-400">Guarantee</p>
             </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default LandingHero;
