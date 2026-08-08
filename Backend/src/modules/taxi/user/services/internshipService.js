import { ApiError } from '../../../../utils/ApiError.js';
import {
  Certificate,
  Course,
  InternshipApplication,
  InternshipTrack,
} from '../../admin/content/models/Internship.js';

/**
 * Internship tracks, courses, applications and the certificates they award.
 *
 * A certificate is only issued once a person has actually finished, and its
 * number is the public handle used to verify it, so it is generated here rather
 * than accepted from anywhere.
 */

const clean = (value) => String(value ?? '').trim();

const slugify = (value) =>
  clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

const uniqueSlug = async (Model, base) => {
  const root = slugify(base) || 'item';
  let candidate = root;
  let suffix = 1;

  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
  return candidate;
};

const reference = () => `INT-${Math.floor(100000 + Math.random() * 900000)}`;

/* Certificate numbers are readable and unique: TAXI09-CERT-<year>-<serial>. */
const certificateNumber = async () => {
  const year = new Date().getFullYear();
  const issuedThisYear = await Certificate.countDocuments({
    certificateNumber: new RegExp(`^TAXI09-CERT-${year}-`),
  });
  return `TAXI09-CERT-${year}-${String(issuedThisYear + 1).padStart(5, '0')}`;
};

/* --------------------------------------------------------------- reading */

export const listInternshipTracks = async ({ active } = {}) => {
  const query = {};
  if (active !== undefined) query.active = Boolean(active);
  return { results: await InternshipTrack.find(query).sort({ sortOrder: 1, title: 1 }).lean() };
};

export const listCourses = async ({ active, mode } = {}) => {
  const query = {};
  if (active !== undefined) query.active = Boolean(active);
  if (mode) query.mode = mode;
  return { results: await Course.find(query).sort({ sortOrder: 1, title: 1 }).lean() };
};

export const getCourseBySlug = async (slug) => {
  const course = await Course.findOne({ slug: clean(slug).toLowerCase() }).lean();
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
};

/** Headline numbers for the programme page, counted rather than typed in. */
export const getInternshipStats = async () => {
  const [tracks, courses, placed, certificates, cities] = await Promise.all([
    InternshipTrack.countDocuments({ active: true }),
    Course.countDocuments({ active: true }),
    InternshipApplication.countDocuments({ status: { $in: ['enrolled', 'completed'] } }),
    Certificate.countDocuments({ revoked: false }),
    Course.distinct('city', { active: true, city: { $ne: '' } }),
  ]);

  return { tracks, courses, placed, certificates, cities: cities.length };
};

/* -------------------------------------------------------------- applying */

export const applyForInternship = async ({ userId, payload = {} }) => {
  if (!userId) throw new ApiError(401, 'Sign in to apply');

  const trackId = clean(payload.trackId) || null;
  const courseId = clean(payload.courseId) || null;
  if (!trackId && !courseId) throw new ApiError(400, 'Choose a track or a course to apply for');

  const [track, course] = await Promise.all([
    trackId ? InternshipTrack.findOne({ _id: trackId, active: true }).lean() : null,
    courseId ? Course.findOne({ _id: courseId, active: true }).lean() : null,
  ]);

  if (trackId && !track) throw new ApiError(404, 'That internship track is not open');
  if (courseId && !course) throw new ApiError(404, 'That course is not available');

  if (!clean(payload.fullName)) throw new ApiError(400, 'Your name is required');
  if (!clean(payload.phone)) throw new ApiError(400, 'A phone number is required');

  // One live application per track or course - reapplying while a decision is
  // pending would just create duplicates for the team to sift through.
  const existing = await InternshipApplication.findOne({
    userId,
    ...(trackId ? { trackId } : { courseId }),
    status: { $nin: ['rejected', 'completed'] },
  }).lean();

  if (existing) {
    throw new ApiError(400, `You have already applied for ${existing.trackTitle || existing.courseTitle}`);
  }

  return InternshipApplication.create({
    reference: reference(),
    userId,
    trackId: track?._id || null,
    trackTitle: track?.title || '',
    courseId: course?._id || null,
    courseTitle: course?.title || '',
    fullName: clean(payload.fullName),
    email: clean(payload.email),
    phone: clean(payload.phone),
    city: clean(payload.city),
    college: clean(payload.college),
    qualification: clean(payload.qualification),
    resumeUrl: clean(payload.resumeUrl),
    message: clean(payload.message),
  });
};

export const listMyApplications = async (userId) =>
  InternshipApplication.find({ userId }).sort({ createdAt: -1 }).lean();

export const listMyCertificates = async (userId) =>
  Certificate.find({ userId, revoked: false }).sort({ issuedAt: -1 }).lean();

/* ---------------------------------------------------------- certificates */

/**
 * Issues a certificate for a finished application.
 *
 * Only a completed application earns one, and a second request returns the
 * certificate already issued rather than minting a duplicate.
 */
export const issueCertificate = async ({ applicationId }) => {
  const application = await InternshipApplication.findById(applicationId);
  if (!application) throw new ApiError(404, 'Application not found');

  if (application.status !== 'completed') {
    throw new ApiError(400, 'Only a completed application can be certified');
  }

  const already = await Certificate.findOne({ applicationId: application._id, revoked: false }).lean();
  if (already) return already;

  const course = application.courseId ? await Course.findById(application.courseId).lean() : null;
  if (course && course.awardsCertificate === false) {
    throw new ApiError(400, 'This course does not award a certificate');
  }

  return Certificate.create({
    certificateNumber: await certificateNumber(),
    userId: application.userId,
    applicationId: application._id,
    recipientName: application.fullName,
    title:
      course?.certificateTitle ||
      course?.title ||
      `${application.trackTitle} Internship`,
    kind: application.courseId ? 'course' : 'internship',
    courseId: application.courseId,
    trackId: application.trackId,
  });
};

/** Public verification - anyone holding the number can check it is genuine. */
export const verifyCertificate = async (number) => {
  const certificate = await Certificate.findOne({
    certificateNumber: clean(number).toUpperCase(),
  })
    .select('certificateNumber recipientName title kind issuedAt issuedBy revoked')
    .lean();

  if (!certificate) throw new ApiError(404, 'No certificate with that number');
  return certificate;
};

/* -------------------------------------------------------- admin writing */

export const saveInternshipTrack = async ({ id, payload }) => {
  const doc = id ? await InternshipTrack.findById(id) : new InternshipTrack();
  if (!doc) throw new ApiError(404, 'Track not found');

  Object.assign(doc, {
    title: clean(payload.title) || doc.title,
    summary: clean(payload.summary),
    description: clean(payload.description),
    image: clean(payload.image),
    durationLabel: clean(payload.durationLabel),
    minMonths: Math.max(0, Number(payload.minMonths) || 0),
    maxMonths: Math.max(0, Number(payload.maxMonths) || 0),
    skills: Array.isArray(payload.skills)
      ? payload.skills
      : clean(payload.skills).split(',').map((s) => s.trim()).filter(Boolean),
    seats: Math.max(0, Number(payload.seats) || 0),
    stipend: Math.max(0, Number(payload.stipend) || 0),
    sortOrder: Number(payload.sortOrder) || 0,
    active: payload.active === undefined ? doc.active : Boolean(payload.active),
  });

  if (!doc.title) throw new ApiError(400, 'A title is required');
  if (!doc.slug) doc.slug = await uniqueSlug(InternshipTrack, doc.title);

  await doc.save();
  return doc.toObject();
};

export const saveCourse = async ({ id, payload }) => {
  const doc = id ? await Course.findById(id) : new Course();
  if (!doc) throw new ApiError(404, 'Course not found');

  Object.assign(doc, {
    title: clean(payload.title) || doc.title,
    summary: clean(payload.summary),
    image: clean(payload.image),
    mode: ['offline', 'online', 'hybrid'].includes(payload.mode) ? payload.mode : doc.mode,
    venue: clean(payload.venue),
    city: clean(payload.city),
    startDate: clean(payload.startDate),
    endDate: clean(payload.endDate),
    seats: Math.max(0, Number(payload.seats) || 0),
    lessons: Math.max(0, Number(payload.lessons) || 0),
    durationLabel: clean(payload.durationLabel),
    syllabus: Array.isArray(payload.syllabus)
      ? payload.syllabus
      : clean(payload.syllabus).split('\n').map((s) => s.trim()).filter(Boolean),
    price: Math.max(0, Number(payload.price) || 0),
    oldPrice: Math.max(0, Number(payload.oldPrice) || 0),
    rating: Math.min(5, Math.max(0, Number(payload.rating) || 0)),
    ratingCount: Math.max(0, Number(payload.ratingCount) || 0),
    awardsCertificate: payload.awardsCertificate === undefined
      ? doc.awardsCertificate
      : Boolean(payload.awardsCertificate),
    certificateTitle: clean(payload.certificateTitle),
    badge: clean(payload.badge),
    sortOrder: Number(payload.sortOrder) || 0,
    active: payload.active === undefined ? doc.active : Boolean(payload.active),
  });

  if (!doc.title) throw new ApiError(400, 'A title is required');
  if (!doc.slug) doc.slug = await uniqueSlug(Course, doc.title);

  await doc.save();
  return doc.toObject();
};
