import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Fuel,
  Image as ImageIcon,
  Luggage,
  Loader2,
  MapPin,
  Navigation,
  Shield,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../../../shared/context/SettingsContext';
import { HAS_VALID_GOOGLE_MAPS_KEY, INDIA_CENTER, useAppGoogleMapsLoader } from '../../../admin/utils/googleMaps';
import { userService } from '../../services/userService';
import { withHistorySafeStateOptions } from '../../../../shared/utils/historyState';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const RENTAL_SELECTED_VEHICLE_STORAGE_KEY = 'selectedRentalVehicleDetail';
const RENTAL_SCHEDULE_STATE_KEY = 'taxi:rental-schedule-pending';
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_OPTIONS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60';
const pickerTriggerClass =
  'w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3.5 text-left text-sm text-slate-800 shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition-all';

const pad = (n) => String(n).padStart(2, '0');
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const isSameDay = (left, right) =>
  Boolean(left) &&
  Boolean(right) &&
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();
const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstDayIndex; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
};
const formatTimeLabel = (time) => {
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  const displayHour = hours % 12 || 12;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${pad(minutes)} ${suffix}`;
};
const formatDateTimeValue = (date, time) => {
  const [hours, minutes] = String(time || '00:00').split(':');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${hours}:${minutes}`;
};
const parseDateTimeValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const splitDateTimeValue = (value, fallbackDate = new Date(), fallbackTime = '10:00') => {
  const parsed = parseDateTimeValue(value);
  if (!parsed) {
    return {
      date: new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), fallbackDate.getDate()),
      time: fallbackTime,
    };
  }

  return {
    date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
};
const formatPickerSummary = (value) => {
  const parsed = parseDateTimeValue(value);
  if (!parsed) return 'Choose date and time';
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const formatSubscriptionDuration = (days) => {
  const value = Number(days || 0);
  if (!value) return 'Plan';
  if (value === 1) return '1 day';
  if (value < 30) return `${value} days`;
  if (value % 30 === 0) {
    const months = value / 30;
    return `${months} Month${months > 1 ? 's' : ''}`;
  }
  if (value % 365 === 0) {
    const years = value / 365;
    return `${years} Year${years > 1 ? 's' : ''}`;
  }
  return `${value} days`;
};
const getVehicleFuelLabel = (vehicle) =>
  vehicle?.fuel ||
  vehicle?.fuelType ||
  (String(vehicle?.shortDescription || '').split('·')[0] || '').trim() ||
  'Petrol';
const getVehicleTransmissionLabel = (vehicle) => {
  if (vehicle?.transmission) return vehicle.transmission;
  const pieces = String(vehicle?.shortDescription || '')
    .split('·')
    .map((item) => item.trim())
    .filter(Boolean);
  return pieces[1] || 'Manual';
};
const getVehicleVariantLabel = (vehicle) =>
  vehicle?.variant ||
  vehicle?.color ||
  vehicle?.vehicleColor ||
  vehicle?.subCategory ||
  vehicle?.rentalSubcategoryName ||
  'As per availability';

const DateTimePickerModal = ({
  open,
  title,
  monthDate,
  selectedDate,
  selectedTime,
  minDate,
  minTime,
  onMonthChange,
  onDateSelect,
  onTimeSelect,
  onClose,
  onApply,
}) => {
  const days = useMemo(() => buildCalendarDays(monthDate), [monthDate]);
  const minDay = startOfDay(minDate);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end bg-slate-950/45"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="w-full rounded-t-[28px] bg-[#f8fafc] px-5 pb-6 pt-4 shadow-[0_-20px_60px_rgba(15,23,42,0.25)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-300" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500/80">
                Pick Schedule
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-slate-950">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
            >
              Close
            </button>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onMonthChange(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-[14px] font-bold text-slate-950">
                {monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
              <button
                type="button"
                onClick={() => onMonthChange(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2 text-center">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-10" />;
                }

                const disabled = startOfDay(day) < minDay;
                const selected = isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => onDateSelect(day)}
                    className={`h-10 rounded-[12px] text-[12px] font-bold transition-all ${
                      selected
                        ? 'bg-[#2e3c78] text-white shadow-[0_10px_24px_rgba(46,60,120,0.28)]'
                        : disabled
                          ? 'bg-slate-100 text-slate-300'
                          : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="mb-3 flex items-center gap-2">
              <Clock size={15} className="text-slate-400" />
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500/80">
                Select Time
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TIME_OPTIONS.map((time) => {
                const disabled =
                  isSameDay(selectedDate, minDate) && String(time) < String(minTime || '00:00');
                const selected = selectedTime === time;

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={disabled}
                    onClick={() => onTimeSelect(time)}
                    className={`rounded-[12px] px-3 py-2.5 text-[11px] font-bold transition-all ${
                      selected
                        ? 'bg-[#2e3c78] text-white'
                        : disabled
                          ? 'bg-slate-100 text-slate-300'
                          : 'border border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {formatTimeLabel(time)}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onApply}
            className="mt-5 w-full rounded-[18px] bg-[#2e3c78] px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_26px_rgba(46,60,120,0.28)]"
          >
            Apply Date & Time
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SeatPreview = ({ blueprint }) => {
  const rows = blueprint?.lowerDeck || [];

  if (!rows.length) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-6 text-center text-[12px] font-semibold text-slate-400">
        No seating blueprint available
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, row.length)}, minmax(0, 1fr))` }}
          >
            {row.map((cell, cellIndex) => (
              <div
                key={`${rowIndex}-${cellIndex}`}
                className={`h-11 rounded-2xl ${
                  cell?.kind === 'seat'
                    ? cell.status === 'blocked'
                      ? 'border border-rose-200 bg-rose-50'
                      : 'border border-slate-200 bg-white'
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const packageSuffix = (hours) => {
  const value = Number(hours || 0);
  if (value <= 1) return '/hr';
  if (value <= 12) return `/${value}hr`;
  return '/day';
};

const toRadians = (value) => (Number(value) * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  if (!from || !to) return null;

  const fromLat = Number(from.latitude);
  const fromLng = Number(from.longitude);
  const toLat = Number(to.latitude);
  const toLng = Number(to.longitude);

  if (
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLng) ||
    !Number.isFinite(toLat) ||
    !Number.isFinite(toLng)
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (value) => {
  if (!Number.isFinite(value)) return null;
  if (value < 1) return `${Math.max(100, Math.round(value * 1000))} m away`;
  return `${value.toFixed(value < 10 ? 1 : 0)} km away`;
};

const toMapPoint = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return null;
};

const buildRentalMapPinIcon = (color = '#10b981', isSelected = false) => {
  const pinSvg = `
    <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 41C17 41 31 27.2 31 17C31 9.26801 24.732 3 17 3C9.26801 3 3 9.26801 3 17C3 27.2 17 41 17 41Z" fill="${color}" stroke="${isSelected ? '#ffffff' : '#E2E8F0'}" stroke-width="${isSelected ? 3 : 2}"/>
      <circle cx="17" cy="17" r="5.5" fill="white"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pinSvg)}`,
    scaledSize: new window.google.maps.Size(isSelected ? 34 : 30, isSelected ? 42 : 38),
    anchor: new window.google.maps.Point(isSelected ? 17 : 15, isSelected ? 42 : 38),
  };
};

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data?.data?.results)) return payload.data.data.results;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeId = (value) =>
  String(value?._id || value?.id || value?.service_location_id || value || '').trim();

const resolveStoreServiceLocationId = (store = {}) =>
  normalizeId(
    store.service_location_id ||
    store.zone_id?.service_location_id ||
    '',
  );

const getCurrentCoordinates = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
        }),
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  });

const readStoredRentalVehicleDetail = () => {
  try {
    const raw = window.sessionStorage.getItem(RENTAL_SELECTED_VEHICLE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const readStoredUserInfo = () => {
  try {
    const raw = window.localStorage.getItem('userInfo');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const RentalVehicleDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const appName = settings.general?.app_name || 'App';
  const storedDetail = useMemo(() => readStoredRentalVehicleDetail(), []);
  const storedUserInfo = useMemo(() => readStoredUserInfo(), []);
  const initialVehicle = location.state?.vehicle || storedDetail?.vehicle || null;
  const duration = location.state?.duration || storedDetail?.duration || 'Hourly';
  const detailMode = location.state?.detailMode || storedDetail?.detailMode || 'rental';
  const initialSubscriptionPlanId =
    location.state?.selectedSubscriptionPlanId ||
    storedDetail?.selectedSubscriptionPlanId ||
    '';
  const [vehicle, setVehicle] = useState(initialVehicle);

  const [selectedImage, setSelectedImage] = useState(
    vehicle?.gallery?.[0] || vehicle?.galleryImages?.[0] || vehicle?.coverImage || vehicle?.image || '',
  );
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectionStep, setSelectionStep] = useState('package');
  const [serviceLocations, setServiceLocations] = useState([]);
  const [selectedServiceLocationId, setSelectedServiceLocationId] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const mapRef = useRef(null);
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useAppGoogleMapsLoader();
  const [quoteForm, setQuoteForm] = useState({
    contactName: String(storedUserInfo?.name || '').trim(),
    contactPhone: String(storedUserInfo?.phone || '').trim(),
    contactEmail: String(storedUserInfo?.email || '').trim(),
    requestedHours: '',
    pickupLocation: '',
    dropLocation: '',
    seatsNeeded: '',
    luggageNeeded: Number(vehicle?.luggageCapacity || 0) || 0,
    pickupDateTime: '',
    returnDateTime: '',
    specialRequirements: '',
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [activeQuotePicker, setActiveQuotePicker] = useState(null);
  const [quotePickerMonth, setQuotePickerMonth] = useState(() => getMonthStart(new Date()));
  const [quotePickerDate, setQuotePickerDate] = useState(() => startOfDay(new Date()));
  const [quotePickerTime, setQuotePickerTime] = useState('10:00');
  const [selectedSubscriptionPlanId, setSelectedSubscriptionPlanId] = useState(initialSubscriptionPlanId);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(() =>
    formatDateTimeValue(new Date(), '10:00'),
  );

  useEffect(() => {
    setVehicle(initialVehicle);
  }, [initialVehicle]);

  useEffect(() => {
    if (!vehicle?.id && !vehicle?._id) return;

    let active = true;

    const refreshVehicle = async () => {
      try {
        const response = await userService.getRentalVehicles();
        const results =
          response?.data?.results ||
          response?.results ||
          response?.data?.data?.results ||
          [];

        if (!active) return;

        const latestVehicle = results.find(
          (item) => String(item.id || item._id) === String(vehicle.id || vehicle._id),
        );

        if (!latestVehicle) return;

        const mergedGallery = [
          ...(Array.isArray(latestVehicle.galleryImages) ? latestVehicle.galleryImages : []),
          ...(Array.isArray(latestVehicle.gallery) ? latestVehicle.gallery : []),
          ...(Array.isArray(vehicle.galleryImages) ? vehicle.galleryImages : []),
          ...(Array.isArray(vehicle.gallery) ? vehicle.gallery : []),
        ].filter((value, index, array) => value && array.indexOf(value) === index);

        setVehicle((current) => ({
          ...current,
          ...latestVehicle,
          rawPricing: Array.isArray(latestVehicle.pricing)
            ? latestVehicle.pricing
            : Array.isArray(current?.rawPricing)
              ? current.rawPricing
              : [],
          galleryImages: mergedGallery,
          gallery: [
            latestVehicle.coverImage,
            latestVehicle.image,
            ...mergedGallery,
            latestVehicle.map_icon,
          ].filter((value, index, array) => value && array.indexOf(value) === index),
        }));
      } catch {
        // Keep existing route or cached state if refresh fails.
      }
    };

    refreshVehicle();

    return () => {
      active = false;
    };
  }, [vehicle?.id, vehicle?._id]);

  useEffect(() => {
    if (!vehicle) return;

    try {
      window.sessionStorage.setItem(
        RENTAL_SELECTED_VEHICLE_STORAGE_KEY,
        JSON.stringify({
          vehicle,
          duration,
          detailMode,
          selectedSubscriptionPlanId,
        }),
      );
    } catch {
      // Ignore storage failures and continue rendering with route state only.
    }
  }, [detailMode, duration, selectedSubscriptionPlanId, vehicle]);

  if (!vehicle) {
    navigate('/rental');
    return null;
  }

  const gallery = useMemo(
    () =>
      [
        ...(Array.isArray(vehicle.gallery) ? vehicle.gallery : []),
        ...(Array.isArray(vehicle.galleryImages) ? vehicle.galleryImages : []),
        vehicle.coverImage,
        vehicle.image,
        vehicle.map_icon,
      ].filter((value, index, array) => value && array.indexOf(value) === index),
    [vehicle],
  );

  useEffect(() => {
    setSelectedImage(gallery[0] || '');
  }, [gallery]);
  const pricingRows = Array.isArray(vehicle.rawPricing)
    ? [...vehicle.rawPricing].sort(
        (a, b) => Number(a.durationHours || 0) - Number(b.durationHours || 0),
      )
    : Array.isArray(vehicle.pricing)
      ? [...vehicle.pricing].sort(
          (a, b) => Number(a.durationHours || 0) - Number(b.durationHours || 0),
        )
      : [];
  const subscriptionPlans = useMemo(
    () =>
      (Array.isArray(vehicle.subscription?.plans) ? vehicle.subscription.plans : [])
        .filter((plan) => plan?.active !== false && Number(plan?.price || 0) > 0)
        .sort((left, right) => Number(left.durationDays || 0) - Number(right.durationDays || 0)),
    [vehicle.subscription?.plans],
  );
  const selectedSubscriptionPlan = useMemo(
    () =>
      subscriptionPlans.find((plan) => String(plan.id) === String(selectedSubscriptionPlanId)) ||
      subscriptionPlans[0] ||
      null,
    [selectedSubscriptionPlanId, subscriptionPlans],
  );
  const subscriptionFuelLabel = useMemo(() => getVehicleFuelLabel(vehicle), [vehicle]);
  const subscriptionTransmissionLabel = useMemo(
    () => getVehicleTransmissionLabel(vehicle),
    [vehicle],
  );
  const subscriptionVariantLabel = useMemo(() => getVehicleVariantLabel(vehicle), [vehicle]);
  const subscriptionStrikePrice = useMemo(() => {
    const currentPrice = Number(selectedSubscriptionPlan?.price || 0);
    if (!currentPrice) return 0;
    return Math.ceil(currentPrice * 1.18);
  }, [selectedSubscriptionPlan?.price]);

  const defaultPackage = useMemo(() => {
    if (!pricingRows.length) return null;

    if (duration === 'Daily') {
      return (
        pricingRows.find((row) => Number(row.durationHours || 0) >= 24) ||
        pricingRows[pricingRows.length - 1]
      );
    }

    if (duration === 'Half-Day') {
      return (
        pricingRows.find((row) => {
          const hours = Number(row.durationHours || 0);
          return hours >= 6 && hours <= 12;
        }) || pricingRows[Math.min(1, pricingRows.length - 1)]
      );
    }

    return (
      pricingRows.find((row) => Number(row.durationHours || 0) <= 6) ||
      pricingRows[0]
    );
  }, [duration, pricingRows]);

  const selectedPackage = useMemo(
    () =>
      pricingRows.find((row) => String(row.id) === String(selectedPackageId)) ||
      defaultPackage ||
      null,
    [defaultPackage, pricingRows, selectedPackageId],
  );

  const selectedServiceLocation = useMemo(
    () =>
      serviceLocations.find(
        (item) => String(item.id) === String(selectedServiceLocationId),
      ) || null,
    [selectedServiceLocationId, serviceLocations],
  );

  const selectedLocationMapPoint = useMemo(
    () =>
      selectedServiceLocation?.pickupPoints?.[0]?.position ||
      selectedServiceLocation?.primaryPoint ||
      null,
    [selectedServiceLocation],
  );

  const mapCenter = useMemo(
    () => selectedLocationMapPoint || serviceLocations[0]?.primaryPoint || INDIA_CENTER,
    [selectedLocationMapPoint, serviceLocations],
  );

  const mapMarkers = useMemo(
    () =>
      serviceLocations.flatMap((locationItem, index) => {
        const markers = [];
        const isSelected = String(locationItem.id) === String(selectedServiceLocationId);
        const isClosest = index === 0 && Boolean(userCoordinates);

        if (locationItem.primaryPoint && (!locationItem.pickupPoints || locationItem.pickupPoints.length === 0)) {
          markers.push({
            key: `location-${locationItem.id}`,
            position: locationItem.primaryPoint,
            title: locationItem.pickupLabel || locationItem.name,
            type: 'location',
            locationId: locationItem.id,
            isSelected,
            isClosest,
          });
        }

        (locationItem.pickupPoints || []).forEach((pickupPoint, pickupIndex) => {
          markers.push({
            key: `pickup-${locationItem.id}-${pickupPoint.id || pickupIndex}`,
            position: pickupPoint.position,
            title: pickupPoint.name || locationItem.pickupLabel || `${locationItem.name} pickup point`,
            type: 'pickup',
            locationId: locationItem.id,
            isSelected,
            isClosest,
          });
        });

        return markers;
      }),
    [selectedServiceLocationId, serviceLocations, userCoordinates],
  );

  const summaryBadges = useMemo(
    () => [
      { icon: Users, label: `${vehicle.capacity || 0} seats` },
      { icon: Luggage, label: `${vehicle.luggageCapacity || 0} bags` },
      { icon: Fuel, label: vehicle.vehicleCategory || 'Vehicle' },
    ],
    [vehicle],
  );

  useEffect(() => {
    if (defaultPackage?.id) {
      setSelectedPackageId(String(defaultPackage.id));
    }
  }, [defaultPackage]);

  useEffect(() => {
    if (!subscriptionPlans.length) {
      setSelectedSubscriptionPlanId('');
      return;
    }

    setSelectedSubscriptionPlanId((current) => {
      if (current && subscriptionPlans.some((plan) => String(plan.id) === String(current))) {
        return current;
      }

      return String(subscriptionPlans[0]?.id || '');
    });
  }, [subscriptionPlans]);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !window.google?.maps || !mapMarkers.length) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    mapMarkers.forEach((marker) => bounds.extend(marker.position));

    if (bounds.isEmpty()) {
      mapRef.current.setCenter(mapCenter);
      mapRef.current.setZoom(12);
      return;
    }

    if (mapMarkers.length === 1 && selectedLocationMapPoint) {
      mapRef.current.panTo(selectedLocationMapPoint);
      mapRef.current.setZoom(13);
      return;
    }

    mapRef.current.fitBounds(bounds, 56);
  }, [isMapLoaded, mapCenter, mapMarkers, selectedLocationMapPoint]);

  useEffect(() => {
    let mounted = true;

    const loadServiceLocations = async () => {
      setLocationsLoading(true);
      setLocationError('');
      setIsLocatingUser(true);

      try {
        const [locationsResponse, storesResponse, coords] = await Promise.all([
          userService.getServiceLocations(),
          userService.getServiceStores(),
          getCurrentCoordinates(),
        ]);

        if (!mounted) return;

        setUserCoordinates(coords);
        setIsLocatingUser(false);

        const allLocations = normalizeListResponse(locationsResponse).filter(
          (item) => item.active !== false && item.status !== 'inactive',
        );
        const allStores = normalizeListResponse(storesResponse).filter(
          (item) => item.active !== false && item.status !== 'inactive',
        );

        const allowedStoreIds = new Set(
          Array.isArray(vehicle.serviceStoreIds)
            ? vehicle.serviceStoreIds.map((item) => String(item))
            : [],
        );

        const scopedStores = allowedStoreIds.size
          ? allStores.filter((store) => allowedStoreIds.has(String(store._id || store.id)))
          : allStores;

        const allowedLocationIds = new Set(
          scopedStores
            .map((store) => resolveStoreServiceLocationId(store))
            .filter(Boolean),
        );

        const scopedLocations = allowedLocationIds.size
          ? allLocations.filter((item) => allowedLocationIds.has(normalizeId(item)))
          : allLocations;

        const optionsFromLocations = scopedLocations
          .map((item) => {
            const id = normalizeId(item);
            const locationStores = scopedStores.filter(
              (store) => resolveStoreServiceLocationId(store) === id,
            );
            const primaryStore = locationStores.find(
              (store) => String(store.name || '').trim() || String(store.address || '').trim(),
            ) || locationStores[0] || null;
            const pickupPoints = locationStores
              .map((store, storeIndex) => {
                const position = toMapPoint(store.latitude, store.longitude);

                if (!position) return null;

                return {
                  id: String(store._id || store.id || `${id}-pickup-${storeIndex}`),
                  name: store.name || `Pickup point ${storeIndex + 1}`,
                  address: store.address || '',
                  position,
                };
              })
              .filter(Boolean);
            const primaryPoint =
              toMapPoint(item.latitude, item.longitude) ||
              pickupPoints[0]?.position ||
              null;

            const distanceCandidates = [
              calculateDistanceKm(coords, {
                latitude: item.latitude,
                longitude: item.longitude,
              }),
              ...locationStores.map((store) =>
                calculateDistanceKm(coords, {
                  latitude: store.latitude,
                  longitude: store.longitude,
                }),
              ),
            ].filter((value) => Number.isFinite(value));

            const nearestDistanceKm = distanceCandidates.length
              ? Math.min(...distanceCandidates)
              : null;

            return {
              id,
              name: item.service_location_name || item.name || 'Service location',
              pickupLabel: primaryStore?.name || '',
              address:
                primaryStore?.address ||
                item.address ||
                primaryStore?.name ||
                '',
              latitude: Number(item.latitude),
              longitude: Number(item.longitude),
              primaryPoint: pickupPoints[0]?.position || primaryPoint,
              pickupPoints,
              distanceKm: nearestDistanceKm,
              distanceLabel: formatDistance(nearestDistanceKm),
              storeCount: locationStores.length,
            };
          })
          .sort((left, right) => {
            const leftDistance = left.distanceKm;
            const rightDistance = right.distanceKm;

            if (Number.isFinite(leftDistance) && Number.isFinite(rightDistance)) {
              return leftDistance - rightDistance;
            }

            if (Number.isFinite(leftDistance)) return -1;
            if (Number.isFinite(rightDistance)) return 1;

            return left.name.localeCompare(right.name);
          });

        const options =
          optionsFromLocations.length > 0
            ? optionsFromLocations
            : scopedStores
                .map((store, storeIndex) => {
                  const resolvedLocationId = resolveStoreServiceLocationId(store);
                  const matchedLocation = allLocations.find(
                    (item) => normalizeId(item) === resolvedLocationId,
                  );
                  const position = toMapPoint(store.latitude, store.longitude);

                  if (!position) {
                    return null;
                  }

                  const distanceKm = calculateDistanceKm(coords, {
                    latitude: store.latitude,
                    longitude: store.longitude,
                  });

                  return {
                    id: resolvedLocationId || String(store._id || store.id || `store-${storeIndex}`),
                    name:
                      matchedLocation?.service_location_name ||
                      matchedLocation?.name ||
                      store.zone_id?.name ||
                      'Service location',
                    pickupLabel: store.name || '',
                    address: store.address || store.name || '',
                    latitude: Number(store.latitude),
                    longitude: Number(store.longitude),
                    primaryPoint: position,
                    pickupPoints: [
                      {
                        id: String(store._id || store.id || `pickup-${storeIndex}`),
                        name: store.name || `Pickup point ${storeIndex + 1}`,
                        address: store.address || '',
                        position,
                      },
                    ],
                    distanceKm,
                    distanceLabel: formatDistance(distanceKm),
                    storeCount: 1,
                  };
                })
                .filter(Boolean)
                .sort((left, right) => {
                  const leftDistance = left.distanceKm;
                  const rightDistance = right.distanceKm;

                  if (Number.isFinite(leftDistance) && Number.isFinite(rightDistance)) {
                    return leftDistance - rightDistance;
                  }

                  if (Number.isFinite(leftDistance)) return -1;
                  if (Number.isFinite(rightDistance)) return 1;

                  return left.name.localeCompare(right.name);
                });

        setServiceLocations(options);
        setSelectedServiceLocationId(options[0]?.id || '');
      } catch (error) {
        if (!mounted) return;
        setIsLocatingUser(false);
        setLocationError(error?.message || 'Could not load available service locations.');
      } finally {
        if (mounted) setLocationsLoading(false);
      }
    };

    loadServiceLocations();

    return () => {
      mounted = false;
    };
  }, [vehicle.serviceStoreIds]);

  const submitQuote = async () => {
    if (!quoteForm.requestedHours || Number(quoteForm.requestedHours) <= 0) {
      toast.error('Enter required hours');
      return;
    }

    if (!quoteForm.pickupDateTime || !quoteForm.returnDateTime) {
      toast.error('Select the full date range');
      return;
    }

    if (new Date(quoteForm.returnDateTime) <= new Date(quoteForm.pickupDateTime)) {
      toast.error('End date and time must be after the start');
      return;
    }

    if (!quoteForm.contactName.trim() || !quoteForm.contactPhone.trim()) {
      toast.error('Please update your profile name and phone before sending a custom quote');
      return;
    }

    setSubmittingQuote(true);
    try {
      await userService.createRentalQuoteRequest({
        vehicleTypeId: vehicle.id,
        vehicleName: vehicle.name,
        contactName: quoteForm.contactName,
        contactPhone: quoteForm.contactPhone,
        contactEmail: quoteForm.contactEmail,
        requestedHours: Number(quoteForm.requestedHours || 0),
        pickupLocation: quoteForm.pickupLocation,
        dropLocation: quoteForm.dropLocation,
        seatsNeeded: Number(quoteForm.seatsNeeded || 1),
        luggageNeeded: Number(quoteForm.luggageNeeded || 0),
        pickupDateTime: quoteForm.pickupDateTime || null,
        returnDateTime: quoteForm.returnDateTime || null,
        specialRequirements: quoteForm.specialRequirements,
      });
      toast.success('Custom quote request sent to admin for review');
      setShowQuoteForm(false);
      setQuoteForm((current) => ({
        ...current,
        requestedHours: '',
        pickupDateTime: '',
        returnDateTime: '',
      }));
    } catch (error) {
      toast.error(error?.message || 'Could not submit quote request.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const openQuotePicker = (field) => {
    const now = new Date();
    const currentValue =
      field === 'subscriptionStartDate' ? subscriptionStartDate : quoteForm[field];
    const fallbackDate =
      field === 'returnDateTime' && quoteForm.pickupDateTime
        ? parseDateTimeValue(quoteForm.pickupDateTime) || now
        : field === 'subscriptionStartDate'
          ? parseDateTimeValue(subscriptionStartDate) || now
          : now;
    const fallbackTime = field === 'returnDateTime' ? '12:00' : '10:00';
    const { date, time } = splitDateTimeValue(currentValue, fallbackDate, fallbackTime);

    setActiveQuotePicker(field);
    setQuotePickerDate(date);
    setQuotePickerTime(time);
    setQuotePickerMonth(getMonthStart(date));
  };

  const closeQuotePicker = () => {
    setActiveQuotePicker(null);
  };

  const applyQuotePicker = () => {
    if (!activeQuotePicker) return;

    const nextValue = formatDateTimeValue(quotePickerDate, quotePickerTime);
    if (activeQuotePicker === 'subscriptionStartDate') {
      setSubscriptionStartDate(nextValue);
      setActiveQuotePicker(null);
      return;
    }

    setQuoteForm((current) => {
      const nextForm = {
        ...current,
        [activeQuotePicker]: nextValue,
      };

      if (
        activeQuotePicker === 'pickupDateTime' &&
        current.returnDateTime &&
        new Date(nextForm.returnDateTime) <= new Date(nextValue)
      ) {
        nextForm.returnDateTime = '';
      }

      return nextForm;
    });
    setActiveQuotePicker(null);
  };

  const pickerMinDate = useMemo(() => {
    if (activeQuotePicker === 'returnDateTime' && quoteForm.pickupDateTime) {
      const pickup = parseDateTimeValue(quoteForm.pickupDateTime);
      if (pickup) {
        return pickup;
      }
    }

    return new Date();
  }, [activeQuotePicker, quoteForm.pickupDateTime]);

  const pickerMinTime = useMemo(() => {
    const minDate = pickerMinDate;
    if (!isSameDay(quotePickerDate, minDate)) {
      return '06:00';
    }

    const currentTime = `${pad(minDate.getHours())}:${pad(minDate.getMinutes())}`;
    const nearest = TIME_OPTIONS.find((time) => String(time) >= currentTime);
    return nearest || TIME_OPTIONS[TIME_OPTIONS.length - 1];
  }, [pickerMinDate, quotePickerDate]);

  const handleProceed = () => {
    if (detailMode === 'subscription') {
      if (!selectedSubscriptionPlan) {
        toast.error('Select a subscription tenure first.');
        return;
      }

      if (!subscriptionStartDate) {
        toast.error('Select your delivery date to continue.');
        return;
      }

      if (!selectedServiceLocation) {
        toast.error('Choose a delivery location to continue.');
        return;
      }

      const nextState = {
          vehicle,
          duration: 'Subscription',
          detailMode,
          selectedPackage: {
            id: selectedSubscriptionPlan.id,
            label: selectedSubscriptionPlan.label || formatSubscriptionDuration(selectedSubscriptionPlan.durationDays),
            durationHours: Math.max(24, Number(selectedSubscriptionPlan.durationDays || 1) * 24),
            includedKm: Number(selectedSubscriptionPlan.includedKm || 0),
            price: Number(selectedSubscriptionPlan.price || 0),
            extraKmPrice: Number(selectedSubscriptionPlan.extraKmPrice || 0),
            deposit: Number(selectedSubscriptionPlan.deposit || 0),
          },
          selectedSubscriptionPlan,
          subscriptionStartDate,
          serviceLocation: selectedServiceLocation,
          userCoordinates,
        };

      try {
        window.sessionStorage.setItem(RENTAL_SCHEDULE_STATE_KEY, JSON.stringify(nextState));
      } catch {
        // Ignore storage failures and rely on route state when possible.
      }

      navigate('/rental/schedule', withHistorySafeStateOptions({ state: nextState }));
      return;
    }

    if (!selectedPackage) {
      toast.error('Select an hourly rental package first.');
      return;
    }

    if (selectionStep === 'package') {
      setSelectionStep('location');
      return;
    }

    if (!selectedServiceLocation) {
      toast.error('Select a service location to continue.');
      return;
    }

    const nextState = {
        vehicle,
        duration,
        selectedPackage,
        serviceLocation: selectedServiceLocation,
        userCoordinates,
      };

    try {
      window.sessionStorage.setItem(RENTAL_SCHEDULE_STATE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore storage failures and rely on route state when possible.
    }

    navigate('/rental/schedule', withHistorySafeStateOptions({ state: nextState }));
  };

  const isSubscriptionMode = detailMode === 'subscription';
  const subscriptionProceedDisabled =
    !selectedSubscriptionPlan ||
    !subscriptionStartDate ||
    locationsLoading ||
    !selectedServiceLocation;
  const rentalProceedDisabled =
    !selectedPackage ||
    (selectionStep === 'location' && (locationsLoading || !selectedServiceLocation));

  return (
    <div className={`min-h-screen font-sans relative ${
      isSubscriptionMode ? 'bg-slate-50 pb-36' : 'bg-slate-50 pb-12 lg:pb-24'
    }`}>
      {/* Desktop Header */}
      {!isSubscriptionMode && (
        <header className="hidden lg:flex max-w-[1200px] mx-auto items-center justify-between py-6 px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#111827] text-white hover:bg-black transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                VEHICLE DETAILS
              </p>
              <h1 className="text-[24px] font-black tracking-tight text-slate-900">{vehicle.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFB800]/10 text-[#FFB800]">
                <Car size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-900">Self-drive vehicles</p>
                <p className="text-[11px] font-semibold text-slate-500">Drive at your convenience</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFB800]/10 text-[#FFB800]">
                <Shield size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-900">Verified & Inspected</p>
                <p className="text-[11px] font-semibold text-slate-500">Quality and safety assured</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FFB800]/10 text-[#FFB800]">
                <Users size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-900">24/7 Roadside Support</p>
                <p className="text-[11px] font-semibold text-slate-500">We're here for you</p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile/Tablet Header (or Subscription Mode Header) */}
      {(isSubscriptionMode || true) && (
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`sticky top-0 z-30 w-full ${isSubscriptionMode ? 'lg:flex' : 'lg:hidden'}`}
        >
          <div className="px-5 pt-6 pb-5 relative overflow-hidden bg-white/90 backdrop-blur-xl border-b border-slate-200">
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-[#111827] text-white shadow-md transition-all"
                >
                  <ArrowLeft size={20} strokeWidth={2.5} />
                </motion.button>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] leading-none mb-1.5 text-slate-500">
                    {isSubscriptionMode ? 'Subscription details' : 'Vehicle Details'}
                  </p>
                  <h1 className="text-[20px] font-black tracking-tight leading-none truncate max-w-[220px] text-slate-900">
                    {isSubscriptionMode ? 'Subscription details' : vehicle.name}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </motion.header>
      )}

      <main className={`mx-auto ${isSubscriptionMode ? 'max-w-lg px-5 pt-5' : 'max-w-[1200px] px-5 lg:px-6 mt-4 lg:mt-2'}`}>
        {isSubscriptionMode ? (
          <div className="space-y-4 pb-32">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="overflow-hidden rounded-[26px] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
            >
              <div className="relative flex items-center justify-center px-6 py-6 bg-gradient-to-br from-orange-50/50 to-orange-100/20">
                {selectedImage ? (
                  <img src={selectedImage} alt={vehicle.name} className="h-44 object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.12)]" />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center text-slate-300">
                    <Car size={56} />
                  </div>
                )}
              </div>

              {gallery.length > 1 ? (
                <div className="flex items-center justify-center gap-2 pb-2 mt-4">
                  {gallery.slice(0, 5).map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        selectedImage === image ? 'bg-[#FFB800] ring-2 ring-[#FFB800]/50' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              ) : null}

              <div className="border-t border-slate-100 px-5 py-4">
                <h2 className="text-[28px] font-black tracking-tight text-slate-950">{vehicle.name}</h2>
                <div className="mt-4 grid grid-cols-3 gap-3 text-left">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Variant/color</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-700">{subscriptionVariantLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Transmission</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-700">{subscriptionTransmissionLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Fuel type</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-700">{subscriptionFuelLabel}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-[26px] bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
            >
              <h3 className="text-[24px] font-black tracking-tight text-slate-950">Subscription tenure</h3>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {subscriptionPlans.map((plan) => {
                  const isSelected = String(selectedSubscriptionPlanId) === String(plan.id);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedSubscriptionPlanId(String(plan.id))}
                      className={`min-w-[72px] rounded-2xl border px-3 py-3 text-center transition-all ${
                        isSelected
                          ? 'border-[#111827] bg-[#111827] text-white shadow-[0_10px_22px_rgba(17,24,39,0.24)]'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <p className="text-[22px] font-black leading-none">
                        {Number(plan.durationDays || 0) >= 30
                          ? Number(plan.durationDays || 0) % 30 === 0
                            ? Number(plan.durationDays || 0) / 30
                            : Number(plan.durationDays || 0)
                          : Number(plan.durationDays || 0)}
                      </p>
                      <p className={`mt-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        isSelected ? 'text-white/80' : 'text-slate-400'
                      }`}>
                        {Number(plan.durationDays || 0) >= 30
                          ? Number(plan.durationDays || 0) / 30 > 1
                            ? 'Months'
                            : 'Month'
                          : 'days'}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <p className="text-[12px] font-bold text-slate-500">Starting from</p>
                <div className="mt-1 flex items-end gap-2">
                  <p className="text-[38px] font-black leading-none tracking-tight text-slate-950">
                    {formatCurrency(selectedSubscriptionPlan?.price)}
                  </p>
                  {subscriptionStrikePrice ? (
                    <p className="pb-1 text-[16px] font-bold text-slate-400 line-through">
                      {formatCurrency(subscriptionStrikePrice)}
                    </p>
                  ) : null}
                </div>
                <p className="mt-2 text-[12px] font-semibold text-slate-500">
                  Inclusive of insurance and maintenance
                </p>
                {selectedSubscriptionPlan?.includedKm ? (
                  <p className="mt-1 text-[12px] font-semibold text-slate-500">
                    Includes {selectedSubscriptionPlan.includedKm} km for the selected tenure
                  </p>
                ) : null}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[26px] bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
            >
              <p className="text-[13px] font-bold text-[#D0604D]">Select delivery date to proceed</p>

              <div className="mt-3 rounded-[20px] border border-[#D66D57] bg-[#F8FBFD] p-4">
                <div className="flex items-center gap-2 text-[#0B84A6]">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0B84A6] text-[11px] font-black text-white">i</div>
                  <p className="text-[13px] font-black">Check exact price for your dates</p>
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Select Delivery Date
                </p>
                <button
                  type="button"
                  onClick={() => openQuotePicker('subscriptionStartDate')}
                  className="mt-2 flex w-full items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Tap to choose
                    </p>
                    <p className="mt-1 truncate text-[15px] font-bold text-slate-700">
                      {subscriptionStartDate
                        ? formatPickerSummary(subscriptionStartDate)
                        : 'Choose delivery date'}
                    </p>
                  </div>
                  <Calendar size={18} className="shrink-0 text-slate-400" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-[26px] bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-400">Place of delivery</p>
                  <p className="mt-1 text-[14px] font-bold text-slate-600">
                    Choose the nearest pickup or delivery point for this subscription.
                  </p>
                </div>
                {selectedServiceLocation?.distanceLabel ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                    {selectedServiceLocation.distanceLabel}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                {locationsLoading ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-[12px] font-bold text-slate-500">
                    <Loader2 size={16} className="animate-spin" />
                    Loading delivery points...
                  </div>
                ) : locationError ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4 text-[12px] font-bold text-rose-500">
                    {locationError}
                  </div>
                ) : serviceLocations.length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-[12px] font-bold text-slate-500">
                    No delivery points are available for this vehicle right now.
                  </div>
                ) : (
                  serviceLocations.map((item, index) => {
                    const isSelected = String(selectedServiceLocationId) === String(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedServiceLocationId(String(item.id))}
                        className={`w-full rounded-[20px] border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? 'border-[#111827] bg-[#111827] text-white shadow-[0_10px_24px_rgba(17,24,39,0.10)]'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`text-[14px] font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                              {index === 0 && userCoordinates ? (
                                <span className="rounded-full bg-emerald-100/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                                  Closest
                                </span>
                              ) : null}
                            </div>
                            <p className={`mt-1 text-[12px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                              {item.pickupLabel || item.address || `${appName} delivery point`}
                            </p>
                          </div>
                          <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? 'border-[#FFB800]' : 'border-slate-300 text-transparent'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#FFB800]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Image Box */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-[24px] bg-gradient-to-br from-orange-50/50 to-orange-100/20 p-6 relative shadow-sm border border-orange-100/50"
              >
                <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-[12px] font-bold text-orange-600">Most Popular</span>
                </div>
                <div className="absolute top-6 right-6 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">RATE</p>
                  <p className="text-[24px] font-black text-slate-900 leading-none">
                    Rs.{selectedPackage?.price || vehicle.prices?.[duration] || 0}
                  </p>
                  <p className="text-[13px] font-bold text-slate-500 mt-1">
                    {selectedPackage ? packageSuffix(selectedPackage.durationHours) : '/hr'}
                  </p>
                </div>
                
                <div className="mt-16 mb-8 flex justify-center">
                  {selectedImage ? (
                    <img src={selectedImage} alt={vehicle.name} className="h-48 md:h-64 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)]" />
                  ) : (
                    <div className="flex h-48 md:h-64 w-full items-center justify-center text-slate-300">
                      <Car size={64} />
                    </div>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="flex items-center justify-center gap-3 mb-6">
                    {gallery.map((image) => (
                      <button
                        key={image}
                        onClick={() => setSelectedImage(image)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          selectedImage === image ? 'bg-[#FFB800] ring-4 ring-[#FFB800]/20' : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                <div>
                  <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">{vehicle.name}</h2>
                  <p className="text-[15px] font-semibold text-slate-500 mt-1">{vehicle.vehicleCategory || vehicle.shortDescription || 'Vehicle'}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-md">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[15px] font-bold text-slate-900">{vehicle.rating || '4.8'}</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-[15px] font-bold text-slate-600">
                      {selectedPackage ? selectedPackage.includedKm : (vehicle.kmLimit?.[duration] || '10')} km included
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                <div className="rounded-[16px] border border-slate-100 bg-white p-5 flex flex-col items-center justify-center text-center shadow-sm">
                  <Users size={22} className="text-slate-400 mb-2" />
                  <p className="text-[18px] font-black text-slate-900">{vehicle.capacity || 1}</p>
                  <p className="text-[13px] font-semibold text-slate-500">Seat</p>
                </div>
                <div className="rounded-[16px] border border-slate-100 bg-white p-5 flex flex-col items-center justify-center text-center shadow-sm">
                  <Luggage size={22} className="text-slate-400 mb-2" />
                  <p className="text-[18px] font-black text-slate-900">{vehicle.luggageCapacity || 1}</p>
                  <p className="text-[13px] font-semibold text-slate-500">Bag Space</p>
                </div>
                <div className="rounded-[16px] border border-slate-100 bg-white p-5 flex flex-col items-center justify-center text-center shadow-sm">
                  <Car size={22} className="text-slate-400 mb-2" />
                  <p className="text-[16px] font-black text-slate-900 truncate w-full">{vehicle.vehicleCategory || 'Bike'}</p>
                  <p className="text-[13px] font-semibold text-slate-500">Vehicle Type</p>
                </div>
                <div className="rounded-[16px] border border-slate-100 bg-white p-5 flex flex-col items-center justify-center text-center shadow-sm">
                  <Fuel size={22} className="text-slate-400 mb-2" />
                  <p className="text-[16px] font-black text-slate-900">{vehicle.fuel || '80 km/hr'}</p>
                  <p className="text-[13px] font-semibold text-slate-500">Mileage (Approx.)</p>
                </div>
              </motion.div>

              {/* What's Included */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm space-y-5"
              >
                <p className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-600">WHAT'S INCLUDED</p>
                <div className="space-y-4">
                  {(vehicle.amenities?.length ? vehicle.amenities : vehicle.features || []).map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-[1.5px] border-emerald-500 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={12} strokeWidth={3} />
                      </div>
                      <span className="text-[15px] font-bold text-slate-800">{feature}</span>
                    </div>
                  ))}
                  {(!vehicle.amenities?.length && !vehicle.features?.length) && (
                    <div className="text-slate-500 text-[14px] font-semibold">Standard features included.</div>
                  )}
                </div>
              </motion.div>

              {/* Need a different duration */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-[20px] border border-slate-100 bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm"
              >
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-full bg-[#FFB800] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(255,184,0,0.3)]">
                    <Calendar size={24} className="text-slate-900" />
                  </div>
                  <div>
                    <p className="text-[16px] font-black text-slate-900">Need a different duration?</p>
                    <p className="text-[13px] font-semibold text-slate-500 mt-1 leading-relaxed">Contact us for custom rental packages and long-term offers.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuoteForm(true)}
                  className="w-full sm:w-auto shrink-0 rounded-[14px] border border-slate-200 bg-white px-6 py-3.5 text-[14px] font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                >
                  Contact Us <ChevronRight size={16} />
                </button>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="pb-24 lg:pb-0">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-600">
                      CHOOSE HOURLY RENTAL
                    </h3>
                    <span className="text-[13px] font-bold text-orange-600">
                      Step {selectionStep === 'package' ? '1' : '2'} of 2
                    </span>
                  </div>

                  {selectionStep === 'package' ? (
                    <div className="space-y-4">
                      {pricingRows.map((row) => {
                        const isSelected = String(selectedPackageId) === String(row.id);
                        return (
                          <button
                            key={row.id}
                            onClick={() => setSelectedPackageId(String(row.id))}
                            className={`w-full text-left rounded-[16px] border-2 p-5 transition-all relative ${
                              isSelected
                                ? 'border-[#111827] bg-[#111827] shadow-[0_8px_20px_rgba(17,24,39,0.2)]'
                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                                  isSelected ? 'border-[#FFB800]' : 'border-slate-300'
                                }`}>
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />}
                                </div>
                                <div>
                                  <p className={`text-[16px] font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                    {row.label || `${row.durationHours} Hours`}
                                  </p>
                                  <p className={`text-[12px] font-semibold mt-1.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {row.durationHours} hour{row.durationHours > 1 ? 's' : ''} - {row.includedKm} km included
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-[16px] font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  Rs.{row.price}
                                </p>
                                <p className={`text-[12px] font-semibold mt-1.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {packageSuffix(row.durationHours)}
                                </p>
                              </div>
                            </div>
                            <div className={`mt-4 pt-4 border-t text-[11.5px] font-semibold flex gap-2 sm:gap-3 flex-wrap ${
                              isSelected ? 'border-slate-700/60 text-slate-300' : 'border-slate-100 text-slate-500'
                            }`}>
                              <span>Extra hour: Rs.{row.extraHourPrice || 0}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>Extra km: Rs.{row.extraKmPrice || 0}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2">
                        <p className="text-[15px] font-black text-slate-900">Select Location</p>
                        <button
                          onClick={() => setSelectionStep('package')}
                          className="text-[13px] font-bold text-[#FFB800] hover:text-yellow-600 transition-colors flex items-center gap-1"
                        >
                          <ChevronLeft size={16} /> Back
                        </button>
                      </div>
                      
                      {locationsLoading ? (
                        <div className="py-10 text-center text-[13px] font-bold text-slate-500 flex flex-col items-center bg-slate-50 rounded-xl">
                          <Loader2 className="animate-spin mb-3 text-slate-400" size={24} />
                          Loading service locations...
                        </div>
                      ) : locationError ? (
                        <div className="p-5 rounded-[16px] bg-rose-50 text-rose-600 text-[13px] font-bold border border-rose-100">
                          {locationError}
                        </div>
                      ) : serviceLocations.length === 0 ? (
                        <div className="p-8 rounded-[16px] bg-slate-50 border border-slate-100 text-center text-slate-500 text-[13px] font-bold">
                          No locations found for this vehicle.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {serviceLocations.map((item, index) => {
                            const isSelected = String(selectedServiceLocationId) === String(item.id);
                            return (
                              <button
                                key={item.id}
                                onClick={() => setSelectedServiceLocationId(String(item.id))}
                                className={`w-full text-left p-4 rounded-[16px] border-2 transition-all ${
                                  isSelected
                                    ? 'border-[#111827] bg-[#111827] text-white shadow-md'
                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className={`text-[14px] font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                        {item.name}
                                      </p>
                                      {index === 0 && userCoordinates && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                          Closest
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-[12px] mt-1.5 truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                      {item.pickupLabel || item.address}
                                    </p>
                                  </div>
                                  <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                    isSelected ? 'border-[#FFB800]' : 'border-slate-300'
                                  }`}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-600 mb-5">BOOKING SUMMARY</p>
                  <div className="space-y-4 text-[14px]">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-500">Base Fare</span>
                      <span className="font-black text-slate-900">Rs.{selectedPackage?.price || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-500">Included Distance</span>
                      <span className="font-black text-slate-900">{selectedPackage?.includedKm || 0} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-500">Included Duration</span>
                      <span className="font-black text-slate-900">{selectedPackage?.durationHours || 0} Hours</span>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-end">
                    <span className="text-[16px] font-black text-slate-900">Total <span className="text-[12px] font-semibold text-slate-500">(Estimated)</span></span>
                    <div className="text-right">
                      <span className="text-[24px] font-black text-slate-900 leading-none">Rs.{selectedPackage?.price || 0}</span>
                      <span className="text-[12px] font-bold text-slate-500 block mt-1">/hr</span>
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-[14px] bg-slate-50 flex items-start gap-2.5 text-[11px] font-semibold text-slate-500 leading-relaxed border border-slate-100">
                    <Shield size={14} className="shrink-0 mt-0.5 text-slate-400" />
                    <p>Security deposit and taxes may apply at checkout.</p>
                  </div>

                  <div className="hidden lg:block mt-6">
                    <button 
                      onClick={handleProceed}
                      disabled={rentalProceedDisabled}
                      className="w-full rounded-[16px] bg-[#111827] disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 px-6 text-[15px] font-black flex items-center justify-between transition-colors hover:bg-black"
                    >
                      {selectionStep === 'package' ? 'Proceed to Service Location' : 'Select Date & Time'}
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Quote Form Modal */}
        <AnimatePresence>
          {showQuoteForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
              onClick={() => setShowQuoteForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFB800]/20 flex items-center justify-center text-[#FFB800]">
                      <Calendar size={14} />
                    </div>
                    <p className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-900">
                      Custom Quote Request
                    </p>
                  </div>
                  <button onClick={() => setShowQuoteForm(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="text-xl leading-none">&times;</span>
                  </button>
                </div>
                <p className="text-[13px] font-semibold text-slate-500 mb-6">
                  Share your required hours and dates. Our admin team will review and offer a custom price.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
                      Hours needed
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quoteForm.requestedHours}
                      onChange={(event) =>
                        setQuoteForm((current) => ({
                          ...current,
                          requestedHours: event.target.value,
                        }))
                      }
                      className={inputClass}
                      placeholder="e.g., 48"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
                      Start date and time
                    </label>
                    <button
                      type="button"
                      onClick={() => openQuotePicker('pickupDateTime')}
                      className={pickerTriggerClass}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-50 text-slate-600">
                          <Calendar size={18} />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                            Tap to choose
                          </span>
                          <span className="mt-0.5 block truncate text-[14px] font-bold text-slate-900">
                            {formatPickerSummary(quoteForm.pickupDateTime)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
                      End date and time
                    </label>
                    <button
                      type="button"
                      onClick={() => openQuotePicker('returnDateTime')}
                      className={pickerTriggerClass}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-50 text-slate-600">
                          <Clock size={18} />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                            Tap to choose
                          </span>
                          <span className="mt-0.5 block truncate text-[14px] font-bold text-slate-900">
                            {formatPickerSummary(quoteForm.returnDateTime)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={submitQuote}
                    disabled={submittingQuote}
                    className="w-full mt-4 rounded-[16px] bg-[#111827] px-5 py-4 text-[14px] font-black text-white disabled:opacity-60 transition-colors hover:bg-black"
                  >
                    {submittingQuote ? 'Sending Request...' : 'Send To Admin For Review'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <DateTimePickerModal
          open={Boolean(activeQuotePicker)}
          title={
            activeQuotePicker === 'returnDateTime'
              ? 'Select End Date & Time'
              : activeQuotePicker === 'subscriptionStartDate'
                ? 'Select Delivery Date'
                : 'Select Start Date & Time'
          }
          monthDate={quotePickerMonth}
          selectedDate={quotePickerDate}
          selectedTime={quotePickerTime}
          minDate={pickerMinDate}
          minTime={pickerMinTime}
          onMonthChange={(amount) => setQuotePickerMonth((current) => addMonths(current, amount))}
          onDateSelect={setQuotePickerDate}
          onTimeSelect={setQuotePickerTime}
          onClose={closeQuotePicker}
          onApply={applyQuotePicker}
        />
      </main>

      {/* Mobile Fixed Bottom Proceed Button */}
      {(!isSubscriptionMode) && (
        <div className="fixed lg:hidden bottom-0 left-0 w-full px-5 pb-6 pt-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-30">
          <button
            onClick={handleProceed}
            disabled={rentalProceedDisabled}
            className="pointer-events-auto w-full py-4 rounded-[16px] text-[15px] font-black text-white shadow-[0_8px_24px_rgba(17,24,39,0.2)] flex items-center justify-between px-6 transition-all bg-[#111827] disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
          >
            {selectionStep === 'package' ? 'Proceed to Service Location' : 'Select Date & Time'}
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Subscription Mode Fixed Bottom Button */}
      {isSubscriptionMode && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-5 pb-6 pt-3 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none z-30">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleProceed}
            disabled={subscriptionProceedDisabled}
            className={`pointer-events-auto w-full py-4 rounded-[16px] text-[15px] font-black text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] flex items-center justify-center gap-2 transition-all ${
              subscriptionProceedDisabled ? 'bg-slate-300 shadow-none' : 'bg-[#111827]'
            }`}
          >
            Proceed
            <ChevronRight size={17} strokeWidth={3} className="opacity-50" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default RentalVehicleDetail;

