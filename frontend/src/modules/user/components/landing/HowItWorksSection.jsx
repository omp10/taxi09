import React from 'react';
import { CarFront, CalendarClock, FileCheck, Key } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      id: 1,
      icon: <CarFront size={28} />,
      title: 'Select Vehicle',
      desc: 'Choose your favorite bike or car.'
    },
    {
      id: 2,
      icon: <CalendarClock size={28} />,
      title: 'Choose Duration',
      desc: 'Select rental duration that suits you.'
    },
    {
      id: 3,
      icon: <FileCheck size={28} />,
      title: 'Upload Documents',
      desc: 'Submit required documents online.'
    },
    {
      id: 4,
      icon: <Key size={28} />,
      title: 'Start Your Journey',
      desc: 'Get your vehicle and enjoy the ride.'
    }
  ];

  return (
    <section className="w-full bg-[#111111] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-px w-12 bg-white/20" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">How It Works</h2>
            <div className="h-px w-12 bg-white/20" />
          </div>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
          {/* Desktop Connecting Line */}
          <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-[1px] border-t border-dashed border-[#FFC107]/50" />
          
          {steps.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center text-center z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-[#FFC107] flex items-center justify-center text-[#FFC107] shadow-[0_0_20px_rgba(255,193,7,0.15)] mb-4">
                  {step.icon}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center border-2 border-[#111111]">
                  {step.id}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 max-w-[200px] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
