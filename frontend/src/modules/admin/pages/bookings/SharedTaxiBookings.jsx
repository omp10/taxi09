import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import contentApi from '../../services/contentApi';
import { PageShell, StatusPill, Table } from './BookingTable';
import { formatDate, formatMoney, inputClass } from './bookingFormat';

/**
 * Seats sold on scheduled shared-taxi departures.
 *
 * Cancelling here releases the seats back to the trip - the server does that,
 * not this screen - so a cancelled booking does not quietly shrink a departure.
 */

const STATUSES = ['confirmed', 'completed', 'cancelled'];

const SharedTaxiBookings = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    contentApi
      .listSharedTaxiBookings()
      .then((data) => setRows(data?.results || []))
      .catch((error) => toast.error(error.message || 'Could not load shared taxi bookings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (row, body) => {
    if (
      body.status === 'cancelled' &&
      !window.confirm(
        `Cancel ${row.bookingReference}? Seat(s) ${(row.seatLabels || []).join(', ')} will be released back to the departure.`,
      )
    ) {
      return;
    }

    try {
      await contentApi.updateSharedTaxiBooking(row._id, body);
      toast.success('Booking updated');
      load();
    } catch (error) {
      toast.error(error.message || 'Update failed');
    }
  };

  // Filtered here rather than server-side: the endpoint returns the latest 300
  // and this screen is a queue, not a report.
  const visible = useMemo(
    () => (status ? rows.filter((row) => row.status === status) : rows),
    [rows, status],
  );

  const seatsSold = useMemo(
    () =>
      rows
        .filter((row) => row.status !== 'cancelled')
        .reduce((total, row) => total + (row.seatLabels || []).length, 0),
    [rows],
  );

  return (
    <PageShell
      title="Shared Taxi Bookings"
      subtitle={`${seatsSold} seat(s) sold across live bookings`}
      count={visible.length}
      toolbar={
        <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      }
    >
      <Table
        loading={loading}
        rows={visible}
        empty="No shared taxi bookings yet"
        columns={['Reference', 'Route', 'Departs', 'Seats', 'Passenger', 'Amount', 'Status', 'Payment', 'Actions']}
        renderRow={(row) => (
          <tr key={row._id} className="border-b border-slate-100 last:border-0">
            <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold text-slate-900">
              {row.bookingReference}
            </td>
            <td className="px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-900">{row.fromLabel}</p>
              <p className="text-[11.5px] text-slate-500">to {row.toLabel}</p>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[13px] text-slate-700">
              {row.travelDate}
              <span className="block text-[11.5px] text-slate-500">{row.departure || '—'}</span>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {(row.seatLabels || []).map((label) => (
                  <span
                    key={label}
                    className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11.5px] font-bold text-slate-700"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3">
              <p className="text-[13px] text-slate-800">{row.passengerName || '—'}</p>
              <p className="text-[11.5px] text-slate-500">{row.passengerPhone || ''}</p>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-slate-900">
              {formatMoney(row.totalAmount)}
            </td>
            <td className="px-4 py-3">
              <StatusPill value={row.status} />
            </td>
            <td className="px-4 py-3">
              <StatusPill value={row.paid ? 'paid' : 'pending'} />
              <span className="mt-1 block text-[11px] capitalize text-slate-400">
                {row.paymentMethod || ''}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <select
                  className={inputClass}
                  value={row.status}
                  onChange={(event) => patch(row, { status: event.target.value })}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                {row.paid ? null : (
                  <button
                    type="button"
                    onClick={() => patch(row, { paid: true })}
                    className="whitespace-nowrap rounded-lg border border-emerald-200 px-3 py-2 text-[12.5px] font-semibold text-emerald-700"
                  >
                    Mark paid
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11.5px] text-slate-400">
                Booked {formatDate(row.createdAt)}
              </p>
            </td>
          </tr>
        )}
      />
    </PageShell>
  );
};

export default SharedTaxiBookings;
