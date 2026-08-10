import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Car,
  Headset,
  Menu,
  ShieldCheck,
  Star,
  UserCheck,
} from 'lucide-react';
import BottomNavbar from '../components/BottomNavbar';
import driverWithCabImg from '../../../assets/images/driver_beside_cab_white.png';

const serviceCards = [
  {
    title: 'Local (Hourly)',
    subtitle: 'Hire a driver for local city rides by the hour.',
    color: 'from-[#fff2b6] to-white',
    action: 'bg-[#f5b700]',
    image: '/taxi09_driver_local_hourly.png',
  },
  {
    title: 'Outstation',
    subtitle: 'For intercity or long distance trips.',
    color: 'from-emerald-100 to-white',
    action: 'bg-emerald-600',
    image: '/taxi09_driver_outstation.png',
  },
  {
    title: 'Outstation Drop',
    subtitle: 'One way drop to your destination.',
    color: 'from-teal-100 to-white',
    action: 'bg-emerald-600',
    image: '/taxi09_driver_outstation_drop.png',
  },
  {
    title: 'Permanent Driver',
    subtitle: 'Hire a driver for daily, weekly or monthly basis.',
    color: 'from-rose-100 to-white',
    action: 'bg-red-500',
    image: '/taxi09_driver_permanent.png',
  },
];

const trustItems = [
  { icon: ShieldCheck, label: 'Police Verified\nDrivers' },
  { icon: Star, label: 'Experienced &\nTrained' },
  { icon: Headset, label: '24x7\nSupport' },
  { icon: CalendarDays, label: 'Transparent\nPricing' },
];

const WithDriverHome = () => {
  const navigate = useNavigate();
  const openDriverService = (title) => {
    if (title === 'Permanent Driver') {
      navigate('/taxi/user/with-driver/permanent', { state: { hireDriverType: title } });
      return;
    }

    navigate('/taxi/user/with-driver/details', { state: { hireDriverType: title } });
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-white text-black font-sans pb-24 shadow-2xl border-x border-slate-100">
      <header className="sticky top-0 z-50 flex h-[58px] items-center justify-between bg-white px-3">
        <button
          type="button"
          onClick={() => navigate('/taxi/user/profile')}
          className="flex h-9 w-9 items-center justify-center"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/taxi/user')}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center leading-none"
        >
          <span className="text-[21px] font-black italic tracking-[-0.04em]">
            TAXI<span className="text-[#f5b700]">09</span>
          </span>
          <span className="mt-0.5 text-[10px] font-black text-slate-700">Drive On Hire</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/taxi/user/notifications')}
          className="relative flex h-9 w-9 items-center justify-center"
        >
          <Bell size={20} strokeWidth={2.4} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </header>

      <main className="px-3">
        <section className="relative overflow-hidden rounded-[13px] bg-[#f5b700] px-4 py-4 shadow-[0_10px_24px_rgba(245,183,0,0.24)]">
          <div className="absolute inset-y-0 right-0 w-[56%] opacity-25">
            {Array.from({ length: 9 }).map((_, index) => (
              <span
                key={index}
                className="absolute bottom-0 w-5 rounded-t-sm bg-black/20"
                style={{
                  left: `${index * 12}%`,
                  height: `${35 + (index % 4) * 18}%`,
                }}
              />
            ))}
          </div>
          <div className="relative z-10 max-w-[58%]">
            <h1 className="text-[18px] font-black leading-tight">Professional Drivers</h1>
            <p className="mt-1 text-[13px] font-black">Safe. Reliable. On Your Terms.</p>
            <p className="mt-4 text-[12px] font-bold leading-4 text-slate-900">
              Hire verified, experienced & police verified drivers for your own car.
            </p>
          </div>
          <img
            src={driverWithCabImg}
            alt="Professional driver"
            className="absolute bottom-0 right-0 z-20 h-[142px] w-[58%] object-contain object-bottom"
          />
          <div className="absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-black" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          </div>
        </section>

        <section className="mt-4">
          <p className="text-[13.5px] font-black uppercase text-[#f5b700]">Hire</p>
          <h2 className="text-[19px] font-black leading-tight">
            Professional, Experienced &<br />Police Verified <span className="text-[#f5b700]">DRIVERS</span>
          </h2>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-3">
          {serviceCards.map(({ title, subtitle, color, action, image }) => (
            <button
              key={title}
              type="button"
              onClick={() => openDriverService(title)}
              className="overflow-hidden rounded-[14px] border border-slate-100 bg-white text-left shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
            >
              <div className={`relative h-[105px] bg-gradient-to-br ${color}`}>
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
              </div>
              <div className="relative min-h-[78px] px-3 pb-3 pt-2">
                <h3 className="text-[14.5px] font-black">{title}</h3>
                <p className="mt-1 pr-8 text-[11.5px] font-bold leading-4 text-slate-700">{subtitle}</p>
                <span className={`absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full ${action}`}>
                  <ArrowRight size={15} className="text-white" strokeWidth={3} />
                </span>
              </div>
            </button>
          ))}
        </section>

        <section className="mt-4 grid grid-cols-4 gap-2 rounded-[14px] border border-slate-100 bg-white px-2 py-3 shadow-[0_5px_16px_rgba(15,23,42,0.05)]">
          {trustItems.map(({ icon: Icon, label }) => (
            <div key={label} className="text-center">
              <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-[#f5b700]/40 bg-[#fff8df]">
                <Icon size={16} className="text-[#f5b700]" strokeWidth={2.5} />
              </span>
              <p className="mt-1 whitespace-pre-line text-[9.5px] font-black leading-3 text-slate-800">{label}</p>
            </div>
          ))}
        </section>
      </main>

      <BottomNavbar />
    </div>
  );
};

export default WithDriverHome;
