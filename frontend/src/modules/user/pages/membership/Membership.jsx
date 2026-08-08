import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Crown,
  Gift,
  Headset,
  Loader2,
  PiggyBank,
  Plane,
  Rocket,
  ShieldCheck,
  Star,
  Tag,
} from 'lucide-react';
import { userService } from '../../services/userService';

/**
 * Membership tiers.
 *
 * Every tier, price, benefit line and discount is admin-curated - this screen
 * renders whatever the API returns and has no built-in notion of "Gold".
 */

const BENEFIT_ICONS = {
  clock: Clock,
  'shield-check': ShieldCheck,
  tag: Tag,
  headset: Headset,
  plane: Plane,
  gift: Gift,
  star: Star,
  crown: Crown,
  check: Check,
};

const THEME = {
  gold: {
    card: 'bg-[#FFF9E6] border-[#F5B700]',
    name: 'text-slate-900',
    foot: 'bg-[#FFE9A8]',
    pill: 'bg-[#F5B700] text-slate-900',
    crown: 'text-[#F5B700]',
    body: 'text-slate-600',
  },
  silver: {
    card: 'bg-white border-slate-200',
    name: 'text-slate-900',
    foot: 'bg-slate-100',
    pill: 'bg-[#F5B700] text-slate-900',
    crown: 'text-slate-400',
    body: 'text-slate-600',
  },
  black: {
    card: 'bg-[#111318] border-[#111318]',
    name: 'text-[#F5B700]',
    foot: 'bg-black/40',
    pill: 'bg-[#F5B700] text-slate-900',
    crown: 'text-[#F5B700]',
    body: 'text-slate-300',
  },
};

const WHY = [
  { icon: PiggyBank, title: 'Save More', sub: 'on every booking' },
  { icon: Rocket, title: 'Priority Experience', sub: 'Faster bookings & top support' },
  { icon: ShieldCheck, title: 'Flexible & Easy', sub: 'Free cancellation & easy refunds' },
  { icon: Gift, title: 'Exclusive Offers', sub: 'Access to partner deals & cashback' },
  { icon: Star, title: 'Premium Comfort', sub: 'Better cars, top-rated partners & more' },
  { icon: Crown, title: 'Member Perks', sub: 'Special privileges just for you' },
];

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const PlanCard = ({ plan, selected, onSelect }) => {
  const theme = THEME[plan.theme] || THEME.gold;
  const dark = plan.theme === 'black';

  return (
    <button
      onClick={() => onSelect(plan)}
      className={`w-[248px] shrink-0 overflow-hidden rounded-2xl border-2 text-left transition-transform ${theme.card} ${
        selected ? 'scale-[1.01] ring-2 ring-[#F5B700] ring-offset-2' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-[19px] font-black leading-none ${theme.name}`}>{plan.name.toUpperCase()}</p>
            <p className={`mt-1 text-[10.5px] font-bold tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              {plan.tagline}
            </p>
          </div>
          <Crown size={22} className={theme.crown} fill="currentColor" />
        </div>

        {plan.discountPercent > 0 ? (
          <span className={`mt-3 inline-block rounded-md px-2 py-1 text-[13px] font-black ${theme.pill}`}>
            {plan.discountPercent}% OFF
          </span>
        ) : null}
        <p className={`mt-1.5 text-[12px] ${theme.body}`}>on all bookings</p>

        <div className={`my-3 h-px ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />

        <ul className="space-y-2.5">
          {(plan.benefits || []).map((benefit) => {
            const Icon = BENEFIT_ICONS[benefit.icon] || Check;
            return (
              <li key={benefit.title} className="flex gap-2.5">
                <Icon size={15} className={`mt-0.5 shrink-0 ${dark ? 'text-[#F5B700]' : 'text-slate-500'}`} />
                <span>
                  <span className={`block text-[12.5px] font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {benefit.title}
                  </span>
                  {benefit.subtitle ? (
                    <span className={`block text-[11px] ${theme.body}`}>{benefit.subtitle}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`px-4 py-3 ${theme.foot}`}>
        <p className={`text-[19px] font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
          {money(plan.price)}
          <span className="text-[12.5px] font-bold"> / {plan.durationMonths} Months</span>
        </p>
        {plan.oldPrice > plan.price ? (
          <p className={`text-[11.5px] ${theme.body}`}>
            <span className="line-through">{money(plan.oldPrice)}</span>{' '}
            <span className="font-bold">Save {money(plan.oldPrice - plan.price)}</span>
          </p>
        ) : null}
      </div>
    </button>
  );
};

const Membership = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [active, setActive] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([userService.getMembershipPlans(), userService.getMyMembership()])
      .then(([planResult, mineResult]) => {
        if (cancelled) return;

        const list =
          planResult.status === 'fulfilled' ? planResult.value?.data?.results || planResult.value?.results || [] : [];
        setPlans(list);
        setSelected(list[0] || null);

        if (mineResult.status === 'fulfilled') {
          setActive(mineResult.value?.data?.active || null);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, []);

  /* The comparison table is derived from the tiers themselves, so a new benefit
     an admin adds shows up here without a code change. */
  const comparison = useMemo(() => {
    const titles = [];
    plans.forEach((plan) =>
      (plan.benefits || []).forEach((benefit) => {
        if (!titles.includes(benefit.title)) titles.push(benefit.title);
      }),
    );
    return titles.map((title) => ({
      title,
      has: plans.map((plan) => (plan.benefits || []).some((b) => b.title === title)),
    }));
  }, [plans]);

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await userService.purchaseMembership(selected._id);
      const data = response?.data || response;
      navigate('/taxi/user/membership/checkout', {
        state: { membership: data.membership, plan: data.plan, quote: data.quote },
      });
    } catch (error) {
      toast.error(error.message || 'Could not start the purchase');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf8] pb-32 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#FFD400] to-[#F5B700] px-5 pb-8 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate(-1)} aria-label="Back" className="mt-1 active:scale-95">
              <ArrowLeft size={22} strokeWidth={2.6} />
            </button>
            <div>
              <h1 className="text-[22px] font-black leading-tight text-slate-900">Membership</h1>
              <p className="text-[12.5px] font-semibold text-slate-700">Choose a plan that suits you</p>
            </div>
          </div>

          {active ? (
            <span className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[12px] font-black text-slate-900">
              <Crown size={14} className="text-[#F5B700]" fill="currentColor" /> {active.planName} Member
            </span>
          ) : null}
        </div>
      </div>

      <div className="-mt-4 px-4">
        <div className="rounded-2xl bg-[#111318] p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#F5B700]">
              <Crown size={26} className="text-[#F5B700]" fill="currentColor" />
            </span>
            <div>
              <p className="text-[17px] font-black text-white">
                Go Premium with <span className="text-[#F5B700]">Taxi09</span>
              </p>
              <p className="text-[12.5px] text-slate-300">Exclusive benefits. More savings.</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : plans.length === 0 ? (
        <p className="px-6 py-16 text-center text-[13.5px] text-slate-500">
          No membership plans are on sale right now. Please check back soon.
        </p>
      ) : (
        <>
          {active ? (
            <div className="mx-4 mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[13.5px] font-black text-emerald-800">
                Your {active.planName} membership is active
              </p>
              <p className="text-[12px] text-emerald-700">
                {active.discountPercent}% off bookings until{' '}
                {new Date(active.expiresAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          ) : null}

          <h2 className="px-4 pb-3 pt-6 text-[16px] font-black text-slate-900">Choose Your Plan</h2>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
            {plans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                selected={selected?._id === plan._id}
                onSelect={setSelected}
              />
            ))}
          </div>

          <h2 className="px-4 pb-3 pt-7 text-[16px] font-black text-slate-900">Why Become a Member?</h2>
          <div className="grid grid-cols-2 gap-3 px-4">
            {WHY.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-white p-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF3CC]">
                  <item.icon size={17} className="text-[#C79100]" />
                </span>
                <p className="mt-2 text-[12.5px] font-black text-slate-900">{item.title}</p>
                <p className="text-[11px] text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>

          {comparison.length > 0 ? (
            <>
              <h2 className="px-4 pb-3 pt-7 text-[16px] font-black text-slate-900">Compare Plans</h2>
              <div className="mx-4 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2.5 text-[11.5px] font-bold text-slate-700">Benefits</th>
                      {plans.map((plan) => (
                        <th key={plan._id} className="px-3 py-2.5 text-center text-[11.5px] font-bold text-slate-700">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="px-3 py-2.5 text-[12px] text-slate-700">Discount on Bookings</td>
                      {plans.map((plan) => (
                        <td key={plan._id} className="px-3 py-2.5 text-center text-[12px] font-black text-slate-900">
                          {plan.discountPercent}%
                        </td>
                      ))}
                    </tr>
                    {comparison.map((row) => (
                      <tr key={row.title} className="border-t border-slate-100">
                        <td className="px-3 py-2.5 text-[12px] text-slate-700">{row.title}</td>
                        {row.has.map((has, index) => (
                          <td key={plans[index]._id} className="px-3 py-2.5 text-center">
                            {has ? (
                              <Check size={15} className="mx-auto text-emerald-600" strokeWidth={3} />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Sticky purchase bar */}
      {!loading && plans.length > 0 && !active ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg items-center gap-3 border-t border-slate-100 bg-white px-4 py-3">
          <div className="flex-1">
            <p className="flex items-center gap-1.5 text-[12px] font-black text-slate-900">
              <ShieldCheck size={14} className="text-emerald-600" /> 100% Secure Payment
            </p>
            <p className="text-[11px] text-slate-500">Safe & encrypted transactions</p>
          </div>
          <button
            onClick={buy}
            disabled={busy || !selected}
            className="flex items-center gap-2 rounded-2xl bg-[#F5B700] px-5 py-3 text-[14px] font-black text-slate-900 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Continue to Payment
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Membership;
