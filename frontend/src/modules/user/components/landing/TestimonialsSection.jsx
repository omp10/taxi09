import React from 'react';
import { Star, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Rohit Sharma',
      rating: 5,
      text: 'Amazing experience! The bike was in perfect condition and the process was super smooth.',
      avatar: 'https://i.pravatar.cc/150?img=11'
    },
    {
      id: 2,
      name: 'Priya Mehta',
      rating: 5,
      text: 'Rented a car for a weekend trip. Great service and very affordable pricing.',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    {
      id: 3,
      name: 'Arjun Verma',
      rating: 5,
      text: '24/7 support is awesome. Got help immediately when I needed it.',
      avatar: 'https://i.pravatar.cc/150?img=12'
    }
  ];

  return (
    <section className="w-full bg-[#f8f9fa] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-px w-8 bg-black/20" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">What Our Customers Say</h2>
            <div className="h-px w-8 bg-black/20" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
              <Quote className="absolute top-6 right-6 text-[#FFC107] opacity-20" size={40} />
              
              <div className="flex items-center gap-4 mb-6">
                <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold text-black">{t.name}</h4>
                  <div className="flex text-[#FFC107] mt-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm leading-relaxed relative z-10">
                "{t.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
