import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Send, X } from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';

/**
 * Apply to an internship track or enrol on a course.
 *
 * Shared by both layouts: the form is identical on a phone and on a desktop,
 * and the server decides which field (trackId or courseId) the target maps to.
 */

const field =
  'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13.5px] outline-none focus:border-[#F5B700]';

const ApplyDialog = ({ target, onClose, onDone }) => {
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', city: '', college: '', qualification: '', message: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, [target.kind === 'course' ? 'courseId' : 'trackId']: target.id };
      const response = await api.post('/users/internship/apply', body);
      onDone(response?.data);
    } catch (error) {
      toast.error(error.message || 'Could not submit your application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/45 p-6">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-black text-slate-900">Apply</h2>
            <p className="text-[12.5px] text-slate-500">{target.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Full name *</span>
            <input className={field} value={form.fullName} onChange={set('fullName')} required />
          </label>
          <label>
            <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Phone *</span>
            <input className={field} value={form.phone} onChange={set('phone')} required />
          </label>
          <label>
            <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Email</span>
            <input type="email" className={field} value={form.email} onChange={set('email')} />
          </label>
          <label>
            <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">City</span>
            <input className={field} value={form.city} onChange={set('city')} />
          </label>
          <label>
            <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">College</span>
            <input className={field} value={form.college} onChange={set('college')} />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12.5px] font-bold text-slate-800">Why this track?</span>
            <textarea rows={3} className={field} value={form.message} onChange={set('message')} />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5B700] py-3 text-[14px] font-black text-slate-900 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit application
        </button>
      </form>
    </div>
  );
};

export default ApplyDialog;
