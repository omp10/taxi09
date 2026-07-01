import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, ChevronRight, Clock3, MapPin, ShieldCheck, User, Menu, Bell, ArrowRight, Calendar, History, Compass, GraduationCap, Car, UserCheck } from 'lucide-react';
import carIcon from '../../../assets/icons/car.png';
import bikeIcon from '../../../assets/icons/bike.png';
import autoIcon from '../../../assets/icons/auto.png';
import deliveryIcon from '../../../assets/icons/Delivery.png';
import rentalCarImg from '../../../assets/images/rental_car_transparent.png';
import yellowCarImg from '../../../assets/images/maruti_swift_transparent.png';
import rentalBikeImg from '../../../assets/images/rental_bike_transparent.png';
import api from '../../../shared/api/axiosInstance';
import BottomNavbar from '../components/BottomNavbar';
import { useSettings } from '../../../shared/context/SettingsContext';
import { userService } from '../services/userService';
import { userAuthService } from '../services/authService';
import {
  CURRENT_RIDE_UPDATED_EVENT,
  getCurrentRide,
  getCurrentRideSignature,
  isActiveCurrentRide,
  saveCurrentRide,
  clearCurrentRide,
} from '../services/currentRideService';

const Motion = motion;
const ACTIVE_RIDE_SYNC_INTERVAL_MS = 15000;
const IDLE_RIDE_SYNC_INTERVALS_MS = [60000, 120000, 180000];
const FORCED_SYNC_COOLDOWN_MS = 10000;

const getCurrentRideIcon = (ride) => {
  const customIcon = String(
    ride?.vehicleIconUrl ||
    ride?.vehicle?.vehicleIconUrl ||
    ride?.vehicle?.icon ||
    ride?.driver?.vehicleIconUrl ||
    '',
  ).trim();

  if (customIcon) {
    return customIcon;
  }

  const serviceType = String(ride?.serviceType || ride?.type || '').toLowerCase();
  const iconType = String(ride?.vehicleIconType || ride?.driver?.vehicleIconType || ride?.driver?.vehicleType || '').toLowerCase();

  if (serviceType === 'parcel') {
    return deliveryIcon;
  }

  if (iconType.includes('bike')) {
    return bikeIcon;
  }

  if (iconType.includes('auto')) {
    return autoIcon;
  }

  return carIcon;
};

const unwrapApiPayload = (response) => response?.data?.data || response?.data || response;

const formatScheduledDateTime = (value) => {
  if (!value) {
    return 'Scheduled time pending';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Scheduled time pending';
  }

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getScheduledCountdownLabel = (value, now = Date.now()) => {
  const parsed = value ? new Date(value) : null;
  const time = parsed?.getTime?.() || NaN;

  if (!Number.isFinite(time)) {
    return '';
  }

  const diffMs = time - now;
  if (diffMs <= 0) {
    return 'Pickup window is opening now';
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Starts in ${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m`;
  }

  return `Starts in ${minutes} min`;
};

const MobileHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();

  const [currentRide, setCurrentRide] = useState(() => getCurrentRide());
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [userInfo, setUserInfo] = useState(null);

  const [topBanners, setTopBanners] = useState([]);
  const [bottomBanners, setBottomBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // Resolve banner image paths correctly
  const resolveBannerImage = (img) => {
    if (!img) return '';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    const origin = globalThis.__LEGACY_BACKEND_ORIGIN__ || window.location.origin;
    return `${origin}/${img.startsWith('/') ? img.slice(1) : img}`;
  };

  // Fetch banners on mount
  useEffect(() => {
    const fetchBanners = async () => {
      setLoadingBanners(true);
      try {
        const topRes = await api.get('/users/banners?type=top');
        const topData = unwrapApiPayload(topRes);
        if (topData && Array.isArray(topData.results)) {
          setTopBanners(topData.results);
        }
      } catch (err) {
        console.log('Failed to fetch top banners:', err);
      }

      try {
        const bottomRes = await api.get('/users/banners?type=bottom');
        const bottomData = unwrapApiPayload(bottomRes);
        if (bottomData && Array.isArray(bottomData.results)) {
          setBottomBanners(bottomData.results);
        }
      } catch (err) {
        console.log('Failed to fetch bottom banners:', err);
      } finally {
        setLoadingBanners(false);
      }
    };
    fetchBanners();
  }, []);

  const displayTopBanners = topBanners;
  const [activeTopIndex, setActiveTopIndex] = useState(0);
  useEffect(() => {
    if (displayTopBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveTopIndex((prev) => (prev + 1) % displayTopBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayTopBanners]);

  const displayBottomBanners = bottomBanners;
  const [activeBottomIndex, setActiveBottomIndex] = useState(0);
  useEffect(() => {
    if (displayBottomBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBottomIndex((prev) => (prev + 1) % displayBottomBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBottomBanners]);

  // Sync profile/initials
  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const user = await userAuthService.getCurrentUser();
        if (active && user) {
          setUserInfo(user);
        }
      } catch (err) {
        console.log('Failed to fetch user in MobileHome:', err);
      }
    };
    fetchUser();
    return () => {
      active = false;
    };
  }, []);

  // Update clock tick
  useEffect(() => {
    const handle = setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => clearInterval(handle);
  }, []);

  // Sync active ride details
  useEffect(() => {
    const syncCurrentRideRef = { current: null };
    let syncIntervalHandle = null;
    let syncTimeoutHandle = null;
    let lastSyncTime = 0;
    let failedAttempts = 0;

    const pullActiveRide = async () => {
      const now = Date.now();
      if (now - lastSyncTime < FORCED_SYNC_COOLDOWN_MS) {
        return;
      }
      lastSyncTime = now;

      try {
        const result = await api.get('/rides/active/me');
        const activeRide = unwrapApiPayload(result);

        if (activeRide && activeRide._id) {
          saveCurrentRide(activeRide);
          setCurrentRide(activeRide);
          failedAttempts = 0;
        } else {
          clearCurrentRide();
          setCurrentRide(null);
        }
      } catch (error) {
        console.log('Error pulling active ride details:', error);
        failedAttempts += 1;
        if (failedAttempts >= 3) {
          clearCurrentRide();
          setCurrentRide(null);
        }
      }
    };

    const handleRideUpdated = () => {
      const fresh = getCurrentRide();
      setCurrentRide(fresh);
      pullActiveRide();
    };

    window.addEventListener(CURRENT_RIDE_UPDATED_EVENT, handleRideUpdated);

    // Initial pull
    pullActiveRide();

    // Setup periodic sync
    const scheduleNextSync = () => {
      const delay = currentRide
        ? ACTIVE_RIDE_SYNC_INTERVAL_MS
        : IDLE_RIDE_SYNC_INTERVALS_MS[Math.min(failedAttempts, IDLE_RIDE_SYNC_INTERVALS_MS.length - 1)];

      syncTimeoutHandle = setTimeout(async () => {
        await pullActiveRide();
        scheduleNextSync();
      }, delay);
    };

    scheduleNextSync();

    return () => {
      window.removeEventListener(CURRENT_RIDE_UPDATED_EVENT, handleRideUpdated);
      clearTimeout(syncTimeoutHandle);
      clearInterval(syncIntervalHandle);
    };
  }, [currentRide]);

  // Compute active ride details
  const serviceType = String(currentRide?.serviceType || currentRide?.type || '').toLowerCase();
  const rideStage = String(currentRide?.status || '').toLowerCase();
  const isScheduled = String(currentRide?.category || '').toLowerCase() === 'scheduled';
  const driverAssigned = !!(currentRide?.driver || currentRide?.driverId);
  const isScheduledAcceptedRide = isScheduled && driverAssigned && ['accepted', 'arriving', 'arrived'].includes(rideStage);

  const trackingPath = serviceType === 'parcel'
    ? '/taxi/user/parcel/tracking'
    : '/taxi/user/ride/tracking';

  const driverName = currentRide?.driver?.name || 'Driver';
  const vehicleLabel = currentRide?.vehicle?.model || currentRide?.driver?.vehicleModel || 'Vehicle';
  const currentRideIcon = getCurrentRideIcon(currentRide);

  const rideStageLabel = rideStage === 'accepted'
    ? serviceType === 'parcel' ? `${driverName} accepted request` : `${driverName} is coming`
    : rideStage === 'arrived_pickup'
      ? serviceType === 'parcel' ? `${driverName} reached sender` : `${driverName} has arrived`
      : rideStage === 'arriving_pickup'
        ? serviceType === 'parcel' ? `${driverName} heading to sender` : `${driverName} is coming`
        : rideStage === 'started'
          ? serviceType === 'parcel' ? 'Parcel in transit' : 'Ride in progress'
          : rideStage === 'arrived'
            ? serviceType === 'parcel' ? 'Parcel reached destination' : `${driverName} reached destination`
            : rideStage === 'arriving'
              ? serviceType === 'parcel' ? `${driverName} reached sender` : `${driverName} has arrived`
              : serviceType === 'parcel'
                ? 'Parcel booked'
                : 'Ride booked';

  const rideStageContextLabel = isScheduledAcceptedRide
    ? 'Driver assigned for your scheduled trip'
    : rideStageLabel;

  const scheduledDateLabel = formatScheduledDateTime(currentRide?.scheduledAt);
  const scheduledCountdown = getScheduledCountdownLabel(currentRide?.scheduledAt, clockNow);

  const getInitials = (name) => {
    if (!name) return 'JD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const userInitials = userInfo ? getInitials(userInfo.name) : 'User';

  return (
    <div className="premium-theme min-h-screen bg-white text-slate-900 font-sans pb-0 max-w-lg mx-auto relative overflow-x-hidden no-scrollbar border-x border-slate-200 shadow-2xl flex flex-col justify-between">

      {/* Top App Bar */}
      <header className="bg-[#FFC107] flex items-center justify-between px-6 h-16 w-full sticky top-0 z-50 select-none border-b border-amber-500/20 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/taxi/user/profile')}
            className="flex items-center justify-center text-slate-950 cursor-pointer active:scale-95 transition-transform"
          >
            <Menu size={24} className="text-slate-950 stroke-[2.5]" />
          </button>

          <h1
            onClick={() => navigate('/taxi/user')}
            className="text-[24px] font-black cursor-pointer text-slate-950 select-none flex items-center"
          >
            Taxi<span className="text-white">09</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/taxi/user/notifications')}
            className="relative flex items-center justify-center text-slate-950 cursor-pointer active:scale-95 transition-transform"
          >
            <Bell size={24} className="text-slate-950" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>

          <div
            onClick={() => navigate('/taxi/user/profile')}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-slate-950 text-sm font-bold cursor-pointer active:scale-95 transition-transform border border-white/25"
          >
            {userInitials}
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 pb-24">

        {/* Active scheduled ride or rental alerts (if any exist) */}
        {isScheduledAcceptedRide && (
          <div
            onClick={() => navigate(trackingPath, { state: currentRide })}
            className="mx-4 mt-2 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-slate-350 transition-colors"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#d48c00] bg-[#ffc400]/10 px-2 py-0.5 rounded">
                Scheduled Confirmed
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-green-600 animate-pulse flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live Status
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-md font-black text-slate-800">{scheduledCountdown}</p>
                <p className="text-xs text-slate-400 font-semibold">{scheduledDateLabel}</p>
              </div>
              <img src={currentRideIcon} className="h-12 w-12 object-contain" alt="" />
            </div>
          </div>
        )}

        {/* Hero Banner Section */}
        {loadingBanners ? (
          <section className="mt-4 px-4">
            <div className="w-full h-[210px] bg-slate-200 animate-pulse rounded-[28px]" />
          </section>
        ) : (
          displayTopBanners.length > 0 && (
            <section className="mt-4 px-4">
              <div
                onClick={() => {
                  const activeBanner = displayTopBanners[activeTopIndex];
                  if (activeBanner?.redirect_url) {
                    navigate(activeBanner.redirect_url);
                  } else {
                    navigate('/taxi/user/ride/select-location');
                  }
                }}
                className="relative overflow-hidden rounded-[28px] h-[210px] bg-[#0f0f0f] flex items-center shadow-lg group cursor-pointer"
              >
                {/* Banner Background Images Stack */}
                {displayTopBanners.map((banner, idx) => (
                  <div
                    key={banner?._id || idx}
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                    style={{
                      backgroundImage: `url('${resolveBannerImage(banner?.image)}')`,
                      opacity: idx === activeTopIndex ? 1.0 : 0,
                      zIndex: idx === activeTopIndex ? 1 : 0
                    }}
                  />
                ))}

                {/* Carousel indicators */}
                {displayTopBanners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {displayTopBanners.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeTopIndex ? 'w-4 bg-[#FFB300]' : 'w-1.5 bg-white/40'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        )}

        {/* Choose Your Ride Section */}
        <section className="mt-6 px-4">
          <div className="flex items-center justify-between mb-2 pt-3">
            <div>
              <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Choose Your Ride</h2>
              <p className="text-[12px] font-semibold text-slate-400 mt-0.5">Safe. Reliable. Always There.</p>
            </div>
            <div className="w-6 h-1 bg-[#FFC400] rounded-full"></div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-4 mt-4">

            {/* Card 1: Cars (Self Drive) */}
            <div
              onClick={() => navigate('/taxi/user/rental/type')}
              className="bg-[#F8FAFC] border border-slate-100 rounded-3xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer h-[295px] relative group"
            >
              {/* Top steering wheel icon badge */}


              {/* Car Image */}
              <div className="my-auto flex items-center justify-center h-[100px]">
                <img
                  src={rentalCarImg}
                  alt="Cars (Self Drive)"
                  className="h-[90px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Content & Action */}
              <div className="space-y-3 mt-auto">
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">Cars (Self Drive)</h3>
                  <p className="text-[11px] font-bold text-slate-400 leading-tight mt-0.5">Drive yourself, on your terms.</p>
                </div>
                <div className="w-full bg-[#f6ff00] text-slate-950 text-[12px] font-black px-4 py-3 rounded-xl flex items-center justify-between group-hover:bg-[#f6ff00] transition-colors">
                  <span>Book Now</span>
                  <ArrowRight size={16} className="text-slate-950 shrink-0 stroke-[3]" />
                </div>
              </div>
            </div>

            {/* Card 2: Cars With Driver */}
            <div
              onClick={() => navigate('/taxi/user/ride/select-location')}
              className="bg-[#f6ff00] border border-amber-100/50 rounded-3xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer h-[295px] relative group"
            >
              {/* Top person icon badge */}


              {/* Car Image */}
              <div className="my-auto flex items-center justify-center h-[100px]">
                <img
                  src={yellowCarImg}
                  alt="Cars With Driver"
                  className="h-[90px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Content & Action */}
              <div className="space-y-3 mt-auto">
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">Cars With Driver</h3>
                  <p className="text-[11px] font-bold text-slate-400 leading-tight mt-0.5">Sit back & relax, we drive.</p>
                </div>
                <div className="w-full bg-[#ffdd00] text-slate-950 text-[12px] font-black px-4 py-3 rounded-xl flex items-center justify-between group-hover:bg-[#FFA000] transition-colors">
                  <span>Book Now</span>
                  <ArrowRight size={16} className="text-slate-950 shrink-0 stroke-[3]" />
                </div>
              </div>
            </div>

          </div>

          {/* Full Width Bikes Card */}
          <div
            onClick={() => navigate('/taxi/user/rental/bike-categories')}
            className="bg-[#FFFDF9] border border-amber-100/50 rounded-3xl p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer mt-8 group overflow-hidden relative h-[160px]"
          >
            <div className="flex flex-col justify-between h-full z-10 w-[70%]">
              <div>
                <h3 className="text-[21px] font-black text-slate-800 leading-tight">Bikes</h3>
                <p className="text-[12px] font-bold text-slate-500 leading-tight mt-1">Quick rides. Beat the traffic.</p>
              </div>

              <button
                className="bg-[#FFC107] text-slate-950 text-[12px] font-black uppercase tracking-wider px-5 py-3 rounded-xl w-fit flex items-center gap-1"
              >
                Book Now <ArrowRight size={14} className="shrink-0 stroke-[3]" />
              </button>
            </div>

            {/* Bike Image on the right */}
            <div className="w-[30%] h-full flex items-center justify-center relative">
              <img
                src={rentalBikeImg}
                alt="Bikes"
                className="h-[135px] w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md z-10"
              />
            </div>
          </div>
        </section>

        {/* More Services Section */}
        <section className="mt-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-black text-slate-800 tracking-tight">More Services</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">

            {/* Monthly Subscription */}
            <button
              onClick={() => navigate('/taxi/user/profile/subscriptions')}
              className="bg-slate-50 hover:bg-amber-50 hover:border-amber-200 group transition-all duration-200 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 border border-slate-100 cursor-pointer active:scale-95 shadow-sm"
            >
              <Calendar className="text-[#FFC107] w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-tight leading-tight">Monthly Subscription</span>
            </button>

            {/* My Bookings */}
            <button
              onClick={() => navigate('/taxi/user/activity')}
              className="bg-slate-50 hover:bg-amber-50 hover:border-amber-200 group transition-all duration-200 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 border border-slate-100 cursor-pointer active:scale-95 shadow-sm"
            >
              <History className="text-[#FFC107] w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-tight leading-tight">My Bookings</span>
            </button>

            {/* Travel Packages */}
            <button
              onClick={() => navigate('/taxi/user/cab/spiritual')}
              className="bg-slate-50 hover:bg-amber-50 hover:border-amber-200 group transition-all duration-200 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 border border-slate-100 cursor-pointer active:scale-95 shadow-sm"
            >
              <Compass className="text-[#FFC107] w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-tight leading-tight">Travel Packages</span>
            </button>

            {/* Internship Program */}
            <button
              onClick={() => navigate('/taxi/user/onboarding')}
              className="bg-slate-50 hover:bg-amber-50 hover:border-amber-200 group transition-all duration-200 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 border border-slate-100 cursor-pointer active:scale-95 shadow-sm"
            >
              <GraduationCap className="text-[#FFC107] w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-tight leading-tight">Internship Program</span>
            </button>

            {/* Attach Car */}
            <button
              onClick={() => navigate('/taxi/driver/login')}
              className="bg-slate-50 hover:bg-amber-50 hover:border-amber-200 group transition-all duration-200 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 border border-slate-100 cursor-pointer active:scale-95 shadow-sm"
            >
              <Car className="text-[#FFC107] w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-tight leading-tight">Attach Car</span>
            </button>

            {/* Driver Registration */}
            <button
              onClick={() => navigate('/taxi/driver/login')}
              className="bg-slate-50 hover:bg-amber-50 hover:border-amber-200 group transition-all duration-200 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 border border-slate-100 cursor-pointer active:scale-95 shadow-sm"
            >
              <UserCheck className="text-[#FFC107] w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 tracking-tight leading-tight">Driver Registration</span>
            </button>

          </div>
        </section>

        {/* Featured Destination / Bottom Banners Section */}
        {loadingBanners ? (
          <section className="mt-8 px-4">
            <div className="w-full aspect-[16/9] bg-slate-200 animate-pulse rounded-[28px]" />
          </section>
        ) : (
          displayBottomBanners.length > 0 && (
            <section className="mt-8 px-4">
              <div
                onClick={() => {
                  const activeBanner = displayBottomBanners[activeBottomIndex];
                  if (activeBanner?.redirect_url) {
                    navigate(activeBanner.redirect_url);
                  } else {
                    navigate('/taxi/user/cab/spiritual');
                  }
                }}
                className="relative w-full rounded-[28px] overflow-hidden aspect-[16/9] shadow-md group cursor-pointer border border-slate-100 bg-[#0f0f0f]"
              >
                {/* Banner Background Images Stack */}
                {displayBottomBanners.map((banner, idx) => (
                  <div
                    key={banner?._id || idx}
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                    style={{
                      backgroundImage: `url('${resolveBannerImage(banner?.image)}')`,
                      opacity: idx === activeBottomIndex ? 1.0 : 0,
                      zIndex: idx === activeBottomIndex ? 1 : 0
                    }}
                  />
                ))}

                {/* Carousel indicators */}
                {displayBottomBanners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {displayBottomBanners.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeBottomIndex ? 'w-4 bg-[#FFB300]' : 'w-1.5 bg-white/40'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        )}

      </main>

      <BottomNavbar />

    </div>
  );
};

export default MobileHome;
