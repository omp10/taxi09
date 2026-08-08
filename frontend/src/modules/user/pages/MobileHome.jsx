import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bike, Bell, Car, ChevronRight, FileCheck, Headset, Menu, ShieldCheck, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import carIcon from '../../../assets/icons/car.png';
import bikeIcon from '../../../assets/icons/bike.png';
import autoIcon from '../../../assets/icons/auto.png';
import deliveryIcon from '../../../assets/icons/Delivery.png';
import rentalCarImg from '../../../assets/images/rental_car_yellow.png';
import rentalBikeImg from '../../../assets/images/yellow_sports_bike_transparent.png';
import driverWithCabImg from '../../../assets/images/driver_beside_cab_white.png';
import api from '../../../shared/api/axiosInstance';
import BottomNavbar from '../components/BottomNavbar';
import AppHeader from '../components/AppHeader';
import { userAuthService } from '../services/authService';
import {
  CURRENT_RIDE_UPDATED_EVENT,
  getCurrentRide,
  saveCurrentRide,
  clearCurrentRide,
} from '../services/currentRideService';
const ACTIVE_RIDE_SYNC_INTERVAL_MS = 15000;
const IDLE_RIDE_SYNC_INTERVALS_MS = [60000, 120000, 180000];
const FORCED_SYNC_COOLDOWN_MS = 10000;
const STATIC_TOP_BANNER = '/taxi09_home_top_banner.png';
const STATIC_BOTTOM_BANNER = '/taxi09_home_bottom_banner.png';
const RENTAL_SELF_DRIVE_IMAGE = '/taxi09_rental_self_drive.png';
const RENTAL_WITH_DRIVER_IMAGE = '/taxi09_rental_with_driver.png';
const RENTAL_BIKE_IMAGE = '/taxi09_rental_bike.png';

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

/**
 * Banner placeholder. Height is set by an aspect ratio matching the real
 * artwork so swapping in the image causes no layout shift.
 */
const BannerSkeleton = ({ ratio, full = false }) => (
  <div className={`skeleton w-full ${full ? '' : 'rounded-[28px]'}`} style={{ aspectRatio: ratio }} />
);

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

  const [currentRide, setCurrentRide] = useState(() => getCurrentRide());
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [topBanners, setTopBanners] = useState([]);
  const [bottomBanners, setBottomBanners] = useState([]);
  const [bannersFetched, setBannersFetched] = useState(false);
  const [topImageReady, setTopImageReady] = useState(false);
  const [bottomImageReady, setBottomImageReady] = useState(false);

  const resolveBannerImage = (img) => {
    if (!img) return '';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    if (img.startsWith('/')) return img;
    const origin = globalThis.__LEGACY_BACKEND_ORIGIN__ || window.location.origin;
    return `${origin}/${img.startsWith('/') ? img.slice(1) : img}`;
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const [topRes, bottomRes] = await Promise.all([
          api.get('/users/banners?type=top'),
          api.get('/users/banners?type=bottom'),
        ]);
        const topResults = unwrapApiPayload(topRes)?.results || [];
        const bottomResults = unwrapApiPayload(bottomRes)?.results || [];
        setTopBanners(topResults.length ? topResults : [{ image: STATIC_TOP_BANNER }]);
        setBottomBanners(bottomResults.length ? bottomResults : [{ image: STATIC_BOTTOM_BANNER }]);
      } catch (error) {
        console.log('Failed to hydrate homepage banners:', error);
        setTopBanners([{ image: STATIC_TOP_BANNER }]);
        setBottomBanners([{ image: STATIC_BOTTOM_BANNER }]);
      } finally {
        setBannersFetched(true);
      }
    };
    fetchBanners();
  }, []);

  // Sync profile/initials
  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const user = await userAuthService.getCurrentUser();
        if (active && user) {
          return user;
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

  const rentalOptions = [
    {
      icon: Car,
      title: 'Self Drive',
      subtitle: 'Drive on your terms',
      image: RENTAL_SELF_DRIVE_IMAGE,
      path: '/taxi/user/rental',
    },
    {
      icon: UserCheck,
      title: 'With Driver',
      subtitle: "Relax, we'll drive",
      image: RENTAL_WITH_DRIVER_IMAGE,
      path: '/taxi/user/with-driver',
    },
    {
      icon: Bike,
      title: 'Bike Rental',
      subtitle: 'Quick & affordable',
      image: RENTAL_BIKE_IMAGE,
      path: '/taxi/user/rental/bike-categories',
    },
  ];

  const moreServices = [
    { iconImage: '/taxi09_service_hotel.png', label: 'Hotel\nBooking', path: '/taxi/user/hotel' },
    { iconImage: '/taxi09_service_subscription.png', label: 'Monthly\nSubscription', path: '/taxi/user/profile/subscriptions' },
    { iconImage: '/taxi09_service_travel.png', label: 'Travel\nPackages', path: '/taxi/user/tours' },
    { iconImage: '/taxi09_service_bookings.png', label: 'My\nBookings', path: '/taxi/user/activity' },
    { iconImage: '/taxi09_service_travel.png', label: 'International\nTrips', path: '/taxi/user/international' },
    { iconImage: '/taxi09_service_driver.png', label: 'Driver\nRegistration', path: '/taxi/driver/login' },
  ];

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const touchStart = useRef(null);
  const swipedRef = useRef(false);

  useEffect(() => {
    if (topBanners.length <= 1) return undefined;
    const t = setInterval(() => setTopIndex((i) => (i + 1) % topBanners.length), 5000);
    return () => clearInterval(t);
  }, [topBanners.length]);

  useEffect(() => {
    if (bottomBanners.length <= 1) return undefined;
    const t = setInterval(() => setBottomIndex((i) => (i + 1) % bottomBanners.length), 5000);
    return () => clearInterval(t);
  }, [bottomBanners.length]);

  const handleTouchStart = (e) => {
    const touch = e.touches?.[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    swipedRef.current = false;
  };

  const handleTouchEnd = (e, count, setIndex) => {
    const touch = e.changedTouches?.[0];
    if (!touchStart.current || !touch || count <= 1) return;
    const dx = touchStart.current.x - touch.clientX;
    const dy = touchStart.current.y - touch.clientY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      swipedRef.current = true;
      setIndex((i) => (i + (dx > 0 ? 1 : -1) + count) % count);
    }
  };

  const trustPoints = [
    { icon: ShieldCheck, label: 'Best Price\nGuarantee' },
    { icon: UserCheck, label: 'Verified\nDrivers' },
    { icon: Headset, label: '24x7\nSupport' },
    { icon: FileCheck, label: 'Easy\nBooking' },
  ];

  const openBanner = (banner, fallbackPath) => {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    navigate(banner?.redirect_url || banner?.deep_link || fallbackPath);
  };

  const openService = (path) => {
    if (path) {
      navigate(path);
    } else {
      toast('Coming soon');
    }
  };

  return (
    <div className="premium-theme min-h-screen bg-[#fffdf8] text-slate-900 font-sans pb-0 max-w-lg mx-auto relative overflow-x-hidden no-scrollbar border-x border-slate-100 shadow-2xl flex flex-col justify-between">

      <AppHeader />

      {/* Main Body Content */}
      <main className="flex-1 px-4 pb-28">

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

        <section className="-mx-4 mt-1">
          {!bannersFetched || !topImageReady ? <BannerSkeleton ratio="16 / 9" full /> : null}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, topBanners.length, setTopIndex)}
            onClick={() => openBanner(topBanners[topIndex], '/taxi/user/ride/select-location')}
            className={`relative w-full cursor-pointer touch-pan-y select-none overflow-hidden bg-white ${
              bannersFetched && topImageReady ? 'block' : 'hidden'
            }`}
          >
            <div
              className="flex w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${topIndex * 100}%)` }}
            >
              {topBanners.map((banner, idx) => (
                <img
                  key={banner?._id || idx}
                  src={resolveBannerImage(banner?.image)}
                  alt="Taxi09 offer banner"
                  className="block h-auto w-full shrink-0"
                  draggable={false}
                  onLoad={idx === 0 ? () => setTopImageReady(true) : undefined}
                  onError={idx === 0 ? () => setTopImageReady(true) : undefined}
                />
              ))}
            </div>

            {topBanners.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                {topBanners.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${idx === topIndex ? 'bg-[#F5B700]' : 'bg-white/70'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Rental Options */}
        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between px-1">
            <h2 className="text-[24px] font-black tracking-[-0.05em] text-slate-950">Rental Options</h2>
            <button
              onClick={() => navigate('/taxi/user/rental/type')}
              className="flex items-center gap-1.5 text-[14px] font-bold text-[#F5B700] active:scale-95 transition-transform"
            >
              View All <ArrowRight size={16} strokeWidth={2.6} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {rentalOptions.map(({ icon: Icon, title, subtitle, image, path }) => (
              <button
                key={title}
                onClick={() => navigate(path)}
                className="relative flex min-h-[148px] flex-col overflow-hidden rounded-[22px] border border-[#f1ede6] bg-white px-2.5 pt-3 pb-2 text-left shadow-[0_10px_24px_rgba(15,23,42,0.07)] active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff2c9]">
                    <Icon size={17} className="text-slate-900" strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-black leading-[1.15] text-slate-950">{title}</span>
                    <span className="mt-0.5 block text-[9px] font-medium leading-tight text-slate-600">{subtitle}</span>
                  </span>
                </div>

                <div className="mt-auto flex min-h-0 items-end justify-center">
                  <img
                    src={image}
                    alt={title}
                    className={`w-full object-contain ${title === 'With Driver' ? 'max-h-[74px]' : 'max-h-[66px] scale-[1.14]'}`}
                    draggable={false}
                  />
                </div>

                <span className="absolute bottom-1.5 right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#f5b700] shadow-[0_6px_14px_rgba(245,183,0,0.3)]">
                  <ChevronRight size={12} className="text-black" strokeWidth={3.2} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* More Services */}
        <section className="mt-7">
          <h2 className="mb-4 px-1 text-[24px] font-black tracking-[-0.05em] text-slate-950">More Services</h2>

          <div className="grid grid-cols-3 gap-3">
            {moreServices.map(({ iconImage, label, path }) => (
              <button
                key={label}
                onClick={() => openService(path)}
                className="relative flex min-h-[84px] items-center gap-1.5 overflow-hidden rounded-[20px] border border-[#f1ede6] bg-white pl-2 pr-1 py-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)] active:scale-[0.97] transition-transform"
              >
                <img src={iconImage} alt="" className="h-8 w-8 shrink-0 object-contain" draggable={false} />
                <span className="min-w-0 break-words text-[10px] font-extrabold leading-[1.2] whitespace-pre-line text-slate-950">
                  {label}
                </span>
                <span className="absolute bottom-1.5 right-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[#f5b700]/35 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
                  <ChevronRight size={12} className="text-[#F5B700]" strokeWidth={3.5} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7">
          {!bannersFetched || !bottomImageReady ? <BannerSkeleton ratio="16 / 7" /> : null}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, bottomBanners.length, setBottomIndex)}
            onClick={() => openBanner(bottomBanners[bottomIndex], '/taxi/user/cab/spiritual')}
            className={`relative w-full cursor-pointer touch-pan-y select-none overflow-hidden rounded-[28px] border border-[#f1ede6] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
              bannersFetched && bottomImageReady ? 'block' : 'hidden'
            }`}
          >
            <div
              className="flex w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${bottomIndex * 100}%)` }}
            >
              {bottomBanners.map((banner, idx) => (
                <img
                  key={banner?._id || idx}
                  src={resolveBannerImage(banner?.image)}
                  alt="Taxi09 travel packages banner"
                  className="block h-auto w-full shrink-0"
                  draggable={false}
                  onLoad={idx === 0 ? () => setBottomImageReady(true) : undefined}
                  onError={idx === 0 ? () => setBottomImageReady(true) : undefined}
                />
              ))}
            </div>

            {bottomBanners.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                {bottomBanners.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${idx === bottomIndex ? 'bg-[#F5B700]' : 'bg-white/70'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trust strip */}
        <section className="mt-6">
          <div className="grid grid-cols-4 divide-x divide-[#efe8dc] rounded-[22px] border border-[#f1ede6] bg-white py-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            {trustPoints.map(({ icon: Icon, label }) => (
              <div key={label} className="flex min-w-0 flex-col items-center justify-center gap-2 px-2 text-center">
                <Icon size={22} className="shrink-0 text-[#F5B700]" strokeWidth={2.2} />
                <span className="whitespace-pre-line text-[9px] font-black leading-[1.25] tracking-tight text-slate-800">{label}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      <BottomNavbar />

    </div>
  );
};

export default MobileHome;
