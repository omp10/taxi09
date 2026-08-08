import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, ChevronLeft, ChevronRight, ImagePlus, Loader2, Save, Trash2, X } from 'lucide-react';
import { adminService } from '../services/adminService';

/**
 * A numbered, multi-step editor.
 *
 * Long content forms - a hotel, a package, a rental vehicle - were one endless
 * column. Splitting them into steps keeps each screen short, and lets a step
 * refuse to advance while something required on it is still empty, instead of
 * failing at the very bottom after everything has been filled in.
 *
 * Every step stays mounted (hidden rather than unmounted), so nothing typed on
 * step one is lost by looking at step three, and the browser can still surface
 * its own validation on fields that are out of view.
 */

export const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-amber-400';

export const Field = ({ label, hint, children, span = 1 }) => (
  <label className={span === 3 ? 'col-span-3' : span === 2 ? 'col-span-2' : ''}>
    <span className="mb-1.5 block text-[12px] font-bold text-slate-800">{label}</span>
    {children}
    {hint ? <span className="mt-1 block text-[11px] text-slate-500">{hint}</span> : null}
  </label>
);

/* ----------------------------------------------------------------- images */

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads a file and hands back the hosted URL. */
const uploadOne = async (file) => {
  if (file.size > MAX_BYTES) {
    throw new Error(`${file.name} is over 5MB`);
  }
  const response = await adminService.uploadImage(await readAsDataUrl(file));
  const url = response?.data?.url || response?.data?.secure_url || response?.url;
  if (!url) throw new Error('Upload did not return a URL');
  return url;
};

/**
 * One image. Accepts a file or a pasted URL, because existing rows already hold
 * URLs and retyping them would be worse than keeping the field.
 */
export const ImageField = ({ label, hint, value, onChange, span = 1 }) => {
  const [busy, setBusy] = useState(false);
  const inputId = useMemo(() => `img-${Math.random().toString(36).slice(2)}`, []);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    try {
      onChange(await uploadOne(file));
    } catch (error) {
      toast.error(error.message || 'Could not upload that image');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} hint={hint} span={span}>
      <div className="flex gap-2">
        <label
          htmlFor={inputId}
          className="flex h-[70px] w-[104px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-50"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin text-slate-400" />
          ) : value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={17} className="text-slate-400" />
          )}
        </label>
        <input id={inputId} type="file" accept="image/*" onChange={pick} className="hidden" />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <input
            className={inputClass}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Upload, or paste an image URL"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="self-start text-[11.5px] font-bold text-red-600"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </Field>
  );
};

/** Many images. Same upload, but appends and allows several at once. */
export const GalleryField = ({ label, hint, value = [], onChange, span = 3 }) => {
  const [busy, setBusy] = useState(false);
  const inputId = useMemo(() => `gal-${Math.random().toString(36).slice(2)}`, []);
  const images = Array.isArray(value) ? value : [];

  const pick = async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    if (!files.length) return;

    setBusy(true);
    try {
      const urls = [];
      for (const file of files) {
        // Sequential on purpose: the upload endpoint takes one image per call.
        urls.push(await uploadOne(file));
      }
      onChange([...images, ...urls]);
    } catch (error) {
      toast.error(error.message || 'Could not upload those images');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} hint={hint} span={span}>
      <div className="flex flex-wrap gap-2">
        {images.map((url, index) => (
          <span key={`${url}-${index}`} className="group relative h-[70px] w-[104px] overflow-hidden rounded-lg border border-slate-200">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              aria-label="Remove image"
              className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 size={11} />
            </button>
          </span>
        ))}

        <label
          htmlFor={inputId}
          className="flex h-[70px] w-[104px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <ImagePlus size={17} className="text-slate-400" />}
        </label>
        <input id={inputId} type="file" accept="image/*" multiple onChange={pick} className="hidden" />
      </div>
    </Field>
  );
};

/* ------------------------------------------------------------------ steps */

/**
 * @param steps  [{ title, hint, render, isComplete }] - isComplete(form) gates Next
 * @param onSubmit  called from the final step
 */
export const FormWizard = ({ title, steps, onSubmit, onClose, saving, submitLabel = 'Save' }) => {
  const [step, setStep] = useState(0);
  const last = step === steps.length - 1;
  const current = steps[step];

  const blocked = current?.isComplete && !current.isComplete();

  const next = () => {
    if (blocked) {
      toast.error(current.incompleteMessage || 'Fill in the required fields on this step first');
      return;
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <form
        onSubmit={(e) => { e.preventDefault(); if (last) onSubmit(e); else next(); }}
        className="w-full max-w-4xl rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-[18px] font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Numbered steps; a completed one can be jumped back to */}
        <div className="flex flex-wrap gap-1 border-b border-slate-100 px-6 py-3">
          {steps.map((item, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => index <= step && setStep(index)}
                disabled={index > step}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-colors ${
                  active ? 'bg-amber-50 text-amber-700'
                    : done ? 'text-emerald-700 hover:bg-slate-50'
                    : 'text-slate-400'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  active ? 'bg-amber-500 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {done ? <Check size={11} /> : index + 1}
                </span>
                {item.title}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-5">
          {current?.hint ? <p className="mb-4 text-[12.5px] text-slate-500">{current.hint}</p> : null}

          {/* Kept mounted so nothing typed earlier is lost, and so required
              fields on other steps still block the browser's own submit. */}
          {steps.map((item, index) => (
            <div key={item.title} className={index === step ? 'grid grid-cols-3 gap-4' : 'hidden'}>
              {item.render()}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 disabled:opacity-40"
          >
            <ChevronLeft size={15} /> Back
          </button>

          <span className="text-[12px] text-slate-500">Step {step + 1} of {steps.length}</span>

          {last ? (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {submitLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-bold text-white"
            >
              Next <ChevronRight size={15} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormWizard;
