import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Gift,
  Heart,
  Home,
  Hotel,
  MapPin,
  Menu,
  Search,
  Star,
  Tag,
  User,
  Users,
} from 'lucide-react';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const destinations = [
  { city: 'Goa', price: 899, image: '/rajwada_palace.png', gradient: 'from-emerald-500/30 to-sky-900/70' },
  { city: 'Delhi', price: 699, image: '/temple.png', gradient: 'from-orange-500/25 to-slate-950/70' },
  { city: 'Mumbai', price: 799, image: '/taxi09_bus_hero_city.png', gradient: 'from-sky-500/25 to-slate-950/70' },
  { city: 'Udaipur', price: 899, image: '/services_hero.png', gradient: 'from-amber-500/25 to-slate-950/70' },
];

const offerCards = [
  { icon: <Tag size={16} strokeWidth={2.4} />, title: 'FLAT 10% OFF', subtitle: 'On All Bookings', code: 'HOTEL10', tone: 'bg-[#fff6dc] text-[#d08a00]' },
  { icon: <BriefcaseBusiness size={16} strokeWidth={2.4} />, title: 'UPTO 25% OFF', subtitle: 'On Business Hotels', code: 'BIZ25', tone: 'bg-[#e9f9ec] text-emerald-700' },
  { icon: <Gift size={16} strokeWidth={2.4} />, title: 'UPTO 40% OFF', subtitle: 'On First Booking', code: 'FIRST40', tone: 'bg-[#f4ebff] text-violet-700' },
];

const hotels = [
  {
    name: 'The Grand Orion',
    area: 'Connaught Place, New Delhi',
    distance: '2.3 km from City Centre',
    image: '/taxi09_hotel_hero.png',
    badge: 'Popular',
    rating: '4.5',
    reviews: '2.5K',
    oldPrice: 3499,
    price: 2649,
    off: '24% OFF',
  },
  {
    name: 'Hotel Sapphire Inn',
    area: 'Banjara Hills, Hyderabad',
    distance: '1.8 km from City Centre',
    image: '/premium_grid_map.png',
    badge: 'Best Value',
    rating: '4.2',
    reviews: '1.3K',
    oldPrice: 3299,
    price: 2739,
    off: '18% OFF',
  },
];

const HotelBottomNav = ({ routePrefix }) => {
  const navigate = useNavigate();
  const items = [
    { icon: <Home size={21} strokeWidth={2.2} />, centerIcon: <Home size={26} strokeWidth={2.5} />, label: 'Home', path: routePrefix || '/user' },
    { icon: <CalendarDays size={21} strokeWidth={2.2} />, centerIcon: <CalendarDays size={26} strokeWidth={2.5} />, label: 'Bookings', path: `${routePrefix}/activity` },
    { icon: <Hotel size={21} strokeWidth={2.2} />, centerIcon: <Hotel size={26} strokeWidth={2.5} />, label: 'Hotels', path: `${routePrefix}/hotel`, center: true },
    { icon: <Tag size={21} strokeWidth={2.2} />, centerIcon: <Tag size={26} strokeWidth={2.5} />, label: 'Offers', path: `${routePrefix}/promo` },
    { icon: <User size={21} strokeWidth={2.2} />, centerIcon: <User size={26} strokeWidth={2.5} />, label: 'Account', path: `${routePrefix}/profile` },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-lg bg-white px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
      <div className="flex items-end justify-around">
        {items.map(({ icon, centerIcon, label, path, center }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className="flex flex-1 flex-col items-center gap-1 text-slate-600"
          >
            <span
              className={
                center
                  ? '-mt-7 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#f5b700] text-slate-950 shadow-[0_8px_20px_rgba(245,183,0,0.42)] ring-4 ring-white'
                  : 'flex h-6 items-center justify-center'
              }
            >
              {center ? centerIcon : icon}
            </span>
            <span className={`text-[10px] ${center ? 'font-black text-slate-950' : 'font-semibold'}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const HotelHome = () => {
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const [destination, setDestination] = useState('Goa, India');
  const [checkIn, setCheckIn] = useState('2026-07-28');
  const [checkOut, setCheckOut] = useState('2026-07-29');
  const [mode, setMode] = useState('hotel');

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#f8fafc] pb-24 font-sans text-slate-950 shadow-2xl">
      <header className="bg-[#f5b700] px-3 pb-10 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-slate-950">
              <Menu size={21} strokeWidth={2.6} />
            </button>
            <p className="text-[25px] font-black italic leading-none tracking-tight">
              TAXI<span className="text-white">09</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="flex items-center gap-1 text-[11px] font-black">
              <Heart size={18} /> My Trips
            </button>
            <Bell size={19} strokeWidth={2.4} />
          </div>
        </div>

        <section className="relative mt-3 overflow-hidden rounded-[18px] bg-white shadow-[0_12px_28px_rgba(105,73,0,0.16)]">
          <img src="/taxi09_hotel_hero.png" alt="Hotel stay" className="absolute inset-0 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/86 via-43% to-transparent" />
          <div className="relative z-10 min-h-[162px] px-4 py-4">
            <div className="max-w-[48%]">
              <h1 className="text-[19px] font-black leading-[1.12]">Find the perfect stay for your trip</h1>
              <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">Comfortable stays. Best prices. Verified hotels.</p>
              <span className="mt-4 block h-1 w-12 rounded-full bg-[#f5b700]" />
            </div>

            <div className="absolute right-3 top-4 w-[105px] rounded-[16px] bg-[#f5b700] p-2.5 text-center shadow-[0_10px_22px_rgba(245,183,0,0.32)]">
              <Tag size={17} className="mx-auto" strokeWidth={2.6} />
              <p className="mt-1 text-[8px] font-black uppercase">Upto</p>
              <p className="text-[18px] font-black leading-none">40% OFF</p>
              <p className="mt-1 text-[7px] font-bold">On First Hotel Booking</p>
              <button type="button" className="mt-2 rounded-full bg-slate-950 px-3 py-1.5 text-[7px] font-black uppercase text-white">
                Book Now
              </button>
            </div>
          </div>
        </section>
      </header>

      <main className="-mt-8 px-3">
        <section className="rounded-[18px] bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.09)]">
          <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-3">
            {[
              ['hotel', <Hotel key="hotel-icon" size={14} strokeWidth={2.4} />, 'Hotels'],
              ['hourly', <ClockIcon key="hourly-icon" />, 'Hourly Stays'],
            ].map(([id, icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`flex items-center gap-2 rounded-[12px] px-3 py-2 text-[11px] font-black ${
                  mode === id ? 'bg-[#fff7d6] text-[#c48600]' : 'bg-slate-50 text-slate-600'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button type="button" className="col-span-1 rounded-[13px] border border-slate-100 px-2.5 py-2 text-left">
              <p className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">Destination</p>
              <div className="mt-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-500" />
                <select value={destination} onChange={(event) => setDestination(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[10px] font-black outline-none">
                  {['Goa, India', 'Delhi, India', 'Mumbai, India', 'Udaipur, India'].map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </div>
            </button>

            <label className="rounded-[13px] border border-slate-100 px-2.5 py-2 text-left">
              <p className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">Check-in</p>
              <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-1 w-full bg-transparent text-[9px] font-black outline-none" />
            </label>

            <label className="rounded-[13px] border border-slate-100 px-2.5 py-2 text-left">
              <p className="text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">Check-out</p>
              <input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1 w-full bg-transparent text-[9px] font-black outline-none" />
            </label>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_126px] gap-2">
            <button type="button" className="flex items-center justify-between rounded-[13px] border border-slate-100 px-3 py-3 text-left">
              <span className="flex items-center gap-2 text-[11px] font-black">
                <Users size={14} />
                1 Room, 2 Guests
              </span>
              <ChevronDown size={14} />
            </button>
            <button type="button" className="flex items-center justify-center gap-2 rounded-[13px] bg-[#f5b700] text-[11px] font-black text-slate-950 shadow-[0_8px_18px_rgba(245,183,0,0.24)]">
              <Search size={14} strokeWidth={2.8} />
              Search Hotels
            </button>
          </div>
        </section>

        <SectionTitle title="Offers for you" />
        <div className="grid grid-cols-3 gap-2">
          {offerCards.map(({ icon, title, subtitle, code, tone }) => (
            <div key={code} className="rounded-[15px] bg-white p-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
              <span className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${tone}`}>
                {icon}
              </span>
              <p className="mt-2 text-[8.5px] font-black leading-tight">{title}</p>
              <p className="mt-0.5 text-[7px] font-semibold text-slate-500">{subtitle}</p>
              <p className="mt-2 rounded-full bg-slate-50 px-1.5 py-1 text-center text-[6.5px] font-black text-slate-600">Code: {code}</p>
            </div>
          ))}
        </div>

        <SectionTitle title="Popular Destinations" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {destinations.map(({ city, price, image, gradient }) => (
            <button key={city} type="button" className="relative h-[105px] w-[84px] shrink-0 overflow-hidden rounded-[15px] bg-slate-900 text-left shadow-[0_10px_22px_rgba(15,23,42,0.12)]">
              <img src={image} alt={city} className="h-full w-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />
              <div className="absolute bottom-2 left-2 right-2 text-white">
                <p className="text-[10px] font-black">{city}</p>
                <p className="text-[7.5px] font-bold">Starting Rs{price}</p>
              </div>
            </button>
          ))}
        </div>

        <SectionTitle title="Recommended Hotels" />
        <div className="space-y-3 pb-4">
          {hotels.map((hotel) => (
            <button key={hotel.name} type="button" className="flex w-full gap-3 rounded-[17px] bg-white p-2.5 text-left shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
              <div className="relative h-[104px] w-[118px] shrink-0 overflow-hidden rounded-[14px] bg-slate-200">
                <img src={hotel.image} alt={hotel.name} className="h-full w-full object-cover" />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-[#f5b700] px-2 py-1 text-[7px] font-black">{hotel.badge}</span>
                <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95">
                  <Heart size={14} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-[12px] font-black text-slate-950">{hotel.name}</h3>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-1 text-[7px] font-black text-emerald-700">{hotel.off}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[8px] font-black text-[#f5b700]">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} size={8} className="fill-current" />
                  ))}
                  <span className="text-slate-500">{hotel.rating} ({hotel.reviews} review)</span>
                </p>
                <p className="mt-1 truncate text-[7.5px] font-semibold text-slate-500">{hotel.area} · {hotel.distance}</p>
                <div className="mt-1.5 flex flex-wrap gap-1 text-[7px] font-bold text-slate-500">
                  <span>Free Wi-Fi</span>
                  <span>Breakfast</span>
                  <span>Free Cancellation</span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-right sm:text-left">
                    <p className="text-[8px] font-bold text-slate-400 line-through">Rs{hotel.oldPrice.toLocaleString('en-IN')}</p>
                    <p className="text-[15px] font-black leading-none">Rs{hotel.price.toLocaleString('en-IN')}</p>
                    <p className="text-[7px] font-semibold text-slate-500">/ night</p>
                  </div>
                  <span className="rounded-[10px] bg-[#f5b700] px-3 py-2 text-[8px] font-black">View Rooms</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      <HotelBottomNav routePrefix={routePrefix} />
    </div>
  );
};

const ClockIcon = ({ size = 14, strokeWidth = 2.4 }) => (
  <CalendarDays size={size} strokeWidth={strokeWidth} />
);

const SectionTitle = ({ title }) => (
  <div className="mb-2 mt-4 flex items-center justify-between px-1">
    <h2 className="text-[14px] font-black text-slate-950">{title}</h2>
    <button type="button" className="flex items-center gap-1 text-[9px] font-black text-slate-600">
      View All <ChevronRight size={12} />
    </button>
  </div>
);

export default HotelHome;
