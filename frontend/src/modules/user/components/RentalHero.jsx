import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bmwImg from '../../../assets/images/bmw.png';

const RentalHero = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rental');

  return (
    <div className="relative w-full overflow-hidden bg-white pt-8 pb-16 md:pt-12 md:pb-20">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-[#fff4cc] blur-3xl opacity-60" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-[#ffea99] blur-3xl opacity-60" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left Side: Search Card */}
        <div className="w-full max-w-md flex-shrink-0">
          <div className="flex items-center justify-center mb-8">
             <div className="inline-flex items-center rounded-full border border-[#ffe066] bg-[#fff9e6] p-1 text-xs font-semibold text-amber-800">
                <span className="px-3 py-1">Car Rental In India</span>
                <button className="rounded-full bg-[#FFC107] px-3 py-1 text-slate-900 transition-colors hover:bg-amber-400">
                  Learn More
                </button>
             </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white p-6 shadow-2xl shadow-amber-900/5 border border-slate-100"
          >
            {/* Toggle */}
            <div className="relative flex rounded-xl bg-[#FFC107] p-1 shadow-inner">
              <button
                onClick={() => setActiveTab('rental')}
                className={`relative flex-1 rounded-lg py-3 text-center text-sm transition-colors ${
                  activeTab === 'rental' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-800 hover:bg-white/50'
                }`}
              >
                <div className="font-bold">Rental</div>
                <div className="text-[10px] opacity-80">For hours & days</div>
                {activeTab === 'rental' && (
                  <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`relative flex-1 rounded-lg py-3 text-center text-sm transition-colors ${
                  activeTab === 'subscriptions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-800 hover:bg-white/50'
                }`}
              >
                <div className="font-bold">Subscriptions</div>
                <div className="text-[10px] opacity-80">For more than 7 days</div>
                {activeTab === 'subscriptions' && (
                  <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
                )}
              </button>
            </div>

            {/* Logo area */}
            <div className="my-8 flex justify-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
                <span className="text-[#FFC107]">R</span>entals
              </h2>
            </div>

            {/* Search Input */}
            <div 
              onClick={() => navigate('/taxi/user/rental')}
              className="flex cursor-pointer items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-[#FFC107] hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFC107] text-slate-900 shadow-sm">
                  <MapPin size={16} />
                </div>
                <span className="text-sm font-medium text-slate-500">Select location to search</span>
              </div>
              <ArrowRight size={20} className="text-slate-800" />
            </div>
          </motion.div>
        </div>

        {/* Right Side: Promo */}
        <div className="flex-1 mt-8 md:mt-0 pt-8 md:pt-16 relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
              Subscribe a car <span className="text-[#FFC107]">@ ₹570</span><span className="text-amber-500 text-2xl font-semibold">/day</span>
            </h1>

            <div className="space-y-4 mb-8">
              {[
                'Only ₹5,000 refundable deposit',
                'No loan liability, Zero downpayment',
                'Insurance & maintenance included'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFC107] text-slate-900">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-base font-semibold text-slate-700">{text}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/taxi/user/rental')}
              className="rounded-md bg-[#FFC107] px-6 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400 flex items-center gap-2 shadow-sm"
            >
              View cars <ArrowRight size={16} />
            </button>
          </motion.div>

          {/* Car Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="mt-8 md:absolute md:-bottom-12 md:-right-10 md:w-[600px] lg:w-[700px] z-20"
          >
            <img 
              src={bmwImg}
              alt="White BMW" 
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RentalHero;
