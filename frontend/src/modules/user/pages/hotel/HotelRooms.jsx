import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BadgeCheck,
  BedDouble,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Coffee,
  Dumbbell,
  Images,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  Sparkles,
  Star,
  Users,
  Utensils,
  Waves,
  Wifi,
} from 'lucide-react';
import AppHeader from '../../components/AppHeader';

const getRoutePrefix = (pathname = '') => (pathname.startsWith('/taxi/user') ? '/taxi/user' : '');

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const HOTEL_FACILITIES = [
  { label: 'Free Wi-Fi', icon: Wifi },
  { label: 'Swimming Pool', icon: Waves },
  { label: 'Spa', icon: Sparkles },
  { label: 'Gym', icon: Dumbbell },
  { label: 'Restaurant', icon: Utensils },
  { label: 'Free Breakfast', icon: Coffee },
  { label: 'Parking', icon: Car },
];

const GALLERY = [
  '/taxi09_hotel_room_1.jpg',
  '/taxi09_hotel_room_2.jpg',
  '/taxi09_hotel_room_3.jpg',
  '/taxi09_hotel_room_4.jpg',
  '/taxi09_hotel_hero.png',
];

/**
 * Room catalogue. `multiplier` is applied to the hotel's nightly rate so every
 * hotel gets a consistent, sensibly-priced ladder of rooms.
 */
const ROOM_TEMPLATES = [
  {
    id: 'deluxe',
    name: 'Deluxe Room',
    category: 'Deluxe',
    sqft: 300,
    adults: 2,
    children: 1,
    bed: '1 King Bed',
    multiplier: 1,
    perks: ['Breakfast Included', 'Free Cancellation'],
    image: '/taxi09_hotel_room_1.jpg',
    left: 3,
  },
  {
    id: 'premium-deluxe',
    name: 'Premium Deluxe Room',
    category: 'Premium',
    sqft: 380,
    adults: 2,
    children: 1,
    bed: '1 King Bed',
    multiplier: 1.21,
    perks: ['Breakfast Included', 'Free Cancellation'],
    image: '/taxi09_hotel_room_2.jpg',
    left: 5,
  },
  {
    id: 'executive-suite',
    name: 'Executive Suite',
    category: 'Suite',
    sqft: 520,
    adults: 2,
    children: 2,
    bed: '1 King Bed',
    multiplier: 1.66,
    perks: ['Breakfast Included', 'Free Cancellation'],
    image: '/taxi09_hotel_room_3.jpg',
    left: 2,
  },
  {
    id: 'family-suite',
    name: 'Family Suite',
    category: 'Family',
    sqft: 650,
    adults: 4,
    children: 2,
    bed: '2 King Beds',
    multiplier: 2.22,
    perks: ['Breakfast Included', 'Free Cancellation'],
    image: '/taxi09_hotel_room_4.jpg',
    left: 1,
  },
  {
    id: 'presidential',
    name: 'Presidential Suite',
    category: 'Premium',
    sqft: 900,
    adults: 4,
    children: 2,
    bed: '2 King Beds',
    multiplier: 3.1,
    perks: ['Breakfast Included', 'Airport Pickup', 'Free Cancellation'],
    image: '/taxi09_hotel_hero.png',
    left: 1,
  },
];

const TABS = ['All Rooms', 'Deluxe', 'Suite', 'Family', 'Premium'];

const formatRange = (checkIn, checkOut) => {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  const fmt = (date, withYear) =>
    date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
  return `${fmt(start, false)} - ${fmt(end, true)}`;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateStr, offset) => {
  const base = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(base.getTime())) return dateStr;
  base.setDate(base.getDate() + offset);
  return toDateKey(base);
};

const nightsBetween = (checkIn, checkOut) => {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.round((end - start) / 86400000));
};

const HotelRooms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const state = location.state || {};
  const { hotel } = state;

  // Editable on this page so Modify re-prices this hotel instead of bouncing
  // back to search and losing the selection.
  const [checkIn, setCheckIn] = useState(state.checkIn || '');
  const [checkOut, setCheckOut] = useState(state.checkOut || '');
  const [roomCount, setRoomCount] = useState(Number(state.rooms) || 1);
  const [guests, setGuests] = useState(Number(state.guests) || 2);
  const [modifyOpen, setModifyOpen] = useState(false);

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('All Rooms');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const nights = nightsBetween(checkIn, checkOut);

  const roomList = useMemo(
    () =>
      ROOM_TEMPLATES.map((template) => {
        const price = Math.round(((hotel?.price || 0) * template.multiplier) / 10) * 10;
        const oldPrice = Math.round(((hotel?.oldPrice || 0) * template.multiplier) / 10) * 10;
        return {
          ...template,
          price,
          oldPrice,
          off: oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0,
          capacity: template.adults + template.children,
        };
      }),
    [hotel?.price, hotel?.oldPrice],
  );

  const visibleRooms = useMemo(
    () => (activeTab === 'All Rooms' ? roomList : roomList.filter((room) => room.category === activeTab)),
    [activeTab, roomList],
  );

  if (!hotel) {
    navigate(`${routePrefix}/hotel`, { replace: true });
    return null;
  }

  const selectedRoom = roomList.find((room) => room.id === selectedRoomId) || null;
  const totalGuestCapacity = selectedRoom ? selectedRoom.capacity * roomCount : 0;
  const capacityShortfall = selectedRoom && totalGuestCapacity < guests;
  const stayTotal = selectedRoom ? selectedRoom.price * nights * roomCount : 0;

  const handleContinue = () => {
    if (!selectedRoom) {
      toast('Select a room to continue');
      return;
    }
    if (capacityShortfall) {
      toast.error(`${selectedRoom.name} fits ${totalGuestCapacity} guests. Add rooms or pick a bigger room.`);
      return;
    }
    navigate(`${routePrefix}/hotel/checkout`, {
      state: { hotel, room: selectedRoom, checkIn, checkOut, rooms: roomCount, guests },
    });
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[var(--background)] pb-32 text-[var(--text)]">
      <AppHeader showBack subtitle="HOTEL DETAILS" />

      {/* Gallery */}
      <section className="relative h-[220px] overflow-hidden bg-slate-900">
        {GALLERY.map((image, index) => (
          <img
            key={image}
            src={index === 0 ? hotel.image || image : image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              index === galleryIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        <button
          type="button"
          onClick={() => setGalleryIndex((i) => (i - 1 + GALLERY.length) % GALLERY.length)}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
        >
          <ChevronLeft size={17} strokeWidth={2.8} />
        </button>
        <button
          type="button"
          onClick={() => setGalleryIndex((i) => (i + 1) % GALLERY.length)}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
        >
          <ChevronRight size={17} strokeWidth={2.8} />
        </button>

        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
          {galleryIndex + 1} / {GALLERY.length}
        </span>
        <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
          <Images size={15} className="text-slate-700" />
        </span>
      </section>

      <main className="px-3">
        {/* Hotel summary */}
        <section className="-mt-4 relative z-10 rounded-[18px] border border-[var(--border)] bg-white p-3.5 shadow-[var(--shadow-md)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-[16px] font-extrabold leading-[1.25]">
                {hotel.name}
                <BadgeCheck size={14} className="ml-1 inline-block -translate-y-[1px] text-emerald-500" />
              </h1>
              <p className="mt-1.5 flex items-start gap-1 text-[10.5px] font-medium leading-[1.35] text-[var(--text-light)]">
                <MapPin size={11} className="mt-[1px] shrink-0" />
                <span>
                  {hotel.area} <span className="text-slate-300">•</span> {hotel.distance}
                </span>
              </p>
            </div>
            <div className="shrink-0 rounded-[10px] bg-[var(--secondary)] px-2 py-1.5 text-center">
              <p className="flex items-center gap-1 text-[13px] font-extrabold">
                <Star size={12} className="fill-[var(--primary)] text-[var(--primary)]" />
                {hotel.rating}
              </p>
              <p className="mt-0.5 text-[8.5px] font-medium text-[var(--text-light)]">{hotel.reviews} reviews</p>
            </div>
          </div>

          <div className="mt-3 flex gap-3 overflow-x-auto border-t border-[var(--border)] pt-3 no-scrollbar">
            {HOTEL_FACILITIES.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="flex shrink-0 flex-col items-center gap-1 text-[8.5px] font-semibold text-[var(--text-light)]"
              >
                <Icon size={15} className="text-[var(--primary-dark)]" />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* Stay summary */}
        <section className="mt-3 flex items-center gap-2 rounded-[14px] border border-[var(--border)] bg-white px-3 py-2.5 shadow-[var(--shadow-sm)]">
          <div className="min-w-0 flex-1 border-r border-[var(--border)] pr-2">
            <p className="truncate text-[11px] font-extrabold">{formatRange(checkIn, checkOut)}</p>
            <p className="text-[9px] font-medium text-[var(--text-light)]">
              {nights} Night{nights > 1 ? 's' : ''}
            </p>
          </div>
          <div className="min-w-0 flex-1 pl-1">
            <p className="truncate text-[11px] font-extrabold">
              {roomCount} Room{roomCount > 1 ? 's' : ''}, {guests} Guest{guests > 1 ? 's' : ''}
            </p>
            <p className="text-[9px] font-medium text-[var(--text-light)]">Occupancy</p>
          </div>
          <button
            type="button"
            onClick={() => setModifyOpen((current) => !current)}
            className={`shrink-0 rounded-[10px] border border-[var(--primary)] px-2.5 py-2 text-[10px] font-extrabold transition-colors ${
              modifyOpen ? 'bg-[var(--secondary)]' : ''
            }`}
          >
            {modifyOpen ? 'Done' : 'Modify'}
          </button>
        </section>

        {modifyOpen ? (
          <section className="mt-2 rounded-[14px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]">
            <p className="text-[11px] font-extrabold">Modify stay at {hotel.name}</p>

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <label className="rounded-[12px] border border-[var(--border)] px-3 py-2">
                <span className="block text-[8.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">
                  Check-in
                </span>
                <input
                  type="date"
                  min={todayKey}
                  value={checkIn}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCheckIn(next);
                    if (checkOut <= next) setCheckOut(addDays(next, 1));
                  }}
                  className="mt-1 w-full bg-transparent text-[12px] font-extrabold outline-none"
                />
              </label>
              <label className="rounded-[12px] border border-[var(--border)] px-3 py-2">
                <span className="block text-[8.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-light)]">
                  Check-out
                </span>
                <input
                  type="date"
                  min={addDays(checkIn, 1)}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  className="mt-1 w-full bg-transparent text-[12px] font-extrabold outline-none"
                />
              </label>
            </div>

            {[
              { label: 'Rooms', value: roomCount, set: setRoomCount, min: 1, max: 6 },
              { label: 'Guests', value: guests, set: setGuests, min: 1, max: 20 },
            ].map(({ label, value, set, min, max }) => (
              <div key={label} className="flex items-center justify-between border-t border-[var(--border)] py-2.5">
                <span className="text-[12px] font-extrabold">{label}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={value <= min}
                    onClick={() => set(value - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] disabled:opacity-30"
                  >
                    <Minus size={13} strokeWidth={3} />
                  </button>
                  <span className="w-5 text-center text-[13px] font-extrabold">{value}</span>
                  <button
                    type="button"
                    disabled={value >= max}
                    onClick={() => set(value + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] disabled:opacity-30"
                  >
                    <Plus size={13} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setModifyOpen(false)}
              className="mt-1 w-full rounded-[12px] bg-[linear-gradient(180deg,#FFD54F,#FFC107)] py-2.5 text-[12px] font-extrabold"
            >
              Apply to this hotel
            </button>
          </section>
        ) : null}

        {/* Room type tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-bold transition-colors ${
                activeTab === tab
                  ? 'border-[var(--primary)] bg-[var(--secondary)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-white text-[var(--text-light)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Rooms */}
        <div className="mt-3 space-y-3 app-grid">
          {visibleRooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const fits = room.capacity * roomCount >= guests;

            return (
              <div
                key={room.id}
                className={`overflow-hidden rounded-[18px] border bg-white shadow-[var(--shadow-sm)] transition-colors ${
                  isSelected ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : 'border-[var(--border)]'
                }`}
              >
                <div className="flex gap-3 p-3">
                  <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[13px] bg-slate-200">
                    <img src={room.image} alt={room.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 text-[13px] font-extrabold leading-tight">{room.name}</h3>
                      <span className="shrink-0 rounded-[6px] bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-[var(--success)]">
                        {room.off}% OFF
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[9.5px] font-semibold text-[var(--text-light)]">
                      <span className="flex items-center gap-1">
                        <Maximize2 size={10} className="text-[var(--primary-dark)]" />
                        {room.sqft} sqft
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={10} className="text-[var(--primary-dark)]" />
                        {room.adults} Adults{room.children ? ` + ${room.children} Child` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble size={10} className="text-[var(--primary-dark)]" />
                        {room.bed}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {room.perks.map((perk) => (
                        <span
                          key={perk}
                          className="flex items-center gap-1 rounded-[6px] bg-slate-50 px-1.5 py-0.5 text-[8.5px] font-semibold text-[var(--text-light)]"
                        >
                          <CircleCheck size={9} className="text-emerald-500" />
                          {perk}
                        </span>
                      ))}
                    </div>

                    {room.left <= 3 ? (
                      <p className="mt-1.5 text-[9px] font-bold text-[var(--danger)]">
                        Only {room.left} room{room.left > 1 ? 's' : ''} left
                      </p>
                    ) : null}

                    {!fits ? (
                      <p className="mt-1 text-[9px] font-bold text-amber-600">
                        Fits {room.capacity * roomCount} of {guests} guests
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-[10px] font-medium text-slate-400 line-through">
                        {rupees(room.oldPrice)}
                      </span>
                      <span className="text-[17px] font-extrabold leading-none">{rupees(room.price)}</span>
                      <span className="text-[9px] font-medium text-[var(--text-light)]">/ night</span>
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium text-[var(--text-light)]">
                      {rupees(room.price * nights * roomCount)} for {nights} night{nights > 1 ? 's' : ''}
                      {roomCount > 1 ? ` · ${roomCount} rooms` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      navigate(`${routePrefix}/hotel/checkout`, {
                        state: { hotel, room, checkIn, checkOut, rooms: roomCount, guests },
                      });
                    }}
                    className={`shrink-0 rounded-[10px] px-3.5 py-2.5 text-[11px] font-extrabold transition-colors ${
                      isSelected
                        ? 'bg-slate-950 text-white'
                        : 'bg-[linear-gradient(180deg,#FFD54F,#FFC107)] text-[var(--text)] shadow-[0_6px_14px_rgba(245,183,0,0.32)]'
                    }`}
                  >
                    Select Room
                  </button>
                </div>
              </div>
            );
          })}

          {visibleRooms.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[var(--border)] bg-white px-4 py-10 text-center">
              <BedDouble size={24} className="mx-auto text-slate-300" />
              <p className="mt-2 text-[12.5px] font-extrabold">No {activeTab} rooms here</p>
              <button
                type="button"
                onClick={() => setActiveTab('All Rooms')}
                className="mt-3 rounded-[12px] bg-[var(--secondary)] px-4 py-2 text-[11.5px] font-extrabold text-[var(--primary-dark)]"
              >
                Show all rooms
              </button>
            </div>
          ) : null}
        </div>
      </main>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 border-t border-[var(--border)] bg-white px-4 pb-6 pt-3">
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-extrabold">
              {selectedRoom ? selectedRoom.name : 'No room selected'}
            </p>
            <p className="truncate text-[9.5px] font-medium text-[var(--text-light)]">
              {formatRange(checkIn, checkOut)} · {roomCount} Room{roomCount > 1 ? 's' : ''}, {guests} Guest
              {guests > 1 ? 's' : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[17px] font-extrabold leading-none">{rupees(stayTotal)}</p>
            <p className="mt-0.5 text-[9px] font-medium text-[var(--text-light)]">incl. taxes &amp; fees</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedRoom}
          className={`flex w-full items-center justify-center gap-2 rounded-[16px] py-3.5 text-[15px] font-extrabold transition-colors ${
            selectedRoom
              ? 'bg-[linear-gradient(180deg,#FFD54F,#FFC107)] text-[var(--text)] shadow-[0_8px_20px_rgba(255,193,7,.4)]'
              : 'cursor-not-allowed bg-slate-100 text-slate-400'
          }`}
        >
          Continue <ChevronRight size={18} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
};

export default HotelRooms;
