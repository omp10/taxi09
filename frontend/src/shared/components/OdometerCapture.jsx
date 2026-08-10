import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, Gauge, Loader2 } from 'lucide-react';
import api from '../api/axiosInstance';

/**
 * Start-of-trip odometer capture, shared by the rider and driver apps.
 *
 * Both sides photograph the same odometer and type the same reading before the
 * trip can begin, so a distance dispute afterwards has two independent records
 * taken at the same moment. The server withholds the start PIN until both are
 * on file, which is why this sits ahead of the PIN step in both apps.
 *
 * Which side is being written is decided by the caller's token on the server -
 * `role` here only picks what to render.
 */

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatKm = (value) =>
  (Number.isFinite(Number(value)) ? Number(value) : 0).toLocaleString('en-IN');

const OdometerCapture = ({
  rideId,
  role,
  odometer,
  onRecorded,
  accentColor = '#f97316',
  className = '',
}) => {
  const fileInputRef = useRef(null);
  const [photo, setPhoto] = useState('');
  const [reading, setReading] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const mine = odometer?.[role];
  const theirs = odometer?.[role === 'user' ? 'driver' : 'user'];
  const counterpartLabel = role === 'user' ? 'Driver' : 'Passenger';

  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    try {
      setPhoto(await fileToDataUrl(file));
      setError('');
    } catch {
      setError('That photo could not be read. Try again.');
    }
  };

  const submit = async () => {
    const typed = String(reading).trim();
    const kilometres = Number(typed);

    // An empty field must not slip through as a zero reading - Number('') is 0.
    if (!typed || !Number.isFinite(kilometres) || kilometres < 0) {
      setError('Enter the reading shown on the odometer.');
      return;
    }

    if (!photo) {
      setError('Add a photo of the odometer.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await api.post(`/rides/${rideId}/odometer`, {
        readingKm: kilometres,
        imageDataUrl: photo,
      });
      onRecorded?.(response?.data?.data || response?.data || null);
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message
          || submitError.message
          || 'Could not save the reading. Try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const counterpartLine = theirs?.recorded
    ? `${counterpartLabel} recorded ${formatKm(theirs.readingKm)} km`
    : `Waiting for the ${counterpartLabel.toLowerCase()} to record theirs`;

  return (
    <div className={`rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
        >
          <Gauge size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Odometer</p>
          <p className="text-[14.5px] font-black text-slate-900">
            {mine?.recorded ? 'Reading saved' : 'Record before the trip starts'}
          </p>
        </div>
      </div>

      {mine?.recorded ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-3">
          {mine.imageUrl ? (
            <img src={mine.imageUrl} alt="Odometer" className="h-12 w-12 rounded-xl object-cover" />
          ) : null}
          <div className="min-w-0">
            <p className="text-[16.5px] font-black leading-none text-slate-900">{formatKm(mine.readingKm)} km</p>
            <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.14em] text-emerald-600">Your reading</p>
          </div>
          <CheckCircle2 size={18} className="ml-auto shrink-0 text-emerald-500" strokeWidth={2.5} />
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={pickPhoto}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-left active:scale-[0.99] transition-transform"
          >
            {photo ? (
              <img src={photo} alt="Odometer preview" className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400">
                <Camera size={18} strokeWidth={2.5} />
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[13.5px] font-black text-slate-900">
                {photo ? 'Photo added' : 'Take a photo'}
              </span>
              <span className="block text-[12.5px] font-semibold text-slate-400">
                {photo ? 'Tap to replace it' : 'Point the camera at the odometer'}
              </span>
            </span>
          </button>

          <label className="mt-3 block">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Reading in km</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={reading}
              onChange={(event) => setReading(event.target.value)}
              placeholder="41250"
              className="mt-1 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[17px] font-black text-slate-900 outline-none focus:border-slate-300"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[13.5px] font-black uppercase tracking-widest text-white transition-transform active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: accentColor }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" strokeWidth={2.5} /> : null}
            {saving ? 'Saving' : 'Save reading'}
          </button>
        </>
      )}

      {error ? (
        <p className="mt-2 text-center text-[13px] font-black uppercase tracking-wide text-red-500">{error}</p>
      ) : null}

      <p className={`mt-3 text-center text-[12.5px] font-bold ${theirs?.recorded ? 'text-emerald-600' : 'text-slate-400'}`}>
        {counterpartLine}
      </p>
    </div>
  );
};

export default OdometerCapture;
