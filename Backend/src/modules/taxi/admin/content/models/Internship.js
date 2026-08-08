import mongoose from 'mongoose';

/**
 * The internship programme: tracks people apply to, courses they can take, and
 * the certificates those courses award.
 *
 * All three live in one file because they are one feature and are always
 * changed together; they remain separate collections.
 */

/* ------------------------------------------------------------------ track */

const internshipTrackSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },

    durationLabel: { type: String, default: '', trim: true },
    minMonths: { type: Number, default: 0, min: 0 },
    maxMonths: { type: Number, default: 0, min: 0 },

    skills: { type: [String], default: [] },
    seats: { type: Number, default: 0, min: 0 },
    stipend: { type: Number, default: 0, min: 0 },

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

/* ----------------------------------------------------------------- course */

const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },

    // Offline courses are taught somewhere, on dates, with a seat limit.
    mode: { type: String, enum: ['offline', 'online', 'hybrid'], default: 'offline', index: true },
    venue: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    startDate: { type: String, default: '', trim: true },
    endDate: { type: String, default: '', trim: true },
    seats: { type: Number, default: 0, min: 0 },

    lessons: { type: Number, default: 0, min: 0 },
    durationLabel: { type: String, default: '', trim: true },
    syllabus: { type: [String], default: [] },

    price: { type: Number, default: 0, min: 0 },
    oldPrice: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },

    // Whether finishing this course awards a certificate, and what it is called.
    awardsCertificate: { type: Boolean, default: true },
    certificateTitle: { type: String, default: '', trim: true },

    badge: { type: String, default: '', trim: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------ application */

const internshipApplicationSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },

    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiInternshipTrack', default: null },
    trackTitle: { type: String, default: '', trim: true },

    // Applying to a course instead of a track is allowed; one of the two is set.
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiCourse', default: null },
    courseTitle: { type: String, default: '', trim: true },

    fullName: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    college: { type: String, default: '', trim: true },
    qualification: { type: String, default: '', trim: true },
    resumeUrl: { type: String, default: '', trim: true },
    message: { type: String, default: '', trim: true },

    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview', 'offered', 'enrolled', 'completed', 'rejected'],
      default: 'applied',
      index: true,
    },
    reviewNote: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------ certificate */

const certificateSchema = new mongoose.Schema(
  {
    // Printed on the certificate and used to verify it publicly.
    certificateNumber: { type: String, required: true, unique: true, index: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiInternshipApplication', default: null },

    recipientName: { type: String, default: '', trim: true },
    title: { type: String, required: true, trim: true },
    kind: { type: String, enum: ['course', 'internship'], default: 'course' },

    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiCourse', default: null },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiInternshipTrack', default: null },

    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: String, default: 'Taxi09', trim: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const InternshipTrack =
  mongoose.models.TaxiInternshipTrack || mongoose.model('TaxiInternshipTrack', internshipTrackSchema);

export const Course = mongoose.models.TaxiCourse || mongoose.model('TaxiCourse', courseSchema);

export const InternshipApplication =
  mongoose.models.TaxiInternshipApplication ||
  mongoose.model('TaxiInternshipApplication', internshipApplicationSchema);

export const Certificate =
  mongoose.models.TaxiCertificate || mongoose.model('TaxiCertificate', certificateSchema);
