import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  CircleSlash,
  Clock3,
  Headphones,
  Languages,
  MapPin,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  UserCheck,
} from 'lucide-react';
import BottomNavbar from '../components/BottomNavbar';

const fallbackDriver = {
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
};

const detailItems = [
  { icon: BadgeCheck, title: 'Driving License', sub: 'Verified' },
  { icon: UserCheck, title: 'Aadhaar', sub: 'Verified' },
  { icon: CircleSlash, title: 'No Smoking', sub: 'Driver' },
  { icon: Headphones, title: 'Automatic &', sub: 'Manual Expert' },
  { icon: Clock3, title: 'Night Drive', sub: 'Expert' },
  { icon: Car, title: 'Luxury Vehicle', sub: 'Experience' },
];

const safetyItems = [
  { icon: MapPin, label: 'Live GPS\nTracking' },
  { icon: Siren, label: 'SOS\nSupport' },
  { icon: Sparkles, label: 'Share Live\nTrip' },
  { icon: ShieldCheck, label: 'Trip Recording\nAvailable' },
  { icon: Headphones, label: '24x7\nSupport' },
  { icon: Bell, label: 'Emergency\nContact' },
];

const PermanentDriverConfirm = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const driver = state?.driver || fallbackDriver;
  const driverImage = state?.driverImage || '/taxi09_driver_d3.jpg';
  const [instructions, setInstructions] = useState('');

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#f7f8fb] text-slate-950 font-sans pb-28 shadow-2xl border-x border-slate-100">
      <header className="sticky top-0 z-50 flex h-[58px] items-center justify-between bg-white/95 px-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate('/taxi/user/with-driver/permanent')}
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

      <main className="space-y-3 px-3">
        <section className="flex items-center justify-end gap-2 py-1">
          <span className="text-[10px] font-semibold text-slate-700">Step 3 of 5</span>
          <span className="h-1.5 w-6 rounded-full bg-[#f5b700]" />
          <span className="h-1.5 w-6 rounded-full bg-[#f5b700]" />
          <span className="h-1.5 w-6 rounded-full bg-[#f5b700]" />
          <span className="h-1.5 w-2 rounded-full bg-slate-200" />
          <span className="h-1.5 w-2 rounded-full bg-slate-200" />
        </section>

        <section className="overflow-hidden rounded-[16px] border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-[88px_1fr] gap-3">
            <div className="relative overflow-hidden rounded-[14px] bg-slate-100">
              <img src={driverImage} alt={driver.name} className="h-[120px] w-full object-cover object-top" />
              <span className="absolute bottom-2 left-2 rounded-md bg-[#f5b700] px-2 py-1 text-[8px] font-bold text-black">Top Rated Driver</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-[17px] font-bold">{driver.name}</h1>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                    <Star size={12} className="text-[#f5b700]" fill="#f5b700" />
                    {driver.rating}
                    <span>{driver.trips}</span>
                    <span className="text-emerald-600">98%</span>
                  </p>
                </div>
                <button type="button" className="text-[9px] font-bold text-[#d99c00]">View Profile</button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <span className="rounded-lg bg-[#fff8df] px-2 py-1.5 text-[9px] font-bold text-slate-800">Police Verified</span>
                <span className="rounded-lg bg-emerald-50 px-2 py-1.5 text-[9px] font-bold text-emerald-700">Background Verified</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[8px] font-semibold text-slate-600">
                <span><ShieldCheck size={13} className="mx-auto mb-0.5" />{driver.experience}</span>
                <span><Car size={13} className="mx-auto mb-0.5" />{driver.car.split(' ')[0]}</span>
                <span><Languages size={13} className="mx-auto mb-0.5" />{driver.language}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold">Driver Details</h2>
            <button type="button" className="text-[9px] font-bold text-[#d99c00]">View Profile</button>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {detailItems.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="text-center">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8df] text-[#d99c00]">
                  <Icon size={17} strokeWidth={2.4} />
                </span>
                <p className="mt-1 text-[7.5px] font-semibold leading-3">{title}<br />{sub}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[16px] border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
          <h2 className="text-[14px] font-bold">Trip Summary</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
            {[
              ['Pickup Location', 'Indore, Madhya Pradesh', MapPin],
              ['Journey Date', '30 Jul 2026', CalendarDays],
              ['Pickup Time', '09:00 AM', Clock3],
              ['Destination', 'Ujjain, Madhya Pradesh', MapPin],
              ['Trip Type', 'One Way', Car],
              ['Driver Preference', 'Male Driver', UserCheck],
            ].map(([label, value, Icon]) => (
              <div key={label} className="flex gap-2">
                <Icon size={15} className="mt-0.5 text-[#d99c00]" strokeWidth={2.4} />
                <div>
                  <p className="font-medium text-slate-500">{label}</p>
                  <p className="font-bold text-slate-950">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[16px] border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
          <h2 className="text-[14px] font-bold">Fare Summary</h2>
          <div className="mt-2 grid grid-cols-[1fr_118px] gap-4">
            <div className="space-y-1.5 text-[10px] font-semibold text-slate-600">
              <div className="flex justify-between"><span>Driver Charges</span><span className="text-slate-950">₹2,500</span></div>
              <div className="flex justify-between"><span>Night Allowance</span><span className="text-slate-950">₹500</span></div>
              <div className="flex justify-between"><span>Toll & Parking</span><span className="text-slate-950">Actual</span></div>
              <div className="flex justify-between"><span>GST (0%)</span><span className="text-slate-950">Included</span></div>
            </div>
            <div className="rounded-[14px] bg-[#fff8df] p-3 text-center">
              <p className="text-[9px] font-semibold text-slate-600">Estimated Total</p>
              <p className="text-[25px] font-extrabold">₹3,000</p>
              <p className="mt-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">All inclusive of taxes</p>
            </div>
          </div>
        </section>

        <section className="rounded-[16px] border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
          <h2 className="text-[14px] font-bold">Your Safety, Our Priority</h2>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {safetyItems.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl bg-[#fff8df] px-1 py-2 text-center">
                <Icon size={15} className="mx-auto text-[#d99c00]" strokeWidth={2.4} />
                <p className="mt-1 whitespace-pre-line text-[7px] font-semibold leading-3">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[16px] border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold">Instructions for Driver <span className="font-medium text-slate-500">(Optional)</span></h2>
            <span className="text-[9px] font-semibold text-slate-500">{instructions.length}/250</span>
          </div>
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value.slice(0, 250))}
            placeholder="Add any instructions for your driver..."
            className="mt-2 h-16 w-full resize-none rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] font-medium outline-none focus:border-[#f5b700]"
          />
          <p className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-700">
            <CheckCircle2 size={12} fill="currentColor" />
            I agree to the booking terms and conditions.
          </p>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg border-t border-slate-100 bg-white/95 px-3 pb-3 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="grid grid-cols-[104px_1fr] gap-3">
          <button type="button" className="rounded-[13px] bg-slate-50 px-3 py-2 text-left">
            <span className="block text-[9px] font-semibold text-slate-500">Estimated Total</span>
            <span className="flex items-center gap-1 text-[18px] font-extrabold">₹3,000 <ChevronDown size={14} /></span>
          </button>
          <button type="button" className="flex items-center justify-center gap-3 rounded-[13px] bg-[#f5b700] text-[15px] font-bold text-black shadow-[0_8px_18px_rgba(245,183,0,0.24)]">
            Confirm Booking
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">→</span>
          </button>
        </div>
        <BottomNavbar />
      </div>
    </div>
  );
};

export default PermanentDriverConfirm;
