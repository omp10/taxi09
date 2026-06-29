import React from 'react';
import { ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bikeImg from '../../../../assets/images/yellow_sports_bike.png';
import carImg from '../../../../assets/images/yellow_sports_car.png';
import bmwImg from '../../../../assets/images/bmw.png';
import hyundaiImg from '../../../../assets/images/hyundai_aura_nobg.png';

const FeaturedVehiclesSection = () => {
  const navigate = useNavigate();

  const vehicles = [
    {
      id: 1,
      name: 'Yamaha R15 V4',
      type: 'Sports Bike',
      badge: 'Bike',
      rating: 4.8,
      reviews: 120,
      price: 799,
      image: bikeImg
    },
    {
      id: 2,
      name: 'Hyundai i20',
      type: 'Hatchback',
      badge: 'Car',
      rating: 4.6,
      reviews: 98,
      price: 1499,
      image: hyundaiImg
    },
    {
      id: 3,
      name: 'Kia Seltos',
      type: 'SUV',
      badge: 'SUV',
      rating: 4.7,
      reviews: 150,
      price: 2499,
      image: hyundaiImg
    },
    {
      id: 4,
      name: 'TVS Ntorq 125',
      type: 'Scooter',
      badge: 'Bike',
      rating: 4.5,
      reviews: 80,
      price: 499,
      image: bikeImg
    },
    {
      id: 5,
      name: 'BMW 3 Series',
      type: 'Luxury Car',
      badge: 'Car',
      rating: 4.9,
      reviews: 60,
      price: 4999,
      image: bmwImg
    }
  ];

  return (
    <section className="w-full bg-[#f8f9fa] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-black/20" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">Featured Vehicles</h2>
            <div className="h-px w-8 bg-black/20" />
          </div>
          <button 
            onClick={() => navigate('/taxi/user/rental')}
            className="bg-[#FFC107] text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-amber-400 transition-colors"
          >
            View All Vehicles <div className="bg-black text-[#FFC107] rounded-full p-0.5"><ChevronRight size={12} /></div>
          </button>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
          {vehicles.map((v) => (
            <div key={v.id} className="min-w-[260px] sm:min-w-[280px] bg-white rounded-xl p-4 shadow-sm border border-gray-100 snap-start flex flex-col group hover:shadow-md transition-shadow">
              <div className="flex justify-end mb-2">
                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">{v.badge}</span>
              </div>
              <div className="h-40 flex items-center justify-center mb-4">
                <img src={v.image} alt={v.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="mt-auto">
                <h3 className="text-lg font-bold text-black">{v.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{v.type}</p>
                
                <div className="flex items-center gap-1 mb-4">
                  <Star size={14} className="fill-[#FFC107] text-[#FFC107]" />
                  <span className="text-sm font-bold">{v.rating}</span>
                  <span className="text-xs text-gray-500">({v.reviews})</span>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-xl font-extrabold text-black">₹{v.price}</span>
                    <span className="text-xs text-gray-500 font-medium"> / day</span>
                  </div>
                  <button 
                    onClick={() => navigate('/taxi/user/rental')}
                    className="bg-[#FFC107] text-black px-4 py-2 rounded-md text-sm font-bold hover:bg-amber-400 transition-colors flex items-center gap-1"
                  >
                    Book Now <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedVehiclesSection;
