/**
 * Shared configuration for the staff vehicle-handover flow.
 *
 * Manual verification only: staff visually compare documents and tick checks.
 * There is deliberately no face-match score, OCR or biometric capture here -
 * those carry Aadhaar Act / DPDP obligations we are not taking on.
 */

export const HANDOVER_STEPS = [
  { id: 'verify', label: 'Verify', short: 'KYC' },
  { id: 'allocate', label: 'Allocate', short: 'Vehicle' },
  { id: 'checklist', label: 'Checklist', short: 'Kit' },
  { id: 'photos', label: 'Photos', short: 'Photos' },
  { id: 'damage', label: 'Damage', short: 'Damage' },
  { id: 'meter', label: 'Meter', short: 'Meter' },
  { id: 'sign', label: 'Sign off', short: 'Sign' },
];

/** 12 capture slots, ordered the way a person actually walks around a car. */
export const PHOTO_SLOTS = [
  { id: 'front', label: 'Front', hint: 'Full width, number plate visible' },
  { id: 'rear', label: 'Rear', hint: 'Full width, plate visible' },
  { id: 'left', label: 'Left side', hint: 'Both doors in frame' },
  { id: 'right', label: 'Right side', hint: 'Both doors in frame' },
  { id: 'dashboard', label: 'Dashboard', hint: 'Ignition on' },
  { id: 'odometer', label: 'Odometer', hint: 'Reading legible' },
  { id: 'seats', label: 'Seats', hint: 'Front and rear rows' },
  { id: 'roof', label: 'Roof', hint: 'Stand back or use a step' },
  { id: 'windshield', label: 'Windshield', hint: 'Check for chips' },
  { id: 'boot', label: 'Boot', hint: 'Open, spare visible' },
  { id: 'engine', label: 'Engine bay', hint: 'Bonnet open', optional: true },
  { id: 'walkaround', label: 'Walkaround', hint: '30s video', video: true },
];

/** Handed over with the car. Required items block completion. */
export const ACCESSORIES = [
  { id: 'rc', label: 'RC copy', required: true },
  { id: 'insurance', label: 'Insurance', required: true },
  { id: 'fastag', label: 'FASTag', required: true },
  { id: 'toolkit', label: 'Toolkit', required: false },
  { id: 'spare', label: 'Spare tyre', required: true },
  { id: 'jack', label: 'Jack', required: false },
  { id: 'charger', label: 'Charging cable', required: false },
  { id: 'puc', label: 'PUC certificate', required: true },
];

/** Manual document checks - staff confirms what they physically saw. */
export const KYC_CHECKS = [
  { id: 'licence', label: 'Driving licence', hint: 'Original seen, not expired, photo matches' },
  { id: 'idproof', label: 'Government ID', hint: 'Masked Aadhaar / passport / voter ID' },
  { id: 'selfie', label: 'Photo matches customer', hint: 'Booking photo vs person present' },
  { id: 'booking', label: 'Booking details', hint: 'Name and phone match the booking' },
  { id: 'deposit', label: 'Deposit received', hint: 'Payment confirmed in system' },
  { id: 'agreement', label: 'Agreement signed', hint: 'Rental terms accepted' },
];

export const DAMAGE_TYPES = [
  { id: 'scratch', label: 'Scratch', tone: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'dent', label: 'Dent', tone: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'crack', label: 'Crack', tone: 'bg-rose-100 text-rose-700 border-rose-200' },
  { id: 'broken', label: 'Broken part', tone: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'paint', label: 'Paint damage', tone: 'bg-violet-100 text-violet-700 border-violet-200' },
];

export const SEVERITIES = [
  { id: 'minor', label: 'Minor' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'major', label: 'Major' },
];

export const FUEL_STEPS = [0, 25, 50, 75, 100];

/** Demo queue. Replace with GET /staff/handovers?date=today once the API lands. */
export const TODAY_QUEUE = [
  {
    id: 'HO-2481',
    kind: 'delivery',
    customer: 'Rahul Mehta',
    phone: '98765 43210',
    bookingRef: 'RNT-77120',
    vehicle: 'Maruti Swift VXi',
    registration: 'MP09 CX 4471',
    slot: 'B-14',
    keyNo: 'K-221',
    slotTime: '10:30 AM',
    duration: '2 days',
    deposit: 5000,
    status: 'pending',
  },
  {
    id: 'HO-2482',
    kind: 'delivery',
    customer: 'Ananya Iyer',
    phone: '90123 44556',
    bookingRef: 'RNT-77145',
    vehicle: 'Hyundai Aura',
    registration: 'MP09 DE 8820',
    slot: 'A-03',
    keyNo: 'K-108',
    slotTime: '12:00 PM',
    duration: '1 day',
    deposit: 4000,
    status: 'pending',
  },
  {
    id: 'HO-2470',
    kind: 'return',
    customer: 'Vikram Singh',
    phone: '99887 66554',
    bookingRef: 'RNT-77098',
    vehicle: 'Honda Activa 6G',
    registration: 'MP09 AB 1201',
    slot: 'C-07',
    keyNo: 'K-045',
    slotTime: '04:15 PM',
    duration: '3 days',
    deposit: 2000,
    status: 'pending',
  },
];
