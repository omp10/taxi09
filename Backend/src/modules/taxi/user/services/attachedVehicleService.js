import { ApiError } from '../../../../utils/ApiError.js';
import {
  AttachedVehicle,
  REQUIRED_DOCUMENTS,
  REQUIRED_PHOTOS,
  REQUIRED_CERTIFICATES,
} from '../../admin/content/models/AttachedVehicle.js';

/**
 * Owners listing their car with us.
 *
 * Saved a step at a time, and checked in full on submit - the wizard can be
 * skipped past client-side, so completeness is decided here.
 */

const filterUnique = (items) => [...new Set(items)];

const reference = () => `TA09-${Math.floor(100000 + Math.random() * 900000)}`;

const VEHICLE_FIELDS = [
  'brand', 'model', 'variant', 'year', 'fuelType', 'transmission', 'registrationNumber',
  'dailyFare', 'securityDeposit', 'availability', 'availableFrom', 'availableTo',
  'city', 'preferredAreas',
];

const REQUIRED_ON_SUBMIT = [
  ['brand', 'Vehicle brand'],
  ['model', 'Model'],
  ['variant', 'Variant'],
  ['year', 'Year of manufacturing'],
  ['fuelType', 'Fuel type'],
  ['transmission', 'Transmission'],
  ['registrationNumber', 'Registration number'],
  ['dailyFare', 'Daily fare'],
  ['securityDeposit', 'Security deposit'],
  ['availability', 'Availability'],
  ['city', 'City'],
];

const LABELS = {
  rcCertificate: 'RC certificate',
  insurance: 'Insurance certificate',
  puc: 'PUC certificate',
  drivingLicense: 'Driving license',
  aadhaar: 'Aadhaar card',
  front: 'Front view photo',
  rear: 'Rear view photo',
  left: 'Left side photo',
  right: 'Right side photo',
  odometer: 'Odometer photo',
  fuelLevel: 'Fuel level photo',
  fitnessCertificate: 'Fitness certificate',
  permit: 'Permit / commercial license',
};

/** Indian plate, e.g. MP09AB1234. Spaces and dashes are tolerated on input. */
const PLATE = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

const cleanPlate = (value) => String(value || '').toUpperCase().replace(/[\s-]/g, '');

const applyFiles = (target, incoming = {}) => {
  Object.entries(incoming).forEach(([key, file]) => {
    if (!file || typeof file !== 'object') return;
    if (target[key] === undefined && !(key in target)) return; // unknown slot, ignore

    target[key] = {
      url: String(file.url || '').trim(),
      fileName: String(file.fileName || '').trim(),
      uploadedAt: file.url ? new Date() : null,
    };
  });
};

const applyPayload = (doc, payload = {}) => {
  VEHICLE_FIELDS.forEach((field) => {
    if (payload[field] === undefined) return;

    if (field === 'preferredAreas') {
      doc.preferredAreas = Array.isArray(payload.preferredAreas)
        ? payload.preferredAreas.map((area) => String(area).trim()).filter(Boolean)
        : String(payload.preferredAreas || '').split(',').map((a) => a.trim()).filter(Boolean);
      return;
    }

    if (field === 'registrationNumber') {
      doc.registrationNumber = cleanPlate(payload.registrationNumber);
      return;
    }

    doc[field] = payload[field];
  });

  if (payload.documents) applyFiles(doc.documents, payload.documents);
  if (payload.photos) applyFiles(doc.photos, payload.photos);
  if (payload.step) doc.step = Math.min(5, Math.max(1, Number(payload.step) || 1));
};

/** Everything still missing before this can be submitted. */
export const missingForSubmit = (doc) => {
  const missing = [];

  REQUIRED_ON_SUBMIT.forEach(([field, label]) => {
    const value = doc[field];
    if (value === null || value === undefined || value === '' || value === 0) missing.push(label);
  });

  if (doc.registrationNumber && !PLATE.test(doc.registrationNumber)) {
    missing.push('A valid registration number (e.g. MP09AB1234)');
  }

  [...REQUIRED_DOCUMENTS].forEach((key) => {
    if (!doc.documents?.[key]?.url) missing.push(LABELS[key] || key);
  });
  [...REQUIRED_PHOTOS, ...REQUIRED_CERTIFICATES].forEach((key) => {
    if (!doc.photos?.[key]?.url) missing.push(LABELS[key] || key);
  });

  return missing;
};

const loadOwned = async ({ id, userId }) => {
  const doc = await AttachedVehicle.findOne({ _id: id, userId });
  if (!doc) throw new ApiError(404, 'Application not found');
  return doc;
};

export const listMyAttachedVehicles = async (userId) =>
  AttachedVehicle.find({ userId }).sort({ createdAt: -1 }).lean();

export const getMyAttachedVehicle = async ({ id, userId }) => (await loadOwned({ id, userId })).toObject();

/** Creates a draft, or updates the existing one when an id is supplied. */
export const saveAttachedVehicle = async ({ userId, id, payload = {} }) => {
  if (!userId) throw new ApiError(401, 'Sign in to list your car');

  const doc = id
    ? await loadOwned({ id, userId })
    : new AttachedVehicle({ userId, reference: reference() });

  // Once it is with the admin the owner cannot quietly rewrite it.
  if (id && !['draft', 'rejected'].includes(doc.status)) {
    throw new ApiError(400, 'This application is being reviewed and can no longer be edited');
  }

  applyPayload(doc, payload);

  // Re-submitting a rejected application puts it back into the draft state.
  if (doc.status === 'rejected') {
    doc.status = 'draft';
    doc.reviewNote = '';
  }

  await doc.save();
  return doc.toObject();
};

export const submitAttachedVehicle = async ({ userId, id }) => {
  const doc = await loadOwned({ id, userId });

  if (!['draft', 'rejected'].includes(doc.status)) {
    throw new ApiError(400, 'This application has already been submitted');
  }

  const missing = filterUnique(missingForSubmit(doc));
  if (missing.length) {
    throw new ApiError(400, `Still needed: ${missing.join(', ')}`);
  }

  const duplicate = await AttachedVehicle.findOne({
    _id: { $ne: doc._id },
    registrationNumber: doc.registrationNumber,
    status: { $in: ['submitted', 'under_review', 'approved'] },
  }).lean();

  if (duplicate) throw new ApiError(400, 'This vehicle has already been listed');

  doc.status = 'submitted';
  doc.submittedAt = new Date();
  doc.step = 5;
  await doc.save();

  return doc.toObject();
};
