import React from 'react';
import { ShieldCheck, Tag, Zap, HeadphonesIcon } from 'lucide-react';

const WhyChooseUsSection = () => {
  const reasons = [
    {
      id: 1,
      icon: <ShieldCheck size={32} className="text-[#FFC107]" />,
      title: 'Verified Vehicles',
      desc: 'All vehicles are verified and well-maintained for your safety.'
    },
    {
      id: 2,
      icon: <Tag size={32} className="text-[#FFC107]" />,
      title: 'Affordable Pricing',
      desc: 'Best prices in the market with no hidden charges.'
    },
    {
      id: 3,
      icon: <Zap size={32} className="text-[#FFC107]" />,
      title: 'Instant Booking',
      desc: 'Quick and easy booking process in just a few clicks.'
    },
    {
      id: 4,
      icon: <HeadphonesIcon size={32} className="text-[#FFC107]" />,
      title: '24/7 Roadside Assistance',
      desc: "We're here for you anytime, anywhere."
    }
  ];

  return (
    <section className="w-full bg-[#111111] py-10 px-4 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-px w-8 bg-white/20" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Why Choose Us</h2>
            <div className="h-px w-8 bg-white/20" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reasons.map((reason) => (
            <div key={reason.id} className="bg-transparent border border-white/10 hover:border-[#FFC107]/50 rounded-xl p-5 transition-colors group flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {reason.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#FFC107] transition-colors">{reason.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{reason.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
