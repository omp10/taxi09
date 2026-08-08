import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, GraduationCap, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import contentApi from '../../services/contentApi';

/**
 * The internship programme: tracks people apply to, the offline courses and
 * their certificates, the applications that come in, and the certificates
 * issued from them.
 *
 * Certificates are not created here directly - they are earned by marking an
 * application completed and then issuing, which is the only path the server
 * allows.
 */

const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-amber-400';

const TABS = [
  { key: 'tracks', label: 'Internship Tracks' },
  { key: 'courses', label: 'Courses' },
  { key: 'applications', label: 'Applications' },
  { key: 'certificates', label: 'Certificates' },
];

const APPLICATION_STATUSES = [
  'applied', 'shortlisted', 'interview', 'offered', 'enrolled', 'completed', 'rejected',
];

const STATUS_TONE = {
  applied: 'bg-slate-100 text-slate-700',
  shortlisted: 'bg-sky-50 text-sky-700',
  interview: 'bg-violet-50 text-violet-700',
  offered: 'bg-amber-50 text-amber-700',
  enrolled: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-50 text-red-600',
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Field = ({ label, hint, children, wide }) => (
  <label className={wide ? 'col-span-3' : ''}>
    <span className="mb-1.5 block text-[12px] font-bold text-slate-800">{label}</span>
    {children}
    {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
  </label>
);

const emptyTrack = {
  title: '', summary: '', description: '', image: '', durationLabel: '',
  minMonths: '', maxMonths: '', skills: '', seats: '', stipend: '', sortOrder: 0, active: true,
};

const emptyCourse = {
  title: '', summary: '', image: '', mode: 'offline', venue: '', city: '',
  startDate: '', endDate: '', seats: '', lessons: '', durationLabel: '', syllabus: '',
  price: '', oldPrice: '', rating: '', ratingCount: '', badge: '',
  awardsCertificate: true, certificateTitle: '', sortOrder: 0, active: true,
};

const InternshipAdmin = () => {
  const [tab, setTab] = useState('tracks');
  const [tracks, setTracks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // `editing` holds either 'new' plus a blank form, or the row being changed.
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTrack);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search.trim()) params.set('search', search.trim());
    const query = params.toString();

    Promise.allSettled([
      contentApi.listInternshipTracks(),
      contentApi.listAdminCourses(),
      contentApi.listInternshipApplications(query ? `?${query}` : ''),
      contentApi.listCertificates(),
    ])
      .then(([t, c, a, cert]) => {
        if (t.status === 'fulfilled') setTracks(t.value?.results || []);
        if (c.status === 'fulfilled') setCourses(c.value?.results || []);
        if (a.status === 'fulfilled') setApplications(a.value?.results || []);
        if (cert.status === 'fulfilled') setCertificates(cert.value?.results || []);
      })
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const openTrack = (row) => {
    setEditing(row ? { kind: 'track', id: row._id } : { kind: 'track', id: null });
    setForm(row ? { ...emptyTrack, ...row, skills: (row.skills || []).join(', ') } : emptyTrack);
  };

  const openCourse = (row) => {
    setEditing(row ? { kind: 'course', id: row._id } : { kind: 'course', id: null });
    setForm(row ? { ...emptyCourse, ...row, syllabus: (row.syllabus || []).join('\n') } : emptyCourse);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing.kind === 'track') await contentApi.saveInternshipTrack(editing.id, form);
      else await contentApi.saveCourse(editing.id, form);

      toast.success(editing.id ? 'Saved' : 'Created');
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (kind, row) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    try {
      if (kind === 'track') await contentApi.deleteInternshipTrack(row._id);
      else await contentApi.deleteCourse(row._id);
      toast.success('Deleted');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not delete');
    }
  };

  const setApplicationStatus = async (row, next) => {
    try {
      await contentApi.updateInternshipApplication(row._id, { status: next });
      toast.success('Application updated');
      load();
    } catch (error) {
      toast.error(error.message || 'Update failed');
    }
  };

  const issue = async (row) => {
    try {
      const certificate = await contentApi.issueCertificate(row._id);
      toast.success(`Certificate ${certificate?.certificateNumber} issued`);
      load();
    } catch (error) {
      // The server refuses anything that is not completed; surface its reason.
      toast.error(error.message || 'Could not issue the certificate');
    }
  };

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const toggle = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }));

  const pending = applications.filter((a) => a.status === 'applied').length;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-black text-slate-900">
            <GraduationCap size={20} className="text-amber-500" /> Internship Programme
          </h1>
          <p className="text-[13px] text-slate-500">
            Tracks, offline courses, applications and certificates
            {pending > 0 ? ` · ${pending} new application${pending === 1 ? '' : 's'}` : ''}
          </p>
        </div>

        {tab === 'tracks' || tab === 'courses' ? (
          <button
            onClick={() => (tab === 'tracks' ? openTrack(null) : openCourse(null))}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-[13px] font-bold text-white"
          >
            <Plus size={15} /> {tab === 'tracks' ? 'Add track' : 'Add course'}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((item) => {
          const count = { tracks, courses, applications, certificates }[item.key].length;
          return (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`-mb-px border-b-2 px-3 pb-2.5 text-[13px] font-bold transition-colors ${
                tab === item.key ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'
              }`}
            >
              {item.label} <span className="text-[11px] text-slate-400">({count})</span>
            </button>
          );
        })}
      </div>

      {tab === 'applications' ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, name, phone, track…"
            className={`${input} w-64`}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${input} w-44`}>
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {tab === 'tracks' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>{['Track', 'Duration', 'Seats', 'Stipend', 'Skills', 'Live', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {tracks.map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-slate-900">{row.title}</p>
                      <p className="truncate text-[11.5px] text-slate-500">{row.summary}</p>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.durationLabel || '—'}</td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.seats || '—'}</td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.stipend ? money(row.stipend) : '—'}</td>
                    <td className="px-4 py-3 text-[11.5px] text-slate-600">{(row.skills || []).join(', ') || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${row.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {row.active ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openTrack(row)} className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600"><Pencil size={13} /></button>
                        <button onClick={() => remove('track', row)} className="rounded-lg bg-red-50 px-2 py-1 text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tracks.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No tracks yet. Add the first one.</td></tr>
                ) : null}
              </tbody>
            </table>
          ) : null}

          {tab === 'courses' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>{['Course', 'Mode', 'Where & when', 'Lessons', 'Price', 'Certificate', 'Live', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {courses.map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-semibold text-slate-900">{row.title}</p>
                      <p className="truncate text-[11.5px] text-slate-500">{row.summary}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold capitalize text-slate-600">{row.mode}</span>
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-slate-600">
                      {row.venue || '—'}
                      <span className="block text-slate-500">
                        {row.startDate ? `${row.startDate}${row.endDate ? ` → ${row.endDate}` : ''}` : 'No dates set'}
                        {row.seats ? ` · ${row.seats} seats` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.lessons || '—'}</td>
                    <td className="px-4 py-3 text-[12.5px] font-bold text-slate-900">{money(row.price)}</td>
                    <td className="px-4 py-3 text-[11.5px]">
                      {row.awardsCertificate ? (
                        <span className="text-emerald-700">{row.certificateTitle || 'Yes'}</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${row.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {row.active ? 'Live' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openCourse(row)} className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600"><Pencil size={13} /></button>
                        <button onClick={() => remove('course', row)} className="rounded-lg bg-red-50 px-2 py-1 text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No courses yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          ) : null}

          {tab === 'applications' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>{['Reference', 'Applicant', 'Applied for', 'Contact', 'Status', 'Applied', 'Certificate'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {applications.map((row) => {
                  const certificate = certificates.find((c) => String(c.applicationId) === String(row._id));

                  return (
                    <tr key={row._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-[12.5px] font-bold text-slate-900">{row.reference}</td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-semibold text-slate-900">{row.fullName}</p>
                        <p className="text-[11.5px] text-slate-500">{[row.college, row.city].filter(Boolean).join(' · ')}</p>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.trackTitle || row.courseTitle}</td>
                      <td className="px-4 py-3 text-[11.5px] text-slate-600">
                        {row.phone}
                        {row.email ? <span className="block text-slate-500">{row.email}</span> : null}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.status}
                          onChange={(e) => setApplicationStatus(row, e.target.value)}
                          className={`rounded-lg px-2 py-1 text-[12px] font-bold capitalize outline-none ${STATUS_TONE[row.status] || ''}`}
                        >
                          {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-500">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3">
                        {certificate ? (
                          <span className="flex items-center gap-1 text-[11.5px] font-bold text-emerald-700">
                            <Award size={13} /> {certificate.certificateNumber}
                          </span>
                        ) : (
                          <button
                            onClick={() => issue(row)}
                            disabled={row.status !== 'completed'}
                            title={row.status === 'completed' ? 'Issue certificate' : 'Mark the application completed first'}
                            className="rounded-lg bg-amber-50 px-2 py-1 text-[11.5px] font-bold text-amber-700 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            Issue
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {applications.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No applications yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          ) : null}

          {tab === 'certificates' ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>{['Number', 'Recipient', 'Awarded for', 'Type', 'Issued'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {certificates.map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-[12.5px] font-bold text-slate-900">{row.certificateNumber}</td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.recipientName}</td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">{row.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold capitalize text-slate-600">{row.kind}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-slate-500">{formatDate(row.issuedAt)}</td>
                  </tr>
                ))}
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      None issued yet. Mark an application completed, then issue its certificate.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      {/* Track / course editor */}
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <form onSubmit={save} className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">
                {editing.id ? 'Edit' : 'Add'} {editing.kind === 'track' ? 'internship track' : 'course'}
              </h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <Field label="Title *" wide>
                <input className={input} value={form.title} onChange={set('title')} required />
              </Field>
              <Field label="Summary" wide hint="One line, shown on the card">
                <input className={input} value={form.summary} onChange={set('summary')} />
              </Field>
              <Field label="Image URL" wide>
                <input className={input} value={form.image} onChange={set('image')} />
              </Field>

              {editing.kind === 'track' ? (
                <>
                  <Field label="Duration label" hint="e.g. 2 – 3 Months">
                    <input className={input} value={form.durationLabel} onChange={set('durationLabel')} />
                  </Field>
                  <Field label="Seats">
                    <input type="number" min="0" className={input} value={form.seats} onChange={set('seats')} />
                  </Field>
                  <Field label="Stipend / month (₹)">
                    <input type="number" min="0" className={input} value={form.stipend} onChange={set('stipend')} />
                  </Field>
                  <Field label="Skills" wide hint="Comma separated">
                    <input className={input} value={form.skills} onChange={set('skills')} />
                  </Field>
                  <Field label="Description" wide>
                    <textarea rows={4} className={input} value={form.description} onChange={set('description')} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Mode">
                    <select className={input} value={form.mode} onChange={set('mode')}>
                      {['offline', 'online', 'hybrid'].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <Field label="Venue" hint="Where the offline class runs">
                    <input className={input} value={form.venue} onChange={set('venue')} />
                  </Field>
                  <Field label="City">
                    <input className={input} value={form.city} onChange={set('city')} />
                  </Field>
                  <Field label="Start date">
                    <input type="date" className={input} value={form.startDate} onChange={set('startDate')} />
                  </Field>
                  <Field label="End date">
                    <input type="date" className={input} value={form.endDate} onChange={set('endDate')} />
                  </Field>
                  <Field label="Seats">
                    <input type="number" min="0" className={input} value={form.seats} onChange={set('seats')} />
                  </Field>
                  <Field label="Lessons">
                    <input type="number" min="0" className={input} value={form.lessons} onChange={set('lessons')} />
                  </Field>
                  <Field label="Duration label" hint="e.g. 4 weeks">
                    <input className={input} value={form.durationLabel} onChange={set('durationLabel')} />
                  </Field>
                  <Field label="Badge" hint="Bestseller, New…">
                    <input className={input} value={form.badge} onChange={set('badge')} />
                  </Field>
                  <Field label="Price (₹) *">
                    <input type="number" min="0" className={input} value={form.price} onChange={set('price')} required />
                  </Field>
                  <Field label="Strike-through price (₹)">
                    <input type="number" min="0" className={input} value={form.oldPrice} onChange={set('oldPrice')} />
                  </Field>
                  <Field label="Rating" hint="0 – 5">
                    <input type="number" step="0.1" min="0" max="5" className={input} value={form.rating} onChange={set('rating')} />
                  </Field>
                  <Field label="Syllabus" wide hint="One item per line">
                    <textarea rows={4} className={input} value={form.syllabus} onChange={set('syllabus')} />
                  </Field>

                  <Field label="Certificate title" wide hint="Printed on the certificate this course awards">
                    <input
                      className={input}
                      value={form.certificateTitle}
                      onChange={set('certificateTitle')}
                      disabled={!form.awardsCertificate}
                      placeholder={form.awardsCertificate ? 'Certified Travel & Tourism Professional' : 'This course awards no certificate'}
                    />
                  </Field>
                  <label className="col-span-3 flex items-center gap-2">
                    <input type="checkbox" checked={form.awardsCertificate} onChange={toggle('awardsCertificate')} />
                    <span className="text-[12.5px] font-bold text-slate-800">This course awards a certificate</span>
                  </label>
                </>
              )}

              <Field label="Sort order" hint="Lower shows first">
                <input type="number" className={input} value={form.sortOrder} onChange={set('sortOrder')} />
              </Field>
              <label className="col-span-2 mt-6 flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={toggle('active')} />
                <span className="text-[12.5px] font-bold text-slate-800">Show on the internship page</span>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-bold text-slate-600">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default InternshipAdmin;
