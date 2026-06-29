import React from 'react';
import mockupImg from '../../../../assets/images/mobile_app_mockup.png';
import { Apple, Play } from 'lucide-react';

const AppDownloadSection = () => {
  return (
    <section className="w-full bg-[#111111] pt-10 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        
        {/* Left Content */}
        <div className="w-full md:w-1/2 text-center md:text-left pb-10 md:pb-20 z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
            Book Vehicles <br/>
            <span className="text-[#FFC107]">On The Go</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto md:mx-0">
            Download the TAXI09 app and get exclusive offers, easy bookings and more!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            {/* App Store Button */}
            <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-white px-6 py-3 rounded-lg w-[200px] justify-center">
              <Apple size={28} />
              <div className="text-left">
                <div className="text-[10px] text-gray-300">Download on the</div>
                <div className="text-sm font-bold leading-none mt-0.5">App Store</div>
              </div>
            </button>
            
            {/* Play Store Button */}
            <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-white px-6 py-3 rounded-lg w-[200px] justify-center">
              <Play size={28} className="fill-current" />
              <div className="text-left">
                <div className="text-[10px] text-gray-300">GET IT ON</div>
                <div className="text-sm font-bold leading-none mt-0.5">Google Play</div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Mockup */}
        <div className="w-full md:w-1/2 relative mt-6 md:mt-0 flex justify-center md:justify-end z-10">
          <img src={mockupImg} alt="Mobile App Mockup" className="max-w-[350px] w-full h-auto object-contain transform translate-y-8 md:translate-y-16" />
        </div>

        {/* Glow */}
        <div className="absolute right-0 bottom-0 w-1/2 h-[500px] bg-[#FFC107] opacity-10 blur-[100px] rounded-full pointer-events-none" />
      </div>
    </section>
  );
};

export default AppDownloadSection;
