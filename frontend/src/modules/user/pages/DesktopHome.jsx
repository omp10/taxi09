import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, ChevronRight, Clock3, MapPin, ShieldCheck, User } from 'lucide-react';
import HeaderGreeting from '../components/HeaderGreeting';
import ServiceGrid from '../components/ServiceGrid';
import LocationMapSection from '../components/LocationMapSection';


import CheckUsOutSection from '../components/CheckUsOutSection';
import BottomNavbar from '../components/BottomNavbar';
import LandingHero from '../components/landing/LandingHero';
import ChooseRideSection from '../components/landing/ChooseRideSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import FeaturedVehiclesSection from '../components/landing/FeaturedVehiclesSection';
import WhyChooseUsSection from '../components/landing/WhyChooseUsSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import AppDownloadSection from '../components/landing/AppDownloadSection';
import FooterSection from '../components/landing/FooterSection';
import carIcon from '../../../assets/icons/car.png';
import bikeIcon from '../../../assets/icons/bike.png';
import rajwadaPalaceImg from '@/assets/rajwada_palace.png';
import autoIcon from '../../../assets/icons/auto.png';
import deliveryIcon from '../../../assets/icons/Delivery.png';
import api from '../../../shared/api/axiosInstance';
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
const DEFERRED_SECTION_DELAY_MS = 250;
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

  return `Starts in ${minutes}m`;
};

const normalizeRentalCurrentRideSnapshot = (ride = {}, previousRide = {}) => {
  if (!ride) {
    return null;
  }

  const assignedVehicle = ride.assignedVehicle || previousRide.assignedVehicle || {};
  const selectedPackage = ride.selectedPackage || previousRide.selectedPackage || null;
  const rideMetrics = ride.rideMetrics || previousRide.rideMetrics || {};
  const serviceLocation = ride.serviceLocation || previousRide.serviceLocation || null;
  const bookingReference = ride.bookingReference || previousRide.bookingReference || '';
  const vehicleName =
    assignedVehicle?.name ||
    ride.vehicleName ||
    previousRide.vehicleName ||
    previousRide?.vehicle?.name ||
    'Assigned Vehicle';
  const vehicleImage =
    assignedVehicle?.image ||
    ride.vehicleImage ||
    previousRide.vehicleImage ||
    previousRide?.vehicle?.image ||
    '';
  const vehicleCategory =
    assignedVehicle?.vehicleCategory ||
    ride.vehicleCategory ||
    previousRide.vehicleCategory ||
    previousRide?.driver?.vehicle ||
    'Rental';

  return {
    ...previousRide,
    ...ride,
    rideId: ride.id || ride.rideId || previousRide.rideId || '',
    bookingReference,
    fare: rideMetrics?.currentCharge ?? ride.fare ?? previousRide.fare ?? ride.payableNow ?? 0,
    totalCost: ride.totalCost ?? previousRide.totalCost ?? 0,
    advancePaid: ride.payableNow ?? ride.advancePaid ?? previousRide.advancePaid ?? 0,
    status: ride.status || previousRide.status || 'assigned',
    liveStatus: ride.status || ride.liveStatus || previousRide.liveStatus || 'assigned',
    serviceType: 'rental',
    vehicleName,
    vehicleImage,
    vehicleCategory,
    vehicle: {
      ...(previousRide.vehicle || {}),
      name: vehicleName,
      image: vehicleImage,
      vehicleIconUrl: vehicleImage,
    },
    driver: {
      ...(previousRide.driver || {}),
      name: vehicleName,
      vehicle: vehicleCategory,
      vehicleType: vehicleCategory,
      vehicleIconUrl: vehicleImage,
    },
    vehicleIconUrl: vehicleImage || previousRide.vehicleIconUrl || '',
    assignedAt: ride.assignedAt || previousRide.assignedAt || ride.createdAt || null,
    completionRequestedAt: ride.completionRequestedAt || previousRide.completionRequestedAt || null,
    hourlyRate: rideMetrics?.hourlyRate ?? ride.hourlyRate ?? previousRide.hourlyRate ?? 0,
    includedHours: rideMetrics?.includedHours ?? ride.includedHours ?? previousRide.includedHours ?? selectedPackage?.durationHours ?? 0,
    basePrice: rideMetrics?.basePrice ?? ride.basePrice ?? previousRide.basePrice ?? selectedPackage?.price ?? ride.totalCost ?? 0,
    extraHourRate: rideMetrics?.extraHourRate ?? ride.extraHourRate ?? previousRide.extraHourRate ?? selectedPackage?.extraHourPrice ?? 0,
    elapsedMinutes: rideMetrics?.elapsedMinutes ?? ride.elapsedMinutes ?? previousRide.elapsedMinutes ?? 0,
    remainingDue: rideMetrics?.remainingDue ?? ride.remainingDue ?? previousRide.remainingDue ?? 0,
    requestedHours: ride.requestedHours ?? previousRide.requestedHours ?? selectedPackage?.durationHours ?? 0,
    selectedPackage,
    paymentMethodLabel: ride.paymentMethodLabel || previousRide.paymentMethodLabel || '',
    serviceLocation,
    assignedVehicle,
    finalCharge: ride.finalCharge ?? previousRide.finalCharge ?? 0,
    finalElapsedMinutes: ride.finalElapsedMinutes ?? previousRide.finalElapsedMinutes ?? 0,
    updatedAt: ride.updatedAt || previousRide.updatedAt || Date.now(),
  };
};

const DesktopHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const appName = settings.general?.app_name || 'App';

  const [currentRide, setCurrentRide] = useState(() => {
    const ride = getCurrentRide();
    return isActiveCurrentRide(ride) ? ride : null;
  });
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [endingRide, setEndingRide] = useState(false);
  const [showDeferredSections, setShowDeferredSections] = useState(false);

  const [userInfo, setUserInfo] = useState(null);
  const [topBanners, setTopBanners] = useState([]);
  const [bottomBanners, setBottomBanners] = useState([]);
  const [activeTopIndex, setActiveTopIndex] = useState(0);
  const [activeBottomIndex, setActiveBottomIndex] = useState(0);

  const displayTopBanners = topBanners.length > 0 ? topBanners : [null];
  useEffect(() => {
    if (displayTopBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveTopIndex((prev) => (prev + 1) % displayTopBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayTopBanners]);

  const displayBottomBanners = bottomBanners.length > 0 ? bottomBanners : [null];
  useEffect(() => {
    if (displayBottomBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBottomIndex((prev) => (prev + 1) % displayBottomBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBottomBanners]);

  const resolveBannerImage = (img) => {
    if (!img) return '';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    const origin = globalThis.__LEGACY_BACKEND_ORIGIN__ || window.location.origin;
    return `${origin}/${img.startsWith('/') ? img.slice(1) : img}`;
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const topRes = await api.get('/users/banners?type=top');
        const topData = unwrapApiPayload(topRes);
        if (topData && Array.isArray(topData.results)) {
          setTopBanners(topData.results);
        }
      } catch (err) {
        console.log('Failed to fetch top banners in DesktopHome:', err);
      }

      try {
        const bottomRes = await api.get('/users/banners?type=bottom');
        const bottomData = unwrapApiPayload(bottomRes);
        if (bottomData && Array.isArray(bottomData.results)) {
          setBottomBanners(bottomData.results);
        }
      } catch (err) {
        console.log('Failed to fetch bottom banners in DesktopHome:', err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const user = await userAuthService.getCurrentUser();
        if (active && user) {
          setUserInfo(user);
        }
      } catch (err) {
        console.log('Failed to fetch user in DesktopHome:', err);
      }
    };
    fetchUser();
    return () => {
      active = false;
    };
  }, []);
  const routePrefix = location.pathname.startsWith('/taxi/user') ? '/taxi/user' : '';
  const currentRideRef = useRef(currentRide);
  const lastSyncAtRef = useRef(0);
  const consecutiveIdleMissesRef = useRef(0);
  const lastRideSignatureRef = useRef(getCurrentRideSignature(currentRide));

  const persistCurrentRide = (ride) => {
    const normalizedRide = isActiveCurrentRide(ride) ? ride : null;
    const nextSignature = getCurrentRideSignature(normalizedRide);

    if (lastRideSignatureRef.current === nextSignature) {
      return;
    }

    lastRideSignatureRef.current = nextSignature;
    setCurrentRide(normalizedRide);

    if (normalizedRide) {
      saveCurrentRide(normalizedRide);
    } else {
      clearCurrentRide();
    }
  };

  useEffect(() => {
    currentRideRef.current = currentRide;
    lastRideSignatureRef.current = getCurrentRideSignature(currentRide);
  }, [currentRide]);

  const handleEndRide = async () => {
    if (!currentRide?.rideId) return;

    try {
      setEndingRide(true);
      const response = await userService.endRentalRide(currentRide.rideId);
      const payload = response?.data || null;
      const nextRideState = {
        ...currentRide,
        ...payload,
        rideId: payload?.id || currentRide.rideId,
        status: payload?.status || 'end_requested',
        liveStatus: payload?.status || 'end_requested',
      };
      persistCurrentRide(nextRideState);
      navigate(`${routePrefix}/rental/confirmed`, {
        state: nextRideState,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setEndingRide(false);
    }
  };

  const shouldTickClock =
    String(currentRide?.serviceType || '').toLowerCase() === 'rental'
    || Number.isFinite(currentRide?.scheduledAt ? new Date(currentRide.scheduledAt).getTime() : NaN);

  useEffect(() => {
    if (!shouldTickClock) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [shouldTickClock]);

  useEffect(() => {
    let cancelled = false;
    const scheduleDeferredSections = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
        if (!cancelled) {
          setShowDeferredSections(true);
        }
      }, { timeout: DEFERRED_SECTION_DELAY_MS })
      : window.setTimeout(() => {
        if (!cancelled) {
          setShowDeferredSections(true);
        }
      }, DEFERRED_SECTION_DELAY_MS);

    return () => {
      cancelled = true;
      if (typeof scheduleDeferredSections === 'number') {
        window.clearTimeout(scheduleDeferredSections);
        return;
      }

      window.cancelIdleCallback?.(scheduleDeferredSections);
    };
  }, []);

  useEffect(() => {
    const refreshCurrentRide = () => {
      const ride = getCurrentRide();
      if (String(ride?.serviceType || '').toLowerCase() === 'rental') {
        const normalizedRentalRide = normalizeRentalCurrentRideSnapshot(ride, currentRideRef.current || {});
        const nextRide = isActiveCurrentRide(normalizedRentalRide) ? normalizedRentalRide : null;
        lastRideSignatureRef.current = getCurrentRideSignature(nextRide);
        setCurrentRide(nextRide);
        return;
      }
      const nextRide = isActiveCurrentRide(ride) ? ride : null;
      lastRideSignatureRef.current = getCurrentRideSignature(nextRide);
      setCurrentRide(nextRide);
    };

    refreshCurrentRide();
    window.addEventListener('storage', refreshCurrentRide);
    window.addEventListener(CURRENT_RIDE_UPDATED_EVENT, refreshCurrentRide);

    let cancelled = false;
    let syncTimer = null;
    let syncInFlight = false;

    const scheduleNextSync = () => {
      if (cancelled) {
        return;
      }

      const nextInterval = currentRideRef.current
        ? ACTIVE_RIDE_SYNC_INTERVAL_MS
        : IDLE_RIDE_SYNC_INTERVALS_MS[Math.min(consecutiveIdleMissesRef.current, IDLE_RIDE_SYNC_INTERVALS_MS.length - 1)];
      syncTimer = window.setTimeout(() => {
        syncCurrentRide();
      }, nextInterval);
    };

    const syncCurrentRide = async (reason = 'timer') => {
      if (cancelled || syncInFlight || document.visibilityState === 'hidden') {
        scheduleNextSync();
        return;
      }

      if (
        reason !== 'timer' &&
        Date.now() - lastSyncAtRef.current < FORCED_SYNC_COOLDOWN_MS
      ) {
        return;
      }

      syncInFlight = true;
      lastSyncAtRef.current = Date.now();
      try {
        const token = localStorage.getItem('userToken') || localStorage.getItem('token');
        if (!token) {
          persistCurrentRide(null);
          currentRideRef.current = null;
          consecutiveIdleMissesRef.current = 0;
          return;
        }

        let rideData = null;

        try {
          rideData = unwrapApiPayload(await api.get('/rides/active/me'));
        } catch (error) {
          const status = Number(error?.response?.status || 0);
          if (status !== 404) {
            throw error;
          }
        }

        if (rideData?._id || rideData?.rideId) {
          const normalizedRide = {
            rideId: rideData._id || rideData.rideId,
            pickup: rideData.pickupAddress || rideData.pickup,
            drop: rideData.dropAddress || rideData.drop,
            pickupCoords: rideData.pickupLocation?.coordinates || rideData.pickupCoords || null,
            dropCoords: rideData.dropLocation?.coordinates || rideData.dropCoords || null,
            fare: rideData.fare,
            baseFare: rideData.baseFare || rideData.fare || 0,
            status: rideData.status,
            liveStatus: rideData.liveStatus,
            serviceType: rideData.serviceType,
            scheduledAt: rideData.scheduledAt || null,
            acceptedAt: rideData.acceptedAt || null,
            arrivedAt: rideData.arrivedAt || null,
            estimatedDistanceMeters: rideData.estimatedDistanceMeters || 0,
            estimatedDurationMinutes: rideData.estimatedDurationMinutes || 0,
            paymentMethod: rideData.paymentMethod || 'Cash',
            pricingSnapshot: rideData.pricingSnapshot || null,
            otp: rideData.otp || '',
            driver: rideData.driverId || rideData.driver,
            vehicleIconUrl: rideData.vehicleIconUrl,
            vehicleIconType: rideData.vehicleIconType,
          };
          if (isActiveCurrentRide(normalizedRide)) {
            if (cancelled) return;
            consecutiveIdleMissesRef.current = 0;
            persistCurrentRide(normalizedRide);
            currentRideRef.current = normalizedRide;
            return;
          }
        }

        try {
          const rentalResponse = await userService.getActiveRentalBooking();
          const rentalRide = unwrapApiPayload(rentalResponse);

          if (rentalRide?.id) {
            const status = String(rentalRide.status || '').toLowerCase();
            const isTerminal = ['completed', 'cancelled', 'delivered'].includes(status);

            if (isTerminal) {
              if (cancelled) return;
              consecutiveIdleMissesRef.current = Math.min(
                consecutiveIdleMissesRef.current + 1,
                IDLE_RIDE_SYNC_INTERVALS_MS.length - 1,
              );
              clearCurrentRide();
              currentRideRef.current = null;
              return;
            }

            if (cancelled) return;
            consecutiveIdleMissesRef.current = 0;
            const previousRentalRide = currentRideRef.current && String(currentRideRef.current.serviceType || '').toLowerCase() === 'rental'
              ? currentRideRef.current
              : {};
            const nextRentalRide = normalizeRentalCurrentRideSnapshot({
              ...rentalRide,
              pickup: rentalRide.serviceLocation?.name || rentalRide.serviceLocation?.address || 'Rental pickup',
              drop: rentalRide.assignedVehicle?.name || rentalRide.vehicleName || 'Assigned vehicle',
            }, previousRentalRide);
            persistCurrentRide(nextRentalRide);
            currentRideRef.current = nextRentalRide;
            return;
          }
        } catch (error) {
          const status = Number(error?.response?.status || 0);
          if (status !== 404) {
            // Keep the previous card on transient failures, but don't block normal cleanup on 404/not found.
            return;
          }
        }

        if (cancelled) return;
        consecutiveIdleMissesRef.current = Math.min(
          consecutiveIdleMissesRef.current + 1,
          IDLE_RIDE_SYNC_INTERVALS_MS.length - 1,
        );
        persistCurrentRide(null);
        currentRideRef.current = null;
      } finally {
        syncInFlight = false;
        scheduleNextSync();
      }
    };

    const handleWindowFocus = () => {
      if (document.visibilityState !== 'hidden') {
        syncCurrentRide('focus');
      }
    };

    syncCurrentRide('mount');
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleWindowFocus);

    return () => {
      cancelled = true;
      if (syncTimer) {
        window.clearTimeout(syncTimer);
      }
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleWindowFocus);
      window.removeEventListener('storage', refreshCurrentRide);
      window.removeEventListener(CURRENT_RIDE_UPDATED_EVENT, refreshCurrentRide);
    };
  }, []);

  const driverName = currentRide?.driver?.name || 'Captain';
  const serviceType = String(currentRide?.serviceType || currentRide?.type || 'ride').toLowerCase();
  const vehicleLabel = currentRide?.driver?.vehicle || currentRide?.driver?.vehicleType || (serviceType === 'parcel' ? 'Parcel' : serviceType === 'rental' ? 'Rental' : 'Taxi');
  const currentRideIcon = getCurrentRideIcon(currentRide);
  const trackingPath =
    serviceType === 'parcel'
      ? `${routePrefix}/parcel/tracking`
      : serviceType === 'rental'
        ? `${routePrefix}/rental/confirmed`
        : `${routePrefix}/ride/tracking`;
  const rideStage = String(currentRide?.liveStatus || currentRide?.status || 'accepted').toLowerCase();
  const hasAssignedDriver = Boolean(currentRide?.driver?._id || currentRide?.driver?.id || currentRide?.driver?.name);
  const scheduledTimestamp = currentRide?.scheduledAt ? new Date(currentRide.scheduledAt).getTime() : NaN;
  const isScheduledRide = Number.isFinite(scheduledTimestamp);
  const isScheduledUpcoming = isScheduledRide && scheduledTimestamp > clockNow;
  const isScheduledAcceptedRide = ['ride', 'intercity'].includes(serviceType) && isScheduledUpcoming && hasAssignedDriver && ['accepted', 'arriving'].includes(rideStage);
  const rideStageLabel =
    serviceType === 'rental'
      ? rideStage === 'end_requested'
        ? 'End ride review pending'
        : rideStage === 'assigned'
          ? 'Rental in progress'
          : 'Rental booking active'
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
  const rentalElapsedSeconds = serviceType === 'rental' && currentRide?.assignedAt
    ? String(currentRide?.status || '').toLowerCase() === 'end_requested' && Number(currentRide?.finalElapsedMinutes || 0) > 0
      ? Number(currentRide.finalElapsedMinutes || 0) * 60
      : Math.max(1, Math.floor((clockNow - new Date(currentRide.assignedAt).getTime()) / 1000))
    : Number(currentRide?.elapsedMinutes || 0) * 60;

  const computeRentalLiveCharge = (ride = {}, elapsedSeconds = 0) => {
    const basePrice = Math.max(
      Number(ride?.basePrice || 0),
      Number(ride?.selectedPackage?.price || 0),
      Number(ride?.advancePaid || 0),
      0,
    );
    const includedHours = Math.max(
      Number(ride?.includedHours || 0),
      Number(ride?.selectedPackage?.durationHours || 0),
      Number(ride?.requestedHours || 0) > 0 && Number(ride?.extraHourRate || 0) <= 0 ? Number(ride.requestedHours) : 0,
      1,
    );
    const extraHourRate = Math.max(
      Number(ride?.extraHourRate || 0),
      Number(ride?.selectedPackage?.extraHourPrice || 0),
      0,
    );
    const elapsedHours = Math.max(0, elapsedSeconds / 3600);
    const packageCharge = elapsedHours <= includedHours
      ? basePrice
      : basePrice + Math.ceil(Math.max(0, elapsedHours - includedHours)) * extraHourRate;

    return Math.max(Number(ride?.advancePaid || 0), packageCharge);
  };

  const rentalCurrentCharge = serviceType === 'rental'
    ? String(currentRide?.status || '').toLowerCase() === 'end_requested' && Number(currentRide?.finalCharge || 0) > 0
      ? Number(currentRide.finalCharge || 0)
      : computeRentalLiveCharge(currentRide, rentalElapsedSeconds)
    : Number(currentRide?.fare || 0);

  const formatRentalTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  const rentalTimerLabel = serviceType === 'rental' ? formatRentalTime(rentalElapsedSeconds) : '';
  const footerIllustrationBg = {
    backgroundImage: `url(${rajwadaPalaceImg})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center bottom',
    backgroundSize: 'cover',
  };
  const footerIllustrationFadeMask = {
    WebkitMaskImage:
      'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
    maskImage:
      'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  };

  const footerIllustrationEdgeBlurMask = {
    WebkitMaskImage:
      'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 16%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 100%)',
    maskImage:
      'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 16%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 100%)',
    WebkitMaskRepeat: 'no-repeat',
maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  };

  return (
    <div className="min-h-screen bg-[#070708] text-white pt-24 pb-12 px-6 lg:px-12 font-sans relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFC107]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Welcome Section & Quick User Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome Back, <span className="text-[#FFC107]">{userInfo?.name || userInfo?.phone || 'Explorer'}</span>!
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Where would you like to travel today? Select one of our premium services below.
            </p>
          </div>
          {userInfo && (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-12 h-12 rounded-full bg-[#FFC107] text-black font-extrabold flex items-center justify-center text-lg shadow-lg">
                {userInfo.name ? userInfo.name.slice(0, 2).toUpperCase() : userInfo.phone ? userInfo.phone.slice(-2) : 'EX'}
              </div>
              <div>
                <p className="font-bold text-sm">{userInfo.name || userInfo.phone || 'User'}</p>
                <p className="text-xs text-gray-400">{userInfo.email || userInfo.phone || ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Active Scheduled Ride Box */}
        {isScheduledAcceptedRide && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate(trackingPath, { state: currentRide })}
            className="block w-full overflow-hidden rounded-[32px] border border-emerald-500/30 bg-emerald-950/20 p-6 text-left shadow-[0_24px_48px_rgba(16,185,129,0.06)] backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-400">
                <ShieldCheck size={12} strokeWidth={3} />
                Confirmed
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400">Live Status</span>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div className="min-w-0">
                <h2 className="text-[32px] font-semibold tracking-tight text-white leading-none">
                  {scheduledCountdown}
                </h2>
                <p className="mt-2 text-[14px] font-medium text-gray-400">
                  {scheduledDateLabel}
                </p>
              </div>
              <div className="relative mb-1">
                <div className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a0a0a] shadow-2xl border border-white/10">
                  <img src={currentRideIcon} alt="" className="h-10 w-10 object-contain" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/5 p-3 shadow-sm border border-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <User size={20} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 leading-none">Driver & Vehicle</p>
                  <p className="mt-1 truncate text-[13px] font-semibold text-white">{driverName} • {vehicleLabel}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 leading-none">Fare</p>
                <p className="mt-1 text-[13px] font-semibold text-white">₹{Number(currentRide?.fare || 0).toFixed(0)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3.5 text-white border border-white/5 shadow-xl">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400">Trip Route</p>
                <div className="mt-1 flex items-center gap-2 text-[12px] font-medium">
                  <span className="truncate max-w-[150px] text-white/90">{(currentRide?.pickup || 'Pickup').split(',')[0]}</span>
                  <ChevronRight size={12} className="text-white/30" />
                  <span className="truncate max-w-[150px] text-[#FFC107]">{(currentRide?.drop || 'Drop').split(',')[0]}</span>
                </div>
              </div>
              <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                <ChevronRight size={18} strokeWidth={3} className="text-white" />
              </div>
            </div>
          </motion.button>
        )}

        {/* Dynamic Promotional Banner Carousel (Top Banner) */}
        {topBanners.length > 0 && (
          <div className="w-full relative overflow-hidden rounded-3xl h-[280px] border border-white/10 shadow-2xl bg-black">
            {topBanners.map((banner, idx) => (
              <div
                key={banner?._id || idx}
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 flex items-center px-10 md:px-16"
                style={{
                  backgroundImage: `url('${resolveBannerImage(banner?.image)}')`,
                  opacity: idx === activeTopIndex ? 1.0 : 0,
                  zIndex: idx === activeTopIndex ? 1 : 0
                }}
              >
                {banner?.title && (
                  <div className="relative z-10 max-w-lg bg-black/60 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                    <h2 className="text-2xl font-black text-white">{banner.title}</h2>
                    <p className="text-xs text-gray-300 mt-2">{banner.description}</p>
                    {banner.redirect_url && (
                      <button
                        onClick={() => navigate(banner.redirect_url)}
                        className="mt-4 px-6 py-2 bg-[#FFC107] hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-colors"
                      >
                        Explore Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {topBanners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {topBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTopIndex(idx)}
                    className={`h-2 rounded-full transition-all ${idx === activeTopIndex ? 'w-6 bg-[#FFC107]' : 'w-2 bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Primary Booking Services Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-[#FFC107] rounded-full" />
            <h2 className="text-2xl font-extrabold tracking-tight">Choose Your Destination Mode</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Cars (Self Drive) */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/15 rounded-[32px] p-6 flex flex-col justify-between transition-all cursor-pointer h-[380px] shadow-lg group relative overflow-hidden"
              onClick={() => navigate('/taxi/user/rental/type')}
            >
              {/* Card Hover Ambient Light */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#FFC107] bg-[#FFC107]/10 px-3 py-1 rounded-full">
                  Self Drive
                </span>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">directions_car</span>
              </div>
              
              <div className="my-auto flex items-center justify-center h-[140px] drop-shadow-2xl">
                <img 
                  src={carIcon} 
                  alt="Cars (Self Drive)" 
                  className="h-[120px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold leading-tight">Cars (Self Drive)</h3>
                  <p className="text-xs text-gray-400 mt-2">
                    Drive yourself on your own terms. Unlimited freedom, clean sanitized cars.
                  </p>
                </div>
                <div className="w-full bg-[#FFC107] hover:bg-amber-400 text-black text-xs font-extrabold px-4 py-3 rounded-2xl flex items-center justify-between transition-all">
                  <span>Start Booking</span>
                  <ChevronRight size={16} strokeWidth={3} />
                </div>
              </div>
            </motion.div>

            {/* Card 2: Cars With Chauffeur */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/15 rounded-[32px] p-6 flex flex-col justify-between transition-all cursor-pointer h-[380px] shadow-lg group relative overflow-hidden"
              onClick={() => navigate('/taxi/user/ride/select-location')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC107]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                  Chauffeur Driven
                </span>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">person</span>
              </div>
              
              <div className="my-auto flex items-center justify-center h-[140px] drop-shadow-2xl">
                <img 
                  src={carIcon} 
                  alt="Cars With Driver" 
                  className="h-[120px] w-auto object-contain transition-transform duration-300 group-hover:scale-105 brightness-125"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold leading-tight">Cabs with Driver</h3>
                  <p className="text-xs text-gray-400 mt-2">
                    Premium standard. Local commutes, airport drop-offs, and outstation trips.
                  </p>
                </div>
                <div className="w-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-extrabold px-4 py-3 rounded-2xl flex items-center justify-between transition-all">
                  <span>Book Now</span>
                  <ChevronRight size={16} strokeWidth={3} />
                </div>
              </div>
            </motion.div>

            {/* Card 3: Bikes Rentals */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/15 rounded-[32px] p-6 flex flex-col justify-between transition-all cursor-pointer h-[380px] shadow-lg group relative overflow-hidden"
              onClick={() => navigate('/taxi/user/rental')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-400/10 px-3 py-1 rounded-full">
                  2 Wheelers
                </span>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">motorcycle</span>
              </div>
              
              <div className="my-auto flex items-center justify-center h-[140px] drop-shadow-2xl">
                <img 
                  src={bikeIcon} 
                  alt="Bikes" 
                  className="h-[120px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold leading-tight">Bikes & Scooters</h3>
                  <p className="text-xs text-gray-400 mt-2">
                    Zip through the streets. Rent scooters and sports bikes for flexible, quick rides.
                  </p>
                </div>
                <div className="w-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-extrabold px-4 py-3 rounded-2xl flex items-center justify-between transition-all">
                  <span>Explore Bikes</span>
                  <ChevronRight size={16} strokeWidth={3} />
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Secondary Services and Sidebar/Activity Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* More Services Grid - Column span 8 */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-[#FFC107] rounded-full" />
              <h2 className="text-2xl font-extrabold tracking-tight">Additional Services</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              
              {/* Monthly Subscription */}
              <button 
                onClick={() => navigate('/taxi/user/profile/subscriptions')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer active:scale-95 group shadow-sm h-36"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-[#FFC107] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">calendar_month</span>
                </div>
                <span className="text-xs font-extrabold text-gray-200 group-hover:text-white leading-tight">Monthly Subscription</span>
              </button>

              {/* My Bookings */}
              <button 
                onClick={() => navigate('/taxi/user/activity')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer active:scale-95 group shadow-sm h-36"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-[#FFC107] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">history_edu</span>
                </div>
                <span className="text-xs font-extrabold text-gray-200 group-hover:text-white leading-tight">My Bookings</span>
              </button>

              {/* Travel Packages */}
              <button 
                onClick={() => navigate('/taxi/user/cab/spiritual')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer active:scale-95 group shadow-sm h-36"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-[#FFC107] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">travel_explore</span>
                </div>
                <span className="text-xs font-extrabold text-gray-200 group-hover:text-white leading-tight">Travel Packages</span>
              </button>

              {/* Internship Program */}
              <button 
                onClick={() => navigate('/taxi/user/onboarding')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer active:scale-95 group shadow-sm h-36"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-[#FFC107] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">school</span>
                </div>
                <span className="text-xs font-extrabold text-gray-200 group-hover:text-white leading-tight">Internship Program</span>
              </button>

              {/* Attach Car */}
              <button 
                onClick={() => navigate('/taxi/driver/login')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer active:scale-95 group shadow-sm h-36"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-[#FFC107] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">add_to_drive</span>
                </div>
                <span className="text-xs font-extrabold text-gray-200 group-hover:text-white leading-tight">Attach Car</span>
              </button>

              {/* Driver Registration */}
              <button 
                onClick={() => navigate('/taxi/driver/login')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer active:scale-95 group shadow-sm h-36"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-[#FFC107] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">badge</span>
                </div>
                <span className="text-xs font-extrabold text-gray-200 group-hover:text-white leading-tight">Driver Registration</span>
              </button>

            </div>
          </div>

          {/* Recommended Destination Box / Featured Activity - Column span 4 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-[#FFC107] rounded-full" />
              <h2 className="text-2xl font-extrabold tracking-tight">Recommended</h2>
            </div>

            {bottomBanners.length > 0 ? (
              <div 
                onClick={() => {
                  const activeBanner = bottomBanners[activeBottomIndex];
                  if (activeBanner?.redirect_url) {
                    navigate(activeBanner.redirect_url);
                  } else {
                    navigate('/taxi/user/cab/spiritual');
                  }
                }}
                className="relative w-full rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl border border-white/10 bg-[#0f0f0f] cursor-pointer group"
              >
                {bottomBanners.map((banner, idx) => (
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
                
                {/* Overlay details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10 flex flex-col justify-end p-6">
                  <span className="text-[10px] text-black bg-[#FFC107] w-fit px-2.5 py-1 rounded-md mb-2 font-black uppercase tracking-wider">
                    Exclusive Package
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-[#FFC107] transition-colors leading-tight">
                    {bottomBanners[activeBottomIndex]?.title || 'Explore Holy Cities'}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Book professional packages with one tap.</p>
                </div>
              </div>
            ) : (
              // Default Fallback matching mobile
              <div 
                onClick={() => navigate('/taxi/user/cab/spiritual')}
                className="relative w-full rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl border border-white/10 bg-[#0f0f0f] cursor-pointer group"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                  style={{ 
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBWZteCbE_j6SFXw3oLemD9RMuU6oxI4J192AicZ4IRSu3hqfSboUsL6jl3VRpT7HVEFMndAp-Y8hCcRjlIr3_WniVu-TbpooYQ5FGEcT53HsRLxpE58KmPOhq7gKzLTa2DFx1au_cKja2e7gkrUidFjQC-MFjgxZqUWJ7EcC8CBvt0woveQXh-ltVYXIw4o9jlzyx8F49kt33arwglmgIXN01V4pCTb4v_vri47kZzo1Bjq2pzjsUv2rW5JS8dD8zyCgGu2KqWk1o')`,
                  }}
                />
                
                {/* Overlay details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent z-10 flex flex-col justify-end p-6">
                  <span className="text-[10px] text-black bg-[#FFC107] w-fit px-2.5 py-1 rounded-md mb-2 font-black uppercase tracking-wider">
                    Recommended
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-[#FFC107] transition-colors leading-tight">
                    MAHAKALESHWAR
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Darshan Tour Package</p>
                </div>
              </div>
            )}
          </div>
          
        </div>

      </div>

      <AnimatePresence>
        {currentRide && serviceType !== 'rental' && (
          <Motion.button
            type="button"
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.96 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(trackingPath, { state: currentRide })}
            className="fixed bottom-24 left-4 right-4 z-[60] mx-auto flex max-w-[calc(32rem-2rem)] items-center gap-3 rounded-[20px] border border-white/80 bg-white/95 px-4 py-3 text-left shadow-[0_12px_34px_rgba(15,23,42,0.16)] backdrop-blur-xl"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-slate-900 shadow-lg">
              <img src={currentRideIcon} alt={vehicleLabel} className="h-8 w-8 object-contain" draggable={false} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-orange-600">
                  {isScheduledAcceptedRide
                    ? 'Scheduled ride ready'
                    : serviceType === 'parcel'
                      ? 'Parcel in progress'
                      : serviceType === 'rental'
                        ? (rideStage === 'end_requested' ? 'Rental end review' : 'Rental in progress')
                        : 'Current Ride'}
                </p>
              </div>
              <p className="mt-0.5 truncate text-[14px] font-semibold leading-tight text-slate-900">
                {rideStageContextLabel}
              </p>
              {isScheduledAcceptedRide ? (
                <div className="mt-1 flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    <CalendarClock size={11} />
                    {scheduledDateLabel}
                  </span>
                  {scheduledCountdown ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                      {scheduledCountdown}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <MapPin size={12} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                <span className="truncate">{currentRide.pickup || 'Pickup location'}</span>
              </div>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <MapPin size={12} className="shrink-0 text-orange-500" strokeWidth={2.5} />
                <span className="truncate">{currentRide.drop || 'Drop location'}</span>
              </div>
              {serviceType === 'rental' ? (
                <div className="mt-1 flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                    <Clock3 size={11} className="text-slate-500" />
                    {rentalTimerLabel}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    Live charge Rs {rentalCurrentCharge.toFixed(0)}
                  </span>
                </div>
              ) : isScheduledAcceptedRide ? (
                <div className="mt-1 flex items-center gap-2 text-[10px] font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-sky-700">
                    <User size={11} />
                    {driverName}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                    Live tracking unlocks soon
                  </span>
                </div>
              ) : null}
            </div>
            <div className="shrink-0 text-right flex flex-col items-end gap-1">
              <p className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-900">
                Rs {Number(serviceType === 'rental' ? rentalCurrentCharge : currentRide.fare || 0).toFixed(0)}
              </p>
              <div className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-[12px] bg-slate-900 text-white shadow-md">
                <ChevronRight size={18} strokeWidth={3} />
              </div>
            </div>
          </Motion.button>
        )}
      </AnimatePresence>

      <BottomNavbar />
    </div>
  );
};

export default DesktopHome;
