import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  Luggage,
  Mail,
  MapPin,
  Phone,
  User2,
  Users,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { socketService } from '../../../../shared/api/socket';

const statusClasses = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  reviewing: 'bg-sky-50 text-sky-700 border-sky-100',
  quoted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'Not set');

const normalizeArray = (payload) =>
  payload?.data?.data?.results ||
  payload?.data?.results ||
  payload?.results ||
  [];

const RentalQuoteRequests = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch requests from API
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await adminService.getRentalQuoteRequests();
        if (!mounted) return;
        setItems(normalizeArray(response));
      } catch (error) {
        if (mounted) {
          toast.error(error?.message || 'Could not load rental quote requests.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for socket events to update real-time
  useEffect(() => {
    const handleNewRequest = (newRequest) => {
      if (newRequest) {
        setItems((current) => {
          // Check if already in the list to avoid duplicate rendering
          const exists = current.some(
            (item) => String(item.id || item._id) === String(newRequest.id || newRequest._id)
          );
          if (exists) return current;

          toast.success(
            `New quote request received from ${
              newRequest.userId?.name || newRequest.contactName || 'Customer'
            }`,
            { duration: 5000 }
          );
          return [newRequest, ...current];
        });
      }
    };

    socketService.on('new_rental_quote_request', handleNewRequest);

    return () => {
      socketService.off('new_rental_quote_request', handleNewRequest);
    };
  }, []);

  const counts = useMemo(
    () => ({
      open: items.filter((item) => ['pending', 'reviewing'].includes(String(item.status || '').toLowerCase())).length,
      quoted: items.filter((item) => String(item.status || '').toLowerCase() === 'quoted').length,
    }),
    [items],
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8 admin-theme">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rental Quote Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review custom rental requirements in real-time and provide quotes.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Open</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{counts.open}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quoted</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{counts.quoted}</p>
          </div>
        </div>
      </div>

      {/* Quote Requests List */}
      <div className="space-y-5">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-400">
            Loading rental quote requests...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-400">
            No rental quote requests found.
          </div>
        ) : (
          items.map((item) => {
            const id = String(item.id || item._id);
            const status = String(item.status || 'pending').toLowerCase();
            const statusClass = statusClasses[status] || statusClasses.pending;

            return (
              <div
                key={id}
                onClick={() => navigate(`/admin/pricing/rental-quotes/${id}`)}
                className="group rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200 cursor-pointer"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition">
                        {item.vehicleName || 'Rental Vehicle'}
                      </h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                        {status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {item.vehicleCategory || item.vehicleTypeId?.vehicleCategory || 'Vehicle'}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Request ID: {id}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Quoted Amount</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      Rs {Number(item.adminQuotedAmount || 0).toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <User2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Customer</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{item.userId?.name || item.contactName || 'Unknown user'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Phone size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Phone</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{item.userId?.phone || item.contactPhone || 'No phone'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Mail size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 truncate">{item.userId?.email || item.contactEmail || 'No email'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Clock3 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Requested Hours</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {Number(item.requestedHours || 0) > 0 ? `${item.requestedHours} hr` : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Users size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Seats Needed</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {Number(item.seatsNeeded || 0) > 0 ? item.seatsNeeded : 'Not specified'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Luggage size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Bags Needed</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{Number(item.luggageNeeded || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <CalendarDays size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Pickup Time</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{formatDateTime(item.pickupDateTime)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <CalendarDays size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Return Time</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{formatDateTime(item.returnDateTime)}</p>
                  </div>
                </div>

                {/* Footer with pickup location summary and action link */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <MapPin size={14} className="text-slate-400" />
                    <span>
                      Pickup: <strong className="text-slate-700 font-bold">{item.pickupLocation || 'Not specified'}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/pricing/rental-quotes/${id}`);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4.5 py-2.5 text-xs font-black uppercase tracking-wider text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white"
                  >
                    View Details & Respond <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RentalQuoteRequests;
