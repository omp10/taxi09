import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Car,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  Upload,
  Wallet,
} from 'lucide-react';
import { userService } from '../../services/userService';

/**
 * "Attach your car" - a five step application to list a vehicle.
 *
 * Each step is saved to the server as it is completed, so closing the app does
 * not lose the work. The server re-checks completeness on submit; the step gate
 * here is a convenience, not the guarantee.
 */

const STEPS = [
  { key: 'details', label: 'Vehicle Details', icon: Car },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'photos', label: 'Photos', icon: Camera },
  { key: 'review', label: 'Review', icon: Eye },
  { key: 'submit', label: 'Submit', icon: Send },
];

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Manual', 'Automatic'];
const AVAILABILITY = ['All Days', 'Weekdays only', 'Weekends only', 'Custom'];

const DOCUMENTS = [
  { key: 'rcCertificate', label: 'RC Certificate', hint: 'Front side of the RC book', required: true },
  { key: 'insurance', label: 'Insurance Certificate', hint: 'Valid insurance certificate', required: true },
  { key: 'puc', label: 'Pollution Under Control (PUC)', hint: 'Valid PUC certificate', required: true },
  { key: 'drivingLicense', label: 'Driving License', hint: 'Your valid driving license', required: true },
  { key: 'aadhaar', label: 'Aadhaar Card', hint: 'For verification', required: true },
  { key: 'serviceRecords', label: 'Warranty / Service Records', hint: 'Optional', required: false },
];

const PHOTOS = [
  { key: 'front', label: 'Front View', hint: 'Front of your vehicle' },
  { key: 'rear', label: 'Rear View', hint: 'Rear of your vehicle' },
  { key: 'left', label: 'Left Side View', hint: 'Left side of your vehicle' },
  { key: 'right', label: 'Right Side View', hint: 'Right side of your vehicle' },
  { key: 'odometer', label: 'Odometer Reading', hint: 'Clear photo of the odometer' },
  { key: 'fuelLevel', label: 'Fuel Level', hint: 'Current fuel level' },
];

const CERTIFICATES = [
  { key: 'fitnessCertificate', label: 'Fitness Certificate', hint: 'Valid fitness certificate' },
  { key: 'permit', label: 'Permit / Commercial License', hint: 'Valid permit or commercial licence' },
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const emptyForm = {
  brand: '', model: '', variant: '', year: '', fuelType: '', transmission: '',
  registrationNumber: '', dailyFare: '', securityDeposit: '', availability: '',
  city: '', preferredAreas: '',
};

const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] outline-none focus:border-[#F5B700]';
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Label = ({ children, required }) => (
  <span className="mb-1.5 block text-[14px] font-bold text-slate-800">
    {children} {required ? <span className="text-red-500">*</span> : null}
  </span>
);

const Section = ({ icon: Icon, title, children }) => (
  <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
    <p className="mb-3 flex items-center gap-2 text-[16.5px] font-black text-slate-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF3CC]">
        <Icon size={16} className="text-[#C79100]" />
      </span>
      {title}
    </p>
    {children}
  </div>
);

/** One upload slot. Reads the file as a data URL and hands it to Cloudinary. */
const UploadSlot = ({ slot, value, onUploaded, accept = 'image/*' }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('That file is over 5MB. Please pick a smaller one.');
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await userService.uploadImage(dataUrl);
      const url = response?.data?.url || response?.url;
      if (!url) throw new Error('Upload failed');

      onUploaded(slot.key, { url, fileName: file.name });
    } catch (error) {
      toast.error(error.message || 'Could not upload that file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF3CC]">
        <FileText size={17} className="text-[#C79100]" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-bold text-slate-900">
          {slot.label} {slot.required === false ? null : <span className="text-red-500">*</span>}
        </span>
        <span className="block truncate text-[13.5px] text-slate-500">{value?.fileName || slot.hint}</span>
      </span>

      <input ref={inputRef} type="file" accept={accept} onChange={pick} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-[13.5px] font-bold ${
          value?.url ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-600'
        }`}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : value?.url ? <Check size={14} /> : <Upload size={14} />}
        {busy ? 'Uploading' : value?.url ? 'Replace' : 'Upload'}
      </button>
    </div>
  );
};

const AttachCar = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [documents, setDocuments] = useState({});
  const [photos, setPhotos] = useState({});
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  /* Resume the most recent editable application, if there is one. */
  useEffect(() => {
    let cancelled = false;

    userService
      .listAttachedVehicles()
      .then((response) => {
        if (cancelled) return;
        const rows = response?.data?.data?.results ?? response?.data?.results ?? [];
        const draft = rows.find((row) => ['draft', 'rejected'].includes(row.status));
        if (!draft) return;

        setRecord(draft);
        setForm({
          ...emptyForm,
          ...Object.fromEntries(Object.keys(emptyForm).map((key) => [key, draft[key] ?? ''])),
          preferredAreas: (draft.preferredAreas || []).join(', '),
        });
        setDocuments(draft.documents || {});
        setPhotos(draft.photos || {});
        setStep(Math.min(3, Math.max(0, (draft.step || 1) - 1)));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, []);

  const persist = useCallback(
    async (extra = {}) => {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : undefined,
        dailyFare: form.dailyFare ? Number(form.dailyFare) : undefined,
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : undefined,
        documents,
        photos,
        ...extra,
      };

      const response = record?._id
        ? await userService.updateAttachedVehicle(record._id, payload)
        : await userService.createAttachedVehicle(payload);

      const saved = response?.data;
      setRecord(saved);
      return saved;
    },
    [form, documents, photos, record],
  );

  const missingOnStep = () => {
    if (step === 0) {
      const required = ['brand', 'model', 'variant', 'year', 'fuelType', 'transmission', 'registrationNumber', 'dailyFare', 'securityDeposit', 'availability', 'city'];
      return required.filter((key) => !String(form[key] || '').trim()).length;
    }
    if (step === 1) return DOCUMENTS.filter((d) => d.required !== false && !documents[d.key]?.url).length;
    if (step === 2) return [...PHOTOS, ...CERTIFICATES].filter((p) => !photos[p.key]?.url).length;
    return 0;
  };

  const next = async () => {
    const missing = missingOnStep();
    if (missing > 0) {
      toast.error(`${missing} required ${missing === 1 ? 'item is' : 'items are'} still missing`);
      return;
    }

    setSaving(true);
    try {
      await persist({ step: Math.min(5, step + 2) });
      setStep((current) => current + 1);
      window.scrollTo({ top: 0 });
    } catch (error) {
      toast.error(error.message || 'Could not save your progress');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const saved = record?._id ? record : await persist();
      const response = await userService.submitAttachedVehicle(saved._id);
      setRecord(response?.data);
      setStep(4);
      window.scrollTo({ top: 0 });
    } catch (error) {
      toast.error(error.message || 'Could not submit your application');
    } finally {
      setSaving(false);
    }
  };

  const setFile = (bucket) => (key, file) =>
    bucket === 'documents'
      ? setDocuments((prev) => ({ ...prev, [key]: file }))
      : setPhotos((prev) => ({ ...prev, [key]: file }));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf8]">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  const submitted = step === 4;

  return (
    <div className="min-h-screen bg-[#fffdf8] pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#FFD400] to-[#F5B700] px-5 pb-10 pt-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="mt-1 active:scale-95">
            <ArrowLeft size={22} strokeWidth={2.6} />
          </button>
          <div>
            <h1 className="text-[21px] font-black leading-tight text-slate-900">Attach Your Car</h1>
            <p className="text-[14px] font-semibold text-slate-700">
              {submitted ? 'Your request has been submitted' : 'List your vehicle and start earning'}
            </p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="-mt-6 px-4">
        <div className="flex items-start justify-between rounded-2xl bg-white px-3 py-4 shadow-sm">
          {STEPS.map((item, index) => {
            const done = index < step;
            const current = index === step;
            const Icon = item.icon;

            return (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full ${
                    current ? 'bg-[#F5B700]' : done ? 'bg-white ring-2 ring-[#F5B700]' : 'bg-slate-100'
                  }`}
                >
                  <Icon size={16} className={current ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'} />
                  {done ? (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F5B700]">
                      <Check size={10} strokeWidth={3.5} className="text-slate-900" />
                    </span>
                  ) : null}
                </span>
                <span className={`text-center text-[11.5px] leading-tight ${current ? 'font-black text-slate-900' : 'font-semibold text-slate-500'}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4">
        {/* Step 1 - vehicle details */}
        {step === 0 ? (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#FFF9E6] p-4">
              <ShieldCheck size={20} className="shrink-0 text-[#C79100]" />
              <span>
                <span className="block text-[14.5px] font-black text-slate-900">100% Safe &amp; Secure</span>
                <span className="block text-[13.5px] text-slate-600">
                  Your vehicle is verified by our team before it goes live.
                </span>
              </span>
            </div>

            <Section icon={Car} title="Vehicle Information">
              <div className="grid grid-cols-2 gap-3">
                <label><Label required>Vehicle Brand</Label>
                  <input className={field} value={form.brand} onChange={set('brand')} placeholder="e.g. Honda" />
                </label>
                <label><Label required>Model</Label>
                  <input className={field} value={form.model} onChange={set('model')} placeholder="e.g. City" />
                </label>
                <label><Label required>Variant</Label>
                  <input className={field} value={form.variant} onChange={set('variant')} placeholder="e.g. V CVT" />
                </label>
                <label><Label required>Year of Manufacturing</Label>
                  <input
                    type="number" min="1990" max={new Date().getFullYear()}
                    className={field} value={form.year} onChange={set('year')} placeholder="e.g. 2022"
                  />
                </label>
                <label><Label required>Fuel Type</Label>
                  <select className={field} value={form.fuelType} onChange={set('fuelType')}>
                    <option value="">Select Fuel Type</option>
                    {FUEL_TYPES.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
                  </select>
                </label>
                <label><Label required>Transmission</Label>
                  <select className={field} value={form.transmission} onChange={set('transmission')}>
                    <option value="">Select Transmission</option>
                    {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="col-span-2"><Label required>Registration Number</Label>
                  <input
                    className={`${field} uppercase`}
                    value={form.registrationNumber}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
                    placeholder="MP09AB1234"
                  />
                  <span className="mt-1 block text-[13px] text-slate-400">Example: MP09AB1234</span>
                </label>
              </div>
            </Section>

            <Section icon={IndianRupee} title="Pricing &amp; Availability">
              <div className="grid grid-cols-2 gap-3">
                <label><Label required>Daily Fare (₹)</Label>
                  <input type="number" min="0" className={field} value={form.dailyFare} onChange={set('dailyFare')} placeholder="1499" />
                </label>
                <label><Label required>Security Deposit (₹)</Label>
                  <input type="number" min="0" className={field} value={form.securityDeposit} onChange={set('securityDeposit')} placeholder="10000" />
                </label>
                <label className="col-span-2"><Label required>Availability</Label>
                  <select className={field} value={form.availability} onChange={set('availability')}>
                    <option value="">Select availability</option>
                    {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
              </div>
              <p className="mt-3 rounded-xl bg-[#FFF9E6] px-3 py-2.5 text-[13.5px] text-slate-700">
                <span className="font-bold">Tip:</span> a competitive price gets more bookings.
              </p>
            </Section>

            <Section icon={MapPin} title="Location Preference">
              <div className="grid grid-cols-2 gap-3">
                <label><Label required>City</Label>
                  <input className={field} value={form.city} onChange={set('city')} placeholder="e.g. Indore" />
                </label>
                <label><Label>Preferred Areas</Label>
                  <input className={field} value={form.preferredAreas} onChange={set('preferredAreas')} placeholder="Vijay Nagar, Palasia" />
                </label>
              </div>
            </Section>

            <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2.5 text-[13.5px] text-slate-700">
              <span className="font-bold">Note:</span> your vehicle goes through verification before it goes live.
            </p>
          </>
        ) : null}

        {/* Step 2 - documents */}
        {step === 1 ? (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#FFF9E6] p-4">
              <ShieldCheck size={20} className="shrink-0 text-[#C79100]" />
              <span>
                <span className="block text-[14.5px] font-black text-slate-900">Document Verification</span>
                <span className="block text-[13.5px] text-slate-600">
                  Upload clear, valid documents. JPG, PNG or PDF, up to 5MB each.
                </span>
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4">
              {DOCUMENTS.map((slot) => (
                <UploadSlot
                  key={slot.key}
                  slot={slot}
                  value={documents[slot.key]}
                  onUploaded={setFile('documents')}
                  accept="image/*,application/pdf"
                />
              ))}
            </div>

            <div className="mt-3 rounded-2xl bg-blue-50 p-4">
              <p className="text-[14px] font-black text-slate-900">Tips for faster approval</p>
              {['Make sure documents are clear and not expired', 'RC and insurance should be in your name', 'JPG, PNG or PDF · max 5MB each'].map((tip) => (
                <p key={tip} className="mt-1.5 flex items-start gap-1.5 text-[13.5px] text-slate-700">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" /> {tip}
                </p>
              ))}
            </div>
          </>
        ) : null}

        {/* Step 3 - photos */}
        {step === 2 ? (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#FFF9E6] p-4">
              <Camera size={20} className="shrink-0 text-[#C79100]" />
              <span>
                <span className="block text-[14.5px] font-black text-slate-900">Photo Verification</span>
                <span className="block text-[13.5px] text-slate-600">Clear photos help us verify your vehicle quickly.</span>
              </span>
            </div>

            <p className="mt-4 border-l-4 border-[#F5B700] pl-2 text-[15.5px] font-black text-slate-900">Required Photos</p>
            <div className="mt-2 rounded-2xl border border-slate-100 bg-white px-4">
              {PHOTOS.map((slot) => (
                <UploadSlot key={slot.key} slot={slot} value={photos[slot.key]} onUploaded={setFile('photos')} />
              ))}
            </div>

            <p className="mt-4 border-l-4 border-[#F5B700] pl-2 text-[15.5px] font-black text-slate-900">Fitness &amp; Permit</p>
            <div className="mt-2 rounded-2xl border border-slate-100 bg-white px-4">
              {CERTIFICATES.map((slot) => (
                <UploadSlot key={slot.key} slot={slot} value={photos[slot.key]} onUploaded={setFile('photos')} />
              ))}
            </div>
          </>
        ) : null}

        {/* Step 4 - review */}
        {step === 3 ? (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4">
              <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
              <span className="flex-1">
                <span className="block text-[14.5px] font-black text-slate-900">Almost there</span>
                <span className="block text-[13.5px] text-slate-600">Check the details before submitting.</span>
              </span>
              <button onClick={() => setStep(0)} className="rounded-xl border border-emerald-300 px-3 py-1.5 text-[13.5px] font-bold text-emerald-700">
                Edit
              </button>
            </div>

            <Section icon={Car} title="Vehicle Details">
              <div className="grid grid-cols-3 gap-y-3">
                {[
                  ['Brand', form.brand], ['Model', form.model], ['Variant', form.variant],
                  ['Year', form.year], ['Fuel Type', form.fuelType], ['Transmission', form.transmission],
                  ['Registration No.', form.registrationNumber],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[13px] text-slate-500">{label}</p>
                    <p className="text-[14.5px] font-bold text-slate-900">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={Wallet} title="Pricing &amp; Availability">
              <div className="grid grid-cols-3">
                <div>
                  <p className="text-[13px] text-slate-500">Daily Fare</p>
                  <p className="text-[14.5px] font-bold text-slate-900">{money(form.dailyFare)}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500">Security Deposit</p>
                  <p className="text-[14.5px] font-bold text-slate-900">{money(form.securityDeposit)}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500">Availability</p>
                  <p className="text-[14.5px] font-bold text-slate-900">{form.availability || '—'}</p>
                </div>
              </div>
            </Section>

            <Section icon={MapPin} title="Location Preference">
              <div className="grid grid-cols-2">
                <div>
                  <p className="text-[13px] text-slate-500">City</p>
                  <p className="text-[14.5px] font-bold text-slate-900">{form.city || '—'}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500">Preferred Areas</p>
                  <p className="text-[14.5px] font-bold text-slate-900">{form.preferredAreas || '—'}</p>
                </div>
              </div>
            </Section>

            <Section icon={FileText} title="Documents">
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {DOCUMENTS.filter((d) => documents[d.key]?.url).map((slot) => (
                  <div key={slot.key} className="w-[86px] shrink-0 text-center">
                    <span className="flex h-14 w-[86px] items-center justify-center rounded-lg bg-slate-100">
                      <FileText size={20} className="text-slate-500" />
                    </span>
                    <p className="mt-1 truncate text-[12.5px] font-semibold text-slate-700">{slot.label}</p>
                    <p className="text-[12px] font-bold text-emerald-600">Uploaded</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section icon={Camera} title="Photos">
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {[...PHOTOS, ...CERTIFICATES].filter((p) => photos[p.key]?.url).map((slot) => (
                  <div key={slot.key} className="w-[86px] shrink-0 text-center">
                    <img src={photos[slot.key].url} alt={slot.label} className="h-14 w-[86px] rounded-lg object-cover" />
                    <p className="mt-1 truncate text-[12.5px] font-semibold text-slate-700">{slot.label}</p>
                  </div>
                ))}
              </div>
            </Section>

            <div className="mt-3 flex items-start gap-3 rounded-2xl bg-[#FFF9E6] p-4">
              <ShieldCheck size={20} className="shrink-0 text-[#C79100]" />
              <span>
                <span className="block text-[14.5px] font-black text-slate-900">What happens next?</span>
                <span className="block text-[13.5px] text-slate-600">
                  Our team verifies your details and documents, and you hear back within 24–48 hours.
                </span>
              </span>
            </div>
          </>
        ) : null}

        {/* Step 5 - submitted */}
        {submitted ? (
          <>
            <div className="mt-4 rounded-2xl bg-emerald-50 p-5">
              <p className="flex items-center gap-2 text-[18px] font-black text-slate-900">
                <CheckCircle2 size={22} className="text-emerald-600" /> Application Submitted!
              </p>
              <p className="mt-1 text-[14px] text-slate-600">
                Your car attachment request has been submitted successfully.
              </p>

              <div className="mt-4 flex gap-8 border-t border-emerald-200 pt-3">
                <div>
                  <p className="text-[13px] text-slate-500">Reference ID</p>
                  <p className="text-[15.5px] font-black text-emerald-700">{record?.reference}</p>
                </div>
                <div>
                  <p className="text-[13px] text-slate-500">Submitted On</p>
                  <p className="text-[14.5px] font-bold text-slate-900">
                    {record?.submittedAt
                      ? new Date(record.submittedAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
              </div>

              <p className="mt-3 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5 text-[13.5px] text-slate-700">
                <Clock size={15} className="text-slate-500" />
                Verification usually takes 24–48 hours. You will be notified once approved.
              </p>
            </div>

            <Section icon={Car} title="Your Vehicle">
              <div className="flex items-center gap-3">
                {photos.front?.url ? (
                  <img src={photos.front.url} alt="" className="h-14 w-20 rounded-lg object-cover" />
                ) : null}
                <div>
                  <p className="text-[15.5px] font-black text-slate-900">
                    {form.brand} {form.model} {form.variant} ({form.fuelType})
                  </p>
                  <p className="text-[13.5px] text-slate-500">
                    {form.registrationNumber} · {form.year} · {form.city}
                  </p>
                </div>
              </div>
            </Section>

            <button
              onClick={() => navigate('/taxi/user')}
              className="mt-5 w-full rounded-2xl bg-[#F5B700] py-3.5 text-[16px] font-black text-slate-900"
            >
              Go to Home
            </button>
          </>
        ) : null}
      </div>

      {/* Footer actions */}
      {!submitted ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-lg gap-3 border-t border-slate-100 bg-white px-4 py-3">
          {step > 0 ? (
            <button
              onClick={() => { setStep((s) => s - 1); window.scrollTo({ top: 0 }); }}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 px-5 py-3 text-[15px] font-black text-slate-700"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : null}

          <button
            onClick={step === 3 ? submit : next}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F5B700] py-3 text-[15.5px] font-black text-slate-900 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {step === 3 ? 'Looks Good, Submit' : 'Save & Continue'}
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AttachCar;
