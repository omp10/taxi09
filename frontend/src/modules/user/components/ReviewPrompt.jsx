import React, { useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axiosInstance';

/**
 * Asks for a review of a booking the customer has finished.
 *
 * Mounted against a single completed booking. It does not decide whether a
 * review is due - the caller does, because only the booking list knows the
 * status. Posting is what makes the review verifiable: the server re-checks
 * that this booking belongs to this account and has completed, so nothing
 * here can be forged by editing the request.
 *
 * Once submitted it collapses to a thank-you rather than unmounting, so the
 * customer gets confirmation instead of the form silently vanishing.
 */
const ReviewPrompt = ({ bookingId, bookingType = 'rental', vehicleName = '', onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 p-3">
        <p className="text-[13px] font-bold text-emerald-800">Thanks for the review</p>
        <p className="mt-0.5 text-[12px] font-medium text-emerald-700">
          It appears on the site once our team has read it.
        </p>
      </div>
    );
  }

  const submit = async () => {
    if (!rating) return toast.error('Pick a rating first');

    setSaving(true);
    try {
      await api.post('/users/reviews', {
        bookingId,
        bookingType,
        rating,
        comment: comment.trim(),
      });
      setDone(true);
      onSubmitted?.();
    } catch (error) {
      // 409 means this booking was already reviewed, which is not a failure
      // worth a red toast - it is the finished state, reached on a device that
      // did not see the first submission. Anything else is a real error and
      // the server's own reason is more useful than a generic one.
      if (error?.response?.status === 409) {
        setDone(true);
        return;
      }
      toast.error(error?.response?.data?.message || 'Could not send your review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-3">
      <p className="text-[13px] font-bold text-slate-900">
        How was {vehicleName || 'your trip'}?
      </p>
      <p className="mt-0.5 text-[12px] font-medium text-slate-500">
        Only people who completed a booking can review, so this counts.
      </p>

      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value > 1 ? 's' : ''}`}
            onClick={() => setRating(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5"
          >
            <Star
              size={24}
              strokeWidth={0}
              fill="currentColor"
              className={value <= (hovered || rating) ? 'text-[#F5B700]' : 'text-slate-200'}
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <>
          <textarea
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What went well, what could be better?"
            maxLength={2000}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-[#F5B700]"
          />
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="mt-2 w-full rounded-xl bg-[#F5B700] py-2.5 text-[13.5px] font-bold text-slate-950 disabled:opacity-60"
          >
            {saving ? 'Sending...' : 'Send review'}
          </button>
        </>
      )}
    </div>
  );
};

export default ReviewPrompt;
