import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import contentApi from '../../services/contentApi';
import { PageShell, StatusPill, Table } from './BookingTable';
import { formatDate, formatMoney, inputClass } from './bookingFormat';

/** Hotel stays booked through the app. */
const HotelBookings = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    const query = params.toString();

    setLoading(true);
    contentApi
      .listHotelBookings(query ? `?${query}` : '')
      .then((data) => setRows(data?.results || []))
      .catch((error) => toast.error(error.message || 'Could not load hotel bookings'))
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const setBookingStatus = async (id, patch) => {
    try {
      await contentApi.updateHotelBooking(id, patch);
      toast.success('Booking updated');
      load();
    } catch (error) {
      toast.error(error.message || 'Update failed');
    }
  };

  return (
    <PageShell
      title="Hotel Bookings"
      subtitle="Stays booked by customers"
      count={loading ? undefined : rows.length}
      toolbar={
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, hotel, guest…"
            className={`${inputClass} w-64`}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">All statuses</option>
            {['confirmed', 'pending', 'cancelled', 'completed'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      }
    >
      <Table
        loading={loading}
        rows={rows}
        empty="No hotel bookings yet."
        columns={['Reference', 'Hotel', 'Guest', 'Stay', 'Amount', 'Payment', 'Status', 'Booked']}
        renderRow={(row) => (
          <tr key={row._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
            <td className="px-4 py-3 text-[12.5px] font-bold text-slate-900">{row.bookingReference}</td>
            <td className="px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-900">{row.hotelName}</p>
              <p className="text-[11.5px] text-slate-500">{row.roomName} · {row.hotelCity}</p>
            </td>
            <td className="px-4 py-3">
              <p className="text-[13px] text-slate-800">{row.userId?.name || row.guestName || '—'}</p>
              <p className="text-[11.5px] text-slate-500">{row.userId?.phone || row.guestPhone || ''}</p>
            </td>
            <td className="px-4 py-3 text-[12.5px] text-slate-700">
              {row.checkIn} → {row.checkOut}
              <span className="block text-[11.5px] text-slate-500">
                {row.nights} night(s) · {row.rooms} room(s) · {row.guests} guest(s)
              </span>
            </td>
            <td className="px-4 py-3">
              <p className="text-[13px] font-bold text-slate-900">{formatMoney(row.totalAmount)}</p>
              <p className="text-[11px] text-slate-500">incl. {row.taxPercent}% GST</p>
            </td>
            <td className="px-4 py-3"><StatusPill value={row.paymentStatus} /></td>
            <td className="px-4 py-3">
              <select
                value={row.status}
                onChange={(e) => setBookingStatus(row._id, { status: e.target.value })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[12px] capitalize outline-none focus:border-amber-400"
              >
                {['confirmed', 'pending', 'cancelled', 'completed'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </td>
            <td className="px-4 py-3 text-[12px] text-slate-500">{formatDate(row.createdAt)}</td>
          </tr>
        )}
      />
    </PageShell>
  );
};

export default HotelBookings;
