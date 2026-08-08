/**
 * Seed the CMS collections from what used to be hardcoded in the frontend.
 * Idempotent: matches on slug/key, so re-running updates rather than duplicating.
 *
 * Usage: node scripts/seedContent.js
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { TravelPackage } from '../src/modules/taxi/admin/content/models/TravelPackage.js';
import { Hotel } from '../src/modules/taxi/admin/content/models/Hotel.js';
import { ContentBlock } from '../src/modules/taxi/admin/content/models/ContentBlock.js';
import { HireDriver } from '../src/modules/taxi/admin/content/models/HireDriver.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB_NAME || 'appzeto_taxi';
if (!MONGO_URI) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

/* ---------------- Domestic tour packages ---------------- */

const DOMESTIC = [
  {
    slug: 'himachal-delight', title: 'Himachal Delight', state: 'Himachal Pradesh', category: 'Adventure',
    badge: 'Bestseller', badgeTone: 'bg-[var(--primary)] text-[var(--text)]',
    stops: ['Shimla', 'Manali', 'Solang Valley', 'Dharamshala'],
    includes: ['Meals', 'Stay', 'Sightseeing'],
    image: '/taxi09_pkg_himachal.jpg',
    gallery: ['/taxi09_pkg_himachal.jpg', '/taxi09_tours_hero_mountain.png', '/taxi09_pkg_kashmir.jpg'],
    durationDays: 5, durationLabel: '5 Days / 4 Nights',
    rating: 4.6, reviews: '1.2K', oldPrice: 16999, price: 11999, sortOrder: 1,
  },
  {
    slug: 'goa-beach-escape', title: 'Goa Beach Escape', state: 'Goa', category: 'Beach',
    badge: 'Popular', badgeTone: 'bg-[var(--primary)] text-[var(--text)]',
    stops: ['North Goa', 'South Goa', 'Cruise', 'Water Sports'],
    includes: ['Meals', 'Stay', 'Sightseeing'],
    image: '/taxi09_pkg_goa.jpg',
    gallery: ['/taxi09_pkg_goa.jpg', '/taxi09_tours_hero_beach.png', '/taxi09_hotel_hero_resort_v2.png'],
    durationDays: 4, durationLabel: '4 Days / 3 Nights',
    rating: 4.4, reviews: '890', oldPrice: 13499, price: 8999, sortOrder: 2,
  },
  {
    slug: 'kashmir-paradise', title: 'Kashmir Paradise', state: 'Kashmir', category: 'Honeymoon',
    badge: 'New', badgeTone: 'bg-emerald-100 text-emerald-700',
    stops: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Dal Lake'],
    includes: ['Meals', 'Stay', 'Sightseeing'],
    image: '/taxi09_pkg_kashmir.jpg',
    gallery: ['/taxi09_pkg_kashmir.jpg', '/taxi09_tours_hero_mountain.png', '/taxi09_pkg_himachal.jpg'],
    durationDays: 6, durationLabel: '6 Days / 5 Nights',
    rating: 4.8, reviews: '756', oldPrice: 22999, price: 16999, sortOrder: 3,
  },
  {
    slug: 'rishikesh-yoga-retreat', title: 'Rishikesh Yoga Retreat', state: 'Uttarakhand', category: 'Pilgrimage',
    badge: 'Spiritual', badgeTone: 'bg-violet-100 text-violet-700',
    stops: ['Rishikesh', 'Haridwar', 'Yoga Sessions', 'Ganga Aarti'],
    includes: ['Meals', 'Stay', 'Activities'],
    image: '/taxi09_pkg_rishikesh.jpg',
    gallery: ['/taxi09_pkg_rishikesh.jpg', '/taxi09_tours_hero_spiritual.png', '/taxi09_pkg_himachal.jpg'],
    durationDays: 3, durationLabel: '3 Days / 2 Nights',
    rating: 4.5, reviews: '612', oldPrice: 9999, price: 6499, sortOrder: 4,
  },
  {
    slug: 'royal-rajasthan', title: 'Royal Rajasthan', state: 'Rajasthan', category: 'Luxury',
    badge: 'Luxury', badgeTone: 'bg-amber-100 text-amber-700',
    stops: ['Udaipur', 'Jodhpur', 'Jaisalmer', 'Desert Camp'],
    includes: ['Meals', 'Stay', 'Sightseeing'],
    image: '/taxi09_pkg_rajasthan.jpg',
    gallery: ['/taxi09_pkg_rajasthan.jpg', '/taxi09_hotel_destination_udaipur.png', '/taxi09_hotel_room_3.jpg'],
    durationDays: 7, durationLabel: '7 Days / 6 Nights',
    rating: 4.7, reviews: '1.1K', oldPrice: 34999, price: 26999, sortOrder: 5,
  },
].map((item) => ({ ...item, scope: 'domestic' }));

/* ---------------- International packages ---------------- */

const INTERNATIONAL = [
  {
    slug: 'thailand-island-hopper', title: 'Thailand Island Hopper', country: 'Thailand', category: 'beach',
    badge: 'BESTSELLER', badgeTone: 'bg-violet-600 text-white',
    stops: ['Bangkok', 'Pattaya', 'Phuket', 'Krabi'],
    highlights: ['All Meals', 'Ocean View'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    image: '/taxi09_intl_thailand.jpg',
    gallery: ['/taxi09_intl_thailand.jpg', '/taxi09_intl_bali.jpg', '/taxi09_intl_maldives.jpg'],
    photos: 8, durationDays: 7, durationLabel: '7 Days / 6 Nights', departureDate: '18 Jun 2026',
    rating: 4.7, reviews: '892', oldPrice: 159999, price: 124999, sortOrder: 1,
  },
  {
    slug: 'bali-paradise-escape', title: 'Bali Paradise Escape', country: 'Indonesia', category: 'honeymoon',
    badge: 'POPULAR CHOICE', badgeTone: 'bg-sky-600 text-white',
    stops: ['Ubud', 'Seminyak', 'Nusa Penida', 'Kuta'],
    highlights: ['All Meals', 'Private Villa'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    image: '/taxi09_intl_bali.jpg',
    gallery: ['/taxi09_intl_bali.jpg', '/taxi09_intl_thailand.jpg', '/taxi09_intl_maldives.jpg'],
    photos: 6, durationDays: 5, durationLabel: '5 Days / 4 Nights', departureDate: '12 May 2026',
    rating: 4.5, reviews: '642', oldPrice: 119999, price: 89999, sortOrder: 2,
  },
  {
    slug: 'dubai-city-desert', title: 'Dubai City & Desert', country: 'UAE', category: 'city',
    badge: 'TRENDING', badgeTone: 'bg-amber-500 text-slate-950',
    stops: ['Burj Khalifa', 'Desert Safari', 'Marina', 'Palm Jumeirah'],
    highlights: ['Breakfast', 'City View'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    image: '/taxi09_intl_dubai.jpg',
    gallery: ['/taxi09_intl_dubai.jpg', '/taxi09_intl_singapore.jpg', '/taxi09_intl_thailand.jpg'],
    photos: 10, durationDays: 4, durationLabel: '4 Days / 3 Nights', departureDate: '02 Jun 2026',
    rating: 4.6, reviews: '1.4K', oldPrice: 94999, price: 69999, sortOrder: 3,
  },
  {
    slug: 'maldives-overwater-retreat', title: 'Maldives Overwater Retreat', country: 'Maldives', category: 'luxury',
    badge: 'LUXURY', badgeTone: 'bg-slate-900 text-[var(--primary)]',
    stops: ['Male', 'Overwater Villa', 'Reef Snorkelling', 'Sunset Cruise'],
    highlights: ['All Meals', 'Overwater Villa'],
    perks: ['Return Flights', 'Airport Transfers', 'All Meals', 'Travel Insurance'],
    image: '/taxi09_intl_maldives.jpg',
    gallery: ['/taxi09_intl_maldives.jpg', '/taxi09_intl_bali.jpg', '/taxi09_intl_thailand.jpg'],
    photos: 12, durationDays: 5, durationLabel: '5 Days / 4 Nights', departureDate: '25 Jun 2026',
    rating: 4.9, reviews: '523', oldPrice: 259999, price: 199999, sortOrder: 4,
  },
  {
    slug: 'singapore-malaysia', title: 'Singapore & Malaysia', country: 'Singapore', category: 'family',
    badge: 'FAMILY PICK', badgeTone: 'bg-emerald-600 text-white',
    stops: ['Sentosa', 'Universal Studios', 'Genting', 'Kuala Lumpur'],
    highlights: ['Breakfast', 'Theme Parks'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    image: '/taxi09_intl_singapore.jpg',
    gallery: ['/taxi09_intl_singapore.jpg', '/taxi09_intl_dubai.jpg', '/taxi09_intl_vietnam.jpg'],
    photos: 9, durationDays: 6, durationLabel: '6 Days / 5 Nights', departureDate: '08 Jul 2026',
    rating: 4.4, reviews: '1.1K', oldPrice: 139999, price: 109999, sortOrder: 5,
  },
  {
    slug: 'vietnam-explorer', title: 'Vietnam Explorer', country: 'Vietnam', category: 'beach',
    badge: 'NEW', badgeTone: 'bg-rose-500 text-white',
    stops: ['Hanoi', 'Ha Long Bay', 'Da Nang', 'Ho Chi Minh'],
    highlights: ['All Meals', 'Bay Cruise'],
    perks: ['Visa Assistance', 'Return Flights', 'Airport Transfers', 'Guided Tours'],
    image: '/taxi09_intl_vietnam.jpg',
    gallery: ['/taxi09_intl_vietnam.jpg', '/taxi09_intl_thailand.jpg', '/taxi09_intl_singapore.jpg'],
    photos: 7, durationDays: 6, durationLabel: '6 Days / 5 Nights', departureDate: '20 Jun 2026',
    rating: 4.5, reviews: '388', oldPrice: 104999, price: 79999, sortOrder: 6,
  },
].map((item) => ({ ...item, scope: 'international' }));

/* ---------------- Hotels ---------------- */

const ROOMS = [
  { key: 'deluxe', name: 'Deluxe Room', category: 'Deluxe', sqft: 300, adults: 2, children: 1, bed: '1 King Bed', priceMultiplier: 1, perks: ['Breakfast Included', 'Free Cancellation'], image: '/taxi09_hotel_room_1.jpg', roomsLeft: 3 },
  { key: 'premium-deluxe', name: 'Premium Deluxe Room', category: 'Premium', sqft: 380, adults: 2, children: 1, bed: '1 King Bed', priceMultiplier: 1.21, perks: ['Breakfast Included', 'Free Cancellation'], image: '/taxi09_hotel_room_2.jpg', roomsLeft: 5 },
  { key: 'executive-suite', name: 'Executive Suite', category: 'Suite', sqft: 520, adults: 2, children: 2, bed: '1 King Bed', priceMultiplier: 1.66, perks: ['Breakfast Included', 'Free Cancellation'], image: '/taxi09_hotel_room_3.jpg', roomsLeft: 2 },
  { key: 'family-suite', name: 'Family Suite', category: 'Family', sqft: 650, adults: 4, children: 2, bed: '2 King Beds', priceMultiplier: 2.22, perks: ['Breakfast Included', 'Free Cancellation'], image: '/taxi09_hotel_room_4.jpg', roomsLeft: 1 },
  { key: 'presidential', name: 'Presidential Suite', category: 'Premium', sqft: 900, adults: 4, children: 2, bed: '2 King Beds', priceMultiplier: 3.1, perks: ['Breakfast Included', 'Airport Pickup', 'Free Cancellation'], image: '/taxi09_hotel_hero.png', roomsLeft: 1 },
];

const FACILITIES = ['Free Wi-Fi', 'Swimming Pool', 'Spa', 'Gym', 'Restaurant', 'Free Breakfast', 'Parking'];

const HOTELS = [
  { slug: 'the-grand-orion', propertyType: 'Hotel', starRating: 5, name: 'The Grand Orion', city: 'Delhi', area: 'Connaught Place, New Delhi', distance: '2.3 km from City Centre', image: '/taxi09_hotel_hero.png', badge: 'Popular', rating: 4.5, reviews: '2.5K', oldPrice: 3499, price: 2649, amenities: ['Free Wi-Fi', 'Breakfast', 'Free Cancellation', 'Pay at Hotel'] },
  { slug: 'hotel-sapphire-inn', propertyType: 'Hotel', starRating: 4, name: 'Hotel Sapphire Inn', city: 'Hyderabad', area: 'Banjara Hills, Hyderabad', distance: '1.8 km from City Centre', image: '/taxi09_hotel_hero_city_v2.png', badge: 'Best Value', rating: 4.2, reviews: '1.3K', oldPrice: 3299, price: 2739, amenities: ['Free Wi-Fi', 'Pool', 'Parking', 'Pay at Hotel'] },
  { slug: 'palm-vista-resort', propertyType: 'Resort', starRating: 5, name: 'Palm Vista Resort', city: 'Goa', area: 'Candolim Beach, Goa', distance: '900 m from Beach', image: '/taxi09_hotel_hero_resort_v2.png', badge: 'Beach Stay', rating: 4.7, reviews: '3.1K', oldPrice: 5199, price: 3899, amenities: ['Beachfront', 'Pool', 'Breakfast', 'Pay at Hotel'] },
  { slug: 'heritage-lake-palace', propertyType: 'Resort', starRating: 5, name: 'Heritage Lake Palace', city: 'Udaipur', area: 'Pichola Road, Udaipur', distance: '1.2 km from Lake Pichola', image: '/taxi09_hotel_destination_udaipur.png', badge: 'Premium', rating: 4.6, reviews: '1.9K', oldPrice: 4599, price: 3299, amenities: ['Lake View', 'Spa', 'Breakfast', 'Pay at Hotel'] },
  { slug: 'marine-bay-suites', propertyType: 'Apartment', starRating: 4, name: 'Marine Bay Suites', city: 'Mumbai', area: 'Colaba, Mumbai', distance: '2.1 km from Gateway', image: '/taxi09_hotel_destination_mumbai.png', badge: 'City View', rating: 4.4, reviews: '2.2K', oldPrice: 4299, price: 3199, amenities: ['Sea View', 'Gym', 'Free Wi-Fi', 'Pay at Hotel'] },
  { slug: 'the-imperial-courtyard', propertyType: 'Hotel', starRating: 4, name: 'The Imperial Courtyard', city: 'Delhi', area: 'Karol Bagh, Delhi', distance: '3.4 km from Connaught Place', image: '/taxi09_hotel_destination_delhi.png', badge: 'Top Rated', rating: 4.5, reviews: '1.7K', oldPrice: 3799, price: 2849, amenities: ['Free Wi-Fi', 'Breakfast', 'Parking', 'Pay at Hotel'] },
  { slug: 'saffron-business-suites', propertyType: 'Apartment', starRating: 4, name: 'Saffron Business Suites', city: 'Delhi', area: 'Aerocity, New Delhi', distance: '1.1 km from Airport', image: '/taxi09_hotel_room_1.jpg', badge: 'Business', rating: 4.3, reviews: '980', oldPrice: 4199, price: 3149, amenities: ['Airport Shuttle', 'Free Wi-Fi', 'Gym', 'Pay at Hotel'] },
  { slug: 'coral-cove-beach-villas', propertyType: 'Villa', starRating: 5, name: 'Coral Cove Beach Villas', city: 'Goa', area: 'Anjuna, North Goa', distance: '400 m from Beach', image: '/taxi09_hotel_room_2.jpg', badge: 'Villa', rating: 4.8, reviews: '1.4K', oldPrice: 6499, price: 4799, amenities: ['Private Pool', 'Beachfront', 'Breakfast', 'Pay at Hotel'] },
  { slug: 'pink-city-haveli', propertyType: 'Guest House', starRating: 3, name: 'Pink City Haveli', city: 'Jaipur', area: 'Hawa Mahal Road, Jaipur', distance: '600 m from Hawa Mahal', image: '/taxi09_hotel_room_3.jpg', badge: 'Heritage', rating: 4.4, reviews: '2.0K', oldPrice: 3599, price: 2499, amenities: ['Heritage', 'Rooftop', 'Breakfast', 'Pay at Hotel'] },
  { slug: 'harbour-view-residency', propertyType: 'Apartment', starRating: 3, name: 'Harbour View Residency', city: 'Mumbai', area: 'Bandra West, Mumbai', distance: '3.0 km from Bandstand', image: '/taxi09_hotel_room_4.jpg', badge: 'New', rating: 4.1, reviews: '540', oldPrice: 3899, price: 2599, amenities: ['Free Wi-Fi', 'Parking', 'Free Cancellation', 'Pay at Hotel'] },
  { slug: 'deccan-grand-hyderabad', propertyType: 'Hotel', starRating: 4, name: 'Deccan Grand Hyderabad', city: 'Hyderabad', area: 'Gachibowli, Hyderabad', distance: '2.6 km from HITEC City', image: '/taxi09_hotel_hero_city_v2.png', badge: 'Business', rating: 4.2, reviews: '1.1K', oldPrice: 3299, price: 2299, amenities: ['Free Wi-Fi', 'Gym', 'Breakfast', 'Pay at Hotel'] },
  { slug: 'aravalli-hill-retreat', propertyType: 'Resort', starRating: 4, name: 'Aravalli Hill Retreat', city: 'Udaipur', area: 'Fateh Sagar, Udaipur', distance: '2.0 km from Fateh Sagar', image: '/taxi09_hotel_hero_resort_v2.png', badge: 'Retreat', rating: 4.6, reviews: '860', oldPrice: 5299, price: 3699, amenities: ['Hill View', 'Spa', 'Pool', 'Pay at Hotel'] },
].map((hotel, index) => ({
  ...hotel,
  facilities: FACILITIES,
  gallery: ['/taxi09_hotel_room_1.jpg', '/taxi09_hotel_room_2.jpg', '/taxi09_hotel_room_3.jpg', '/taxi09_hotel_room_4.jpg', '/taxi09_hotel_hero.png'],
  rooms: ROOMS,
  sortOrder: index + 1,
}));

/* ---------------- Content blocks ---------------- */

const BLOCKS = [
  {
    key: 'spiritual.destinations', label: 'Spiritual trip destinations',
    items: [
      { id: 'ujjain', name: 'Ujjain', subtitle: 'Mahakaleshwar Jyotirlinga', dist: '55 km', fare: '₹800–₹1,200', emoji: '\u{1F6D5}', accent: 'bg-[linear-gradient(135deg,#FDF4FF_0%,#F3E8FF_100%)]' },
      { id: 'omkareshwar', name: 'Omkareshwar', subtitle: 'Jyotirlinga on Narmada', dist: '77 km', fare: '₹1,000–₹1,500', emoji: '\u{1F64F}', accent: 'bg-[linear-gradient(135deg,#FFF7ED_0%,#FFE5C2_100%)]' },
      { id: 'maheshwar', name: 'Maheshwar', subtitle: 'Ahilya Fort & Ghats', dist: '91 km', fare: '₹1,200–₹1,800', emoji: '⛵', accent: 'bg-[linear-gradient(135deg,#EFF6FF_0%,#DBEAFE_100%)]' },
      { id: 'orchha', name: 'Orchha', subtitle: 'Ram Raja Temple', dist: '320 km', fare: '₹3,500–₹5,000', emoji: '\u{1F3EF}', accent: 'bg-[linear-gradient(135deg,#F0FDF4_0%,#BBF7D0_100%)]' },
      { id: 'pitambara', name: 'Pitambara Peeth', subtitle: 'Datia, Madhya Pradesh', dist: '210 km', fare: '₹2,500–₹3,500', emoji: '\u{1F338}', accent: 'bg-[linear-gradient(135deg,#FDF4FF_0%,#FBCFE8_100%)]' },
      { id: 'amarkantak', name: 'Amarkantak', subtitle: 'Source of Narmada River', dist: '380 km', fare: '₹4,000–₹5,500', emoji: '\u{1F3D4}️', accent: 'bg-[linear-gradient(135deg,#F0FDF4_0%,#D1FAE5_100%)]' },
    ],
  },
  {
    key: 'tours.hero', label: 'Tours hero',
    items: [{ eyebrow: 'Discover', title: 'Amazing Places with Perfect Plans', subtitle: 'Curated tour packages for every kind of traveler.', image: '/taxi09_tours_hero_mountain.png', offerTitle: 'Up to 30% OFF', offerSubtitle: 'on selected packages' }],
  },
  {
    key: 'tours.categories', label: 'Tours category chips',
    items: [
      { label: 'All Packages', icon: 'Grid2X2', tone: 'text-slate-700' },
      { label: 'Honeymoon', icon: 'Heart', tone: 'text-rose-500' },
      { label: 'Adventure', icon: 'Mountain', tone: 'text-emerald-600' },
      { label: 'Beach', icon: 'Palmtree', tone: 'text-sky-500' },
      { label: 'Family', icon: 'Users', tone: 'text-violet-500' },
      { label: 'Pilgrimage', icon: 'Landmark', tone: 'text-orange-500' },
      { label: 'Luxury', icon: 'Crown', tone: 'text-amber-500' },
    ],
  },
  {
    key: 'tours.trust', label: 'Tours trust badges',
    items: [
      { icon: 'ShieldCheck', title: 'Secure Booking', sub: '100% safe & secure' },
      { icon: 'BadgePercent', title: 'Best Price Guarantee', sub: 'Get the best deals' },
      { icon: 'CalendarCheck', title: 'Flexible Cancellation', sub: 'Easy refunds' },
      { icon: 'Headset', title: '24/7 Support', sub: "We're here to help" },
    ],
  },
  {
    key: 'international.filters', label: 'International filter chips',
    items: [
      { id: 'all', label: 'All Trips', icon: 'Globe2' },
      { id: 'beach', label: 'Beach', icon: 'Waves' },
      { id: 'city', label: 'City', icon: 'Landmark' },
      { id: 'honeymoon', label: 'Honeymoon', icon: 'Heart' },
      { id: 'luxury', label: 'Luxury', icon: 'Crown' },
      { id: 'family', label: 'Family', icon: 'Users' },
    ],
  },
  {
    key: 'hotel.hero', label: 'Hotel hero slides',
    items: [
      { image: '/taxi09_hotel_hero.png', title: 'Find the perfect stay for your trip', subtitle: 'Comfortable stays. Best prices. Verified hotels.', offer: '40% OFF', code: 'FIRST40' },
      { image: '/taxi09_hotel_hero_city_v2.png', title: 'Premium city stays, taxi-fast deals', subtitle: 'Wake up near business hubs, cafes and landmarks.', offer: '25% OFF', code: 'CITY25' },
      { image: '/taxi09_hotel_hero_resort_v2.png', title: 'Resort breaks made easy', subtitle: 'Poolside escapes with verified rooms and instant booking.', offer: '30% OFF', code: 'RELAX30' },
    ],
  },
  {
    key: 'hotel.destinations', label: 'Hotel popular destinations',
    items: [
      { city: 'Goa', price: 899, image: '/taxi09_hotel_destination_goa.png' },
      { city: 'Delhi', price: 699, image: '/taxi09_hotel_destination_delhi.png' },
      { city: 'Mumbai', price: 799, image: '/taxi09_hotel_destination_mumbai.png' },
      { city: 'Udaipur', price: 899, image: '/taxi09_hotel_destination_udaipur.png' },
    ],
  },
  {
    key: 'hotel.addons', label: 'Hotel checkout add-ons',
    items: [
      { id: 'insurance', label: 'Travel Insurance', hint: 'Secure your journey', price: 49 },
      { id: 'meal_veg', label: 'Meal (Veg)', hint: 'Dinner on board', price: 99 },
    ],
  },
  {
    key: 'international.addons', label: 'International trip add-ons',
    items: [
      { id: 'visa', label: 'Visa processing', hint: 'per person', price: 2500 },
      { id: 'insurance', label: 'Travel insurance', hint: 'per person', price: 1200 },
    ],
  },
];

/* ---------------- Drivers for hire ---------------- */

const HIRE_DRIVERS = [
  { slug: 'rohit-sharma', name: 'Rohit Sharma', badge: 'Top Rated', rating: 4.9, trips: '3200+', experience: '6+ Years', languages: ['Hindi', 'English'], vehicleName: 'Toyota Innova Crysta', vehiclePlate: 'MP09 AB 1234', city: 'Indore', etaMinutes: 18, distanceKm: 6.2, photo: '/taxi09_driver_d3.jpg', monthlySalary: 22000, dailyRate: 1200, hourlyRate: 180, verified: true, sortOrder: 1 },
  { slug: 'aman-verma', name: 'Aman Verma', badge: 'Experienced', rating: 4.8, trips: '2800+', experience: '5+ Years', languages: ['Hindi', 'English'], vehicleName: 'Mahindra XUV700', vehiclePlate: 'MP09 CD 5678', city: 'Indore', etaMinutes: 22, distanceKm: 7.3, photo: '/taxi09_driver_d2.jpg', monthlySalary: 21000, dailyRate: 1150, hourlyRate: 170, verified: true, sortOrder: 2 },
  { slug: 'vikram-singh', name: 'Vikram Singh', badge: 'Very Reliable', rating: 4.7, trips: '4100+', experience: '7+ Years', languages: ['Hindi', 'English'], vehicleName: 'Toyota Fortuner', vehiclePlate: 'MP09 EF 9123', city: 'Indore', etaMinutes: 24, distanceKm: 8.1, photo: '/taxi09_driver_p3.jpg', monthlySalary: 24000, dailyRate: 1400, hourlyRate: 200, verified: true, sortOrder: 3 },
  { slug: 'sandeep-yadav', name: 'Sandeep Yadav', badge: 'Punctual', rating: 4.6, trips: '1900+', experience: '4+ Years', languages: ['Hindi'], vehicleName: 'Maruti Ertiga', vehiclePlate: 'MP09 GH 4477', city: 'Indore', etaMinutes: 15, distanceKm: 4.8, photo: '/taxi09_driver_d1.jpg', monthlySalary: 19000, dailyRate: 1000, hourlyRate: 150, verified: true, sortOrder: 4 },
  { slug: 'imran-khan', name: 'Imran Khan', badge: 'Highway Expert', rating: 4.8, trips: '3600+', experience: '8+ Years', languages: ['Hindi', 'English', 'Urdu'], vehicleName: 'Toyota Innova', vehiclePlate: 'MP09 JK 2255', city: 'Bhopal', etaMinutes: 27, distanceKm: 9.4, photo: '/taxi09_driver_p2.jpg', monthlySalary: 23000, dailyRate: 1300, hourlyRate: 190, verified: true, sortOrder: 5 },
].map((driver) => ({ ...driver, hireTypes: ['permanent', 'monthly', 'outstation'], available: true, active: true }));

const run = async () => {
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });

  let created = 0;
  let updated = 0;

  for (const item of [...DOMESTIC, ...INTERNATIONAL]) {
    const res = await TravelPackage.updateOne({ slug: item.slug }, { $set: item }, { upsert: true });
    res.upsertedCount ? (created += 1) : (updated += 1);
  }
  console.log(`travel packages: ${created} created, ${updated} updated`);

  created = 0;
  updated = 0;
  for (const hotel of HOTELS) {
    const res = await Hotel.updateOne({ slug: hotel.slug }, { $set: hotel }, { upsert: true });
    res.upsertedCount ? (created += 1) : (updated += 1);
  }
  console.log(`hotels: ${created} created, ${updated} updated`);

  created = 0;
  updated = 0;
  for (const block of BLOCKS) {
    const res = await ContentBlock.updateOne({ key: block.key }, { $set: block }, { upsert: true });
    res.upsertedCount ? (created += 1) : (updated += 1);
  }
  console.log(`content blocks: ${created} created, ${updated} updated`);

  created = 0;
  updated = 0;
  for (const driver of HIRE_DRIVERS) {
    const res = await HireDriver.updateOne({ slug: driver.slug }, { $set: driver }, { upsert: true });
    res.upsertedCount ? (created += 1) : (updated += 1);
  }
  console.log(`hire drivers: ${created} created, ${updated} updated`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
