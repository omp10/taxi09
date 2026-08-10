/**
 * Seeds the internship tracks and the offline courses.
 *
 * These are ordinary admin-editable rows; the seed only saves the admin from a
 * blank screen. Re-running updates by slug instead of duplicating.
 *
 *   node scripts/seedInternship.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TRACKS = [
  {
    slug: 'tourism-travel-operations',
    title: 'Tourism & Travel Operations',
    summary: 'Learn trip planning, bookings, itineraries and travel operations.',
    image: '/taxi09_internship_track_tourism_ops.png',
    durationLabel: '2 – 3 Months', minMonths: 2, maxMonths: 3, seats: 25, stipend: 8000,
    skills: ['Itinerary planning', 'Booking systems', 'Customer handling'],
    sortOrder: 1,
  },
  {
    slug: 'tour-guide-experience-host',
    title: 'Tour Guide & Experience Host',
    summary: 'Train to become a professional tour guide and experience host.',
    image: '/taxi09_internship_track_tour_guide.png',
    durationLabel: '1 – 3 Months', minMonths: 1, maxMonths: 3, seats: 20, stipend: 7000,
    skills: ['Public speaking', 'Local history', 'Group management'],
    sortOrder: 2,
  },
  {
    slug: 'content-creation-travel-marketing',
    title: 'Content Creation & Travel Marketing',
    summary: 'Create travel stories, reels, blogs and promote destinations.',
    image: '/taxi09_internship_track_content_marketing.png',
    durationLabel: '2 – 3 Months', minMonths: 2, maxMonths: 3, seats: 15, stipend: 9000,
    skills: ['Copywriting', 'Reels & short video', 'Photography'],
    sortOrder: 3,
  },
  {
    slug: 'digital-marketing-growth',
    title: 'Digital Marketing & Growth',
    summary: 'Learn SEO, ads, social media and growth strategies.',
    image: '/taxi09_internship_track_digital_growth.png',
    durationLabel: '2 – 3 Months', minMonths: 2, maxMonths: 3, seats: 15, stipend: 10000,
    skills: ['SEO', 'Performance ads', 'Analytics'],
    sortOrder: 4,
  },
  {
    slug: 'customer-experience-support',
    title: 'Customer Experience & Support',
    summary: 'Enhance communication skills and handle traveller support.',
    image: '/taxi09_internship_track_customer_exp.png',
    durationLabel: '1 – 2 Months', minMonths: 1, maxMonths: 2, seats: 30, stipend: 6000,
    skills: ['Communication', 'Ticketing tools', 'Conflict handling'],
    sortOrder: 5,
  },
];

const COURSES = [
  {
    slug: 'travel-tourism-fundamentals',
    title: 'Travel & Tourism Fundamentals',
    summary: 'The groundwork of the travel industry, taught in the classroom.',
    mode: 'offline', venue: 'Taxi09 Learning Centre, Vijay Nagar', city: 'Indore',
    lessons: 20, durationLabel: '4 weeks', price: 1499, oldPrice: 2999,
    rating: 4.8, ratingCount: 1200, badge: 'Bestseller',
    awardsCertificate: true, certificateTitle: 'Certified Travel & Tourism Professional',
    syllabus: ['Industry overview', 'Geography for travel', 'Booking systems', 'Fares and ticketing'],
    sortOrder: 1,
  },
  {
    slug: 'tour-guiding-professional-course',
    title: 'Tour Guiding Professional Course',
    summary: 'Become a licensed-ready tour guide with on-field practice.',
    mode: 'offline', venue: 'Taxi09 Learning Centre, Vijay Nagar', city: 'Indore',
    lessons: 18, durationLabel: '5 weeks', price: 1999, oldPrice: 3499,
    rating: 4.7, ratingCount: 960,
    awardsCertificate: true, certificateTitle: 'Certified Tour Guide',
    syllabus: ['Storytelling', 'Heritage and history', 'Group safety', 'Field practice'],
    sortOrder: 2,
  },
  {
    slug: 'destination-management',
    title: 'Destination Management',
    summary: 'Plan and run destination operations end to end.',
    mode: 'offline', venue: 'Taxi09 Learning Centre, Vijay Nagar', city: 'Indore',
    lessons: 16, durationLabel: '4 weeks', price: 1699, oldPrice: 2999,
    rating: 4.6, ratingCount: 860,
    awardsCertificate: true, certificateTitle: 'Certified Destination Manager',
    syllabus: ['Supplier management', 'Costing', 'Operations', 'Quality control'],
    sortOrder: 3,
  },
  {
    slug: 'hospitality-customer-service-excellence',
    title: 'Hospitality & Customer Service Excellence',
    summary: 'Service standards that keep travellers coming back.',
    mode: 'offline', venue: 'Taxi09 Learning Centre, Vijay Nagar', city: 'Indore',
    lessons: 16, durationLabel: '3 weeks', price: 1799, oldPrice: 2999,
    rating: 4.7, ratingCount: 700,
    awardsCertificate: true, certificateTitle: 'Certified Hospitality Professional',
    syllabus: ['Service design', 'Guest handling', 'Complaint recovery'],
    sortOrder: 4,
  },
  {
    slug: 'travel-marketing-branding',
    title: 'Travel Marketing & Branding',
    summary: 'Market destinations and build a travel brand that travels.',
    mode: 'hybrid', venue: 'Taxi09 Learning Centre, Vijay Nagar', city: 'Indore',
    lessons: 14, durationLabel: '3 weeks', price: 1499, oldPrice: 2999,
    rating: 4.6, ratingCount: 710,
    awardsCertificate: true, certificateTitle: 'Certified Travel Marketer',
    syllabus: ['Brand basics', 'Content strategy', 'Paid campaigns'],
    sortOrder: 5,
  },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { InternshipTrack, Course } = await import('../src/modules/taxi/admin/content/models/Internship.js');

  for (const track of TRACKS) {
    const existing = await InternshipTrack.findOne({ slug: track.slug });
    if (existing) { Object.assign(existing, track); await existing.save(); }
    else await InternshipTrack.create(track);
    console.log(`track   ${track.title}`);
  }

  for (const course of COURSES) {
    const existing = await Course.findOne({ slug: course.slug });
    if (existing) { Object.assign(existing, course); await existing.save(); }
    else await Course.create(course);
    console.log(`course  ${course.title}  ₹${course.price}  ${course.mode}`);
  }

  console.log(`\n${await InternshipTrack.countDocuments({ active: true })} tracks, ${await Course.countDocuments({ active: true })} courses`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
