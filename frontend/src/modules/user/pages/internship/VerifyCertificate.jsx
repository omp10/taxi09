import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Loader2, Search, ShieldAlert } from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';

/**
 * Public certificate check.
 *
 * Anyone holding a certificate number can confirm it is genuine without an
 * account, which is the point of printing the number on it. The endpoint
 * returns only what belongs on a certificate - no contact details.
 */

const VerifyCertificate = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [number, setNumber] = useState(params.get('number') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const check = async (e) => {
    e.preventDefault();
    const value = number.trim().toUpperCase();
    if (!value) return;

    setChecking(true);
    setResult(null);
    setError('');

    try {
      const response = await api.get(`/users/certificates/verify/${encodeURIComponent(value)}`);
      setResult(response?.data || null);
    } catch (requestError) {
      setError(requestError.message || 'No certificate with that number');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf8] pb-16">
      <div className="bg-gradient-to-b from-[#FFD400] to-[#F5B700] px-6 pb-10 pt-5">
        <div className="mx-auto flex max-w-2xl items-start gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="mt-1 active:scale-95">
            <ArrowLeft size={22} strokeWidth={2.6} />
          </button>
          <div>
            <h1 className="text-[24px] font-black leading-tight text-slate-900">Verify a Certificate</h1>
            <p className="text-[14px] font-semibold text-slate-700">
              Check that a Taxi09 certificate is genuine
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-5 max-w-2xl px-6">
        <form onSubmit={check} className="rounded-2xl border border-slate-100 bg-white p-5">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-bold text-slate-800">Certificate number</span>
            <div className="flex gap-2">
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="TAXI09-CERT-2026-00001"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-[15px] uppercase outline-none focus:border-[#F5B700]"
              />
              <button
                type="submit"
                disabled={checking || !number.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-[14.5px] font-black text-white disabled:opacity-50"
              >
                {checking ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Check
              </button>
            </div>
          </label>

          {result ? (
            <div
              className={`mt-5 rounded-2xl border p-4 ${
                result.revoked ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
              }`}
            >
              {result.revoked ? (
                <p className="flex items-center gap-2 text-[15.5px] font-black text-red-700">
                  <ShieldAlert size={17} /> This certificate has been revoked
                </p>
              ) : (
                <p className="flex items-center gap-2 text-[15.5px] font-black text-emerald-800">
                  <BadgeCheck size={17} /> Genuine certificate
                </p>
              )}

              <dl className="mt-3 space-y-1.5 text-[14px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Awarded to</dt>
                  <dd className="font-bold text-slate-900">{result.recipientName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">For</dt>
                  <dd className="text-right font-bold text-slate-900">{result.title}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Type</dt>
                  <dd className="font-bold capitalize text-slate-900">{result.kind}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Issued</dt>
                  <dd className="font-bold text-slate-900">
                    {new Date(result.issuedAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Number</dt>
                  <dd className="font-mono font-bold text-slate-900">{result.certificateNumber}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {error ? (
            <p className="mt-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[14.5px] font-semibold text-amber-800">
              <ShieldAlert size={16} className="shrink-0" /> {error}
            </p>
          ) : null}
        </form>

        <p className="mt-4 text-center text-[13.5px] text-slate-500">
          The number is printed on every certificate Taxi09 issues.
        </p>
      </div>
    </div>
  );
};

export default VerifyCertificate;
