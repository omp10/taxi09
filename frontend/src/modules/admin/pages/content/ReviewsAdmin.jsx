import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

/**
 * Moderation queue for customer reviews.
 *
 * Every review here was written by someone whose booking completed, so the
 * job is judging tone and spam, not authenticity. Nothing reaches the site
 * until it is published, and rejecting keeps the row - deleting it would free
 * the booking to be reviewed again.
 */

const unwrap = (response) =>
  response?.data?.data?.results || response?.data?.results || response?.results || [];

const TABS = [
  { key: 'pending', label: 'Awaiting review' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
];

const TONE = {
  pending: 'bg-amber-50 text-amber-700',
  published: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-600',
};

const Stars = ({ rating }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={14}
        strokeWidth={0}
        className={n <= rating ? 'text-[#F5B700]' : 'text-slate-200'}
        fill="currentColor"
      />
    ))}
    <span className="ml-1 text-[12.5px] font-bold text-slate-700">{Number(rating).toFixed(1)}</span>
  </span>
);

const ReviewsAdmin = () => {
  const [tab, setTab] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [replyFor, setReplyFor] = useState('');
  const [replyText, setReplyText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReviews(unwrap(await adminService.getReviews({ status: tab })));
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (review, patch, successMessage) => {
    setBusyId(review.id);
    try {
      await adminService.moderateReview(review.id, patch);
      toast.success(successMessage);
      setReplyFor('');
      setReplyText('');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Could not update.');
    } finally {
      setBusyId('');
    }
  };

  const reject = (review) => {
    const note = window.prompt('Why is this being rejected? Only you see this.');
    // Cancelling the prompt returns null - that is a change of mind, not an
    // empty reason, so nothing happens.
    if (note === null) return;
    moderate(review, { status: 'rejected', moderationNote: note }, 'Review rejected');
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span>App Content</span><ChevronRight size={12} /><span className="text-slate-700">Reviews</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Customer reviews</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every review here comes from a completed booking, so this is about tone and spam, not
          authenticity. Nothing appears on the site until you publish it.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === item.key ? 'bg-[#2e3c78] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="rounded-[20px] bg-white p-8 text-sm text-slate-400">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="rounded-[20px] bg-white p-8 text-sm text-slate-400">
            {tab === 'pending' ? 'Nothing waiting. New reviews land here.' : `No ${tab} reviews.`}
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <Stars rating={review.rating} />
                    <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${TONE[review.status]}`}>
                      {review.status}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-indigo-700">
                      Verified booking
                    </span>
                  </div>
                  {review.title ? (
                    <p className="mt-2 text-[15px] font-bold text-slate-900">{review.title}</p>
                  ) : null}
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-700">{review.comment}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    {review.userName || 'Customer'} &middot; {review.bookingType} &middot;{' '}
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    }) : ''}
                  </p>

                  {review.response ? (
                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[13px] text-slate-700">
                      <span className="font-bold">Your reply: </span>{review.response}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {review.status !== 'published' ? (
                    <button
                      type="button"
                      disabled={busyId === review.id}
                      onClick={() => moderate(review, { status: 'published' }, 'Review published')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === review.id}
                      onClick={() => moderate(review, { status: 'pending' }, 'Review hidden')}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      Unpublish
                    </button>
                  )}
                  {review.status !== 'rejected' ? (
                    <button
                      type="button"
                      disabled={busyId === review.id}
                      onClick={() => reject(review)}
                      className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => { setReplyFor(replyFor === review.id ? '' : review.id); setReplyText(review.response || ''); }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    {review.response ? 'Edit reply' : 'Reply'}
                  </button>
                </div>
              </div>

              {replyFor === review.id ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="Reply publicly, under the review."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/60"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === review.id}
                      onClick={() => moderate(review, { response: replyText }, 'Reply saved')}
                      className="rounded-xl bg-[#2e3c78] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      Save reply
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyFor(''); setReplyText(''); }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsAdmin;
