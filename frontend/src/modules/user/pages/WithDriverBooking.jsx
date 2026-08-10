import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  ChevronDown,
  Clock3,
  Headphones,
  Map,
  MapPin,
  Mars,
  Moon,
  Mountain,
  ShieldCheck,
  UserRoundCheck,
  Venus,
} from 'lucide-react';
import api from '../../../shared/api/axiosInstance';

const serviceConfig = {
  'Local (Hourly)': {
    title: 'Local Driver',
    subtitle: 'Hire a verified chauffeur for city rides.',
    image: '/taxi09_driver_local_hourly.png',
    destination: 'Indore City Ride',
    primaryPlan: 'Hourly',
    secondaryPlan: 'Full Day',
    baseFare: 900,
  },
  Outstation: {
    title: 'Outstation Driver',
    subtitle: 'Hire a verified chauffeur for your long-distance trip.',
    image: '/taxi09_driver_outstation.png',
    destination: 'Ujjain, Madhya Pradesh',
    primaryPlan: 'One Way',
    secondaryPlan: 'Round Trip',
    baseFare: 2500,
  },
  'Outstation Drop': {
    title: 'Outstation Drop',
    subtitle: 'Book a verified driver for one-way city drops.',
    image: '/taxi09_driver_outstation_drop.png',
    destination: 'Bhopal, Madhya Pradesh',
    primaryPlan: 'One Way',
    secondaryPlan: 'Round Trip',
    baseFare: 2200,
  },
};

const preferenceOptions = [
  { label: 'Male Driver', icon: Mars },
  { label: 'Female Driver', icon: Venus },
  { label: 'No Preference', icon: UserRoundCheck, recommended: true },
];

const journeyOptions = [
  { key: 'night', label: 'Night Journey', icon: Moon, cost: 500 },
  { key: 'hill', label: 'Hill Driving', icon: Mountain, cost: 300 },
  { key: 'luggage', label: 'Extra Luggage', icon: Briefcase, cost: 150 },
  { key: 'stops', label: 'Multiple Stops', icon: Map, cost: 250 },
];

const trustItems = [
  { label: 'GPS Tracked\nDrivers', icon: MapPin },
  { label: 'Live\nSupport', icon: Headphones },
  { label: 'Digital\nDuty Slip', icon: CalendarDays },
  { label: 'Trip\nInsurance', icon: ShieldCheck },
];

const pickupOptions = ['Indore, Madhya Pradesh', 'South Tukoganj, Indore', 'Vijay Nagar, Indore', 'Indore Airport, Indore'];
const destinationOptions = {
  'Local (Hourly)': ['Indore City Ride', 'Vijay Nagar, Indore', 'Rajwada, Indore', 'Palasia, Indore'],
  Outstation: ['Ujjain, Madhya Pradesh', 'Bhopal, Madhya Pradesh', 'Dewas, Madhya Pradesh', 'Omkareshwar, Madhya Pradesh'],
  'Outstation Drop': ['Bhopal, Madhya Pradesh', 'Ujjain, Madhya Pradesh', 'Dewas, Madhya Pradesh', 'Ratlam, Madhya Pradesh'],
};
const dateOptions = ['30 Jul 2026', '31 Jul 2026', '01 Aug 2026', '02 Aug 2026'];
const timeOptions = ['09:00 AM', '11:30 AM', '02:00 PM', '06:00 PM', '09:00 PM'];
const coordsByPlace = {
  'Indore, Madhya Pradesh': [75.8577, 22.7196],
  'South Tukoganj, Indore': [75.883, 22.7244],
  'Vijay Nagar, Indore': [75.8937, 22.7533],
  'Indore Airport, Indore': [75.8011, 22.7218],
  'Indore City Ride': [75.8937, 22.7533],
  'Rajwada, Indore': [75.8552, 22.7185],
  'Palasia, Indore': [75.8836, 22.7247],
  'Ujjain, Madhya Pradesh': [75.7849, 23.1765],
  'Bhopal, Madhya Pradesh': [77.4126, 23.2599],
  'Dewas, Madhya Pradesh': [76.0534, 22.9676],
  'Omkareshwar, Madhya Pradesh': [76.1511, 22.2444],
  'Ratlam, Madhya Pradesh': [75.0367, 23.3315],
};

const getVehicleTypes = (response) => {
  const payload = response?.data || response;
  return (
    payload?.data?.vehicleTypes ||
    payload?.data?.items ||
    payload?.vehicleTypes ||
    payload?.items ||
    payload?.data ||
    []
  );
};

const getVehicleName = (type) => type?.type_name || type?.name || type?.title || 'Driver Service';

const WithDriverBooking = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const serviceType = state?.hireDriverType || 'Outstation';
  const config = serviceConfig[serviceType] || serviceConfig.Outstation;
  const [tripType, setTripType] = useState(config.primaryPlan);
  const [preference, setPreference] = useState('No Preference');
  const [enabledOptions, setEnabledOptions] = useState({ night: true, hill: true });
  const [pickup, setPickup] = useState(state?.pickup || 'Indore, Madhya Pradesh');
  const [drop, setDrop] = useState(state?.drop || config.destination);
  const [pickupCoords, setPickupCoords] = useState(state?.pickupCoords || coordsByPlace[state?.pickup] || coordsByPlace['Indore, Madhya Pradesh']);
  const [dropCoords, setDropCoords] = useState(state?.dropCoords || coordsByPlace[state?.drop] || coordsByPlace[config.destination]);
  const [journeyDate, setJourneyDate] = useState('30 Jul 2026');
  const [pickupTime, setPickupTime] = useState('09:00 AM');
  const [returnDate, setReturnDate] = useState('Select date');
  const [returnTime, setReturnTime] = useState('Select time');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [isVehicleLoading, setIsVehicleLoading] = useState(true);

  const optionTotal = useMemo(
    () =>
      journeyOptions.reduce((total, option) => {
        return total + (enabledOptions[option.key] ? option.cost : 0);
      }, 0),
    [enabledOptions]
  );
  const estimatedTotal = config.baseFare + optionTotal;
  const dropOptions = destinationOptions[serviceType] || destinationOptions.Outstation;
  const dropdownConfig = {
    pickup: {
      title: 'Select Pickup',
      options: pickupOptions,
      value: pickup,
      onSelect: (value) => {
        setPickup(value);
        setPickupCoords(coordsByPlace[value] || coordsByPlace['Indore, Madhya Pradesh']);
      },
    },
    drop: {
      title: 'Select Destination',
      options: dropOptions,
      value: drop,
      onSelect: (value) => {
        setDrop(value);
        setDropCoords(coordsByPlace[value] || coordsByPlace['Vijay Nagar, Indore']);
      },
    },
    journeyDate: { title: 'Journey Date', options: dateOptions, value: journeyDate, onSelect: setJourneyDate },
    pickupTime: { title: 'Pickup Time', options: timeOptions, value: pickupTime, onSelect: setPickupTime },
    returnDate: { title: 'Return Date', options: ['Select date', ...dateOptions], value: returnDate, onSelect: setReturnDate },
    returnTime: { title: 'Return Time', options: ['Select time', ...timeOptions], value: returnTime, onSelect: setReturnTime },
  };

  const toggleOption = (key) => {
    setEnabledOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const swapLocations = () => {
    setPickup(drop);
    setDrop(pickup);
    setPickupCoords(dropCoords);
    setDropCoords(pickupCoords);
  };

  const openLocationSearch = (activeInput) => {
    navigate('/taxi/user/ride/select-location', {
      state: {
        ...state,
        flow: 'hire-driver',
        returnTo: '/taxi/user/with-driver/details',
        activeInput,
        hireDriverType: serviceType,
        pickup,
        drop,
        pickupCoords,
        dropCoords,
      },
    });
  };

  const handleSelectDropdownValue = (value) => {
    const menu = dropdownConfig[activeDropdown];
    menu?.onSelect(value);
    setActiveDropdown(null);
  };

  const buildSearchState = (resolvedVehicle = vehicle) => ({
        pickup,
        drop,
        pickupCoords: pickupCoords || coordsByPlace[pickup] || coordsByPlace['Indore, Madhya Pradesh'],
        dropCoords: dropCoords || coordsByPlace[drop] || coordsByPlace['Vijay Nagar, Indore'],
        // Base fare only - the server adds the journey-option surcharges from
        // its own catalogue, so sending estimatedTotal would double-charge.
        fare: config.baseFare,
        baseFare: config.baseFare,
        paymentMethod: 'Cash',
        serviceType: 'hire_driver',
        // Surcharges are priced server-side from the option keys; the amounts
        // shown on this screen are an estimate only.
        hireDriver: {
          hireType: serviceType,
          tripType,
          driverPreference: preference,
          journeyOptions: enabledOptions,
          travelDate: journeyDate,
          travelTime: pickupTime,
          returnDate,
          returnTime,
        },
        estimatedDistanceMeters: serviceType === 'Local (Hourly)' ? 12000 : 56000,
        estimatedDurationMinutes: serviceType === 'Local (Hourly)' ? 120 : 90,
        vehicleTypeId: resolvedVehicle?.vehicleTypeId || '',
        vehicleIconType: resolvedVehicle?.iconType || 'car',
        vehicleIconUrl: resolvedVehicle?.vehicleIconUrl || '',
        transport_type: resolvedVehicle?.transportType || 'taxi',
        vehicle: {
          vehicleTypeId: resolvedVehicle?.vehicleTypeId || '',
          name: resolvedVehicle?.name || 'Driver Service',
          iconType: resolvedVehicle?.iconType || 'car',
          vehicleIconUrl: resolvedVehicle?.vehicleIconUrl || '',
          price: estimatedTotal,
          transportType: resolvedVehicle?.transportType || 'taxi',
        },
        searchNonce: `hire-driver-${Date.now()}`,
      });

  const findVerifiedDrivers = () => {
    const searchState = buildSearchState(vehicle);

    if (!vehicle?.vehicleTypeId) {
      navigate('/taxi/user/ride/select-vehicle', {
        state: {
          ...searchState,
          selectedCategory: 'car',
        },
      });
      return;
    }

    navigate('/taxi/user/ride/searching', {
      state: searchState,
    });
  };

  useEffect(() => {
    let active = true;

    const loadVehicleTypes = async () => {
      setIsVehicleLoading(true);
      try {
        const response = await api.get('/users/vehicle-types');
        const availableVehicles = getVehicleTypes(response)
          .filter((type) => {
            const isActive = type?.active !== false && Number(type?.status ?? 1) !== 0;
            const transportType = String(type?.transport_type || 'taxi').toLowerCase();
            return isActive && (transportType === 'taxi' || transportType === 'both');
          })
          .map((type) => ({
            vehicleTypeId: type?._id || type?.id || '',
            name: getVehicleName(type),
            iconType: type?.icon_types || 'car',
            vehicleIconUrl: type?.map_icon || type?.icon || type?.image || '',
            transportType: String(type?.transport_type || 'taxi').toLowerCase(),
          }))
          .filter((type) => type.vehicleTypeId);

        if (active) {
          setVehicle(availableVehicles[0] || null);
        }
      } catch {
        if (active) {
          setVehicle(null);
        }
      } finally {
        if (active) {
          setIsVehicleLoading(false);
        }
      }
    };

    loadVehicleTypes();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#f7f8fb] text-slate-950 font-sans pb-24 shadow-2xl border-x border-slate-100">
      <header className="sticky top-0 z-50 flex h-[52px] items-center justify-between bg-[#f7f8fb]/95 px-4 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate('/taxi/user/with-driver')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_5px_16px_rgba(15,23,42,0.08)]"
        >
          <ArrowLeft size={19} strokeWidth={2.7} />
        </button>
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Step 1 of 5</p>
          <div className="mt-1 flex justify-center gap-1">
            <span className="h-1.5 w-7 rounded-full bg-[#f5b700]" />
            <span className="h-1.5 w-2 rounded-full bg-slate-200" />
            <span className="h-1.5 w-2 rounded-full bg-slate-200" />
            <span className="h-1.5 w-2 rounded-full bg-slate-200" />
            <span className="h-1.5 w-2 rounded-full bg-slate-200" />
          </div>
        </div>
      </header>

      <main className="space-y-3 px-3">
        <section className="relative overflow-hidden rounded-[18px] bg-[#f5b700] px-4 py-4 shadow-[0_10px_28px_rgba(245,183,0,0.25)]">
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 8 }).map((_, index) => (
              <span
                key={index}
                className="absolute bottom-0 w-10 rounded-t-full bg-white"
                style={{ left: `${index * 13}%`, height: `${22 + (index % 4) * 13}%` }}
              />
            ))}
          </div>
          <div className="relative z-10 max-w-[58%]">
            <h1 className="text-[25px] font-extrabold tracking-[-0.04em]">{config.title}</h1>
            <p className="mt-1 text-[13.5px] font-semibold leading-5 text-slate-900">{config.subtitle}</p>
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {['Police Verified', 'Background Checked', '24x7 Support'].map((label) => (
                <span key={label} className="rounded-lg bg-white/78 px-2 py-2 text-center text-[10px] font-bold leading-3 text-slate-900">
                  {label}
                </span>
              ))}
            </div>
          </div>
          <img
            src={config.image}
            alt={config.title}
            className="absolute bottom-0 right-0 h-[145px] w-[53%] object-cover object-center mix-blend-multiply"
          />
        </section>

        <section className="rounded-[15px] border border-slate-100 bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
          <h2 className="text-[16.5px] font-bold">Trip Type</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[config.primaryPlan, config.secondaryPlan].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTripType(type)}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-[14.5px] font-semibold transition ${
                  tripType === type ? 'border-[#f5b700] bg-[#fff7d8]' : 'border-slate-200 bg-white'
                }`}
              >
                <ArrowRight size={14} className={tripType === type ? 'text-[#f5b700]' : 'text-slate-400'} strokeWidth={3} />
                {type}
              </button>
            ))}
          </div>
        </section>

        <section className="relative rounded-[15px] border border-slate-100 bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
          <button
            type="button"
            onClick={swapLocations}
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#f5b700] shadow-[0_8px_18px_rgba(245,183,0,0.28)]"
          >
            <ArrowUpDown size={18} strokeWidth={3} />
          </button>
          <div className="space-y-3 pr-12">
            <button type="button" onClick={() => openLocationSearch('pickup')} className="flex w-full items-center gap-3 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7d8] text-[#f5b700]">
                <MapPin size={18} fill="currentColor" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-slate-500">Pickup City / Address</p>
                <p className="truncate text-[15.5px] font-semibold">{pickup}</p>
                <p className="text-[11px] font-semibold text-[#f5b700]">Use Current Location</p>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveDropdown('pickup');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveDropdown('pickup');
                  }
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50"
              >
                <ChevronDown size={15} className="text-slate-500" strokeWidth={2.5} />
              </span>
            </button>
            <div className="h-px bg-slate-100" />
            <button type="button" onClick={() => openLocationSearch('drop')} className="flex w-full items-center gap-3 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-900">
                <MapPin size={18} fill="currentColor" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-slate-500">Destination City / Address</p>
                <p className="truncate text-[15.5px] font-semibold">{drop}</p>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveDropdown('drop');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveDropdown('drop');
                  }
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50"
              >
                <ChevronDown size={15} className="text-slate-500" strokeWidth={2.5} />
              </span>
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          {[
            { key: 'journeyDate', label: 'Journey Date', value: journeyDate, icon: CalendarDays },
            { key: 'pickupTime', label: 'Pickup Time', value: pickupTime, icon: Clock3 },
            { key: 'returnDate', label: '(Optional) Return Date', value: tripType === config.secondaryPlan && returnDate === 'Select date' ? '31 Jul 2026' : returnDate, icon: CalendarDays },
            { key: 'returnTime', label: '(Optional) Return Time', value: tripType === config.secondaryPlan && returnTime === 'Select time' ? '06:00 PM' : returnTime, icon: Clock3 },
          ].map(({ key, label, value, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveDropdown(key)}
              className="flex h-[58px] items-center justify-between rounded-[14px] border border-slate-100 bg-white px-3 text-left shadow-[0_5px_16px_rgba(15,23,42,0.05)]"
            >
              <span className="flex items-center gap-2">
                <Icon size={17} strokeWidth={2.5} />
                <span>
                  <span className="block text-[11px] font-medium text-slate-500">{label}</span>
                  <span className="block text-[13.5px] font-semibold">{value}</span>
                </span>
              </span>
              <ChevronDown size={15} className="text-slate-500" strokeWidth={2.5} />
            </button>
          ))}
        </section>

        <section>
          <h2 className="text-[16.5px] font-bold">Driver Preference</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {preferenceOptions.map(({ label, icon: Icon, recommended }) => (
              <button
                key={label}
                type="button"
                onClick={() => setPreference(label)}
                className={`relative min-h-[70px] rounded-[14px] border bg-white px-2 py-2 text-center shadow-[0_5px_16px_rgba(15,23,42,0.05)] ${
                  preference === label ? 'border-[#f5b700]' : 'border-slate-100'
                }`}
              >
                <span className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${preference === label ? 'bg-[#fff2b6] text-[#c18d00]' : 'bg-slate-100 text-slate-700'}`}>
                  <Icon size={18} strokeWidth={2.4} />
                </span>
                <span className="mt-1 block text-[12px] font-semibold leading-3">{label}</span>
                {recommended && <span className="text-[9px] font-semibold text-slate-500">Recommended</span>}
                {preference === label && <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-[#f5b700]" />}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[16.5px] font-bold">Journey Options</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {journeyOptions.map(({ key, label, icon: Icon }) => {
              const active = Boolean(enabledOptions[key]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleOption(key)}
                  className="flex h-12 items-center justify-between rounded-[13px] border border-slate-100 bg-white px-3 shadow-[0_5px_16px_rgba(15,23,42,0.05)]"
                >
                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                    <Icon size={15} strokeWidth={2.7} />
                    {label}
                  </span>
                  <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${active ? 'justify-end bg-[#f5b700]' : 'justify-start bg-slate-200'}`}>
                    <span className="h-4 w-4 rounded-full bg-white shadow" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <div className="rounded-[15px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                <BadgeCheck size={19} strokeWidth={2.7} />
              </span>
              <p className="text-[13.5px] font-semibold text-emerald-900">18 Verified Drivers Available</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-medium text-slate-500">Avg. Arrival Time</p>
                <p className="text-[18px] font-semibold">22 mins</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-500">Response Rate</p>
                <p className="text-[18px] font-semibold">98%</p>
              </div>
            </div>
          </div>

          <div className="rounded-[15px] border border-slate-100 bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <h2 className="text-[14.5px] font-bold">Estimated Charges</h2>
            <div className="mt-2 space-y-1.5 text-[12px] font-bold text-slate-700">
              <div className="flex justify-between"><span>Driver Charges</span><span className="font-semibold text-slate-950">₹{config.baseFare}</span></div>
              <div className="flex justify-between"><span>Add-ons</span><span className="font-semibold text-slate-950">₹{optionTotal}</span></div>
              <div className="flex justify-between"><span>Toll & Parking</span><span className="font-semibold text-slate-950">Actual</span></div>
              <div className="flex justify-between"><span>Food Allowance</span><span className="font-semibold text-emerald-600">Included</span></div>
            </div>
            <div className="mt-3 border-t border-dashed border-slate-200 pt-2">
              <p className="text-[11px] font-medium text-slate-500">Estimated Total</p>
              <p className="text-[24px] font-extrabold text-[#f5b700]">₹{estimatedTotal.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-1 rounded-[15px] border border-slate-100 bg-white px-2 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
          {trustItems.map(({ label, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon size={18} className="mx-auto text-slate-700" strokeWidth={2.4} />
              <p className="mt-1 whitespace-pre-line text-[10px] font-semibold leading-3 text-slate-700">{label}</p>
            </div>
          ))}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg border-t border-slate-100 bg-white/95 px-4 pb-4 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
        <button
          type="button"
          onClick={findVerifiedDrivers}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-[13px] bg-[#f5b700] text-[17px] font-bold text-black shadow-[0_8px_18px_rgba(245,183,0,0.24)]"
        >
          {isVehicleLoading ? 'Find Verified Drivers' : 'Find Verified Drivers'}
          <ArrowRight size={20} strokeWidth={3} />
        </button>
      </div>

      {activeDropdown && dropdownConfig[activeDropdown] && (
        <div className="fixed inset-0 z-[60] mx-auto max-w-lg bg-black/35" onClick={() => setActiveDropdown(null)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-[24px] bg-white p-4 shadow-[0_-18px_40px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
            <h3 className="text-[19px] font-bold text-slate-950">{dropdownConfig[activeDropdown].title}</h3>
            <div className="mt-3 space-y-2">
              {dropdownConfig[activeDropdown].options.map((option) => {
                const selected = dropdownConfig[activeDropdown].value === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectDropdownValue(option)}
                    className={`flex h-12 w-full items-center justify-between rounded-[14px] border px-3 text-left text-[15.5px] font-semibold ${
                      selected ? 'border-[#f5b700] bg-[#fff8df]' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <span>{option}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-[#f5b700]' : 'bg-slate-200'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithDriverBooking;
