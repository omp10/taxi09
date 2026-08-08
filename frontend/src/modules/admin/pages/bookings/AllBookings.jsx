import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import contentApi from '../../services/contentApi';
import { PageShell, ProductPill, StatusPill, Table } from './BookingTable';
import { formatDate, formatMoney, inputClass } from './bookingFormat';

/** Every booking across every product, newest first. */
const AllBookings = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    contentApi
      .listAllBookings()
      .then((data) => setRows(data?.results || []))
      .catch((error) => toast.error(error.message || 'Could not load bookings'))
      .finally(() => setLoading(false));
  }, []);

  // Only offer a filter for products that actually have bookings.
  const products = useMemo(() => {
    const counts = new Map();
    for (const row of rows) counts.set(row.product, (counts.get(row.product) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (product && row.product !== product) return false;
      if (!term) return true;
      return `${row.reference} ${row.title} ${row.subtitle} ${row.customer}`.toLowerCase().includes(term);
    });
  }, [rows, product, search]);

  const collected = useMemo(
    () => visible.filter((row) => row.paymentStatus === 'paid').reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [visible],
  );

  return (
    <PageShell
      title="All Bookings"
      subtitle={`Every product in one place · ${formatMoney(collected)} collected`}
      count={loading ? undefined : visible.length}
      toolbar={
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, customer, item…"
            className={`${inputClass} w-64`}
          />
          <select value={product} onChange={(e) => setProduct(e.target.value)} className={inputClass}>
            <option value="">All products</option>
            {products.map(([name, count]) => (
              <option key={name} value={name}>{`${name} (${count})`}</option>
            ))}
          </select>
        </div>
      }
    >
      <Table
        loading={loading}
        rows={visible}
        empty="No bookings yet."
        columns={['Product', 'Reference', 'Details', 'Customer', 'Amount', 'Payment', 'Status', 'Booked']}
        renderRow={(row) => (
          <tr key={`${row.product}-${row.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
            <td className="px-4 py-3">
              <ProductPill value={row.product} />
            </td>
            <td className="px-4 py-3 text-[12.5px] font-bold text-slate-900">{row.reference || '—'}</td>
            <td className="px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-900">{row.title || '—'}</p>
              {row.subtitle && <p className="text-[11.5px] text-slate-500">{row.subtitle}</p>}
            </td>
            <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.customer || '—'}</td>
            <td className="px-4 py-3 text-[13px] font-bold text-slate-900">{formatMoney(row.amount)}</td>
            <td className="px-4 py-3"><StatusPill value={row.paymentStatus} /></td>
            <td className="px-4 py-3"><StatusPill value={row.status} /></td>
            <td className="px-4 py-3 text-[12px] text-slate-500">{formatDate(row.createdAt)}</td>
          </tr>
        )}
      />
    </PageShell>
  );
};

export default AllBookings;
