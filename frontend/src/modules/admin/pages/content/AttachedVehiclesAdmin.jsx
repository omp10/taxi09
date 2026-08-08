import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Car, ExternalLink, Loader2 } from 'lucide-react';
import contentApi from '../../services/contentApi';

/**
 * Cars owners have offered to the platform, and the approve / reject queue.
 *
 * Drafts never appear here - the server filters them out, since an unfinished
 * application is the owner's private workspace.
 */

const input =
  'rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-amber-400';

const STATUSES = ['submitted', 'under_review', 'approved', 'rejected'];

const TONE = {
  submitted: 'bg-amber-50 text-amber-700',
  under_review: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
};

const DOCUMENT_LABELS = {
  rcCertificate: 'RC', insurance: 'Insurance', puc: 'PUC',
  drivingLicense: 'License', aadhaar: 'Aadhaar', serviceRecords: 'Service records',
};

const PHOTO_LABELS = {
  front: 'Front', rear: 'Rear', left: 'Left', right: 'Right',
  odometer: 'Odometer', fuelLevel: 'Fuel', fitnessCertificate: 'Fitness', permit: 'Permit',
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Uploaded files as a row of links; the admin opens them to verify. */
const FileStrip = ({ files = {}, labels }) => {
  const present = Object.entries(labels).filter(([key]) => files?.[key]?.url);
  if (present.length === 0) return <span className="text-[11.5px] text-slate-400">None</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {present.map(([key, label]) => (
        <a
          key={key}
          href={files[key].url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-bold text-slate-700 hover:bg-slate-200"
        >
          {label} <ExternalLink size={9} />
        </a>
      ))}
    </div>
  );
};

const AttachedVehiclesAdmin = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    const query = params.toString();

    setLoading(true);
    contentApi
      .listAttachedVehicles(query ? `?${query}` : '')
      .then((data) => setRows(data?.results || []))
      .catch((error) => toast.error(error.message || 'Could not load applications'))
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const decide = async (row, nextStatus) => {
    // A rejection without a reason leaves the owner with nothing to act on.
    let reviewNote = '';
    if (nextStatus === 'rejected') {
      reviewNote = window.prompt('What needs fixing? This is shown to the owner.') || '';
      if (!reviewNote.trim()) return;
    }

    try {
      await contentApi.updateAttachedVehicle(row._id, { status: nextStatus, reviewNote });
      toast.success(`Application ${nextStatus}`);
      load();
    } catch (error) {
      toast.error(error.message || 'Could not update the application');
    }
  };

  return (
    <div className="p-6">
      <div>
        <h1 className="flex items-center gap-2 text-[20px] font-black text-slate-900">
          <Car size={20} className="text-amber-500" /> Attached Vehicles
        </h1>
        <p className="text-[13px] text-slate-500">Cars owners want to list, waiting on verification</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Reference, plate, brand, city…"
          className={`${input} w-64`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Reference', 'Vehicle', 'Owner', 'Fare', 'City', 'Status', 'Submitted', ''].map((head) => (
                  <th key={head} className="px-4 py-3 font-bold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <React.Fragment key={row._id}>
                  <tr
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/60"
                    onClick={() => setExpanded(expanded === row._id ? null : row._id)}
                  >
                    <td className="px-4 py-3 text-[12.5px] font-bold text-slate-900">{row.reference}</td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-slate-900">
                        {[row.brand, row.model, row.variant].filter(Boolean).join(' ')}
                      </p>
                      <p className="text-[11.5px] text-slate-500">
                        {row.registrationNumber} · {row.year} · {row.fuelType} · {row.transmission}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-slate-800">{row.userId?.name || '—'}</p>
                      <p className="text-[11.5px] text-slate-500">{row.userId?.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">
                      {money(row.dailyFare)}
                      <span className="block text-[11px] text-slate-500">dep. {money(row.securityDeposit)}</span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold capitalize ${TONE[row.status] || 'bg-slate-100 text-slate-600'}`}>
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{formatDate(row.submittedAt)}</td>
                    <td className="px-4 py-3 text-[11.5px] font-bold text-amber-600">
                      {expanded === row._id ? 'Hide' : 'Review'}
                    </td>
                  </tr>

                  {expanded === row._id ? (
                    <tr className="border-b border-slate-100 bg-slate-50/40">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Documents</p>
                            <FileStrip files={row.documents} labels={DOCUMENT_LABELS} />
                          </div>
                          <div>
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Photos</p>
                            <FileStrip files={row.photos} labels={PHOTO_LABELS} />
                          </div>
                        </div>

                        <p className="mt-3 text-[12px] text-slate-600">
                          <span className="font-bold">Availability:</span> {row.availability || '—'}
                          {row.preferredAreas?.length ? (
                            <> · <span className="font-bold">Areas:</span> {row.preferredAreas.join(', ')}</>
                          ) : null}
                        </p>

                        {row.reviewNote ? (
                          <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[12px] text-slate-700">
                            <span className="font-bold">Review note:</span> {row.reviewNote}
                          </p>
                        ) : null}

                        <div className="mt-3 flex gap-2">
                          {row.status !== 'under_review' && row.status !== 'approved' ? (
                            <button
                              onClick={() => decide(row, 'under_review')}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700"
                            >
                              Mark under review
                            </button>
                          ) : null}
                          {row.status !== 'approved' ? (
                            <button
                              onClick={() => decide(row, 'approved')}
                              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700"
                            >
                              Approve
                            </button>
                          ) : null}
                          {row.status !== 'rejected' ? (
                            <button
                              onClick={() => decide(row, 'rejected')}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-600"
                            >
                              Reject
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    No applications yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttachedVehiclesAdmin;
