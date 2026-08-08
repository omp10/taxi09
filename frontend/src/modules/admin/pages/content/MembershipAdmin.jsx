import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Crown, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import contentApi from '../../services/contentApi';

/**
 * Membership tiers and the memberships sold against them.
 *
 * Tiers are entirely admin-curated: name, price, duration, discount and the
 * benefit lines shown on the plan card all come from here.
 */

const input =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-amber-400';

const THEMES = [
  { value: 'gold', label: 'Gold (amber card)' },
  { value: 'silver', label: 'Platinum (light grey card)' },
  { value: 'black', label: 'Black (dark card)' },
];

const emptyPlan = {
  name: '',
  tagline: 'MEMBER',
  discountPercent: 10,
  price: '',
  oldPrice: '',
  durationMonths: 3,
  theme: 'gold',
  badge: '',
  sortOrder: 0,
  benefits: '',
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Benefits are edited as one "Title: subtitle" per line - far quicker than a row editor. */
const benefitsToText = (benefits = []) =>
  benefits.map((b) => (b.subtitle ? `${b.title}: ${b.subtitle}` : b.title)).join('\n');

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-1 block text-[12px] font-semibold text-slate-700">{label}</span>
    {children}
    {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
  </label>
);

const MembershipAdmin = () => {
  const [tab, setTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPlan);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([contentApi.listMembershipPlans(), contentApi.listMemberships()])
      .then(([planData, memberData]) => {
        setPlans(planData?.results || []);
        setMembers(memberData?.results || []);
      })
      .catch((error) => toast.error(error.message || 'Could not load memberships'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openNew = () => {
    setForm(emptyPlan);
    setEditing('new');
  };

  const openEdit = (plan) => {
    setForm({
      ...emptyPlan,
      ...plan,
      price: plan.price ?? '',
      oldPrice: plan.oldPrice ?? '',
      benefits: benefitsToText(plan.benefits),
    });
    setEditing(plan._id);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, benefits: form.benefits };
      if (editing === 'new') await contentApi.createMembershipPlan(body);
      else await contentApi.updateMembershipPlan(editing, body);

      toast.success(editing === 'new' ? 'Plan created' : 'Plan updated');
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message || 'Could not save the plan');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (plan) => {
    try {
      await contentApi.toggleMembershipPlan(plan._id);
      load();
    } catch (error) {
      toast.error(error.message || 'Could not update the plan');
    }
  };

  const remove = async (plan) => {
    // Existing members keep their purchased membership - it snapshots the plan.
    if (!window.confirm(`Delete the ${plan.name} tier? Members who already bought it keep their benefits.`)) return;
    try {
      await contentApi.deleteMembershipPlan(plan._id);
      toast.success('Plan deleted');
      load();
    } catch (error) {
      toast.error(error.message || 'Could not delete the plan');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-black text-slate-900">
            <Crown size={20} className="text-amber-500" /> Membership
          </h1>
          <p className="text-[13px] text-slate-500">Tiers you offer, and the memberships people have bought</p>
        </div>
        {tab === 'plans' ? (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-[13px] font-bold text-slate-900 hover:bg-amber-300"
          >
            <Plus size={16} /> Add tier
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        {[
          { key: 'plans', label: `Tiers (${plans.length})` },
          { key: 'members', label: `Members (${members.length})` },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-xl px-4 py-2 text-[13px] font-bold ${
              tab === item.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : tab === 'plans' ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`rounded-2xl border p-5 ${
                plan.active ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[17px] font-black text-slate-900">{plan.name}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{plan.tagline}</p>
                </div>
                <span className="rounded-lg bg-amber-100 px-2 py-1 text-[12px] font-black text-amber-700">
                  {plan.discountPercent}% OFF
                </span>
              </div>

              <p className="mt-3 text-[19px] font-black text-slate-900">
                {money(plan.price)}
                <span className="text-[12px] font-semibold text-slate-500"> / {plan.durationMonths} months</span>
              </p>
              {plan.oldPrice > plan.price ? (
                <p className="text-[12px] text-slate-400 line-through">{money(plan.oldPrice)}</p>
              ) : null}

              <ul className="mt-3 space-y-1">
                {(plan.benefits || []).map((benefit) => (
                  <li key={benefit.title} className="text-[12.5px] text-slate-600">
                    <span className="font-semibold text-slate-800">{benefit.title}</span>
                    {benefit.subtitle ? ` · ${benefit.subtitle}` : ''}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => toggle(plan)}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold ${
                    plan.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {plan.active ? 'Active' : 'Hidden'}
                </button>
                <button
                  onClick={() => openEdit(plan)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-bold text-slate-700"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => remove(plan)}
                  className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[12px] font-bold text-red-600"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}

          {plans.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-400">
              No tiers yet. Add the first one.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Reference', 'Member', 'Tier', 'Amount', 'Payment', 'Valid until', 'Bought'].map((head) => (
                  <th key={head} className="px-4 py-3 font-bold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((row) => (
                <tr key={row._id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-[12.5px] font-bold text-slate-900">{row.bookingReference}</td>
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-slate-800">{row.userId?.name || '—'}</p>
                    <p className="text-[11.5px] text-slate-500">{row.userId?.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] font-semibold text-slate-700">
                    {row.planName} · {row.discountPercent}%
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-slate-900">{money(row.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold capitalize ${
                        row.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : row.paymentStatus === 'failed'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-slate-700">{formatDate(row.expiresAt)}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{formatDate(row.createdAt)}</td>
                </tr>
              ))}
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Nobody has bought a membership yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <form onSubmit={submit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">
                {editing === 'new' ? 'Add tier' : 'Edit tier'}
              </h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Tier name *">
                <input
                  className={input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Tagline" hint="Shown under the name on the card">
                <input className={input} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </Field>

              <Field label="Price (₹) *" hint="What the member is charged, GST included">
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </Field>
              <Field label="Strike-through price (₹)">
                <input
                  type="number"
                  min="0"
                  className={input}
                  value={form.oldPrice}
                  onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                />
              </Field>

              <Field label="Duration (months) *">
                <input
                  type="number"
                  min="1"
                  className={input}
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                  required
                />
              </Field>
              <Field label="Discount on bookings (%)" hint="The headline benefit">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={input}
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                />
              </Field>

              <Field label="Card theme">
                <select className={input} value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
                  {THEMES.map((theme) => (
                    <option key={theme.value} value={theme.value}>{theme.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Sort order" hint="Lowest first">
                <input
                  type="number"
                  className={input}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </Field>

              <div className="col-span-2">
                <Field label="Benefits" hint="One per line, as “Title: subtitle” — e.g. Priority Booking: Faster confirmations">
                  <textarea
                    rows={5}
                    className={input}
                    value={form.benefits}
                    onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-600">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2.5 text-[13px] font-bold text-slate-900 disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save tier
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default MembershipAdmin;
