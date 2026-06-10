import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { userService } from '../../services/userService';
import motorcycleImg from '@/assets/images/motorcycle_category.png';
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

const BikeCategoriesSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        setLoading(true);
        const response = await userService.getRentalVehicleSubcategories();
        const results = response?.data?.results || response?.results || [];
        setSubcategories(results);
      } catch (error) {
        console.error('Failed to load subcategories', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubcategories();
  }, []);

  const handleSelectCategory = (categoryId) => {
    navigate('/taxi/user/rental/bikes-list', {
      state: {
        categoryId: categoryId
      }
    });
  };

  const fallbackCategories = [
    {
      id: 'motorcycles',
      title: 'MOTORCYCLES',
      image: motorcycleImg,
      bgClass: 'bg-gradient-to-br from-[#FFEBE6] to-[#FFF0E6]',
      borderClass: 'border-[#FFDCD2]/40',
      imageScale: 'scale-115'
    },
    {
      id: 'scooters',
      title: 'SCOOTERS',
      image: scooterImg,
      bgClass: 'bg-gradient-to-br from-[#E8ECEF] to-[#DCE2E7]',
      borderClass: 'border-[#CFD9E1]/40',
      imageScale: 'scale-110'
    },
    {
      id: 'ev',
      title: 'EV',
      image: evImg,
      bgClass: 'bg-gradient-to-br from-[#E2ECE9] to-[#D5E5E0]',
      borderClass: 'border-[#C8DDD7]/40',
      imageScale: 'scale-110'
    }
  ];

  const categories = subcategories.length > 0
    ? subcategories.map((cat) => {
        const nameLower = cat.name.toLowerCase();
        let fallbackImg = motorcycleImg;
        if (nameLower.includes('scoot')) {
          fallbackImg = scooterImg;
        } else if (nameLower.includes('ev') || nameLower.includes('elect')) {
          fallbackImg = evImg;
        }

        return {
          id: cat.id || cat._id,
          title: cat.name.toUpperCase(),
          image: cat.image || fallbackImg,
          bgClass: cat.bgClass || 'bg-gradient-to-br from-[#FFEBE6] to-[#FFF0E6]',
          borderClass: cat.borderClass || 'border-[#FFDCD2]/40',
          imageScale: cat.imageScale || 'scale-110'
        };
      })
    : fallbackCategories;

  if (loading && subcategories.length === 0) {
    return (
      <div className="min-h-screen bg-white max-w-lg mx-auto flex items-center justify-center font-sans">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={32} />
          <p className="text-xs text-slate-500 font-semibold">Loading Categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto font-sans relative overflow-x-hidden pb-12 flex flex-col no-scrollbar">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-4 border-b border-slate-50 shrink-0 sticky top-0 bg-white z-30">
        <button
          onClick={() => navigate('/taxi/user/rental/type')}
          className="text-slate-800 hover:opacity-75 transition-opacity py-1 pr-1 shrink-0"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">Explore Product</h1>
      </div>

      {/* Categories List */}
      <div className="flex-1 px-5 py-6 space-y-5">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: idx * 0.1, ease: 'easeOut' }}
            whileHover={{ y: -4 }}
            onClick={() => handleSelectCategory(cat.id)}
            className={`w-full h-[180px] rounded-[24px] border ${cat.borderClass} ${cat.bgClass} p-5 relative overflow-hidden flex items-center justify-center cursor-pointer group shadow-[0_8px_24px_rgba(15,23,42,0.02)] hover:shadow-lg transition-shadow duration-300`}
          >
            {/* Building Skyline Background Sketch */}
            <SkylineSVG />

            {/* Title Text */}
            <div className="absolute top-5 left-5 z-20">
              <span className="text-[15px] font-bold tracking-wider text-slate-800 opacity-90 block">
                {cat.title}
              </span>
            </div>

            {/* Vehicle Image - Centered & Blended */}
            <div className="w-full h-full pt-6 flex items-center justify-center z-10 select-none pointer-events-none">
              <motion.img
                src={cat.image}
                alt={cat.title}
                className={`h-full max-h-[125px] object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 ${cat.imageScale}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BikeCategoriesSelection;
