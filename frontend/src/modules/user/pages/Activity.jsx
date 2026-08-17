import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import ActivityPager from '../components/activity/ActivityPager';
import {
  ActivityEmptyState,
  ActivityErrorState,
  ActivityLoadingState,
  ActivitySupportState,
} from '../components/activity/ActivityStates';
import {
  ArrowLeft,
  CalendarDays,
  Car,
  ChevronRight,
  Clock3,
  Home,
  Package,
  User,
  Wallet,
} from 'lucide-react';
import api from '../../../shared/api/axiosInstance';
import userBusService from '../services/busService';
import { userService } from '../services/userService';
import { normalizeBusBooking, normalizeRentalBooking, normalizeRide, PAGE_SIZE } from '../components/activity/activityHelpers';
import ReviewPrompt from '../components/ReviewPrompt';

const AGGREGATE_FETCH_LIMIT = 60;
const VISIBLE_TABS = ['All', 'Rides', 'Parcels', 'Rental', 'Bus'];

const getPayload = (response) => response?.data?.data || response?.data || response || {};

const buildLocalPagination = (items, page) => {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;

  return {
    results: items.slice(startIndex, startIndex + PAGE_SIZE),
    pagination: {
      page: safePage,
      limit: PAGE_SIZE,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
};

const sortLatestFirst = (items = []) => [...items].sort((left, right) => Number(right.sortTimestamp || 0) - Number(left.sortTimestamp || 0));

const getRideCategoryForTab = (tab) => {
  if (tab === 'Rides') return 'rides';
  if (tab === 'Parcels') return 'parcels';
  if (tab === 'Outstation') return 'outstation';
  if (tab === 'Scheduled') return 'scheduled';
  return '';
};

const getHelperText = (tab) => {
  if (tab === 'Support') return 'Tickets and help requests';
  if (tab === 'Rental') return 'Your rental bookings, pickup schedule, and booking status';
  if (tab === 'Bus') return 'Your bus tickets, travel timings, and operator details';
  if (tab === 'Outstation') return 'Long-distance trips and outstation deliveries';
  if (tab === 'Scheduled') return 'Bookings reserved for a later pickup time';
  return 'Your recent trips, deliveries, and bookings';
};

const buildRentalActivityState = (booking) => ({
  ...booking,
  serviceType: 'rental',
  rideId: booking?.id || booking?._id || '',
  status: booking?.status || 'pending',
  summaryMode: String(booking?.status || '').toLowerCase() === 'completed' ? 'completed' : undefined,
});


const toDisplayDate = (value) => String(value || '--').toUpperCase();

const getStatusClasses = (tone = '', status = '') => {
  const normalized = String(status || tone).toLowerCase();
  if (normalized.includes('ongoing') || normalized.includes('pending')) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-green-200 bg-green-50 text-green-700';
};

const ActivityBookingCard = ({ activity, onClick }) => (
  <button type="button" onClick={onClick} className="flex w-full items-start gap-2.5 rounded-[14px] bg-white p-2.5 text-left shadow-[0_6px_16px_rgba(15,23,42,0.07)]">
    <div className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[11px] bg-[#fff7d7]">
      <img src={activity.vehicleImage || '/white_sedan_banner_car.png'} alt="" className="h-full w-full object-contain p-1.5" />
      <span className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#f5c400] text-[9.5px] font-black">
        {String(activity.registration || activity.type || 'MP').slice(0, 2).toUpperCase()}
      </span>
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-black leading-tight tracking-[-0.02em] text-slate-950">{activity.title || 'Taxi09 booking'}</h3>
          <p className="mt-0.5 truncate text-[10.5px] font-black uppercase tracking-[0.08em] text-slate-500">{activity.eyebrow || activity.vehicle || 'Booking'}</p>
        </div>
        <p className="shrink-0 text-[14.5px] font-black text-slate-950">Rs{Number(activity.price || 0).toLocaleString('en-IN')}</p>
      </div>

      <div className="mt-1.5 grid grid-cols-[12px_1fr] gap-x-1.5 text-[11.5px] font-semibold text-slate-700">
        <span className="relative mt-1 flex flex-col items-center">
          <span className="h-2 w-2 rounded-full bg-[#f5c400]" />
          <span className="h-3.5 w-px bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </span>
        <span className="min-w-0">
          <span className="block truncate">{activity.pickup || 'Pickup location'}</span>
          <span className="mt-0.5 block truncate">{activity.drop || 'Drop location'}</span>
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10.5px] font-black uppercase tracking-[0.05em] text-slate-500">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={11} />
          {toDisplayDate(activity.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 size={11} />
          {activity.time || '--'}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-black uppercase ${getStatusClasses(activity.statusTone, activity.status)}`}>
          {activity.status || 'Completed'}
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[#f5c400]">
          <ChevronRight size={13} strokeWidth={3.2} />
        </span>
      </div>
    </div>
  </button>
);

const Activity = ({ embedded = false }) => {
  const { state: navState, pathname } = useLocation();
  // Callers (the app drawer, for one) can land straight on a tab.
  const [activeTab, setActiveTab] = useState(() =>
    VISIBLE_TABS.includes(navState?.tab) ? navState.tab : 'All',
  );
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const navigate = useNavigate();
  const routePrefix = pathname.startsWith('/taxi/user') ? '/taxi/user' : '';

  useEffect(() => {
    let active = true;

    const loadActivities = async () => {
      setLoading(true);
      setError('');

      try {
        if (activeTab === 'Support') {
          if (!active) return;
          setActivities([]);
          setPagination({
            page: 1,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
          return;
        }

        let nextActivities = [];
        let nextPagination = null;

        if (activeTab === 'Rental') {
          const response = await userService.getMyRentalBookings({
            page: currentPage,
            limit: PAGE_SIZE,
          });
          const payload = getPayload(response);
          const bookings = Array.isArray(payload?.results) ? payload.results : [];
          nextActivities = bookings.map(normalizeRentalBooking).filter((item) => item.id);
          nextPagination = payload?.pagination || null;
        } else if (activeTab === 'Bus') {
          const response = await userBusService.getMyBookings({
            page: currentPage,
            limit: PAGE_SIZE,
          });
          const payload = getPayload(response);
          const bookings = Array.isArray(payload?.results) ? payload.results : [];
          nextActivities = bookings.map(normalizeBusBooking).filter((item) => item.id);
          nextPagination = payload?.pagination || null;
        } else if (activeTab === 'All') {
          const [ridesResponse, rentalResponse, busResponse] = await Promise.all([
            api.get('/rides', {
              params: {
                limit: AGGREGATE_FETCH_LIMIT,
                page: 1,
              },
            }).catch((err) => {
              console.log('Failed to fetch rides in aggregate:', err);
              return { data: { results: [] } };
            }),
            userService.getMyRentalBookings({
              page: 1,
              limit: AGGREGATE_FETCH_LIMIT,
            }).catch((err) => {
              console.log('Failed to fetch rentals in aggregate:', err);
              return { data: { results: [] } };
            }),
            userBusService.getMyBookings({
              page: 1,
              limit: AGGREGATE_FETCH_LIMIT,
            }).catch((err) => {
              console.log('Failed to fetch bus bookings in aggregate:', err);
              return { data: { results: [] } };
            }),
          ]);

          const ridePayload = getPayload(ridesResponse);
          const rentalPayload = getPayload(rentalResponse);
          const busPayload = getPayload(busResponse);
          const rides = Array.isArray(ridePayload?.results) ? ridePayload.results : [];
          const rentalBookings = Array.isArray(rentalPayload?.results) ? rentalPayload.results : [];
          const bookings = Array.isArray(busPayload?.results) ? busPayload.results : [];
          const merged = sortLatestFirst([
            ...rides.map(normalizeRide).filter((item) => item.id),
            ...rentalBookings.map(normalizeRentalBooking).filter((item) => item.id),
            ...bookings.map(normalizeBusBooking).filter((item) => item.id),
          ]);
          const localPage = buildLocalPagination(merged, currentPage);
          nextActivities = localPage.results;
          nextPagination = localPage.pagination;
        } else {
          const response = await api.get('/rides', {
            params: {
              limit: PAGE_SIZE,
              page: currentPage,
              category: getRideCategoryForTab(activeTab),
            },
          });
          const payload = getPayload(response);
          const rides = Array.isArray(payload?.results) ? payload.results : [];
          nextActivities = rides.map(normalizeRide).filter((ride) => ride.id);
          nextPagination = payload?.pagination || null;
        }

        if (!active) {
          return;
        }

        setActivities(nextActivities);
        setPagination(nextPagination || {
          page: currentPage,
          limit: PAGE_SIZE,
          total: nextActivities.length,
          totalPages: Math.max(1, Math.ceil(nextActivities.length / PAGE_SIZE)),
          hasNextPage: false,
          hasPrevPage: currentPage > 1,
        });
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError?.message || 'Could not load your ride history.');
        setActivities([]);
        setPagination({
          page: 1,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      active = false;
    };
  }, [activeTab, currentPage, reloadKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleItemClick = (item) => {
    if (item.type === 'bus') {
      navigate(`${routePrefix}/profile/bus-bookings/${item.id}`);
    } else if (item.type === 'rental') {
      navigate(`${routePrefix}/rental/confirmed`, { state: buildRentalActivityState(item.booking) });
    } else if (item.type === 'parcel') {
      navigate(`${routePrefix}/parcel/detail/${item.id}`);
    } else {
      navigate(`${routePrefix}/ride/detail/${item.id}`, { state: { ride: item.ride } });
    }
  };
  // Bookings this user has already reviewed, so a finished one is not asked
  // twice. A failure here leaves the set empty, which shows the prompt - the
  // server still rejects a duplicate, so the worst case is a wasted tap.
  const [reviewedBookings, setReviewedBookings] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    api.get('/users/reviews/mine')
      .then((response) => {
        if (cancelled) return;
        const ids = response?.data?.data?.bookingIds || response?.data?.bookingIds || [];
        setReviewedBookings(new Set(ids.map(String)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const helperText = useMemo(() => getHelperText(activeTab), [activeTab]);
  const visibleActivities = activities;

  return (
    <div
      className={
        embedded
          ? 'w-full bg-[#f8f7f2] font-sans text-slate-950'
          : 'mx-auto min-h-screen w-full max-w-lg bg-[#f8f7f2] pb-28 font-sans text-slate-950 shadow-2xl'
      }
    >
      {embedded ? null : (
      <header className="relative h-[132px] overflow-hidden bg-[#f5c400]">
        <img src="/taxi09_activity_hero.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        
        <button type="button" onClick={() => navigate(-1)} className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black text-[#f5c400] shadow-[0_6px_14px_rgba(0,0,0,0.22)]">
          <ArrowLeft size={16} strokeWidth={3} />
        </button>
        <div className="relative z-10 ml-[56px] pt-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em]">My Bookings</p>
          <h1 className="mt-0.5 text-[20px] font-black leading-none tracking-[-0.04em]">Recent activity</h1>
          <p className="mt-1.5 max-w-[58%] text-[12px] font-semibold leading-tight text-slate-800">{helperText}</p>
        </div>
      </header>
      )}

      <main className="-mt-4 rounded-t-[22px] bg-[#f8f7f2] px-3 pt-4">
        <div className="mb-3 rounded-[16px] border border-slate-200 bg-white p-1 shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-5 gap-1">
            {VISIBLE_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-[12px] px-1 py-2.5 text-[11.5px] font-extrabold uppercase tracking-[0.02em] transition ${
                  activeTab === tab ? 'bg-[#f5c400] text-slate-950 shadow-[0_6px_14px_rgba(245,196,0,0.28)]' : 'text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
        {activeTab === 'Support' ? (
          <ActivitySupportState onContact={() => navigate(`${routePrefix}/support`)} />
        ) : loading ? (
          <ActivityLoadingState />
        ) : error ? (
          <ActivityErrorState error={error} onRetry={() => setReloadKey((current) => current + 1)} />
        ) : visibleActivities.length === 0 ? (
          <ActivityEmptyState activeTab={activeTab} />
        ) : (
          <div className="space-y-2.5 pb-5">
            {visibleActivities.map((activity) => (
              /* The prompt sits below the card rather than inside it: the card
                 is a button, and nesting the star buttons in it would be
                 invalid markup with the clicks fighting each other. */
              <div key={activity.id} className="space-y-2">
                <ActivityBookingCard
                  activity={activity}
                  onClick={() => handleItemClick(activity)}
                />
                {activity.type === 'rental'
                  && String(activity.status || '').toLowerCase() === 'completed'
                  && !reviewedBookings.has(String(activity.id)) ? (
                    <ReviewPrompt
                      bookingId={activity.id}
                      bookingType="rental"
                      vehicleName={activity.vehicleName || activity.title || ''}
                    />
                  ) : null}
              </div>
            ))}
            <ActivityPager
              pagination={pagination}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
            />
          </div>
        )}
        </div>
      </main>

      {embedded ? null : <BottomNavbar />}
    </div>
  );
};

export default Activity;
