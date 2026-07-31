import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Download,
  Fuel,
  Gauge,
  KeyRound,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { Card, CheckRow, Pill, SectionTitle, StepRail, StickyAction } from './HandoverUI';
import {
  ACCESSORIES,
  DAMAGE_TYPES,
  FUEL_STEPS,
  HANDOVER_STEPS,
  KYC_CHECKS,
  PHOTO_SLOTS,
  SEVERITIES,
  TODAY_QUEUE,
} from './handoverConfig';

const rupees = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

/** Signature pad. Captures a real drawn path, not a typed name. */
const SignaturePad = ({ label, value, onChange }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  const pos = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = event.touches?.[0] || event;
    return {
      x: ((point.clientX - rect.left) / rect.width) * canvas.width,
      y: ((point.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (event) => {
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    drawing.current = true;
  };

  const move = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = pos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
    onChange('');
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-extrabold">{label}</p>
        {value ? (
          <button type="button" onClick={clear} className="flex items-center gap-1 text-[10.5px] font-bold text-slate-500">
            <RotateCcw size={11} /> Clear
          </button>
        ) : null}
      </div>
      <div className="mt-1.5 overflow-hidden rounded-[14px] border-2 border-dashed border-slate-300 bg-[#FAFAFB]">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="h-[110px] w-full touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <p className="mt-1 text-[9.5px] font-medium text-slate-400">
        {value ? 'Signature captured' : 'Ask the person to sign inside the box'}
      </p>
    </div>
  );
};

/** Top-down car outline. Tap anywhere to drop a damage pin. */
const CarDiagram = ({ marks, onAdd, onRemove }) => {
  const handleTap = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onAdd({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      onClick={handleTap}
      className="relative mx-auto h-[260px] w-[150px] cursor-crosshair select-none"
    >
      <svg viewBox="0 0 150 260" className="h-full w-full" aria-hidden="true">
        <rect x="18" y="10" width="114" height="240" rx="42" fill="#F1F2F4" stroke="#D6D8DC" strokeWidth="2" />
        <rect x="34" y="34" width="82" height="44" rx="16" fill="#E4E6EA" />
        <rect x="34" y="182" width="82" height="44" rx="16" fill="#E4E6EA" />
        <rect x="38" y="92" width="74" height="76" rx="10" fill="#E9EBEF" />
        <rect x="8" y="70" width="12" height="34" rx="6" fill="#DCDEE3" />
        <rect x="130" y="70" width="12" height="34" rx="6" fill="#DCDEE3" />
        <rect x="8" y="158" width="12" height="34" rx="6" fill="#DCDEE3" />
        <rect x="130" y="158" width="12" height="34" rx="6" fill="#DCDEE3" />
        <text x="75" y="60" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9, fontWeight: 700 }}>
          BONNET
        </text>
        <text x="75" y="208" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9, fontWeight: 700 }}>
          BOOT
        </text>
      </svg>

      {marks.map((mark) => {
        const type = DAMAGE_TYPES.find((t) => t.id === mark.type);
        return (
          <button
            key={mark.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(mark.id);
            }}
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[8px] font-extrabold text-white shadow-md"
            title={`${type?.label} · ${mark.severity} — tap to remove`}
          >
            {type?.label?.[0] || '!'}
          </button>
        );
      })}
    </div>
  );
};

const StaffHandoverFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const job = location.state?.job || TODAY_QUEUE.find((item) => item.id === jobId) || TODAY_QUEUE[0];

  const [stepIndex, setStepIndex] = useState(0);
  const [kyc, setKyc] = useState({});
  const [allocation, setAllocation] = useState({ slot: job.slot, keyNo: job.keyNo, fuel: 75 });
  const [kit, setKit] = useState({});
  const [photos, setPhotos] = useState({});
  const [marks, setMarks] = useState([]);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [odometer, setOdometer] = useState('');
  const [custSign, setCustSign] = useState('');
  const [staffSign, setStaffSign] = useState('');
  const [done, setDone] = useState(false);

  const step = HANDOVER_STEPS[stepIndex];

  const requiredKit = ACCESSORIES.filter((item) => item.required);
  const requiredPhotos = PHOTO_SLOTS.filter((slot) => !slot.optional);
  const photoCount = Object.keys(photos).length;

  const canAdvance = useMemo(() => {
    if (step.id === 'verify') return KYC_CHECKS.every((check) => kyc[check.id]);
    if (step.id === 'allocate') return Boolean(allocation.slot && allocation.keyNo);
    if (step.id === 'checklist') return requiredKit.every((item) => kit[item.id]);
    if (step.id === 'photos') return requiredPhotos.every((slot) => photos[slot.id]);
    if (step.id === 'damage') return true;
    if (step.id === 'meter') return String(odometer).trim().length > 0;
    if (step.id === 'sign') return Boolean(custSign && staffSign);
    return true;
  }, [allocation, custSign, kit, kyc, odometer, photos, requiredKit, requiredPhotos, staffSign, step.id]);

  const blockedHint = useMemo(() => {
    if (canAdvance) return '';
    if (step.id === 'verify') {
      const left = KYC_CHECKS.filter((c) => !kyc[c.id]).length;
      return `${left} check${left > 1 ? 's' : ''} remaining`;
    }
    if (step.id === 'checklist') {
      const left = requiredKit.filter((i) => !kit[i.id]).length;
      return `${left} required item${left > 1 ? 's' : ''} not confirmed`;
    }
    if (step.id === 'photos') {
      const left = requiredPhotos.filter((s) => !photos[s.id]).length;
      return `${left} required photo${left > 1 ? 's' : ''} missing`;
    }
    if (step.id === 'meter') return 'Enter the odometer reading';
    if (step.id === 'sign') return 'Both signatures are required';
    return '';
  }, [canAdvance, kit, kyc, photos, requiredKit, requiredPhotos, step.id]);

  const next = () => {
    if (stepIndex < HANDOVER_STEPS.length - 1) {
      setStepIndex((index) => index + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setDone(true);
  };

  // Camera capture. On mobile this opens the rear camera directly.
  const capture = (slotId, file) => {
    if (!file) return;
    setPhotos((current) => ({ ...current, [slotId]: URL.createObjectURL(file) }));
  };

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-[#F7F7F8] px-5 text-center text-black">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)]">
          <CheckCircle2 size={40} strokeWidth={2.4} className="text-black" />
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold">Delivery completed</h1>
        <p className="mt-1.5 text-[12px] font-medium text-slate-500">
          {job.vehicle} handed to {job.customer}
        </p>

        <Card className="mt-5 w-full text-left">
          <SectionTitle title="Handover record" hint={`${job.bookingRef} · ${job.registration}`} />
          <div className="mt-3 space-y-1.5 text-[11.5px] font-semibold">
            {[
              ['Photos captured', `${photoCount} / ${PHOTO_SLOTS.length}`],
              ['Damage marks', `${marks.length}`],
              ['Odometer', `${odometer} km`],
              ['Fuel at handover', `${allocation.fuel}%`],
              ['Key / slot', `${allocation.keyNo} · ${allocation.slot}`],
              ['Signatures', 'Customer + Staff'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <button
          type="button"
          onClick={() => toast.success('Inspection PDF queued — emailed and SMS sent')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] bg-black py-3.5 text-[14px] font-extrabold text-white"
        >
          <Download size={16} /> Generate inspection PDF
        </button>
        <button
          type="button"
          onClick={() => navigate('/taxi/driver/handover')}
          className="mt-2 w-full rounded-[16px] border border-black/10 bg-white py-3.5 text-[14px] font-extrabold"
        >
          Back to queue
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[#F7F7F8] pb-32 text-black">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/85 px-4 pb-3 pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => (stepIndex === 0 ? navigate(-1) : setStepIndex((i) => i - 1))}
            aria-label="Back"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-[var(--primary)]"
          >
            <ArrowLeft size={16} strokeWidth={2.8} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-extrabold leading-tight">{job.vehicle}</p>
            <p className="truncate text-[10px] font-semibold text-slate-500">
              {job.customer} · {job.bookingRef}
            </p>
          </div>
          <Pill tone="bg-[var(--primary)]/25 text-[#7a5c00]">{step.label}</Pill>
        </div>
        <div className="mt-3">
          <StepRail steps={HANDOVER_STEPS} currentIndex={stepIndex} />
        </div>
      </header>

      <main className="space-y-3 px-3 pt-3">
        {step.id === 'verify' ? (
          <>
            <Card>
              <SectionTitle
                title="Verify the customer"
                hint="Staff confirms each document by sight. Nothing is scanned or stored."
              />
              <div className="mt-3 space-y-2">
                {KYC_CHECKS.map((check) => (
                  <CheckRow
                    key={check.id}
                    label={check.label}
                    hint={check.hint}
                    checked={Boolean(kyc[check.id])}
                    onToggle={() => setKyc((c) => ({ ...c, [check.id]: !c[check.id] }))}
                  />
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle title="Booking" hint="Cross-check against what the customer tells you" />
              <div className="mt-3 grid grid-cols-2 gap-2.5 text-[11.5px] font-semibold">
                {[
                  ['Customer', job.customer],
                  ['Phone', job.phone],
                  ['Duration', job.duration],
                  ['Deposit', rupees(job.deposit)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[12px] bg-[#FAFAFB] px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : null}

        {step.id === 'allocate' ? (
          <Card>
            <SectionTitle title="Vehicle allocation" hint="Confirm the car, its bay and the key tag" />
            <div className="mt-3 rounded-[14px] bg-[#FAFAFB] p-3">
              <p className="text-[13px] font-extrabold">{job.vehicle}</p>
              <p className="text-[10.5px] font-semibold text-slate-500">{job.registration}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <label className="rounded-[14px] border border-black/[0.07] px-3 py-2.5">
                <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                  <MapPin size={11} /> Parking slot
                </span>
                <input
                  value={allocation.slot}
                  onChange={(event) => setAllocation((a) => ({ ...a, slot: event.target.value.toUpperCase() }))}
                  className="mt-1 w-full bg-transparent text-[14px] font-extrabold outline-none"
                />
              </label>
              <label className="rounded-[14px] border border-black/[0.07] px-3 py-2.5">
                <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                  <KeyRound size={11} /> Key number
                </span>
                <input
                  value={allocation.keyNo}
                  onChange={(event) => setAllocation((a) => ({ ...a, keyNo: event.target.value.toUpperCase() }))}
                  className="mt-1 w-full bg-transparent text-[14px] font-extrabold outline-none"
                />
              </label>
            </div>

            <div className="mt-3">
              <p className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                <Fuel size={11} /> Fuel at handover
              </p>
              <div className="mt-2 flex gap-2">
                {FUEL_STEPS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setAllocation((a) => ({ ...a, fuel: level }))}
                    className={`flex-1 rounded-[12px] py-2.5 text-[12px] font-extrabold transition-colors ${
                      allocation.fuel === level
                        ? 'bg-[var(--primary)] text-black'
                        : 'bg-[#FAFAFB] text-slate-500'
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {step.id === 'checklist' ? (
          <Card>
            <SectionTitle
              title="Accessories & documents"
              hint="Confirm each item is physically in the vehicle"
              right={
                <Pill tone="bg-slate-100 text-slate-600">
                  {Object.values(kit).filter(Boolean).length}/{ACCESSORIES.length}
                </Pill>
              }
            />
            <div className="mt-3 space-y-2">
              {ACCESSORIES.map((item) => (
                <CheckRow
                  key={item.id}
                  label={item.label}
                  required={item.required}
                  checked={Boolean(kit[item.id])}
                  onToggle={() => setKit((k) => ({ ...k, [item.id]: !k[item.id] }))}
                />
              ))}
            </div>
          </Card>
        ) : null}

        {step.id === 'photos' ? (
          <Card>
            <SectionTitle
              title="Condition photos"
              hint="Tap a tile to capture. These are the evidence for any later dispute."
              right={
                <Pill tone="bg-slate-100 text-slate-600">
                  {photoCount}/{PHOTO_SLOTS.length}
                </Pill>
              }
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PHOTO_SLOTS.map((slot) => {
                const shot = photos[slot.id];
                return (
                  <label
                    key={slot.id}
                    className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[14px] border-2 border-dashed text-center transition-colors ${
                      shot ? 'border-[var(--primary)] bg-black' : 'border-slate-300 bg-[#FAFAFB]'
                    }`}
                  >
                    <input
                      type="file"
                      accept={slot.video ? 'video/*' : 'image/*'}
                      capture="environment"
                      className="hidden"
                      onChange={(event) => capture(slot.id, event.target.files?.[0])}
                    />
                    {shot ? (
                      <>
                        {slot.video ? (
                          <video src={shot} className="h-full w-full object-cover" muted />
                        ) : (
                          <img src={shot} alt={slot.label} className="h-full w-full object-cover" />
                        )}
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]">
                          <Check size={11} strokeWidth={4} className="text-black" />
                        </span>
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[8px] font-bold text-white">
                          {slot.label}
                        </span>
                      </>
                    ) : (
                      <>
                        {slot.video ? (
                          <Video size={17} className="text-slate-400" />
                        ) : (
                          <Camera size={17} className="text-slate-400" />
                        )}
                        <span className="mt-1 px-1 text-[8.5px] font-extrabold leading-tight text-slate-600">
                          {slot.label}
                        </span>
                        {slot.optional ? (
                          <span className="text-[7px] font-bold uppercase text-slate-400">Optional</span>
                        ) : null}
                      </>
                    )}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[9.5px] font-medium text-slate-400">
              Walkaround should be a slow 30-second video covering all four sides.
            </p>
          </Card>
        ) : null}

        {step.id === 'damage' ? (
          <>
            <Card>
              <SectionTitle
                title="Existing damage"
                hint="Tap the diagram where you see damage. Tap a pin to remove it."
                right={<Pill tone="bg-slate-100 text-slate-600">{marks.length}</Pill>}
              />
              <div className="mt-3">
                <CarDiagram
                  marks={marks}
                  onAdd={(point) => setPendingPoint(point)}
                  onRemove={(id) => setMarks((list) => list.filter((m) => m.id !== id))}
                />
              </div>
            </Card>

            {marks.length ? (
              <Card>
                <SectionTitle title="Logged damage" />
                <div className="mt-2.5 space-y-2">
                  {marks.map((mark) => {
                    const type = DAMAGE_TYPES.find((t) => t.id === mark.type);
                    return (
                      <div
                        key={mark.id}
                        className="flex items-center gap-2 rounded-[12px] border border-black/[0.06] px-3 py-2"
                      >
                        <span className={`rounded-[6px] border px-1.5 py-0.5 text-[9.5px] font-extrabold ${type?.tone}`}>
                          {type?.label}
                        </span>
                        <span className="text-[11px] font-semibold capitalize text-slate-600">{mark.severity}</span>
                        <button
                          type="button"
                          onClick={() => setMarks((list) => list.filter((m) => m.id !== mark.id))}
                          className="ml-auto text-slate-400"
                          aria-label="Remove"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : null}
          </>
        ) : null}

        {step.id === 'meter' ? (
          <Card>
            <SectionTitle title="Meter & fuel" hint="Read directly off the dashboard" />
            <label className="mt-3 block rounded-[14px] border border-black/[0.07] px-3 py-2.5">
              <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-slate-400">
                <Gauge size={11} /> Odometer (km)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={odometer}
                onChange={(event) => setOdometer(event.target.value.replace(/\D/g, '').slice(0, 7))}
                placeholder="e.g. 42150"
                className="mt-1 w-full bg-transparent text-[20px] font-extrabold outline-none placeholder:text-slate-300"
              />
            </label>
            <p className="mt-2 text-[10px] font-medium text-slate-500">
              The odometer photo you captured is attached as proof of this reading.
            </p>

            <div className="mt-3 rounded-[14px] bg-[#FAFAFB] p-3">
              <p className="text-[9.5px] font-bold uppercase tracking-wide text-slate-400">Fuel recorded</p>
              <p className="mt-0.5 text-[18px] font-extrabold">{allocation.fuel}%</p>
            </div>
          </Card>
        ) : null}

        {step.id === 'sign' ? (
          <>
            <Card>
              <SectionTitle title="Sign off" hint="Both parties confirm the condition recorded above" />
              <div className="mt-3 space-y-4">
                <SignaturePad label="Customer signature" value={custSign} onChange={setCustSign} />
                <SignaturePad label="Staff signature" value={staffSign} onChange={setStaffSign} />
              </div>
            </Card>
            <Card>
              <SectionTitle title="Summary" />
              <div className="mt-2.5 space-y-1.5 text-[11.5px] font-semibold">
                {[
                  ['Photos', `${photoCount}/${PHOTO_SLOTS.length}`],
                  ['Damage marks', `${marks.length}`],
                  ['Odometer', odometer ? `${odometer} km` : '—'],
                  ['Fuel', `${allocation.fuel}%`],
                  ['Slot / key', `${allocation.slot} · ${allocation.keyNo}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : null}
      </main>

      {/* Damage type sheet */}
      {pendingPoint ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-auto rounded-t-[24px] bg-white p-4 pb-7">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-extrabold">What kind of damage?</p>
              <button
                type="button"
                onClick={() => setPendingPoint(null)}
                aria-label="Cancel"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {DAMAGE_TYPES.map((type) => (
                <div key={type.id}>
                  <p className={`rounded-[10px] border px-2 py-1 text-center text-[10.5px] font-extrabold ${type.tone}`}>
                    {type.label}
                  </p>
                  <div className="mt-1 flex gap-1">
                    {SEVERITIES.map((severity) => (
                      <button
                        key={severity.id}
                        type="button"
                        onClick={() => {
                          setMarks((list) => [
                            ...list,
                            { id: `${Date.now()}-${list.length}`, ...pendingPoint, type: type.id, severity: severity.id },
                          ]);
                          setPendingPoint(null);
                        }}
                        className="flex-1 rounded-[8px] bg-[#FAFAFB] py-1.5 text-[9px] font-bold text-slate-600 active:bg-slate-200"
                      >
                        {severity.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <StickyAction
        hint={blockedHint}
        disabled={!canAdvance}
        onClick={next}
        label={stepIndex === HANDOVER_STEPS.length - 1 ? 'Complete delivery' : 'Continue'}
        secondary={
          step.id === 'damage' && marks.length === 0 ? (
            <button
              type="button"
              onClick={next}
              className="rounded-[16px] border border-black/10 bg-white px-4 text-[13px] font-extrabold text-slate-600"
            >
              No damage
            </button>
          ) : null
        }
      />
    </div>
  );
};

export default StaffHandoverFlow;
