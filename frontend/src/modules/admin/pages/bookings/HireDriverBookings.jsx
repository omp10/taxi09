import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import contentApi from '../../services/contentApi';
import { PageShell, StatusPill, Table } from './BookingTable';
import { formatDate, formatMoney, inputClass } from './bookingFormat';

/**
 * Engagements booked against a curated hire-driver profile.
 *
 * These are fulfilled by hand rather than dispatched, so this screen is the
 * working queue: ops moves a request through its lifecycle and marks it paid.
 * A booking is always created unpaid, so `paid` can only ever be set here.
 */

const STATUSES = ['requested', 'confirmed', 'active', 'completed', 'cancelled'];

const HireDriverBookings = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = useCallback(() => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';

    setLoading(true);
    contentApi
      .listHireDriverBookings(query)
      .then((data) => setRows(data?.results || []))
      .catch((error) => toast.error(error.message || 'Could not load driver bookings'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const patch = async (id, body) => {
    try {
      await contentApi.updateHireDriverBooking(id, body);
      toast.success('Booking updated');
      load();
    } catch (error) {
      toast.error(error.message || 'Update failed');
    }
  };

  // Surfaced because a request nobody has actioned is the thing this screen
  // exists to catch.
  const outstanding = useMemo(
    () => rows.filter((row) => row.status === 'requested').length,
    [rows],
  );

  return (
    <PageShell
      title="Driver Engagements"
      subtitle={
        outstanding
          ? `${outstanding} awaiting action`
          : 'Permanent and monthly drivers booked by customers'
      }
      count={rows.length}
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
        rows={rows}
        empty="No driver engagements yet"
        columns={['Reference', 'Driver', 'Plan', 'Customer', 'Amount', 'Status', 'Payment', 'Booked', 'Actions']}
        renderRow={(row) => (
          <tr key={row._id} className="border-b border-slate-100 last:border-0">
            <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold text-slate-900">
              {row.bookingReference}
            </td>
            <td className="px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-900">{row.hireDriverName || '—'}</p>
              <p className="text-[11.5px] text-slate-500">{row.vehicleName || 'No vehicle listed'}</p>
            </td>
            <td className="px-4 py-3 text-[13px] capitalize text-slate-700">{row.plan}</td>
            <td className="px-4 py-3">
              <p className="text-[13px] text-slate-800">{row.customerName || '—'}</p>
              <p className="text-[11.5px] text-slate-500">{row.customerPhone || ''}</p>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-slate-900">
              {formatMoney(row.totalAmount)}
            </td>
            <td className="px-4 py-3">
              <StatusPill value={row.status} />
            </td>
            <td className="px-4 py-3">
              <StatusPill value={row.paid ? 'paid' : 'pending'} />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-slate-500">
              {formatDate(row.createdAt)}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <select
                  className={inputClass}
                  value={row.status}
                  onChange={(event) => patch(row._id, { status: event.target.value })}
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
                    onClick={() => patch(row._id, { paid: true })}
                    className="whitespace-nowrap rounded-lg border border-emerald-200 px-3 py-2 text-[12.5px] font-semibold text-emerald-700"
                  >
                    Mark paid
                  </button>
                )}
              </div>
              {row.instructions ? (
                <p className="mt-1.5 max-w-[260px] text-[11.5px] italic text-slate-500">
                  “{row.instructions}”
                </p>
              ) : null}
            </td>
          </tr>
        )}
      />
    </PageShell>
  );
};

export default HireDriverBookings;
