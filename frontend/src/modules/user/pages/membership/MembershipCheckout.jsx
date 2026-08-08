import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Lock,
  Plane,
  Receipt,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { payForBooking } from '../../utils/bookingCheckout';

/**
 * Membership checkout.
 *
 * The figures shown are the server's quote, and the amount actually charged is
 * read from the stored membership when the order is raised - nothing on this
 * screen can influence the price.
 */

const BENEFIT_ICONS = {
  clock: Clock,
  'shield-check': ShieldCheck,
  tag: Tag,
  headset: Headset,
  plane: Plane,
  gift: Gift,
  check: Check,
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Row = ({ label, value, tone = '' }) => (
  <div className="flex items-center justify-between py-2">
    <span className={`text-[13px] ${tone || 'text-slate-700'}`}>{label}</span>
    <span className={`text-[13px] font-bold ${tone || 'text-slate-900'}`}>{value}</span>
  </div>
);

const MembershipCheckout = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [paying, setPaying] = useState(false);

  const membership = state?.membership;
  const plan = state?.plan;
  const quote = state?.quote;

  // Reached directly (a refresh, or a shared link) - there is nothing to pay for.
  useEffect(() => {
    if (!membership?._id) navigate('/taxi/user/membership', { replace: true });
  }, [membership, navigate]);

  if (!membership?._id) return null;

  const pay = async () => {
    setPaying(true);
    try {
      const paid = await payForBooking({
        kind: 'membership',
        bookingId: membership._id,
        name: 'Taxi09 Membership',
        description: `${membership.planName} · ${membership.durationMonths} months`,
      });

      // null means the customer closed the Razorpay window.
      if (!paid) return;

      toast.success(`${membership.planName} membership activated`);
      navigate('/taxi/user/membership', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Payment could not be completed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf8] pb-32 max-w-lg mx-auto">
      <div className="bg-gradient-to-b from-[#FFD400] to-[#F5B700] px-5 pb-8 pt-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="mt-1 active:scale-95">
            <ArrowLeft size={22} strokeWidth={2.6} />
          </button>
          <div>
            <h1 className="text-[21px] font-black leading-tight text-slate-900">Membership Checkout</h1>
            <p className="text-[12px] font-semibold text-slate-700">
              Secure your membership and enjoy exclusive benefits
            </p>
          </div>
        </div>
      </div>

      {/* Plan summary */}
      <div className="-mt-4 px-4">
        <div className="rounded-2xl bg-[#111318] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#F5B700]">
                <Crown size={22} className="text-[#F5B700]" fill="currentColor" />
              </span>
              <div>
                <span className="inline-block rounded-lg bg-[#F5B700] px-2 py-0.5 text-[10.5px] font-black text-slate-900">
                  {membership.planName} Member
                </span>
                <p className="mt-1.5 text-[18px] font-black text-white">{membership.planName} Membership</p>
                <p className="text-[12.5px] text-slate-300">{membership.durationMonths} Months Plan</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[22px] font-black text-[#F5B700]">{money(quote?.totalAmount ?? membership.totalAmount)}</p>
              {quote?.discount > 0 ? (
                <>
                  <p className="text-[12px] text-slate-400 line-through">{money(quote.listPrice)}</p>
                  <span className="mt-1 inline-block rounded-lg bg-[#F5B700] px-2 py-0.5 text-[10.5px] font-black text-slate-900">
                    Save {money(quote.discount)}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          {(plan?.benefits || []).length > 0 ? (
            <div className="mt-4 flex gap-4 overflow-x-auto border-t border-white/10 pt-3 no-scrollbar">
              {membership.discountPercent > 0 ? (
                <div className="flex shrink-0 items-start gap-1.5">
                  <Tag size={14} className="mt-0.5 text-[#F5B700]" />
                  <span>
                    <span className="block text-[12px] font-bold text-white">{membership.discountPercent}% OFF</span>
                    <span className="block text-[10.5px] text-slate-400">on all bookings</span>
                  </span>
                </div>
              ) : null}

              {plan.benefits.map((benefit) => {
                const Icon = BENEFIT_ICONS[benefit.icon] || Check;
                return (
                  <div key={benefit.title} className="flex shrink-0 items-start gap-1.5">
                    <Icon size={14} className="mt-0.5 text-[#F5B700]" />
                    <span>
                      <span className="block text-[12px] font-bold text-white">{benefit.title}</span>
                      <span className="block text-[10.5px] text-slate-400">{benefit.subtitle}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Price details */}
      <div className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-4">
        <p className="flex items-center gap-2 text-[15px] font-black text-slate-900">
          <Receipt size={17} className="text-[#F5B700]" /> Price Details
        </p>

        <div className="mt-2 divide-y divide-slate-50">
          <Row
            label={`Membership Fee (${membership.planName} – ${membership.durationMonths} Months)`}
            value={money(quote?.listPrice ?? membership.totalAmount)}
          />
          {quote?.discount > 0 ? (
            <Row
              label={`Discount (${quote.discountPercent}%)`}
              value={`− ${money(quote.discount)}`}
              tone="text-emerald-600"
            />
          ) : null}
          {quote?.gst > 0 ? (
            <Row label={`Taxes & Fees (${quote.gstRate}% GST, included)`} value={money(quote.gst)} />
          ) : null}
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
          <span className="text-[15px] font-black text-slate-900">Total Amount</span>
          <span className="text-[18px] font-black text-slate-900">
            {money(quote?.totalAmount ?? membership.totalAmount)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFF9E6] px-3 py-2.5">
          <ShieldCheck size={16} className="text-[#C79100]" />
          <span className="text-[12.5px] font-semibold text-slate-800">
            Your membership will be activated as soon as the payment succeeds
          </span>
        </div>
      </div>

      {/* Payment. Razorpay presents UPI, cards, net banking and wallets in its
          own sheet, so listing them again here would be a menu that does nothing. */}
      <div className="mx-4 mt-4 rounded-2xl border border-slate-100 bg-white p-4">
        <p className="text-[15px] font-black text-slate-900">Payment</p>
        <p className="mt-1 text-[12.5px] text-slate-500">
          UPI, credit and debit cards, net banking and wallets are all available on the next screen.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg items-center gap-3 border-t border-slate-100 bg-white px-4 py-3">
        <div className="flex-1">
          <p className="flex items-center gap-1.5 text-[12px] font-black text-slate-900">
            <ShieldCheck size={14} className="text-emerald-600" /> Safe & Secure Payment
          </p>
          <p className="text-[11px] text-slate-500">Your payment information is encrypted</p>
        </div>
        <button
          onClick={pay}
          disabled={paying}
          className="flex items-center gap-2 rounded-2xl bg-[#F5B700] px-5 py-3 text-[14px] font-black text-slate-900 disabled:opacity-60"
        >
          {paying ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
          Pay {money(quote?.totalAmount ?? membership.totalAmount)}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default MembershipCheckout;
