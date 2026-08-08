import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import contentService from '../services/contentService';
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Languages,
  MapPin,
  Medal,
  ShieldCheck,
  Star,
  UserCheck,
} from 'lucide-react';
import BottomNavbar from '../components/BottomNavbar';

const FALLBACK_DRIVERS = [
  {
    name: 'Rohit Sharma',
    rating: '4.9',
    badge: 'Top Rated',
    eta: '18 min',
    distance: '6.2 km away',
    experience: '6+ Years',
    trips: '3200+ Trips',
    language: 'Hindi, English',
    car: 'Toyota Innova Crysta',
    plate: 'MP09 AB 1234',
  },
  {
    name: 'Aman Verma',
    rating: '4.8',
    badge: 'Experienced',
    eta: '22 min',
    distance: '7.3 km away',
    experience: '5+ Years',
    trips: '2800+ Trips',
    language: 'Hindi, English',
    car: 'Mahindra XUV700',
    plate: 'MP09 CD 5678',
  },
  {
    name: 'Vikram Singh',
    rating: '4.7',
    badge: 'Very Reliable',
    eta: '24 min',
    distance: '8.1 km away',
    experience: '7+ Years',
    trips: '4100+ Trips',
    language: 'Hindi, English',
    car: 'Toyota Fortuner',
    plate: 'MP09 EF 9123',
  },
];

// Real drivers in working attire - uniform/formal shirt, face to camera.
// Studio fashion headshots and driving-POV shots both read wrong here.
const driverImages = [
  '/taxi09_driver_d3.jpg',
  '/taxi09_driver_d2.jpg',
  '/taxi09_driver_p3.jpg',
  '/taxi09_driver_d1.jpg',
  '/taxi09_driver_p2.jpg',
];

/** API records use languages[]/vehicleName/etaMinutes; the card expects flat strings. */
const fromApi = (item) => ({
  ...item,
  language: (item.languages || []).join(', '),
  car: item.vehicleName,
  plate: item.vehiclePlate,
  eta: item.etaMinutes ? `${item.etaMinutes} min` : '',
  distance: item.distanceKm ? `${item.distanceKm} km away` : '',
  trips: item.trips ? `${item.trips} Trips` : '',
  rating: String(item.rating ?? ''),
});

const PermanentDriverSearch = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState(FALLBACK_DRIVERS);

  useEffect(() => {
    let active = true;
    contentService.getHireDrivers('permanent', FALLBACK_DRIVERS).then((results) => {
      if (active) setDrivers(results.map((item) => (item.slug ? fromApi(item) : item)));
    });
    return () => {
      active = false;
    };
  }, []);
  const [sortBy, setSortBy] = useState('Best Match');
  const [showSort, setShowSort] = useState(false);

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#f7f8fb] text-slate-950 font-sans pb-24 shadow-2xl border-x border-slate-100">
      <header className="sticky top-0 z-50 flex h-[58px] items-center justify-between bg-white/95 px-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate('/taxi/user/with-driver')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_5px_14px_rgba(15,23,42,0.08)]"
        >
          <ArrowLeft size={18} strokeWidth={2.6} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/taxi/user')}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center leading-none"
        >
          <span className="text-[21px] font-extrabold italic tracking-[-0.04em]">
            TAXI<span className="text-[#f5b700]">09</span>
          </span>
          <span className="mt-0.5 text-[8px] font-semibold text-slate-700">Driver On Hire</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/taxi/user/notifications')}
          className="relative flex h-9 w-9 items-center justify-center"
        >
          <Bell size={19} strokeWidth={2.4} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </header>

      <main className="px-3">
        <section className="flex items-center justify-end gap-2 py-2">
          <span className="text-[10px] font-semibold text-slate-700">Step 2 of 5</span>
          <span className="h-1.5 w-6 rounded-full bg-[#f5b700]" />
          <span className="h-1.5 w-6 rounded-full bg-[#f5b700]" />
          <span className="h-1.5 w-2 rounded-full bg-slate-200" />
          <span className="h-1.5 w-2 rounded-full bg-slate-200" />
          <span className="h-1.5 w-2 rounded-full bg-slate-200" />
        </section>

        <section className="relative min-h-[172px] overflow-hidden rounded-[18px] bg-[#080808] p-4 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
          <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full border border-[#f5b700]/45" />
          <div className="absolute right-3 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border border-[#f5b700]/55" />
          <div className="absolute right-12 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border border-[#f5b700]/70" />
          <span className="absolute right-[74px] top-[72px] flex h-10 w-10 items-center justify-center rounded-full bg-[#f5b700] text-black shadow-[0_0_34px_rgba(245,183,0,0.48)]">
            <Car size={22} strokeWidth={2.7} />
          </span>
          {[18, 42, 70, 105, 130].map((top, index) => (
            <span
              key={top}
              className="absolute flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white bg-white"
              style={{ right: `${16 + (index % 2) * 88}px`, top }}
            >
              <img src={driverImages[index % driverImages.length]} alt="" className="h-full w-full object-cover" />
            </span>
          ))}
          <div className="relative z-10 max-w-[56%]">
            <h1 className="text-[22px] font-extrabold leading-tight">
              Finding the best <span className="text-[#f5b700]">driver for you...</span>
            </h1>
            <p className="mt-3 text-[11px] font-medium leading-4 text-white/78">
              Please wait while we find verified drivers near you.
            </p>
            <div className="mt-4 space-y-1.5">
              {['Searching nearby drivers', 'Checking availability', 'Matching preferences', 'Finalizing best matches'].map((text, index) => (
                <p key={text} className="flex items-center gap-2 text-[9px] font-semibold text-white/86">
                  {index < 3 ? <CheckCircle2 size={12} className="text-[#f5b700]" fill="#f5b700" /> : <span className="h-3 w-3 rounded-full border-2 border-white/50 border-t-[#f5b700]" />}
                  {text}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-3 flex items-center gap-3 rounded-[14px] border border-[#f5b700]/45 bg-[#fff8df] p-3 shadow-[0_6px_18px_rgba(245,183,0,0.08)]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5b700] text-black">
            <ShieldCheck size={21} strokeWidth={2.6} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold">All our drivers are Police Verified & Background Checked</p>
            <p className="mt-0.5 text-[9px] font-medium text-slate-600">Your safety is our top priority</p>
          </div>
          <ShieldCheck size={27} className="text-[#f5b700]" strokeWidth={2.4} />
        </section>

        <section className="relative mt-4 flex items-center justify-between">
          <h2 className="text-[14px] font-bold">Top Drivers For Your Trip</h2>
          <button
            type="button"
            onClick={() => setShowSort((current) => !current)}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-600"
          >
            Sort by: <span className="text-slate-950">{sortBy}</span>
            <ChevronDown size={13} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-7 z-20 w-32 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
              {['Best Match', 'Fastest ETA', 'Top Rated'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSortBy(option);
                    setShowSort(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-[11px] font-semibold hover:bg-[#fff8df]"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-2 space-y-3">
          {drivers.map((driver, index) => (
            <article key={driver.name} className="overflow-hidden rounded-[16px] border border-slate-100 bg-white p-2 shadow-[0_7px_20px_rgba(15,23,42,0.06)]">
              <div className="grid grid-cols-[78px_1fr_72px] gap-2">
                <div className="overflow-hidden rounded-[13px] bg-slate-100">
                  <img src={driver.photo || driverImages[index % driverImages.length]} alt={driver.name} className="h-full min-h-[104px] w-full object-cover object-top" />
                </div>
                <div className="min-w-0 py-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-[13px] font-bold">{driver.name}</h3>
                    <Star size={12} className="text-[#f5b700]" fill="#f5b700" />
                    <span className="text-[11px] font-semibold">{driver.rating}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700">{driver.badge}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] font-semibold text-slate-600">
                    <span className="flex items-center gap-1"><ShieldCheck size={11} />{driver.experience}</span>
                    <span className="flex items-center gap-1"><Car size={11} />{driver.trips}</span>
                    <span className="flex items-center gap-1"><Medal size={11} />Experienced</span>
                    <span className="flex items-center gap-1"><Languages size={11} />{driver.language}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[8.5px] font-semibold text-slate-600">
                    <span className="rounded-md bg-slate-50 px-1.5 py-1">{driver.car}</span>
                    <span className="rounded-md bg-slate-50 px-1.5 py-1">{driver.plate}</span>
                  </div>
                </div>
                <div className="rounded-[13px] bg-slate-50 p-2 text-center">
                  <p className="text-[8px] font-semibold text-slate-500">ETA</p>
                  <p className="text-[12px] font-bold">{driver.eta}</p>
                  <p className="mt-1 text-[8px] font-semibold text-slate-500">Distance</p>
                  <p className="text-[10px] font-semibold">{driver.distance}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/taxi/user/with-driver/permanent/confirm', {
                      state: {
                        driver,
                        driverImage: driver.photo || driverImages[index % driverImages.length],
                      },
                    })}
                    className="mt-2 h-8 w-full rounded-lg bg-[#f5b700] text-[10px] font-bold text-black"
                  >
                    Select Driver
                  </button>
                  <button type="button" className="mt-1 text-[8px] font-semibold text-slate-500">
                    View Profile
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-3 flex items-center gap-3 rounded-[15px] border border-[#f5b700]/35 bg-[#fff8df] p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#d99c00]">
            <Bell size={18} strokeWidth={2.5} />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold">Can't find a match?</p>
            <p className="text-[9px] font-medium text-slate-600">We'll notify you when a driver becomes available.</p>
          </div>
          <button type="button" className="rounded-lg border border-[#f5b700] bg-white px-3 py-2 text-[10px] font-bold text-slate-900">
            Notify Me
          </button>
        </section>
      </main>

      <BottomNavbar />
    </div>
  );
};

export default PermanentDriverSearch;
