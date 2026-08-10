import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownUp, Calendar, Car, ChevronDown, Clock, Headset, IndianRupee, MapPin, Shield, User } from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';
import BottomNavbar from '../../components/BottomNavbar';
import { LOCATION_COORDS } from './SelectLocation';

const DEFAULT_COORDS = [75.8577, 22.7196];

// Pickup/drop options come from the live service-store catalogue. The static
// landmark map is only a fallback for when that call returns nothing, so the
// screen still works offline or before any store is configured.
const FALLBACK_PLACES = Object.entries(LOCATION_COORDS).map(([name, coords]) => ({ name, coords }));

const getStoreCoords = (store) => {
  const coords = store?.location?.coordinates;
  if (Array.isArray(coords) && coords.length === 2 && coords.every(Number.isFinite)) {
    return coords;
  }

  const lng = Number(store?.longitude);
  const lat = Number(store?.latitude);
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
};

const haversineMeters = ([lng1, lat1], [lng2, lat2]) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const toDateInputValue = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const formatDisplayTime = (value) => {
  const [hourValue, minute = '00'] = String(value || '00:00').split(':');
  const hour = Number(hourValue);
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${String(hour % 12 || 12).padStart(2, '0')}:${minute} ${period}`;
};

const TaxiBookNow = () => {
  const navigate = useNavigate();

  const [fareCategories, setFareCategories] = useState([]);
  const [places, setPlaces] = useState(FALLBACK_PLACES);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [openField, setOpenField] = useState(null); // 'pickup' | 'drop' | null
  const [rideMode, setRideMode] = useState('now');
  const [scheduleDate, setScheduleDate] = useState(() => toDateInputValue(new Date()));
  const [scheduleTime, setScheduleTime] = useState(() => {
    const soon = new Date(Date.now() + 60 * 60 * 1000);
    return `${String(soon.getHours()).padStart(2, '0')}:${String(soon.getMinutes()).padStart(2, '0')}`;
  });
  const [error, setError] = useState('');
  // Ticks so a schedule time that slips into the past disables the button on its own.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    api.get('/users/ride-fares', { params: { transportType: 'taxi' } })
      .then((response) => {
        const payload = response?.data?.data || response?.data || {};
        const results = Array.isArray(payload.results) ? payload.results : [];
        if (active) {
          setFareCategories(results);
          setSelectedCategoryId((current) => current || String(results[0]?.id || ''));
        }
      })
      .catch(() => {
        if (active) setError('Could not load taxi categories. Please try again.');
      });

    api.get('/users/service-stores')
      .then((response) => {
        const payload = response?.data?.data || response?.data || {};
        const live = (Array.isArray(payload.results) ? payload.results : [])
          .map((store) => ({ name: String(store.name || store.store_name || '').trim(), coords: getStoreCoords(store) }))
          .filter((place) => place.name && place.coords);

        if (active && live.length) {
          setPlaces(live);
        }
      })
      .catch(() => {
        /* keep the fallback landmark list */
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedCategory = useMemo(
    () => fareCategories.find((item) => String(item.id) === String(selectedCategoryId)) || null,
    [fareCategories, selectedCategoryId],
  );

  const coordsFor = (name) => places.find((place) => place.name === name)?.coords || null;
  const pickupCoords = coordsFor(pickup);
  const dropCoords = coordsFor(drop);

  const estimate = useMemo(() => {
    if (!selectedCategory || !pickupCoords || !dropCoords) {
      return null;
    }

    const distanceMeters = haversineMeters(pickupCoords, dropCoords);
    const km = distanceMeters / 1000;
    // ponytail: straight-line distance + 3 min/km — good enough until the Maps key works and real routing is available
    const durationMinutes = Math.max(1, Math.round(km * 3));
    const extraKm = Math.max(0, km - Number(selectedCategory.baseDistance || 0));
    const fare = Math.round(
      Number(selectedCategory.basePrice || 0) +
      extraKm * Number(selectedCategory.pricePerDistance || 0) +
      durationMinutes * Number(selectedCategory.timePrice || 0),
    );

    return { distanceMeters, durationMinutes, fare };
  }, [selectedCategory, pickupCoords, dropCoords]);

  const scheduledAtDate = rideMode === 'schedule' ? new Date(`${scheduleDate}T${scheduleTime}`) : null;

  const canBook =
    Boolean(selectedCategory && pickup.trim() && drop.trim() && estimate) &&
    (rideMode === 'now' || (scheduledAtDate && scheduledAtDate.getTime() > now));

  const handleBook = () => {
    if (!canBook) {
      if (rideMode === 'schedule' && scheduledAtDate && scheduledAtDate.getTime() <= Date.now()) {
        setError('Pick a schedule time in the future.');
      } else {
        setError('Choose a category, pickup and drop to continue.');
      }
      return;
    }

    setError('');
    navigate('/taxi/user/ride/searching', {
      state: {
        pickup,
        drop,
        pickupCoords: pickupCoords || DEFAULT_COORDS,
        dropCoords: dropCoords || DEFAULT_COORDS,
        transport_type: 'taxi',
        vehicleTypeId: String(selectedCategory.id),
        vehicleIconType: selectedCategory.iconType || 'car',
        vehicleIconUrl: selectedCategory.image || '',
        vehicle: {
          vehicleTypeId: String(selectedCategory.id),
          name: selectedCategory.name,
          iconType: selectedCategory.iconType || 'car',
          price: estimate.fare,
          transportType: 'taxi',
        },
        paymentMethod: 'Cash',
        fare: estimate.fare,
        baseFare: estimate.fare,
        userMaxBidFare: estimate.fare,
        bookingMode: 'normal',
        pricingNegotiationMode: 'none',
        estimatedDistanceMeters: estimate.distanceMeters,
        estimatedDurationMinutes: estimate.durationMinutes,
        rideMode,
        scheduledAt: rideMode === 'schedule' ? scheduledAtDate.toISOString() : null,
        searchNonce: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });
  };

  const renderLocationSuggestions = (field, onPick) => (
    <div className="absolute left-0 right-0 top-[72px] z-30 max-h-60 overflow-y-auto rounded-[14px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
      {places.filter(({ name }) => name !== (field === 'pickup' ? drop : pickup)).map(({ name }) => (
        <button
          key={name}
          type="button"
          onClick={() => {
            onPick(name);
            setOpenField(null);
          }}
          className="flex w-full items-center gap-2 border-b border-slate-50 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 last:border-b-0"
        >
          <MapPin size={15} className="text-[#f5b700]" />
          <span className="truncate">{name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen max-w-lg md:max-w-none md:mx-0 mx-auto bg-white text-black font-sans relative overflow-x-hidden pb-28 shadow-2xl md:shadow-none border-x border-slate-100 md:border-x-0">
      <section className="relative h-[285px] overflow-hidden bg-slate-950">
        <img
          src="/taxi09_rental_hero_banner.png"
          alt="Taxi09 taxi banner"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute left-0 right-0 top-14 flex items-center justify-between px-5 text-white">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white"
            aria-label="Back"
          >
            <ArrowLeft size={22} strokeWidth={2.4} />
          </button>
        </div>
      </section>

      <section className="relative z-10 -mt-[78px] px-4">
        <div className="rounded-t-[28px] bg-white px-4 pb-5 pt-6 shadow-[0_-10px_34px_rgba(15,23,42,0.16)]">
          <h1 className="text-center text-[23px] font-black leading-[1.18] text-black">
            Book Your Taxi
          </h1>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {(fareCategories.length ? fareCategories : Array.from({ length: 4 })).map((category, index) => (
              <button
                type="button"
                key={category?.id || index}
                disabled={!category}
                onClick={() => category && setSelectedCategoryId(String(category.id))}
                className={`flex h-[58px] flex-col items-center justify-center rounded-[10px] border px-1 text-[11px] font-semibold shadow-[0_5px_14px_rgba(15,23,42,0.07)] ${
                  category && String(selectedCategoryId) === String(category.id)
                    ? 'border-[#ffc400] bg-[#ffc400] text-black'
                    : 'border-slate-100 bg-white text-black'
                }`}
              >
                <Car size={22} strokeWidth={2.4} fill="currentColor" className="mb-1" />
                <span className="truncate max-w-full">{category?.name || '...'}</span>
              </button>
            ))}
          </div>

          <div className="relative mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setOpenField(openField === 'pickup' ? null : 'pickup')}
              className="flex min-h-[68px] w-full items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
            >
              <span className="h-6 w-6 shrink-0 rounded-full bg-[#22c55e]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium text-slate-500">Pick-up Location</span>
                <span className={`block truncate text-[16px] font-semibold ${pickup ? 'text-black' : 'text-slate-400'}`}>
                  {pickup || 'Where from?'}
                </span>
              </span>
              <ChevronDown size={21} className="text-slate-500" />
            </button>

            {openField === 'pickup' && renderLocationSuggestions('pickup', setPickup)}

            <button
              type="button"
              onClick={() => setOpenField(openField === 'drop' ? null : 'drop')}
              className="flex min-h-[68px] w-full items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
            >
              <MapPin size={28} className="shrink-0 text-[#ff3b4f]" strokeWidth={2.4} />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium text-slate-500">Drop-off Location</span>
                <span className={`block truncate text-[16px] font-semibold ${drop ? 'text-black' : 'text-slate-400'}`}>
                  {drop || 'Where to?'}
                </span>
              </span>
              <ChevronDown size={21} className="text-slate-500" />
            </button>

            {openField === 'drop' && (
              <div className="absolute left-0 right-0 top-[152px] z-30 max-h-60 overflow-y-auto rounded-[14px] border border-slate-100 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
                {places.filter(({ name }) => name !== pickup).map(({ name }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setDrop(name);
                      setOpenField(null);
                    }}
                    className="flex w-full items-center gap-2 border-b border-slate-50 px-4 py-2.5 text-left text-[13px] font-semibold text-slate-700 last:border-b-0"
                  >
                    <MapPin size={15} className="text-[#f5b700]" />
                    <span className="truncate">{name}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setPickup(drop);
                setDrop(pickup);
              }}
              className="absolute right-[-8px] top-[58px] z-20 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white text-black shadow-[0_8px_24px_rgba(15,23,42,0.15)]"
              aria-label="Swap locations"
            >
              <ArrowDownUp size={25} strokeWidth={2.6} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { key: 'now', label: 'Ride Now', sub: 'Leave right away' },
              { key: 'schedule', label: 'Schedule', sub: 'Pick date & time' },
            ].map(({ key, label, sub }) => (
              <button
                type="button"
                key={key}
                onClick={() => setRideMode(key)}
                className={`flex min-h-[56px] flex-col items-center justify-center rounded-[12px] border text-[13px] font-bold shadow-[0_4px_14px_rgba(15,23,42,0.04)] ${
                  rideMode === key
                    ? 'border-[#ffc400] bg-[#ffc400] text-black'
                    : 'border-slate-200 bg-white text-black'
                }`}
              >
                {label}
                <span className="text-[10px] font-medium text-slate-600">{sub}</span>
              </button>
            ))}
          </div>

          {rideMode === 'schedule' && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { icon: Calendar, label: 'Pick-up Date', value: scheduleDate, type: 'date', onChange: setScheduleDate },
                { icon: Clock, label: 'Pick-up Time', value: formatDisplayTime(scheduleTime), inputValue: scheduleTime, type: 'time', onChange: setScheduleTime },
              ].map(({ icon: Icon, label, value, inputValue, type, onChange }) => (
                <label
                  key={label}
                  className="relative flex min-h-[64px] items-center gap-2.5 rounded-[12px] border border-slate-200 bg-white px-3 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
                >
                  <Icon size={23} className="text-black" strokeWidth={2.5} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium text-slate-500">{label}</span>
                    <span className="block truncate text-[14px] font-semibold text-black">{value}</span>
                  </span>
                  <ChevronDown size={18} className="text-slate-500" />
                  <input
                    type={type}
                    value={inputValue || value}
                    onChange={(event) => onChange(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
              ))}
            </div>
          )}

          {estimate && (
            <div className="mt-4 flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-3">
              <span className="text-[13px] font-semibold text-slate-600">
                {(estimate.distanceMeters / 1000).toFixed(1)} km · ~{estimate.durationMinutes} min
              </span>
              <span className="text-[17px] font-black text-black">₹{estimate.fare}</span>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold text-rose-600">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleBook}
            className={`mt-5 h-[58px] w-full rounded-[13px] text-[21px] font-black shadow-[0_8px_20px_rgba(255,196,0,0.3)] active:scale-[0.99] ${
              canBook ? 'bg-[#ffc400] text-black' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {rideMode === 'schedule' ? 'Schedule Taxi' : 'Book Taxi Now'}
          </button>

          <div className="mt-6 grid grid-cols-4 divide-x divide-slate-200 rounded-[14px] bg-slate-50 px-1 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            {[
              { icon: Shield, label: 'Safe & Secure\nRides' },
              { icon: User, label: 'Verified\nDrivers' },
              { icon: Headset, label: '24x7\nSupport' },
              { icon: IndianRupee, label: 'Affordable\nPrices' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center justify-center gap-2 px-2 text-center">
                <Icon size={25} className="text-black" strokeWidth={2.1} />
                <span className="whitespace-pre-line text-[11px] font-medium leading-tight text-black">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BottomNavbar />
    </div>
  );
};

export default TaxiBookNow;
