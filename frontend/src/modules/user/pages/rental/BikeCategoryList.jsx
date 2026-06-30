import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, X, Home as HomeIcon, MapPin, Headphones, Menu, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';

// Import images
import hornetImg from '@/assets/images/hornet_2.png';
import nx200Img from '@/assets/images/nx200.png';
import sp160Img from '@/assets/images/sp160.png';
import scooterImg from '@/assets/images/scooter_category.png';
import evImg from '@/assets/images/ev_category.png';

const SkylineSVG = () => (
  <svg 
    className="absolute bottom-0 left-0 right-0 w-full h-[120px] text-slate-800/[0.04] pointer-events-none select-none z-0" 
    viewBox="0 0 400 100" 
    fill="currentColor" 
    preserveAspectRatio="none"
  >
    <path d="M0 100h400V45h-10v15h-8V30H360v40h-8V20h-20v45h-6V10h-25v50h-10V35H260v35h-8V15h-22v50h-5V5h-25v60h-10V25H160v40h-8V10h-22v45h-6V30H100v45h-10V15H70v50h-8V25H40v40h-5V5H10v95z" />
  </svg>
);

const getPriceAndDayOnwards = (v) => {
  const activePricing = (v.pricing || []).filter(p => p.active !== false);
  if (!activePricing.length) return 0;
  const dailyPkg = activePricing.find(p => p.durationHours === 24);
  if (dailyPkg) return dailyPkg.price;
  return Math.min(...activePricing.map(p => p.price));
};

const BikeCategoryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [realVehicles, setRealVehicles] = useState([]);

  // Extract selected category from state (default to motorcycles)
  const categoryId = location.state?.categoryId || 'motorcycles';

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await userService.getRentalVehicles();
        const results = response?.data?.results || response?.results || [];
        setRealVehicles(results);
      } catch (error) {
        console.error('Failed to load rental vehicles', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const categoryTitle = useMemo(() => {
    if (categoryId === 'motorcycles') return 'Motorcycles';
    if (categoryId === 'scooters') return 'Scooters';
    if (categoryId === 'ev') return 'EV';
    
    // Try to find it in the loaded vehicles
    const matchingVehicle = realVehicles.find(v => String(v.rentalSubcategoryId) === String(categoryId));
    if (matchingVehicle && matchingVehicle.rentalSubcategoryName) {
      return matchingVehicle.rentalSubcategoryName;
    }
    return 'Two-Wheelers';
  }, [categoryId, realVehicles]);

  const vehiclesData = useMemo(() => {
    return {
      motorcycles: [
        {
          id: 'bike-hornet',
          name: 'HORNET 2.0',
          fullName: 'Honda Hornet 2.0',
          image: hornetImg,
          price: 180,
          bgClass: 'bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1]',
          borderClass: 'border-slate-200/40',
          imageScale: 'scale-115'
        },
        {
          id: 'bike-nx200',
          name: 'NX200',
          fullName: 'Honda NX200',
          image: nx200Img,
          price: 210,
          bgClass: 'bg-gradient-to-br from-[#FFEBE6] to-[#FFF0E6]',
          borderClass: 'border-[#FFDCD2]/40',
          imageScale: 'scale-110'
        },
        {
          id: 'bike-sp160',
          name: 'SP160',
          fullName: 'Honda SP160',
          image: sp160Img,
          price: 160,
          bgClass: 'bg-gradient-to-br from-[#E2ECE9] to-[#D5E5E0]',
          borderClass: 'border-[#C8DDD7]/40',
          imageScale: 'scale-110'
        }
      ],
      scooters: [
        {
          id: 'bike-activa',
          name: 'ACTIVA 6G',
          fullName: 'Honda Activa 6G',
          image: scooterImg,
          price: 120,
          bgClass: 'bg-gradient-to-br from-[#E8ECEF] to-[#DCE2E7]',
          borderClass: 'border-[#CFD9E1]/40',
          imageScale: 'scale-110'
        },
        {
          id: 'bike-dio',
          name: 'DIO 125',
          fullName: 'Honda Dio 125',
          image: scooterImg,
          price: 130,
          bgClass: 'bg-gradient-to-br from-[#FFEBE6] to-[#FFF0E6]',
          borderClass: 'border-[#FFDCD2]/40',
          imageScale: 'scale-110'
        }
      ],
      ev: [
        {
          id: 'bike-ather',
          name: 'ATHER 450X',
          fullName: 'Ather 450X Electric',
          image: evImg,
          price: 150,
          bgClass: 'bg-gradient-to-br from-[#E2ECE9] to-[#D5E5E0]',
          borderClass: 'border-[#C8DDD7]/40',
          imageScale: 'scale-110'
        },
        {
          id: 'bike-olas1',
          name: 'OLA S1 PRO',
          fullName: 'Ola S1 Pro Electric',
          image: evImg,
          price: 140,
          bgClass: 'bg-gradient-to-br from-[#E8ECEF] to-[#DCE2E7]',
          borderClass: 'border-[#CFD9E1]/40',
          imageScale: 'scale-110'
        }
      ]
    };
  }, []);

  const displayedVehicles = useMemo(() => {
    if (['motorcycles', 'scooters', 'ev'].includes(categoryId)) {
      const list = vehiclesData[categoryId] || [];
      if (!searchQuery) return list;
      return list.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const list = realVehicles
      .filter(v => String(v.rentalSubcategoryId) === String(categoryId))
      .map(v => ({
        ...v,
        id: v.id || v._id,
        name: v.name.toUpperCase(),
        fullName: v.name,
        image: v.image || (categoryTitle.toLowerCase().includes('scoot') ? scooterImg : categoryTitle.toLowerCase().includes('ev') ? evImg : hornetImg),
        price: getPriceAndDayOnwards(v),
        bgClass: 'bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1]',
        borderClass: 'border-slate-200/40',
        imageScale: 'scale-110'
      }));

    if (!searchQuery) return list;
    return list.filter(v => 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categoryId, searchQuery, vehiclesData, realVehicles, categoryTitle]);

  const handleSelectVehicle = (v) => {
    if (String(v.id).startsWith('bike-')) {
      const normalizedVehicle = {
        id: v.id,
        name: v.fullName,
        vehicleCategory: 'bike',
        coverImage: v.image,
        image: v.image,
        rating: '4.8',
        fuel: 'Self-drive · Helmet included',
        prices: {
          Hourly: Math.round(v.price / 8),
          'Half-Day': Math.round(v.price / 2),
          Daily: v.price
        },
        kmLimit: {
          Hourly: '15 km',
          'Half-Day': '60 km',
          Daily: '120 km'
        },
        features: ['Helmet included', 'USB Charger', 'Keyless start'],
        gradientFrom: '#FFF7ED',
        gradientTo: '#FFFFFF',
        rawPricing: [
          { durationHours: 1, price: Math.round(v.price / 8), includedKm: 15, active: true },
          { durationHours: 6, price: Math.round(v.price / 2), includedKm: 60, active: true },
          { durationHours: 24, price: v.price, includedKm: 120, active: true }
        ]
      };

      navigate('/taxi/user/rental/vehicle', {
        state: {
          vehicle: JSON.parse(JSON.stringify(normalizedVehicle)),
          duration: 'Daily'
        }
      });
      return;
    }

    const activePricing = (v.pricing || []).filter(p => p.active !== false);
    const dailyPrice = getPriceAndDayOnwards(v);
    const normalizedVehicle = {
      ...v,
      id: v.id || v._id,
      name: v.name,
      vehicleCategory: 'bike',
      coverImage: v.coverImage || v.image,
      image: v.image,
      rating: '4.8',
      fuel: v.short_description || 'Self-drive · Helmet included',
      prices: {
        Hourly: activePricing.find(p => p.durationHours === 1)?.price || Math.round(dailyPrice / 8),
        'Half-Day': activePricing.find(p => p.durationHours === 12)?.price || Math.round(dailyPrice / 2),
        Daily: dailyPrice
      },
      kmLimit: {
        Hourly: `${activePricing.find(p => p.durationHours === 1)?.includedKm || 15} km`,
        'Half-Day': `${activePricing.find(p => p.durationHours === 12)?.includedKm || 120} km`,
        Daily: `${activePricing.find(p => p.durationHours === 24)?.includedKm || 240} km`
      },
      features: v.amenities?.length ? v.amenities : ['Helmet included', 'USB Charger', 'Keyless start'],
      gradientFrom: '#FFF7ED',
      gradientTo: '#FFFFFF',
      rawPricing: activePricing
    };

    navigate('/taxi/user/rental/vehicle', {
      state: {
        vehicle: JSON.parse(JSON.stringify(normalizedVehicle)),
        duration: 'Daily'
      }
    });
  };

  if (loading && realVehicles.length === 0 && !['motorcycles', 'scooters', 'ev'].includes(categoryId)) {
    return (
      <div className="min-h-screen bg-white max-w-lg md:max-w-none md:mx-0 w-full mx-auto flex items-center justify-center font-sans">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={32} />
          <p className="text-xs text-slate-500 font-semibold">Loading Vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-lg md:max-w-none md:mx-0 w-full mx-auto font-sans relative overflow-x-hidden pb-24 flex flex-col no-scrollbar">
      {/* Header Block */}
      <div className="sticky top-0 bg-white z-30 border-b border-slate-50 shrink-0">
        <div className="px-4 pt-6 pb-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/taxi/user/rental/bike-categories')}
            className="text-slate-800 hover:opacity-75 transition-opacity py-1 pr-1 shrink-0"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">{categoryTitle}</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3 pt-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} strokeWidth={2.2} />
            </span>
            <input
              type="text"
              placeholder="Search for Vehicle"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F3F4F6] border-0 rounded-xl pl-10 pr-10 py-2.5 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-slate-100 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vehicles List Container */}
      <div className="flex-1 px-5 py-5 space-y-4 overflow-y-auto no-scrollbar">
        {displayedVehicles.map((v, idx) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            whileHover={{ y: -3 }}
            onClick={() => handleSelectVehicle(v)}
            className={`w-full h-[180px] rounded-[24px] border ${v.borderClass} ${v.bgClass} p-5 relative overflow-hidden flex items-center justify-center cursor-pointer group shadow-[0_8px_24px_rgba(15,23,42,0.01)] hover:shadow-md transition-shadow duration-300`}
          >
            {/* Skyline SVG sketch overlay */}
            <SkylineSVG />

            {/* Vehicle Name Tag */}
            <div className="absolute top-5 left-5 z-20">
              <span className="text-[15px] font-bold tracking-wider text-slate-800 opacity-90 block uppercase">
                {v.name}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                ₹{v.price}/day onwards
              </span>
            </div>

            {/* Centered vehicle image with blend multiply */}
            <div className="w-full h-full pt-6 flex items-center justify-center z-10 select-none pointer-events-none">
              <motion.img
                src={v.image}
                alt={v.fullName}
                className={`h-full max-h-[125px] object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 ${v.imageScale}`}
              />
            </div>
          </motion.div>
        ))}

        {displayedVehicles.length === 0 && (
          <div className="py-12 text-center text-slate-400 font-medium text-[13px]">
            No vehicles matched "{searchQuery}"
          </div>
        )}
      </div>

      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] z-40 max-w-lg md:max-w-none md:mx-0 w-full mx-auto flex items-center justify-between px-6">
        <button
          onClick={() => navigate('/taxi/user')}
          className="flex flex-col items-center gap-1 text-[#E53935] hover:opacity-90 py-1"
        >
          <HomeIcon size={20} strokeWidth={2.2} />
          <span className="text-[10px] font-bold tracking-wide">Home</span>
        </button>

        <button
          onClick={() => toast('Showing nearby rental stations...', { icon: '📍' })}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 py-1"
        >
          <MapPin size={20} strokeWidth={2.2} />
          <span className="text-[10px] font-bold tracking-wide">Nearby</span>
        </button>

        <button
          onClick={() => navigate('/taxi/user/support')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 py-1"
        >
          <Headphones size={20} strokeWidth={2.2} />
          <span className="text-[10px] font-bold tracking-wide">Support</span>
        </button>

        <button
          onClick={() => navigate('/taxi/user/profile')}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 py-1"
        >
          <Menu size={20} strokeWidth={2.2} />
          <span className="text-[10px] font-bold tracking-wide">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default BikeCategoryList;
